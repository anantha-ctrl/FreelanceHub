const { User, Announcement } = require('../models');

const seedAdmin = async () => {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@freelancehub.com';
    const existing = await User.findOne({ where: { email } });
    if (!existing) {
      await User.create({
        name: 'Admin',
        username: 'admin',
        email,
        mobile: '+91 9876543234',
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
        role: 'admin'
      });
      console.log('✅ Admin user seeded:', email);
    } else if (!existing.username) {
      // Backfill username for a pre-existing admin row.
      existing.username = 'admin';
      await existing.save();
    }
  } catch (err) {
    console.error('Seed admin error:', err.message);
  }
};

const seedAnnouncements = async () => {
  try {
    const count = await Announcement.count();
    if (count === 0) {
      await Announcement.bulkCreate([
        {
          title: 'Welcome to Car Hive Freelancer Platform',
          body: 'Post vehicle advertisements, manage your listings, submit daily reports, and receive new file assignments — all from one dashboard.',
          priority: 'high'
        },
        {
          title: 'New File Assignment Ranges Available',
          body: 'File ranges from 1-150 up to 4951-5000 are now open for request. Submit a New File Request from your dashboard once your current file is complete.',
          priority: 'normal'
        },
        {
          title: 'Daily Report Reminder',
          body: 'Please remember to submit your daily report before end of day to keep your file assignments active.',
          priority: 'normal'
        }
      ]);
      console.log('✅ Sample announcements seeded');
    }
  } catch (err) {
    console.error('Seed announcements error:', err.message);
  }
};

module.exports = { seedAdmin, seedAnnouncements };
