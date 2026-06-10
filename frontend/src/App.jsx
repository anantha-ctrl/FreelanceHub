import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages - Auth
import Landing from './pages/auth/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Pages - User (shared with admin routes)
import UserLayout from './components/layout/UserLayout';
import Feed from './pages/user/Feed';
import Profile from './pages/user/Profile';
import Settings from './pages/user/Settings';

// Pages - Car Hive
import CarDashboard from './pages/carhive/Dashboard';
import MyAds from './pages/carhive/MyAds';
import PostAd from './pages/carhive/PostAd';
import NewFileRequest from './pages/carhive/NewFileRequest';
import DailyReport from './pages/carhive/DailyReport';
import CarNotifications from './pages/carhive/Notifications';
import CarAdminDashboard from './pages/carhive/AdminDashboard';

// Pages - Admin
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPosts from './pages/admin/AdminPosts';
import AdminUsers from './pages/admin/AdminUsers';
import ActivityLogs from './pages/admin/ActivityLogs';
import SupportInbox from './pages/admin/SupportInbox';

// Pages - Common
import NotFound from './pages/NotFound';

import './styles/index.css';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
};

const PageLoader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--neon)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading Car Hive...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--bg-surface-2)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13.5px',
                fontFamily: 'DM Sans, sans-serif'
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
            }}
          />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

            {/* User routes — Car Hive */}
            <Route path="/" element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<CarDashboard />} />
              <Route path="my-ads" element={<MyAds />} />
              <Route path="post-ad" element={<PostAd />} />
              <Route path="new-file-request" element={<NewFileRequest />} />
              <Route path="daily-report" element={<DailyReport />} />
              <Route path="notifications" element={<CarNotifications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
              <Route index element={<CarAdminDashboard />} />
              <Route path="legacy" element={<AdminDashboard />} />
              <Route path="posts" element={<AdminPosts />} />
              <Route path="feed" element={<Feed />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="logs" element={<ActivityLogs />} />
              <Route path="support" element={<SupportInbox />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
