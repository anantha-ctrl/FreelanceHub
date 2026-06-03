const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    defaultValue: null
  },
  executionTimeMs: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'audit_logs',
  indexes: [
    { fields: ['action'] },
    { fields: ['userId'] }
  ]
});

AuditLog.prototype.toJSON = function() {
  const values = { ...this.get() };
  values._id = values.id;
  return values;
};

module.exports = AuditLog;
