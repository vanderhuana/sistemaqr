const qrcode = require('qrcode');
const crypto = require('crypto');

/**
 * Utilidades para generación y manejo de códigos QR
 */

// Generar código QR único con máxima garantía de unicidad
const generateUniqueQRCode = (ticketId = null, eventId = null) => {
  // Usar timestamp con microsegundos
  const timestamp = Date.now();
  const microtime = process.hrtime.bigint();
  
  // Generar hash aleatorio con crypto (más seguro que Math.random)
  const randomHash = crypto.randomBytes(4).toString('hex');
  
  // Crear identificador único combinando múltiples fuentes
  const uniqueString = `${timestamp}-${microtime}-${randomHash}-${process.pid}`;
  
  // Generar hash SHA256 y tomar los primeros 12 caracteres
  const hash = crypto.createHash('sha256').update(uniqueString).digest('hex').substring(0, 12);
  
  // Formato final: TK-TIMESTAMP-HASH
  return `TK-${timestamp}-${hash.toUpperCase()}`;
};

// Crear datos completos para el QR (JSON que se codifica en el QR)
const createQRData = (ticket, event = null) => {
  const qrData = {
    // Identificadores principales
    id: ticket.id,
    qr: ticket.qrCode,
    tn: ticket.ticketNumber, // ticket number
    
    // Información del evento
    eventId: ticket.eventId,
    eventName: event ? event.name : null,
    eventDate: event ? event.startDate : null,
    
    // Información del comprador
    buyer: ticket.buyerName,
    
    // Información de validación
    status: ticket.status,
    price: ticket.salePrice,
    saleDate: ticket.saleDate,
    
    // Seguridad
    checksum: generateChecksum(ticket.qrCode),
    
    // Timestamp para validación de frescura
    generated: new Date().toISOString(),
    
    // Versión del formato (para futuras compatibilidades)
    v: '1.0'
  };
  
  return qrData;
};

// Generar checksum para validación
const generateChecksum = (qrCode, secret = null) => {
  const secretKey = secret || process.env.JWT_SECRET || 'default-secret';
  return crypto.createHash('sha256')
    .update(qrCode + secretKey)
    .digest('hex')
    .slice(0, 12); // Usar solo los primeros 12 caracteres
};

// Verificar checksum
const verifyChecksum = (qrCode, checksum, secret = null) => {
  const calculatedChecksum = generateChecksum(qrCode, secret);
  return calculatedChecksum === checksum;
};

// Generar imagen QR en diferentes formatos
const generateQRImage = async (data, options = {}) => {
  const defaultOptions = {
    errorCorrectionLevel: 'M',
    type: 'png',
    quality: 0.92,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    width: 256
  };
  
  const qrOptions = { ...defaultOptions, ...options };
  
  // Convertir datos a JSON string si es un objeto
  const qrDataString = typeof data === 'object' ? JSON.stringify(data) : data;
  
  try {
    switch (qrOptions.type) {
      case 'svg':
        return await qrcode.toString(qrDataString, {
          ...qrOptions,
          type: 'svg'
        });
        
      case 'dataURL':
        return await qrcode.toDataURL(qrDataString, qrOptions);
        
      case 'buffer':
      case 'png':
      default:
        return await qrcode.toBuffer(qrDataString, qrOptions);
    }
  } catch (error) {
    console.error('Error generando QR:', error);
    throw new Error('No se pudo generar el código QR');
  }
};

// Crear QR con información completa del ticket (para impresión)
const generateTicketQR = async (ticket, event = null, options = {}) => {
  const qrData = createQRData(ticket, event);
  
  const defaultOptions = {
    width: 200,
    margin: 1,
    errorCorrectionLevel: 'H' // Alta corrección de errores para impresión
  };
  
  const qrOptions = { ...defaultOptions, ...options };
  
  return await generateQRImage(qrData, qrOptions);
};

// Crear QR simple con solo el código (para validación rápida)
const generateSimpleQR = async (qrCode, options = {}) => {
  const defaultOptions = {
    width: 150,
    margin: 1,
    errorCorrectionLevel: 'M'
  };
  
  const qrOptions = { ...defaultOptions, ...options };
  
  return await generateQRImage(qrCode, qrOptions);
};

