const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const validationController = require('../controllers/validationController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const {
  rateLimitValidation,
  detectSuspiciousActivity,
  validateLocation,
  preventDuplicateValidation,
  securityLogger
} = require('../middleware/validationSecurity');

// **VALIDACIÓN QR DESDE CELULAR**

// POST /api/validation/scan-qr - Validar QR escaneado
router.post('/scan-qr',
  authenticateToken,
  requireRole(['control', 'admin']),
  securityLogger,
  rateLimitValidation,
  detectSuspiciousActivity,
  validateLocation,
  preventDuplicateValidation,
  [
    body('qrCode')
      .notEmpty()
      .withMessage('Código QR es requerido')
      .isLength({ min: 10, max: 500 })
      .withMessage('Código QR inválido'),
    
    body('eventId')
      .optional()
      .isUUID()
      .withMessage('ID de evento inválido'),
    
    body('location')
      .optional()
      .isString()
      .isLength({ max: 200 })
      .withMessage('Ubicación muy larga'),
    
    body('deviceInfo')
      .optional()
      .isObject()
      .withMessage('Información de dispositivo debe ser un objeto')
  ],
  validationController.validateQRCode
);

// POST /api/validation/validar-entrada - Validar entrada simple (solo token)
router.post('/validar-entrada',
  authenticateToken,
  requireRole(['control', 'admin']),
  [
    body('token')
      .notEmpty()
      .withMessage('Token es requerido')
      .isString()
      .withMessage('Token debe ser un string')
  ],
  validationController.validarEntradaSimple
);

// **CONSULTAS Y REPORTES**

// GET /api/validation/history - Historial de validaciones
router.get('/history',
  authenticateToken,
  requireRole(['control', 'admin']),
  validationController.getValidationHistory
);

// GET /api/validation/stats/:eventId - Estadísticas en tiempo real
router.get('/stats/:eventId',
  authenticateToken,
  requireRole(['control', 'admin']),
  validationController.getLiveStats
);

// GET /api/validation/ticket-info/:qrCode - Información del ticket sin validar
router.get('/ticket-info/:qrCode',
  authenticateToken,
  requireRole(['control', 'admin']),
  validationController.getTicketInfo
);

// **ENDPOINTS ESPECÍFICOS PARA MÓVIL**

// POST /api/validation/mobile/quick-scan - Validación rápida optimizada para móvil
router.post('/mobile/quick-scan',
  authenticateToken,
  requireRole(['control', 'admin']),
  securityLogger,
  rateLimitValidation,
  detectSuspiciousActivity,
  validateLocation,
  preventDuplicateValidation,
  [
    body('qr')
      .notEmpty()
      .withMessage('QR requerido'),
    
    body('eventId')
      .isUUID()
      .withMessage('Evento requerido'),
    
    body('geo')
      .optional()
      .isObject()
      .withMessage('Geolocalización inválida')
  ],
  async (req, res) => {
    try {
      // Mapear campos para compatibilidad
      req.body.qrCode = req.body.qr;
      req.body.location = req.body.geo ? 
        `Lat: ${req.body.geo.lat}, Lng: ${req.body.geo.lng}` : 
        'Ubicación no disponible';
      
      // Agregar información del dispositivo móvil
      req.body.deviceInfo = {
        userAgent: req.get('User-Agent'),
        platform: 'mobile',
        timestamp: new Date(),
        ...req.body.deviceInfo
      };
      
      // Llamar al controlador principal
      return validationController.validateQRCode(req, res);
      
    } catch (error) {
      console.error('Error en validación móvil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno',
        result: 'server_error'
      });
    }
  }
);

// GET /api/validation/mobile/event-info/:eventId - Información básica del evento
router.get('/mobile/event-info/:eventId',
  authenticateToken,
  requireRole(['control', 'admin']),
  async (req, res) => {
    try {
      const { Event, ValidationLog } = require('../models');
      const { eventId } = req.params;
      
      const event = await Event.findByPk(eventId, {
        attributes: ['id', 'name', 'location', 'startDate', 'endDate', 'maxCapacity', 'status']
      });
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento no encontrado'
        });
      }
      
      // Estadísticas básicas
      const validationsToday = await ValidationLog.count({
        where: {
          eventId,
          validatedAt: {
            [require('sequelize').Op.gte]: new Date().setHours(0, 0, 0, 0)
          }
        }
      });
      
      const successfulToday = await ValidationLog.count({
        where: {
          eventId,
          isValid: true,
          validatedAt: {
            [require('sequelize').Op.gte]: new Date().setHours(0, 0, 0, 0)
          }
        }
      });
      
      res.json({
        success: true,
        event: {
          id: event.id,
          name: event.name,
          location: event.location,
          startDate: event.startDate,
          endDate: event.endDate,
          status: event.status,
          isActive: new Date() >= event.startDate && new Date() <= event.endDate
        },
        stats: {
          validationsToday,
          successfulToday,
          successRate: validationsToday > 0 ? 
            ((successfulToday / validationsToday) * 100).toFixed(1) : 0
        }
      });
      
    } catch (error) {
      console.error('Error obteniendo info del evento:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno'
      });
    }
  }
);

// **ENDPOINTS DE DIAGNÓSTICO**

// GET /api/validation/health - Health check para la app móvil
router.get('/health',
  authenticateToken,
  (req, res) => {
    res.json({
      success: true,
      message: 'Servicio de validación operativo',
      timestamp: new Date(),
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        canValidate: ['control', 'admin'].includes(req.user.role)
      }
    });
  }
);

module.exports = router;