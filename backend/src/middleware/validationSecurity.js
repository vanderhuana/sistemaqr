const { ValidationLog } = require('../models');
const { Op } = require('sequelize');

// **MIDDLEWARE DE SEGURIDAD PARA VALIDACIÓN QR**

// Prevenir ataques de fuerza bruta
const rateLimitValidation = async (req, res, next) => {
  try {
    const { qrCode } = req.body;
    const userId = req.user.id;
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    // Contar intentos del mismo usuario en los últimos 5 minutos
    const recentAttempts = await ValidationLog.count({
      where: {
        validatedBy: userId,
        validatedAt: {
          [Op.gte]: fiveMinutesAgo
        }
      }
    });
    
    // Límite: 30 intentos por usuario cada 5 minutos
    if (recentAttempts >= 30) {
      await ValidationLog.create({
        ticketId: null,
        eventId: req.body.eventId || null,
        validatedBy: userId,
        isValid: false,
        validationType: 'verification',
        validationResult: 'access_denied',
        qrCode: qrCode?.substring(0, 50) || 'rate_limited',
        errorDetails: 'Rate limit excedido',
        ipAddress: req.ip,
        validatedAt: now
      });
      
      return res.status(429).json({
        success: false,
        message: 'Demasiados intentos. Espera 5 minutos.',
        result: 'rate_limited',
        retryAfter: 300 // segundos
      });
    }
    
    // Contar intentos del mismo QR en los últimos 2 minutos
    if (qrCode) {
      const qrAttempts = await ValidationLog.count({
        where: {
          qrCode: qrCode,
          validatedAt: {
            [Op.gte]: new Date(now.getTime() - 2 * 60 * 1000)
          }
        }
      });
      
      // Límite: 5 intentos por QR cada 2 minutos
      if (qrAttempts >= 5) {
        await ValidationLog.create({
          ticketId: null,
          eventId: req.body.eventId || null,
          validatedBy: userId,
          isValid: false,
          validationType: 'verification',
          validationResult: 'access_denied',
          qrCode: qrCode.substring(0, 50),
          errorDetails: 'QR bloqueado temporalmente por múltiples intentos',
          ipAddress: req.ip,
          validatedAt: now
        });
        
        return res.status(429).json({
          success: false,
          message: 'Este QR está temporalmente bloqueado',
          result: 'qr_blocked',
          retryAfter: 120
        });
      }
    }
    
    next();
    
  } catch (error) {
    console.error('Error en rate limiting:', error);
    next(); // Continuar en caso de error en el middleware
  }
};

// Detectar patrones sospechosos
const detectSuspiciousActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Obtener intentos de la última hora
    const recentAttempts = await ValidationLog.findAll({
      where: {
        validatedBy: userId,
        validatedAt: {
          [Op.gte]: oneHourAgo
        }
      },
      attributes: ['validationResult', 'qrCode', 'validatedAt'],
      order: [['validatedAt', 'DESC']]
    });
    
    if (recentAttempts.length > 0) {
      const totalAttempts = recentAttempts.length;
      const failedAttempts = recentAttempts.filter(a => a.validationResult !== 'success').length;
      const failureRate = (failedAttempts / totalAttempts) * 100;
      
      // Si más del 80% de intentos fallan en la última hora, es sospechoso
      if (totalAttempts >= 10 && failureRate >= 80) {
        console.warn(`⚠️  Actividad sospechosa detectada - Usuario: ${userId}, Tasa de fallo: ${failureRate.toFixed(1)}%`);
        
        // Agregar header de advertencia
        res.set('X-Suspicious-Activity', 'high-failure-rate');
        
        // Log de seguridad
        await ValidationLog.create({
          ticketId: null,
          eventId: req.body.eventId || null,
          validatedBy: userId,
          isValid: false,
          validationType: 'verification',
          validationResult: 'access_denied',
          qrCode: 'suspicious_activity_detected',
          errorDetails: `Alta tasa de fallos: ${failureRate.toFixed(1)}% (${failedAttempts}/${totalAttempts})`,
          ipAddress: req.ip,
          validatedAt: now
        });
      }
      
      // Detectar patrones de QRs inválidos repetitivos
      const invalidQrs = recentAttempts
        .filter(a => a.validationResult === 'invalid_qr')
        .map(a => a.qrCode);
      
      const uniqueInvalidQrs = [...new Set(invalidQrs)];
      
      // Si hay más de 5 QRs inválidos diferentes en una hora
      if (uniqueInvalidQrs.length >= 5) {
        console.warn(`⚠️  Posible escaneo masivo de QRs inválidos - Usuario: ${userId}`);
        res.set('X-Suspicious-Activity', 'mass-invalid-scanning');
      }
    }
    
    next();
    
  } catch (error) {
    console.error('Error detectando actividad sospechosa:', error);
    next();
  }
};

