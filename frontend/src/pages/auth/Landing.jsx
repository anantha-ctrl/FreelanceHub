import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowRight, FiTruck, FiFileText, FiClipboard, FiBell, FiShield, FiClock,
  FiTrendingUp, FiDollarSign, FiCheckCircle, FiMail, FiPhone, FiMapPin,
  FiSun, FiMoon, FiMessageCircle
} from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { announcementAPI } from '../../utils/api';
import Logo from '../../components/common/Logo';

const features = [
  { icon: FiTruck, title: 'Post Vehicle Ads', desc: 'List new and second-hand vehicles with detailed specs, pricing, and registration data.', color: 'var(--neon)' },
  { icon: FiClipboard, title: 'Manage Listings', desc: 'View, search, filter, export and delete your advertisements from a single My Ads workspace.', color: 'var(--green)' },
  { icon: FiFileText, title: 'Daily Reports', desc: 'Submit daily work reports tracking forms completed today and till date in seconds.', color: 'var(--purple)' },
  { icon: FiClock, title: 'New File Requests', desc: 'Request the next file range (1-150 up to 4951-5000) and notify the company instantly.', color: 'var(--amber)' },
  { icon: FiBell, title: 'Multi-Channel Alerts', desc: 'Email, SMS, WhatsApp and in-app notifications keep you updated at every step.', color: 'var(--neon-light)' },
  { icon: FiShield, title: 'Secure & Role-Based', desc: 'JWT auth, password hashing, activity logs and dedicated admin / freelancer access.', color: 'var(--red)' },
];

const benefits = [
  { icon: FiTrendingUp, title: 'Work at Your Own Pace', desc: 'Pick up file assignments and submit reports on a flexible schedule.' },
  { icon: FiDollarSign, title: 'Transparent Tracking', desc: 'Every ad, report and request is logged with a clear audit trail.' },
  { icon: FiCheckCircle, title: 'Instant Confirmation', desc: 'Receive immediate confirmation across email, SMS and WhatsApp.' },
  { icon: FiClock, title: 'Quick Onboarding', desc: 'Register in minutes and start posting advertisements right away.' },
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 25 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } } };

