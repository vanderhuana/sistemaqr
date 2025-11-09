const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GanadorFeipobol = sequelize.define('GanadorFeipobol', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    registroId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'ID del registro que ganó el premio'
    },
    premioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID del premio ganado'
    },
    fechaGanado: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Fecha y hora cuando ganó el premio'
    },
    entregado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Si el premio ya fue entregado físicamente'
    },
    fechaEntrega: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha cuando se entregó el premio'
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Observaciones sobre la entrega del premio'
    }
  }, {
    tableName: 'ganadores_feipobol',
    timestamps: true,
    createdAt: 'fechaCreacion',
    updatedAt: 'fechaActualizacion'
  });

  return GanadorFeipobol;
};