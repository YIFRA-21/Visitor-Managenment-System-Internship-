/**
 * PermissionGate Component
 * ─────────────────────────
 * Conditionally renders children based on the user's permissions.
 * Used throughout the app to show/hide UI elements based on RBAC.
 */
import { useHasPermission, useHasAnyPermission, useHasRole } from '../../hooks/usePermission';
export default function PermissionGate({ permission, anyPermission, roles, fallback = null, children, }) {
    const hasSinglePerm = useHasPermission(permission || '');
    const hasAnyPerm = useHasAnyPermission(...(anyPermission || []));
    const hasRole = useHasRole(...(roles || []));
    // Determine access
    let granted = false;
    if (permission) {
        granted = hasSinglePerm;
    }
    else if (anyPermission && anyPermission.length > 0) {
        granted = hasAnyPerm;
    }
    else if (roles && roles.length > 0) {
        granted = hasRole;
    }
    else {
        // No constraint specified — grant by default
        granted = true;
    }
    return <>{granted ? children : fallback}</>;
}