export default function Landing() {
  const { isDark, toggleTheme } = useTheme();
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    announcementAPI.getActive().then(res => setAnnouncements(res.data.announcements || [])).catch(() => {});
  }, []);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="absolute top-[-10%] left-[10%] w-[50vw] h-[50vw] rounded-full pointer-events-none opacity-20 filter blur-[120px]"
        style={{ background: 'radial-gradient(circle, var(--neon) 0%, transparent 70%)' }} />
      <div className="absolute top-[40%] right-[5%] w-[40vw] h-[40vw] rounded-full pointer-events-none opacity-25 filter blur-[120px]"
        style={{ background: 'radial-gradient(circle, var(--purple) 0%, transparent 70%)' }} />

      {/* Nav */}
      <nav className="flex items-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 sticky top-0 z-50"
        style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(16px)' }}>
        <Logo size={32} rounded={8} className="flex-shrink-0" />
        <span className="font-display font-extrabold text-sm sm:text-base flex-1 truncate" style={{ color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Car Hive</span>
        <button onClick={toggleTheme} className="btn-ghost p-1.5 md:p-2 rounded-lg flex-shrink-0" aria-label="Toggle Theme">
          {isDark ? <FiSun size={15}/> : <FiMoon size={15}/>}
        </button>
        <Link to="/login" className="btn-ghost text-xs md:text-sm px-2.5 py-1.5 md:px-4 md:py-2 flex-shrink-0">Login</Link>
        <Link to="/register" className="btn-neon text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2 flex-shrink-0">Register</Link>
      </nav>

      {/* Hero */}
      <div className="text-center px-4 sm:px-6 pt-12 md:pt-20 pb-10 md:pb-16 max-w-4xl mx-auto relative z-10">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col items-center">
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-5 md:mb-6 border"
            style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border-neon)', color: 'var(--neon-light)', boxShadow: 'var(--shadow-neon)' }}>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            🚗 The vehicle advertisement freelancer platform
          </motion.div>

          <motion.h1 variants={itemVariants} className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl leading-tight mb-4 md:mb-6"
            style={{ color: 'var(--text-primary)', letterSpacing: '-1.5px' }}>
            Welcome to <span className="gradient-text">Car Hive</span><br/>Freelancer Platform
          </motion.h1>

          <motion.p variants={itemVariants} className="text-sm sm:text-base md:text-lg leading-relaxed mb-8 md:mb-10 max-w-2xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}>
            Post vehicle advertisements, manage your listings, submit daily reports, and receive new file assignments through a single platform.
          </motion.p>

          <motion.div variants={itemVariants} className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/register" className="btn-neon text-sm md:text-base px-6 md:px-8 py-2.5 md:py-3 rounded-xl shadow-lg">
              Register Now <FiArrowRight size={16} className="ml-1" />
            </Link>
            <Link to="/login" className="btn-ghost text-sm md:text-base px-6 md:px-8 py-2.5 md:py-3 rounded-xl">
              Login →
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Platform Features */}
      <div id="features" className="text-center max-w-2xl mx-auto mb-10 md:mb-14 px-4 mt-8 md:mt-16 relative z-10">
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--neon-light)' }}>Platform Features</div>
        <h2 className="font-display font-bold text-2xl sm:text-4xl" style={{ color: 'var(--text-primary)' }}>Everything in One Platform</h2>
      </div>
      <div className="px-4 sm:px-8 pb-12 md:pb-16 max-w-6xl mx-auto relative z-10">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <motion.div key={f.title} variants={itemVariants} whileHover={{ y: -6 }}
              className="surface-card p-5 md:p-6 transition-all duration-300 border" style={{ borderColor: 'var(--border)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${f.color}15`, color: f.color, border: `1px solid ${f.color}25` }}>
                <f.icon size={20}/>
              </div>
              <h3 className="font-display font-bold text-sm md:text-base mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
              <p className="text-xs md:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Freelancer Benefits */}
      <div className="px-4 sm:px-8 py-12 md:py-16 max-w-5xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--neon-light)' }}>Freelancer Benefits</div>
          <h2 className="font-display font-bold text-2xl sm:text-4xl" style={{ color: 'var(--text-primary)' }}>Why Join Car Hive</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {benefits.map((b) => (
            <div key={b.title} className="surface-card p-5 text-center border" style={{ borderColor: 'var(--border)' }}>
              <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--neon)' }}>
                <b.icon size={22}/>
              </div>
              <h3 className="font-display font-bold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{b.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Announcements */}
      <div className="px-4 sm:px-8 py-8 md:py-12 max-w-4xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--neon-light)' }}>Recent Announcements</div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>Latest Updates</h2>
        </div>
        <div className="space-y-3">
          {announcements.length === 0 && (
            <div className="surface-card p-5 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No announcements yet.</div>
          )}
          {announcements.map((a) => (
            <div key={a._id} className="surface-card p-4 flex gap-3 items-start border" style={{ borderColor: 'var(--border)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: a.priority === 'high' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)', color: a.priority === 'high' ? 'var(--red)' : 'var(--neon)' }}>
                <FiBell size={16}/>
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{a.title}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{a.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="px-4 sm:px-8 py-12 md:py-16 max-w-5xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--neon-light)' }}>Contact Information</div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>Get in Touch</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: FiMail, label: 'Email', value: 'support@carhive.com' },
            { icon: FiPhone, label: 'Phone', value: '+91 98765 43210' },
            { icon: FiMapPin, label: 'Address', value: 'Car Hive HQ, Bengaluru, India' },
          ].map((c) => (
            <div key={c.label} className="surface-card p-5 text-center border" style={{ borderColor: 'var(--border)' }}>
              <c.icon size={20} style={{ color: 'var(--neon)' }} className="mx-auto mb-3"/>
              <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>{c.label}</div>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 sm:px-8 pb-16 md:pb-24 max-w-5xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="surface-card p-8 md:p-14 text-center relative overflow-hidden border"
          style={{ background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-surface))', borderColor: 'var(--border-neon)' }}>
          <h2 className="font-display font-bold text-2xl sm:text-3xl mb-4" style={{ color: 'var(--text-primary)' }}>Ready to Start?</h2>
          <p className="text-xs sm:text-sm max-w-lg mx-auto mb-8" style={{ color: 'var(--text-secondary)' }}>
            Register your freelancer account and start posting vehicle advertisements today.
          </p>
          <Link to="/register" className="btn-neon text-sm md:text-base px-8 py-3 rounded-xl">
            Create Your Account <FiArrowRight size={16} className="ml-1" />
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Logo size={24} rounded={6} />
            <span className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Car Hive Freelancer Platform</span>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Link to="/login" style={{ color: 'var(--text-muted)' }}>Login</Link>
            <Link to="/register" style={{ color: 'var(--text-muted)' }}>Register</Link>
            <a href="mailto:support@carhive.com" className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><FiMessageCircle size={12}/> Support</a>
          </div>
        </div>
        <div className="text-center pb-6 text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>
          © 2026 Car Hive Freelancer Platform · All rights reserved
        </div>
      </footer>
    </div>
  );
}
