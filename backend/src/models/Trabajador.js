const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Trabajador = sequelize.define('Trabajador', {
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
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
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
      allowNull: false
    },
    fechaNacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    areaTrabajo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sexo: {
      type: DataTypes.ENUM('M', 'F', 'Otro'),
      allowNull: false
    },
    ocupacion: {
      type: DataTypes.STRING,
      allowNull: false
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
    estado: {
      type: DataTypes.ENUM('activo', 'inactivo', 'suspendido'),
      defaultValue: 'activo',
      allowNull: false
    },
    urlFoto: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ultimoAcceso: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha y hora del último acceso registrado'
    }
  }, {
    tableName: 'trabajadores',
    timestamps: true
  });

  return Trabajador;
};
