import { apiClient, withRetry } from '../../../services/apiClient';
export const appointmentService = {
    create: (data) => apiClient.post('/appointments', data),
    uploadDocument: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return withRetry(() => apiClient.post('/appointments/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
        }));
    },
    uploadFront: (file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);
        return withRetry(() => apiClient.post('/appointments/upload/front', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
            onUploadProgress: (e) => {
                if (onProgress && e.total)
                    onProgress(Math.round((e.loaded * 100) / e.total));
            },
        }));
    },
    uploadBack: (file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);
        return withRetry(() => apiClient.post('/appointments/upload/back', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
            onUploadProgress: (e) => {
                if (onProgress && e.total)
                    onProgress(Math.round((e.loaded * 100) / e.total));
            },
        }));
    },
    uploadSelfie: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return withRetry(() => apiClient.post('/appointments/upload/selfie', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
        }));
    },
    uploadSelfieBase64: (imageData) => {
        return withRetry(() => apiClient.post('/appointments/upload/selfie-base64', { imageData }, {
            timeout: 60000,
        }));
    },
    list: (params) => apiClient.get('/appointments', { params }),
    get: (id) => apiClient.get(`/appointments/${id}`),
    track: (reference, email) => apiClient.get('/appointments/track', { params: { reference, email } }),
    approve: (id, comment) => apiClient.patch(`/appointments/${id}/approve`, { comment }),
    reject: (id, comment) => apiClient.patch(`/appointments/${id}/reject`, { comment }),
    reschedule: (id, data) => apiClient.patch(`/appointments/${id}/reschedule`, data),
    forgotReference: (email) => apiClient.post('/appointments/forgot-reference', { email }),
    verifyIdentity: (data) => apiClient.post('/appointments/verify-identity', data),
};
export default appointmentService;
