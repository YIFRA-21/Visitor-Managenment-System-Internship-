import { apiClient } from '../../../services/apiClient';
export const notificationService = {
    // General / User Notifications
    list: () => apiClient.get('/notifications'),
    unreadCounts: () => apiClient.get('/notifications/unread-count'),
    markRead: (id) => apiClient.patch(`/notifications/${id}/read`),
    markAllRead: () => apiClient.patch('/notifications/read-all'),
    // Visitor & Communication
    getVisitorNotifications: (params) => apiClient.get('/visitor-notifications/notifications', { params }),
    getVisitorNotificationDetails: (id) => apiClient.get(`/visitor-notifications/notifications/${id}`),
    getPreferences: () => apiClient.get('/visitor-notifications/preferences'),
    updatePreferences: (data) => apiClient.put('/visitor-notifications/preferences', data),
    getAnnouncements: () => apiClient.get('/visitor-notifications/announcements'),
    getThreads: () => apiClient.get('/visitor-notifications/messages/threads'),
    createThread: (data) => apiClient.post('/visitor-notifications/messages/threads', data),
    getThreadMessages: (threadId) => apiClient.get(`/visitor-notifications/messages/threads/${threadId}`),
    sendMessage: (threadId, data) => apiClient.post(`/visitor-notifications/messages/threads/${threadId}/reply`, data),
    // Manual Notification Operations
    getManualDashboard: () => apiClient.get('/manual-notifications/dashboard'),
    getManualStatistics: () => apiClient.get('/manual-notifications/statistics'),
    getManualDrafts: () => apiClient.get('/manual-notifications/drafts'),
    dispatchManual: (data) => apiClient.post('/manual-notifications/dispatch', data),
    saveDraft: (data) => apiClient.post('/manual-notifications/draft', data),
    // Admin Notification Platform
    getAdminDashboardStats: () => apiClient.get('/visitor-notifications/admin/dashboard-stats'),
    getAdminRules: () => apiClient.get('/visitor-notifications/admin/rules'),
    getAdminTemplates: () => apiClient.get('/visitor-notifications/admin/templates'),
    getAdminQueues: () => apiClient.get('/visitor-notifications/admin/queues'),
    sendBroadcast: (data) => apiClient.post('/visitor-notifications/admin/broadcast', data),
};
export default notificationService;
