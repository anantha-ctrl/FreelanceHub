const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Core advertisement record. Vehicle-type-specific data lives in the
// NewVehicleDetails / UsedVehicleDetails 1:1 tables.
const Advertisement = sequelize.define('Advertisement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  adId: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true
  },
  batchNumber: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  carTitle: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  vehicleType: {
    type: DataTypes.ENUM('new', 'used'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'pending', 'sold', 'archived'),
    allowNull: false,
    defaultValue: 'active'
  },
  confirmed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'advertisements',
  indexes: [
    { fields: ['adId'] },
    { fields: ['batchNumber'] },
    { fields: ['vehicleType'] },
    { fields: ['userId'] },
    { fields: ['status'] }
  ]
});

Advertisement.prototype.toJSON = function () {
  const values = { ...this.get() };
  values._id = values.id;
  return values;
};

module.exports = Advertisement;
