const { FileRequest } = require('../models');
const { normalize } = require('../utils/dbUtils');
const { logAudit } = require('../utils/auditLogger');
const { notify, sendEmail } = require('../services/notificationService');

// Generate the standard set of file ranges: 1-150, 151-300, ... up to 4951-5000.
const buildFileRanges = () => {
  const ranges = [];
  let start = 1;
  const SIZE = 150;
  while (start <= 5000) {
    const end = Math.min(start + SIZE - 1, 5000);
    ranges.push(`${start}-${end}`);
    start = end + 1;
  }
  return ranges;
};

// GET /api/file-requests/ranges
const getRanges = (req, res) => {
  res.json({ success: true, ranges: buildFileRanges() });
};

// POST /api/file-requests
const submitRequest = async (req, res) => {
  try {
    const { oldFileId, requestedFileRange, lastCompletionDate } = req.body;
    if (!requestedFileRange) {
      return res.status(400).json({ success: false, message: 'Requested file range is required.' });
    }

    const request = await FileRequest.create({
      userId: req.user.id,
      username: req.user.username || req.user.name,
      oldFileId: oldFileId || null,
      requestedFileRange,
      lastCompletionDate: lastCompletionDate || null,
      status: 'pending'
    });

    const requestTime = new Date().toLocaleString();

    // Notify the company / admin mailbox.
    const companyEmail = process.env.COMPANY_EMAIL || process.env.ADMIN_EMAIL;
    if (companyEmail) {
      sendEmail({
        to: companyEmail,
        subject: 'New File Request Received',
        html: `
          <div style="font-family:Arial,sans-serif">
            <h3>New File Request Received</h3>
            <table style="font-size:14px">
              <tr><td><b>Username:</b></td><td>${request.username}</td></tr>
              <tr><td><b>Previous File ID:</b></td><td>${oldFileId || '—'}</td></tr>
              <tr><td><b>Requested File ID:</b></td><td>${requestedFileRange}</td></tr>
              <tr><td><b>Completion Date:</b></td><td>${lastCompletionDate || '—'}</td></tr>
              <tr><td><b>Request Time:</b></td><td>${requestTime}</td></tr>
            </table>
          </div>`
      }).catch(() => {});
    }

    notify({
      userId: req.user.id,
      title: 'File Request Submitted',
      message: `Your request for file range ${requestedFileRange} has been submitted and is pending approval.`,
      type: 'file',
      channels: ['in-app', 'email', 'whatsapp'],
      email: req.user.email,
      mobile: req.user.mobile,
      subject: 'Car Hive — File Request Received'
    }).catch(() => {});

    await logAudit({ action: 'FILE_REQUEST', details: `Requested file range ${requestedFileRange}`, userId: req.user.id, req });

    res.status(201).json({ success: true, message: 'File Request Submitted Successfully', request: normalize(request) });
  } catch (err) {
    console.error('Submit file request error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit file request.' });
  }
};

// GET /api/file-requests/my
const getMyRequests = async (req, res) => {
  try {
    const requests = await FileRequest.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, requests: normalize(requests) });
  } catch (err) {
    console.error('Get file requests error:', err);
    res.status(500).json({ success: false, message: 'Failed to load file requests.' });
  }
};

// GET /api/file-requests/:id/download
const downloadFile = async (req, res) => {
  try {
    const request = await FileRequest.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'This file request has not been approved.' });
    }

    // Access control: only the user who requested it or an admin can download it
    if (request.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { generateVehicleDataCSV } = require('../utils/csvGenerator');
    const csvContent = generateVehicleDataCSV(request.requestedFileRange);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Vehicle_Data_${request.requestedFileRange}.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('Download file error:', err);
    res.status(500).json({ success: false, message: 'Failed to download file.' });
  }
};

module.exports = { getRanges, submitRequest, getMyRequests, buildFileRanges, downloadFile };
