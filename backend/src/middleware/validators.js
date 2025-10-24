const { body } = require('express-validator');

// Validaciones para registro
const validateRegister = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),
    
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
    
  body('firstName')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 1, max: 50 })
    .withMessage('El nombre debe tener entre 1 y 50 caracteres')
    .trim(),
    
  body('lastName')
    .notEmpty()
    .withMessage('El apellido es requerido')
    .isLength({ min: 1, max: 50 })
    .withMessage('El apellido debe tener entre 1 y 50 caracteres')
    .trim(),
    
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Debe ser un número de teléfono válido'),
    
  body('role')
    .optional()
    .isIn(['admin', 'vendedor', 'control'])
    .withMessage('El rol debe ser: admin, vendedor o control')
];

// Validaciones para login
const validateLogin = [
  body('login')
    .notEmpty()
    .withMessage('Email o nombre de usuario requerido')
    .trim(),
    
  body('password')
    .notEmpty()
    .withMessage('Contraseña requerida')
];

// Validaciones para actualizar perfil
const validateUpdateProfile = [
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('El nombre debe tener entre 1 y 50 caracteres')
    .trim(),
    
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('El apellido debe tener entre 1 y 50 caracteres')
    .trim(),
    
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Debe ser un número de teléfono válido'),
    
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Las preferencias deben ser un objeto JSON válido')
];

// Validaciones para cambiar contraseña
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Contraseña actual requerida'),
    
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La nueva contraseña debe contener al menos una minúscula, una mayúscula y un número'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    })
];

// Validaciones para refresh token
const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token requerido')
];

// **VALIDACIONES PARA EVENTOS**

// Validaciones para crear evento
const validateCreateEvent = [
  body('name')
    .notEmpty()
    .withMessage('El nombre del evento es requerido')
    .isLength({ min: 3, max: 200 })
    .withMessage('El nombre debe tener entre 3 y 200 caracteres')
    .trim(),
    
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres')
    .trim(),
    
  body('location')
    .notEmpty()
    .withMessage('La ubicación es requerida')
    .isLength({ min: 3, max: 255 })
    .withMessage('La ubicación debe tener entre 3 y 255 caracteres')
    .trim(),
    
  body('startDate')
    .isISO8601()
    .withMessage('La fecha de inicio debe ser una fecha válida')
    .custom((value) => {
      const date = new Date(value);
      if (date <= new Date()) {
        throw new Error('La fecha de inicio debe ser futura');
      }
      return true;
    }),
    
  body('endDate')
    .isISO8601()
    .withMessage('La fecha de fin debe ser una fecha válida')
    .custom((value, { req }) => {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(value);
      
      if (endDate <= startDate) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }
      
      // Verificar que el evento no dure más de 30 días
      const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
      if (diffDays > 30) {
        throw new Error('El evento no puede durar más de 30 días');
      }
      
      return true;
    }),
    
  body('maxCapacity')
    .isInt({ min: 1, max: 50000 })
    .withMessage('La capacidad debe ser un número entre 1 y 50,000'),
    
  body('basePrice')
    .isFloat({ min: 0 })
    .withMessage('El precio base debe ser un número mayor o igual a 0'),
    
  body('priceRanges')
    .optional()
    .isArray()
    .withMessage('Los rangos de precio deben ser un array')
    .custom((ranges) => {
      if (!Array.isArray(ranges)) return true;
      
      for (const range of ranges) {
        if (!range.startTime || !range.endTime || range.price === undefined) {
          throw new Error('Cada rango debe tener startTime, endTime y price');
        }
        
        // Validar formato de hora (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(range.startTime) || !timeRegex.test(range.endTime)) {
          throw new Error('Las horas deben estar en formato HH:MM');
        }
        
        if (range.price < 0) {
          throw new Error('Los precios no pueden ser negativos');
        }
        
        // Validar que startTime sea diferente de endTime
        if (range.startTime === range.endTime) {
          throw new Error('La hora de inicio no puede ser igual a la hora de fin');
        }
        
        // Para rangos consecutivos normales, startTime debe ser < endTime
        // Para rangos nocturnos (cruzan medianoche), startTime > endTime es válido
        const startMinutes = parseInt(range.startTime.split(':')[0]) * 60 + parseInt(range.startTime.split(':')[1]);
        const endMinutes = parseInt(range.endTime.split(':')[0]) * 60 + parseInt(range.endTime.split(':')[1]);
        
        // Permitir tanto rangos normales como nocturnos
        if (startMinutes === endMinutes) {
          throw new Error('Las horas de inicio y fin no pueden ser iguales');
        }
      }
      
      return true;
    }),
    
  body('saleStartDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de inicio de ventas debe ser válida'),
    
  body('saleEndDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de fin de ventas debe ser válida')
    .custom((value, { req }) => {
      if (!value) return true;
      
      const saleEndDate = new Date(value);
      const startDate = new Date(req.body.startDate);
      
      if (saleEndDate > startDate) {
        throw new Error('Las ventas deben terminar antes del inicio del evento');
      }
      
      if (req.body.saleStartDate) {
        const saleStartDate = new Date(req.body.saleStartDate);
        if (saleEndDate <= saleStartDate) {
          throw new Error('La fecha de fin de ventas debe ser posterior al inicio de ventas');
        }
      }
      
      return true;
    }),
    
  body('allowRefunds')
    .optional()
    .isBoolean()
    .withMessage('allowRefunds debe ser verdadero o falso'),
    
  body('requiresApproval')
    .optional()
    .isBoolean()
    .withMessage('requiresApproval debe ser verdadero o falso'),
    
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('La URL de imagen debe ser válida')
    .isLength({ max: 500 })
    .withMessage('La URL no puede exceder 500 caracteres')
];

