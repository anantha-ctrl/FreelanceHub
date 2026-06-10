const { Op } = require('sequelize');
const {
  User, Advertisement, NewVehicleDetails, UsedVehicleDetails,
  DailyReport, FileRequest, Announcement
} = require('../models');
const { sequelize } = require('../config/database');
const { normalize } = require('../utils/dbUtils');
const { logAudit } = require('../utils/auditLogger');
const { notify } = require('../services/notificationService');

// GET /api/car-admin/stats
const getStats = async (req, res) => {
  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    const [
      totalUsers, activeUsers, totalAds, newVehicleAds, usedVehicleAds,
      reportsToday, totalReports, fileRequests, pendingRequests
    ] = await Promise.all([
      User.count({ where: { role: 'user' } }),
      User.count({ where: { role: 'user', lastSeen: { [Op.gte]: dayAgo } } }),
      Advertisement.count(),
      Advertisement.count({ where: { vehicleType: 'new' } }),
      Advertisement.count({ where: { vehicleType: 'used' } }),
      DailyReport.count({ where: { createdAt: { [Op.gte]: todayStart } } }),
      DailyReport.count(),
      FileRequest.count(),
      FileRequest.count({ where: { status: 'pending' } })
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers, activeUsers, totalAds, newVehicleAds, usedVehicleAds,
        reportsToday, totalReports, fileRequests, pendingRequests
      }
    });
  } catch (err) {
    console.error('Car admin stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to load statistics.' });
  }
};

// GET /api/car-admin/ads
const getAllAds = async (req, res) => {
  try {
    const { q, vehicleType } = req.query;
    const where = {};
    if (vehicleType && vehicleType !== 'all') where.vehicleType = vehicleType;
    if (q) {
      where[Op.or] = [
        { adId: { [Op.like]: `%${q}%` } },
        { batchNumber: { [Op.like]: `%${q}%` } },
        { carTitle: { [Op.like]: `%${q}%` } },
        { username: { [Op.like]: `%${q}%` } }
      ];
    }
    const ads = await Advertisement.findAll({
      where, order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'username', 'email'] }]
    });
    res.json({ success: true, ads: normalize(ads) });
  } catch (err) {
    console.error('Car admin ads error:', err);
    res.status(500).json({ success: false, message: 'Failed to load advertisements.' });
  }
};

// DELETE /api/car-admin/ads/:id
const deleteAd = async (req, res) => {
  try {
    const ad = await Advertisement.findByPk(req.params.id);
    if (!ad) return res.status(404).json({ success: false, message: 'Advertisement not found.' });
    await NewVehicleDetails.destroy({ where: { advertisementId: ad.id } });
    await UsedVehicleDetails.destroy({ where: { advertisementId: ad.id } });
    const label = ad.adId;
    await ad.destroy();
    await logAudit({ action: 'ADMIN_AD_DELETE', details: `Admin deleted ad ${label}`, userId: req.user.id, req });
    res.json({ success: true, message: 'Advertisement deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete advertisement.' });
  }
};

// GET /api/car-admin/reports
const getAllReports = async (req, res) => {
  try {
    const reports = await DailyReport.findAll({
      order: [['reportDate', 'DESC'], ['createdAt', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'username', 'email'] }]
    });
    res.json({ success: true, reports: normalize(reports) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load reports.' });
  }
};

// GET /api/car-admin/file-requests
const getAllRequests = async (req, res) => {
  try {
    const requests = await FileRequest.findAll({
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'username', 'email', 'mobile'] }]
    });
    res.json({ success: true, requests: normalize(requests) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load file requests.' });
  }
};

// PUT /api/car-admin/file-requests/:id  { status }
const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const request = await FileRequest.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'mobile'] }]
    });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    request.status = status;
    await request.save();

    let emailAttachments = [];
    let customMessage = `Your file request for range ${request.requestedFileRange} has been ${status}.`;

    if (status === 'approved') {
      const { generateVehicleDataCSV } = require('../utils/csvGenerator');
      const csvContent = generateVehicleDataCSV(request.requestedFileRange);
      emailAttachments = [{
        filename: `Vehicle_Data_${request.requestedFileRange}.csv`,
        content: csvContent
      }];
      customMessage = `Your file request for range ${request.requestedFileRange} has been approved. The assigned document is attached to this email.`;
    }

    notify({
      userId: request.userId,
      title: `File Request ${status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Updated'}`,
      message: customMessage,
      type: 'file',
      channels: ['in-app', 'email', 'whatsapp'],
      email: request.user?.email,
      mobile: request.user?.mobile,
      subject: `Car Hive — File Request ${status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Updated'}`,
      attachments: emailAttachments
    }).catch(() => {});

    await logAudit({ action: 'FILE_REQUEST_UPDATE', details: `Request ${request.id} set to ${status}`, userId: req.user.id, req });
    res.json({ success: true, message: `Request ${status}.` });
  } catch (err) {
    console.error('Update request status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update request.' });
  }
};

// POST /api/car-admin/broadcast  { title, message, channels }
const broadcast = async (req, res) => {
  try {
    const { title, message, channels } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }
    const users = await User.findAll({ where: { role: 'user' }, attributes: ['id', 'email', 'mobile'] });
    const ch = Array.isArray(channels) && channels.length ? channels : ['in-app'];
    await Promise.allSettled(users.map(u =>
      notify({ userId: u.id, title, message, type: 'announcement', channels: ch, email: u.email, mobile: u.mobile, subject: title })
    ));
    await logAudit({ action: 'BROADCAST', details: `Broadcast "${title}" to ${users.length} users`, userId: req.user.id, req });
    res.json({ success: true, message: `Notification sent to ${users.length} users.` });
  } catch (err) {
    console.error('Broadcast error:', err);
    res.status(500).json({ success: false, message: 'Failed to send broadcast.' });
  }
};

