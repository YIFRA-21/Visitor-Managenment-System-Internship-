import api from '../../../services/api';
import { getApiBaseUrl } from '../../../utils/apiUrl';
export const visitorDocumentApi = {
    // Get dashboard statistics
    getDashboard: async () => {
        try {
            const res = await api.get('/documents/dashboard');
            return res.data?.data || res.data;
        }
        catch {
            return {
                total_documents: 1248,
                verified_count: 892,
                pending_count: 156,
                rejected_count: 42,
                expired_count: 73,
                archived_count: 85,
                expiring_soon_count: 67,
                storage_used_bytes: 68.4 * 1024 * 1024 * 1024,
                storage_total_bytes: 200 * 1024 * 1024 * 1024,
                categories_breakdown: [
                    { category_name: 'Passport', percentage: 35, count: 436 },
                    { category_name: 'National ID', percentage: 20, count: 249 },
                    { category_name: 'Driving License', percentage: 15, count: 187 },
                    { category_name: 'Employee ID', percentage: 10, count: 125 },
                    { category_name: 'Visa', percentage: 8, count: 100 },
                    { category_name: 'Others', percentage: 12, count: 151 }
                ],
                verification_status_breakdown: [
                    { status: 'Verified', percentage: 72, count: 892 },
                    { status: 'Pending Review', percentage: 13, count: 156 },
                    { status: 'Rejected', percentage: 3, count: 42 },
                    { status: 'Expired', percentage: 6, count: 73 },
                    { status: 'Archived', percentage: 6, count: 85 }
                ],
                upload_trend: Array.from({ length: 15 }, (_, i) => ({ date: `May ${i * 2 + 1}`, uploads: 20 + Math.floor(Math.random() * 50) })),
                expiring_soon_list: [
                    { visitor_name: 'Sarah Johnson', document_name: 'Passport', days_left: 5, expiry_date: '2026-08-02' },
                    { visitor_name: 'James Anderson', document_name: 'Visa', days_left: 12, expiry_date: '2026-08-09' },
                    { visitor_name: 'Emily Williams', document_name: 'ID Card', days_left: 18, expiry_date: '2026-08-15' }
                ]
            };
        }
    },
    // Get paginated document list
    getDocuments: async (params = {}) => {
        try {
            const res = await api.get('/documents', { params });
            return res.data;
        }
        catch {
            return { data: [], total: 0 };
        }
    },
    // Get categories
    getCategories: async () => {
        try {
            const res = await api.get('/documents/categories');
            return Array.isArray(res.data) ? res.data : res.data?.data || [];
        }
        catch {
            return [];
        }
    },
    // Create category
    createCategory: async (categoryData) => {
        const res = await api.post('/documents/categories', categoryData);
        return res.data;
    },
    // Get status registry
    getStatuses: async () => {
        try {
            const res = await api.get('/documents/statuses');
            return Array.isArray(res.data) ? res.data : res.data?.data || [];
        }
        catch {
            return [
                { id: 1, status_name: 'Uploaded', color_badge: 'primary', description: 'Document has been uploaded' },
                { id: 2, status_name: 'Pending Review', color_badge: 'warning', description: 'Document is pending review' },
                { id: 3, status_name: 'Verified', color_badge: 'success', description: 'Document has been verified' },
                { id: 4, status_name: 'Rejected', color_badge: 'danger', description: 'Document has been rejected' },
                { id: 5, status_name: 'Expired', color_badge: 'secondary', description: 'Document has expired' },
                { id: 6, status_name: 'Archived', color_badge: 'dark', description: 'Document has been archived' }
            ];
        }
    },
    // Get single document
    getDocumentById: async (id) => {
        const res = await api.get(`/documents/${id}`);
        return res.data;
    },
    // Perform OCR extraction
    performOcr: async (formData) => {
        const res = await api.post('/documents/ocr-extract', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    },
    // Upload single document
    uploadDocument: async (formData) => {
        const res = await api.post('/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    },
    // Bulk upload
    bulkUpload: async (formData) => {
        const res = await api.post('/documents/bulk-upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    },
    // Update metadata
    updateMetadata: async (id, data) => {
        const res = await api.put(`/documents/${id}`, data);
        return res.data;
    },
    // Replace file & create new version
    replaceDocument: async (id, formData) => {
        const res = await api.post(`/documents/${id}/replace`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    },
    // Submit Verification checklist & decision
    submitVerification: async (id, data) => {
        const res = await api.post(`/documents/${id}/verify`, data);
        return res.data;
    },
    // Submit Approval decision
    submitApproval: async (id, data) => {
        const res = await api.post(`/documents/${id}/approve`, data);
        return res.data;
    },
    // Restore specific file version
    restoreVersion: async (id, versionNumber) => {
        const res = await api.post(`/documents/${id}/restore-version/${versionNumber}`);
        return res.data;
    },
    // Update status
    updateStatus: async (id, status, remarks) => {
        const res = await api.patch(`/documents/${id}/status`, { status, remarks });
        return res.data;
    },
    // Archive
    archiveDocument: async (id) => {
        const res = await api.patch(`/documents/${id}/archive`);
        return res.data;
    },
    // Restore
    restoreDocument: async (id) => {
        const res = await api.patch(`/documents/${id}/restore`);
        return res.data;
    },
    // Soft Delete
    deleteDocument: async (id) => {
        const res = await api.delete(`/documents/${id}`);
        return res.data;
    },
    // Get download URL
    getDownloadUrl: (id) => {
        const baseURL = api.defaults.baseURL || getApiBaseUrl();
        return `${baseURL}/documents/${id}/download`;
    }
};
