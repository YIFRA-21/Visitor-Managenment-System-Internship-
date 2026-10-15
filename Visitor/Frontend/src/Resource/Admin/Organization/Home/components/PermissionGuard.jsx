import { useAuth } from '../../../../../contexts/AuthContext';
export default function PermissionGuard({ permission, fallback, children }) {
    const { user } = useAuth();
    const hasAccess = user?.role === 'admin' || user?.identity?.permissions?.some((p) => p.code.toLowerCase() === permission.toLowerCase());
    if (!hasAccess) {
        return fallback !== undefined ? <>{fallback}</> : null;
    }
    return <>{children}</>;
}