// Validaciones para actualizar evento (más permisivas)
const validateUpdateEvent = [
  body('name')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('El nombre debe tener entre 3 y 200 caracteres')
    .trim(),
    
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres')
    .trim(),
    
  body('location')
    .optional()
    .isLength({ min: 3, max: 255 })
    .withMessage('La ubicación debe tener entre 3 y 255 caracteres')
    .trim(),
    
  body('maxCapacity')
    .optional()
    .isInt({ min: 1, max: 50000 })
    .withMessage('La capacidad debe ser un número entre 1 y 50,000'),
    
  body('basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio base debe ser un número mayor o igual a 0'),
    
  body('priceRanges')
    .optional()
    .isArray()
    .withMessage('Los rangos de precio deben ser un array')
    .custom((ranges) => {
      if (!Array.isArray(ranges)) return true;
      
      for (const range of ranges) {
        if (!range.startTime || !range.endTime || range.price === undefined) {
          throw new Error('Cada rango debe tener startTime, endTime y price');
        }
        
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(range.startTime) || !timeRegex.test(range.endTime)) {
          throw new Error('Las horas deben estar en formato HH:MM');
        }
        
        if (range.price < 0) {
          throw new Error('Los precios no pueden ser negativos');
        }
      }
      
      return true;
    }),
    
  body('allowRefunds')
    .optional()
    .isBoolean()
    .withMessage('allowRefunds debe ser verdadero o falso'),
    
  body('requiresApproval')
    .optional()
    .isBoolean()
    .withMessage('requiresApproval debe ser verdadero o falso')
];

// Validación para cambiar estado del evento
const validateEventStatus = [
  body('status')
    .isIn(['draft', 'active', 'suspended', 'finished', 'cancelled'])
    .withMessage('Estado debe ser: draft, active, suspended, finished o cancelled')
];

// **VALIDACIONES PARA TICKETS**

// Validaciones para vender entrada
const validateSellTicket = [
  body('eventId')
    .isUUID()
    .withMessage('ID del evento debe ser un UUID válido'),
    
  body('buyerName')
    .notEmpty()
    .withMessage('Nombre del comprador es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim(),
    
  body('buyerEmail')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Email debe ser válido')
    .normalizeEmail(),
    
  body('buyerPhone')
    .optional({ checkFalsy: true })
    .isMobilePhone('any')
    .withMessage('Teléfono debe ser válido'),
    
  body('buyerDocument')
    .optional({ checkFalsy: true })
    .isLength({ min: 2, max: 50 })
    .withMessage('Documento debe tener entre 2 y 50 caracteres'),
    
  body('paymentMethod')
    .isIn(['cash', 'card', 'transfer', 'other'])
    .withMessage('Método de pago debe ser: cash, card, transfer u other'),
    
  body('paymentReference')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('Referencia de pago no puede exceder 100 caracteres')
    .trim(),
    
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Cantidad debe ser un número entre 1 y 10'),
    
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder 500 caracteres')
    .trim()
];

// Validaciones para cancelar entrada
const validateCancelTicket = [
  body('reason')
    .notEmpty()
    .withMessage('Razón de cancelación es requerida')
    .isLength({ min: 5, max: 200 })
    .withMessage('La razón debe tener entre 5 y 200 caracteres')
    .trim()
];

// Validaciones para búsqueda de tickets
const validateTicketSearch = [
  // Query parameters opcionales
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número mayor a 0'),
    
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser entre 1 y 100'),
    
  body('status')
    .optional()
    .isIn(['active', 'used', 'cancelled', 'refunded'])
    .withMessage('Estado debe ser: active, used, cancelled o refunded'),
    
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio debe ser válida'),
    
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin debe ser válida')
];

// **VALIDACIONES PARA VALIDACIÓN QR**

// Validar datos de QR escaneado
const validateQRScan = [
  body('qrData')
    .notEmpty()
    .withMessage('Datos del QR son requeridos')
    .custom((value) => {
      try {
        // Intentar parsear como JSON
        if (typeof value === 'string') {
          JSON.parse(value);
        }
        return true;
      } catch (error) {
        // Si no es JSON, verificar que sea un string válido de QR
        if (typeof value === 'string' && value.startsWith('QR-')) {
          return true;
        }
        throw new Error('Formato de QR inválido');
      }
    }),
    
  body('location')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Ubicación de validación debe tener entre 2 y 100 caracteres')
    .trim(),
    
  body('notes')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Las notas no pueden exceder 200 caracteres')
    .trim()
];

// Validación para generar QR con opciones específicas
const validateQRGeneration = [
  body('format')
    .optional()
    .isIn(['png', 'svg', 'dataURL'])
    .withMessage('Formato debe ser: png, svg o dataURL'),
    
  body('size')
    .optional()
    .isIn(['small', 'medium', 'large', 'print'])
    .withMessage('Tamaño debe ser: small, medium, large o print'),
    
  body('includeInfo')
    .optional()
    .isBoolean()
    .withMessage('includeInfo debe ser verdadero o falso')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateRefreshToken,
  validateCreateEvent,
  validateUpdateEvent,
  validateEventStatus,
  validateSellTicket,
  validateCancelTicket,
  validateTicketSearch,
  validateQRScan,
  validateQRGeneration
};