import { apiClient } from '../../../services/apiClient';
export const orgService = {
    list: () => apiClient.get('/organizations/public'),
    get: (id) => apiClient.get(`/organizations/${id}`),
    branches: (orgId) => apiClient.get(`/organizations/${orgId}/branches`),
    publicBranches: (orgId) => apiClient.get(`/organizations/${orgId}/branches/public`),
    create: (data) => apiClient.post('/organizations', data),
    update: (id, data) => apiClient.put(`/organizations/${id}`, data),
    getHierarchy: () => apiClient.get('/hierarchy'),
    getSettings: (orgId) => apiClient.get(`/organizations/${orgId}/settings`),
    updateSettings: (orgId, data) => apiClient.put(`/organizations/${orgId}/settings`, data),
};
export default orgService;
