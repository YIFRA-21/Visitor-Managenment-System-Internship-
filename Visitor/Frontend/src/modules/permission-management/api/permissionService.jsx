import { apiClient } from '../../../services/apiClient';
export const permissionService = {
    getAll: (params) => apiClient.get('/permissions', { params }),
    getById: (id) => apiClient.get(`/permissions/${id}`),
    create: (data) => apiClient.post('/permissions', data),
    update: (id, data) => apiClient.patch(`/permissions/${id}`, data),
    activate: (id) => apiClient.post(`/permissions/${id}/activate`),
    deactivate: (id) => apiClient.post(`/permissions/${id}/deactivate`),
    archive: (id) => apiClient.post(`/permissions/${id}/archive`),
    restore: (id) => apiClient.post(`/permissions/${id}/restore`),
    clone: (id) => apiClient.post(`/permissions/${id}/clone`),
    getStatistics: () => apiClient.get('/permissions/statistics'),
    getMatrix: () => apiClient.get('/permissions/matrix'),
    updateMatrix: (data) => apiClient.post('/permissions/matrix', data),
    getGroups: () => apiClient.get('/permissions/groups'),
    getTemplates: () => apiClient.get('/permissions/templates'),
    testAuthorization: (data) => apiClient.post('/permissions/authorize-test', data),
    importPermissions: (data) => apiClient.post('/permissions/import', data),
    exportPermissions: (format) => apiClient.get('/permissions/export', { params: { format } }),
    getMyPermissions: () => apiClient.get('/permissions/my-permissions'),
};
export default permissionService;
