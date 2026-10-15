import { apiClient } from '../../../services/apiClient';
export const workflowService = {
    getWorkflows: () => apiClient.get('/workflows'),
    getWorkflowById: (id) => apiClient.get(`/workflows/${id}`),
    createWorkflow: (data) => apiClient.post('/workflows', data),
    updateWorkflow: (id, data) => apiClient.put(`/workflows/${id}`, data),
    deleteWorkflow: (id) => apiClient.delete(`/workflows/${id}`),
    getRules: () => apiClient.get('/rules'),
    getApprovals: () => apiClient.get('/rules/approvals'),
    getAuditHistory: () => apiClient.get('/rules/audit'),
};
export default workflowService;
