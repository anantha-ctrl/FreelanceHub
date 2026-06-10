const { Announcement, User } = require('../models');
const { normalize } = require('../utils/dbUtils');
const { logAudit } = require('../utils/auditLogger');

// GET /api/announcements  (active announcements — for dashboard & home)
const getActive = async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    res.json({ success: true, announcements: normalize(announcements) });
  } catch (err) {
    console.error('Get announcements error:', err);
    res.status(500).json({ success: false, message: 'Failed to load announcements.' });
  }
};

// GET /api/announcements/all  (admin)
const getAll = async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'username'] }]
    });
    res.json({ success: true, announcements: normalize(announcements) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load announcements.' });
  }
};

// POST /api/announcements  (admin)
const create = async (req, res) => {
  try {
    const { title, body, priority } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required.' });
    }
    const announcement = await Announcement.create({
      title, body, priority: priority || 'normal', createdBy: req.user.id
    });
    await logAudit({ action: 'ANNOUNCEMENT_CREATE', details: `Announcement created: ${title}`, userId: req.user.id, req });
    res.status(201).json({ success: true, message: 'Announcement published.', announcement: normalize(announcement) });
  } catch (err) {
    console.error('Create announcement error:', err);
    res.status(500).json({ success: false, message: 'Failed to create announcement.' });
  }
};

// PUT /api/announcements/:id  (admin)
const update = async (req, res) => {
  try {
    const { title, body, priority, isActive } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (body !== undefined) updates.body = body;
    if (priority !== undefined) updates.priority = priority;
    if (isActive !== undefined) updates.isActive = isActive;
    await Announcement.update(updates, { where: { id: req.params.id } });
    res.json({ success: true, message: 'Announcement updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update announcement.' });
  }
};

// DELETE /api/announcements/:id  (admin)
const remove = async (req, res) => {
  try {
    await Announcement.destroy({ where: { id: req.params.id } });
    await logAudit({ action: 'ANNOUNCEMENT_DELETE', details: `Announcement ${req.params.id} deleted`, userId: req.user.id, req });
    res.json({ success: true, message: 'Announcement deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete announcement.' });
  }
};

module.exports = { getActive, getAll, create, update, remove };