// GET /api/car-admin/analytics
const getAnalytics = async (req, res) => {
  try {
    // ── Vehicle Type Distribution (New vs Used) ──
    const newCount = await Advertisement.count({ where: { vehicleType: 'new' } });
    const usedCount = await Advertisement.count({ where: { vehicleType: 'used' } });
    const vehicleTypeDistribution = [
      { name: 'New Vehicles', value: newCount, color: '#6366f1' },
      { name: 'Used Vehicles', value: usedCount, color: '#f59e0b' }
    ];

    // ── Fuel Type Distribution (aggregate from both detail tables) ──
    const newFuelRows = await sequelize.query(
      `SELECT fuelType, COUNT(*) as count FROM new_vehicle_details WHERE fuelType IS NOT NULL AND fuelType != '' GROUP BY fuelType`,
      { type: sequelize.QueryTypes.SELECT }
    ).catch(() => []);
    const usedFuelRows = await sequelize.query(
      `SELECT fuelType, COUNT(*) as count FROM used_vehicle_details WHERE fuelType IS NOT NULL AND fuelType != '' GROUP BY fuelType`,
      { type: sequelize.QueryTypes.SELECT }
    ).catch(() => []);

    // Merge fuel counts from both tables
    const fuelMap = {};
    const fuelColors = {
      'petrol': '#3b82f6', 'Petrol': '#3b82f6',
      'diesel': '#ef4444', 'Diesel': '#ef4444',
      'electric': '#10b981', 'Electric': '#10b981', 'EV': '#10b981', 'ev': '#10b981',
      'cng': '#f59e0b', 'CNG': '#f59e0b',
      'hybrid': '#8b5cf6', 'Hybrid': '#8b5cf6',
      'lpg': '#ec4899', 'LPG': '#ec4899'
    };

    const processFuelRows = (rows) => {
      if (!Array.isArray(rows)) return;
      rows.forEach(r => {
        const ft = (r.fuelType || '').trim();
        if (!ft) return;
        const key = ft.charAt(0).toUpperCase() + ft.slice(1).toLowerCase();
        fuelMap[key] = (fuelMap[key] || 0) + parseInt(r.count, 10);
      });
    };

    processFuelRows(Array.isArray(newFuelRows) ? newFuelRows : []);
    processFuelRows(Array.isArray(usedFuelRows) ? usedFuelRows : []);

    const fuelDistribution = Object.entries(fuelMap).map(([name, value]) => ({
      name,
      value,
      color: fuelColors[name] || '#94a3b8'
    }));

    // ── Daily Report Trend (last 30 days) ──
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const reports = await DailyReport.findAll({
      where: { reportDate: { [Op.gte]: thirtyDaysAgo } },
      attributes: [
        'reportDate',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('formsCompletedToday')), 'formsCompleted']
      ],
      group: ['reportDate'],
      order: [['reportDate', 'ASC']],
      raw: true
    });

    const reportTrend = reports.map(r => ({
      date: new Date(r.reportDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      fullDate: r.reportDate,
      reports: parseInt(r.count, 10),
      formsCompleted: parseInt(r.formsCompleted, 10) || 0
    }));

    // ── Ad Status Distribution ──
    const [activeAds, pendingAds, soldAds, archivedAds] = await Promise.all([
      Advertisement.count({ where: { status: 'active' } }),
      Advertisement.count({ where: { status: 'pending' } }),
      Advertisement.count({ where: { status: 'sold' } }),
      Advertisement.count({ where: { status: 'archived' } })
    ]);
    const adStatusDistribution = [
      { name: 'Active', value: activeAds, color: '#10b981' },
      { name: 'Pending', value: pendingAds, color: '#f59e0b' },
      { name: 'Sold', value: soldAds, color: '#6366f1' },
      { name: 'Archived', value: archivedAds, color: '#94a3b8' }
    ].filter(d => d.value > 0);

    // ── File Request Status Distribution ──
    const [pendingReqs, approvedReqs, rejectedReqs] = await Promise.all([
      FileRequest.count({ where: { status: 'pending' } }),
      FileRequest.count({ where: { status: 'approved' } }),
      FileRequest.count({ where: { status: 'rejected' } })
    ]);
    const requestStatusDistribution = [
      { name: 'Pending', value: pendingReqs, color: '#f59e0b' },
      { name: 'Approved', value: approvedReqs, color: '#10b981' },
      { name: 'Rejected', value: rejectedReqs, color: '#ef4444' }
    ].filter(d => d.value > 0);

    res.json({
      success: true,
      analytics: {
        vehicleTypeDistribution,
        fuelDistribution,
        reportTrend,
        adStatusDistribution,
        requestStatusDistribution
      }
    });
  } catch (err) {
    console.error('Car admin analytics error:', err);
    res.status(500).json({ success: false, message: 'Failed to load analytics data.' });
  }
};

module.exports = {
  getStats, getAllAds, deleteAd, getAllReports,
  getAllRequests, updateRequestStatus, broadcast, getAnalytics
};
