import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, BLOCKED_ACCOUNT_STATUSES } from '../contexts/AuthContext';
import SessionTimeoutModal from './SessionTimeoutModal';
import { isAdminRole } from '../config/routes';
export default function ProtectedRoute({ children, requiredPermission, requiredRole, }) {
    const { user, loading: authLoading, hasPermission, hasRole } = useAuth();
    const location = useLocation();
    const [checking, setChecking] = useState(true);
    const [allowed, setAllowed] = useState(null);
    useEffect(() => {
        if (authLoading)
            return;
        if (!user) {
            setChecking(false);
            return;
        }
        const statusUpper = String(user.accountStatus || user.status || '').toUpperCase();
        if (BLOCKED_ACCOUNT_STATUSES.includes(statusUpper)) {
            setAllowed(false);
            setChecking(false);
            return;
        }
        if (user.firstLoginRequired || user.passwordChangeRequired) {
            setAllowed(false);
            setChecking(false);
            return;
        }
        if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true') {
            setAllowed(true);
            setChecking(false);
            return;
        }
        // Gating check for explicit requiredRole / requiredPermission
        const userRole = user?.role?.toLowerCase() || '';
        if (requiredRole && !hasRole(requiredRole) && !isAdminRole(userRole)) {
            setAllowed(false);
            setChecking(false);
            return;
        }
        if (requiredPermission && !hasPermission(requiredPermission)) {
            setAllowed(false);
            setChecking(false);
            return;
        }
        // Path prefix role gating check
        const path = location.pathname.toLowerCase();
        if (path.startsWith('/admin') && !isAdminRole(userRole)) {
            setAllowed(false);
            setChecking(false);
            return;
        }
        if (path.startsWith('/employee') && userRole !== 'employee' && userRole !== 'staff' && !isAdminRole(userRole)) {
            setAllowed(false);
            setChecking(false);
            return;
        }
        if (path.startsWith('/visitor') && userRole !== 'visitor' && !isAdminRole(userRole)) {
            setAllowed(false);
            setChecking(false);
            return;
        }
        if (path.startsWith('/reception') && userRole !== 'receptionist' && !isAdminRole(userRole)) {
            setAllowed(false);
            setChecking(false);
            return;
        }
        if (path.startsWith('/security') && userRole !== 'security' && userRole !== 'security_officer' && !isAdminRole(userRole)) {
            setAllowed(false);
            setChecking(false);
            return;
        }
        if (path.startsWith('/manager') && userRole !== 'manager' && userRole !== 'department_manager' && !userRole.includes('manager') && !isAdminRole(userRole)) {
            setAllowed(false);
            setChecking(false);
            return;
        }
        // Allow core paths & role dashboards
        if (location.pathname === '/dashboard' || location.pathname === '/unauthorized' || path.endsWith('/dashboard')) {
            setAllowed(true);
            setChecking(false);
            return;
        }
        setAllowed(true);
        setChecking(false);
    }, [user, authLoading, location.pathname, requiredPermission, requiredRole, hasPermission, hasRole]);
    if (authLoading || checking) {
        return (<div className="flex min-h-screen items-center justify-center bg-[#070b13]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"/>
      </div>);
    }
    if (!user)
        return <Navigate to="/login" replace/>;
    const userStatusUpper = String(user.accountStatus || user.status || '').toUpperCase();
    if (BLOCKED_ACCOUNT_STATUSES.includes(userStatusUpper)) {
        return <Navigate to="/login?blocked=true" replace/>;
    }
    if (user.firstLoginRequired || user.passwordChangeRequired) {
        return <Navigate to="/change-password" replace/>;
    }
    if (allowed === false) {
        return <Navigate to="/unauthorized" replace/>;
    }
    return (<>
      <SessionTimeoutModal />
      {children}
    </>);
}
