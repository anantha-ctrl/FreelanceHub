import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiArrowRight, 
  FiShield, 
  FiGrid, 
  FiClock, 
  FiStar, 
  FiUsers, 
  FiCheckCircle, 
  FiBookmark, 
  FiSend, 
  FiBriefcase, 
  FiHelpCircle,
  FiSun,
  FiMoon 
} from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/common/Logo';

const features = [
  { 
    icon: FiCheckCircle, 
    title: 'Verified Posts', 
    desc: 'Every project post undergoes mandatory admin review before going live, keeping spam away.', 
    color: 'var(--green)' 
  },
  { 
    icon: FiGrid, 
    title: 'Instagram Feed', 
    desc: 'Infinite-scroll feed with filters, immediate likes, and inline interactive comment sections.', 
    color: 'var(--neon)' 
  },
  { 
    icon: FiSend, 
    title: 'Real-Time Chat', 
    desc: 'Message other freelancers and clients instantly with our integrated direct messaging desk.', 
    color: 'var(--neon-light)' 
  },
  { 
    icon: FiBriefcase, 
    title: 'Smart Proposals', 
    desc: 'Apply directly to project listings, outline your rates/timeline, and track bid statuses.', 
    color: 'var(--purple)' 
  },
  { 
    icon: FiBookmark, 
    title: 'Saved Bookmarks', 
    desc: 'Bookmark listings and portfolios to your private board for quick retrieval later.', 
    color: 'var(--amber)' 
  },
  { 
    icon: FiHelpCircle, 
    title: 'Support Desk', 
    desc: 'Submit ticket inquiries directly to system admins and communicate until resolved.', 
    color: 'var(--purple)' 
  },
  { 
    icon: FiShield, 
    title: 'Admin Moderation', 
    desc: 'Admin console for managing users, approving posts, blocking accounts, and exporting csv logs.', 
    color: 'var(--red)' 
  },
  { 
    icon: FiUsers, 
    title: 'Freelancer Profiles', 
    desc: 'Showcase skills tags, bio, portfolio images, and broadcast active/offline online status.', 
    color: 'var(--green)' 
  },
  { 
    icon: FiClock, 
    title: 'Secure Sessions', 
    desc: 'Strict 5-hour auto-expiring user sessions combined with complete device and IP logging.', 
    color: 'var(--amber)' 
  },
  { 
    icon: FiStar, 
    title: 'Role-Based Access', 
    desc: 'Dedicated interfaces and router guards for administrators and standard users.', 
    color: 'var(--neon)' 
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

export default function Landing() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[10%] w-[50vw] h-[50vw] rounded-full pointer-events-none opacity-20 filter blur-[120px]" 
        style={{ background: 'radial-gradient(circle, var(--neon) 0%, transparent 70%)' }} />
      <div className="absolute top-[40%] right-[5%] w-[40vw] h-[40vw] rounded-full pointer-events-none opacity-25 filter blur-[120px]" 
        style={{ background: 'radial-gradient(circle, var(--purple) 0%, transparent 70%)' }} />

      {/* Nav */}
      <nav className="flex items-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 sticky top-0 z-50" 
        style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <Logo size={32} rounded={8} className="flex-shrink-0 animate-pulse" />
        <span className="font-display font-extrabold text-sm sm:text-base flex-1 truncate" style={{ color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>FreelanceHub</span>
        <button onClick={toggleTheme} className="btn-ghost p-1.5 md:p-2 rounded-lg flex-shrink-0" aria-label="Toggle Theme">
          {isDark ? <FiSun size={15}/> : <FiMoon size={15}/>}
        </button>
        <Link to="/login" className="btn-ghost text-xs md:text-sm px-2.5 py-1.5 md:px-4 md:py-2 flex-shrink-0">Sign In</Link>
        <Link to="/register" className="btn-neon text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2 flex-shrink-0">Get Started</Link>
      </nav>

      {/* Hero */}
      <div className="text-center px-4 sm:px-6 pt-12 md:pt-20 pb-10 md:pb-16 max-w-4xl mx-auto relative z-10">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          <motion.div 
            variants={itemVariants} 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-5 md:mb-6 border"
            style={{ 
              background: 'var(--bg-surface-2)', 
              borderColor: 'var(--border-neon)', 
              color: 'var(--neon-light)',
              boxShadow: 'var(--shadow-neon)'
            }}
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            ✦ The premium freelancer platform
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl leading-tight mb-4 md:mb-6" 
            style={{ color: 'var(--text-primary)', letterSpacing: '-1.5px' }}
          >
            Where Top Freelancers<br/>
            <span className="gradient-text">Connect & Collaborate</span>
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-sm sm:text-base md:text-lg leading-relaxed mb-8 md:mb-10 max-w-2xl mx-auto" 
            style={{ color: 'var(--text-secondary)' }}
          >
            Showcase your portfolio, apply to verified jobs, message clients in real-time, and bookmark your favorite posts—all within a secure, beautifully-designed platform featuring active moderation.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex items-center justify-center gap-3 flex-wrap"
          >
            <Link to="/register" className="btn-neon text-sm md:text-base px-6 md:px-8 py-2.5 md:py-3 rounded-xl md:rounded-2xl shadow-lg hover:shadow-blue-500/20">
              Get Started <FiArrowRight size={16} className="ml-1" />
            </Link>
            <Link to="/login" className="btn-ghost text-sm md:text-base px-6 md:px-8 py-2.5 md:py-3 rounded-xl md:rounded-2xl">
              Browse the Feed →
            </Link>
          </motion.div>

          {/* Social proof / Stats grid */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 md:mt-16 w-full max-w-3xl"
          >
            {[
              { val: '500+', label: 'Verified Freelancers', desc: 'Active experts', color: 'var(--neon)' },
              { val: '1,200+', label: 'Posts Published', desc: 'Curated projects', color: 'var(--green)' },
              { val: '98%', label: 'Approval Rate', desc: 'Moderated feed', color: 'var(--amber)' },
              { val: '5h', label: 'Session Security', desc: 'Active-session timeout', color: 'var(--purple)' }
            ].map((stat) => (
              <div 
                key={stat.label} 
                className="surface-card p-4 text-center border-t-2 transition-transform duration-300 hover:scale-105" 
                style={{ borderTopColor: stat.color }}
              >
                <div className="font-display font-extrabold text-xl sm:text-2xl gradient-text">{stat.val}</div>
                <div className="text-[10px] sm:text-xs font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{stat.label}</div>
                <div className="text-[9px] sm:text-[10px]" style={{ color: 'var(--text-muted)' }}>{stat.desc}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Features Grid Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14 px-4 mt-8 md:mt-16 relative z-10">
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--neon-light)' }}>Platform Capabilities</div>
        <h2 className="font-display font-bold text-2xl sm:text-4xl" style={{ color: 'var(--text-primary)' }}>Everything You Need to Scale</h2>
        <p className="text-xs sm:text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>Explore advanced features built specifically to make freelancing and hiring seamless.</p>
      </div>

      {/* Features Showcase */}
      <div className="px-4 sm:px-8 pb-12 md:pb-16 max-w-6xl mx-auto relative z-10">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((f) => (
            <motion.div 
              key={f.title} 
              variants={itemVariants}
              whileHover={{ 
                y: -6, 
                borderColor: 'var(--border-neon)',
                boxShadow: 'var(--shadow-neon)'
              }}
              className="surface-card p-5 md:p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group border"
              style={{ borderColor: 'var(--border)' }}
            >
              <div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${f.color}15`, color: f.color, border: `1px solid ${f.color}25` }}>
                  <f.icon size={20}/>
                </div>
                <h3 className="font-display font-bold text-sm md:text-base mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                <p className="text-xs md:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              </div>
              <div 
                className="absolute top-0 left-0 w-full h-[2px] opacity-20" 
                style={{ background: `linear-gradient(90deg, ${f.color}, transparent)` }} 
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom CTA Banner */}
      <div className="px-4 sm:px-8 pb-16 md:pb-24 max-w-5xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="surface-card p-8 md:p-14 text-center relative overflow-hidden border"
          style={{
            background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-surface))',
            borderColor: 'var(--border-neon)'
          }}
        >
          <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-blue-500/5 blur-[80px] pointer-events-none" />
          <h2 className="font-display font-bold text-2xl sm:text-3xl mb-4" style={{ color: 'var(--text-primary)' }}>
            Curious to See It in Action?
          </h2>
          <p className="text-xs sm:text-sm max-w-lg mx-auto mb-8" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Build your professional identity, find curated job listings, and connect with global talent. Registration is 100% free and instant.
          </p>
          <Link to="/register" className="btn-neon text-sm md:text-base px-8 py-3 rounded-xl shadow-lg hover:shadow-blue-500/20">
            Create Your Account <FiArrowRight size={16} className="ml-1" />
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8 text-[10px] sm:text-xs relative z-10" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
        © 2026 FreelanceHub · Designed and Developed by <a href="https://cloudhawk.in" target="_blank" rel="noreferrer" className="hover:text-neon transition-colors">CloudHawk</a>
      </div>
    </div>
  );
}

