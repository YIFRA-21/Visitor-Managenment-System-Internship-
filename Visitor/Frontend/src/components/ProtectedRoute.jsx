import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, BLOCKED_ACCOUNT_STATUSES } from '../contexts/AuthContext';
import SessionTimeoutModal from './SessionTimeoutModal';
import { isAdminRole, normalizeRole, getRoleLanding } from '../config/routes';
import LoadingScreen from './LoadingScreen';

export default function ProtectedRoute({ children, requiredPermission, requiredRole }) {
    const { user, loading: authLoading, hasPermission, hasRole } = useAuth();
    const location = useLocation();
    const [checking, setChecking] = useState(true);
    const [allowed, setAllowed] = useState(null);
    const [redirectTarget, setRedirectTarget] = useState(null);

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
            setRedirectTarget(null);
            setChecking(false);
            return;
        }

        if (user.firstLoginRequired || user.passwordChangeRequired) {
            setAllowed(false);
            setRedirectTarget(null);
            setChecking(false);
            return;
        }

        if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true') {
            setAllowed(true);
            setRedirectTarget(null);
            setChecking(false);
            return;
        }

        // Safe role normalization
        const userRole = normalizeRole(user);
        const roleLanding = getRoleLanding(userRole, user) || '/dashboard';

        // 1. Administrators possess universal clearance across all system areas
        if (isAdminRole(userRole)) {
            setAllowed(true);
            setRedirectTarget(null);
            setChecking(false);
            return;
        }

        // 2. Explicit requiredRole gating
        if (requiredRole && !hasRole(requiredRole)) {
            setRedirectTarget(roleLanding);
            setAllowed(false);
            setChecking(false);
            return;
        }

        // 3. Explicit permission gating
        if (requiredPermission && !hasPermission(requiredPermission)) {
            setRedirectTarget(roleLanding);
            setAllowed(false);
            setChecking(false);
            return;
        }

        // 4. Role-isolated path prefix gating
        const path = location.pathname.toLowerCase();
        if (path.startsWith('/admin') && !isAdminRole(userRole)) {
            setRedirectTarget(roleLanding);
            setAllowed(false);
            setChecking(false);
            return;
        }
        if (path.startsWith('/employee') && userRole !== 'employee') {
            setRedirectTarget(roleLanding);
            setAllowed(false);
            setChecking(false);
            return;
        }
        if (path.startsWith('/visitor') && userRole !== 'visitor') {
            setRedirectTarget(roleLanding);
            setAllowed(false);
            setChecking(false);
            return;
        }
        if (path.startsWith('/reception') && userRole !== 'receptionist') {
            setRedirectTarget(roleLanding);
            setAllowed(false);
            setChecking(false);
            return;
        }
        if (path.startsWith('/security') && userRole !== 'security') {
            setRedirectTarget(roleLanding);
            setAllowed(false);
            setChecking(false);
            return;
        }
        if (path.startsWith('/manager') && userRole !== 'manager') {
            setRedirectTarget(roleLanding);
            setAllowed(false);
            setChecking(false);
            return;
        }

        // Default: allow
        setAllowed(true);
        setRedirectTarget(null);
        setChecking(false);
    }, [user, authLoading, location.pathname, requiredPermission, requiredRole, hasPermission, hasRole]);

    if (authLoading || checking) {
        return <LoadingScreen />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const userStatusUpper = String(user.accountStatus || user.status || '').toUpperCase();
    if (BLOCKED_ACCOUNT_STATUSES.includes(userStatusUpper)) {
        return <Navigate to="/login?blocked=true" replace />;
    }

    if (user.firstLoginRequired || user.passwordChangeRequired) {
        return <Navigate to="/change-password" replace />;
    }

    // Automatically route authenticated users with mismatched role prefixes to their valid dashboard
    if (redirectTarget) {
        const dest = `${redirectTarget}${location.search || ''}`;
        if (location.pathname.toLowerCase() !== redirectTarget.toLowerCase()) {
            return <Navigate to={dest} replace />;
        }
    }

    if (allowed === false) {
        // Prevent looping if already on unauthorized page
        if (location.pathname === '/unauthorized') {
            return children;
        }
        return <Navigate to="/unauthorized" state={{ attemptedPath: location.pathname }} replace />;
    }

    return (<>
      <SessionTimeoutModal />
      {children}
    </>);
}
