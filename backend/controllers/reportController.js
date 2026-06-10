const { DailyReport } = require('../models');
const { normalize } = require('../utils/dbUtils');
const { logAudit } = require('../utils/auditLogger');
const { notify } = require('../services/notificationService');

// POST /api/reports
const submitReport = async (req, res) => {
  try {
    const { reportDate, workingFileId, formsCompletedToday, formsCompletedTillNow, email } = req.body;

    if (!reportDate || !workingFileId) {
      return res.status(400).json({ success: false, message: 'Date and working file ID are required.' });
    }

    const report = await DailyReport.create({
      userId: req.user.id,
      reportDate,
      username: req.user.username || req.user.name,
      email: email || req.user.email,
      workingFileId,
      formsCompletedToday: Number(formsCompletedToday) || 0,
      formsCompletedTillNow: Number(formsCompletedTillNow) || 0
    });

    await logAudit({ action: 'REPORT_SUBMIT', details: `Daily report for file ${workingFileId} on ${reportDate}`, userId: req.user.id, req });

    notify({
      userId: req.user.id,
      title: 'Daily Report Submitted',
      message: `Your daily report for ${reportDate} (file ${workingFileId}) has been recorded. Forms today: ${formsCompletedToday || 0}.`,
      type: 'report',
      channels: ['in-app', 'email'],
      email: email || req.user.email,
      subject: 'Car Hive — Daily Report Received'
    }).catch(() => {});

    res.status(201).json({ success: true, message: 'Daily Report Submitted Successfully', report: normalize(report) });
  } catch (err) {
    console.error('Submit report error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit daily report.' });
  }
};

// GET /api/reports/my
const getMyReports = async (req, res) => {
  try {
    const reports = await DailyReport.findAll({
      where: { userId: req.user.id },
      order: [['reportDate', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json({ success: true, reports: normalize(reports) });
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ success: false, message: 'Failed to load reports.' });
  }
};

module.exports = { submitReport, getMyReports };
