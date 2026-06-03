const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { User, LoginLog } = require('../models');
const { normalize } = require('../utils/dbUtils');

const generateToken = (userId, tokenId, expiresIn) => {
  const options = {};
  // Admins pass no expiry → token never expires (no session logout).
  if (expiresIn) options.expiresIn = expiresIn;
  return jwt.sign({ id: userId, tokenId }, process.env.JWT_SECRET, options);
};

// Build a browser-loadable URL for an uploaded avatar (Cloudinary URL or local /uploads).
const fileUrl = (req, file) => {
  if (!file) return null;
  if (file.path && /^https?:\/\//i.test(file.path)) return file.path;
  return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
};

const getClientInfo = (req) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';
  const ua = req.headers['user-agent'] || 'Unknown';
  return { ip: ip.split(',')[0].trim(), ua };
};

const register = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim()?.toLowerCase();
    const mobile = req.body.mobile?.trim();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({ name, email, mobile, password });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please login.',
      user: { _id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed.' });
  }
};

const login = async (req, res) => {
  try {
    const email = req.body.email?.trim()?.toLowerCase();
    const { password } = req.body;
    const { ip, ua } = getClientInfo(req);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.scope('withPassword').findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Contact support.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const tokenId = uuidv4();
    const isAdmin = user.role === 'admin';
    const token = generateToken(user.id, tokenId, isAdmin ? null : (process.env.JWT_EXPIRES_IN || '5h'));

    await LoginLog.update(
      { logoutTime: new Date(), sessionStatus: 'expired' },
      { where: { userId: user.id, sessionStatus: 'active' } }
    );

    await LoginLog.create({
      userId: user.id,
      loginTime: new Date(),
      sessionStatus: 'active',
      ipAddress: ip,
      deviceInfo: ua.substring(0, 200),
      tokenId
    });

    await User.update({ isOnline: true, lastSeen: new Date() }, { where: { id: user.id } });

    const safeUser = normalize(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: isAdmin ? 365 * 24 * 60 * 60 * 1000 : 5 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser,
      // Admins have no session timeout; users expire after 5 hours.
      sessionExpiresIn: isAdmin ? null : 5 * 60 * 60 * 1000
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
};

const logout = async (req, res) => {
  try {
    await LoginLog.update(
      { logoutTime: new Date(), sessionStatus: 'manual_logout' },
      { where: { tokenId: req.tokenId, sessionStatus: 'active' } }
    );

    await User.update({ isOnline: false, lastSeen: new Date() }, { where: { id: req.user.id } });

    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Logout failed.' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json({ success: true, user: normalize(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, mobile, bio, skills, theme, notifReadAt } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (mobile) updates.mobile = mobile;
    if (bio !== undefined) updates.bio = bio;
    if (skills) {
      updates.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
    }
    if (theme) updates.theme = theme;
    if (notifReadAt !== undefined) updates.notifReadAt = notifReadAt;
    
    if (req.file) {
      updates.profileImage = fileUrl(req, req.file);
      updates.profileImagePublicId = req.file.filename;
    }

    await User.update(updates, { where: { id: req.user.id } });
    const user = await User.findByPk(req.user.id);
    res.json({ success: true, message: 'Profile updated.', user: normalize(user) });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Profile update failed.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.scope('withPassword').findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Password change failed.' });
  }
};

module.exports = { register, login, logout, getMe, updateProfile, changePassword };
