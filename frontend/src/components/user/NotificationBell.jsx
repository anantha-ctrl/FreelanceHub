import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { notificationAPI } from '../../utils/api';

const relTime = (iso) => {
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

const ICONS = { success: '✅', warning: '⚠️', ad: '🚗', report: '📄', file: '📁', announcement: '📢', system: '⚙️', info: '🔔' };

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const r = await notificationAPI.getMine();
      setNotifications(r.data.notifications || []);
      setUnread(r.data.unread || 0);
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 25000);
    return () => clearInterval(id);
  }, [load]);

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setUnread(0);
      setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
        style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}
        title="Notifications">
        <FiBell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-white font-bold"
            style={{ background: 'var(--red)', fontSize: 10 }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 rounded-xl overflow-hidden shadow-xl"
            style={{ width: 340, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Notifications</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs font-medium" style={{ color: 'var(--neon)' }}>Mark all read</button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No notifications yet.</div>
              ) : (
                notifications.slice(0, 8).map((n) => (
                  <div key={n._id} className="flex items-start gap-3 px-4 py-3"
                    style={{ borderBottom: '1px solid var(--border)', background: !n.isRead ? 'rgba(59,130,246,0.04)' : 'transparent' }}>
                    <span className="text-base flex-shrink-0 mt-0.5">{ICONS[n.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{relTime(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: 'var(--neon)' }} />}
                  </div>
                ))
              )}
            </div>

            <button onClick={() => { setOpen(false); navigate('/notifications'); }}
              className="w-full px-4 py-3 text-xs font-semibold text-center transition-colors"
              style={{ color: 'var(--neon)', background: 'var(--bg-surface)' }}>
              View all notifications
            </button>
          </div>
        </>
      )}
    </div>
  );
}
