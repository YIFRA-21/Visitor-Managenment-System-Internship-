export const ROUTES = {
    PUBLIC: {
        HOME: '/',
        CONTACT: '/contact',
        BOOK: '/book',
        TRACK: '/track',
        VERIFY_PASS: '/verify-pass',
        LOGIN: '/login',
        SIGNUP: '/signup',
        REGISTER: '/register',
        FORGOT_PASSWORD: '/forgot-password',
        RESET_PASSWORD: '/reset-password',
        UNAUTHORIZED: '/unauthorized',
        ACCESS_DENIED: '/access-denied',
        CHANGE_PASSWORD: '/change-password',
        RESPONSE: '/response',
        CONFIRM: '/confirm',
        NOT_FOUND: '/not-found',
        ERROR: '/error',
        MOBILE_VERIFY: '/mobile-verify',
    },
    VISITOR: {
        BASE: '/visitor',
        DASHBOARD: '/visitor/dashboard',
        PROFILE: '/visitor/profile',
        APPOINTMENTS: '/visitor/appointments',
        HISTORY: '/visitor/history',
        PASS: '/visitor/pass',
        DOCUMENTS: '/visitor/documents',
        NOTIFICATIONS: '/visitor/notifications',
        MESSAGES: '/visitor/messages',
        ANNOUNCEMENTS: '/visitor/announcements',
        FEEDBACK: '/visitor/feedback',
        SUPPORT: '/visitor/support',
        SYSTEM_CHAT: '/visitor/system-chat',
        MASTER_FLOW: '/visitor/master-flow',
    },
    EMPLOYEE: {
        BASE: '/employee',
        DASHBOARD: '/employee/dashboard',
        PROFILE: '/employee/profile',
        REQUESTS: '/employee/visitor-requests',
        APPOINTMENTS: '/employee/appointments',
        CALENDAR: '/employee/calendar',
        VISITORS: '/employee/visitors',
        MEETINGS: '/employee/meetings',
        NOTIFICATIONS: '/employee/notifications',
        REPORTS: '/employee/reports',
        SETTINGS: '/employee/settings',
        HELP: '/employee/help',
    },
    MANAGER: {
        BASE: '/manager',
        DASHBOARD: '/manager/dashboard',
        NOTIFICATIONS: '/manager/notifications',
        REPORTS: '/manager/reports',
    },
    RECEPTION: {
        BASE: '/reception',
        DASHBOARD: '/reception/dashboard',
        CHECK_IN: '/reception/check-in',
        CHECK_OUT: '/reception/check-out',
        ARRIVALS: '/reception/arrivals',
        VERIFICATION: '/reception/appointment-verification',
        WALKIN: '/reception/walkin-registration',
        QUEUE: '/reception/queue',
        PASSES: '/reception/passes',
        HOST_ALERTS: '/reception/host-alerts',
        WAITING_AREA: '/reception/waiting-area',
        DIRECTORY: '/reception/directory',
        REPORTS: '/reception/reports',
        LOGS: '/reception/activity-log',
        PROFILE: '/reception/profile',
    },
    SECURITY: {
        BASE: '/security',
        DASHBOARD: '/security/dashboard',
        ACCESS_CONTROL: '/security/access-control',
        INCIDENTS: '/security/incidents',
        VERIFICATION: '/security/verification',
        LOGS: '/security/access-logs',
        NOTIFICATIONS: '/security/notifications',
    },
    ADMIN: {
        BASE: '/admin',
        DASHBOARD: '/admin/dashboard',
        USERS: '/admin/users',
        ROLES: '/admin/roles',
        PERMISSIONS: '/admin/permissions',
        VISITOR_MANAGEMENT: '/admin/visitor-management',
        VISITORS: '/admin/visitors',
        VISITOR_PROFILES: '/admin/visitor-profiles',
        VISITOR_CATEGORIES: '/admin/visitor-categories',
        APPOINTMENTS: '/admin/appointments',
        EMPLOYEES: '/admin/employees',
        ORGANIZATIONS: '/admin/organizations',
        DEPARTMENTS: '/admin/departments',
        BRANCHES: '/admin/branches',
        SECURITY: '/admin/security',
        NOTIFICATIONS: '/admin/notifications',
        REPORTS: '/admin/reports',
        AUDIT_LOGS: '/admin/audit-logs',
        SETTINGS: '/admin/settings',
        SYSTEM_HEALTH: '/admin/system-health',
    },
};
export const ADMIN_ROUTES = ROUTES.ADMIN;
export const ADMIN_ROLES = ['admin', 'administrator', 'system_admin', 'super_admin', 'org_admin', 'developer', 'sysadmin'];

/**
 * Normalizes any user object, role string, or credentials object into a canonical role:
 * 'admin' | 'employee' | 'manager' | 'receptionist' | 'security' | 'visitor'
 */
