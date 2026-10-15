import { apiClient } from '../../../services/apiClient';
export const watchlistService = {
    getDirectory: (params) => apiClient.get('/security/blacklist-watchlist', { params }),
    getRecordDetails: (id) => apiClient.get(`/security/blacklist-watchlist/${id}`),
    createRecord: (data) => apiClient.post('/security/blacklist-watchlist', data),
    updateRecord: (id, data) => apiClient.put(`/security/blacklist-watchlist/${id}`, data),
    verifyVisitor: (data) => apiClient.post('/security/blacklist-watchlist/verify', data),
    updateStatus: (id, status) => apiClient.patch(`/security/blacklist-watchlist/${id}/status`, { status }),
    reviewClearance: (id, decision, notes) => apiClient.post(`/security/blacklist-watchlist/${id}/clearance`, { decision, notes }),
    archiveRecord: (id) => apiClient.patch(`/security/blacklist-watchlist/${id}/archive`),
    restoreRecord: (id) => apiClient.patch(`/security/blacklist-watchlist/${id}/restore`),
};
export default watchlistService;
