import { apiClient } from '../../../services/apiClient';
export const systemService = {
    dashboard: () => apiClient.get('/system/dashboard'),
    health: () => apiClient.get('/system/health'),
    listSettings: (params) => apiClient.get('/system/settings', { params }),
    getSetting: (key) => apiClient.get(`/system/settings/${key}`),
    upsertSetting: (data) => apiClient.put('/system/settings', data),
    deleteSetting: (key) => apiClient.delete(`/system/settings/${key}`),
    getSettingCategories: () => apiClient.get('/system/settings/categories'),
    listFeatureFlags: () => apiClient.get('/system/feature-flags'),
    toggleFeatureFlag: (id, enabled) => apiClient.patch(`/system/feature-flags/${id}`, { enabled }),
    listModules: () => apiClient.get('/system/modules'),
    toggleModule: (id, enabled) => apiClient.patch(`/system/modules/${id}`, { enabled }),
    listAuditLogs: (params) => apiClient.get('/system/audit-logs', { params }),
    listConfigurations: (params) => apiClient.get('/system/configurations', { params }),
    updateConfiguration: (id, value) => apiClient.patch(`/system/configurations/${id}`, { value }),
};
export default systemService;
