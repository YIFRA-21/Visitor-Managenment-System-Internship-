import api from '../../../services/api';
export const visitorCategoryApi = {
    getAll: async (params) => {
        const res = await api.get('/visitor-categories', { params });
        return res.data;
    },
    getStats: async () => {
        const res = await api.get('/visitor-categories/stats');
        return res.data;
    },
    getById: async (id) => {
        const res = await api.get(`/visitor-categories/${id}`);
        return res.data;
    },
    getByCode: async (code) => {
        const res = await api.get(`/visitor-categories/by-code/${code}`);
        return res.data;
    },
    create: async (data) => {
        const res = await api.post('/visitor-categories', data);
        return res.data;
    },
    update: async (id, data) => {
        const res = await api.put(`/visitor-categories/${id}`, data);
        return res.data;
    },
    archive: async (id) => {
        const res = await api.patch(`/visitor-categories/${id}/archive`);
        return res.data;
    },
    restore: async (id) => {
        const res = await api.patch(`/visitor-categories/${id}/restore`);
        return res.data;
    },
    delete: async (id) => {
        const res = await api.delete(`/visitor-categories/${id}`);
        return res.data;
    }
};
