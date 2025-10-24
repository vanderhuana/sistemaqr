const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Código QR único (este será el valor del QR)
  qrCode: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: 'qr_code',
    validate: {
      notEmpty: true
    }
  },
  
  // Número de entrada (secuencial para mostrar al usuario)
  ticketNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'ticket_number'
  },
  
  // Datos del comprador
  buyerName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'buyer_name',
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  
  buyerEmail: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'buyer_email',
    validate: {
      isEmail: true
    }
  },
  
  buyerPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'buyer_phone'
  },
  
  buyerDocument: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'buyer_document',
    comment: 'Documento de identidad del comprador'
  },
  
  // Información de la venta
  salePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'sale_price',
    validate: {
      min: 0,
      isDecimal: true
    }
  },
  
  saleDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'sale_date'
  },
  
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'transfer', 'other'),
    allowNull: false,
    defaultValue: 'cash',
    field: 'payment_method'
  },
  
  paymentReference: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'payment_reference',
    comment: 'Referencia del pago (número de transacción, etc.)'
  },
  
  // Estado de la entrada
  status: {
    type: DataTypes.ENUM('active', 'used', 'cancelled', 'refunded'),
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'used', 'cancelled', 'refunded']]
    }
  },
  
  // Control de validación
  validatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'validated_at',
    comment: 'Fecha y hora cuando se validó la entrada'
  },
  
  validationAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'validation_attempts',
    comment: 'Número de intentos de validación'
  },
  
  // Información adicional
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas adicionales sobre la entrada'
  },
  
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Información adicional en formato JSON'
  },
  
  // Campos para rastreo
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'ip_address',
    comment: 'IP desde donde se realizó la compra'
  },
  
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent',
    comment: 'User agent del navegador de la compra'
  },
  
  // Agregar campo para cantidad de entradas
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  }
}, {
  tableName: 'tickets',
  timestamps: true,
  
  // Hooks para generar códigos únicos
  hooks: {
    beforeCreate: async (ticket) => {
      // Generar código QR único si no existe
      if (!ticket.qrCode) {
        ticket.qrCode = `TK-${Date.now()}-${uuidv4().slice(0, 8)}`.toUpperCase();
      }

      // Generar número de entrada si no existe
      if (!ticket.ticketNumber) {
        const count = await Ticket.count();
        ticket.ticketNumber = `E${String(count + 1).padStart(6, '0')}`;
      }

      // Validar cantidad de entradas
      if (ticket.quantity < 1) {
        throw new Error('La cantidad de entradas debe ser al menos 1');
      }
    }
  },
  
  // Índices para optimizar consultas
  indexes: [
    {
      unique: true,
      fields: ['qr_code']
    },
    {
      unique: true,
      fields: ['ticket_number']
    },
    {
      fields: ['status']
    },
    {
      fields: ['sale_date']
    },
    {
      fields: ['validated_at']
    },
    {
      fields: ['buyer_email']
    },
    {
      fields: ['buyer_document']
    }
  ]
});

// Métodos de instancia
Ticket.prototype.isValid = function() {
  return this.status === 'active';
};

Ticket.prototype.canBeValidated = function() {
  return this.status === 'active' && !this.validatedAt;
};

Ticket.prototype.validateEntry = async function(validatedBy = null) {
  if (!this.canBeValidated()) {
    throw new Error('Esta entrada no puede ser validada');
  }
  
  this.status = 'used';
  this.validatedAt = new Date();
  this.validationAttempts += 1;
  
  if (validatedBy) {
    this.metadata = {
      ...this.metadata,
      validatedBy: validatedBy,
      validationLocation: this.metadata.validationLocation || 'unknown'
    };
  }
  
  return await this.save();
};

Ticket.prototype.cancel = async function(reason = null) {
  if (this.status === 'used') {
    throw new Error('No se puede cancelar una entrada ya utilizada');
  }
  
  this.status = 'cancelled';
  
  if (reason) {
    this.notes = this.notes ? `${this.notes}\n\nCancelada: ${reason}` : `Cancelada: ${reason}`;
  }
  
  return await this.save();
};

Ticket.prototype.getValidationInfo = function() {
  return {
    qrCode: this.qrCode,
    ticketNumber: this.ticketNumber,
    buyerName: this.buyerName,
    status: this.status,
    isValid: this.isValid(),
    canBeValidated: this.canBeValidated(),
    validatedAt: this.validatedAt,
    attempts: this.validationAttempts
  };
};

// Métodos de clase
Ticket.findByQRCode = async function(qrCode) {
  return await this.findOne({
    where: { qrCode },
    include: ['Event', 'Seller', 'Validator']
  });
};

Ticket.findByTicketNumber = async function(ticketNumber) {
  return await this.findOne({
    where: { ticketNumber },
    include: ['Event', 'Seller']
  });
};

Ticket.getStatistics = async function(eventId = null) {
  const whereClause = eventId ? { eventId } : {};
  
  const [total, active, used, cancelled] = await Promise.all([
    this.count({ where: whereClause }),
    this.count({ where: { ...whereClause, status: 'active' } }),
    this.count({ where: { ...whereClause, status: 'used' } }),
    this.count({ where: { ...whereClause, status: 'cancelled' } })
  ]);
  
  return { total, active, used, cancelled };
};

module.exports = Ticket;