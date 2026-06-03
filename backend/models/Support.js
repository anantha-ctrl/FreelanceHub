const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SupportTicket = sequelize.define('SupportTicket', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      len: [3, 150]
    }
  },
  status: {
    type: DataTypes.ENUM('open', 'resolved', 'closed'),
    defaultValue: 'open'
  }
}, {
  tableName: 'support_tickets',
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] }
  ]
});

const SupportMessage = sequelize.define('SupportMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ticketId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 2000]
    }
  }
}, {
  tableName: 'support_messages',
  indexes: [
    { fields: ['ticketId'] }
  ]
});

[SupportTicket, SupportMessage].forEach((model) => {
  model.prototype.toJSON = function() {
    const values = { ...this.get() };
    values._id = values.id;
    return values;
  };
});

module.exports = { SupportTicket, SupportMessage };
