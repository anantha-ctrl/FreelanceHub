const { AuditLog } = require('../models');

const logAudit = async ({ action, details, userId, req, executionTimeMs }) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;
    await AuditLog.create({
      action,
      details,
      userId: userId || req?.user?.id || null,
      ipAddress,
      executionTimeMs: executionTimeMs || null
    });
  } catch (err) {
    console.error('Failed to log system audit event:', err.message);
  }
};

module.exports = { logAudit };
