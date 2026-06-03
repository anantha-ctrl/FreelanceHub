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
const { seedAdmin } = require('./config/seed');
const { connectDatabase, sequelize } = require('./config/database');

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

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'FreelanceHub API is running', timestamp: new Date() });
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
    await seedAdmin();
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`🚀 FreelanceHub API Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
