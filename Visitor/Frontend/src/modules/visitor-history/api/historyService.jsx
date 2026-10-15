import { apiClient } from '../../../services/apiClient';
export const historyService = {
    getHistory: (params) => apiClient.get('/visitor/history', { params }),
    getVisitorHistoryAdmin: (params) => apiClient.get('/visitor-history', { params }),
    getVisitorHistoryDetails: (id) => apiClient.get(`/visitor-history/${id}`),
};
export default historyService;
