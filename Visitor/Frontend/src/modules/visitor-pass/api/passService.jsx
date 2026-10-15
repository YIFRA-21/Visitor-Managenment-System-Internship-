import { apiClient } from '../../../services/apiClient';
export const passService = {
    getPasses: () => apiClient.get('/visitor/passes'),
    getPassQR: (id) => apiClient.get(`/visitor/passes/${id}/qr`),
    issuePass: (data) => apiClient.post('/reception/passes/issue', data),
    getBadgeInventory: () => apiClient.get('/reception/badges'),
    updateBadgeStatus: (id, status) => apiClient.patch(`/reception/badges/${id}/status`, { status }),
    verifyPass: (referenceCode) => apiClient.get(`/security/verify/${referenceCode}`),
};
export default passService;
