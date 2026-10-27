import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiUrl';
const API_URL = getApiBaseUrl();
export const apiClient = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000, // 30 second timeout for all requests
});
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token)
        config.headers.Authorization = `Bearer ${token}`;
    return config;
});
apiClient.interceptors.response.use((res) => res, (err) => {
    const isBlocked = err.response?.data?.code === 'ACCOUNT_BLOCKED' || err.response?.data?.isBlocked;
    // Auto-logout on 401 or 403 (when account is blocked/suspended)
    if (err.response?.status === 401 || (err.response?.status === 403 && isBlocked)) {
        if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true' && !isBlocked) {
            return Promise.reject(err);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('refreshToken');
        const publicPaths = ['/login', '/signup', '/register', '/forgot-password', '/reset-password', '/book'];
        const isPublicPath = publicPaths.some((p) => window.location.pathname.includes(p));
        if (!isPublicPath) {
            window.location.href = isBlocked ? '/login?blocked=true' : '/login';
        }
    }
    return Promise.reject(err);
});
// Retry wrapper with exponential backoff for transient errors (429, 5xx)
export const withRetry = async (fn, maxRetries = 2) => {
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
    if (status === 429)
        return 'Upload rate limit exceeded. Please wait a moment and retry.';
    if (status === 413)
        return 'Maximum file size exceeded (5MB limit).';
    // First try: plain string message field (most backend AppError responses)
    if (typeof data?.message === 'string' && data.message) {
        if (/something went wrong on our end|please try again later/i.test(data.message)) {
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
    // Third try: error field — could be a string or a dev-mode error object with message or sqlMessage property
    const rawError = data?.error;
    if (rawError) {
        if (typeof rawError === 'string')
            return rawError;
        if (typeof rawError === 'object') {
            if (typeof rawError.sqlMessage === 'string' && rawError.sqlMessage)
                return rawError.sqlMessage;
            if (typeof rawError.message === 'string' && rawError.message)
                return rawError.message;
            try {
                return JSON.stringify(rawError);
            }
            catch {
                return '';
            }
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
        return '';
    if (axErr.message && typeof axErr.message === 'string') {
        if (/something went wrong on our end|please try again later/i.test(axErr.message)) {
            return '';
        }
        return axErr.message;
    }
    return '';
};
export default apiClient;
