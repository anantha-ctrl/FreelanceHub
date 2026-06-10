const {
  Advertisement, DailyReport, FileRequest, Notification, Announcement, AuditLog
} = require('../models');
const { normalize } = require('../utils/dbUtils');

// GET /api/dashboard  — user dashboard widgets
const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const [totalAds, newAds, usedAds, reportsCount, unread] = await Promise.all([
      Advertisement.count({ where: { userId } }),
      Advertisement.count({ where: { userId, vehicleType: 'new' } }),
      Advertisement.count({ where: { userId, vehicleType: 'used' } }),
      DailyReport.count({ where: { userId } }),
      Notification.count({ where: { userId, isRead: false } })
    ]);

    const [latestAnnouncements, recentActivities, currentFile, recentAds, latestReport] = await Promise.all([
      Announcement.findAll({ where: { isActive: true }, order: [['createdAt', 'DESC']], limit: 5 }),
      AuditLog.findAll({ where: { userId }, order: [['createdAt', 'DESC']], limit: 8 }),
      FileRequest.findOne({ where: { userId }, order: [['createdAt', 'DESC']] }),
      Advertisement.findAll({ where: { userId }, order: [['createdAt', 'DESC']], limit: 5 }),
      DailyReport.findOne({ where: { userId }, order: [['createdAt', 'DESC']] })
    ]);

    res.json({
      success: true,
      dashboard: {
        stats: { totalAds, newAds, usedAds, reportsCount, unread },
        accountStatus: req.user.isBlocked ? 'Blocked' : 'Active',
        currentFile: currentFile ? normalize(currentFile) : null,
        latestReport: latestReport ? normalize(latestReport) : null,
        latestAnnouncements: normalize(latestAnnouncements),
        recentActivities: normalize(recentActivities),
        recentAds: normalize(recentAds)
      }
    });
  } catch (err) {
    console.error('User dashboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
};

module.exports = { getUserDashboard };
