// Profile.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import API, { postAPI, logAPI, userAPI, authAPI } from '../../utils/api';
import { FiCamera, FiLock } from 'react-icons/fi';
import { PageHeader, Card, Badge, Button, Input, Textarea, Modal } from '../../components/common/UI';
import PostCard from '../../components/user/PostCard';
import SessionBar from '../../components/user/SessionBar';
import toast from 'react-hot-toast';

const POST_TABS = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'pending', label: 'Pending' },
  { key: 'rejected', label: 'Rejected' }
];

export function Profile() {
  const { user, updateUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', mobile: user?.mobile || '', bio: user?.bio || '', skills: user?.skills?.join(', ') || '' });
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarRef = useRef();
  const [statusFilter, setStatusFilter] = useState('all');
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    postAPI.getMyPosts({ limit: 50 }).then(r => setPosts(r.data.posts)).catch(() => {});
  }, []);

  const handleAvatar = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('mobile', form.mobile);
      data.append('bio', form.bio);
      data.append('skills', form.skills);
      if (avatarFile) data.append('image', avatarFile);
      const res = await API.put('/auth/update-profile', data);
      updateUser(res.data.user);
      toast.success('Profile updated!');
      setEditOpen(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed.'); }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (pwd.newPassword.length < 8) { toast.error('New password must be at least 8 characters.'); return; }
    if (pwd.newPassword !== pwd.confirm) { toast.error('New passwords do not match.'); return; }
    setPwdSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      toast.success('Password changed successfully!');
      setPwdOpen(false);
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Password change failed.'); }
    setPwdSaving(false);
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'U';
  const approved = posts.filter(p => p.approvalStatus === 'approved').length;
  const totalLikes = posts.reduce((s, p) => s + (p.likesCount||0), 0);
  const visiblePosts = statusFilter === 'all' ? posts : posts.filter(p => p.approvalStatus === statusFilter);
  const countFor = (key) => key === 'all' ? posts.length : posts.filter(p => p.approvalStatus === key).length;
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : null;

  return (
    <div>
      <PageHeader title="My Profile">
        <Button variant="ghost" onClick={() => setPwdOpen(true)}><FiLock size={14}/> Password</Button>
        <Button variant="ghost" onClick={() => setEditOpen(true)}>Edit Profile</Button>
      </PageHeader>
      <div className="p-6 max-w-3xl">
        <SessionBar/>
        {/* Profile hero */}
        <Card className="mb-5">
          <div className="flex items-start gap-5">
            {user?.profileImage
              ? <img src={user.profileImage} alt={user.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0"/>
              : <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--neon), var(--purple))' }}>{initials}</div>
            }
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{user?.name}</h2>
                <Badge status="active">Active</Badge>
              </div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{user?.email}</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.mobile}</div>
              {memberSince && <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>📅 Member since {memberSince}</div>}
              {user?.bio
                ? <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{user.bio}</p>
                : <p className="text-sm mt-2 italic" style={{ color: 'var(--text-muted)' }}>No bio yet — add one from Edit Profile.</p>}
              {user?.skills?.length > 0 && (
                <div className="mt-3 flex flex-wrap">{user.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}</div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
            {[['Posts', posts.length], ['Approved', approved], ['Likes', totalLikes]].map(([l, v]) => (
              <div key={l} className="text-center">
                <div className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{v}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{l}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Posts with status filter tabs */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <h3 className="font-display font-bold text-sm mr-2" style={{ color: 'var(--text-primary)' }}>My Posts</h3>
          {POST_TABS.map(t => (
            <button key={t.key} onClick={() => setStatusFilter(t.key)}
              className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
              style={statusFilter === t.key
                ? { background: 'var(--neon)', color: '#fff' }
                : { background: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}>
              {t.label} ({countFor(t.key)})
            </button>
          ))}
        </div>
        {visiblePosts.length === 0 ? (
          <div className="surface-card p-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            No {statusFilter === 'all' ? '' : statusFilter} posts.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visiblePosts.map((p, i) => (
              <PostCard key={p._id} post={p} index={i} showActions showStatus
                onDelete={id => setPosts(prev => prev.filter(x => x._id !== id))}/>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <div className="space-y-4">
          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {(avatarPreview || user?.profileImage)
                ? <img src={avatarPreview || user.profileImage} alt="avatar" className="w-16 h-16 rounded-full object-cover"/>
                : <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{ background: 'linear-gradient(135deg, var(--neon), var(--purple))' }}>{initials}</div>}
              <button type="button" onClick={() => avatarRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white"
                style={{ background: 'var(--neon)', border: '2px solid var(--bg-secondary)' }} title="Change photo">
                <FiCamera size={13}/>
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar}/>
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Click the camera to upload a profile photo.<br/>PNG, JPG, WebP up to 10MB.</div>
          </div>
          <Input label="Full Name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}/>
          <Input label="Mobile" value={form.mobile} onChange={e => setForm(f=>({...f,mobile:e.target.value}))}/>
          <Textarea label="Bio" rows={3} value={form.bio} onChange={e => setForm(f=>({...f,bio:e.target.value}))} placeholder="Tell clients about yourself…"/>
          <Input label="Skills (comma separated)" value={form.skills} onChange={e => setForm(f=>({...f,skills:e.target.value}))}/>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal isOpen={pwdOpen} onClose={() => setPwdOpen(false)} title="Change Password">
        <div className="space-y-4">
          <Input label="Current Password" type="password" value={pwd.currentPassword} onChange={e => setPwd(p=>({...p,currentPassword:e.target.value}))}/>
          <Input label="New Password" type="password" value={pwd.newPassword} onChange={e => setPwd(p=>({...p,newPassword:e.target.value}))} placeholder="At least 8 characters"/>
          <Input label="Confirm New Password" type="password" value={pwd.confirm} onChange={e => setPwd(p=>({...p,confirm:e.target.value}))}/>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setPwdOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} loading={pwdSaving}>Update Password</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Notifications.jsx
const relTime = (iso) => {
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString();
};

export function Notifications() {
  const { user, updateUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const readAt = user?.notifReadAt || 0;

  useEffect(() => {
    userAPI.getNotifications()
      .then(r => setNotifications(r.data.notifications))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    const now = Date.now();
    try {
      await authAPI.updateProfile({ notifReadAt: now });
      updateUser({ notifReadAt: now });
    } catch {}
  };

  return (
    <div>
      <PageHeader title="Notifications">
        <Button variant="ghost" size="sm" onClick={markAllRead} disabled={notifications.length === 0}>Mark all read</Button>
      </PageHeader>
      <div className="p-6 max-w-2xl">
        {loading ? (
          <div className="surface-card p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>
        ) : notifications.length === 0 ? (
          <div className="surface-card p-10 text-center">
            <div className="text-3xl mb-2">🔔</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notifications yet. Activity on your posts will show up here.</p>
          </div>
        ) : (
          <div className="surface-card divide-y" style={{ borderColor: 'var(--border)' }}>
            {notifications.map((n, i) => {
              const unread = new Date(n.time).getTime() > readAt;
              return (
                <div key={i} className="flex items-start gap-4 p-4" style={{ background: unread ? 'rgba(59,130,246,0.03)' : 'transparent' }}>
                  <span className="text-xl flex-shrink-0 mt-0.5">{n.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed" style={{ color: unread ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{n.text}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{relTime(n.time)}</p>
                  </div>
                  {unread && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--neon)' }}/>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// EditPost.jsx
export function EditPost() {
  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <h1 className="font-display font-bold text-xl mb-4" style={{ color: 'var(--text-primary)' }}>Edit Post</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Edit form loads post data from API — same structure as CreatePost but pre-filled and re-submits for admin review.</p>
      </div>
    </div>
  );
}

export default Profile;
