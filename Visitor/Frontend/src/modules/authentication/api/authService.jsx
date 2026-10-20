import { apiClient } from '../../../services/apiClient';
export const authService = {
    checkEmail: (email) => apiClient.post('/auth/check-email', { email }, { silent: true }),
    checkUsername: (username) => apiClient.post('/auth/check-username', { username }, { silent: true }),
    login: (identifier, password) => apiClient.post('/auth/login', { identifier, email: identifier, password }),
    register: (data) => apiClient.post('/auth/register', data),
    me: () => apiClient.get('/auth/me'),
    forgotPassword: (identifier) => apiClient.post('/auth/forgot-password', { identifier, email: identifier, userId: identifier }),
    resetPassword: (identifier, token, newPassword) => apiClient.post('/auth/reset-password', { identifier, email: identifier, userId: identifier, token, resetToken: token, newPassword }),
    logout: (refreshToken) => apiClient.post('/auth/logout', { refreshToken }),
    refreshToken: (refreshToken) => apiClient.post('/auth/refresh-token', { refreshToken }),
    currentUser: () => apiClient.get('/auth/me'),
    verifyOtp: (identifier, code) => apiClient.post('/auth/verify-email', { identifier, email: identifier, userId: identifier, token: code, code }),
    resendVerification: (identifier) => apiClient.post('/auth/resend-verification', { identifier, email: identifier, userId: identifier }),
    changePassword: (currentPassword, newPassword) => apiClient.post('/auth/change-password', { currentPassword, newPassword }),
    getActiveSessions: () => apiClient.get('/auth/sessions'),
    terminateSession: (sessionId) => apiClient.delete(`/auth/sessions/${sessionId}`),
    terminateAllSessions: () => apiClient.delete('/auth/sessions'),
    getMyPermissions: () => apiClient.get('/auth/me/permissions'),
    getMyResources: () => apiClient.get('/auth/me/resources'),
    getMyProfile: () => apiClient.get('/auth/profile'),
    updateProfile: (data) => apiClient.put('/auth/profile', data),
    uploadAvatar: (formData) => apiClient.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
export default authService;
