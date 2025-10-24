const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Información básica del evento
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 200]
    }
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  location: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 255]
    }
  },
  
  // Fechas y horarios del evento
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_date',
    validate: {
      notEmpty: true,
      isDate: true
    }
  },
  
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'end_date',
    validate: {
      notEmpty: true,
      isDate: true,
      isAfterStart(value) {
        if (this.startDate && value <= this.startDate) {
          throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }
      }
    }
  },
  
  // Control de capacidad
  maxCapacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100,
    field: 'max_capacity',
    validate: {
      min: 1,
      isInt: true
    }
  },
  
  currentSold: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'current_sold',
    validate: {
      min: 0,
      isInt: true
    }
  },
  
  // Sistema de precios por horarios
  priceRanges: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'price_ranges',
    comment: 'Array de objetos con rangos de precios por horario: [{startTime: "09:00", endTime: "18:00", price: 25.00}, ...]'
  },
  
  // Precio base (cuando no hay rangos específicos)
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'base_price',
    validate: {
      min: 0,
      isDecimal: true
    }
  },
  
  // Estado del evento
  status: {
    type: DataTypes.ENUM('draft', 'active', 'suspended', 'finished', 'cancelled'),
    defaultValue: 'draft',
    validate: {
      isIn: [['draft', 'active', 'suspended', 'finished', 'cancelled']]
    }
  },
  
  // Configuraciones adicionales
  allowRefunds: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'allow_refunds'
  },
  
  requiresApproval: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'requires_approval',
    comment: 'Si las entradas requieren aprobación manual'
  },
  
  // Configuración de venta
  saleStartDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'sale_start_date',
    comment: 'Fecha desde cuando se pueden vender entradas'
  },
  
  saleEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'sale_end_date',
    comment: 'Fecha hasta cuando se pueden vender entradas'
  },
  
  // Metadatos adicionales
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Información adicional del evento en formato JSON'
  },
  
  // Imagen del evento (URL o ruta)
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'image_url',
    validate: {
      len: [0, 500]
    }
  }
}, {
  tableName: 'events',
  timestamps: true,
  
  // Validaciones a nivel de modelo
  validate: {
    // Validar que las fechas de venta sean coherentes
    validateSaleDates() {
      if (this.saleStartDate && this.saleEndDate && this.saleStartDate >= this.saleEndDate) {
        throw new Error('La fecha de inicio de ventas debe ser anterior a la fecha de fin de ventas');
      }
      
      if (this.saleEndDate && this.startDate && this.saleEndDate > this.startDate) {
        throw new Error('Las ventas deben terminar antes del inicio del evento');
      }
    },
    
    // Validar que no se vendan más entradas de las disponibles
    validateCapacity() {
      if (this.currentSold > this.maxCapacity) {
        throw new Error('No se pueden vender más entradas de la capacidad máxima');
      }
    }
  },
  
  // Índices para optimizar consultas
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['start_date']
    },
    {
      fields: ['end_date']
    },
    {
      fields: ['sale_start_date', 'sale_end_date']
    },
    {
      fields: ['name']
    }
  ]
});

// Métodos de instancia
Event.prototype.isActive = function() {
  return this.status === 'active';
};

Event.prototype.canSellTickets = function() {
  const now = new Date();
  const canSell = this.status === 'active' && 
                  this.currentSold < this.maxCapacity &&
                  (!this.saleStartDate || now >= this.saleStartDate) &&
                  (!this.saleEndDate || now <= this.saleEndDate);
  return canSell;
};

Event.prototype.getAvailableTickets = function() {
  return this.maxCapacity - this.currentSold;
};

Event.prototype.getPriceAtTime = function(dateTime) {
  const { getPriceAtDateTime } = require('../utils/priceUtils');
  const priceInfo = getPriceAtDateTime(this, dateTime);
  return priceInfo.price;
};

// Método mejorado que devuelve información completa del precio
Event.prototype.getPriceInfoAtTime = function(dateTime) {
  const { getPriceAtDateTime } = require('../utils/priceUtils');
  return getPriceAtDateTime(this, dateTime);
};

// Métodos de clase
Event.findActiveEvents = async function() {
  return await this.findAll({
    where: {
      status: 'active',
      startDate: {
        [sequelize.Sequelize.Op.gte]: new Date()
      }
    },
    order: [['startDate', 'ASC']]
  });
};

module.exports = Event;