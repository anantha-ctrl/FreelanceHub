const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { User, LoginLog } = require('../models');
const { normalize } = require('../utils/dbUtils');
const { notify } = require('../services/notificationService');
const { logAudit } = require('../utils/auditLogger');

// Password policy: min 8 chars, at least one letter and one number.
const isStrongPassword = (pwd) =>
  typeof pwd === 'string' && pwd.length >= 8 && /[A-Za-z]/.test(pwd) && /[0-9]/.test(pwd);

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
    const username = req.body.username?.trim();
    const email = req.body.email?.trim()?.toLowerCase();
    const mobile = req.body.mobile?.trim();
    const address = req.body.address?.trim() || '';
    const dob = req.body.dob || null;
    const { password, confirmPassword } = req.body;

    // ─── Required fields ───
    if (!name || !username || !email || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    // ─── Password strength + match ───
    if (!isStrongPassword(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and include letters and numbers.' });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // ─── Uniqueness: username, email, mobile ───
    const clash = await User.findOne({
      where: { [Op.or]: [{ email }, { username }, { mobile }] }
    });
    if (clash) {
      let field = 'Email';
      if (clash.username && clash.username === username) field = 'Username';
      else if (clash.mobile === mobile) field = 'Mobile number';
      else if (clash.email === email) field = 'Email';
      return res.status(400).json({ success: false, message: `${field} is already registered.` });
    }

    const user = await User.create({ name, username, email, mobile, address, dob, password });

    // ─── Welcome notifications (email + SMS + WhatsApp + in-app) ───
    notify({
      userId: user.id,
      title: 'Welcome to Car Hive 🚗',
      message: `Hi ${name}, your Car Hive Freelancer account (@${username}) has been created successfully. You can now post vehicle ads, submit daily reports, and request new file assignments.`,
      type: 'success',
      channels: ['in-app', 'email', 'sms', 'whatsapp'],
      email,
      mobile,
      subject: 'Welcome to Car Hive Freelancer Platform',
      emailHtml: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
          <h2 style="color:#3b82f6">Welcome to Car Hive, ${name}!</h2>
          <p>Your freelancer account has been created successfully.</p>
          <table style="font-size:14px;color:#333">
            <tr><td><b>Username:</b></td><td>${username}</td></tr>
            <tr><td><b>Email:</b></td><td>${email}</td></tr>
            <tr><td><b>Mobile:</b></td><td>${mobile}</td></tr>
          </table>
          <p>You can now log in and start posting vehicle advertisements, submitting daily reports, and requesting new file assignments.</p>
          <p style="color:#888;font-size:12px">— Car Hive Freelancer Platform</p>
        </div>`
    }).catch(() => {});

    logAudit({ action: 'REGISTER', details: `New freelancer registered: @${username} (${email})`, userId: user.id, req });

    res.status(201).json({
      success: true,
      message: 'Registration Successful',
      user: { _id: user.id, name: user.name, username: user.username, email: user.email }
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      const f = err.errors?.[0]?.path || 'field';
      const label = f.includes('username') ? 'Username' : f.includes('mobile') ? 'Mobile number' : 'Email';
      return res.status(400).json({ success: false, message: `${label} is already registered.` });
    }
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ success: false, message: err.errors.map(e => e.message)[0] });
    }
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed.' });
  }
};

// GET /api/auth/username-available?username=foo
// Real-time uniqueness check used by the registration form. When the requested
// username is taken it returns a free suggestion (base + random digits).
const checkUsername = async (req, res) => {
  try {
    const username = (req.query.username || '').trim();
    if (username.length < 3) {
      return res.json({ success: true, available: false, tooShort: true, message: 'Username must be at least 3 characters.' });
    }
    const existing = await User.findOne({ where: { username } });
    if (!existing) {
      return res.json({ success: true, available: true });
    }
    // Find a free suggestion based on the requested name.
    let suggestion = '';
    for (let i = 0; i < 50; i++) {
      const cand = `${username}${Math.floor(100 + Math.random() * 900)}`;
      // eslint-disable-next-line no-await-in-loop
      const taken = await User.findOne({ where: { username: cand } });
      if (!taken) { suggestion = cand; break; }
    }
    return res.json({ success: true, available: false, suggestion });
  } catch (err) {
    console.error('Check username error:', err);
    res.status(500).json({ success: false, message: 'Failed to check username.' });
  }
};

const login = async (req, res) => {
  try {
    // Accept login by username OR email (Car Hive uses username).
    const identifier = (req.body.username || req.body.email || req.body.identifier || '').trim();
    const { password } = req.body;
    const { ip, ua } = getClientInfo(req);

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Username/email and password are required.' });
    }

    const lower = identifier.toLowerCase();
    const user = await User.scope('withPassword').findOne({
      where: { [Op.or]: [{ email: lower }, { username: identifier }] }
    });
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
    if (!req.user) {
      return res.json({ success: false, message: 'Not authenticated.' });
    }
    const user = await User.findByPk(req.user.id);
    res.json({ 
      success: true, 
      user: normalize(user),
      sessionExpiry: req.tokenExpiry
    });
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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.scope('withPassword').findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link was sent.' });
    }

    // Generate token signed with user's current password hash + JWT_SECRET
    const secret = process.env.JWT_SECRET + user.password;
    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '15m' });

    // Return the reset link in the response for development testing convenience
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}&id=${user.id}`;
    
    console.log('----------------------------------------');
    console.log(`Password reset requested for ${user.email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('----------------------------------------');

    res.json({
      success: true,
      message: 'Password reset link generated successfully.',
      resetUrl
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Failed to request password reset.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id, token, newPassword } = req.body;
    if (!id || !token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    const user = await User.scope('withPassword').findByPk(id);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link.' });
    }

    // Verify token using user's current password hash + JWT_SECRET
    const secret = process.env.JWT_SECRET + user.password;
    try {
      jwt.verify(token, secret);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    // Update password (triggers Sequelize hooks)
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

module.exports = { register, login, logout, getMe, updateProfile, changePassword, forgotPassword, resetPassword, checkUsername };
