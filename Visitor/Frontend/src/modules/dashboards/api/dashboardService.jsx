import { apiClient } from '../../../services/apiClient';
export const dashboardService = {
    stats: () => apiClient.get('/dashboard/stats'),
    activities: () => apiClient.get('/dashboard/activities'),
    layout: () => apiClient.get('/dashboard/layout'),
    saveLayout: (data) => apiClient.post('/dashboard/layout', data),
    search: (q) => apiClient.get('/dashboard/search', { params: { q } }),
};
export default dashboardService;
