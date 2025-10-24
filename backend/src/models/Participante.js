const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Participante = sequelize.define('Participante', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    apellido: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    ci: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: false
    },
    correo: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: {
          msg: 'Debe ser un email válido'
        },
        customEmailValidation(value) {
          // Solo validar si se proporciona un valor
          if (value && value.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(value)) {
              throw new Error('El formato del email no es válido')
            }
          }
        }
      }
    },
    zona: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fechaNacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    area: {
      type: DataTypes.STRING,
      allowNull: true
    },
    empresaId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'empresas',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    sexo: {
      type: DataTypes.ENUM('M', 'F', 'Otro'),
      allowNull: true
    },
    ocupacion: {
      type: DataTypes.STRING,
      allowNull: true
    },
    nombreReferencia: {
      type: DataTypes.STRING,
      allowNull: true
    },
    parentesco: {
      type: DataTypes.STRING,
      allowNull: true
    },
    celularReferencia: {
      type: DataTypes.STRING,
      allowNull: true
    },
    token: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false
    },
    qrCode: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('activo', 'inactivo', 'suspendido'),
      defaultValue: 'activo',
      allowNull: false
    },
    urlFoto: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    datosExtra: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    ultimoAcceso: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha y hora del último acceso registrado'
    }
  }, {
    tableName: 'participantes',
    timestamps: true
  });

  return Participante;
};
