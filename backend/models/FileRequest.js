const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FileRequest = sequelize.define('FileRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: { type: DataTypes.UUID, allowNull: false },
  username: { type: DataTypes.STRING(50), allowNull: false },
  oldFileId: { type: DataTypes.STRING(40), allowNull: true },
  requestedFileRange: { type: DataTypes.STRING(40), allowNull: false },
  lastCompletionDate: { type: DataTypes.DATEONLY, allowNull: true },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  }
}, {
  tableName: 'file_requests',
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] }
  ]
});

FileRequest.prototype.toJSON = function () {
  const values = { ...this.get() };
  values._id = values.id;
  return values;
};

module.exports = FileRequest;
