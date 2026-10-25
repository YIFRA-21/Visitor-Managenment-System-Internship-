import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar, Navbar } from '../design-system';
import { authApi, employeePortalApi, notificationsApi, getErrorMessage } from '../services/api';
import { isAdminRole } from '../config/routes';
import { useSocket } from '../hooks/useSocket';
import { useLanguage } from '../contexts/LanguageContext';
import ProfileModal from './profile/ProfileModal';
import { useResponseNavigation } from '../modules/response';
const sidebarConfig = [
    {
        key: 'dashboard-group',
        label: 'Dashboard',
        iconClass: 'bi-speedometer2',
        view: 'dashboard',
    },
    {
        key: 'user-management',
        label: 'User Management',
        iconClass: 'bi-people',
        roles: ['admin'],
        submenus: [
            { key: 'user-dashboard', label: 'Dashboard', view: 'user_dashboard' },
            { key: 'users', label: 'All Users', view: 'users' },
            { key: 'user-employees', label: 'Employee Management', view: 'user_employees' },
            { key: 'user-visitors', label: 'Visitor Management', view: 'user_visitors' },
            { key: 'user-managers', label: 'Manager Management', view: 'user_managers' },
            { key: 'user-security', label: 'Security Officer Management', view: 'user_security' },
            { key: 'user-receptionists', label: 'Reception Management', view: 'user_receptionists' },
            { key: 'account-security', label: 'Account Security', view: 'account_security' },
            { key: 'user-import-export', label: 'Import / Export Users', view: 'user_import_export' },
        ],
    },
    {
        key: 'role-management',
        label: 'Role Management',
        iconClass: 'bi-shield-check',
        roles: ['admin'],
        submenus: [
            { key: 'role-dashboard', label: 'Role Dashboard', view: 'role_dashboard' },
            { key: 'roles-list', label: 'All Roles Directory', view: 'roles' },
            { key: 'role-hierarchy', label: 'Hierarchy Graph', view: 'role_hierarchy' },
            { key: 'role-conflicts', label: 'Conflicts & SoD', view: 'role_conflicts' },
        ],
    },
    {
        key: 'permission-management',
        label: 'Permission Management',
        iconClass: 'bi-key',
        roles: ['admin'],
        submenus: [
            { key: 'permission-dashboard', label: 'Dashboard', view: 'permission_dashboard' },
            { key: 'permissions-list', label: 'All Permissions', view: 'permissions' },
            { key: 'permission-matrix', label: 'Permission Matrix', view: 'permission_matrix' },
            { key: 'permission-groups', label: 'Permission Groups', view: 'permission_groups' },
            { key: 'permission-create', label: 'Create Permission', view: 'permission_create' },
            { key: 'permission-import-export', label: 'Import / Export', view: 'permission_import_export' },
            { key: 'permission-risk', label: 'Risk Analytics', view: 'permission_risk' },
            { key: 'permission-simulator', label: 'Auth Simulator', view: 'permission_simulator' },
        ],
    },
    {
        key: 'organization-management',
        label: 'Organization Management',
        iconClass: 'bi-building-gear',
        roles: ['admin'],
        submenus: [
            { key: 'org-home', label: 'Home', view: 'org_home' },
            { key: 'organizations', label: 'Organizations', view: 'organizations' },
            { key: 'create-organization', label: 'Create Organization', view: 'create_organization' },
            { key: 'org-search', label: 'Search Organizations', view: 'org_search' },
            { key: 'branches', label: 'Branches', view: 'branches' },
            { key: 'branch-search', label: 'Search Branches', view: 'branch_search' },
            { key: 'branch-statistics', label: 'Branch Statistics', view: 'branch_statistics' },
            { key: 'departments-mgmt', label: 'Departments', view: 'departments_mgmt' },
            { key: 'dept-search', label: 'Search Departments', view: 'dept_search' },
            { key: 'dept-statistics', label: 'Department Statistics', view: 'dept_statistics' },
            { key: 'dept-hierarchy', label: 'Department Hierarchy', view: 'dept_hierarchy' },
            { key: 'buildings-mgmt', label: 'Buildings & Facilities', view: 'buildings' },
            { key: 'floors-mgmt', label: 'Floors & Levels', view: 'floors' },
            { key: 'rooms-mgmt', label: 'Meeting Rooms & Offices', view: 'rooms' },
            { key: 'workplace-mgmt', label: 'Workplace Desk Locations', view: 'workplace' },
            { key: 'org-tree', label: 'Organization Tree', view: 'org_tree' },
        ],
    },
    {
        key: 'staff-management',
        label: 'Staff Management',
        iconClass: 'bi-briefcase',
        roles: ['admin', 'staff', 'receptionist', 'manager'],
        submenus: [
            { key: 'employee-management', label: 'Employee Management', view: 'employee_management' },
            { key: 'workplace-assignments', label: 'Workplace Desks & Locations', view: 'workplace' },
            { key: 'staff', label: 'Staff', view: 'staff' },
            { key: 'departments', label: 'Departments', view: 'departments' },
            { key: 'schedule', label: 'Employee Schedule', view: 'availability', roles: ['admin', 'staff'] },
        ],
    },
    {
        key: 'visitor-management-admin',
        label: 'Visitor Management',
        iconClass: 'bi-person-check',
        roles: ['admin', 'receptionist', 'security_officer', 'staff', 'manager'],
        submenus: [
            { key: 'visitor-management-dashboard', label: 'Visitor Management Dashboard', view: 'enterprise_visitor_dashboard', roles: ['admin', 'receptionist', 'security_officer', 'staff', 'manager'] },
            { key: 'visitor-registration', label: 'Visitor Registration', view: 'visitor_registration', roles: ['admin', 'receptionist', 'security_officer', 'staff', 'manager'] },
            { key: 'appointment-management-admin', label: 'Appointment Management', view: 'appointment_management', roles: ['admin', 'receptionist', 'security_officer', 'staff', 'manager'] },
            { key: 'visitors', label: 'Visitor Profiles', view: 'visitors', roles: ['admin', 'receptionist', 'security_officer', 'staff', 'manager'] },
            { key: 'visitor-categories-admin', label: 'Visitor Categories', view: 'visitor_categories', roles: ['admin', 'receptionist', 'security_officer', 'staff', 'manager'] },
            { key: 'approval-workflows-admin', label: 'Approval Workflows', view: 'approval_workflow_management', roles: ['admin', 'manager', 'staff'] },
            { key: 'visitor-documents-admin', label: 'Visitor Documents', view: 'visitor_documents_management', roles: ['admin', 'receptionist', 'security_officer', 'staff', 'manager'] },
            { key: 'visitor-history-admin', label: 'Visitor History', view: 'visitor_history', roles: ['admin', 'receptionist', 'security_officer', 'staff', 'manager'] },
        ],
    },
    {
        key: 'employee-management-top',
        label: 'Employee Management',
        iconClass: 'bi-person-workspace',
        view: 'employee_management',
        roles: ['admin', 'staff', 'receptionist', 'manager', 'security_officer'],
    },
    {
        key: 'visitor-portal',
        label: 'Visitor Portal',
        iconClass: 'bi-person-badge',
        roles: ['visitor'],
        submenus: [
            { key: 'visitor-home', label: 'My Dashboard', view: 'dashboard' },
            { key: 'visitor-profile', label: 'My Profile', view: 'visitor_profile' },
            { key: 'visitor-pass', label: 'My Digital Pass', view: 'visitor_pass' },
            { key: 'my-appointments', label: 'My Appointments', view: 'my_appointments' },
            { key: 'visit-history', label: 'Visit History', view: 'visit_history' },
            { key: 'visitor-documents', label: 'Visitor Documents', view: 'visitor_documents' },
            { key: 'system-chat', label: 'System Chat', view: 'system_chat' },
            { key: 'visitor-feedback', label: 'Feedback', view: 'visitor_feedback' },
            { key: 'visitor-support', label: 'Help & Support', view: 'visitor_support' },
            { key: 'visitor-master-flow', label: 'Interactive Flow (15 Views)', view: 'visitor_master_flow' },
        ],
    },
    {
        key: 'reception-management',
        label: 'Reception Management',
        iconClass: 'bi-headset',
        roles: ['admin', 'receptionist', 'security_officer'],
        submenus: [
            { key: 'reception-workspace', label: 'Reception Portal (All Tabs)', view: 'reception_management' },
            { key: 'visitor-arrivals', label: 'Visitor Arrivals', view: 'visitor_arrivals' },
            { key: 'appointment-verification', label: 'Verify Appointment', view: 'appointment_verification' },
            { key: 'walkin-registration', label: 'Walk-in Registration', view: 'walkin_management' },
            { key: 'visitor-queue', label: 'Visitor Queue', view: 'visitor_queue' },
            { key: 'reception-passes', label: 'Pass Issuance', view: 'reception_passes' },
            { key: 'host-notifications', label: 'Host Notifications', view: 'host_notifications' },
            { key: 'reception-directory', label: 'Search & Directory', view: 'reception_directory' },
            { key: 'reception-reports', label: 'Reception Reports', view: 'reception_reports' },
            { key: 'reception-logs', label: 'Activity Log', view: 'reception_activity_log' },
        ],
    },
    {
        key: 'reception-checkin-checkout',
        label: 'Check-In & Check-Out Ops',
        iconClass: 'bi-door-open',
        roles: ['admin', 'receptionist', 'security_officer', 'manager'],
        submenus: [
            { key: 'checkin-checkout-history', label: 'Check-In & Check-Out History', view: 'checkin_checkout_history' },
            { key: 'checkin-main', label: 'Check-In Console', view: 'checkin' },
            { key: 'checkin-dashboard', label: 'Check-In Dashboard', view: 'checkin_dashboard' },
            { key: 'checkin-history', label: 'Check-In History', view: 'checkin_history' },
            { key: 'checkin-analytics', label: 'Check-In Analytics', view: 'checkin_analytics' },
            { key: 'checkin-validation', label: 'Check-In Validation', view: 'checkin_validation' },
            { key: 'group-checkin', label: 'Group Check-In', view: 'group_checkin' },
            { key: 'vip-checkin', label: 'VIP Check-In', view: 'vip_checkin' },
            { key: 'contractor-checkin', label: 'Contractor Check-In', view: 'contractor_checkin' },
            { key: 'vehicle-checkin', label: 'Vehicle Check-In', view: 'vehicle_checkin' },
            { key: 'checkout-main', label: 'Check-Out Console', view: 'checkout' },
            { key: 'checkout-dashboard', label: 'Check-Out Dashboard', view: 'checkout_dashboard' },
            { key: 'checkout-process', label: 'Exit Processing', view: 'checkout_process' },
            { key: 'pending-checkouts', label: 'Pending Check-Outs', view: 'pending_checkouts' },
            { key: 'overstay-mgmt', label: 'Overstay Management', view: 'overstay_management' },
            { key: 'asset-return', label: 'Asset Return Verification', view: 'asset_return' },
            { key: 'group-checkout', label: 'Group Check-Out', view: 'group_checkout' },
            { key: 'evacuation-status', label: 'Emergency Evacuation', view: 'evacuation_status' },
            { key: 'checkout-history', label: 'Check-Out History', view: 'checkout_history' },
            { key: 'badge-mgmt', label: 'Badge Management', view: 'badge_management' },
        ],
    },
    {
        key: 'security-access',
        label: 'Security & Access Control',
        iconClass: 'bi-shield-shaded',
        roles: ['admin', 'security_officer', 'receptionist'],
        submenus: [
            { key: 'restricted-badges', label: 'Area & Access Level Badges', view: 'badge_management', roles: ['admin', 'security_officer', 'receptionist'] },
            { key: 'security-incidents', label: 'Security Incidents', view: 'security_incidents', roles: ['admin', 'security_officer'] },
            { key: 'verification', label: 'Verification', view: 'verification', roles: ['admin', 'security_officer'] },
            { key: 'access-logs', label: 'Access Logs', view: 'security_logs' },
        ],
    },
    {
        key: 'notifications-group',
        label: 'Notification Management',
        iconClass: 'bi-bell',
        submenus: [
            { key: 'notifications-list', label: 'Notification Center', view: 'notifications' },
            { key: 'notifications-messages', label: 'Message Center', view: 'messages' },
            { key: 'notifications-announcements', label: 'Announcements', view: 'announcements' },
            { key: 'notification-templates', label: 'Templates', view: 'notification_templates', roles: ['admin'] },
        ],
    },
    {
        key: 'reports-analytics',
        label: 'Reports & Analytics',
        iconClass: 'bi-graph-up',
        roles: ['admin', 'security_officer', 'receptionist', 'auditor'],
        submenus: [
            { key: 'reports-dashboard', label: 'Dashboard', view: 'reports' },
            { key: 'operational-reports', label: 'Operational Reports', view: 'operational_reports' },
            { key: 'visitor-reports', label: 'Visitor Reports', view: 'visitor_reports' },
            { key: 'appointment-reports', label: 'Appointment Reports', view: 'appointment_reports' },
            { key: 'audit-logs', label: 'Audit Logs', view: 'audit_logs', roles: ['admin', 'security_officer', 'auditor'] },
        ],
    },
    {
        key: 'employee-portal-group',
        label: 'Employee Portal',
        iconClass: 'bi-person-workspace',
        roles: ['staff', 'employee'],
        submenus: [
            { key: 'emp-dashboard', label: 'My Dashboard', view: 'employee_dashboard' },
            { key: 'emp-requests', label: 'Visitor Requests', view: 'employee_requests' },
            { key: 'emp-appointments', label: 'My Appointments', view: 'employee_appointments' },
            { key: 'emp-calendar', label: 'My Calendar', view: 'employee_calendar' },
            { key: 'emp-visitors', label: 'My Visitors', view: 'employee_visitors' },
            { key: 'emp-meetings', label: 'Meeting Management', view: 'employee_meetings' },
            { key: 'emp-notifications', label: 'Notifications', view: 'employee_notifications' },
            { key: 'emp-reports', label: 'Reports', view: 'employee_reports' },
            { key: 'emp-help', label: 'Help & Support', view: 'employee_help' },
            { key: 'emp-settings', label: 'Settings', view: 'employee_settings' },
        ],
    },
    {
        key: 'department-manager-group',
        label: 'Department Management',
        iconClass: 'bi-briefcase-fill',
        roles: ['manager', 'department_manager', 'admin'],
        submenus: [
            { key: 'manager-overview', label: 'Dashboard', view: 'manager_dashboard' },
            { key: 'manager-employees', label: 'Employees & Hosts', view: 'manager_employees' },
            { key: 'manager-availability', label: 'Host Availability', view: 'manager_availability' },
            { key: 'manager-requests', label: 'Visitor Requests', view: 'manager_requests' },
            { key: 'manager-appointments', label: 'Department Appointments', view: 'manager_appointments' },
            { key: 'manager-visitors', label: 'Department Visitors', view: 'manager_visitors' },
            { key: 'manager-reports', label: 'Department Reports', view: 'manager_reports' },
            { key: 'manager-audit', label: 'Audit History', view: 'manager_audit' },
        ],
    },
    {
        key: 'support-feedback-hub',
        label: 'Support & Feedback',
        iconClass: 'bi-headset',
        view: 'FeedbackSupportCenter',
        submenus: [
            { key: 'support-center-all', label: 'Support & Feedback Hub', view: 'FeedbackSupportCenter' },
            { key: 'role-feedback-entry', label: 'Submit Role Feedback', view: 'FeedbackSupportCenter' },
            { key: 'support-ticket-entry', label: 'Support Ticket Desk', view: 'FeedbackSupportCenter' },
        ],
    },
];
export default function DashboardLayout({ children, currentView: propCurrentView, }) {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const { toConfirmation } = useResponseNavigation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    // Layout states
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('visitorms_nav_collapsed') === 'true';
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [pendingCount, setPendingCount] = useState(0);
    // Prevent background scrolling while mobile navigation drawer is open
    useEffect(() => {
        if (isMobileOpen) {
            document.body.classList.add('vms-drawer-open');
        }
        else {
            document.body.classList.remove('vms-drawer-open');
        }
        return () => {
            document.body.classList.remove('vms-drawer-open');
        };
    }, [isMobileOpen]);
    useEffect(() => {
        const role = user?.role?.toLowerCase();
        if (role === 'employee' || role === 'staff') {
            const fetchPendingCount = async () => {
                try {
                    const res = await employeePortalApi.getVisitorRequests('ALL');
                    if (res.data && Array.isArray(res.data)) {
                        const count = res.data.filter((r) => {
                            const st = (r.status || r.approval_status || 'PENDING').toUpperCase();
                            return st === 'PENDING' || st === 'REQUESTED' || st === 'PENDING_APPROVAL';
                        }).length;
                        setPendingCount(count);
                    }
                }
                catch (e) {
                    setPendingCount(0);
                }
            };
            fetchPendingCount();
            const timer = setInterval(fetchPendingCount, 12000);
            return () => clearInterval(timer);
        }
    }, [user]);
    useSocket();
    const [notifications, setNotifications] = useState([]);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const fetchRealCounts = useCallback(async () => {
        try {
            const res = await notificationsApi.unreadCounts();
            if (res.data?.success) {
                setUnreadNotificationCount(res.data.data?.notifications ?? 0);
                setUnreadMessageCount(res.data.data?.messages ?? 0);
            }
        }
        catch (err) {
            // Quiet catch
        }
    }, []);
    const fetchRealNotifications = useCallback(async () => {
        try {
            const res = await notificationsApi.list();
            const raw = res.data;
            const items = Array.isArray(raw)
                ? raw
                : Array.isArray(raw?.notifications)
                    ? raw.notifications
                    : Array.isArray(raw?.data?.notifications)
                        ? raw.data.notifications
                        : Array.isArray(raw?.data)
                            ? raw.data
                            : [];
            setNotifications(items.map((n) => ({
                id: n.id,
                title: n.title,
                desc: n.message || n.desc || '',
                time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
                read: Boolean(n.is_read !== undefined ? n.is_read : n.read),
                action_url: n.action_url
            })));
        }
        catch (err) {
            // Quiet catch
        }
    }, []);
    useEffect(() => {
        fetchRealCounts();
        fetchRealNotifications();
        const interval = setInterval(() => {
            fetchRealCounts();
            fetchRealNotifications();
        }, 15000);
        const handleSocketNotif = (e) => {
            const data = e.detail;
            if (!data)
                return;
            const newNotifItem = {
                id: data.id || Date.now(),
                title: data.title || 'System Notification',
                desc: data.message || data.desc || '',
                time: 'Just now',
                read: false,
                action_url: data.action_url
            };
            setNotifications((prev) => [newNotifItem, ...prev.filter((n) => n.id !== newNotifItem.id)]);
            setUnreadNotificationCount((prev) => prev + 1);
        };
        const handleReadEvent = (e) => {
            const readId = e.detail?.id;
            if (readId) {
                setNotifications((prev) => prev.map((n) => (n.id === readId ? { ...n, read: true } : n)));
            }
            setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
        };
        const handleAllReadEvent = () => {
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadNotificationCount(0);
        };
        const handleChatUnreadUpdate = (e) => {
            if (e?.detail?.unreadCount !== undefined) {
                setUnreadMessageCount(Math.max(0, Number(e.detail.unreadCount)));
            }
            fetchRealCounts();
        };
        window.addEventListener('vms-socket-notification', handleSocketNotif);
        window.addEventListener('vms-notification-read', handleReadEvent);
        window.addEventListener('vms-all-notifications-read', handleAllReadEvent);
        window.addEventListener('vms-chat-unread-updated', handleChatUnreadUpdate);
        window.addEventListener('vms-socket-chat-message', handleChatUnreadUpdate);
        return () => {
            clearInterval(interval);
            window.removeEventListener('vms-socket-notification', handleSocketNotif);
            window.removeEventListener('vms-notification-read', handleReadEvent);
            window.removeEventListener('vms-all-notifications-read', handleAllReadEvent);
            window.removeEventListener('vms-chat-unread-updated', handleChatUnreadUpdate);
            window.removeEventListener('vms-socket-chat-message', handleChatUnreadUpdate);
        };
    }, [user, fetchRealCounts, fetchRealNotifications]);
    const defaultView = 'dashboard';
    const getLayoutView = () => {
        const paramView = searchParams.get('view');
        if (paramView)
            return paramView;
        const pathname = window.location.pathname.toLowerCase();
        // Check user identity resource map for routeUrl matching path
        const matchedResource = user?.identity?.resources?.find((r) => r.routeUrl.toLowerCase() === pathname);
        if (matchedResource)
            return matchedResource.routeUrl;
        if (pathname.includes('/departments-mgmt') || pathname.includes('/departments_mgmt'))
            return 'departments_mgmt';
        if (pathname.includes('/dept-create') || pathname.includes('/dept_create'))
            return 'dept_create';
        if (pathname.includes('/dept-details') || pathname.includes('/dept_details'))
            return 'dept_details';
        if (pathname.includes('/dept-edit') || pathname.includes('/dept_edit'))
            return 'dept_edit';
        if (pathname.includes('/dept-status') || pathname.includes('/dept_status'))
            return 'dept_status';
        if (pathname.includes('/dept-search') || pathname.includes('/dept_search'))
            return 'dept_search';
        if (pathname.includes('/dept-statistics') || pathname.includes('/dept_statistics'))
            return 'dept_statistics';
        if (pathname.includes('/dept-hierarchy') || pathname.includes('/dept_hierarchy'))
            return 'dept_hierarchy';
        // Module 3.5 Hierarchy Management
        if (pathname.includes('/hierarchy-statistics') || pathname.includes('/hierarchy_statistics'))
            return 'hierarchy_statistics';
        if (pathname.includes('/organizations'))
            return 'organizations';
        if (pathname.includes('/branches'))
            return 'branches';
        if (pathname.includes('/org-home') || pathname.includes('/org_home'))
            return 'org_home';
        if (pathname.includes('/org-tree') || pathname.includes('/org_tree') || pathname.includes('/organization-tree') || pathname.includes('/organization_tree'))
            return 'org_tree';
        if (pathname.includes('/buildings'))
            return 'buildings';
        if (pathname.includes('/floors'))
            return 'floors';
        if (pathname.includes('/rooms'))
            return 'rooms';
        if (pathname.includes('/workplace'))
            return 'workplace';
        if (pathname.includes('/approval-workflows') || pathname.includes('/approval_workflows'))
            return 'approval_workflow_management';
        if (pathname.includes('/employee-management') || pathname.includes('/employee_management') || pathname.includes('/employees'))
            return 'employee_management';
        if (pathname.includes('/checkin-checkout-history') || pathname.includes('/checkin_checkout_history'))
            return 'checkin_checkout_history';
        return defaultView;
    };
    const currentView = propCurrentView || getLayoutView();
    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };
    const toggleSidebar = () => {
        const nextState = !isCollapsed;
        setIsCollapsed(nextState);
        localStorage.setItem('visitorms_nav_collapsed', String(nextState));
    };
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const handleViewClick = (viewKey) => {
        let cleanView = viewKey;
        if (cleanView.startsWith('/')) {
            cleanView = cleanView.replace(/^\/(admin|employee|manager|reception|security|visitor)\//, '').replace(/^\//, '');
        }
        if (cleanView === 'change_password' || cleanView === 'change-password') {
            setShowChangePasswordModal(true);
            setIsMobileOpen(false);
            return;
        }
        if (cleanView === 'quick_profile_modal') {
            setShowProfileModal(true);
            setIsMobileOpen(false);
            return;
        }
        const rawRole = (user?.role || user?.role_name || user?.roleName || '').toLowerCase().trim();
        const userCode = String(user?.userCode || user?.user_code || user?.user_id || '').toUpperCase().trim();
        // Route profile clicks to role-specific comprehensive profile pages
        if (cleanView === 'profile' || cleanView === 'my_profile' || cleanView === 'edit_profile' || cleanView === 'profile_settings') {
            if (rawRole === 'visitor') {
                cleanView = 'visitor_profile';
            } else if (rawRole === 'manager' || rawRole.includes('manager')) {
                cleanView = 'manager_profile';
            } else if (rawRole === 'receptionist' || rawRole.includes('reception')) {
                cleanView = 'reception_profile';
            } else if (rawRole === 'security_officer' || rawRole === 'security' || rawRole.includes('security')) {
                cleanView = 'security_profile';
            } else if (rawRole === 'staff' || rawRole === 'employee' || rawRole === 'host' || userCode.startsWith('EMP')) {
                cleanView = 'employee_profile';
            } else {
                cleanView = 'employee_profile';
            }
        }
        let baseView = cleanView;
        const queryParamsObj = {};
        if (cleanView.includes('?')) {
            const parts = cleanView.split('?');
            baseView = parts[0];
            const params = new URLSearchParams(parts[1]);
            params.forEach((val, key) => {
                queryParamsObj[key] = val;
            });
        }
        let rolePrefix = '/visitor';
        if (isAdminRole(rawRole) ||
            rawRole === 'admin' ||
            rawRole === 'developer' ||
            rawRole === 'super_admin' ||
            rawRole === 'system_admin' ||
            rawRole === 'org_admin') {
            rolePrefix = '/admin';
        }
        else if (rawRole === 'manager' || rawRole.includes('manager')) {
            rolePrefix = '/manager';
        }
        else if (rawRole === 'receptionist' || rawRole.includes('reception')) {
            rolePrefix = '/reception';
        }
        else if (rawRole === 'security_officer' || rawRole === 'security' || rawRole.includes('security')) {
            rolePrefix = '/security';
        }
        else if (rawRole === 'staff' || rawRole === 'employee' || rawRole === 'host' || userCode.startsWith('EMP')) {
            rolePrefix = '/employee';
        }
        else {
            rolePrefix = '/visitor';
        }
        const newParams = new URLSearchParams({ view: baseView, ...queryParamsObj });
        if (!window.location.pathname.startsWith(rolePrefix)) {
            navigate(`${rolePrefix}/dashboard?${newParams.toString()}`);
        }
        else {
            setSearchParams(newParams);
        }
        setIsMobileOpen(false);
    };
    // RBAC filters helper
    const isRoleAllowed = (allowedRoles) => {
        if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true')
            return true;
        if (!allowedRoles)
            return true;
        if (!user?.role)
            return false;
        const normUserRole = String(user.role).toLowerCase().trim();
        if (normUserRole === 'admin' || normUserRole === 'developer' || normUserRole === 'super_admin' || normUserRole === 'system_admin') {
            return true;
        }
        return allowedRoles.some(r => String(r).toLowerCase().trim() === normUserRole);
    };
    const cleanOrgGroup = {
        key: 'organization-management',
        label: t('sidebar.organizationManagement'),
        iconClass: 'bi-building-gear',
        submenus: [
            { key: 'organizations', label: t('sidebar.organizations'), view: 'organizations' },
            { key: 'departments-mgmt', label: t('sidebar.departments'), view: 'departments_mgmt' },
            { key: 'branches', label: t('sidebar.branches'), view: 'branches' },
            { key: 'buildings-mgmt', label: t('sidebar.buildings', 'Buildings & Facilities'), view: 'buildings' },
            { key: 'floors-mgmt', label: t('sidebar.floors', 'Floors & Levels'), view: 'floors' },
            { key: 'rooms-mgmt', label: t('sidebar.rooms', 'Meeting Rooms & Offices'), view: 'rooms' },
            { key: 'workplace-mgmt', label: t('sidebar.workplace', 'Workplace Desks & Locations'), view: 'workplace' },
            { key: 'org-tree', label: t('sidebar.organizationTree'), view: 'org_tree' },
        ],
    };
    const filteredSidebar = (() => {
        const rawRole = (user?.role || user?.role_name || user?.roleName || '').toLowerCase().trim();
        const userCode = String(user?.userCode || user?.user_code || user?.user_id || '').toUpperCase().trim();
        const pathname = (location.pathname || '').toLowerCase();
        // 1. ADMIN / SUPER ADMIN / DEVELOPER ROLE (OR ADMIN WORKSPACE)
        if (isAdminRole(rawRole) ||
            rawRole === 'admin' ||
            rawRole === 'super_admin' ||
            rawRole === 'system_admin' ||
            rawRole === 'developer' ||
            rawRole === 'org_admin' ||
            (pathname.startsWith('/admin') && rawRole !== 'visitor' && rawRole !== 'employee' && rawRole !== 'receptionist' && rawRole !== 'security')) {
            return [
                { key: 'dashboard-item', label: t('sidebar.dashboard'), iconClass: 'bi-speedometer2', view: 'dashboard' },
                {
                    key: 'user-management',
                    label: t('sidebar.userManagement'),
                    iconClass: 'bi-people',
                    submenus: [
                        { key: 'user-dashboard', label: t('sidebar.dashboard'), view: 'user_dashboard' },
                        { key: 'users', label: t('sidebar.allUsers'), view: 'users' },
                        { key: 'user-employees', label: t('sidebar.employeeManagement'), view: 'user_employees' },
                        { key: 'user-visitors', label: t('sidebar.visitorManagement'), view: 'user_visitors' },
                        { key: 'user-managers', label: t('sidebar.managerManagement'), view: 'user_managers' },
                        { key: 'user-security', label: t('sidebar.securityOfficerManagement'), view: 'user_security' },
                        { key: 'user-receptionists', label: t('sidebar.receptionManagement'), view: 'user_receptionists' },
                        { key: 'account-security', label: t('sidebar.accountSecurity'), view: 'account_security' },
                        { key: 'user-import-export', label: t('sidebar.importExportUsers'), view: 'user_import_export' },
                    ],
                },
                {
                    key: 'role-management',
                    label: t('sidebar.roleManagement'),
                    iconClass: 'bi-shield-check',
                    submenus: [
                        { key: 'role-dashboard', label: t('sidebar.roleDashboard'), view: 'role_dashboard' },
                        { key: 'roles-list', label: t('sidebar.allRolesDirectory'), view: 'roles' },
                        { key: 'role-hierarchy', label: t('sidebar.hierarchyGraph'), view: 'role_hierarchy' },
                        { key: 'role-conflicts', label: t('sidebar.conflictsSoD'), view: 'role_conflicts' },
                    ],
                },
                {
                    key: 'permission-management',
                    label: t('sidebar.permissionManagement'),
                    iconClass: 'bi-key',
                    submenus: [
                        { key: 'permission-dashboard', label: t('sidebar.dashboard'), view: 'permission_dashboard' },
                        { key: 'permissions-list', label: t('sidebar.allPermissions'), view: 'permissions' },
                        { key: 'permission-matrix', label: t('sidebar.permissionMatrix'), view: 'permission_matrix' },
                        { key: 'permission-groups', label: t('sidebar.permissionGroups'), view: 'permission_groups' },
                        { key: 'permission-create', label: t('sidebar.createPermission'), view: 'permission_create' },
                        { key: 'permission-import-export', label: t('sidebar.importExport'), view: 'permission_import_export' },
                        { key: 'permission-risk', label: t('sidebar.riskAnalytics'), view: 'permission_risk' },
                        { key: 'permission-simulator', label: t('sidebar.authSimulator'), view: 'permission_simulator' },
                    ],
                },
                {
                    key: 'notification-management-admin-group',
                    label: t('sidebar.notificationManagement'),
                    iconClass: 'bi-bell',
                    submenus: [
                        { key: 'admin-messages', label: t('sidebar.messages'), view: 'admin_messages' },
                        { key: 'admin-system-chat', label: t('sidebar.systemChat'), view: 'admin_system_chat' },
                        { key: 'admin-announcements', label: t('sidebar.announcements'), view: 'admin_announcements' },
                        { key: 'admin-notification-center', label: t('sidebar.notificationCenter'), view: 'admin_notification_center' },
                        { key: 'admin-notification-settings', label: t('sidebar.notificationSettings'), view: 'admin_notification_settings' },
                    ],
                },
                cleanOrgGroup,
                {
                    key: 'visitor-management-admin',
                    label: t('sidebar.visitorManagement'),
                    iconClass: 'bi-person-check',
                    submenus: [
                        { key: 'visitor-management-dashboard', label: t('sidebar.visitorManagementDashboard'), view: 'enterprise_visitor_dashboard' },
                        { key: 'visitor-registration', label: t('sidebar.visitorRegistration'), view: 'visitor_registration' },
                        { key: 'visitors', label: t('sidebar.visitorProfiles'), view: 'visitors' },
                        { key: 'visitor-categories-admin', label: t('sidebar.visitorCategories'), view: 'visitor_categories' },
                        { key: 'approval-workflows-admin', label: t('sidebar.approvalWorkflows'), view: 'approval_workflow_management' },
                        { key: 'visitor-documents-admin', label: t('sidebar.visitorDocuments'), view: 'visitor_documents_management' },
                        { key: 'admin-identity-reviews', label: 'Identity Review Queue', view: 'identity_reviews' },
                        { key: 'admin-identity-policy', label: 'Identity Policies', view: 'identity_policy' },
                        { key: 'visitor-history-admin', label: t('sidebar.visitorHistory'), view: 'visitor_history' },
                    ],
                },
                {
                    key: 'employee-management-standalone',
                    label: t('sidebar.employeeManagement'),
                    iconClass: 'bi-person-workspace',
                    view: 'employee_management',
                },
                {
                    key: 'reports-analytics',
                    label: t('sidebar.reportsAuditLogs'),
                    iconClass: 'bi-graph-up',
                    submenus: [
                        { key: 'reports-dashboard', label: t('sidebar.dashboardReports'), view: 'reports' },
                        { key: 'visitor-reports', label: t('sidebar.visitorReports'), view: 'visitor_reports' },
                        { key: 'appointment-reports', label: t('sidebar.appointmentReports'), view: 'appointment_reports' },
                        { key: 'audit-logs', label: t('sidebar.auditLogs'), view: 'audit_logs' },
                    ],
                },
                {
                    key: 'system-settings',
                    label: t('sidebar.systemSettings'),
                    iconClass: 'bi-gear',
                    submenus: [
                        { key: 'settings-general', label: t('sidebar.generalFacility'), view: 'settings_general' },
                        { key: 'settings-visitor', label: t('sidebar.visitorAccessRules'), view: 'settings_visitor' },
                        { key: 'settings-notifications', label: t('sidebar.notificationsSMTP'), view: 'settings_notifications' },
                        { key: 'settings-localization', label: t('sidebar.regionalTime'), view: 'settings_localization' },
                        { key: 'settings-maintenance', label: t('sidebar.backupMaintenance'), view: 'settings_maintenance' },
                    ],
                },
                {
                    key: 'support-feedback-admin',
                    label: t('sidebar.feedbackSupport'),
                    iconClass: 'bi-headset',
                    view: 'FeedbackSupportCenter',
                },
            ];
        }
        // 2. MANAGER ROLE
        if (rawRole === 'manager' || rawRole.includes('manager') || pathname.startsWith('/manager')) {
            return [
                { key: 'dashboard-manager', label: t('sidebar.dashboard'), iconClass: 'bi-speedometer2', view: 'manager_dashboard' },
                { key: 'manager-requests', label: t('sidebar.visitorRequestsApprovals'), iconClass: 'bi-check-square', view: 'manager_requests' },
                { key: 'manager-employees', label: t('sidebar.employeesHosts'), iconClass: 'bi-person-workspace', view: 'manager_employees' },
                { key: 'manager-availability', label: t('sidebar.hostAvailabilityMatrix'), iconClass: 'bi-calendar-check', view: 'manager_availability' },
                { key: 'manager-meetings', label: 'Meeting Management', iconClass: 'bi-briefcase', view: 'manager_appointments' },
                { key: 'team-visitors', label: t('sidebar.departmentVisitors'), iconClass: 'bi-people', view: 'manager_visitors' },
                { key: 'manager-rooms', label: t('sidebar.meetingRoomsSpaces'), iconClass: 'bi-door-open', view: 'manager_rooms' },
                { key: 'reports-manager', label: t('sidebar.departmentReports'), iconClass: 'bi-graph-up', view: 'manager_reports' },
                { key: 'manager-audit', label: t('sidebar.auditHistory'), iconClass: 'bi-shield-check', view: 'manager_audit' },
                {
                    key: 'notification-management-manager-group',
                    label: t('sidebar.notificationManagement'),
                    iconClass: 'bi-bell',
                    submenus: [
                        { key: 'manager-notifications', label: t('sidebar.notificationCenter'), view: 'notifications' },
                        { key: 'manager-messages', label: t('sidebar.messageCenter'), view: 'messages' },
                        { key: 'manager-announcements', label: t('sidebar.announcements'), view: 'announcements' },
                    ],
                },
                { key: 'manager-feedback-support', label: t('sidebar.feedbackSupport'), iconClass: 'bi-headset', view: 'FeedbackSupportCenter' },
            ];
        }
        // 3. RECEPTIONIST ROLE
        if (rawRole === 'receptionist' || rawRole.includes('reception') || pathname.startsWith('/reception')) {
            return [
                { key: 'reception-dashboard', label: t('sidebar.receptionDashboard'), iconClass: 'bi-speedometer2', view: 'reception_management' },
                { key: 'visitor-arrivals', label: t('sidebar.visitorArrivals'), iconClass: 'bi-person-check', view: 'visitor_arrivals' },
                { key: 'appointment-verification', label: t('sidebar.verifyAppointment'), iconClass: 'bi-check2-square', view: 'appointment_verification' },
                { key: 'walkin-registration', label: t('sidebar.walkInRegistration'), iconClass: 'bi-person-plus', view: 'walkin_management' },
                { key: 'visitor-queue', label: t('sidebar.liveVisitorQueue'), iconClass: 'bi-people', view: 'visitor_queue' },
                { key: 'visitor-passes', label: t('sidebar.visitorPassIssuance'), iconClass: 'bi-qr-code', view: 'reception_passes' },
                {
                    key: 'notification-management-reception-group',
                    label: t('sidebar.notificationManagement'),
                    iconClass: 'bi-bell',
                    submenus: [
                        { key: 'reception-notifications', label: t('sidebar.notificationCenter'), view: 'notifications' },
                        { key: 'reception-messages', label: t('sidebar.messageCenter'), view: 'messages' },
                        { key: 'reception-announcements', label: t('sidebar.announcements'), view: 'announcements' },
                    ],
                },
                { key: 'reception-directory', label: t('sidebar.directorySearch'), iconClass: 'bi-search', view: 'reception_directory' },
                { key: 'reception-reports', label: t('sidebar.receptionReports'), iconClass: 'bi-graph-up', view: 'reception_reports' },
                { key: 'reception-activity', label: t('sidebar.activityLog'), iconClass: 'bi-activity', view: 'reception_activity_log' },
                { key: 'checkin-item', label: t('sidebar.expressCheckIn'), iconClass: 'bi-box-arrow-in-right', view: 'checkin' },
                { key: 'checkout-item', label: t('sidebar.expressCheckOut'), iconClass: 'bi-box-arrow-right', view: 'checkout' },
                { key: 'checkin-checkout-history', label: t('sidebar.checkInOutHistory'), iconClass: 'bi-clock-history', view: 'checkin_checkout_history' },
                { key: 'reception-feedback-support', label: t('sidebar.feedbackSupport'), iconClass: 'bi-headset', view: 'FeedbackSupportCenter' },
            ];
        }
        // 4. SECURITY ROLE
        if (rawRole === 'security_officer' || rawRole === 'security' || rawRole.includes('security') || pathname.startsWith('/security')) {
            return [
                { key: 'dashboard-security', label: t('sidebar.securityDashboard'), iconClass: 'bi-shield-shaded', view: 'dashboard' },
                {
                    key: 'security-access',
                    label: t('sidebar.securityAccessControl'),
                    iconClass: 'bi-shield-lock',
                    submenus: [
                        { key: 'sec-restricted-badges', label: t('sidebar.areaAndAccessBadges', 'Area & Access Level Badges'), view: 'badge_management' },
                        { key: 'security-incidents', label: t('sidebar.securityIncidents'), view: 'security_incidents' },
                        { key: 'verification', label: t('sidebar.passVerificationQR'), view: 'verification' },
                        { key: 'blacklist', label: t('sidebar.blacklistWatchlist'), view: 'blacklist_watchlist' },
                        { key: 'access-logs', label: t('sidebar.accessLogsMovement'), view: 'security_logs' },
                        { key: 'escorts', label: t('sidebar.escortManagement'), view: 'security_escorts' },
                        { key: 'access-rules', label: t('sidebar.accessControlRules'), view: 'access_rules' },
                        { key: 'security-identity-reviews', label: 'Identity Review Queue', view: 'identity_reviews' },
                    ],
                },
                { key: 'checkin-security', label: t('sidebar.gateTurnstileCheckIn'), iconClass: 'bi-qr-code-scan', view: 'checkin' },
                { key: 'checkout-security', label: t('sidebar.gateTurnstileCheckOut', 'Gate Turnstile Check-Out'), iconClass: 'bi-box-arrow-right', view: 'checkout' },
                {
                    key: 'security-reports-audit-group',
                    label: t('sidebar.reportsAuditLogs', 'Reports & Audit Logs'),
                    iconClass: 'bi-file-earmark-bar-graph',
                    submenus: [
                        { key: 'sec-nav-security-reports', label: 'Security Reports', view: 'security_reports' },
                        { key: 'sec-nav-security-audit-logs', label: 'Security Audit Logs', view: 'security_audit_logs' },
                    ],
                },
                {
                    key: 'notification-management-security-group',
                    label: t('sidebar.notificationManagement'),
                    iconClass: 'bi-bell',
                    submenus: [
                        { key: 'security-notifications', label: t('sidebar.notificationCenter'), view: 'notifications' },
                        { key: 'security-messages', label: t('sidebar.messageCenter'), view: 'messages' },
                        { key: 'security-announcements', label: t('sidebar.announcements'), view: 'announcements' },
                    ],
                },
                { key: 'security-feedback-support', label: t('sidebar.feedbackSupport'), iconClass: 'bi-headset', view: 'FeedbackSupportCenter' },
            ];
        }
        // 5. EMPLOYEE / STAFF ROLE
        if (rawRole === 'employee' ||
            rawRole === 'staff' ||
            rawRole === 'host' ||
            userCode.startsWith('EMP') ||
            pathname.startsWith('/employee')) {
            return [
                { key: 'emp-dashboard', label: t('sidebar.myDashboard'), iconClass: 'bi-speedometer2', view: 'employee_dashboard' },
                { key: 'emp-requests', label: t('sidebar.visitorRequests'), iconClass: 'bi-envelope-check', view: 'employee_requests', badge: pendingCount > 0 ? pendingCount : null },
                { key: 'emp-appointments', label: t('sidebar.myAppointments'), iconClass: 'bi-calendar-event', view: 'employee_appointments' },
                { key: 'emp-calendar', label: t('sidebar.myCalendar'), iconClass: 'bi-calendar3', view: 'employee_calendar' },
                { key: 'emp-visitors', label: t('sidebar.myVisitors'), iconClass: 'bi-people', view: 'employee_visitors' },
                {
                    key: 'notification-management-employee-group',
                    label: t('sidebar.notificationManagement'),
                    iconClass: 'bi-bell',
                    submenus: [
                        { key: 'emp-notifications', label: t('sidebar.notificationCenter'), view: 'employee_notifications' },
                        { key: 'emp-messages', label: t('sidebar.messageCenter'), view: 'messages' },
                        { key: 'emp-announcements', label: t('sidebar.announcements'), view: 'announcements' },
                    ],
                },
                { key: 'emp-feedback-support', label: t('sidebar.feedbackSupport'), iconClass: 'bi-headset', view: 'FeedbackSupportCenter' },
                { key: 'emp-profile', label: t('nav.myProfile'), iconClass: 'bi-person-badge', view: 'employee_profile' },
                { key: 'emp-help', label: t('sidebar.helpFAQs'), iconClass: 'bi-question-circle', view: 'employee_help' },
            ];
        }
        // 6. VISITOR ROLE (DEFAULT)
        return [
            { key: 'visitor-home', label: t('sidebar.myDashboard'), iconClass: 'bi-speedometer2', view: 'dashboard' },
            { key: 'visitor-profile', label: t('nav.myProfile'), iconClass: 'bi-person-badge', view: 'visitor_profile' },
            { key: 'visitor-pass', label: t('sidebar.myDigitalPass'), iconClass: 'bi-qr-code-scan', view: 'visitor_pass' },
            { key: 'my-appointments', label: t('sidebar.myAppointments'), iconClass: 'bi-calendar-event', view: 'my_appointments' },
            { key: 'visit-history', label: t('sidebar.visitHistory'), iconClass: 'bi-clock-history', view: 'visit_history' },
            { key: 'visitor-documents', label: t('sidebar.myDocuments'), iconClass: 'bi-folder2-open', view: 'visitor_documents' },
            {
                key: 'notification-management-visitor-group',
                label: t('sidebar.notificationManagement'),
                iconClass: 'bi-bell',
                submenus: [
                    { key: 'visitor-notifications', label: t('sidebar.notificationCenter'), view: 'notifications' },
                    { key: 'visitor-messages-nav', label: t('sidebar.messageCenter'), view: 'visitor_messages' },
                    { key: 'visitor-announcements-nav', label: t('sidebar.announcements'), view: 'visitor_announcements' },
                ],
            },
            { key: 'visitor-feedback-hub', label: t('sidebar.feedbackSupport'), iconClass: 'bi-headset', view: 'FeedbackSupportCenter' },
            { key: 'visitor-feedback', label: t('sidebar.feedback'), iconClass: 'bi-star', view: 'visitor_feedback' },
            { key: 'visitor-support', label: t('sidebar.helpSupport'), iconClass: 'bi-question-circle', view: 'visitor_support' },
        ];
    })();
    // Search filter results
    const searchResults = searchQuery
        ? filteredSidebar.flatMap((item) => {
            const matches = [];
            if (item.submenus) {
                item.submenus.forEach((sub) => {
                    if (sub.label.toLowerCase().includes(searchQuery.toLowerCase())) {
                        matches.push({ label: sub.label, view: sub.view, category: item.label });
                    }
                });
            }
            else if (item.view && item.label.toLowerCase().includes(searchQuery.toLowerCase())) {
                matches.push({ label: item.label, view: item.view, category: 'General' });
            }
            return matches;
        })
        : [];
    const markAllRead = async () => {
        try {
            await notificationsApi.markAllRead();
        }
        catch (err) {
            console.error('Failed to mark all as read:', err);
        }
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadNotificationCount(0);
        window.dispatchEvent(new CustomEvent('vms-all-notifications-read'));
    };
    const [extraTick, setExtraTick] = useState(0);
    useEffect(() => {
        const handleStorage = () => setExtraTick((t) => t + 1);
        window.addEventListener('storage', handleStorage);
        window.addEventListener('user-profile-updated', handleStorage);
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('user-profile-updated', handleStorage);
        };
    }, []);
    const handleNotificationClick = async (id) => {
        const targetNotif = notifications.find((n) => n.id === id);
        const wasUnread = targetNotif ? !targetNotif.read : true;
        // 1. Immediately update UI state & remove 1 from bell badge count
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        if (wasUnread) {
            setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
        }
        // 2. Persist read status in backend database
        try {
            await notificationsApi.markRead(id);
        }
        catch (err) {
            console.error('Failed to mark notification as read in API:', err);
        }
        // 3. Dispatch global event so all components know
        window.dispatchEvent(new CustomEvent('vms-notification-read', { detail: { id } }));
        // 4. Redirect to the notification page based on user role
        const rawRole = (user?.role || user?.role_name || user?.roleName || '').toLowerCase().trim();
        let rolePrefix = '/visitor';
        let notifView = 'notifications';
        if (isAdminRole(rawRole) ||
            rawRole === 'admin' ||
            rawRole === 'developer' ||
            rawRole === 'super_admin' ||
            rawRole === 'system_admin' ||
            rawRole === 'org_admin') {
            rolePrefix = '/admin';
            notifView = 'admin_notification_center';
        }
        else if (rawRole === 'staff' || rawRole === 'employee' || rawRole === 'host') {
            rolePrefix = '/employee';
            notifView = 'employee_notifications';
        }
        else if (rawRole === 'manager' || rawRole.includes('manager')) {
            rolePrefix = '/manager';
            notifView = 'notifications';
        }
        else if (rawRole === 'receptionist' || rawRole.includes('reception')) {
            rolePrefix = '/reception';
            notifView = 'notifications';
        }
        else if (rawRole === 'security_officer' || rawRole === 'security' || rawRole.includes('security')) {
            rolePrefix = '/security';
            notifView = 'notifications';
        }
        else {
            rolePrefix = '/visitor';
            notifView = 'visitor_notifications';
        }
        navigate(`${rolePrefix}/dashboard?view=${notifView}&tab=notifications&notifId=${id}`);
    };
    const effectiveUser = (() => {
        if (!user)
            return null;
        const uAny = user;
        // 1. First preference: User's explicit avatar properties
        const explicitPhoto = uAny.avatarUrl || uAny.avatar || uAny.photo_url || uAny.photoUrl || null;
        // 2. Second preference: User-ID / User Code specific keys
        const idKeys = [user.id, uAny.user_id, uAny.employee_code, uAny.userCode].filter(Boolean);
        let userSpecificPhoto = null;
        for (const idKey of idKeys) {
            const p = sessionStorage.getItem(`user_photo_${idKey}`) || localStorage.getItem(`user_photo_${idKey}`);
            if (p) {
                userSpecificPhoto = p;
                break;
            }
        }
        // 3. Third preference: Role-scoped photo strictly for current user
        const roleLower = user.role?.toLowerCase();
        let roleScopedPhoto = null;
        const userEmailLower = (user.email || '').toLowerCase().trim();
        if (roleLower === 'admin') {
            roleScopedPhoto = sessionStorage.getItem('admin_profile_photo') || localStorage.getItem('admin_profile_photo');
        }
        else if (roleLower === 'visitor') {
            try {
                const raw = sessionStorage.getItem('active_visitor_profile') || localStorage.getItem('active_visitor_profile') || sessionStorage.getItem('registered_visitor_data') || localStorage.getItem('registered_visitor_data');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    const pEmail = (parsed.email || '').toLowerCase().trim();
                    if (pEmail && userEmailLower && pEmail === userEmailLower) {
                        roleScopedPhoto = parsed?.photoUrl || parsed?.photo_url || parsed?.avatarUrl;
                    }
                }
            }
            catch (e) { }
        }
        else if (roleLower === 'employee' || roleLower === 'staff') {
            roleScopedPhoto = sessionStorage.getItem('employee_uploaded_photo') || localStorage.getItem('employee_uploaded_photo');
        }
        else if (roleLower === 'receptionist') {
            roleScopedPhoto = sessionStorage.getItem('receptionist_uploaded_photo') || localStorage.getItem('receptionist_uploaded_photo');
        }
        else if (roleLower === 'security' || roleLower === 'security_officer') {
            roleScopedPhoto = sessionStorage.getItem('security_uploaded_photo') || localStorage.getItem('security_uploaded_photo');
        }
        const resolvedPhoto = explicitPhoto || userSpecificPhoto || roleScopedPhoto || undefined;
        let activeVisitorName = undefined;
        let activeVisitorEmail = undefined;
        if (roleLower === 'visitor') {
            try {
                const raw = sessionStorage.getItem('active_visitor_profile') || localStorage.getItem('active_visitor_profile') || sessionStorage.getItem('registered_visitor_data') || localStorage.getItem('registered_visitor_data');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    const pEmail = (parsed.email || '').toLowerCase().trim();
                    if (pEmail && userEmailLower && pEmail === userEmailLower) {
                        activeVisitorName = parsed?.visitorName || parsed?.fullName || parsed?.full_name;
                        activeVisitorEmail = parsed?.email;
                    }
                }
            }
            catch (e) { }
        }
        const fullName = user.fullName || uAny.full_name || activeVisitorName;
        const email = user.email || activeVisitorEmail;
        return {
            ...user,
            fullName: fullName || user.fullName,
            email: email || user.email,
            avatarUrl: resolvedPhoto,
            avatar: resolvedPhoto
        };
    })();
    const rawRole = (user?.role || user?.role_name || user?.roleName || '').toLowerCase().trim();
    const pathLower = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
    const currentRole = (rawRole === 'admin' || rawRole === 'superadmin' || pathLower.startsWith('/admin')) ? 'admin' :
        (rawRole === 'manager' || rawRole === 'department_manager' || pathLower.startsWith('/manager')) ? 'manager' :
            (rawRole === 'receptionist' || rawRole === 'reception' || pathLower.startsWith('/reception')) ? 'receptionist' :
                (rawRole === 'security' || rawRole === 'security_officer' || rawRole.includes('security') || pathLower.startsWith('/security')) ? 'security' :
                    (rawRole === 'employee' || rawRole === 'staff' || rawRole === 'host' || pathLower.startsWith('/employee')) ? 'employee' :
                        'visitor';
    return (<div className={`vms-app vms-role--${currentRole}`} data-role={currentRole}>
      {/* SIDEBAR NAVIGATION PANEL */}
      <Sidebar collapsed={isCollapsed} onCollapseToggle={toggleSidebar} mobileOpen={isMobileOpen} onMobileClose={() => setIsMobileOpen(false)} user={effectiveUser} config={filteredSidebar} currentView={currentView} onViewClick={handleViewClick}/>

      {/* MAIN VIEWPORT WRAPPER */}
      <div className={`vms-main-wrapper ${isCollapsed ? 'sidebar-collapsed' : ''} vms-role--${currentRole}`} data-role={currentRole}>
        
        {/* STICKY TOP NAVIGATION BAR */}
        <Navbar collapsed={isCollapsed} onCollapseToggle={toggleSidebar} onMobileToggle={() => setIsMobileOpen(!isMobileOpen)} user={effectiveUser} notifications={notifications} unreadNotificationCount={unreadNotificationCount} unreadMessageCount={unreadMessageCount} onRefreshNotifications={fetchRealNotifications} onMarkAllRead={markAllRead} onNotificationClick={handleNotificationClick} onViewAllNotifications={() => {
            const rawRole = (user?.role || user?.role_name || user?.roleName || '').toLowerCase().trim();
            if (rawRole === 'visitor')
                handleViewClick('visitor_notifications?tab=notifications');
            else if (rawRole === 'employee' || rawRole === 'staff')
                handleViewClick('employee_notifications?tab=notifications');
            else if (isAdminRole(rawRole) || rawRole === 'admin')
                handleViewClick('admin_notification_center?tab=notifications');
            else
                handleViewClick('notifications?tab=notifications');
        }} onMessagesClick={() => {
            handleViewClick('system_chat?tab=messages');
        }} onProfileClick={handleViewClick} onLogout={handleLogout} searchQuery={searchQuery} onSearchChange={setSearchQuery} searchResults={searchResults} onResultClick={handleViewClick}/>

        {/* MAIN BODY LAYOUT CONTENT PANE */}
        <main className="vms-main-content">{children}</main>

      </div>

      {showChangePasswordModal && createPortal(<div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 text-slate-900 dark:text-white relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
                <Lock className="h-4 w-4 text-indigo-500"/> {t('changePassword.title')}
              </h3>
              <button onClick={() => setShowChangePasswordModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors">
                <X className="h-5 w-5"/>
              </button>
            </div>
            <ChangePasswordForm onClose={() => setShowChangePasswordModal(false)}/>
          </div>
        </div>, document.body)}

      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </div>);
}
function ChangePasswordForm({ onClose }) {
    const { t } = useLanguage();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError(t('changePassword.fillAll'));
            return;
        }
        if (newPassword !== confirmPassword) {
            setError(t('changePassword.mismatch'));
            return;
        }
        if (newPassword.length < 8) {
            setError(t('changePassword.minLength'));
            return;
        }
        setLoading(true);
        try {
            await authApi.changePassword(currentPassword, newPassword);
            setSuccess(t('changePassword.success'));
            setTimeout(() => {
                onClose();
            }, 2000);
        }
        catch (err) {
            setError(getErrorMessage(err) || t('changePassword.failed'));
        }
        finally {
            setLoading(false);
        }
    };
    return (<form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
      {error && (<div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0"/>
          <span>{error}</span>
        </div>)}
      {success && (<div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0"/>
          <span>{success}</span>
        </div>)}

      <div>
        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">{t('changePassword.currentPassword')} *</label>
        <div className="relative flex items-center">
          <input type={showCurrent ? 'text' : 'password'} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder={t('changePassword.enterCurrent')}/>
          <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            {showCurrent ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">{t('changePassword.newPassword')} *</label>
        <div className="relative flex items-center">
          <input type={showNew ? 'text' : 'password'} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('changePassword.enterNew')}/>
          <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            {showNew ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">{t('changePassword.confirmNewPassword')} *</label>
        <div className="relative flex items-center">
          <input type={showConfirm ? 'text' : 'password'} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('changePassword.reEnterNew')}/>
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            {showConfirm ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800">
          {t('changePassword.cancel')}
        </button>
        <button type="submit" disabled={loading} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2">
          {loading ? t('changePassword.updating') : t('changePassword.update')}
        </button>
      </div>
    </form>);
}