export function normalizeRole(userOrRole) {
    if (!userOrRole) return 'visitor';
    
    // If passed a string directly:
    if (typeof userOrRole === 'string') {
        const raw = userOrRole.toLowerCase().trim();
        if (isAdminRole(raw)) return 'admin';
        if (raw === 'manager' || raw === 'department_manager' || raw.includes('manager')) return 'manager';
        if (raw === 'receptionist' || raw === 'reception' || raw.includes('reception')) return 'receptionist';
        if (raw === 'security_officer' || raw === 'security' || raw.includes('security')) return 'security';
        if (raw === 'staff' || raw === 'employee' || raw === 'host' || raw === 'employee_host' || raw.includes('employee') || raw.includes('staff') || raw.includes('host')) return 'employee';
        if (raw === 'visitor' || raw.includes('visitor')) return 'visitor';
        return raw;
    }

    // If passed a user object:
    const userObject = userOrRole;
    const rawRole = String(
        userObject?.role ||
        userObject?.role_name ||
        userObject?.roleName ||
        userObject?.userRole ||
        userObject?.identity?.primaryRole ||
        userObject?.identity?.roles?.[0]?.code ||
        userObject?.identity?.roles?.[0]?.role_code ||
        userObject?.identity?.roles?.[0]?.name ||
        userObject?.roles?.[0]?.code ||
        userObject?.roles?.[0] ||
        ''
    ).toLowerCase().trim();

    const userCode = String(
        userObject?.userCode ||
        userObject?.user_code ||
        userObject?.user_id ||
        userObject?.username ||
        ''
    ).toUpperCase().trim();

    // 1. User code or identity prefix indicators
    if (userCode.startsWith('DEV') || userCode.startsWith('ADM') || userCode === 'ADMIN') {
        return 'admin';
    }
    if (userCode.startsWith('MGR')) {
        return 'manager';
    }
    if (userCode.startsWith('REC')) {
        return 'receptionist';
    }
    if (userCode.startsWith('SEC')) {
        return 'security';
    }
    if (userCode.startsWith('EMP')) {
        return 'employee';
    }
    if (userCode.startsWith('VIS')) {
        return 'visitor';
    }

    // 2. Admin verification
    if (isAdminRole(rawRole)) {
        return 'admin';
    }

    // 3. Manager verification
    if (rawRole === 'manager' || rawRole === 'department_manager' || rawRole.includes('manager')) {
        return 'manager';
    }

    // 4. Receptionist verification
    if (rawRole === 'receptionist' || rawRole === 'reception' || rawRole.includes('reception')) {
        return 'receptionist';
    }

    // 5. Security verification
    if (rawRole === 'security_officer' || rawRole === 'security' || rawRole.includes('security')) {
        return 'security';
    }

    // 6. Employee / Staff / Host verification
    if (
        rawRole === 'staff' ||
        rawRole === 'employee' ||
        rawRole === 'host' ||
        rawRole === 'employee_host' ||
        (rawRole.includes('employee') && !rawRole.includes('admin')) ||
        rawRole.includes('staff') ||
        rawRole.includes('host')
    ) {
        return 'employee';
    }

    // 7. Visitor fallback
    return 'visitor';
}

/**
 * Roles that are allowed to access the Module 15 Enterprise Dashboard.
 * All other roles are redirected to their own role workspace/portal.
 */
export const DASHBOARD_ROLES = ADMIN_ROLES;

export function isAdminRole(role) {
    const normalized = (role || '').toLowerCase().trim();
    return (
        ADMIN_ROLES.includes(normalized) ||
        normalized.includes('admin') ||
        normalized === 'developer' ||
        normalized === 'dev' ||
        normalized.includes('sysadmin')
    );
}

export function canAccessDashboard(role) {
    return isAdminRole(role);
}

/**
 * Returns the default landing URL for a given role name or user object.
 * Every role lands on its own workspace — non-dashboard roles must never
 * land on the enterprise dashboard.
 */
export function getRoleLanding(role, userObject) {
    const canonicalRole = normalizeRole(userObject || role);
    switch (canonicalRole) {
        case 'admin':
            return ROUTES.ADMIN.DASHBOARD;
        case 'manager':
            return ROUTES.MANAGER.DASHBOARD;
        case 'receptionist':
            return ROUTES.RECEPTION.DASHBOARD;
        case 'security':
            return ROUTES.SECURITY.DASHBOARD;
        case 'employee':
            return ROUTES.EMPLOYEE.DASHBOARD;
        case 'visitor':
        default:
            return ROUTES.VISITOR.DASHBOARD;
    }
}

/**
 * Returns the default dashboard URL for a given role name.
 * Delegates to getRoleLanding so all redirect logic stays centralized.
 */
export function getRoleDashboard(role) {
    return getRoleLanding(role);
}
