
import axios from 'axios';

const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${hostname}:5001/api`;
};

export const getAssetURL = (url) => {
  if (!url) return url;
  if (typeof url !== 'string') return url;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return url.replace(/localhost:5001/g, `${hostname}:5001`).replace(/127\.0\.0\.1:5001/g, `${hostname}:5001`);
};

const API = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true
});

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  checkUsername: (username) => API.get('/auth/username-available', { params: { username } }),
  login: (data) => API.post('/auth/login', data),
  logout: () => API.post('/auth/logout'),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/update-profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
  resetPassword: (data) => API.post('/auth/reset-password', data)
};

// Posts
export const postAPI = {
  getFeed: (params) => API.get('/posts', { params }),
  createPost: (formData) => API.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyPosts: (params) => API.get('/posts/my-posts', { params }),
  getMyStats: () => API.get('/posts/my-stats'),
  getPost: (id) => API.get(`/posts/${id}`),
  updatePost: (id, formData) => API.put(`/posts/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePost: (id) => API.delete(`/posts/${id}`),
  toggleLike: (id) => API.post(`/posts/${id}/like`),
  addComment: (id, data) => API.post(`/posts/${id}/comment`, data),
  getComments: (id) => API.get(`/posts/${id}/comments`)
};

// Admin
export const adminAPI = {
  getDashboard: () => API.get('/admin/dashboard'),
  getSystemStatus: () => API.get('/admin/system-status'),
  getAuditLogs: (params) => API.get('/admin/audit-logs', { params }),
  getAllPosts: (params) => API.get('/admin/posts', { params }),
  approvePost: (id) => API.put(`/admin/posts/${id}/approve`),
  rejectPost: (id, data) => API.put(`/admin/posts/${id}/reject`, data),
  deletePost: (id) => API.delete(`/admin/posts/${id}`),
  getAllUsers: (params) => API.get('/admin/users', { params }),
  blockUser: (id, data) => API.put(`/admin/users/${id}/block`, data),
  unblockUser: (id) => API.put(`/admin/users/${id}/unblock`),
  deleteComment: (id) => API.delete(`/admin/comments/${id}`)
};

// Users
export const userAPI = {
  getNotifications: () => API.get('/users/notifications'),
  getUser: (id) => API.get(`/users/${id}`)
};

// Logs
export const logAPI = {
  getLogs: (params) => API.get('/logs', { params }),
  getMySessions: () => API.get('/logs/my-sessions')
};

// Support Helpdesk
export const supportAPI = {
  createTicket: (data) => API.post('/support/tickets', data),
  getMyTickets: () => API.get('/support/tickets'),
  getTicket: (id) => API.get(`/support/tickets/${id}`),
  addMessage: (id, data) => API.post(`/support/tickets/${id}/messages`, data),
  adminGetTickets: () => API.get('/support/admin/tickets'),
  adminGetTicket: (id) => API.get(`/support/admin/tickets/${id}`),
  adminAddMessage: (id, data) => API.post(`/support/admin/tickets/${id}/messages`, data),
  adminUpdateStatus: (id, data) => API.put(`/support/admin/tickets/${id}/status`, data)
};

// Bookmarks
export const bookmarkAPI = {
  toggleBookmark: (postId) => API.post(`/bookmarks/${postId}`),
  getBookmarks: () => API.get('/bookmarks')
};

// Proposals
export const proposalAPI = {
  applyForJob: (postId, data) => API.post(`/proposals/apply/${postId}`, data),
  getPostProposals: (postId) => API.get(`/proposals/post/${postId}`),
  getMyProposals: () => API.get('/proposals/my'),
  updateProposalStatus: (id, data) => API.put(`/proposals/${id}/status`, data)
};

// Messages & Chat
export const messageAPI = {
  sendMessage: (data) => API.post('/messages', data),
  getConversations: () => API.get('/messages/conversations'),
  getChatHistory: (partnerId) => API.get(`/messages/history/${partnerId}`)
};

// ─── Car Hive: Advertisements ───
export const adAPI = {
  create: (data) => API.post('/ads', data),
  getMyAds: (params) => API.get('/ads/my', { params }),
  getAd: (id) => API.get(`/ads/${id}`),
  deleteAd: (id) => API.delete(`/ads/${id}`)
};

// ─── Car Hive: Daily Reports ───
export const reportAPI = {
  submit: (data) => API.post('/reports', data),
  getMine: () => API.get('/reports/my')
};

// ─── Car Hive: File Requests ───
export const fileRequestAPI = {
  getRanges: () => API.get('/file-requests/ranges'),
  submit: (data) => API.post('/file-requests', data),
  getMine: () => API.get('/file-requests/my'),
  download: (id) => API.get(`/file-requests/${id}/download`, { responseType: 'blob' })
};

// ─── Car Hive: Notifications ───
export const notificationAPI = {
  getMine: () => API.get('/notifications'),
  getUnreadCount: () => API.get('/notifications/unread-count'),
  markRead: (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put('/notifications/read-all')
};

// ─── Car Hive: Announcements ───
export const announcementAPI = {
  getActive: () => API.get('/announcements'),
  getAll: () => API.get('/announcements/all'),
  create: (data) => API.post('/announcements', data),
  update: (id, data) => API.put(`/announcements/${id}`, data),
  remove: (id) => API.delete(`/announcements/${id}`)
};

// ─── Car Hive: Dashboard ───
export const dashboardAPI = {
  getUserDashboard: () => API.get('/dashboard')
};

// ─── Car Hive: Admin ───
export const carAdminAPI = {
  getStats: () => API.get('/car-admin/stats'),
  getAds: (params) => API.get('/car-admin/ads', { params }),
  deleteAd: (id) => API.delete(`/car-admin/ads/${id}`),
  getReports: () => API.get('/car-admin/reports'),
  getRequests: () => API.get('/car-admin/file-requests'),
  updateRequest: (id, data) => API.put(`/car-admin/file-requests/${id}`, data),
  broadcast: (data) => API.post('/car-admin/broadcast', data),
  getAnalytics: () => API.get('/car-admin/analytics')
};

export default API;
