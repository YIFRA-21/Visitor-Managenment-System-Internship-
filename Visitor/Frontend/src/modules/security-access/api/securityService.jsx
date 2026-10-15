import { apiClient } from '../../../services/apiClient';
export const securityService = {
    dashboard: () => apiClient.get('/security/dashboard'),
    watchlist: () => apiClient.get('/security/watchlist'),
    addToWatchlist: (data) => apiClient.post('/security/watchlist', data),
    removeFromWatchlist: (id) => apiClient.delete(`/security/watchlist/${id}`),
    incidents: (status) => apiClient.get('/security/incidents', { params: { status } }),
    reportIncident: (data) => apiClient.post('/security/incidents', data),
    updateIncident: (id, data) => apiClient.put(`/security/incidents/${id}`, data),
    accessRules: () => apiClient.get('/security/access-rules'),
    escorts: () => apiClient.get('/security/escorts'),
    assignEscort: (data) => apiClient.post('/security/escorts', data),
    analytics: (dateFrom, dateTo) => apiClient.get('/security/analytics', { params: { dateFrom, dateTo } }),
    blacklist: () => apiClient.get('/security/blacklist'),
    addToBlacklist: (data) => apiClient.post('/security/blacklist', data),
    removeFromBlacklist: (id) => apiClient.delete(`/security/blacklist/${id}`),
    verifyReference: (referenceCode) => apiClient.get(`/security/verify/${referenceCode}`),
    verify: (referenceCode) => apiClient.get(`/security/verify/${referenceCode}`),
};
export default securityService;
