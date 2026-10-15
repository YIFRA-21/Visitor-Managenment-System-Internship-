import { apiClient } from '../../../services/apiClient';
export const userService = {
    list: (params) => apiClient.get('/users', { params }),
    getById: (id) => apiClient.get(`/users/${id}`),
    create: (data) => apiClient.post('/users', data),
    update: (id, data) => apiClient.put(`/users/${id}`, data),
    remove: (id) => apiClient.delete(`/users/${id}`),
    lock: (id) => apiClient.patch(`/users/${id}/lock`),
    unlock: (id) => apiClient.patch(`/users/${id}/unlock`),
    updateStatus: (id, status, reason) => apiClient.patch(`/users/${id}/status`, { status, reason }),
    archive: (id) => apiClient.post(`/users/${id}/archive`),
    restore: (id) => apiClient.post(`/users/${id}/restore`),
    resetPassword: (id, newPassword) => apiClient.patch(`/users/${id}/reset-password`, { newPassword }),
    stats: () => apiClient.get('/users/stats'),
    getStatistics: () => apiClient.get('/users/statistics'),
    importUsers: (users) => apiClient.post('/users/import', { users }),
    exportUsers: (params) => apiClient.get('/users/export', { params }),
    getSessions: (id) => apiClient.get(`/users/${id}/sessions`),
    revokeSession: (id, sessionId) => apiClient.delete(`/users/${id}/sessions/${sessionId}`),
    revokeAllSessions: (id) => apiClient.delete(`/users/${id}/sessions/all`),
    getLoginHistory: (id) => apiClient.get(`/users/${id}/login-history`),
    getActivity: (id) => apiClient.get(`/users/${id}/activity`),
};
export default userService;
