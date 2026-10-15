import { apiClient } from '../../../services/apiClient';
export const checkinService = {
    liveBoard: (date) => apiClient.get('/checkin/live-board', { params: { date } }),
    scan: (data) => apiClient.post('/checkin/scan', data),
    checkout: (appointmentId, data) => apiClient.post(`/checkin/${appointmentId}/checkout`, data),
    getActiveCheckin: (code) => apiClient.get(`/checkin/active/${code}`),
    dashboard: (date) => apiClient.get('/checkin/dashboard', { params: { date } }),
    pending: (date) => apiClient.get('/checkin/pending', { params: { date } }),
    history: (params) => apiClient.get('/checkin/history', { params }),
    analytics: (dateFrom, dateTo) => apiClient.get('/checkin/analytics', { params: { dateFrom, dateTo } }),
    walkin: (data) => apiClient.post('/checkin/walkin', data),
    validate: (data) => apiClient.post('/checkin/validate', data),
    search: (q, limit) => apiClient.get('/checkin/search', { params: { q, limit } }),
    override: (data) => apiClient.post('/checkin/override', data),
    queueStatus: () => apiClient.get('/checkin/queue/status'),
    group: (data) => apiClient.post('/checkin/group', data),
    // Checkout operations
    checkoutDashboard: (date) => apiClient.get('/checkout/dashboard', { params: { date } }),
    checkoutPending: (search) => apiClient.get('/checkout/pending', { params: { search } }),
    checkoutOverstay: () => apiClient.get('/checkout/overstay'),
    checkoutEvacuation: () => apiClient.get('/checkout/evacuation'),
    checkoutHistory: (params) => apiClient.get('/checkout/history', { params }),
    checkoutAnalytics: (dateFrom, dateTo) => apiClient.get('/checkout/analytics', { params: { dateFrom, dateTo } }),
    processCheckout: (data) => apiClient.post('/checkout/process', data),
    groupCheckout: (data) => apiClient.post('/checkout/group', data),
};
export default checkinService;
