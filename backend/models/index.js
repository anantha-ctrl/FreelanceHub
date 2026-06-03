const { sequelize } = require('../config/database');
const User = require('./User');
const Post = require('./Post');
const { LoginLog, Like, Comment, BlockedUser } = require('./Activity');
const { SupportTicket, SupportMessage } = require('./Support');
const AuditLog = require('./AuditLog');
const Bookmark = require('./Bookmark');
const Proposal = require('./Proposal');
const Message = require('./Message');

User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Post.belongsTo(User, { foreignKey: 'approvedBy', as: 'approvedByUser' });

User.hasMany(LoginLog, { foreignKey: 'userId', as: 'loginLogs' });
LoginLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Like, { foreignKey: 'userId', as: 'likes' });
Like.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Like.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

User.hasOne(BlockedUser, { foreignKey: 'userId', as: 'blockedRecord' });
BlockedUser.belongsTo(User, { foreignKey: 'userId', as: 'user' });
BlockedUser.belongsTo(User, { foreignKey: 'blockedBy', as: 'blockedByUser' });

// Support relationships
User.hasMany(SupportTicket, { foreignKey: 'userId', as: 'supportTickets' });
SupportTicket.belongsTo(User, { foreignKey: 'userId', as: 'user' });

SupportTicket.hasMany(SupportMessage, { foreignKey: 'ticketId', as: 'messages' });
SupportMessage.belongsTo(SupportTicket, { foreignKey: 'ticketId', as: 'ticket' });

User.hasMany(SupportMessage, { foreignKey: 'senderId', as: 'sentSupportMessages' });
SupportMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Bookmarks
User.hasMany(Bookmark, { foreignKey: 'userId', as: 'bookmarks' });
Bookmark.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Bookmark.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// Proposals
User.hasMany(Proposal, { foreignKey: 'userId', as: 'proposals' });
Proposal.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Post.hasMany(Proposal, { foreignKey: 'postId', as: 'proposals' });
Proposal.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// Messages
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

module.exports = { sequelize, User, Post, LoginLog, Like, Comment, BlockedUser, SupportTicket, SupportMessage, AuditLog, Bookmark, Proposal, Message };