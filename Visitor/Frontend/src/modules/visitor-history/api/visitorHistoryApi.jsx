import api from '../../../services/api';
export const visitorHistoryApi = {
    getAll: async (params) => {
        const res = await api.get('/visitor-history', { params });
        return res.data;
    },
    getStats: async () => {
        const res = await api.get('/visitor-history/stats');
        return res.data;
    },
    getById: async (id) => {
        const res = await api.get(`/visitor-history/${id}`);
        return res.data;
    },
    updateMetadata: async (id, data) => {
        const res = await api.put(`/visitor-history/${id}`, data);
        return res.data;
    },
    delete: async (id) => {
        const res = await api.delete(`/visitor-history/${id}`);
        return res.data;
    }
};
export default visitorHistoryApi;
