const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Announcement = sequelize.define('Announcement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: { type: DataTypes.STRING(150), allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high'),
    allowNull: false,
    defaultValue: 'normal'
  },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  createdBy: { type: DataTypes.UUID, allowNull: true }
}, {
  tableName: 'announcements',
  indexes: [{ fields: ['isActive'] }]
});

Announcement.prototype.toJSON = function () {
  const values = { ...this.get() };
  values._id = values.id;
  return values;
};

module.exports = Announcement;
