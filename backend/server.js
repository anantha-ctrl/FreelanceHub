const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const xssClean = require('xss-clean');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const logRoutes = require('./routes/logRoutes');
const supportRoutes = require('./routes/supportRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const messageRoutes = require('./routes/messageRoutes');
// ─── Car Hive domain routes ───
const adRoutes = require('./routes/adRoutes');
const reportRoutes = require('./routes/reportRoutes');
const fileRequestRoutes = require('./routes/fileRequestRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const carAdminRoutes = require('./routes/carAdminRoutes');
const { seedAdmin, seedAnnouncements } = require('./config/seed');
const { connectDatabase, sequelize } = require('./config/database');
const { ensureCarHiveSchema } = require('./config/ensureSchema');

const app = express();

app.use(helmet());
app.use(xssClean());
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 500 : 5000,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 200,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

app.use('/api/', limiter);
app.use(['/api/auth/login', '/api/auth/register', '/api/auth/logout'], authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Serve locally-stored post/profile images (Cloudinary fallback).
// Allow the frontend origin (:3000) to load these images despite Helmet's
// default Cross-Origin-Resource-Policy: same-origin.
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/messages', messageRoutes);
// ─── Car Hive domain ───
app.use('/api/ads', adRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/file-requests', fileRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/car-admin', carAdminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Car Hive API is running', timestamp: new Date() });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

connectDatabase()
  .then(async () => {
    console.log('✅ MySQL connected');
    await sequelize.sync();
    // sequelize.sync() creates new tables but does not add columns to the
    // existing `users` table — patch in the Car Hive columns explicitly.
    await ensureCarHiveSchema(sequelize);
    await seedAdmin();
    await seedAnnouncements();
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`🚀 FreelanceHub API Server running on port ${PORT}`);
      
      // Periodic background task to sweep and mark expired freelancer sessions (> 5 hours)
      setInterval(async () => {
        try {
          const { LoginLog, User } = require('./models');
          const { Op } = require('sequelize');
          const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
          
          const activeLogs = await LoginLog.findAll({
            where: {
              sessionStatus: 'active',
              loginTime: { [Op.lt]: fiveHoursAgo }
            },
            include: [{ model: User, as: 'user', where: { role: 'user' } }]
          });
          
          for (const log of activeLogs) {
            log.sessionStatus = 'expired';
            log.logoutTime = new Date(log.loginTime.getTime() + 5 * 60 * 60 * 1000);
            await log.save();
            console.log(`[SESSION] Session ${log.tokenId} for user ${log.userId} automatically expired in database.`);
          }
        } catch (err) {
          console.error('[SESSION] Background cleanup error:', err.message);
        }
      }, 10000);
    });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });

// Force nodemon reload
module.exports = app;
