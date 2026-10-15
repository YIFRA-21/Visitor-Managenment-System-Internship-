import { getBackendBaseUrl } from './apiUrl';
/**
 * Utility helper to resolve visitor & user profile photo URLs.
 * Converts relative upload paths (e.g. /uploads/visitors/abc.jpg) to fully qualified URLs
 * pointing to the backend server.
 */
export function resolvePhotoUrl(url) {
    if (!url || typeof url !== 'string' || !url.trim())
        return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    const backendBase = getBackendBaseUrl();
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${backendBase}${cleanPath}`;
}
export function getPhotoFallbackInitials(name) {
    if (!name || !name.trim())
        return 'VP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
}
