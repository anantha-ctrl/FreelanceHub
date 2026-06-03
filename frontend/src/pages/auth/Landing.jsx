import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiShield, FiGrid, FiClock, FiStar, FiUsers, FiCheckCircle } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';
import Logo from '../../components/common/Logo';

const features = [
  { icon: FiCheckCircle, title: 'Verified Posts',   desc: 'Every post is reviewed by admins before going live, ensuring quality talent.',     color: 'var(--green)' },
  { icon: FiGrid,        title: 'Instagram Feed',   desc: 'Infinite-scroll feed with likes, comments, and category filters.',               color: 'var(--neon)'  },
  { icon: FiClock,       title: 'Secure Sessions',  desc: '5-hour auto-expiring sessions with full activity logs and IP tracking.',         color: 'var(--amber)' },
  { icon: FiShield,      title: 'Admin Moderation', desc: 'Full admin panel for approvals, user management, and blocking.',                 color: 'var(--purple)'},
  { icon: FiUsers,       title: 'Freelancer Profiles', desc: 'Rich profiles with skills, portfolio images, and online status indicators.', color: 'var(--neon)'  },
  { icon: FiStar,        title: 'Role-Based Access','desc': 'Separate user and admin dashboards with protected routes.',                    color: 'var(--amber)' },
];

export default function Landing() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Nav */}
      <nav className="flex items-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Logo size={32} rounded={8} className="flex-shrink-0" />
        <span className="font-display font-bold text-sm sm:text-base flex-1 truncate" style={{ color: 'var(--text-primary)' }}>FreelanceHub</span>
        <button onClick={toggleTheme} className="btn-ghost p-1.5 md:p-2 rounded-lg flex-shrink-0">
          {isDark ? <FiSun size={15}/> : <FiMoon size={15}/>}
        </button>
        <Link to="/login" className="btn-ghost text-xs md:text-sm px-2.5 py-1.5 md:px-4 md:py-2 flex-shrink-0">Sign In</Link>
        <Link to="/register" className="btn-neon text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2 flex-shrink-0">Get Started</Link>
      </nav>

      {/* Hero */}
      <div className="text-center px-4 sm:px-6 pt-12 md:pt-20 pb-10 md:pb-16 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-5 md:mb-6"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--neon-light)' }}>
            ✦ The premium freelancer platform
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl leading-tight mb-4 md:mb-5" style={{ color: 'var(--text-primary)' }}>
            Where Top Freelancers<br/>
            <span className="gradient-text">Get Discovered</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg leading-relaxed mb-8 md:mb-10 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Post your skills, build your portfolio, and connect with clients — all inside a beautifully crafted platform with smart approval workflows and real-time moderation.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/register" className="btn-neon text-sm md:text-base px-6 md:px-8 py-2.5 md:py-3 rounded-xl md:rounded-2xl">
              <FiArrowRight size={16}/> Join Free — It's Open
            </Link>
            <Link to="/login" className="btn-ghost text-sm md:text-base px-6 md:px-8 py-2.5 md:py-3 rounded-xl md:rounded-2xl">
              Browse the Feed →
            </Link>
          </div>
          {/* Social proof */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 mt-8 md:mt-12 flex-wrap">
            {[['500+', 'Freelancers'], ['1,200+', 'Posts Published'], ['98%', 'Approval Rate']].map(([v, l]) => (
              <div key={l} className="text-center px-2">
                <div className="font-display font-bold text-lg sm:text-xl gradient-text">{v}</div>
                <div className="text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>{l}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Features */}
      <div className="px-4 sm:px-8 pb-12 md:pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="surface-card p-5 md:p-6">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center mb-3 md:mb-4"
                style={{ background: `${f.color}18`, color: f.color }}>
                <f.icon size={18}/>
              </div>
              <h3 className="font-display font-bold text-sm md:text-base mb-1.5 md:mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
              <p className="text-xs md:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8 text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
        © 2025 FreelanceHub · Designed and Developed by <a href="https://cloudhawk.in" target="_blank" rel="noreferrer">CloudHawk</a>
      </div>
    </div>
  );
}
