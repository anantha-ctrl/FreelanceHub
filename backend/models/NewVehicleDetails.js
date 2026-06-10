const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 1:1 detail table for advertisements where vehicleType = 'new'.
const NewVehicleDetails = sequelize.define('NewVehicleDetails', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  advertisementId: { type: DataTypes.UUID, allowNull: false, unique: true },
  sellerName: { type: DataTypes.STRING(120), allowNull: true },
  address: { type: DataTypes.STRING(255), allowNull: true },
  city: { type: DataTypes.STRING(80), allowNull: true },
  state: { type: DataTypes.STRING(80), allowNull: true },
  pincode: { type: DataTypes.STRING(15), allowNull: true },
  fuelType: { type: DataTypes.STRING(40), allowNull: true },
  yearOfProduction: { type: DataTypes.STRING(10), allowNull: true },
  yearOfManufacturing: { type: DataTypes.STRING(10), allowNull: true },
  bodyType: { type: DataTypes.STRING(60), allowNull: true },
  mileageKm: { type: DataTypes.STRING(40), allowNull: true },
  transmissionType: { type: DataTypes.STRING(40), allowNull: true },
  engineCapacityCc: { type: DataTypes.STRING(40), allowNull: true },
  vehicleColor: { type: DataTypes.STRING(40), allowNull: true },
  colorCode: { type: DataTypes.STRING(40), allowNull: true },
  chassisNumber: { type: DataTypes.STRING(60), allowNull: true },
  fuelEfficiency: { type: DataTypes.STRING(60), allowNull: true },
  roadTaxPaid: { type: DataTypes.STRING(20), allowNull: true },
  askingPrice: { type: DataTypes.STRING(40), allowNull: true },
  priceNegotiable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, {
  tableName: 'new_vehicle_details',
  indexes: [{ fields: ['advertisementId'] }]
});

NewVehicleDetails.prototype.toJSON = function () {
  const values = { ...this.get() };
  values._id = values.id;
  return values;
};

module.exports = NewVehicleDetails;
