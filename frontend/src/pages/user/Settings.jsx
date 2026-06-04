import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import API, { authAPI, getAssetURL } from '../../utils/api';
import { PageHeader, Card, Button, Input, Textarea, Select } from '../../components/common/UI';
import { FiUser, FiLock, FiSettings, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();


  const [activeTab, setActiveTab] = useState('profile');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    bio: user?.bio || '',
    skills: user?.skills?.join(', ') || ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarRef = useRef();

  // Password form
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirm: ''
  });

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append('name', profileForm.name);
      formData.append('mobile', profileForm.mobile);
      formData.append('bio', profileForm.bio);
      formData.append('skills', profileForm.skills);
      if (avatarFile) {
        formData.append('image', avatarFile);
      }
      
      const res = await authAPI.updateProfile(formData);
      updateUser(res.data.user);
      toast.success('Profile settings updated!');
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    }
    setSavingProfile(false);
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await authAPI.changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      });
      toast.success('Password updated successfully!');
      setPwdForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password update failed.');
    }
    setSavingPassword(false);
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const tabs = [
    { id: 'profile', label: 'Profile Info', icon: FiUser },
    { id: 'security', label: 'Security', icon: FiLock }
  ];

  return (
    <div>
      <PageHeader title="Account Settings" subtitle="Configure your profile, preferences, and system parameters." />

      <div className="flex flex-col md:flex-row gap-6 p-6 max-w-5xl">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-60 flex-shrink-0 flex flex-col gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                  isActive
                    ? 'bg-neon/10 text-neon-light'
                    : 'text-text-secondary hover:bg-bg-surface-2 hover:text-text-primary'
                }`}
                style={isActive ? { borderLeft: '3px solid var(--neon)' } : {}}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <Card>
              <h2 className="font-display font-bold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Profile Settings</h2>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    {avatarPreview || user?.profileImage ? (
                      <img src={getAssetURL(avatarPreview || user.profileImage)} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-border" />
                    ) : (
                      <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                        style={{ background: 'linear-gradient(135deg, var(--neon), var(--purple))' }}>{initials}</div>
                    )}
                    <button
                      type="button"
                      onClick={() => avatarRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white"
                      style={{ background: 'var(--neon)', border: '2px solid var(--bg-secondary)' }}
                      title="Change photo"
                    >
                      <FiCamera size={14} />
                    </button>
                    <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    PNG, JPG, WebP image formats supported.<br />
                    Maximum file upload size limit is 10MB.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                  <Input
                    label="Mobile Number"
                    required
                    value={profileForm.mobile}
                    onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                  />
                </div>

                <Textarea
                  label="Biography"
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Describe your freelance background, skills, or portfolio..."
                />

                <Input
                  label="Skills (Comma-separated tags)"
                  value={profileForm.skills}
                  onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                  placeholder="e.g. React, Node.js, Graphic Design, Copywriting"
                />

                <div className="pt-2 flex justify-end">
                  <Button type="submit" loading={savingProfile}>Save Settings</Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <h2 className="font-display font-bold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Password & Security</h2>
              <form onSubmit={handleSavePassword} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  required
                  value={pwdForm.currentPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                />
                <Input
                  label="New Password"
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  required
                  value={pwdForm.confirm}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                />

                <div className="pt-2 flex justify-end">
                  <Button type="submit" loading={savingPassword}>Update Password</Button>
                </div>
              </form>
            </Card>
          )}




        </div>
      </div>
    </div>
  );
}
