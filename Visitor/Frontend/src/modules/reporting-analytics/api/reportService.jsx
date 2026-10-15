import { apiClient } from '../../../services/apiClient';
export const reportService = {
    dashboard: () => apiClient.get('/reports/dashboard'),
    visitors: (from, to) => apiClient.get('/reports/visitors', { params: { from, to } }),
    auditLogs: () => apiClient.get('/reports/audit-logs'),
    kpis: () => apiClient.get('/reports/kpis'),
    departments: () => apiClient.get('/reports/departments'),
    occupancy: (dateFrom, dateTo) => apiClient.get('/reports/occupancy', { params: { dateFrom, dateTo } }),
    saved: () => apiClient.get('/reports/saved'),
    custom: (data) => apiClient.post('/reports/custom', data),
    export: (data) => apiClient.post('/reports/export', data),
};
export default reportService;
