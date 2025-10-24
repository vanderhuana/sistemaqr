const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Datos básicos
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true
    }
  },
  
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255],
      notEmpty: true
    }
  },
  
  // Datos personales
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'first_name',
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'last_name',
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [0, 20]
    }
  },
  
  // Sistema de roles
  role: {
    type: DataTypes.ENUM('admin', 'vendedor', 'control'),
    allowNull: false,
    defaultValue: 'vendedor',
    validate: {
      isIn: [['admin', 'vendedor', 'control']]
    }
  },
  
  // Estado del usuario
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  
  // Última vez que se conectó
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login'
  },
  
  // Configuraciones adicionales
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Preferencias del usuario en formato JSON'
  }
}, {
  tableName: 'users',
  timestamps: true,
  
  // Hooks para encriptar password
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  },
  
  // Índices para optimizar consultas
  indexes: [
    {
      unique: true,
      fields: ['username']
    },
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['role']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Método de instancia para verificar password
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método de instancia para obtener datos públicos del usuario
User.prototype.getPublicData = function() {
  const { password, ...publicData } = this.toJSON();
  return publicData;
};

// Método de clase para buscar por email o username
User.findByLogin = async function(login) {
  const { Op } = require('sequelize');
  return await this.findOne({
    where: {
      [Op.or]: [
        { email: login },
        { username: login }
      ]
    }
  });
};

module.exports = User;