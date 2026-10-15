import { apiClient } from '../../../services/apiClient';
export const receptionService = {
    getDashboard: () => apiClient.get('/reception/dashboard'),
    getArrivals: (date) => apiClient.get('/reception/arrivals', { params: { date } }),
    getQueue: () => apiClient.get('/reception/queue'),
    getWaitingArea: () => apiClient.get('/reception/waiting-area'),
    registerWalkIn: (data) => apiClient.post('/reception/walkin', data),
    verifyAppointment: (code) => apiClient.get(`/reception/verify/${code}`),
    searchDirectory: (q) => apiClient.get('/reception/directory', { params: { q } }),
    getReports: (params) => apiClient.get('/reception/reports', { params }),
    getActivityLogs: (params) => apiClient.get('/reception/activity-log', { params }),
    updateProfile: (data) => apiClient.put('/reception/profile', data),
};
export default receptionService;
