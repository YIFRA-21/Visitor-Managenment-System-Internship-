import { apiClient } from '../../../services/apiClient';
export const employeeService = {
    // Employee Directory / CRUD (Admin)
    list: (params) => apiClient.get('/employees', { params }),
    publicList: () => apiClient.get('/employees/public'),
    get: (id) => apiClient.get(`/employees/${id}`),
    getMyProfile: () => apiClient.get('/employees/me'),
    create: (data) => apiClient.post('/employees', data),
    update: (id, data) => apiClient.put(`/employees/${id}`, data),
    updateAvailability: (id, availability_status) => apiClient.patch(`/employees/${id}/availability`, { availability_status }),
    updateHostSettings: (id, data) => apiClient.patch(`/employees/${id}/host-settings`, data),
    setStatus: (id, employment_status, reason) => apiClient.patch(`/employees/${id}/status`, { employment_status, reason }),
    archive: (id) => apiClient.patch(`/employees/${id}/archive`),
    restore: (id) => apiClient.patch(`/employees/${id}/restore`),
    delete: (id) => apiClient.delete(`/employees/${id}`),
    getDashboardStats: () => apiClient.get('/employees/dashboard-stats'),
    getAppointmentHistory: (id) => apiClient.get(`/employees/${id}/appointments`),
    getAuditLogs: (limit) => apiClient.get('/employees/audit-logs', { params: { limit } }),
    bulkImport: (employees) => apiClient.post('/employees/import', { employees }),
    availability: (id, date) => apiClient.get(`/employees/${id}/availability?date=${date}`),
    resendRegistrationEmail: (id) => apiClient.post(`/employees/${id}/resend-registration-email`),
    // Employee Portal (Self-Service)
    getDashboard: () => apiClient.get('/employee-portal/dashboard'),
    getRequests: (status) => apiClient.get('/employee-portal/requests', { params: { status } }),
    getVisitorRequests: (status) => apiClient.get('/employee-portal/requests', { params: { status } }),
    requestAction: (id, action, data) => apiClient.post(`/employee-portal/requests/${id}/action`, { action, ...data }),
    getMyAppointments: () => apiClient.get('/employee-portal/my-appointments'),
    getMyVisitors: () => apiClient.get('/employee-portal/my-visitors'),
    getRooms: () => apiClient.get('/employee-portal/rooms'),
    reserveRoom: (data) => apiClient.post('/employee-portal/rooms/reserve', data),
    getSupportTickets: () => apiClient.get('/employee-portal/support/tickets'),
    createSupportTicket: (data) => apiClient.post('/employee-portal/support/tickets', data),
};
export default employeeService;
