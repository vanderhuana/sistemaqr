const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Staff = sequelize.define('Staff', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    documento: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    cargo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fotoUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    qrCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }, {
    tableName: 'staff',
    timestamps: true
  });

  return Staff;
};
