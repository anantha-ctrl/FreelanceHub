const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 1:1 detail table for advertisements where vehicleType = 'used'.
const UsedVehicleDetails = sequelize.define('UsedVehicleDetails', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  advertisementId: { type: DataTypes.UUID, allowNull: false, unique: true },
  carCode: { type: DataTypes.STRING(60), allowNull: true },
  sellerName: { type: DataTypes.STRING(120), allowNull: true },
  address: { type: DataTypes.STRING(255), allowNull: true },
  city: { type: DataTypes.STRING(80), allowNull: true },
  state: { type: DataTypes.STRING(80), allowNull: true },
  pincode: { type: DataTypes.STRING(15), allowNull: true },
  contactNumber: { type: DataTypes.STRING(30), allowNull: true },
  emailAddress: { type: DataTypes.STRING(120), allowNull: true },
  fuelType: { type: DataTypes.STRING(40), allowNull: true },
  vehicleCondition: { type: DataTypes.STRING(60), allowNull: true },
  yearOfProduction: { type: DataTypes.STRING(10), allowNull: true },
  yearOfManufacturing: { type: DataTypes.STRING(10), allowNull: true },
  bodyType: { type: DataTypes.STRING(60), allowNull: true },
  mileage: { type: DataTypes.STRING(40), allowNull: true },
  transmissionType: { type: DataTypes.STRING(40), allowNull: true },
  engineCapacity: { type: DataTypes.STRING(40), allowNull: true },
  vehicleColor: { type: DataTypes.STRING(40), allowNull: true },
  colorCode: { type: DataTypes.STRING(40), allowNull: true },
  numberOfOwners: { type: DataTypes.STRING(20), allowNull: true },
  registrationCity: { type: DataTypes.STRING(80), allowNull: true },
  registrationNumber: { type: DataTypes.STRING(40), allowNull: true },
  vinNumber: { type: DataTypes.STRING(60), allowNull: true },
  chassisNumber: { type: DataTypes.STRING(60), allowNull: true },
  insuranceValidity: { type: DataTypes.STRING(40), allowNull: true },
  rcStatus: { type: DataTypes.STRING(40), allowNull: true },
  warrantyStatus: { type: DataTypes.STRING(40), allowNull: true },
  serviceHistoryStatus: { type: DataTypes.STRING(40), allowNull: true },
  lastServiceDate: { type: DataTypes.STRING(40), allowNull: true },
  serviceCenterHistory: { type: DataTypes.TEXT, allowNull: true },
  featureHighlights: { type: DataTypes.TEXT, allowNull: true },
  carAccessories: { type: DataTypes.TEXT, allowNull: true },
  fuelEfficiency: { type: DataTypes.STRING(60), allowNull: true },
  tyreCondition: { type: DataTypes.STRING(60), allowNull: true },
  interiorCondition: { type: DataTypes.STRING(60), allowNull: true },
  exteriorCondition: { type: DataTypes.STRING(60), allowNull: true },
  roadTaxPaid: { type: DataTypes.STRING(20), allowNull: true },
  loanStatus: { type: DataTypes.STRING(40), allowNull: true },
  askingPrice: { type: DataTypes.STRING(40), allowNull: true },
  financialStatus: { type: DataTypes.STRING(60), allowNull: true },
  vehicleDescription: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'used_vehicle_details',
  indexes: [{ fields: ['advertisementId'] }]
});

UsedVehicleDetails.prototype.toJSON = function () {
  const values = { ...this.get() };
  values._id = values.id;
  return values;
};

module.exports = UsedVehicleDetails;
