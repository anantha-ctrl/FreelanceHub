import React, { useEffect, useState } from 'react';
import { FiCheck } from 'react-icons/fi';
import { notificationAPI } from '../../utils/api';
import { PageHeader, Card, Button, EmptyState } from '../../components/common/UI';

const ICONS = { success: '✅', warning: '⚠️', ad: '🚗', report: '📄', file: '📁', announcement: '📢', system: '⚙️', info: '🔔' };
const fmt = (d) => new Date(d).toLocaleString();

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => notificationAPI.getMine()
    .then(r => setItems(r.data.notifications || []))
    .catch(() => {})
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const markAll = async () => {
    await notificationAPI.markAllRead();
    setItems(items.map(n => ({ ...n, isRead: true })));
  };

  const markOne = async (id) => {
    await notificationAPI.markRead(id);
    setItems(items.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  return (
    <div>
      <PageHeader title="Notification Center" subtitle="Email, SMS, WhatsApp & in-app notifications">
        <Button variant="ghost" onClick={markAll}><FiCheck size={14} /> Mark all read</Button>
      </PageHeader>
      <div className="p-4 sm:p-6 space-y-3 max-w-3xl">
        {!loading && items.length === 0 && (
          <Card><EmptyState icon="🔔" title="No notifications" description="You're all caught up." /></Card>
        )}
        {items.map(n => (
          <Card key={n._id} className={n.isRead ? '' : 'border-l-2'}>
            <div className="flex items-start gap-3" style={!n.isRead ? { borderLeftColor: 'var(--neon)' } : {}}>
              <span className="text-xl flex-shrink-0">{ICONS[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{n.title}</span>
                  {!n.isRead && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--neon)' }} />}
                </div>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmt(n.createdAt)}</span>
                  <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}>{n.channels}</span>
                  {!n.isRead && <button onClick={() => markOne(n._id)} className="text-xs" style={{ color: 'var(--neon)' }}>Mark read</button>}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
