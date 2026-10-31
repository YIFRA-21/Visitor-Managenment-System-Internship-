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

        const isLanIp = (
            /^10\./.test(currentHostname) ||
            /^192\.168\./.test(currentHostname) ||
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(currentHostname) ||
            currentHostname.endsWith('.local')
        );

        const isLocalHost = currentHostname === 'localhost' || currentHostname === '127.0.0.1';

        // If an environment URL is explicitly configured:
        if (envUrl) {
            const stripped = envUrl.replace(/\/api\/?$/, '');
            // Only swap localhost with current host if device is genuinely on a private LAN:
            if ((stripped.includes('localhost') || stripped.includes('127.0.0.1')) && isLanIp) {
                return stripped
                    .replace('localhost', currentHostname)
                    .replace('127.0.0.1', currentHostname);
            }
            // If on a public domain (e.g. Vercel) and envUrl is pointing to localhost, connect to Render backend
            if (!isLocalHost && !isLanIp && (stripped.includes('localhost') || stripped.includes('127.0.0.1'))) {
                return 'https://visitor-managenment-system-backend.onrender.com';
            }
            return stripped;
        }

        // On local/LAN development:
        if (isLocalHost || isLanIp) {
            return `${protocol}//${currentHostname}:5000`;
        }

        // On deployed public internet hosting without explicit envUrl:
        return 'https://visitor-managenment-system-backend.onrender.com';
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

/**
 * Resolves full avatar URL whether relative, cloud-hosted, or data URI
 */
export function resolveAvatarUrl(avatarUrl) {
    if (!avatarUrl) return null;
    const clean = String(avatarUrl).trim();
    if (clean.startsWith('data:') || clean.startsWith('http://') || clean.startsWith('https://')) {
        return clean;
    }
    const backend = getBackendBaseUrl();
    if (clean.startsWith('/api/')) {
        return `${backend}${clean}`;
    }
    if (clean.startsWith('/')) {
        return `${backend}/api${clean}`;
    }
    return `${backend}/api/${clean}`;
}
