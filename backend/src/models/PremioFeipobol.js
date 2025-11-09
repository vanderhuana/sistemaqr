const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PremioFeipobol = sequelize.define('PremioFeipobol', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    numeroSorteo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      comment: 'Número específico del sorteo que tiene premio'
    },
    nombrePremio: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'Nombre del premio (ej: Televisor 32", Celular Samsung)'
    },
    descripcionPremio: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Descripción detallada del premio'
    },
    imagenPath: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Path de la imagen generada del premio'
    },
    valorPremio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Valor aproximado del premio'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Si el premio está activo para el sorteo'
    }
  }, {
    tableName: 'premios_feipobol',
    timestamps: true,
    createdAt: 'fechaCreacion',
    updatedAt: 'fechaActualizacion'
  });

  return PremioFeipobol;
};