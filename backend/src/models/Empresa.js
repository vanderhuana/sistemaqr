const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Empresa = sequelize.define('Empresa', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'El nombre de la empresa/stand es requerido'
        }
      }
    },
    cupoTotal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'El cupo total no puede ser negativo'
        },
        isInt: {
          msg: 'El cupo total debe ser un número entero'
        }
      }
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    tableName: 'empresas',
    timestamps: true,
    indexes: [
      {
        fields: ['nombre']
      },
      {
        fields: ['activo']
      }
    ]
  });

  // Método de instancia para verificar si tiene cupo disponible
  Empresa.prototype.tieneCupoDisponible = async function() {
    const { Participante } = sequelize.models;
    const participantesCount = await Participante.count({
      where: { empresaId: this.id }
    });
    return participantesCount < this.cupoTotal;
  };

  // Método de instancia para obtener cupo usado
  Empresa.prototype.getCupoUsado = async function() {
    const { Participante } = sequelize.models;
    return await Participante.count({
      where: { empresaId: this.id }
    });
  };

  return Empresa;
};
