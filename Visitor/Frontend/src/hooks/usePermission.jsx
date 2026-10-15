/**
 * usePermission Hook
 * ───────────────────
 * Client-side permission checking based on the current user's role.
 * Uses the same permission code format as the backend RBAC system.
 */
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Client-side permission map (mirrors backend LEGACY_ROLE_PERMISSIONS)
const ROLE_PERMISSIONS = {
    admin: ['*'],
    staff: [
        'APPOINTMENT:CREATE', 'APPOINTMENT:READ', 'APPOINTMENT:CANCEL',
        'APPROVAL:APPROVE', 'APPROVAL:READ', 'LIVEBOARD:READ',
    ],
    department_manager: [
        'APPOINTMENT:CREATE', 'APPOINTMENT:READ', 'APPOINTMENT:CANCEL',
        'APPROVAL:APPROVE', 'APPROVAL:READ', 'APPROVAL:DELEGATE',
        'DEPARTMENT:READ', 'DEPARTMENT:MANAGE', 'REPORT:DEPARTMENT',
        'LIVEBOARD:READ', 'USER:READ',
    ],
    receptionist: [
        'VISITOR:CREATE', 'VISITOR:READ', 'APPOINTMENT:READ',
        'CHECKIN:CREATE', 'CHECKOUT:CREATE', 'LIVEBOARD:READ',
        'PASS:CREATE', 'PASS:REVOKE', 'BADGE:PRINT', 'QUEUE:MANAGE',
    ],
    security_officer: [
        'VISITOR:READ', 'APPOINTMENT:READ',
        'CHECKIN:CREATE', 'CHECKOUT:CREATE', 'LIVEBOARD:READ',
        'SECURITY:VERIFY', 'SECURITY:INCIDENT', 'SECURITY:BLACKLIST',
        'REPORT:SECURITY',
    ],
    visitor: [
        'APPOINTMENT:CREATE', 'APPOINTMENT:READ', 'APPOINTMENT:CANCEL',
        'VISITOR_PORTAL:PROFILE', 'VISITOR_PORTAL:DOCUMENTS',
        'VISITOR_PORTAL:HISTORY', 'VISITOR_PORTAL:FEEDBACK',
    ],
};
/**
 * Check if the current user has a specific permission.
 */
export function useHasPermission(permissionCode) {
    const { user } = useAuth();
    return useMemo(() => {
        if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true')
            return true;
        if (!user)
            return false;
        const perms = ROLE_PERMISSIONS[user.role] || [];
        if (perms.includes('*'))
            return true;
        return perms.includes(permissionCode.toUpperCase());
    }, [user, permissionCode]);
}
/**
 * Check if the current user has ANY of the given permissions.
 */
export function useHasAnyPermission(...permissionCodes) {
    const { user } = useAuth();
    return useMemo(() => {
        if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true')
            return true;
        if (!user)
            return false;
        const perms = ROLE_PERMISSIONS[user.role] || [];
        if (perms.includes('*'))
            return true;
        return permissionCodes.some((pc) => perms.includes(pc.toUpperCase()));
    }, [user, permissionCodes]);
}
/**
 * Check if the current user has ALL of the given permissions.
 */
export function useHasAllPermissions(...permissionCodes) {
    const { user } = useAuth();
    return useMemo(() => {
        if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true')
            return true;
        if (!user)
            return false;
        const perms = ROLE_PERMISSIONS[user.role] || [];
        if (perms.includes('*'))
            return true;
        return permissionCodes.every((pc) => perms.includes(pc.toUpperCase()));
    }, [user, permissionCodes]);
}
/**
 * Check if the current user has a specific role.
 */
export function useHasRole(...roles) {
    const { user } = useAuth();
    return useMemo(() => {
        if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true')
            return true;
        if (!user)
            return false;
        return roles.includes(user.role);
    }, [user, roles]);
}
/**
 * Returns the list of permission codes for the current user.
 */
export function useUserPermissions() {
    const { user } = useAuth();
    return useMemo(() => {
        if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true')
            return ['*'];
        if (!user)
            return [];
        if (user.role === 'admin')
            return ['*'];
        if (user.identity?.permissions) {
            return user.identity.permissions.map((p) => p.code);
        }
        return ROLE_PERMISSIONS[user.role] || [];
    }, [user]);
}
/**
 * Check if the current user has a specific permission (alias for useHasPermission).
 */
export function usePermission(code) {
    const { hasPermission } = useAuth();
    return useMemo(() => hasPermission(code), [hasPermission, code]);
}
/**
 * Multi-permission check with 'any' or 'all' mode.
 */
export function usePermissions(codes, mode = 'any') {
    const { hasPermission } = useAuth();
    return useMemo(() => {
        if (mode === 'all') {
            return codes.every((code) => hasPermission(code));
        }
        return codes.some((code) => hasPermission(code));
    }, [hasPermission, codes, mode]);
}
