const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DailyReport = sequelize.define('DailyReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: { type: DataTypes.UUID, allowNull: false },
  reportDate: { type: DataTypes.DATEONLY, allowNull: false },
  username: { type: DataTypes.STRING(50), allowNull: false },
  email: { type: DataTypes.STRING(120), allowNull: true },
  workingFileId: { type: DataTypes.STRING(40), allowNull: false },
  formsCompletedToday: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  formsCompletedTillNow: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
  tableName: 'daily_reports',
  indexes: [
    { fields: ['userId'] },
    { fields: ['reportDate'] }
  ]
});

DailyReport.prototype.toJSON = function () {
  const values = { ...this.get() };
  values._id = values.id;
  return values;
};

module.exports = DailyReport;
