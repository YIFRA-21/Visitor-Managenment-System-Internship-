// Frontend/src/services/managerApi.ts
import api from '../../../services/api';
export const managerApi = {
    // 1. Overview
    getOverview: async () => {
        const res = await api.get('/manager/overview');
        return res.data.data;
    },
    // 2. Employees & Hosts
    getEmployees: async (params) => {
        const res = await api.get('/manager/employees', { params });
        return res.data.data;
    },
    updateHostStatus: async (employeeId, data) => {
        const res = await api.patch(`/manager/employees/${employeeId}/host-status`, data);
        return res.data;
    },
    deleteEmployee: async (employeeId) => {
        try {
            const res = await api.delete(`/manager/employees/${employeeId}`);
            return res.data;
        } catch (err) {
            const fallback = await api.delete(`/employees/${employeeId}`);
            return fallback.data;
        }
    },
    // 3. Host Availability
    getHostAvailability: async () => {
        const res = await api.get('/manager/host-availability');
        return res.data.data;
    },
    // 4. Visitor Requests
    getVisitorRequests: async (params) => {
        const res = await api.get('/manager/visitor-requests', { params });
        return res.data;
    },
    getRequestDetails: async (id) => {
        const res = await api.get(`/manager/visitor-requests/${id}`);
        return res.data.data;
    },
    getAlternativeHosts: async (currentHostId) => {
        const res = await api.get('/manager/alternative-hosts', {
            params: { currentHostId }
        });
        return res.data.data;
    },
    reassignHost: async (appointmentId, data) => {
        const res = await api.post(`/manager/visitor-requests/${appointmentId}/reassign`, data);
        return res.data;
    },
    assignHostAndRoute: async (appointmentId, data) => {
        const res = await api.post(`/manager/visitor-requests/${appointmentId}/assign-host`, data);
        return res.data;
    },
    approveRequest: async (appointmentId, comments) => {
        const res = await api.post(`/manager/visitor-requests/${appointmentId}/approve`, { comments });
        return res.data;
    },
    rejectRequest: async (appointmentId, reason) => {
        const res = await api.post(`/manager/visitor-requests/${appointmentId}/reject`, { reason });
        return res.data;
    },
    // 5. Appointments & Meetings
    getAppointments: async (params) => {
        const res = await api.get('/manager/appointments', { params });
        return res.data.data;
    },
    getAppointmentDetails: async (id) => {
        const res = await api.get(`/manager/appointments/${id}`);
        return res.data.data;
    },
    createAppointment: async (data) => {
        const res = await api.post('/appointments', data);
        return res.data;
    },
    rescheduleAppointment: async (id, data) => {
        const res = await api.patch(`/appointments/${id}/reschedule`, data);
        return res.data;
    },
    cancelAppointment: async (id, reason) => {
        const res = await api.put(`/appointments/${id}/cancel`, { reason });
        return res.data;
    },
    // 6. Department Visitors
    getVisitors: async (params) => {
        const res = await api.get('/manager/visitors', { params });
        return res.data;
    },
    // 7. Reports
    getReports: async (type) => {
        const res = await api.get('/manager/reports', { params: { type } });
        return res.data.data;
    },
    exportData: async (type) => {
        const res = await api.get('/manager/export', { params: { type } });
        return res.data;
    },
    // 8. Audit Logs
    getAuditLogs: async (params) => {
        const res = await api.get('/manager/audit-logs', { params });
        return res.data.data;
    },
    // 9. Profile
    getProfile: async () => {
        const res = await api.get('/manager/profile');
        return res.data.data;
    },
    updateProfile: async (data) => {
        const res = await api.put('/manager/profile', data);
        return res.data;
    },
    // 10. Meeting Rooms & Spaces
    getRooms: async () => {
        const res = await api.get('/manager/rooms');
        return res.data.data;
    },
    bookRoom: async (data) => {
        const res = await api.post('/manager/rooms/book', data);
        return res.data;
    },
    // 11. Policies & Rules
    getPolicies: async () => {
        const res = await api.get('/manager/policies');
        return res.data.data;
    },
    updatePolicies: async (data) => {
        const res = await api.put('/manager/policies', data);
        return res.data.data;
    },
    // 12. Emergency Evacuation
    getEvacuationRoster: async () => {
        const res = await api.get('/manager/evacuation');
        return res.data.data;
    },
    // 13. Security Zones
    getSecurityZones: async () => {
        const res = await api.get('/manager/security-zones');
        return res.data.data;
    }
};
