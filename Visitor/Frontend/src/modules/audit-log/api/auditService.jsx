import { apiClient } from '../../../services/apiClient';
export const auditService = {
    listAuditLogs: (params) => apiClient.get('/system/audit-logs', { params }),
};
export default auditService;
