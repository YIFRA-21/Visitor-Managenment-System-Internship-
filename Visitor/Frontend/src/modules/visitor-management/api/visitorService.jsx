import { apiClient } from '../../../services/apiClient';
export const visitorService = {
    // Dashboard
    dashboard: () => apiClient.get('/visitor/dashboard'),
    getOverview: (params) => apiClient.get('/visitor/dashboard', { params }),
    getCards: (params) => apiClient.get('/visitor/dashboard/cards', { params }),
    getCharts: (params) => apiClient.get('/visitor/dashboard/charts', { params }),
    getRecent: (params) => apiClient.get('/visitor/dashboard/recent', { params }),
    getAlerts: (params) => apiClient.get('/visitor/dashboard/alerts', { params }),
    getTasks: (params) => apiClient.get('/visitor/dashboard/tasks', { params }),
    search: (query, params) => apiClient.get('/visitor/dashboard/search', { params: { q: query, ...params } }),
    getStatistics: (params) => apiClient.get('/visitor/dashboard/statistics', { params }),
    // Profile
    getProfile: () => apiClient.get('/visitor/profile'),
    updateProfile: (data) => apiClient.put('/visitor/profile', data),
    uploadPhoto: (file) => {
        const formData = new FormData();
        formData.append('photo', file);
        return apiClient.post('/visitor/profile/photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    // Directory / Profiles Management (Admin)
    getProfilesList: (params) => apiClient.get('/visitor-profiles', { params }),
    getProfileDetails: (id) => apiClient.get(`/visitor-profiles/${id}`),
    updateProfileDetails: (id, data) => apiClient.put(`/visitor-profiles/${id}`, data),
    // Registration & Categories
    registerVisitor: (data) => apiClient.post('/visitors/registration', data),
    getCategories: () => apiClient.get('/visitor-categories'),
    getCategoryDetails: (id) => apiClient.get(`/visitor-categories/${id}`),
    // Feedback & Support
    submitFeedback: (data) => apiClient.post('/visitor/feedback', data),
    getFeedback: () => apiClient.get('/visitor/feedback'),
    createSupportTicket: (data) => apiClient.post('/visitor/support', data),
    getSupportTickets: () => apiClient.get('/visitor/support'),
    getSettings: () => apiClient.get('/visitor/settings'),
    updateSettings: (data) => apiClient.put('/visitor/settings', data),
};
export default visitorService;
