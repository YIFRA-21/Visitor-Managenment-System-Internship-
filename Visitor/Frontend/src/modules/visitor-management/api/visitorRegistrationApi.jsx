import api from '../../../services/api';
export const visitorRegistrationApi = {
    // Register Master Record
    register: async (formData) => {
        const response = await api.post('/visitors/registration/register', formData);
        return response.data;
    },
    // Real-time Field & Duplicate Validator
    validate: async (formData) => {
        const response = await api.post('/visitors/registration/validate', formData);
        return response.data;
    },
    // Save Draft
    saveDraft: async (draftId, currentStep, formData) => {
        const response = await api.post('/visitors/registration/save-draft', { draftId, currentStep, formData });
        return response.data;
    },
    // Get Draft
    getDraft: async (draftId) => {
        const response = await api.get(`/visitors/registration/draft/${draftId}`);
        return response.data;
    },
    // List Saved Drafts
    listDrafts: async () => {
        const response = await api.get('/visitors/registration/drafts');
        return response.data;
    },
    // Get Details
    getDetails: async (id) => {
        const response = await api.get(`/visitors/registration/${id}`);
        return response.data;
    },
    // List History / Table Records
    listHistory: async (params) => {
        const response = await api.get('/visitors/registration/history', { params });
        return response.data;
    },
    // Upload Photo Asset
    uploadPhoto: async (photoData, fileName) => {
        const response = await api.post('/visitors/registration/upload-photo', { photoData, fileName });
        return response.data;
    },
    // Upload Document Asset
    uploadDocument: async (docPayload) => {
        const response = await api.post('/visitors/registration/upload-document', docPayload);
        return response.data;
    }
};
export default visitorRegistrationApi;
