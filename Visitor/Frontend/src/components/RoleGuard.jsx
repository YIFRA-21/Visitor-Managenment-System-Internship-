import React from 'react';
import { useAuth } from '../contexts/AuthContext';
export const RoleGuard = ({ role, roles, mode = 'any', fallback = null, children, }) => {
    const { hasRole } = useAuth();
    let isAllowed = false;
    if (role) {
        isAllowed = hasRole(role);
    }
    else if (roles && roles.length > 0) {
        if (mode === 'all') {
            isAllowed = roles.every((r) => hasRole(r));
        }
        else {
            isAllowed = roles.some((r) => hasRole(r));
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
export default RoleGuard;
