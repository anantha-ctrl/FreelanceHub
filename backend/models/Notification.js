const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING(150), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: {
    type: DataTypes.ENUM('info', 'success', 'warning', 'ad', 'report', 'file', 'announcement', 'system'),
    allowNull: false,
    defaultValue: 'info'
  },
  // Comma-separated record of which channels this notification was pushed to
  // (in-app, email, sms, whatsapp) — used for the in-app notification center.
  channels: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'in-app' },
  isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, {
  tableName: 'notifications',
  indexes: [
    { fields: ['userId'] },
    { fields: ['isRead'] }
  ]
});

Notification.prototype.toJSON = function () {
  const values = { ...this.get() };
  values._id = values.id;
  return values;
};

module.exports = Notification;
