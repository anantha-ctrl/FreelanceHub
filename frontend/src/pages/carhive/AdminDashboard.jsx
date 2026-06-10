import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  FiUsers, FiTruck, FiFileText, FiFolder, FiTrash2, FiCheck, FiX,
  FiSend, FiBell, FiPlus, FiActivity, FiBarChart2
} from 'react-icons/fi';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart
} from 'recharts';
import { carAdminAPI, announcementAPI } from '../../utils/api';
import { PageHeader, StatCard, Card, Table, Tr, Td, Badge, Button, Input, Textarea, Select, Modal } from '../../components/common/UI';

const fmt = (d) => d ? new Date(d).toLocaleDateString() : '—';
const TABS = ['Overview', 'Analytics', 'Advertisements', 'Daily Reports', 'File Requests', 'Announcements', 'Broadcast'];

// ─── Custom Chart Tooltip ───
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.95)',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      borderRadius: 12,
      padding: '12px 16px',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
    }}>
      {label && <p style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || '#e2e8f0', fontSize: 13, margin: '3px 0', fontWeight: 500 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: entry.color, marginRight: 8 }} />
          {entry.name}: <strong style={{ color: '#fff' }}>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── Pie Chart Label ───
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="600">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ─── Chart Card Wrapper ───
const ChartCard = ({ title, subtitle, icon: Icon, children, className = '' }) => (
  <div className={`surface-card p-5 ${className}`} style={{
    background: 'linear-gradient(135deg, var(--bg-secondary) 0%, rgba(99, 102, 241, 0.03) 100%)',
    border: '1px solid var(--border)'
  }}>
    <div className="flex items-center gap-3 mb-4">
      {Icon && (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))',
          color: '#818cf8'
        }}>
          <Icon size={16} />
        </div>
      )}
      <div>
        <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        {subtitle && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

// ─── Custom Legend ───
const ChartLegend = ({ data }) => (
  <div className="flex flex-wrap gap-3 mt-3 justify-center">
    {data.map((item, i) => (
      <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span style={{
          display: 'inline-block', width: 10, height: 10, borderRadius: 3,
          background: item.color, flexShrink: 0
        }} />
        <span>{item.name}</span>
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>({item.value})</span>
      </div>
    ))}
  </div>
);

export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState({});
  const [ads, setAds] = useState([]);
  const [reports, setReports] = useState([]);
  const [requests, setRequests] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [adSearch, setAdSearch] = useState('');
  const [annForm, setAnnForm] = useState({ title: '', body: '', priority: 'normal' });
  const [annModal, setAnnModal] = useState(false);
  const [broadcast, setBroadcast] = useState({ title: '', message: '', channels: ['in-app'] });
  const [sending, setSending] = useState(false);

  const loadStats = useCallback(() => carAdminAPI.getStats().then(r => setStats(r.data.stats || {})).catch(() => {}), []);
  const loadAds = useCallback(() => carAdminAPI.getAds(adSearch ? { q: adSearch } : {}).then(r => setAds(r.data.ads || [])).catch(() => {}), [adSearch]);
  const loadReports = useCallback(() => carAdminAPI.getReports().then(r => setReports(r.data.reports || [])).catch(() => {}), []);
  const loadRequests = useCallback(() => carAdminAPI.getRequests().then(r => setRequests(r.data.requests || [])).catch(() => {}), []);
  const loadAnnouncements = useCallback(() => announcementAPI.getAll().then(r => setAnnouncements(r.data.announcements || [])).catch(() => {}), []);
  const loadAnalytics = useCallback(() => carAdminAPI.getAnalytics().then(r => setAnalytics(r.data.analytics || null)).catch(() => {}), []);

  useEffect(() => {
    loadStats();
    if (tab === 'Analytics') loadAnalytics();
    if (tab === 'Advertisements') loadAds();
    if (tab === 'Daily Reports') loadReports();
    if (tab === 'File Requests') loadRequests();
    if (tab === 'Announcements') loadAnnouncements();

    const interval = setInterval(() => {
      loadStats();
      if (tab === 'Analytics') loadAnalytics();
      if (tab === 'Advertisements') loadAds();
      if (tab === 'Daily Reports') loadReports();
      if (tab === 'File Requests') loadRequests();
      if (tab === 'Announcements') loadAnnouncements();
    }, 4000);

    return () => clearInterval(interval);
  }, [tab, loadStats, loadAds, loadReports, loadRequests, loadAnnouncements, loadAnalytics]);

  const deleteAd = async (id) => {
    if (!window.confirm('Delete this advertisement?')) return;
    await carAdminAPI.deleteAd(id);
    toast.success('Advertisement deleted.');
    loadAds(); loadStats();
  };

  const setRequestStatus = async (id, status) => {
    await carAdminAPI.updateRequest(id, { status });
    toast.success(`Request ${status}.`);
    loadRequests();
  };

  const createAnnouncement = async (e) => {
    e.preventDefault();
    if (!annForm.title || !annForm.body) { toast.error('Title and body required.'); return; }
    await announcementAPI.create(annForm);
    toast.success('Announcement published.');
    setAnnForm({ title: '', body: '', priority: 'normal' });
    setAnnModal(false);
    loadAnnouncements();
  };

  const toggleAnnouncement = async (a) => {
    await announcementAPI.update(a._id, { isActive: !a.isActive });
    loadAnnouncements();
  };

  const removeAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    await announcementAPI.remove(id);
    loadAnnouncements();
  };

  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcast.title || !broadcast.message) { toast.error('Title and message required.'); return; }
    setSending(true);
    try {
      const res = await carAdminAPI.broadcast(broadcast);
      toast.success(res.data.message || 'Broadcast sent.');
      setBroadcast({ title: '', message: '', channels: ['in-app'] });
    } catch {
      toast.error('Failed to send broadcast.');
    } finally {
      setSending(false);
    }
  };

  const toggleChannel = (c) => setBroadcast(b => ({
    ...b,
    channels: b.channels.includes(c) ? b.channels.filter(x => x !== c) : [...b.channels, c]
  }));

  const tabIcons = {
    Overview: FiActivity,
    Analytics: FiBarChart2,
    Advertisements: FiTruck,
    'Daily Reports': FiFileText,
    'File Requests': FiFolder,
    Announcements: FiBell,
    Broadcast: FiSend
  };

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Car Hive platform management & analytics" />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map(t => {
            const TabIcon = tabIcons[t];
            return (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5"
                style={{
                  background: tab === t ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: tab === t ? '#818cf8' : 'var(--text-secondary)',
                  border: tab === t ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent'
                }}>
                {TabIcon && <TabIcon size={14} />}
                {t}
              </button>
            );
          })}
        </div>

        {/* Overview */}
        {tab === 'Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={stats.totalUsers ?? '—'} icon={FiUsers} accent="blue" />
              <StatCard label="Active Users" value={stats.activeUsers ?? '—'} icon={FiActivity} accent="green" />
              <StatCard label="Total Ads" value={stats.totalAds ?? '—'} icon={FiTruck} accent="purple" />
              <StatCard label="New Vehicle Ads" value={stats.newVehicleAds ?? '—'} icon={FiTruck} accent="green" />
              <StatCard label="Used Vehicle Ads" value={stats.usedVehicleAds ?? '—'} icon={FiTruck} accent="amber" />
              <StatCard label="Reports Today" value={stats.reportsToday ?? '—'} icon={FiFileText} accent="blue" />
              <StatCard label="Total Reports" value={stats.totalReports ?? '—'} icon={FiFileText} accent="purple" />
              <StatCard label="File Requests" value={stats.fileRequests ?? '—'} icon={FiFolder} accent="amber" />
            </div>
            {stats.pendingRequests > 0 && (
              <Card>
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--amber)' }}>
                  <FiBell size={16} /> {stats.pendingRequests} file request(s) pending review.
                  <button className="ml-auto text-xs" style={{ color: 'var(--neon)' }} onClick={() => setTab('File Requests')}>Review →</button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ══════════════════ ANALYTICS TAB ══════════════════ */}
        {tab === 'Analytics' && (
          <div className="space-y-6">
            {/* Top Row: Vehicle Type (Pie) + Fuel Distribution (Bar) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vehicle Type Distribution - Donut Chart */}
              <ChartCard title="Vehicle Type Distribution" subtitle="New vs Used vehicles posted" icon={FiTruck}>
                {analytics?.vehicleTypeDistribution?.some(d => d.value > 0) ? (
                  <>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={analytics.vehicleTypeDistribution}
                          cx="50%" cy="50%"
                          innerRadius={65} outerRadius={110}
                          dataKey="value"
                          labelLine={false}
                          label={renderCustomLabel}
                          stroke="none"
                          animationBegin={0}
                          animationDuration={800}
                        >
                          {analytics.vehicleTypeDistribution.map((entry, i) => (
                            <Cell key={i} fill={entry.color} style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <ChartLegend data={analytics.vehicleTypeDistribution} />
                  </>
                ) : (
                  <div className="h-[280px] flex items-center justify-center">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No vehicle data yet</p>
                  </div>
                )}
              </ChartCard>

              {/* Fuel Type Distribution - Bar Chart */}
              <ChartCard title="Fuel Type Distribution" subtitle="Petrol, Diesel, EV, CNG, Hybrid & more" icon={FiBarChart2}>
                {analytics?.fuelDistribution?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={analytics.fuelDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <defs>
                        {analytics.fuelDistribution.map((entry, i) => (
                          <linearGradient key={i} id={`fuelGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
                            <stop offset="100%" stopColor={entry.color} stopOpacity={0.4} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(148,163,184,0.15)' }} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(148,163,184,0.15)' }} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }} />
                      <Bar dataKey="value" name="Vehicles" radius={[8, 8, 0, 0]} maxBarSize={50} animationDuration={800}>
                        {analytics.fuelDistribution.map((entry, i) => (
                          <Cell key={i} fill={`url(#fuelGrad${i})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[320px] flex items-center justify-center">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No fuel type data available</p>
                  </div>
                )}
              </ChartCard>
            </div>

            {/* Daily Report Trend - Full Width Area Chart */}
            <ChartCard title="Daily Report Submissions" subtitle="Trend over the last 30 days — reports submitted & forms completed" icon={FiFileText}>
              {analytics?.reportTrend?.length > 0 ? (
                <ResponsiveContainer width="100%" height={340}>
                  <AreaChart data={analytics.reportTrend} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gradReports" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradForms" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: 'rgba(148,163,184,0.15)' }} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(148,163,184,0.15)' }} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
                    <Area type="monotone" dataKey="reports" name="Reports Submitted" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradReports)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 5, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }} />
                    <Area type="monotone" dataKey="formsCompleted" name="Forms Completed" stroke="#10b981" strokeWidth={2} fill="url(#gradForms)" dot={false} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[340px] flex items-center justify-center">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No report data in the last 30 days</p>
                </div>
              )}
            </ChartCard>

            {/* Bottom Row: Ad Status + File Request Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ad Status Distribution */}
              <ChartCard title="Advertisement Status" subtitle="Distribution of ad statuses" icon={FiTruck}>
                {analytics?.adStatusDistribution?.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={analytics.adStatusDistribution}
                          cx="50%" cy="50%"
                          innerRadius={55} outerRadius={100}
                          dataKey="value"
                          labelLine={false}
                          label={renderCustomLabel}
                          stroke="none"
                          animationDuration={800}
                        >
                          {analytics.adStatusDistribution.map((entry, i) => (
                            <Cell key={i} fill={entry.color} style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <ChartLegend data={analytics.adStatusDistribution} />
                  </>
                ) : (
                  <div className="h-[260px] flex items-center justify-center">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No advertisement data</p>
                  </div>
                )}
              </ChartCard>

              {/* File Request Status Distribution */}
              <ChartCard title="File Request Status" subtitle="Pending, Approved & Rejected requests" icon={FiFolder}>
                {analytics?.requestStatusDistribution?.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={analytics.requestStatusDistribution}
                          cx="50%" cy="50%"
                          innerRadius={55} outerRadius={100}
                          dataKey="value"
                          labelLine={false}
                          label={renderCustomLabel}
                          stroke="none"
                          animationDuration={800}
                        >
                          {analytics.requestStatusDistribution.map((entry, i) => (
                            <Cell key={i} fill={entry.color} style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <ChartLegend data={analytics.requestStatusDistribution} />
                  </>
                ) : (
                  <div className="h-[260px] flex items-center justify-center">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No file request data</p>
                  </div>
                )}
              </ChartCard>
            </div>

            {/* Real-time indicator */}
            <div className="flex items-center justify-center gap-2 py-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#10b981' }}></span>
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#10b981' }}></span>
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Real-time data • Auto-refreshing every 4s</span>
            </div>
          </div>
        )}

        {/* Advertisements */}
        {tab === 'Advertisements' && (
          <Card padding={false}>
            <div className="p-4 flex gap-3">
              <input className="input-field" placeholder="Search ad ID / batch / title / user…" value={adSearch}
                onChange={e => setAdSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadAds()} />
              <Button onClick={loadAds}>Search</Button>
            </div>
            <Table headers={['Ad ID', 'Batch', 'Title', 'Type', 'User', 'Posted', 'Status', '']}>
              {ads.map(a => (
                <Tr key={a._id}>
                  <Td bold>{a.adId}</Td>
                  <Td>{a.batchNumber}</Td>
                  <Td>{a.carTitle}</Td>
                  <Td>{a.vehicleType === 'new' ? 'New' : 'Used'}</Td>
                  <Td>{a.userId?.username || a.username}</Td>
                  <Td>{fmt(a.createdAt)}</Td>
                  <Td><Badge status="active">{a.status}</Badge></Td>
                  <Td><button onClick={() => deleteAd(a._id)} className="p-1.5 rounded-lg" style={{ color: 'var(--red)', background: 'rgba(239,68,68,0.1)' }}><FiTrash2 size={14} /></button></Td>
                </Tr>
              ))}
            </Table>
          </Card>
        )}

        {/* Daily Reports */}
        {tab === 'Daily Reports' && (
          <Card padding={false}>
            <Table headers={['Date', 'User', 'Email', 'Working File', 'Today', 'Till Now']}>
              {reports.map(r => (
                <Tr key={r._id}>
                  <Td bold>{fmt(r.reportDate)}</Td>
                  <Td>{r.username}</Td>
                  <Td>{r.email || '—'}</Td>
                  <Td>{r.workingFileId}</Td>
                  <Td>{r.formsCompletedToday}</Td>
                  <Td>{r.formsCompletedTillNow}</Td>
                </Tr>
              ))}
            </Table>
          </Card>
        )}

        {/* File Requests */}
        {tab === 'File Requests' && (
          <Card padding={false}>
            <Table headers={['User', 'Old File', 'Requested', 'Completion', 'Requested On', 'Status', 'Actions']}>
              {requests.map(r => (
                <Tr key={r._id}>
                  <Td bold>{r.username}</Td>
                  <Td>{r.oldFileId || '—'}</Td>
                  <Td>{r.requestedFileRange}</Td>
                  <Td>{fmt(r.lastCompletionDate)}</Td>
                  <Td>{fmt(r.createdAt)}</Td>
                  <Td><Badge status={r.status === 'approved' ? 'approved' : r.status === 'rejected' ? 'rejected' : 'pending'}>{r.status}</Badge></Td>
                  <Td>
                    {r.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => setRequestStatus(r._id, 'approved')} className="p-1.5 rounded-lg" style={{ color: 'var(--green)', background: 'rgba(16,185,129,0.1)' }}><FiCheck size={14} /></button>
                        <button onClick={() => setRequestStatus(r._id, 'rejected')} className="p-1.5 rounded-lg" style={{ color: 'var(--red)', background: 'rgba(239,68,68,0.1)' }}><FiX size={14} /></button>
                      </div>
                    )}
                  </Td>
                </Tr>
              ))}
            </Table>
          </Card>
        )}

        {/* Announcements */}
        {tab === 'Announcements' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setAnnModal(true)}><FiPlus size={14} /> New Announcement</Button>
            </div>
            <Card padding={false}>
              <Table headers={['Title', 'Priority', 'Status', 'Created', 'Actions']}>
                {announcements.map(a => (
                  <Tr key={a._id}>
                    <Td bold>{a.title}</Td>
                    <Td>{a.priority}</Td>
                    <Td><Badge status={a.isActive ? 'approved' : 'rejected'}>{a.isActive ? 'Active' : 'Hidden'}</Badge></Td>
                    <Td>{fmt(a.createdAt)}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <button onClick={() => toggleAnnouncement(a)} className="text-xs" style={{ color: 'var(--neon)' }}>{a.isActive ? 'Hide' : 'Show'}</button>
                        <button onClick={() => removeAnnouncement(a._id)} className="p-1.5 rounded-lg" style={{ color: 'var(--red)', background: 'rgba(239,68,68,0.1)' }}><FiTrash2 size={14} /></button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Table>
            </Card>
          </div>
        )}

        {/* Broadcast */}
        {tab === 'Broadcast' && (
          <Card>
            <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiSend size={18} style={{ color: 'var(--neon)' }} /> Send Notification to All Freelancers
            </h3>
            <form onSubmit={sendBroadcast} className="space-y-4 max-w-xl">
              <Input label="Title" value={broadcast.title} onChange={e => setBroadcast(b => ({ ...b, title: e.target.value }))} />
              <Textarea label="Message" rows={3} value={broadcast.message} onChange={e => setBroadcast(b => ({ ...b, message: e.target.value }))} />
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Channels</label>
                <div className="flex flex-wrap gap-3">
                  {['in-app', 'email', 'sms', 'whatsapp'].map(c => (
                    <label key={c} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                      <input type="checkbox" checked={broadcast.channels.includes(c)} onChange={() => toggleChannel(c)} /> {c}
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" loading={sending}><FiSend size={14} /> Send Broadcast</Button>
            </form>
          </Card>
        )}
      </div>

      {/* New announcement modal */}
      <Modal isOpen={annModal} onClose={() => setAnnModal(false)} title="New Announcement">
        <form onSubmit={createAnnouncement} className="space-y-4">
          <Input label="Title" value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} />
          <Textarea label="Body" rows={4} value={annForm.body} onChange={e => setAnnForm(f => ({ ...f, body: e.target.value }))} />
          <Select label="Priority" value={annForm.priority} onChange={e => setAnnForm(f => ({ ...f, priority: e.target.value }))}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setAnnModal(false)}>Cancel</Button>
            <Button type="submit">Publish</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
