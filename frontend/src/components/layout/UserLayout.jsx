import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { FiGrid, FiList, FiPlusCircle, FiUser, FiBell, FiLogOut, FiMenu, FiX, FiSettings, FiShield, FiHelpCircle, FiBookmark, FiSend, FiBriefcase } from 'react-icons/fi';
import Logo from '../common/Logo';
import { ThemeToggle, Avatar } from '../common/UI';
import NotificationBell from '../user/NotificationBell';

const navItems = [
  { to: '/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/feed', icon: FiList, label: 'Feed' },
  { to: '/create-post', icon: FiPlusCircle, label: 'Create' },
  { to: '/bookmarks', icon: FiBookmark, label: 'Bookmarks' },
  { to: '/proposals', icon: FiBriefcase, label: 'Proposals' },
  { to: '/chat', icon: FiSend, label: 'Chat Desk' },
  { to: '/notifications', icon: FiBell, label: 'Activity' },
  { to: '/profile', icon: FiUser, label: 'Profile' },
  { to: '/support', icon: FiHelpCircle, label: 'Support Desk' },
  { to: '/settings', icon: FiSettings, label: 'Settings' },
];

const mobileNavItems = [
  { to: '/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/feed', icon: FiList, label: 'Feed' },
  { to: '/create-post', icon: FiPlusCircle, label: 'Create' },
  { to: '/chat', icon: FiSend, label: 'Chat' },
  { to: '/profile', icon: FiUser, label: 'Profile' },
];

const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'U';

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 md:z-auto
        w-56 flex flex-col
        border-r
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `} style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', height: '100vh' }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <Logo size={32} rounded={8} className="flex-shrink-0" />
          <span className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>FreelanceHub</span>
          <button className="ml-auto md:hidden" onClick={onClose} style={{ color: 'var(--text-muted)' }}><FiX size={18}/></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto px-0">
          <div className="px-4 mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Main</div>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <item.icon size={16} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: 'var(--neon)', fontSize: 10 }}>{item.badge}</span>
              )}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink to="/admin" onClick={onClose} className="nav-item" style={{ color: 'var(--purple)' }}>
              <FiShield size={16}/>
              <span>Admin Panel</span>
            </NavLink>
          )}

          <div className="px-4 mt-4 mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Session</div>
          <button onClick={handleLogout} className="nav-item w-full text-left" style={{ color: 'var(--red)' }}>
            <FiLogOut size={16}/>
            <span>Sign Out</span>
          </button>
        </nav>

        {/* User pill */}
        <div className="p-3 cursor-pointer" style={{ borderTop: '1px solid var(--border)' }} onClick={() => navigate('/profile')}>
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-bg-surface-2 transition-all" style={{ background: 'var(--bg-surface)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--neon), var(--purple))' }}>{initials}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</div>
              <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {user?.role === 'admin' ? 'Administrator' : 'Freelancer'}
              </div>
            </div>
            <FiSettings size={14} style={{ color: 'var(--text-muted)' }}/>
          </div>
        </div>
      </aside>
    </>
  );
};

export default function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
        {/* Mobile topbar */}
        <div className="flex md:hidden items-center justify-between px-4 py-2.5 sticky top-0 z-30"
          style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)' }}>
          {/* Left: Menu button */}
          <button onClick={() => setSidebarOpen(true)} style={{ color: 'var(--text-primary)' }} className="p-1 hover:bg-bg-surface-2 rounded-lg">
            <FiMenu size={20}/>
          </button>
          
          {/* Middle: Brand name & Logo */}
          <div className="flex items-center gap-2">
            <Logo size={24} rounded={6} />
            <span className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>FreelanceHub</span>
          </div>

          {/* Right: Theme Toggle, Notifications, Profile Avatar */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <button onClick={() => navigate('/profile')} className="ml-1 p-0.5 rounded-full hover:opacity-85 transition-opacity flex-shrink-0">
              <Avatar name={user?.name} src={user?.profileImage} size="sm" />
            </button>
          </div>
        </div>
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Outlet />
        </motion.div>
      </main>
      <nav className="mobile-bottom-nav md:hidden">
        <div className="mobile-bottom-inner">
          {mobileNavItems.map(item => {
            if (item.to === '/create-post') {
              return (
                <div key={item.to} className="flex-1 flex items-center justify-center">
                  <NavLink to={item.to} className={({ isActive }) => `bottom-action ${isActive ? 'active' : ''}`}>
                    <item.icon size={24} />
                  </NavLink>
                </div>
              );
            }
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
