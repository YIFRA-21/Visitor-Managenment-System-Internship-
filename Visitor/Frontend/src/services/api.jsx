import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiUrl';
const API_URL = getApiBaseUrl();
const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000, // 30 second timeout for all requests
});
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token)
        config.headers.Authorization = `Bearer ${token}`;
    return config;
});
api.interceptors.response.use((res) => res, (err) => {
    const isBlocked = err.response?.data?.code === 'ACCOUNT_BLOCKED' || err.response?.data?.isBlocked;
    const status = err.response?.status;
    const publicPaths = ['/login', '/signup', '/register', '/forgot-password', '/reset-password', '/book'];
    const isPublicPath = typeof window !== 'undefined' && publicPaths.some((p) => window.location.pathname.includes(p));

    // Auto-logout on 401 or 403 (when account is blocked/suspended)
    if (status === 401 || (status === 403 && isBlocked)) {
        if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true' && !isBlocked) {
            return Promise.reject(err);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('refreshToken');

        if (!isPublicPath) {
            window.location.href = isBlocked ? '/login?blocked=true' : '/login';
        }
        return Promise.reject(err);
    }

    // Trigger global notification for API errors unless silenced by caller
    // 401 is an authentication state and client validation errors (400, 409, 422) on public auth pages are handled inline
    const isPublicFormValidation = isPublicPath && (status === 400 || status === 409 || status === 422);
    if (!err.config?.skipGlobalErrorNotification && !err.config?.silent && status !== 401 && !isPublicFormValidation) {
        const errorMessage = getErrorMessage(err);
        if (errorMessage && typeof window !== 'undefined' && window.showNotification) {
            const notifType = status === 403 ? 'warning' : status >= 500 ? 'error' : 'error';
            window.showNotification(errorMessage, notifType);
        }
    }

    return Promise.reject(err);
});
// Retry wrapper with exponential backoff for transient errors (429, 5xx)
const withRetry = async (fn, maxRetries = 2) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (err) {
            const axErr = err;
            const status = axErr.response?.status;
            const isRetryable = status === 429 || (status !== undefined && status >= 500);
            if (!isRetryable || attempt === maxRetries)
                throw err;
            const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
            await new Promise((r) => setTimeout(r, delay));
        }
    }
    throw new Error('Retry exhausted');
};
// Helper to get detailed error message from API error
export const getErrorMessage = (err) => {
    if (!err)
        return 'An unexpected error occurred. Please try again.';
    if (typeof err === 'string')
        return err;
    const axErr = err;
    if (axErr.code === 'ECONNABORTED')
        return 'Network timeout. Check your connection and try again.';
    if (axErr.code === 'ERR_NETWORK')
        return 'Network error. Server may be unavailable.';
    const status = axErr.response?.status;
    const data = axErr.response?.data;
    if (status === 401)
        return '';
    if (status === 429)
        return 'Upload rate limit exceeded. Please wait a moment and retry.';
    if (status === 413)
        return 'Maximum file size exceeded (5MB limit).';
    // First try: plain string message field (most backend AppError responses)
    if (typeof data?.message === 'string' && data.message) {
        if (/authenticated user token|protected endpoint requires|authentication required/i.test(data.message)) {
            return '';
        }
        return data.message;
    }
    // Second try: validation details array (e.g. { error: 'Validation failed', details: [{field, message}] })
    if (Array.isArray(data?.details) && data.details.length > 0) {
        const firstDetail = data.details[0];
        if (typeof firstDetail?.message === 'string')
            return firstDetail.message;
        if (typeof firstDetail === 'string')
            return firstDetail;
    }
    // Third try: error field — sanitize to avoid exposing sensitive internal SQL errors
    const rawError = data?.error;
    if (rawError) {
        if (typeof rawError === 'string') {
            // Mask raw SQL syntax dumps
            if (/select|insert|update|delete|table|column|sql|foreign key/i.test(rawError)) {
                return 'A database constraint prevented this operation. Please verify your data.';
            }
            return rawError;
        }
        if (typeof rawError === 'object') {
            if (typeof rawError.sqlMessage === 'string' && rawError.sqlMessage)
                return 'A database constraint prevented this operation. Please verify your data.';
            if (typeof rawError.message === 'string' && rawError.message) {
                if (/select|insert|update|delete|table|column|sql|foreign key/i.test(rawError.message)) {
                    return 'A database operation could not be completed.';
                }
                return rawError.message;
            }
            return 'An unexpected server error occurred.';
        }
    }
    if (status === 400)
        return 'Invalid request. Please check your input.';
    if (status === 401)
        return 'Authentication required. Please log in again.';
    if (status === 403)
        return 'You do not have permission to perform this action.';
    if (status === 404)
        return 'Requested resource not found.';
    if (status === 500)
        return 'Server error. Please try again later.';
    if (axErr.message && typeof axErr.message === 'string')
        return axErr.message;
    return 'An unexpected error occurred. Please try again.';
};
export default api;
export const authApi = {
    checkEmail: (email) => api.post('/auth/check-email', { email }, { silent: true }),
    checkUsername: (username) => api.post('/auth/check-username', { username }, { silent: true }),
    login: (identifier, password) => api.post('/auth/login', { identifier, email: identifier, password }),
    register: (data) => api.post('/auth/register', data),
    me: () => api.get('/auth/me'),
    forgotPassword: (identifier) => api.post('/auth/forgot-password', { identifier, email: identifier, userId: identifier }),
    resetPassword: (identifier, token, newPassword) => api.post('/auth/reset-password', { identifier, email: identifier, userId: identifier, token, resetToken: token, newPassword }),
    logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
    refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
    currentUser: () => api.get('/auth/me'),
    verifyOtp: (identifier, code) => api.post('/auth/verify-email', { identifier, email: identifier, userId: identifier, token: code, code }),
    resendVerification: (identifier) => api.post('/auth/resend-verification', { identifier, email: identifier, userId: identifier }),
    changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
    getActiveSessions: () => api.get('/auth/sessions'),
    terminateSession: (sessionId) => api.delete(`/auth/sessions/${sessionId}`),
    terminateAllSessions: () => api.delete('/auth/sessions'),
    getMyPermissions: () => api.get('/auth/me/permissions'),
    getMyResources: () => api.get('/auth/me/resources'),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
};
export const departmentsApi = {
    list: () => api.get('/departments'),
    publicList: () => api.get('/departments/public'),
    create: (data) => api.post('/departments', data),
    employees: (id) => api.get(`/departments/${id}/employees`),
    delete: (id) => api.delete(`/departments/${id}`),
};
export const organizationsApi = {
    list: () => api.get('/organizations/public'),
    get: (id) => api.get(`/organizations/${id}`),
    branches: (orgId) => api.get(`/organizations/${orgId}/branches`),
    publicBranches: (orgId) => api.get(`/organizations/${orgId}/branches/public`),
    delete: (id) => api.delete(`/organizations/${id}`),
};
export const branchesApi = {
    get: (id) => api.get(`/branches/${id}`),
    delete: (id) => api.delete(`/branches/${id}`),
};
export const employeesApi = {
    list: (params) => api.get('/employees', { params }),
    publicList: () => api.get('/employees/public'),
    get: (id) => api.get(`/employees/${id}`),
    getMyProfile: () => api.get('/employees/me'),
    create: (data) => api.post('/employees', data),
    update: (id, data) => api.put(`/employees/${id}`, data),
    updateAvailability: (id, availability_status) => api.patch(`/employees/${id}/availability`, { availability_status }),
    updateHostSettings: (id, data) => api.patch(`/employees/${id}/host-settings`, data),
    setStatus: (id, employment_status, reason) => api.patch(`/employees/${id}/status`, { employment_status, reason }),
    archive: (id) => api.patch(`/employees/${id}/archive`),
    restore: (id) => api.patch(`/employees/${id}/restore`),
    delete: (id) => api.delete(`/employees/${id}`),
    getDashboardStats: () => api.get('/employees/dashboard-stats'),
    getAppointmentHistory: (id) => api.get(`/employees/${id}/appointments`),
    getAuditLogs: (paramsOrLimit) => {
        if (typeof paramsOrLimit === 'object' && paramsOrLimit !== null) {
            return api.get('/employees/audit-logs', { params: paramsOrLimit });
        }
        return api.get('/employees/audit-logs', { params: { limit: paramsOrLimit || 100 } });
    },
    getEmployeeAuditLogs: (id, limit) => api.get(`/employees/${id}/audit-logs`, { params: { limit: limit || 50 } }),
    bulkImport: (employees) => api.post('/employees/import', { employees }),
    availability: (id, date) => api.get(`/employees/${id}/availability?date=${date}`),
    resendRegistrationEmail: (id) => api.post(`/employees/${id}/resend-registration-email`),
};
export const employeeManagementApi = employeesApi;
export const roomsApi = {
    list: () => api.get('/rooms'),
    availability: (id, date) => api.get(`/rooms/${id}/availability?date=${date}`),
};
export const appointmentsApi = {
    create: (data) => api.post('/appointments', data),
    // Generic upload (backwards compatible)
    uploadDocument: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return withRetry(() => api.post('/appointments/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000, // 60s for uploads
        }));
    },
    // Front document upload with progress tracking
    uploadFront: (file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);
        return withRetry(() => api.post('/appointments/upload/front', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
            onUploadProgress: (e) => {
                if (onProgress && e.total)
                    onProgress(Math.round((e.loaded * 100) / e.total));
            },
        }));
    },
    // Back document upload with progress tracking
    uploadBack: (file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);
        return withRetry(() => api.post('/appointments/upload/back', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
            onUploadProgress: (e) => {
                if (onProgress && e.total)
                    onProgress(Math.round((e.loaded * 100) / e.total));
            },
        }));
    },
    // Selfie file upload
    uploadSelfie: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return withRetry(() => api.post('/appointments/upload/selfie', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
        }));
    },
    // Selfie from camera capture (Base64 data URL)
    uploadSelfieBase64: (imageData) => {
        return withRetry(() => api.post('/appointments/upload/selfie-base64', { imageData }, {
            timeout: 60000,
        }));
    },
    list: (params) => api.get('/appointments', { params }),
    get: (id) => api.get(`/appointments/${id}`),
    track: (reference, email) => api.get('/appointments/track', { params: { reference, email } }),
    approve: (id, comment) => api.patch(`/appointments/${id}/approve`, { comment }),
    reject: (id, comment) => api.patch(`/appointments/${id}/reject`, { comment }),
    reschedule: (id, data) => api.patch(`/appointments/${id}/reschedule`, data),
    forgotReference: (email) => api.post('/appointments/forgot-reference', { email }),
    verifyIdentity: (data) => api.post('/appointments/verify-identity', data),
    delete: (id) => api.delete(`/appointments/${id}`),
};
export const checkinApi = {
    // Existing
    liveBoard: (date) => api.get('/checkin/live-board', { params: { date } }),
    scan: (data) => api.post('/checkin/scan', data),
    checkout: (appointmentId, data) => api.post(`/checkin/${appointmentId}/checkout`, data),
    getActiveCheckin: (code) => api.get(`/checkin/active/${code}`),
    // Module 10 New
    dashboard: (date) => api.get('/checkin/dashboard', { params: { date } }),
    pending: (date) => api.get('/checkin/pending', { params: { date } }),
    history: (params) => api.get('/checkin/history', { params }),
    analytics: (dateFrom, dateTo) => api.get('/checkin/analytics', { params: { dateFrom, dateTo } }),
    walkin: (data) => api.post('/checkin/walkin', data),
    validate: (data) => api.post('/checkin/validate', data),
    search: (q, limit) => api.get('/checkin/search', { params: { q, limit } }),
    override: (data) => api.post('/checkin/override', data),
    queueStatus: () => api.get('/checkin/queue/status'),
    group: (data) => api.post('/checkin/group', data),
    delete: (id) => api.delete(`/checkin/${id}`),
};
export const checkoutApi = {
    dashboard: (date) => api.get('/checkout/dashboard', { params: { date } }),
    pending: (search) => api.get('/checkout/pending', { params: { search } }),
    overstay: () => api.get('/checkout/overstay'),
    evacuation: () => api.get('/checkout/evacuation'),
    history: (params) => api.get('/checkout/history', { params }),
    analytics: (dateFrom, dateTo) => api.get('/checkout/analytics', { params: { dateFrom, dateTo } }),
    process: (data) => api.post('/checkout/process', data),
    group: (data) => api.post('/checkout/group', data),
    delete: (id) => api.delete(`/checkout/${id}`),
};
export const securityApi = {
    dashboard: () => api.get('/security/dashboard'),
    watchlist: () => api.get('/security/watchlist'),
    addToWatchlist: (data) => api.post('/security/watchlist', data),
    removeFromWatchlist: (id) => api.delete(`/security/watchlist/${id}`),
    incidents: (status) => api.get('/security/incidents', { params: { status } }),
    reportIncident: (data) => api.post('/security/incidents', data),
    updateIncident: (id, data) => api.put(`/security/incidents/${id}`, data),
    deleteIncident: (id) => api.delete(`/security/incidents/${id}`),
    accessRules: () => api.get('/security/access-rules'),
    escorts: () => api.get('/security/escorts'),
    assignEscort: (data) => api.post('/security/escorts', data),
    updateEscort: (id, data) => api.put(`/security/escorts/${id}`, data),
    deleteEscort: (id) => api.delete(`/security/escorts/${id}`),
    analytics: (dateFrom, dateTo) => api.get('/security/analytics', { params: { dateFrom, dateTo } }),
    blacklist: () => api.get('/security/blacklist'),
    addToBlacklist: (data) => api.post('/security/blacklist', data),
    addBlacklist: (data) => api.post('/security/blacklist', data),
    removeFromBlacklist: (id) => api.delete(`/security/blacklist/${id}`),
    removeBlacklist: (id) => api.delete(`/security/blacklist/${id}`),
    verifyReference: (referenceCode) => api.get(`/security/verify/${referenceCode}`),
    verify: (referenceCode) => api.get(`/security/verify/${referenceCode}`),
    getProfile: () => api.get('/security/profile'),
    updateProfile: (data) => api.put('/security/profile', data),
    getAccessControlVisitors: () => api.get('/security/access-control/visitors'),
    searchVisitors: (params) => api.get('/security/search-visitors', { params }),
    grantAccessLevel: (data) => api.post('/security/access-control/grant', data),
    revokeAccessLevel: (data) => api.post('/security/access-control/revoke', data),
    simulateGateTap: (data) => api.post('/security/access-control/simulate-tap', data),
    getAccessLogs: (params) => api.get('/security/access-logs', { params }),
    simulateAccessEvent: (data) => api.post('/security/access-logs/simulate', data),
    createAccessRule: (data) => api.post('/security/access-rules', data),
    toggleAccessRule: (id) => api.put(`/security/access-rules/${id}/toggle`),
    deleteAccessRule: (id) => api.delete(`/security/access-rules/${id}`),
    getEscortOptions: () => api.get('/security/escorts/options'),
    completeEscort: (id) => api.post(`/security/escorts/${id}/complete`),
    getScreeningQueue: () => api.get('/security/screening/queue'),
    completeScreening: (data) => api.post('/security/screening/complete', data),
    getLiveOccupants: () => api.get('/security/occupants/live'),
};
export const receptionApi = {
    getDashboard: () => api.get('/reception/dashboard'),
    getArrivals: (filter) => api.get('/reception/arrivals', { params: { filter } }),
    getQueue: () => api.get('/reception/queue'),
    getProfile: () => api.get('/reception/profile'),
    updateProfile: (data) => api.put('/reception/profile', data),
};
export const reportsApi = {
    dashboard: () => api.get('/reports/dashboard'),
    visitors: (fromOrParams, to) => {
        const params = typeof fromOrParams === 'object' && fromOrParams !== null ? fromOrParams : { from: fromOrParams, to };
        return api.get('/reports/visitors', { params });
    },
    checkins: (params) => api.get('/reports/checkins', { params }),
    security: (params) => api.get('/reports/security', { params }),
    auditLogs: (params) => api.get('/reports/audit-logs', { params }),
    kpis: () => api.get('/reports/kpis'),
    stats: () => api.get('/reports/kpis'),
    departments: () => api.get('/reports/departments'),
    occupancy: (dateFrom, dateTo) => api.get('/reports/occupancy', { params: { dateFrom, dateTo } }),
    saved: () => api.get('/reports/saved'),
    custom: (data) => api.post('/reports/custom', data),
    export: (data) => api.post('/reports/export', data),
};
export const notificationsApi = {
    list: (params) => api.get('/notifications', { params, skipGlobalErrorNotification: true }),
    getNotifications: (params) => api.get('/notifications', { params, skipGlobalErrorNotification: true }),
    getDetails: (id) => api.get(`/notifications/${id}`),
    unreadCounts: () => api.get('/notifications/unread-count', { skipGlobalErrorNotification: true }),
    getUnreadCount: () => api.get('/notifications/unread-count', { skipGlobalErrorNotification: true }),
    markRead: (id) => api.put(`/notifications/${id}/read`),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markUnread: (id) => api.patch(`/notifications/${id}/unread`),
    delete: (id) => api.delete(`/notifications/${id}`),
    forward: (id, data) => api.post(`/notifications/${id}/forward`, data),
    markAllRead: () => api.put('/notifications/mark-all-read'),
    markAllAsRead: () => api.put('/notifications/mark-all-read'),
    bulkDelete: (ids) => api.post('/notifications/bulk-delete', { ids }),
};
export const dashboardApi = {
    stats: () => api.get('/dashboard/stats'),
    activities: () => api.get('/dashboard/activities'),
    layout: () => api.get('/dashboard/layout'),
    saveLayout: (data) => api.post('/dashboard/layout', data),
    search: (q) => api.get('/dashboard/search', { params: { q } }),
};
export const blacklistWatchlistApi = {
    getDirectory: (params) => api.get('/security/blacklist-watchlist', { params }),
    getRecordDetails: (id) => api.get(`/security/blacklist-watchlist/${id}`),
    createRecord: (data) => api.post('/security/blacklist-watchlist', data),
    updateRecord: (id, data) => api.put(`/security/blacklist-watchlist/${id}`, data),
    verifyVisitor: (data) => api.post('/security/blacklist-watchlist/verify', data),
    updateStatus: (id, status) => api.patch(`/security/blacklist-watchlist/${id}/status`, { status }),
    reviewClearance: (id, decision, notes) => api.post(`/security/blacklist-watchlist/${id}/clearance`, { decision, notes }),
    archiveRecord: (id) => api.patch(`/security/blacklist-watchlist/${id}/archive`),
    restoreRecord: (id) => api.patch(`/security/blacklist-watchlist/${id}/restore`),
    deleteRecord: (id) => api.delete(`/security/blacklist-watchlist/${id}`),
};
// ── Admin: User Management ──────────────────────────────────────────────────
export const userManagementApi = {
    list: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    remove: (id) => api.delete(`/users/${id}`),
    lock: (id) => api.patch(`/users/${id}/lock`),
    unlock: (id) => api.patch(`/users/${id}/unlock`),
    resetPassword: (id, newPassword) => api.patch(`/users/${id}/reset-password`, { newPassword }),
    stats: () => api.get('/users/stats'),
};
// ── Admin: Roles & Permissions ──────────────────────────────────────────────
export const rolesApi = {
    list: (params) => api.get('/roles', { params }),
    getById: (id) => api.get(`/roles/${id}`),
    create: (data) => api.post('/roles', data),
    update: (id, data) => api.put(`/roles/${id}`, data),
    remove: (id) => api.delete(`/roles/${id}`),
    getPermissions: (roleId) => api.get(`/roles/${roleId}/permissions`),
    syncPermissions: (roleId, permissionIds) => api.put(`/roles/${roleId}/permissions`, { permissionIds }),
    getMatrix: () => api.get('/roles/matrix'),
    getHierarchy: () => api.get('/roles/hierarchy'),
    listAllPermissions: (params) => api.get('/roles/permissions/all', { params }),
    getPermissionModules: () => api.get('/roles/permissions/modules'),
    createPermission: (data) => api.post('/roles/permissions', data),
    getUserPermissions: (userId) => api.get(`/roles/user/${userId}/permissions`),
};
// ── Admin: System ───────────────────────────────────────────────────────────
export const systemApi = {
    dashboard: () => api.get('/system/dashboard'),
    health: () => api.get('/system/health'),
    // Settings
    listSettings: (params) => api.get('/system/settings', { params }),
    getSetting: (key) => api.get(`/system/settings/${key}`),
    upsertSetting: (data) => api.put('/system/settings', data),
    deleteSetting: (key) => api.delete(`/system/settings/${key}`),
    getSettingCategories: () => api.get('/system/settings/categories'),
    // Feature Flags
    listFeatureFlags: () => api.get('/system/feature-flags'),
    toggleFeatureFlag: (id, enabled) => api.patch(`/system/feature-flags/${id}`, { enabled }),
    // Modules
    listModules: () => api.get('/system/modules'),
    toggleModule: (id, enabled) => api.patch(`/system/modules/${id}`, { enabled }),
    // Audit Logs
    listAuditLogs: (params) => api.get('/system/audit-logs', { params }),
    getAuditStats: () => api.get('/system/audit-logs/stats'),
    getAuditProcesses: () => api.get('/system/audit-logs/processes'),
    getAuditLogById: (id) => api.get(`/system/audit-logs/${id}`),
    exportAuditLogs: (params) => api.get('/system/audit-logs/export', { params }),
    // Configurations
    listConfigurations: (params) => api.get('/system/configurations', { params }),
    updateConfiguration: (id, value) => api.patch(`/system/configurations/${id}`, { value }),
};
// ── Visitor Portal ──────────────────────────────────────────────────────────
export const visitorPortalApi = {
    // Dashboard
    dashboard: () => api.get('/visitor/dashboard'),
    // Profile
    getProfile: () => api.get('/visitor/profile'),
    updateProfile: (data) => api.put('/visitor/profile', data),
    uploadPhoto: (file) => {
        const formData = new FormData();
        formData.append('photo', file);
        return api.post('/visitor/profile/photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    // Documents
    getDocuments: () => api.get('/visitor/documents'),
    uploadDocument: (file, documentType, documentNumber, expiryDate) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);
        if (documentNumber)
            formData.append('documentNumber', documentNumber);
        if (expiryDate)
            formData.append('expiryDate', expiryDate);
        return api.post('/visitor/documents', formData, {
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
        return api.put(`/visitor/documents/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    deleteDocument: (id) => api.delete(`/visitor/documents/${id}`),
    submitDocumentsToHost: (data = {}) => api.post('/visitor/documents/submit-to-host', data),
    // Appointments
    getAppointments: (params) => api.get('/visitor/appointments', { params }),
    getAppointmentDetail: (id) => api.get(`/visitor/appointments/${id}`),
    createAppointment: (data) => api.post('/visitor/appointments', data),
    cancelAppointment: (id, reason) => api.patch(`/visitor/appointments/${id}/cancel`, { reason }),
    deleteAppointment: (id) => api.delete(`/visitor/appointments/${id}`),
    rescheduleAppointment: (id, data) => api.patch(`/visitor/appointments/${id}/reschedule`, data),
    // Passes
    getPasses: () => api.get('/visitor/passes'),
    getPassQR: (id) => api.get(`/visitor/passes/${id}/qr`),
    // History
    getHistory: (params) => api.get('/visitor/history', { params }),
    // Notifications
    getNotifications: (params) => api.get('/visitor/notifications', { params }),
    markNotificationRead: (id) => api.patch(`/visitor/notifications/${id}/read`),
    markAllNotificationsRead: () => api.patch('/visitor/notifications/read-all'),
    // Feedback
    submitFeedback: (data) => api.post('/visitor/feedback', data),
    getFeedback: () => api.get('/visitor/feedback'),
    // Support
    createSupportTicket: (data) => api.post('/visitor/support', data),
    getSupportTickets: () => api.get('/visitor/support'),
    // Settings
    getSettings: () => api.get('/visitor/settings'),
    updateSettings: (data) => api.put('/visitor/settings', data),
};
export const visitorDashboardApi = {
    getOverview: (params) => api.get('/visitor/dashboard', { params }),
    getCards: (params) => api.get('/visitor/dashboard/cards', { params }),
    getCharts: (params) => api.get('/visitor/dashboard/charts', { params }),
    getRecent: (params) => api.get('/visitor/dashboard/recent', { params }),
    getAlerts: (params) => api.get('/visitor/dashboard/alerts', { params }),
    getTasks: (params) => api.get('/visitor/dashboard/tasks', { params }),
    search: (query, params) => api.get('/visitor/dashboard/search', { params: { q: query, ...params } }),
    getStatistics: (params) => api.get('/visitor/dashboard/statistics', { params }),
};
export const employeePortalApi = {
    getDashboard: () => api.get('/employee-portal/dashboard'),
    getRequests: (status) => api.get('/employee-portal/requests', { params: { status } }),
    getVisitorRequests: (status) => api.get('/employee-portal/requests', { params: { status } }),
    requestAction: (id, action, data) => api.post(`/employee-portal/requests/${id}/action`, { action, ...data }),
    getVisitorDocuments: (requestIdOrVisitorId) => api.get(`/employee-portal/requests/${requestIdOrVisitorId}/documents`),
    getMyAppointments: () => api.get('/employee-portal/my-appointments'),
    getMyVisitors: () => api.get('/employee-portal/my-visitors'),
    getRooms: () => api.get('/employee-portal/rooms'),
    reserveRoom: (data) => api.post('/employee-portal/rooms/reserve', data),
    getSupportTickets: () => api.get('/employee-portal/support/tickets'),
    createSupportTicket: (data) => api.post('/employee-portal/support/tickets', data),
};
// ===========================================
// MODULE 13: NOTIFICATION & COMMUNICATION CENTER API
// ===========================================
export const visitorNotificationApi = {
    // Notifications
    getNotifications: (params) => api.get('/visitor-notifications/notifications', { params }),
    getNotificationDetails: (id) => api.get(`/visitor-notifications/notifications/${id}`),
    markNotificationRead: (id) => api.patch(`/visitor-notifications/notifications/${id}/read`),
    markAllNotificationsRead: () => api.patch('/visitor-notifications/notifications/read-all'),
    triggerTestNotification: (data) => api.post('/visitor-notifications/notifications/test-trigger', data),
    // Preferences
    getPreferences: () => api.get('/visitor-notifications/preferences'),
    updatePreferences: (data) => api.put('/visitor-notifications/preferences', data),
    // Announcements
    getAnnouncements: () => api.get('/visitor-notifications/announcements'),
    // Messaging
    getThreads: () => api.get('/visitor-notifications/messages/threads'),
    createThread: (data) => api.post('/visitor-notifications/messages/threads', data),
    getThreadMessages: (threadId) => api.get(`/visitor-notifications/messages/threads/${threadId}`),
    sendMessage: (threadId, data) => api.post(`/visitor-notifications/messages/threads/${threadId}/reply`, data),
    getAuthorizedContacts: () => api.get('/visitor-notifications/messages/authorized-contacts'),
};
export const employeeNotificationApi = visitorNotificationApi;
export const adminNotificationApi = {
    getDashboardStats: () => api.get('/visitor-notifications/admin/dashboard-stats'),
    getNotificationsList: (params) => api.get('/visitor-notifications/notifications', { params }),
    getRules: () => api.get('/visitor-notifications/admin/rules'),
    createRule: (data) => api.post('/visitor-notifications/admin/rules', data),
    updateRule: (id, data) => api.put(`/visitor-notifications/admin/rules/${id}`, data),
    deleteRule: (id) => api.delete(`/visitor-notifications/admin/rules/${id}`),
    getTemplates: () => api.get('/visitor-notifications/admin/templates'),
    saveTemplate: (data) => api.post('/visitor-notifications/admin/templates', data),
    getTemplateVersions: (id) => api.get(`/visitor-notifications/admin/templates/${id}/versions`),
    restoreTemplateVersion: (id, version) => api.post(`/visitor-notifications/admin/templates/${id}/restore`, { version }),
    getQueues: () => api.get('/visitor-notifications/admin/queues'),
    controlQueue: (action, queueName) => api.post('/visitor-notifications/admin/queues/control', { action, queueName }),
    getAnalytics: () => api.get('/visitor-notifications/admin/analytics'),
    getSystemHealth: () => api.get('/notifications/health'),
    getAuditLogs: (params) => api.get('/notifications/audit-logs', { params }),
    sendWizardNotification: (data) => api.post('/visitor-notifications/admin/wizard-dispatch', data),
    sendBroadcast: (data) => api.post('/visitor-notifications/admin/broadcast', data),
    // Enterprise Notification Platform endpoints
    getDeliveryLogs: (params) => api.get('/notifications/deliveries', { params }),
    retryDelivery: (notificationId, channel) => api.post(`/notifications/${notificationId}/retry`, { channel }),
    sendNotification: (data) => api.post('/notifications/send', data),
    getHealth: () => api.get('/notifications/health'),
    getUnreadCount: () => api.get('/notifications/unread-count'),
};
export const manualNotificationApi = {
    getDashboard: () => api.get('/manual-notifications/dashboard'),
    getStatistics: () => api.get('/manual-notifications/statistics'),
    getRecent: (limit) => api.get('/manual-notifications/recent', { params: { limit } }),
    getDrafts: () => api.get('/manual-notifications/drafts'),
    dispatch: (data) => api.post('/manual-notifications/dispatch', data),
    saveDraft: (data) => api.post('/manual-notifications/draft', data),
    preview: (data) => api.post('/manual-notifications/preview', data),
    searchRecipients: (params) => api.get('/manual-notifications/recipients/search', { params }),
    validateRecipients: (recipientIds) => api.post('/manual-notifications/recipients/validate', { recipientIds }),
    getChannels: () => api.get('/manual-notifications/channels'),
};
export const ruleEngineApi = {
    getDashboard: () => api.get('/notification-rules/dashboard'),
    getRules: () => api.get('/notification-rules'),
    getRuleById: (id) => api.get(`/notification-rules/${id}`),
    createRule: (data) => api.post('/notification-rules', data),
    updateRule: (id, data) => api.put(`/notification-rules/${id}`, data),
    deleteRule: (id) => api.delete(`/notification-rules/${id}`),
    toggleStatus: (id, status) => api.patch(`/notification-rules/${id}/status`, { status }),
    getCategories: () => api.get('/notification-rules/categories'),
    getOperators: () => api.get('/notification-rules/operators'),
    getActions: () => api.get('/notification-rules/actions'),
    getWorkflowNodes: () => api.get('/notification-rules/workflow-nodes'),
    getBusinessEvents: () => api.get('/business-events'),
};
export const workflowRulesApi = {
    getSchedules: () => api.get('/rules/schedules'),
    getEscalations: () => api.get('/rules/escalations'),
    getReminders: () => api.get('/rules/reminders'),
    getRetries: () => api.get('/rules/retries'),
    getApprovals: () => api.get('/rules/approvals'),
    getOrgHierarchy: () => api.get('/rules/organization'),
    getRoleRules: () => api.get('/rules/roles'),
    getUserGroups: () => api.get('/rules/user-groups'),
    getVisitorRules: () => api.get('/rules/visitor'),
    getEmployeeRules: () => api.get('/rules/employee'),
    getAppointmentRules: () => api.get('/rules/appointment'),
    getReceptionRules: () => api.get('/rules/reception'),
    getSecurityRules: () => api.get('/rules/security'),
    getPassRules: () => api.get('/rules/visitor-pass'),
    getCheckinRules: () => api.get('/rules/checkin'),
    getCheckoutRules: () => api.get('/rules/checkout'),
    getEmergencyRules: () => api.get('/rules/emergency'),
    getSystemRules: () => api.get('/rules/system'),
    runTest: (data) => api.post('/rules/test', data),
    runSimulation: (data) => api.post('/rules/simulate', data),
    getVersions: () => api.get('/rules/versions'),
    createVersion: (data) => api.post('/rules/versions', data),
    rollback: (version) => api.post('/rules/rollback', { version }),
    importRules: (data) => api.post('/rules/import', data),
    exportRules: (format) => api.get('/rules/export', { params: { format } }),
    getAuditHistory: () => api.get('/rules/audit'),
    getAnalytics: () => api.get('/rules/analytics'),
    getPerformance: () => api.get('/rules/performance'),
    getDependencies: () => api.get('/rules/dependencies'),
    getConflicts: () => api.get('/rules/conflicts'),
    getExecutionLogs: () => api.get('/rules/executions'),
    getTemplates: () => api.get('/rules/templates'),
    getApiTriggerConfig: () => api.post('/rules/api-trigger', {}),
    getWebhookConfig: () => api.post('/rules/webhook', {}),
    getBackgroundJobs: () => api.get('/rules/jobs'),
    publishRule: (ruleId) => api.post('/rules/publish', { ruleId }),
    archiveRule: (ruleId) => api.post('/rules/archive', { ruleId }),
    getProductionStatus: () => api.get('/rules/production-status'),
};
export const productionMonitoringApi = {
    getLiveNotifications: () => api.get('/notifications/live'),
    getUnreadCount: () => api.get('/notifications/unread'),
    getQueueStats: () => api.get('/notifications/queue-stats'),
    getAnalyticsSummary: () => api.get('/notifications/analytics-summary'),
    getHealthStatus: () => api.get('/notifications/health'),
    getSecurityLogs: () => api.get('/notifications/security-logs'),
    getDeploymentSpecs: () => api.get('/notifications/deployment-specs'),
};

export const communicationApi = {
    getContacts: () => api.get('/communication/contacts'),
    getUnreadCounts: () => api.get('/communication/unread-counts'),
    getConversations: () => api.get('/communication/chat/conversations'),
    updateConversation: (convId, data) => api.put(`/communication/chat/conversations/${convId}`, data),
    deleteConversation: (convId) => api.delete(`/communication/chat/conversations/${convId}`),
    addParticipant: (convId, userId) => api.post(`/communication/chat/conversations/${convId}/participants`, { userId }),
    removeParticipant: (convId, userId) => api.delete(`/communication/chat/conversations/${convId}/participants/${userId}`),
    createDirectConversation: (targetUserId) => api.post('/communication/chat/direct', { targetUserId }),
    createGroupConversation: (data) => api.post('/communication/chat/group', data),
    addManualContact: (data) => api.post('/communication/contacts/manual', data),
    getChatMessages: (convId) => api.get(`/communication/chat/messages/${convId}`),
    sendChatMessage: (convId, data) => api.post(`/communication/chat/messages/${convId}`, data),
    editChatMessage: (convId, messageId, messageText) => api.put(`/communication/chat/messages/${convId}/${messageId}`, { message_text: messageText }),
    deleteChatMessage: (convId, messageId) => api.delete(`/communication/chat/messages/${convId}/${messageId}`),
    uploadAttachment: (formData) => api.post('/communication/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    sendEmail: (data) => api.post('/communication/email/send', data),
    getAnnouncements: (params) => api.get('/communication/announcements', { params }),
    createAnnouncement: (data) => api.post('/communication/announcements', data),
    updateAnnouncement: (id, data) => api.put(`/communication/announcements/${id}`, data),
    deleteAnnouncement: (id) => api.delete(`/communication/announcements/${id}`),
    markAnnouncementRead: (id) => api.put(`/communication/announcements/${id}/read`),
};

export const profileApi = {
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
    uploadAvatar: (formData) => api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    deleteAccount: () => api.delete('/auth/profile'),
};
