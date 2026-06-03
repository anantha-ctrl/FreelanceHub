const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Bookmark = sequelize.define('Bookmark', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'bookmarks',
  indexes: [
    { unique: true, fields: ['userId', 'postId'] }
  ]
});

module.exports = Bookmark;