// Parsear datos del QR escaneado
const parseQRData = (qrString) => {
  try {
    // Intentar parsear como JSON (formato completo)
    const qrData = JSON.parse(qrString);
    
    // Validar estructura básica
    if (!qrData.id || !qrData.qr || !qrData.checksum) {
      return {
        isValid: false,
        error: 'Formato de QR inválido',
        data: null
      };
    }
    
    // Verificar checksum
    const isChecksumValid = verifyChecksum(qrData.qr, qrData.checksum);
    
    return {
      isValid: isChecksumValid,
      error: isChecksumValid ? null : 'Checksum inválido - posible QR falsificado',
      data: qrData,
      format: 'full'
    };
    
  } catch (error) {
    // Si no es JSON, asumir que es un código simple
    if (typeof qrString === 'string' && qrString.startsWith('QR-')) {
      return {
        isValid: true,
        error: null,
        data: { qr: qrString },
        format: 'simple'
      };
    }
    
    return {
      isValid: false,
      error: 'Formato de QR no reconocido',
      data: null
    };
  }
};

// Validar QR contra ticket en base de datos
const validateQRAgainstTicket = async (qrData, ticket) => {
  if (!ticket) {
    return {
      isValid: false,
      error: 'Entrada no encontrada',
      code: 'TICKET_NOT_FOUND'
    };
  }
  
  // Verificar que el QR coincide
  if (qrData.qr !== ticket.qrCode) {
    return {
      isValid: false,
      error: 'Código QR no coincide',
      code: 'QR_MISMATCH'
    };
  }
  
  // Verificar estado del ticket
  if (ticket.status === 'cancelled') {
    return {
      isValid: false,
      error: 'Entrada cancelada',
      code: 'TICKET_CANCELLED'
    };
  }
  
  if (ticket.status === 'used') {
    return {
      isValid: false,
      error: 'Entrada ya utilizada',
      code: 'TICKET_ALREADY_USED',
      usedAt: ticket.validatedAt
    };
  }
  
  if (ticket.status !== 'active') {
    return {
      isValid: false,
      error: `Entrada en estado: ${ticket.status}`,
      code: 'TICKET_INVALID_STATUS'
    };
  }
  
  return {
    isValid: true,
    error: null,
    code: 'VALID',
    ticket: ticket
  };
};

// Crear entrada de log de validación
const createValidationLog = async (ticketId, userId, eventId, result, errorMessage = null, metadata = {}) => {
  try {
    const { ValidationLog } = require('../models');
    
    return await ValidationLog.create({
      ticketId,
      userId,
      eventId,
      result, // 'success', 'already_used', 'invalid', 'cancelled', 'error'
      attemptedAt: new Date(),
      errorMessage,
      metadata: {
        ...metadata,
        userAgent: metadata.userAgent || 'unknown',
        ipAddress: metadata.ipAddress || 'unknown'
      }
    });
  } catch (error) {
    console.error('Error creando log de validación:', error);
    return null;
  }
};

// Generar QR para diferentes tamaños (útil para diferentes usos)
const generateQRSizes = async (data) => {
  const sizes = {
    small: { width: 100, margin: 1 },    // Para mostrar en listas
    medium: { width: 200, margin: 2 },   // Para mostrar en detalle
    large: { width: 400, margin: 3 },    // Para imprimir
    print: { width: 600, margin: 4 }     // Para impresión de alta calidad
  };
  
  const results = {};
  
  for (const [sizeName, sizeOptions] of Object.entries(sizes)) {
    try {
      results[sizeName] = await generateQRImage(data, {
        ...sizeOptions,
        type: 'dataURL',
        errorCorrectionLevel: 'H'
      });
    } catch (error) {
      console.error(`Error generando QR tamaño ${sizeName}:`, error);
      results[sizeName] = null;
    }
  }
  
  return results;
};

module.exports = {
  generateUniqueQRCode,
  createQRData,
  generateChecksum,
  verifyChecksum,
  generateQRImage,
  generateTicketQR,
  generateSimpleQR,
  parseQRData,
  validateQRAgainstTicket,
  createValidationLog,
  generateQRSizes
};