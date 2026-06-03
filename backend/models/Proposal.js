const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Proposal = sequelize.define('Proposal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  coverLetter: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  bidAmount: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending'
  }
}, {
  tableName: 'proposals',
  indexes: [
    { fields: ['postId'] },
    { fields: ['userId'] }
  ]
});

module.exports = Proposal;
