import api from './api';

/**
 * Enterprise Location & Workplace Management API Service
 * Handles full physical hierarchy:
 * Organization -> Branch -> Building -> Floor -> Room/Office -> Employee Workplace
 */

export const locationService = {
    // ── Buildings ─────────────────────────────────────────────────────────────
    getBuildings: async (params = {}) => {
        const query = new URLSearchParams();
        if (params.organization_id) query.append('organization_id', params.organization_id);
        if (params.branch_id) query.append('branch_id', params.branch_id);
        if (params.status) query.append('status', params.status);
        if (params.search) query.append('search', params.search);
        if (params.page) query.append('page', params.page);
        if (params.limit) query.append('limit', params.limit);

        const res = await api.get(`/buildings?${query.toString()}`);
        return res.data;
    },

    getBuildingById: async (id) => {
        const res = await api.get(`/buildings/${id}`);
        return res.data;
    },

    createBuilding: async (data) => {
        const res = await api.post('/buildings', data);
        return res.data;
    },

    updateBuilding: async (id, data) => {
        const res = await api.put(`/buildings/${id}`, data);
        return res.data;
    },

    deleteBuilding: async (id) => {
        const res = await api.delete(`/buildings/${id}`);
        return res.data;
    },

    getBuildingStats: async (id) => {
        const res = await api.get(`/buildings/${id}/stats`);
        return res.data;
    },

    // ── Floors ────────────────────────────────────────────────────────────────
    getFloors: async (params = {}) => {
        const query = new URLSearchParams();
        if (params.building_id) query.append('building_id', params.building_id);
        if (params.status) query.append('status', params.status);
        if (params.search) query.append('search', params.search);
        if (params.page) query.append('page', params.page);
        if (params.limit) query.append('limit', params.limit);

        const res = await api.get(`/floors?${query.toString()}`);
        return res.data;
    },

    getFloorById: async (id) => {
        const res = await api.get(`/floors/${id}`);
        return res.data;
    },

    createFloor: async (data) => {
        const res = await api.post('/floors', data);
        return res.data;
    },

    updateFloor: async (id, data) => {
        const res = await api.put(`/floors/${id}`, data);
        return res.data;
    },

    deleteFloor: async (id) => {
        const res = await api.delete(`/floors/${id}`);
        return res.data;
    },

    // ── Rooms ─────────────────────────────────────────────────────────────────
    getRooms: async (params = {}) => {
        const query = new URLSearchParams();
        if (params.building_id) query.append('building_id', params.building_id);
        if (params.floor_id) query.append('floor_id', params.floor_id);
        if (params.branch_id) query.append('branch_id', params.branch_id);
        if (params.department_id) query.append('department_id', params.department_id);
        if (params.room_type) query.append('room_type', params.room_type);
        if (params.is_bookable !== undefined) query.append('is_bookable', params.is_bookable);
        if (params.status) query.append('status', params.status);
        if (params.search) query.append('search', params.search);
        if (params.page) query.append('page', params.page);
        if (params.limit) query.append('limit', params.limit);

        const res = await api.get(`/rooms?${query.toString()}`);
        return res.data;
    },

    getRoomById: async (id) => {
        const res = await api.get(`/rooms/${id}`);
        return res.data;
    },

    createRoom: async (data) => {
        const res = await api.post('/rooms', data);
        return res.data;
    },

    updateRoom: async (id, data) => {
        const res = await api.put(`/rooms/${id}`, data);
        return res.data;
    },

    deleteRoom: async (id) => {
        const res = await api.delete(`/rooms/${id}`);
        return res.data;
    },

    checkRoomAvailability: async (roomId, startTime, endTime) => {
        const res = await api.get(`/rooms/${roomId}/availability`, {
            params: { start_time: startTime, end_time: endTime }
        });
        return res.data;
    },

    // ── Workplace & Employee Location Management ──────────────────────────────
    getWorkplaceAssignments: async (params = {}) => {
        const query = new URLSearchParams();
        if (params.organization_id) query.append('organization_id', params.organization_id);
        if (params.branch_id) query.append('branch_id', params.branch_id);
        if (params.building_id) query.append('building_id', params.building_id);
        if (params.floor_id) query.append('floor_id', params.floor_id);
        if (params.room_id) query.append('room_id', params.room_id);
        if (params.department_id) query.append('department_id', params.department_id);
        if (params.status) query.append('status', params.status);
        if (params.search) query.append('search', params.search);
        if (params.page) query.append('page', params.page);
        if (params.limit) query.append('limit', params.limit);

        const res = await api.get(`/workplace/assignments?${query.toString()}`);
        return res.data;
    },

    assignEmployeeWorkplace: async (data) => {
        const res = await api.post('/workplace/assign', data);
        return res.data;
    },

    getEmployeeWorkplaceHistory: async (employeeId) => {
        const res = await api.get(`/workplace/history/${employeeId}`);
        return res.data;
    },

    getWorkplaceStats: async (params = {}) => {
        const res = await api.get('/workplace/stats', { params });
        return res.data;
    },

    // ── Common Location Reference Data ────────────────────────────────────────
    getOrganizations: async () => {
        const res = await api.get('/organizations/public');
        return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    },

    getBranches: async (orgId) => {
        const query = orgId ? `?organization_id=${orgId}` : '';
        const res = await api.get(`/branches/search${query}`);
        return res.data?.data || res.data || [];
    },

    getDepartments: async (params = {}) => {
        const query = new URLSearchParams();
        if (params.branch_id) query.append('branch_id', params.branch_id);
        if (params.organization_id) query.append('organization_id', params.organization_id);
        const res = await api.get(`/departments?${query.toString()}`);
        return res.data?.data || res.data || [];
    }
};

export default locationService;
