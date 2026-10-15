import { apiClient } from '../../../services/apiClient';
export const documentService = {
    getDocuments: () => apiClient.get('/visitor/documents'),
    uploadDocument: (file, documentType, documentNumber, expiryDate) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);
        if (documentNumber)
            formData.append('documentNumber', documentNumber);
        if (expiryDate)
            formData.append('expiryDate', expiryDate);
        return apiClient.post('/visitor/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    updateDocument: (id, data) => {
        const formData = new FormData();
        if (data.file)
            formData.append('file', data.file);
        if (data.documentType)
            formData.append('documentType', data.documentType);
        if (data.documentNumber !== undefined)
            formData.append('documentNumber', data.documentNumber);
        if (data.expiryDate !== undefined)
            formData.append('expiryDate', data.expiryDate);
        return apiClient.put(`/visitor/documents/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    deleteDocument: (id) => apiClient.delete(`/visitor/documents/${id}`),
    // Admin Document Registry
    getAllDocuments: (params) => apiClient.get('/documents', { params }),
    verifyDocument: (id, status, notes) => apiClient.patch(`/documents/${id}/verify`, { status, notes }),
};
export default documentService;
