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
 * Roles that are allowed to access the Module 15 Enterprise Dashboard.
 * All other roles are redirected to their own role workspace/portal.
 */
export const DASHBOARD_ROLES = ADMIN_ROLES;
export function isAdminRole(role) {
    const normalized = (role || '').toLowerCase().trim();
    return ADMIN_ROLES.includes(normalized) || normalized.includes('admin') || normalized === 'developer';
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
    const roleName = String(role ||
        userObject?.role ||
        userObject?.role_name ||
        userObject?.roleName ||
        userObject?.identity?.primaryRole ||
        '').toLowerCase().trim();
    const userCode = String(userObject?.userCode ||
        userObject?.user_code ||
        userObject?.user_id ||
        '').toUpperCase().trim();
    // 1. Admin roles MUST ALWAYS land on Admin Dashboard
    if (isAdminRole(roleName) || userCode.startsWith('DEV')) {
        return ROUTES.ADMIN.DASHBOARD;
    }
    // 2. Manager roles MUST land on Manager Dashboard
    if (roleName === 'manager' || roleName === 'department_manager' || roleName.includes('manager')) {
        return ROUTES.MANAGER.DASHBOARD;
    }
    // 3. Receptionist roles
    if (roleName === 'receptionist' || roleName.includes('reception')) {
        return ROUTES.RECEPTION.DASHBOARD;
    }
    // 4. Security roles
    if (roleName === 'security_officer' || roleName === 'security' || roleName.includes('security')) {
        return ROUTES.SECURITY.DASHBOARD;
    }
    // 5. Explicit check for Employee IDs (EMP000007, etc.) or Employee/Staff/Host roles
    if (userCode.startsWith('EMP') ||
        roleName === 'staff' ||
        roleName === 'employee' ||
        roleName === 'host' ||
        roleName === 'employee_host' ||
        (roleName.includes('employee') && !roleName.includes('admin')) ||
        roleName.includes('staff') ||
        roleName.includes('host')) {
        return ROUTES.EMPLOYEE.DASHBOARD;
    }
    if (roleName === 'visitor' || roleName.includes('visitor'))
        return ROUTES.VISITOR.DASHBOARD;
    return ROUTES.VISITOR.DASHBOARD;
}
/**
 * Returns the default dashboard URL for a given role name.
 * Delegates to getRoleLanding so all redirect logic stays centralized.
 */
export function getRoleDashboard(role) {
    return getRoleLanding(role);
}
