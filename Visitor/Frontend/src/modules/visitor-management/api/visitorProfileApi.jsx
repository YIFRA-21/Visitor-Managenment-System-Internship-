import api from '../../../services/api';
export const visitorProfileApi = {
    // Directory listing with search, filter, sort, paginate
    getDirectory: async (params) => {
        const response = await api.get('/visitor-profiles', { params });
        return response.data;
    },
    // Summary statistics
    getStats: async () => {
        const response = await api.get('/visitor-profiles/stats');
        return response.data;
    },
    // Full profile detail
    getProfile: async (id) => {
        const response = await api.get(`/visitor-profiles/${id}`);
        return response.data;
    },
    // Update profile fields
    updateProfile: async (id, data) => {
        const response = await api.put(`/visitor-profiles/${id}`, data);
        return response.data;
    },
    // Change status
    changeStatus: async (id, status, reason) => {
        const response = await api.patch(`/visitor-profiles/${id}/status`, { status, reason });
        return response.data;
    },
    // Archive
    archive: async (id) => {
        const response = await api.post(`/visitor-profiles/${id}/archive`);
        return response.data;
    },
    // Restore
    restore: async (id) => {
        const response = await api.post(`/visitor-profiles/${id}/restore`);
        return response.data;
    },
    // Photo management
    addPhoto: async (id, photoData, rotation = 0, zoom = 1.0) => {
        const response = await api.post(`/visitor-profiles/${id}/photos`, { photoPath: photoData, photoData, rotation, zoom });
        return response.data;
    },
    setActivePhoto: async (id, photoId) => {
        const response = await api.patch(`/visitor-profiles/${id}/photos/${photoId}/active`);
        return response.data;
    },
    deletePhoto: async (photoId) => {
        const response = await api.delete(`/visitor-profiles/photos/${photoId}`);
        return response.data;
    },
    // Add note
    addNote: async (id, noteType, content) => {
        const response = await api.post(`/visitor-profiles/${id}/notes`, { noteType, content });
        return response.data;
    },
    // Delete note
    deleteNote: async (noteId) => {
        const response = await api.delete(`/visitor-profiles/notes/${noteId}`);
        return response.data;
    },
    // Verify identity
    verifyIdentity: async (id, verificationStatus) => {
        const response = await api.patch(`/visitor-profiles/${id}/verify-identity`, { verificationStatus });
        return response.data;
    },
    // Toggle blacklist
    toggleBlacklist: async (id, blacklist, reason) => {
        const response = await api.patch(`/visitor-profiles/${id}/blacklist`, { blacklist, reason });
        return response.data;
    },
    // Generate visitor pass data
    generatePass: async (id) => {
        const response = await api.get(`/visitor-profiles/${id}/pass`);
        return response.data;
    },
    // Delete visitor profile and cascade clean all linked data (history, documents, photos, appointments, etc.)
    deleteProfile: async (id) => {
        const response = await api.delete(`/visitor-profiles/${id}`);
        return response.data;
    },
};
export default visitorProfileApi;
