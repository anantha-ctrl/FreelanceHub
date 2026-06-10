import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTruck, FiFileText, FiBell, FiPlusCircle, FiClock, FiActivity, FiCheckCircle, FiFolder, FiDownload } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI, fileRequestAPI } from '../../utils/api';
import { PageHeader, StatCard, Card, Badge } from '../../components/common/UI';
import toast from 'react-hot-toast';

const timeAgo = (d) => {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(d).toLocaleDateString();
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = (silent = false) => {
    if (!silent) setLoading(true);
    dashboardAPI.getUserDashboard()
      .then(res => setData(res.data.dashboard))
      .catch(() => {})
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboard(false);
    const interval = setInterval(() => {
      loadDashboard(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleDownload = async (id, range) => {
    try {
      const res = await fileRequestAPI.download(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Vehicle_Data_${range}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started!');
    } catch (err) {
      toast.error('Failed to download document.');
    }
  };

  const s = data?.stats || {};

  return (
    <div>
      <PageHeader title={`Welcome, ${user?.name?.split(' ')[0] || 'Freelancer'} 👋`} subtitle="Your Car Hive freelancer dashboard">
        <Link to="/post-ad" className="btn-neon px-4 py-2 text-sm inline-flex items-center gap-1.5"><FiPlusCircle size={15}/> Post Ad</Link>
      </PageHeader>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Stat widgets */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Ads Posted" value={loading ? '—' : (s.totalAds ?? 0)} icon={FiTruck} accent="blue" />
          <StatCard label="New Vehicle Ads" value={loading ? '—' : (s.newAds ?? 0)} icon={FiCheckCircle} accent="green" />
          <StatCard label="Used Vehicle Ads" value={loading ? '—' : (s.usedAds ?? 0)} icon={FiTruck} accent="amber" />
          <StatCard label="Reports Submitted" value={loading ? '—' : (s.reportsCount ?? 0)} icon={FiFileText} accent="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account status + current file */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--green)' }}>
                    <FiCheckCircle size={18}/>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Account Status</div>
                    <div className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{data?.accountStatus || 'Active'}</div>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--amber)' }}>
                    <FiFolder size={18}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Current File Assignment</div>
                    <div className="font-display font-bold text-lg truncate" style={{ color: 'var(--text-primary)' }}>
                      {data?.currentFile ? data.currentFile.requestedFileRange : 'None'}
                    </div>
                    {data?.currentFile && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge status={data.currentFile.status === 'approved' ? 'approved' : 'pending'}>{data.currentFile.status}</Badge>
                        {data.currentFile.status === 'approved' && (
                          <button
                            onClick={() => handleDownload(data.currentFile._id || data.currentFile.id, data.currentFile.requestedFileRange)}
                            className="text-xs font-semibold flex items-center gap-1 hover:underline transition-all"
                            style={{ color: 'var(--neon)' }}
                          >
                            <FiDownload size={12} /> Download CSV
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent ads */}
            <Card padding={false}>
              <div className="flex items-center justify-between p-5 pb-3">
                <h3 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>Recent Advertisements</h3>
                <Link to="/my-ads" className="text-xs" style={{ color: 'var(--neon-light)' }}>View all →</Link>
              </div>
              <div className="px-2 pb-2">
                {(data?.recentAds || []).length === 0 && (
                  <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>No advertisements yet.</div>
                )}
                {(data?.recentAds || []).map(ad => (
                  <Link key={ad._id} to="/my-ads" className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-surface-2 transition-colors" style={{ textDecoration: 'none' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--neon)' }}>
                      <FiTruck size={16}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{ad.carTitle}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{ad.adId} · {ad.vehicleType === 'new' ? 'New' : 'Used'} · {timeAgo(ad.createdAt)}</div>
                    </div>
                    <Badge status="active">{ad.status}</Badge>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Recent activity */}
            <Card padding={false}>
              <div className="flex items-center gap-2 p-5 pb-3">
                <FiActivity size={16} style={{ color: 'var(--purple)' }}/>
                <h3 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>Recent Activities</h3>
              </div>
              <div className="px-5 pb-5 space-y-3">
                {(data?.recentActivities || []).length === 0 && (
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No activity recorded yet.</div>
                )}
                {(data?.recentActivities || []).map(a => (
                  <div key={a._id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--neon)' }}/>
                    <div className="flex-1">
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{a.details}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(a.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Quick actions */}
            <Card>
              <h3 className="font-display font-bold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/post-ad" className="nav-item" style={{ borderRadius: 8 }}><FiPlusCircle size={16}/> Post New Ad</Link>
                <Link to="/my-ads" className="nav-item" style={{ borderRadius: 8 }}><FiTruck size={16}/> My Ads</Link>
                <Link to="/new-file-request" className="nav-item" style={{ borderRadius: 8 }}><FiClock size={16}/> New File Request</Link>
                <Link to="/daily-report" className="nav-item" style={{ borderRadius: 8 }}><FiFileText size={16}/> Daily Report</Link>
              </div>
            </Card>

            {/* Latest announcements */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <FiBell size={16} style={{ color: 'var(--amber)' }}/>
                <h3 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>Latest Announcements</h3>
              </div>
              <div className="space-y-3">
                {(data?.latestAnnouncements || []).length === 0 && (
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No announcements.</div>
                )}
                {(data?.latestAnnouncements || []).map(a => (
                  <div key={a._id} className="pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.body}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
