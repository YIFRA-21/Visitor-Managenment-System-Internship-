/**
 * Dynamic API and Backend URL Resolver for LAN & Multi-Device Access
 * ──────────────────────────────────────────────────────────────────
 * Enables automatic network communication for development across:
 * - Localhost (same computer)
 * - LAN devices (mobile phones, tablets, other PCs on same Wi-Fi)
 * - Production deployments (respects custom domain/VITE_API_URL)
 */
/**
 * Resolves the backend base URL (e.g., http://localhost:5000 or http://10.18.52.67:5000)
 * without the trailing /api prefix.
 */
export function getBackendBaseUrl() {
    const envUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim();
    // In browser context:
    if (typeof window !== 'undefined' && window.location?.hostname) {
        const currentHostname = window.location.hostname;
        const protocol = window.location.protocol || 'http:';
        // If an environment URL is explicitly configured:
        if (envUrl) {
            const stripped = envUrl.replace(/\/api\/?$/, '');
            // If envUrl is explicitly pointing to localhost or 127.0.0.1,
            // but the current device is accessing the frontend via a LAN IP (e.g. 10.x.x.x, 192.168.x.x),
            // dynamically swap localhost with the current LAN host so the device connects to the host machine:
            if ((stripped.includes('localhost') || stripped.includes('127.0.0.1')) &&
                currentHostname !== 'localhost' &&
                currentHostname !== '127.0.0.1') {
                return stripped
                    .replace('localhost', currentHostname)
                    .replace('127.0.0.1', currentHostname);
            }
            return stripped;
        }
        // Default development backend port is 5000:
        return `${protocol}//${currentHostname}:5000`;
    }
    // Fallback for non-browser/SSR contexts:
    if (envUrl) {
        return envUrl.replace(/\/api\/?$/, '');
    }
    return 'http://localhost:5000';
}
/**
 * Resolves the full API base URL (e.g., http://localhost:5000/api or http://10.18.52.67:5000/api)
 */
export function getApiBaseUrl() {
    return `${getBackendBaseUrl()}/api`;
}
/**
 * Resolves the Socket.io server connection URL
 */
export function getSocketUrl() {
    return getBackendBaseUrl();
}
