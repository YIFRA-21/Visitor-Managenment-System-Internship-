import React from 'react';
import { useAuth } from '../contexts/AuthContext';
export const ResourceGuard = ({ routeUrl, fallback = null, children, }) => {
    const { hasResource } = useAuth();
    const isAllowed = hasResource(routeUrl);
    if (!isAllowed) {
        return <>{fallback}</>;
    }
    return <>{children}</>;
};
export default ResourceGuard;
