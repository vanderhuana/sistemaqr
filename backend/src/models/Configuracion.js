const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Configuracion = sequelize.define('Configuracion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    clave: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Identificador único de la configuración'
    },
    valor: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Valor de la configuración (true/false, texto, número, etc.)'
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Descripción de qué hace esta configuración'
    },
    tipo: {
      type: DataTypes.ENUM('boolean', 'string', 'number', 'json'),
      defaultValue: 'string',
      comment: 'Tipo de dato del valor'
    }
  }, {
    tableName: 'configuraciones',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['clave']
      }
    ]
  });

  return Configuracion;
};
