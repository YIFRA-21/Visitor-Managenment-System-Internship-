// ═══════════════════════════════════════════════════════════════════════════
// MODULE 3.1 — ORGANIZATION MANAGEMENT HOME: MOCK DATA & TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════
export const mockSystemHealth = {
    apiStatus: 'healthy',
    dbStatus: 'healthy',
    lastSync: new Date().toISOString(),
    uptime: '99.97%',
};
export const mockCards = [
    { id: 1, title: 'Total Organizations', value: 1, icon: 'bi-building', color: 'primary', trend: '0', trendDirection: 'neutral', description: 'Registered organizations in the system', sparklineData: [1, 1, 1, 1, 1, 1, 1, 1] },
    { id: 2, title: 'Active Organizations', value: 1, icon: 'bi-building-check', color: 'success', trend: '0', trendDirection: 'neutral', description: 'Currently active organizations', sparklineData: [1, 1, 1, 1, 1, 1, 1, 1] },
    { id: 3, title: 'Total Branches', value: 28, icon: 'bi-diagram-3', color: 'info', trend: '+3', trendDirection: 'up', description: 'Branch offices across all organizations', sparklineData: [15, 18, 20, 22, 23, 24, 26, 28] },
    { id: 4, title: 'Total Departments', value: 64, icon: 'bi-columns-gap', color: 'warning', trend: '+5', trendDirection: 'up', description: 'Departments across all branches', sparklineData: [40, 45, 48, 50, 53, 55, 60, 64] },
    { id: 5, title: 'Total Buildings', value: 36, icon: 'bi-houses', color: 'secondary', trend: '+1', trendDirection: 'up', description: 'Physical buildings registered', sparklineData: [28, 30, 31, 32, 33, 34, 35, 36] },
    { id: 6, title: 'Total Employees', value: 1240, icon: 'bi-people', color: 'primary', trend: '+28', trendDirection: 'up', description: 'Employees across organizations', sparklineData: [980, 1020, 1060, 1100, 1140, 1180, 1210, 1240] },
    { id: 7, title: 'Active Users', value: 98, icon: 'bi-person-badge', color: 'success', trend: '+4', trendDirection: 'up', description: 'Active system users', sparklineData: [72, 78, 82, 85, 88, 91, 95, 98] },
    { id: 8, title: "Today's Visitors", value: 47, icon: 'bi-person-check', color: 'info', trend: '+12', trendDirection: 'up', description: 'Visitors checked in today', sparklineData: [30, 35, 38, 42, 40, 44, 45, 47] },
    { id: 9, title: "Today's Appointments", value: 53, icon: 'bi-calendar-check', color: 'warning', trend: '+8', trendDirection: 'up', description: 'Appointments scheduled today', sparklineData: [32, 38, 40, 44, 46, 48, 50, 53] },
];
export const mockQuickActions = [
    { id: 1, title: 'Create Organization', icon: 'bi-building-add', description: 'Register a new organization', route: 'create_organization', color: 'primary', requiredPermission: 'organization:create' },
    { id: 2, title: 'View Organizations', icon: 'bi-building', description: 'Browse all organizations', route: 'organizations', color: 'info', requiredPermission: 'organization:read' },
    { id: 3, title: 'Create Branch', icon: 'bi-diagram-3', description: 'Add a new branch', route: 'branches', color: 'success', requiredPermission: 'branch:create' },
    { id: 4, title: 'View Branches', icon: 'bi-layers', description: 'Browse all branches', route: 'branches', color: 'info', requiredPermission: 'branch:read' },
    { id: 5, title: 'Create Department', icon: 'bi-columns-gap', description: 'Add a new department', route: 'departments_mgmt', color: 'warning', requiredPermission: 'department:create' },
    { id: 6, title: 'View Departments', icon: 'bi-collection', description: 'Browse all departments', route: 'departments_mgmt', color: 'info', requiredPermission: 'department:read' },
    { id: 7, title: 'Organization Tree', icon: 'bi-diagram-2', description: 'View hierarchy structure', route: 'org_tree', color: 'secondary', requiredPermission: 'organization:read' },
    { id: 10, title: 'Contact Information', icon: 'bi-telephone', description: 'Manage contact details', route: 'org_settings', color: 'info', requiredPermission: 'organization:update' },
    { id: 12, title: 'Audit Logs', icon: 'bi-journal-text', description: 'View security logs', route: 'audit_logs', color: 'secondary', requiredPermission: 'audit:read' },
];
export const mockActivities = [
    { id: 1, user: 'John Smith', action: 'created organization "IT Park"', date: '2026-07-20', time: '09:15 AM', status: 'completed', module: 'Organization', avatar: null },
    { id: 2, user: 'Sarah Johnson', action: 'updated branch "Downtown Office"', date: '2026-07-20', time: '08:45 AM', status: 'completed', module: 'Branch', avatar: null },
    { id: 3, user: 'Michael Chen', action: 'created department "Research & Development"', date: '2026-07-19', time: '04:30 PM', status: 'completed', module: 'Department', avatar: null },
    { id: 4, user: 'Emily Davis', action: 'activated organization "IT Park"', date: '2026-07-19', time: '02:15 PM', status: 'completed', module: 'Organization', avatar: null },
    { id: 5, user: 'Robert Wilson', action: 'updated branding for "IT Park"', date: '2026-07-19', time: '11:00 AM', status: 'completed', module: 'Branding', avatar: null },
    { id: 6, user: 'Lisa Thompson', action: 'archived department "Legacy Products"', date: '2026-07-18', time: '03:45 PM', status: 'completed', module: 'Department', avatar: null },
    { id: 7, user: 'James Brown', action: 'added holiday to business calendar', date: '2026-07-18', time: '01:20 PM', status: 'pending', module: 'Calendar', avatar: null },
    { id: 8, user: 'Amanda Garcia', action: 'modified organization settings for "IT Park"', date: '2026-07-18', time: '10:30 AM', status: 'completed', module: 'Settings', avatar: null },
    { id: 9, user: 'David Martinez', action: 'created branch "West Coast Hub"', date: '2026-07-17', time: '04:00 PM', status: 'completed', module: 'Branch', avatar: null },
    { id: 10, user: 'Jennifer Lee', action: 'updated contact information for "IT Park"', date: '2026-07-17', time: '02:00 PM', status: 'completed', module: 'Contact', avatar: null },
    { id: 11, user: 'John Smith', action: 'viewed organization tree', date: '2026-07-17', time: '11:15 AM', status: 'completed', module: 'Organization Tree', avatar: null },
    { id: 12, user: 'Sarah Johnson', action: 'exported audit logs', date: '2026-07-16', time: '04:45 PM', status: 'completed', module: 'Audit Logs', avatar: null },
];
export const mockStatistics = {
    organizationTypes: [
        { type: 'Enterprise', count: 1, percentage: 100 },
    ],
    branchDistribution: [
        { region: 'North America', count: 10 },
        { region: 'Europe', count: 8 },
        { region: 'Asia Pacific', count: 6 },
        { region: 'Middle East', count: 3 },
        { region: 'Africa', count: 1 },
    ],
    departmentDistribution: [
        { category: 'Engineering', count: 18 },
        { category: 'Sales & Marketing', count: 12 },
        { category: 'Human Resources', count: 8 },
        { category: 'Finance', count: 6 },
        { category: 'Operations', count: 10 },
        { category: 'Legal', count: 4 },
        { category: 'IT Support', count: 6 },
    ],
    employeesByDepartment: [
        { department: 'Engineering', employees: 320 },
        { department: 'Sales & Marketing', employees: 180 },
        { department: 'Operations', employees: 120 },
        { department: 'Human Resources', employees: 65 },
        { department: 'Finance', employees: 55 },
        { department: 'IT Support', employees: 40 },
        { department: 'Legal', employees: 25 },
        { department: 'Executive', employees: 15 },
    ],
    monthlyGrowth: [
        { month: 'Jan', organizations: 8, branches: 20, departments: 45 },
        { month: 'Feb', organizations: 9, branches: 22, departments: 48 },
        { month: 'Mar', organizations: 9, branches: 23, departments: 50 },
        { month: 'Apr', organizations: 10, branches: 24, departments: 53 },
        { month: 'May', organizations: 10, branches: 25, departments: 55 },
        { month: 'Jun', organizations: 11, branches: 26, departments: 58 },
        { month: 'Jul', organizations: 11, branches: 27, departments: 60 },
        { month: 'Aug', organizations: 12, branches: 28, departments: 64 },
    ],
};
export const mockNotifications = [
    { id: 1, title: 'Organization Registered', description: 'IT Park has been registered', time: '5m ago', read: false, icon: 'bi-building', color: 'primary', category: 'activity' },
    { id: 2, title: 'Branch Updated', description: 'Downtown Office details were modified', time: '1h ago', read: false, icon: 'bi-diagram-3', color: 'info', category: 'activity' },
    { id: 3, title: 'Department Created', description: 'R&D department added to HQ branch', time: '2h ago', read: true, icon: 'bi-columns-gap', color: 'warning', category: 'activity' },
    { id: 4, title: 'System Backup Completed', description: 'Automated nightly backup finished successfully', time: '6h ago', read: true, icon: 'bi-cloud-check', color: 'success', category: 'system' },
    { id: 5, title: 'Organization Activated', description: 'IT Park is now active', time: '1d ago', read: true, icon: 'bi-building-check', color: 'success', category: 'activity' },
    { id: 6, title: 'Security Alert', description: 'Unauthorized access attempt detected', time: '1d ago', read: true, icon: 'bi-shield-exclamation', color: 'danger', category: 'alert' },
    { id: 7, title: 'Branding Updated', description: 'IT Park logo and theme changed', time: '2d ago', read: true, icon: 'bi-palette', color: 'danger', category: 'activity' },
];
export const mockSearchOrganizations = [
    { id: 'org-1', type: 'organization', title: 'IT Park', description: 'Enterprise · Active · ORG-001', route: 'org_details' },
];
export const mockSearchBranches = [
    { id: 'br-1', type: 'branch', title: 'HQ Silicon Valley Campus', description: 'IT Park · San Jose · Active', route: 'branches' },
    { id: 'br-2', type: 'branch', title: 'London Development Hub', description: 'IT Park · London · Active', route: 'branches' },
];
export const mockSearchDepartments = [
    { id: 'dept-1', type: 'department', title: 'Research & Development', description: 'IT Park · HQ Campus · 45 employees', route: 'departments_mgmt' },
    { id: 'dept-2', type: 'department', title: 'Sales & Marketing', description: 'IT Park · London Hub · 32 employees', route: 'departments_mgmt' },
    { id: 'dept-3', type: 'department', title: 'Human Resources', description: 'IT Park · Main Office · 12 employees', route: 'departments_mgmt' },
];
