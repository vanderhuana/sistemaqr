const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const RegistroFeipobol = sequelize.define('RegistroFeipobol', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El nombre es obligatorio'
        }
      }
    },
    apellido: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El apellido es obligatorio'
        }
      }
    },
    ci: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        len: {
          args: [4, 20],
          msg: 'El CI debe tener entre 4 y 20 caracteres'
        }
      }
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El teléfono es obligatorio'
        },
        len: {
          args: [7, 15],
          msg: 'El teléfono debe tener entre 7 y 15 dígitos'
        }
      }
    },
    correo: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: {
          msg: 'Debe ser un email válido'
        }
      }
    },
    zona: {
      type: DataTypes.STRING,
      allowNull: true,
      set(value) {
        // Normalizar la zona: convertir a formato "Norte", "Sur", etc.
        if (value) {
          const zonaNormalizada = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
          this.setDataValue('zona', zonaNormalizada);
        } else {
          this.setDataValue('zona', value);
        }
      }
    },
    token: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false,
      comment: 'Token único para identificación del registro'
    },
    qrCode: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Código QR en formato base64'
    },
    numeroSorteo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
      comment: 'Número único para el sorteo'
    },
    estado: {
      type: DataTypes.ENUM('activo', 'inactivo', 'ganador', 'descalificado'),
      defaultValue: 'activo',
      allowNull: false
    },
    fechaRegistro: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    ipRegistro: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'IP desde donde se registró'
    },
    participoSorteo: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Indica si ya participó en algún sorteo'
    },
    premioGanado: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Descripción del premio ganado (si aplica)'
    },
    fechaSorteo: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha del sorteo en que ganó'
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'registros_feipobol',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['token']
      },
      {
        unique: true,
        fields: ['ci'],
        where: {
          ci: {
            [Op.ne]: null
          }
        }
      },
      {
        unique: true,
        fields: ['numeroSorteo'],
        where: {
          numeroSorteo: {
            [Op.ne]: null
          }
        }
      },
      {
        fields: ['telefono']
      },
      {
        fields: ['estado']
      },
      {
        fields: ['fechaRegistro']
      }
    ],
    hooks: {
      beforeCreate: async (registro) => {
        // Generar número de sorteo único
        const ultimoRegistro = await RegistroFeipobol.findOne({
          order: [['numeroSorteo', 'DESC']],
          attributes: ['numeroSorteo']
        });
        
        registro.numeroSorteo = ultimoRegistro && ultimoRegistro.numeroSorteo 
          ? ultimoRegistro.numeroSorteo + 1 
          : 1; // Empezar desde 1
      }
    }
  });

  return RegistroFeipobol;
};
