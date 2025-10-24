const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ValidationLog = sequelize.define('ValidationLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // **INFORMACIÓN DE LA VALIDACIÓN**
  ticketId: {
    type: DataTypes.UUID,
    allowNull: true, // Permitir null para QR inválidos que no existen en el sistema
    comment: 'ID del ticket que se intentó validar'
  },
  
  eventId: {
    type: DataTypes.UUID,
    allowNull: true, // Permitir null para QR inválidos que no tienen evento asociado
    comment: 'ID del evento asociado'
  },
  
  validatedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Usuario que realizó la validación (rol control)'
  },
  
  // **RESULTADO DE LA VALIDACIÓN**
  isValid: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    comment: 'Si la validación fue exitosa o no'
  },
  
  validationType: {
    type: DataTypes.ENUM('entry', 'exit', 're-entry', 'verification'),
    allowNull: false,
    defaultValue: 'entry',
    comment: 'Tipo de validación realizada'
  },
  
  // **DETALLES Y METADATOS**
  validationResult: {
    type: DataTypes.ENUM(
      'success',           // Validación exitosa
      'already_used',      // QR ya utilizado
      'expired',          // Ticket expirado
      'invalid_event',    // Evento incorrecto
      'invalid_qr',       // QR inválido o corrupto
      'event_not_started', // Evento aún no ha comenzado
      'event_finished',   // Evento ya terminó
      'ticket_refunded',  // Ticket reembolsado
      'access_denied'     // Acceso denegado por otras razones
    ),
    allowNull: false,
    comment: 'Resultado específico de la validación'
  },
  
  qrCode: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Código QR que se intentó validar'
  },
  
  // **INFORMACIÓN CONTEXTUAL**
  deviceInfo: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Información del dispositivo usado para validar'
  },
  
  location: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Ubicación donde se realizó la validación'
  },
  
  ipAddress: {
    type: DataTypes.INET,
    allowNull: true,
    comment: 'Dirección IP del dispositivo validador'
  },
  
  // **METADATOS ADICIONALES**
  attemptNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Número de intento de validación para este ticket'
  },
  
  errorDetails: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Detalles del error si la validación falló'
  },
  
  validationDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tiempo que tomó la validación en ms'
  },
  
  // **TIMESTAMPS ESPECÍFICOS**
  validatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Momento exacto de la validación'
  },
  
  // **CAMPOS AUTOMÁTICOS**
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ValidationLogs',
  timestamps: true,
  indexes: [
    {
      fields: ['ticketId', 'validatedAt']
    },
    {
      fields: ['eventId', 'validatedAt']
    },
    {
      fields: ['validatedBy', 'validatedAt']
    },
    {
      fields: ['validationResult', 'validatedAt']
    },
    {
      fields: ['isValid', 'validatedAt']
    }
  ]
});

// **MÉTODOS DE INSTANCIA**
ValidationLog.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  return {
    id: values.id,
    ticketId: values.ticketId,
    eventId: values.eventId,
    validatedBy: values.validatedBy,
    isValid: values.isValid,
    validationType: values.validationType,
    validationResult: values.validationResult,
    location: values.location,
    attemptNumber: values.attemptNumber,
    validatedAt: values.validatedAt,
    validationDuration: values.validationDuration,
    errorDetails: values.errorDetails,
    createdAt: values.createdAt
  };
};

// **MÉTODOS ESTÁTICOS**
ValidationLog.getEventStats = async function(eventId, options = {}) {
  const { startDate, endDate } = options;
  
  const whereClause = { eventId };
  
  if (startDate || endDate) {
    whereClause.validatedAt = {};
    if (startDate) whereClause.validatedAt[Op.gte] = new Date(startDate);
    if (endDate) whereClause.validatedAt[Op.lte] = new Date(endDate);
  }
  
  const stats = await this.findAll({
    where: whereClause,
    attributes: [
      'validationResult',
      [sequelize.fn('COUNT', '*'), 'count']
    ],
    group: ['validationResult'],
    raw: true
  });
  
  const totalValidations = stats.reduce((sum, stat) => sum + parseInt(stat.count), 0);
  const successfulValidations = stats.find(s => s.validationResult === 'success')?.count || 0;
  
  return {
    totalValidations,
    successfulValidations,
    successRate: totalValidations > 0 ? (successfulValidations / totalValidations * 100).toFixed(2) : 0,
    validationsByResult: stats.reduce((acc, stat) => {
      acc[stat.validationResult] = parseInt(stat.count);
      return acc;
    }, {})
  };
};

ValidationLog.getRecentAttempts = async function(ticketId, minutes = 5) {
  const { Op } = require('sequelize');
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  
  return await this.findAll({
    where: {
      ticketId,
      validatedAt: {
        [Op.gte]: cutoff
      }
    },
    order: [['validatedAt', 'DESC']]
  });
};

// **HOOKS**
ValidationLog.beforeCreate((validationLog) => {
  // Asegurar que validatedAt esté establecido
  if (!validationLog.validatedAt) {
    validationLog.validatedAt = new Date();
  }
});

module.exports = ValidationLog;