// Validar geolocalización si está disponible
const validateLocation = async (req, res, next) => {
  try {
    const { location, geo } = req.body;
    
    // Si hay información de geolocalización, validarla
    if (geo && geo.lat && geo.lng) {
      const lat = parseFloat(geo.lat);
      const lng = parseFloat(geo.lng);
      
      // Validar coordenadas válidas
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Coordenadas de geolocalización inválidas',
          result: 'invalid_location'
        });
      }
      
      // Agregar información de ubicación formateada
      req.body.location = `${location || 'Entrada'} (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
      
      // TODO: Aquí se podría agregar validación de geofencing
      // para verificar que el usuario esté en la ubicación del evento
    }
    
    next();
    
  } catch (error) {
    console.error('Error validando ubicación:', error);
    next();
  }
};

// Middleware para prevenir validaciones duplicadas rápidas
const preventDuplicateValidation = async (req, res, next) => {
  try {
    const { qrCode } = req.body;
    const userId = req.user.id;
    
    if (qrCode) {
      // Buscar el ticket para verificar si tiene múltiples entradas
      const { Ticket } = require('../models');
      const ticket = await Ticket.findOne({
        where: { qrCode }
      });
      
      if (ticket && ticket.quantity > 1) {
        // Para tickets con múltiples entradas, verificar si aún hay entradas disponibles
        const successfulValidations = await ValidationLog.count({
          where: {
            ticketId: ticket.id,
            isValid: true,
            validationResult: 'success'
          }
        });
        
        const remainingEntries = ticket.quantity - successfulValidations;
        
        if (remainingEntries > 0) {
          // Aún hay entradas disponibles, permitir la validación
          next();
          return;
        }
      }
      
      // Para tickets de una sola entrada o sin entradas restantes, aplicar prevención de duplicados
      const recentValidation = await ValidationLog.findOne({
        where: {
          qrCode,
          validatedBy: userId,
          isValid: true,
          validatedAt: {
            [Op.gte]: new Date(Date.now() - 30 * 1000) // Últimos 30 segundos
          }
        },
        order: [['validatedAt', 'DESC']]
      });
      
      if (recentValidation) {
        return res.status(400).json({
          success: false,
          message: 'Ya validaste este QR hace poco',
          result: 'duplicate_validation',
          lastValidation: recentValidation.validatedAt
        });
      }
    }
    
    next();
    
  } catch (error) {
    console.error('Error previniendo duplicados:', error);
    next();
  }
};

// Logging de seguridad mejorado
const securityLogger = (req, res, next) => {
  const originalJson = res.json;
  const startTime = Date.now();
  
  res.json = function(data) {
    const duration = Date.now() - startTime;
    const isSuccess = data.success === true;
    
    // Log de seguridad para intentos fallidos
    if (!isSuccess && data.result) {
      console.log(`🔒 SECURITY LOG: ${req.method} ${req.path}`, {
        userId: req.user?.id,
        username: req.user?.username,
        result: data.result,
        duration,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
    }
    
    // Agregar headers de seguridad
    res.set({
      'X-Validation-Time': duration,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    });
    
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  rateLimitValidation,
  detectSuspiciousActivity,
  validateLocation,
  preventDuplicateValidation,
  securityLogger
};