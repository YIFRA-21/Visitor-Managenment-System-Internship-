import React from 'react';
import { useAuth } from '../contexts/AuthContext';
export const PermissionGuard = ({ permission, permissions, mode = 'any', fallback = null, children, }) => {
    const { hasPermission } = useAuth();
    let isAllowed = false;
    if (permission) {
        isAllowed = hasPermission(permission);
    }
    else if (permissions && permissions.length > 0) {
        if (mode === 'all') {
            isAllowed = permissions.every((code) => hasPermission(code));
        }
        else {
            isAllowed = permissions.some((code) => hasPermission(code));
        }
    }
    else {
        isAllowed = true;
    }
    if (!isAllowed) {
        return <>{fallback}</>;
    }
    return <>{children}</>;
};
export default PermissionGuard;
