import React, { Component, useEffect, useState } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import DashboardLayout from '../../../components/DashboardLayout';
import { componentRegistry } from '../../../Resource/registry';
import { MeetingRoomsView, VisitorReportsView, AppointmentReportsView, ChangePasswordView, } from '../../../components/NavViewsMock';
import { departmentsApi, roomsApi, } from '../../../services/api';
import api from '../../../services/api';
import UserManagement from '../../../Resource/Admin/UserManagement';
import DepartmentSettings from '../../../Resource/Admin/DepartmentSettings';
import AdminDashboard from '../../../Resource/Admin/AdminDashboard';
import NotificationAdminHome from '../../../Resource/Admin/NotificationManagement/NotificationAdminHome';
import ManualNotificationDashboard from '../../../Resource/Admin/NotificationManagement/Manual/ManualNotificationDashboard';
import EnterpriseNotificationComposer from '../../../Resource/Admin/NotificationManagement/Manual/EnterpriseNotificationComposer';
import DraftAndSchedulingManager from '../../../Resource/Admin/NotificationManagement/Manual/DraftAndSchedulingManager';
import BroadcastAndAnnouncementCenter from '../../../Resource/Admin/NotificationManagement/Manual/BroadcastAndAnnouncementCenter';
import DeliveryTrackingAndMonitoring from '../../../Resource/Admin/NotificationManagement/Manual/DeliveryTrackingAndMonitoring';
import ManualNotificationAnalyticsAndReports from '../../../Resource/Admin/NotificationManagement/Manual/ManualNotificationAnalyticsAndReports';
import ManualNotificationSecurityAndAudit from '../../../Resource/Admin/NotificationManagement/Manual/ManualNotificationSecurityAndAudit';
import RuleEngineDashboard from '../../../Resource/Admin/NotificationManagement/RuleEngine/RuleEngineDashboard';
import RuleManagementCenter from '../../../Resource/Admin/NotificationManagement/RuleEngine/RuleManagementCenter';
import VisualRuleAndWorkflowBuilder from '../../../Resource/Admin/NotificationManagement/RuleEngine/VisualRuleAndWorkflowBuilder';
import RecipientAndChannelRules from '../../../Resource/Admin/NotificationManagement/RuleEngine/RecipientAndChannelRules';
import SchedulingAndTimeRules from '../../../Resource/Admin/NotificationManagement/RuleEngine/SchedulingAndTimeRules';
import EscalationReminderAndRetry from '../../../Resource/Admin/NotificationManagement/RuleEngine/EscalationReminderAndRetry';
import ApprovalAndOrgRules from '../../../Resource/Admin/NotificationManagement/RuleEngine/ApprovalAndOrgRules';
import RoleAndUserGroupRules from '../../../Resource/Admin/NotificationManagement/RuleEngine/RoleAndUserGroupRules';
import VisitorEmployeeAppointmentRules from '../../../Resource/Admin/NotificationManagement/RuleEngine/VisitorEmployeeAppointmentRules';
import ReceptionSecurityPassRules from '../../../Resource/Admin/NotificationManagement/RuleEngine/ReceptionSecurityPassRules';
import CheckinCheckoutEmergencySystemRules from '../../../Resource/Admin/NotificationManagement/RuleEngine/CheckinCheckoutEmergencySystemRules';
import RuleTestingAndSimulationCenter from '../../../Resource/Admin/NotificationManagement/RuleEngine/RuleTestingAndSimulationCenter';
import RuleVersionAndImportExport from '../../../Resource/Admin/NotificationManagement/RuleEngine/RuleVersionAndImportExport';
import RuleAnalyticsAndPerformance from '../../../Resource/Admin/NotificationManagement/RuleEngine/RuleAnalyticsAndPerformance';
import RuleDependencyConflictTemplates from '../../../Resource/Admin/NotificationManagement/RuleEngine/RuleDependencyConflictTemplates';
import ProductionAndIntegrationCenter from '../../../Resource/Admin/NotificationManagement/RuleEngine/ProductionAndIntegrationCenter';
import RealtimeNotificationCenter from '../../../Resource/Admin/NotificationManagement/Production/RealtimeNotificationCenter';
import QueueManagementDashboard from '../../../Resource/Admin/NotificationManagement/Production/QueueManagementDashboard';
import AnalyticsAndExportCenter from '../../../Resource/Admin/NotificationManagement/Production/AnalyticsAndExportCenter';
import HealthPerformanceAndDeploymentCenter from '../../../Resource/Admin/NotificationManagement/Production/HealthPerformanceAndDeploymentCenter';
import SecurityNotificationCenter from '../../../Resource/Security/NotificationManagement/SecurityNotificationCenter';
import UnifiedNotificationCenter from '../../notifications/components/UnifiedNotificationCenter';
import OrgList from '../../../Resource/Admin/Organization/List/OrgList';
import CreateOrgWizard from '../../../Resource/Admin/Organization/Wizard/CreateOrgWizard';
import OrgProfileEdit from '../../../Resource/Admin/Organization/Profile/OrgProfileEdit';
import OrgDetails from '../../../Resource/Admin/Organization/Details/OrgDetails';
import OrgTreeView from '../../../Resource/Admin/Organization/Tree/OrgTreeView';
import OrgSettings from '../../../Resource/Admin/Organization/Settings/OrgSettings';
import BusinessCalendar from '../../../Resource/Admin/Organization/Calendar/BusinessCalendar';
import HierarchyDashboard from '../../../Resource/Admin/Organization/Hierarchy/HierarchyDashboard';
import EmployeeDashboard from '../../../Resource/Employee/EmployeeDashboard';
import EmployeePortal from '../../../Resource/Employee/EmployeePortal';
import EmployeeManagementHome from '../../../Resource/Admin/EmployeeManagement/EmployeeManagementHome';
import EmployeeProfileView from '../../../Resource/Employee/EmployeeProfileView';
import ManagerDashboard from '../../../Resource/Manager/ManagerDashboard';
import DepartmentEmployeesView from '../../../Resource/Manager/DepartmentEmployeesView';
import HostAvailabilityView from '../../../Resource/Manager/HostAvailabilityView';
import DepartmentVisitorRequestsView from '../../../Resource/Manager/DepartmentVisitorRequestsView';
import DepartmentAppointmentsView from '../../../Resource/Manager/DepartmentAppointmentsView';
import DepartmentVisitorsView from '../../../Resource/Manager/DepartmentVisitorsView';
import DepartmentReportsView from '../../../Resource/Manager/DepartmentReportsView';
import DepartmentAuditLogsView from '../../../Resource/Manager/DepartmentAuditLogsView';
import DepartmentManagerProfileView from '../../../Resource/Manager/DepartmentManagerProfileView';
import DepartmentRoomsView from '../../../Resource/Manager/DepartmentRoomsView';
import DepartmentPoliciesView from '../../../Resource/Manager/DepartmentPoliciesView';
import DepartmentEvacuationView from '../../../Resource/Manager/DepartmentEvacuationView';
import DepartmentSecurityZonesView from '../../../Resource/Manager/DepartmentSecurityZonesView';
import ReceptionDashboard from '../../../Resource/Receptionist/ReceptionDashboard';
import ReceptionistProfileSettings from '../../../Resource/Receptionist/ReceptionistProfileSettings';
import WalkInVisitorManagement from '../../../Resource/Receptionist/WalkInVisitorManagement';
import VisitorPassIssuance from '../../../Resource/Receptionist/VisitorPassIssuance';
import SecurityDashboard from '../../../Resource/Security/SecurityDashboard';
import SecurityOfficerProfileView from '../../../Resource/Security/SecurityOfficerProfileView';
import RoleManagement from '../../../Resource/Admin/RoleManagement';
import PermissionManagement from '../../../Resource/Admin/PermissionManagement';
import AuditLogs from '../../../Resource/Admin/AuditLogs';
import OperationalReports from '../../../Resource/Reports/OperationalReports';
import ReportingDashboard from '../../../Resource/Reports/ReportingDashboard';
import AuditorDashboard from '../../../Resource/Dashboard/AuditorDashboard';
import SecurityReportsView from '../../../Resource/Security/SecurityReportsView';
import SecurityAuditLogsView from '../../../Resource/Security/SecurityAuditLogsView';
import VisitorDocumentManagement from '../../../Resource/Admin/VisitorManagement/Documents/VisitorDocumentManagement';
import VisitorCategoryManagement from '../../../Resource/Admin/VisitorManagement/Categories/VisitorCategoryManagement';
import CategoryDetails from '../../../Resource/Admin/VisitorManagement/Categories/CategoryDetails';
import SystemSettings from '../../../Resource/Admin/SystemSettings';
import VisitorRegistrationPage from '../../../Resource/Visitor/VisitorRegistrationPage';
import VisitorDashboard from '../../../Resource/Visitor/VisitorDashboard';
import EnterpriseVisitorDashboard from '../../../Resource/Admin/VisitorManagement/EnterpriseVisitorDashboard';
import VisitorProfile from '../../../Resource/Visitor/VisitorProfile';
import VisitorProfilesManagement from '../../../Resource/Admin/VisitorManagement/Profiles/VisitorProfilesManagement';
import VisitorAppointments from '../../../Resource/Visitor/VisitorAppointments';
import VisitorDocuments from '../../../Resource/Visitor/VisitorDocuments';
import VisitorPass from '../../../Resource/Visitor/VisitorPass';
import VisitorFeedback from '../../../Resource/Visitor/VisitorFeedback';
import VisitorSupport from '../../../Resource/Visitor/VisitorSupport';
import VisitorAdminSettings from '../../../Resource/Admin/VisitorManagement/Settings/VisitorSettings';
import VisitHistory from '../../../Resource/Visitor/VisitHistory';
import NewAppointmentForm from '../../../Resource/Visitor/components/NewAppointmentForm';
import CheckIn from '../../../Resource/Receptionist/CheckIn';
import CheckOut from '../../../Resource/Receptionist/CheckOut';
import WalkInVisitors from '../../../Resource/Receptionist/WalkInVisitors';
import VisitorArrivalManagement from '../../../Resource/Receptionist/VisitorArrivalManagement';
import AppointmentVerification from '../../../Resource/Receptionist/AppointmentVerification';
import VisitorQueueManagement from '../../../Resource/Receptionist/VisitorQueueManagement';
import HostNotificationView from '../../../Resource/Receptionist/HostNotificationView';
import WaitingAreaManagement from '../../../Resource/Receptionist/WaitingAreaManagement';
import ReceptionSearchDirectory from '../../../Resource/Receptionist/ReceptionSearchDirectory';
import ReceptionReportsView from '../../../Resource/Receptionist/ReceptionReportsView';
import ReceptionActivityLogView from '../../../Resource/Receptionist/ReceptionActivityLogView';
import CheckInDashboard from '../../../Resource/Receptionist/CheckInDashboard';
import CheckInHistory from '../../../Resource/Receptionist/CheckInHistory';
import CheckInOutHistory from '../../../Resource/Receptionist/CheckInOutHistory';
import CheckInAnalytics from '../../../Resource/Receptionist/CheckInAnalytics';
import CheckInValidation from '../../../Resource/Receptionist/CheckInValidation';
import GroupCheckIn from '../../../Resource/Receptionist/GroupCheckIn';
import VIPCheckIn from '../../../Resource/Receptionist/VIPCheckIn';
import ContractorCheckIn from '../../../Resource/Receptionist/ContractorCheckIn';
import VehicleCheckIn from '../../../Resource/Receptionist/VehicleCheckIn';
import CheckOutDashboard from '../../../Resource/Receptionist/CheckOutDashboard';
import CheckOutExitProcessing from '../../../Resource/Receptionist/CheckOutExitProcessing';
import PendingCheckOuts from '../../../Resource/Receptionist/PendingCheckOuts';
import OverstayManagement from '../../../Resource/Receptionist/OverstayManagement';
import AssetReturnVerification from '../../../Resource/Receptionist/AssetReturnVerification';
import GroupCheckOut from '../../../Resource/Receptionist/GroupCheckOut';
import EmergencyEvacuationStatus from '../../../Resource/Receptionist/EmergencyEvacuationStatus';
import CheckOutHistory from '../../../Resource/Receptionist/CheckOutHistory';
import BadgeManagement from '../../../Resource/Receptionist/BadgeManagement';
import VisitorVerification from '../../../Resource/Receptionist/VisitorVerification';
import QRScanner from '../../../Resource/Security/QRScanner';
import AccessControl from '../../../Resource/Security/AccessControl';
import IncidentManagement from '../../../Resource/Security/IncidentManagement';
import BlacklistWatchlistVerification from '../../../Resource/Security/BlacklistWatchlistVerification';
import VisitorMovement from '../../../Resource/Security/VisitorMovement';
import VisitorScreening from '../../../Resource/Security/VisitorScreening';
import LiveVisitorTracking from '../../../Resource/Security/LiveVisitorTracking';
import EscortManagement from '../../../Resource/Security/EscortManagement';
import AccessControlRules from '../../../Resource/Security/AccessControlRules';
import SecurityReportsAnalytics from '../../../Resource/Security/SecurityReportsAnalytics';
import FeedbackSupportCenter from '../../../Resource/Common/FeedbackSupportCenter';

// Real Identity Verification Module
import IdentityVerificationOverviewPage from '../../identity-verification/pages/IdentityVerificationOverviewPage';
import DocumentSelectionPage from '../../identity-verification/pages/DocumentSelectionPage';
import DocumentCapturePage from '../../identity-verification/pages/DocumentCapturePage';
import BiometricVerificationPage from '../../identity-verification/pages/BiometricVerificationPage';
import VerificationStatusPage from '../../identity-verification/pages/VerificationStatusPage';
import ReviewerQueuePage from '../../identity-verification/pages/ReviewerQueuePage';
import ReviewerCaseDetailPage from '../../identity-verification/pages/ReviewerCaseDetailPage';
import VerificationPolicySettingsPage from '../../identity-verification/pages/VerificationPolicySettingsPage';

// ── ErrorBoundary to prevent black screens on render crashes ──
class ViewErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        console.error('[ViewErrorBoundary] Render crash:', error, info);
    }
    componentDidUpdate(prevProps) {
        if (prevProps.viewKey !== this.props.viewKey && this.state.hasError) {
            this.setState({ hasError: false, error: null });
        }
    }
    render() {
        if (this.state.hasError) {
            return (<div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-8 max-w-md text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-500/10 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Something went wrong</h3>
            <p className="text-xs text-slate-400 mb-4">This view encountered an error and could not render. You can try again or navigate to a different section.</p>
            <p className="text-[10px] text-rose-400/70 font-mono mb-4 break-all">
              {typeof this.state.error?.message === 'string'
                    ? this.state.error.message
                    : typeof this.state.error === 'string'
                        ? this.state.error
                        : JSON.stringify(this.state.error || 'An error occurred')}
            </p>
            <button onClick={() => this.setState({ hasError: false, error: null })} className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
              Try Again
            </button>
          </div>
        </div>);
        }
        return this.props.children;
    }
}
export default function DashboardPage() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const pathToViewMap = {};
    user?.identity?.resources?.forEach((r) => {
        pathToViewMap[r.routeUrl] = r.component;
    });
    const getResolvedView = () => {
        // 1. Explicit query parameter ?view=...
        const paramView = searchParams.get('view');
        if (paramView) {
            const role = user?.role?.toLowerCase() || 'visitor';
            // Role-specific override for Manager views
            if (role === 'manager' || role === 'department_manager') {
                if (paramView === 'visitors' || paramView === 'department_visitors' || paramView === 'manager_visitors' || paramView === 'visitor-directory') {
                    return 'manager_visitors';
                }
                if (paramView === 'requests' || paramView === 'visitor_requests' || paramView === 'department_requests' || paramView === 'manager_requests' || paramView === 'approvals') {
                    return 'manager_requests';
                }
                if (paramView === 'dashboard' || paramView === 'overview' || paramView === 'manager_dashboard') {
                    return 'manager_dashboard';
                }
            }

            if (paramView === 'visitor_portal_dashboard' || paramView === 'visitor-portal-dashboard') {
                return 'visitor_portal_dashboard';
            }
            if (paramView === 'enterprise_visitor_dashboard' || paramView === 'enterprise-visitor-dashboard' || paramView === 'visitor_management' || paramView === 'visitor-management' || paramView === 'visitor_admin') {
                return 'enterprise_visitor_dashboard';
            }
            if (paramView === 'visitor_dashboard' || paramView === 'visitor-dashboard') {
                return user?.role === 'visitor' ? 'visitor_portal_dashboard' : 'enterprise_visitor_dashboard';
            }
            if (paramView === 'visitor_profile' || paramView === 'visitor-profile' || paramView === 'VisitorProfile' || paramView === 'my_profile' || paramView === 'my-profile') {
                return 'visitor_profile';
            }
            if (paramView === 'profile') {
                return 'profile';
            }
            if (paramView === 'visitors' || paramView === 'visitor_profiles' || paramView === 'visitor-profiles' || paramView === 'visitor_profile_management' || paramView === 'visitor-profile-management' || paramView === 'visitor_profiles_management') {
                return 'visitor_profiles';
            }
            return paramView;
        }
        // 2. Explicit path segments matching Module 3 & department views
        const pathname = location.pathname.toLowerCase();
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
        // Module 3.5 Hierarchy Management path segments
        if (pathname.includes('/hierarchy-dashboard') || pathname.includes('/hierarchy_dashboard'))
            return 'hierarchy_dashboard';
        if (pathname.includes('/hierarchy-tree') || pathname.includes('/hierarchy_tree'))
            return 'hierarchy_tree';
        if (pathname.includes('/hierarchy-assignment') || pathname.includes('/hierarchy_assignment'))
            return 'hierarchy_assignment';
        if (pathname.includes('/hierarchy-details') || pathname.includes('/hierarchy_details'))
            return 'hierarchy_details';
        if (pathname.includes('/hierarchy-search') || pathname.includes('/hierarchy_search'))
            return 'hierarchy_search';
        if (pathname.includes('/hierarchy-validation') || pathname.includes('/hierarchy_validation'))
            return 'hierarchy_validation';
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
        if (pathname.includes('/visitor-categories') || pathname.includes('/visitor_categories') || pathname.includes('/visitor-category-management')) {
            return 'visitor_categories';
        }
        if (pathname.includes('/feedback-support') || pathname.includes('/support-feedback') || pathname.includes('/feedback') || pathname.includes('/support') || pathname.includes('/help-support')) {
            return 'FeedbackSupportCenter';
        }
        if (pathname.includes('/employee/dashboard'))
            return 'employee_dashboard';
        if (pathname.includes('/employee/profile') || pathname.includes('/employee-profile') || pathname.includes('/employee_profile'))
            return 'employee_profile';
        if (pathname.includes('/employee/requests') || pathname.includes('/employee/invitations'))
            return 'employee_requests';
        if (pathname.includes('/employee/appointments') || pathname.includes('/employee/appointment-management'))
            return 'employee_appointments';
        if (pathname.includes('/employee/calendar'))
            return 'employee_calendar';
        if (pathname.includes('/employee/visitors') || pathname.includes('/employee/visitor-history'))
            return 'employee_visitors';
        if (pathname.includes('/employee/meetings'))
            return 'employee_meetings';
        if (pathname.includes('/employee/notifications'))
            return 'employee_notifications';
        if (pathname.includes('/employee/reports'))
            return 'employee_reports';
        if (pathname.includes('/employee/help'))
            return 'employee_help';
        if (pathname.includes('/employee/settings'))
            return 'employee_settings';
        // Manager role routes
        if (pathname.startsWith('/manager') || pathname === '/manager') {
            if (pathname.includes('/manager/employees') || pathname.includes('/manager_employees'))
                return 'manager_employees';
            if (pathname.includes('/manager/availability') || pathname.includes('/manager_availability'))
                return 'manager_availability';
            if (pathname.includes('/manager/requests') || pathname.includes('/manager_requests') || pathname.includes('/manager/approvals'))
                return 'manager_requests';
            if (pathname.includes('/manager/appointments') || pathname.includes('/manager_appointments'))
                return 'manager_appointments';
            if (pathname.includes('/manager/visitors') || pathname.includes('/manager_visitors'))
                return 'manager_visitors';
            if (pathname.includes('/manager/rooms') || pathname.includes('/manager_rooms'))
                return 'manager_rooms';
            if (pathname.includes('/manager/policies') || pathname.includes('/manager_policies'))
                return 'manager_policies';
            if (pathname.includes('/manager/evacuation') || pathname.includes('/manager_evacuation'))
                return 'manager_evacuation';
            if (pathname.includes('/manager/security') || pathname.includes('/manager_security'))
                return 'manager_security';
            if (pathname.includes('/manager/reports') || pathname.includes('/manager_reports'))
                return 'manager_reports';
            if (pathname.includes('/manager/audit') || pathname.includes('/manager_audit'))
                return 'manager_audit';
            if (pathname.includes('/manager/profile') || pathname.includes('/manager_profile'))
                return 'manager_profile';
            return 'manager_dashboard';
        }
        if (pathname.includes('/visitor/profile')) {
            return 'visitor_profile';
        }
        if (pathname.endsWith('/profile')) {
            // Role-aware profile routing
            const role = user?.role?.toLowerCase() || 'visitor';
            if (role === 'visitor')
                return 'visitor_profile';
            if (role === 'employee' || role === 'staff')
                return 'employee_profile';
            return 'profile';
        }
        if (pathname.includes('/visitor-profiles') || pathname.includes('/visitor_profiles') || pathname.includes('/visitor-profile-management')) {
            return 'visitor_profiles';
        }
        if (pathname.includes('/visitor-management') || pathname.includes('/visitor_management') || pathname.includes('/visitor-admin')) {
            return 'enterprise_visitor_dashboard';
        }
        if (pathname === '/visitor/dashboard' || pathname === '/visitor_portal_dashboard') {
            return 'visitor_portal_dashboard';
        }
        if (pathname.includes('/visitor-dashboard') || pathname.includes('/visitor_dashboard')) {
            return user?.role === 'visitor' ? 'visitor_portal_dashboard' : 'enterprise_visitor_dashboard';
        }
        // 3. User identity resource map
        if (pathToViewMap[location.pathname]) {
            const mappedComp = pathToViewMap[location.pathname];
            if (mappedComp === 'VisitorDashboard') {
                return 'visitor_portal_dashboard';
            }
            if (mappedComp === 'EnterpriseVisitorDashboard') {
                return 'enterprise_visitor_dashboard';
            }
            return mappedComp;
        }
        // 4. Fallback path segment extraction
        const rawPath = location.pathname.replace(/^\/(admin|employee|manager|reception|security|visitor)\//, '');
        if (rawPath && rawPath !== 'dashboard') {
            const normalizedPath = rawPath.replace(/-/g, '_');
            if (normalizedPath === 'visitor_management' || normalizedPath === 'enterprise_visitor_dashboard') {
                return 'enterprise_visitor_dashboard';
            }
            if (normalizedPath === 'visitor_portal_dashboard') {
                return 'visitor_portal_dashboard';
            }
            if (componentRegistry[rawPath])
                return rawPath;
            if (componentRegistry[normalizedPath])
                return normalizedPath;
            return normalizedPath;
        }
        return 'dashboard';
    };
    const currentView = getResolvedView();
    // Common shared lists
    const [departments, setDepartments] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [employees, setEmployees] = useState([]);
    // Load common data on mount
    useEffect(() => {
        departmentsApi.list().then((res) => {
            const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setDepartments(Array.isArray(list) ? list : []);
        }).catch(console.error);
        roomsApi.list().then((res) => {
            const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setRooms(Array.isArray(list) ? list : []);
        }).catch(console.error);
        api.get('/employees').then((res) => {
            const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setEmployees(Array.isArray(list) ? list : []);
        }).catch(console.error);
    }, []);
    // Render view dispatcher
    const renderMainContent = () => {
        const role = user?.role?.toLowerCase() || 'visitor';
        // Universal Feedback & Support Center for ALL Roles
        if (currentView === 'FeedbackSupportCenter' ||
            currentView === 'feedback-support' ||
            currentView === 'support-feedback' ||
            currentView === 'help-support' ||
            currentView === 'feedback_support' ||
            currentView === 'support_feedback' ||
            currentView === 'manager-feedback-support' ||
            currentView === 'emp-feedback-support' ||
            currentView === 'reception-feedback-support' ||
            currentView === 'security-feedback-support' ||
            currentView === 'visitor-feedback-hub' ||
            currentView === 'support-feedback-admin') {
            return <FeedbackSupportCenter />;
        }
        // Visitor portal views — allowed views for visitor role
        const visitorPortalViews = [
            'visitor_portal_dashboard', 'dashboard', 'visitor_pass', 'visitor-pass',
            'visitor_feedback', 'visitor-feedback', 'feedback',
            'visitor_support', 'visitor-support', 'support',
            'FeedbackSupportCenter', 'feedback-support', 'support-feedback', 'help-support', 'feedback_support', 'visitor-feedback-hub',
            'system_chat', 'system-chat',
            'visitor_profile', 'visitor-profile', 'profile',
            'visitor_documents', 'visitor-documents', 'my_documents', 'my-documents',
            'visit_history', 'visit-history',
            'my_appointments', 'my-appointments',
            'request_appointment', 'request-appointment',
            'notifications', 'visitor_notifications', 'visitor_communication_center',
            'visitor_messages', 'visitor-messages',
            'visitor_announcements', 'visitor-announcements',
            'visitor_master_flow',
            'identity_verification', 'identity-verification',
            'select_document', 'select-document',
            'capture_document', 'capture-document',
            'biometric_verification', 'biometric-verification',
            'verification_status', 'verification-status'
        ];
        // Strict role security: guard ALL non-visitor views against visitor role
        if (role === 'visitor') {
            if (!visitorPortalViews.includes(currentView)) {
                return <VisitorDashboard />;
            }
        }
        // Department Manager role views: always route to isolated Department Manager views
        if (role === 'manager' || role === 'department_manager' || role.includes('manager')) {
            switch (currentView) {
                case 'dashboard':
                case 'manager_dashboard':
                case 'department_manager_dashboard':
                    return <ManagerDashboard onNavigate={(v) => navigate(`/manager/dashboard?view=${v}`)}/>;
                case 'manager_requests':
                case 'manager-requests':
                case 'department_requests':
                case 'department-requests':
                case 'visitor_requests':
                case 'visitor-requests':
                case 'approval_workflow_management':
                case 'approvals':
                    return <DepartmentVisitorRequestsView />;
                case 'manager_employees':
                case 'department_employees':
                case 'department_team':
                case 'employee_management':
                case 'employees':
                    return <DepartmentEmployeesView />;
                case 'manager_availability':
                case 'host_availability':
                case 'availability':
                    return <HostAvailabilityView />;
                case 'manager_appointments':
                case 'department_appointments':
                case 'appointments':
                    return <DepartmentAppointmentsView />;
                case 'manager_visitors':
                case 'department_visitors':
                case 'visitors':
                    return <DepartmentVisitorsView />;
                case 'manager_rooms':
                case 'department_rooms':
                case 'meeting_rooms':
                    return <DepartmentRoomsView />;
                case 'manager_policies':
                case 'department_policies':
                case 'visitor_policies':
                    return <DepartmentPoliciesView />;
                case 'manager_evacuation':
                case 'department_evacuation':
                case 'emergency_evacuation':
                    return <DepartmentEvacuationView />;
                case 'manager_security':
                case 'department_security':
                case 'security_zones':
                    return <DepartmentSecurityZonesView />;
                case 'manager_reports':
                case 'department_reports':
                case 'visitor_reports':
                case 'reports':
                    return <DepartmentReportsView />;
                case 'manager_audit':
                case 'department_audit':
                case 'audit_logs':
                    return <DepartmentAuditLogsView />;
                case 'manager_profile':
                case 'profile':
                    return <DepartmentManagerProfileView />;
                case 'notifications':
                case 'messages':
                case 'announcements':
                    return <UnifiedNotificationCenter initialTab={currentView === 'notifications' ? 'dashboard' : currentView} onNavigate={(v) => navigate(`/manager/dashboard?view=${v}`)}/>;
                default:
                    return <ManagerDashboard onNavigate={(v) => navigate(`/manager/dashboard?view=${v}`)}/>;
            }
        }
        const RegistryComponent = componentRegistry[currentView];
        if (RegistryComponent && role !== 'visitor' && !visitorPortalViews.includes(currentView)) {
            return (<RegistryComponent departments={departments} setDepartments={setDepartments} rooms={rooms} employees={employees}/>);
        }
        switch (currentView) {
            // User Management
            case 'users':
                return role === 'admin' ? <UserManagement key={currentView} departments={departments} initialTab="users"/> : <AdminDashboard />;
            case 'user_employees':
            case 'user_staff':
                return role === 'admin' ? <UserManagement key={currentView} departments={departments} initialTab="users" defaultRoleFilter="employee"/> : <AdminDashboard />;
            case 'user_visitors':
                return role === 'admin' ? <UserManagement key={currentView} departments={departments} initialTab="users" defaultRoleFilter="visitor"/> : <AdminDashboard />;
            case 'user_managers':
                return role === 'admin' ? <UserManagement key={currentView} departments={departments} initialTab="users" defaultRoleFilter="manager"/> : <AdminDashboard />;
            case 'user_security':
            case 'user_security_officer':
                return role === 'admin' ? <UserManagement key={currentView} departments={departments} initialTab="users" defaultRoleFilter="security_officer"/> : <AdminDashboard />;
            case 'user_receptionists':
            case 'user_reception':
                return role === 'admin' ? <UserManagement key={currentView} departments={departments} initialTab="users" defaultRoleFilter="receptionist"/> : <AdminDashboard />;
            case 'user_details':
                return role === 'admin' ? <UserManagement key={currentView} departments={departments} initialTab="user_details"/> : <AdminDashboard />;
            case 'user_edit':
                return role === 'admin' ? <UserManagement key={currentView} departments={departments} initialTab="user_edit"/> : <AdminDashboard />;
            case 'account_security':
                return role === 'admin' ? <UserManagement departments={departments} initialTab="account_security"/> : <AdminDashboard />;
            case 'sessions_devices':
                return role === 'admin' ? <UserManagement departments={departments} initialTab="sessions_devices"/> : <AdminDashboard />;
            case 'login_history':
                return role === 'admin' ? <UserManagement departments={departments} initialTab="login_history"/> : <AdminDashboard />;
            case 'user_activity':
                return role === 'admin' ? <UserManagement departments={departments} initialTab="user_activity"/> : <AdminDashboard />;
            case 'user_dashboard':
                return role === 'admin' ? <UserManagement departments={departments} initialTab="dashboard"/> : <AdminDashboard />;
            case 'user_create':
                return role === 'admin' ? <UserManagement departments={departments} initialTab="create"/> : <AdminDashboard />;
            case 'user_invitations':
                return role === 'admin' ? <UserManagement departments={departments} initialTab="invitations"/> : <AdminDashboard />;
            case 'user_import_export':
            case 'user_import':
            case 'user_export':
                return role === 'admin' ? <UserManagement departments={departments} initialTab="import_export"/> : <AdminDashboard />;
            case 'role_dashboard':
                return role === 'admin' ? <RoleManagement initialSubView="dashboard"/> : <AdminDashboard />;
            case 'roles':
                return role === 'admin' ? <RoleManagement initialSubView="roles_list"/> : <AdminDashboard />;
            case 'hierarchy_graph':
            case 'role_hierarchy':
                return role === 'admin' ? <RoleManagement initialSubView="hierarchy_graph"/> : <AdminDashboard />;
            case 'role_conflicts':
                return role === 'admin' ? <RoleManagement initialSubView="conflicts"/> : <AdminDashboard />;
            case 'permissions':
            case 'permission_dashboard':
                return role === 'admin' ? <PermissionManagement initialSubView="dashboard"/> : <AdminDashboard />;
            case 'permissions_list':
                return role === 'admin' ? <PermissionManagement initialSubView="permissions_list"/> : <AdminDashboard />;
            case 'permission_matrix':
                return role === 'admin' ? <PermissionManagement initialSubView="matrix"/> : <AdminDashboard />;
            case 'permission_groups':
                return role === 'admin' ? <PermissionManagement initialSubView="groups"/> : <AdminDashboard />;
            case 'permission_create':
                return role === 'admin' ? <PermissionManagement initialSubView="create_permission"/> : <AdminDashboard />;
            case 'permission_import_export':
                return role === 'admin' ? <PermissionManagement initialSubView="import_export"/> : <AdminDashboard />;
            case 'permission_risk':
                return role === 'admin' ? <PermissionManagement initialSubView="risk_analysis"/> : <AdminDashboard />;
            case 'permission_simulator':
                return role === 'admin' ? <PermissionManagement initialSubView="simulator"/> : <AdminDashboard />;
            // Employee Role Portal
            case 'employee_portal':
            case 'employee_dashboard':
            case 'employee_requests':
            case 'employee_appointments':
            case 'employee_calendar':
            case 'employee_visitors':
            case 'employee_notifications':
            case 'employee_reports':
            case 'employee_help':
            case 'employee_settings':
                return role === 'visitor' ? <VisitorDashboard /> : <EmployeePortal />;
            // Staff & Employee Management (Admin Module)
            case 'employee_management':
            case 'employee-management':
            case 'employee_directory':
            case 'employees':
                return role === 'visitor' ? <VisitorDashboard /> : <EmployeeManagementHome />;
            case 'employee_profile':
            case 'employee-profile':
            case 'employee_profile_details':
                return role === 'visitor' ? <VisitorProfile /> : <EmployeeProfileView />;
            case 'staff':
                return role === 'admin' ? <UserManagement departments={departments}/> : <AdminDashboard />;
            // Organization Management Subviews
            case 'organizations':
            case 'organizations_list':
            case 'org_list':
            case 'org_home':
                return role === 'admin' ? <OrgList /> : <AdminDashboard />;
            case 'create_organization':
            case 'create-organization':
            case 'create_org':
            case 'create-org':
            case 'organization_wizard':
            case 'org_wizard':
                return role === 'admin' ? <CreateOrgWizard /> : <AdminDashboard />;
            case 'org_edit':
            case 'org_profile_edit':
            case 'edit_organization':
                return role === 'admin' ? (searchParams.get('orgId') ? <OrgProfileEdit /> : <CreateOrgWizard />) : <AdminDashboard />;
            case 'org_details':
            case 'organization_details':
            case 'org_view':
                return role === 'admin' ? <OrgDetails /> : <AdminDashboard />;
            case 'branches':
            case 'branch_management':
            case 'hierarchy_dashboard':
                return role === 'admin' ? <HierarchyDashboard /> : <AdminDashboard />;
            case 'departments':
            case 'departments_mgmt':
            case 'departments-mgmt':
            case 'department_settings':
                return role === 'admin' ? <DepartmentSettings departments={departments} setDepartments={setDepartments}/> : <AdminDashboard />;
            case 'org_tree':
            case 'organization_tree':
            case 'organization-tree':
            case 'hierarchy_tree':
                return role === 'admin' ? <OrgTreeView /> : <AdminDashboard />;
            case 'business_calendar':
            case 'business-calendar':
                return role === 'admin' ? <BusinessCalendar /> : <AdminDashboard />;
            case 'org_settings':
            case 'branding_settings':
                return role === 'admin' ? <OrgSettings /> : <AdminDashboard />;
            case 'availability':
                return <MeetingRoomsView />;
            // Visitor Management
            case 'visitors':
            case 'visitor_profiles':
            case 'visitor-profiles':
            case 'visitor_profile_management':
            case 'visitor-profile-management':
            case 'visitor_profiles_management':
                if (role === 'security_officer' || role === 'security')
                    return <BlacklistWatchlistVerification />;
                if (role === 'manager' || role === 'department_manager')
                    return <DepartmentVisitorsView />;
                if (role === 'visitor')
                    return <VisitorDashboard />;
                return <VisitorProfilesManagement />;
            case 'visitor_documents':
            case 'visitor-documents':
            case 'my_documents':
            case 'my-documents':
                return <VisitorDocuments />;
            case 'visitor_documents_management':
            case 'visitor-documents-management':
                return <VisitorDocumentManagement />;
            case 'visitor_categories':
            case 'visitor_category_management':
            case 'visitor-categories':
            case 'visitor-category-management':
                return role === 'visitor' ? <VisitorDashboard /> : <VisitorCategoryManagement />;
            case 'visitor_category_details':
            case 'visitor-category-details':
                return role === 'visitor' ? <VisitorDashboard /> : <CategoryDetails />;
            case 'visitor_portal_dashboard':
                return role === 'visitor' ? <VisitorDashboard /> : <EnterpriseVisitorDashboard />;
            case 'enterprise_visitor_dashboard':
            case 'visitor_management':
                return role === 'visitor' ? <VisitorDashboard /> : <EnterpriseVisitorDashboard />;
            case 'visitor_dashboard':
                return role === 'visitor' ? <VisitorDashboard /> : <EnterpriseVisitorDashboard />;
            case 'visitor_registration':
            case 'register_visitor':
            case 'registration':
                return role === 'visitor' ? <VisitorDashboard /> : <VisitorRegistrationPage departments={departments} employees={employees}/>;
            // Appointment Management
            case 'requests':
                return role === 'visitor' ? <VisitorDashboard /> : <WalkInVisitors />;
            case 'meeting_rooms':
                return <MeetingRoomsView />;
            // Reception Management & Workspace
            case 'reception_management':
            case 'reception_workspace':
            case 'reception_portal':
                return <ReceptionDashboard />;
            case 'reception_dashboard':
                return <ReceptionDashboard />;
            case 'visitor_arrivals':
            case 'reception_arrivals':
                return (
                    <VisitorArrivalManagement
                        onNavigate={(v, extra) => {
                            const target = (v === 'passes' || v === 'visitor_pass_issuance') ? 'visitor_pass_issuance' : v;
                            const query = extra?.appointment_number || extra?.visitor_code || extra?.visitor_name || extra?.id || '';
                            navigate(`/dashboard?view=${target}${query ? `&search=${encodeURIComponent(query)}` : ''}`);
                        }}
                    />
                );
            case 'appointment_verification':
                return <AppointmentVerification />;
            case 'walkin_management':
            case 'walkin_registration':
                return <WalkInVisitorManagement />;
            case 'visitor_queue':
            case 'reception_queue':
                return <VisitorQueueManagement />;
            case 'reception_passes':
            case 'visitor_pass_issuance':
                return <VisitorPassIssuance />;
            case 'host_notifications':
            case 'host_alerts':
                return <HostNotificationView />;
            case 'waiting_area':
            case 'reception_waiting':
                return <WaitingAreaManagement />;
            case 'reception_directory':
            case 'reception_search':
                return <ReceptionSearchDirectory />;
            case 'reception_reports':
                return <ReceptionReportsView />;
            case 'reception_activity_log':
            case 'reception_logs':
                return <ReceptionActivityLogView />;
            case 'reception_profile':
                return <ReceptionistProfileSettings />;
            // Module 10 Check-In Operations
            case 'checkin':
                return role === 'visitor' ? <VisitorDashboard /> : <CheckIn />;
            case 'checkin_dashboard':
            case 'checkin-dashboard':
                return <CheckInDashboard />;
            case 'checkin_checkout_history':
            case 'checkin-checkout-history':
            case 'checkin_checkout':
            case 'checkin-checkout':
            case 'movement_history':
            case 'movement-history':
            case 'visitor_checkin_checkout_history':
                return <CheckInOutHistory initialTab="all" />;
            case 'checkin_history':
            case 'checkin-history':
                return <CheckInOutHistory initialTab="checkin" />;
            case 'checkin_analytics':
            case 'checkin-analytics':
                return <CheckInAnalytics />;
            case 'checkin_validation':
            case 'checkin-validation':
                return <CheckInValidation />;
            case 'group_checkin':
            case 'group-checkin':
                return <GroupCheckIn />;
            case 'vip_checkin':
            case 'vip-checkin':
                return <VIPCheckIn />;
            case 'contractor_checkin':
            case 'contractor-checkin':
                return <ContractorCheckIn />;
            case 'vehicle_checkin':
            case 'vehicle-checkin':
                return <VehicleCheckIn />;
            // Module 11 Check-Out Operations
            case 'checkout':
            case 'gate_checkout':
            case 'turnstile_checkout':
            case 'gate-checkout':
            case 'turnstile-checkout':
                return role === 'visitor' ? <VisitorDashboard /> : <CheckOut />;
            case 'checkout_dashboard':
            case 'checkout-dashboard':
                return <CheckOutDashboard />;
            case 'checkout_process':
            case 'checkout-process':
            case 'exit_processing':
                return <CheckOutExitProcessing />;
            case 'pending_checkouts':
            case 'pending-checkouts':
                return <PendingCheckOuts />;
            case 'overstay_management':
            case 'overstay-management':
                return <OverstayManagement />;
            case 'asset_return':
            case 'asset-return':
                return <AssetReturnVerification />;
            case 'group_checkout':
            case 'group-checkout':
                return <GroupCheckOut />;
            case 'evacuation_status':
            case 'evacuation-status':
                return <EmergencyEvacuationStatus />;
            case 'checkout_history':
            case 'checkout-history':
                return <CheckInOutHistory initialTab="checkout" />;
            case 'badge_management':
            case 'badge-management':
            case 'restricted_badges':
            case 'restricted-badges':
            case 'security_badges':
            case 'security-badges':
                return <BadgeManagement />;
            case 'visitor_verification':
            case 'visitor-verification':
                return <VisitorVerification />;
            // Security & Access Control
            case 'security':
            case 'security_dashboard':
                return role === 'visitor' ? <VisitorDashboard /> : <SecurityDashboard />;
            case 'security_incidents':
            case 'incidents':
            case 'incidents_log':
            case 'incident_management':
                return role === 'visitor' ? <VisitorDashboard /> : <IncidentManagement />;
            case 'system_health':
            case 'system-health':
            case 'system_health_monitoring':
                return role === 'admin' ? <HealthPerformanceAndDeploymentCenter /> : <AdminDashboard />;
            case 'verification':
            case 'pass_verification':
            case 'qr_scanner':
            case 'security_scanner':
                return role === 'visitor' ? <VisitorDashboard /> : <QRScanner />;
            case 'access_control':
                return role === 'visitor' ? <VisitorDashboard /> : <AccessControl />;
            case 'access_rules':
            case 'access-rules':
                return role === 'visitor' ? <VisitorDashboard /> : <AccessControlRules />;
            case 'blacklist_watchlist':
            case 'blacklist':
            case 'watchlist':
            case 'risk_watchlist':
            case 'blacklist_monitor':
                return role === 'visitor' ? <VisitorDashboard /> : <BlacklistWatchlistVerification />;
            case 'security_logs':
            case 'access_logs':
            case 'access-logs':
            case 'visitor_movement':
                return role === 'visitor' ? <VisitorDashboard /> : <VisitorMovement />;
            case 'visitor_screening':
            case 'screening':
                return role === 'visitor' ? <VisitorDashboard /> : <VisitorScreening />;
            case 'live_visitor_tracking':
            case 'live-tracking':
            case 'occupants_list':
                return role === 'visitor' ? <VisitorDashboard /> : <LiveVisitorTracking />;
            case 'security_escorts':
            case 'escorts':
            case 'escort_management':
            case 'escort-management':
                return role === 'visitor' ? <VisitorDashboard /> : <EscortManagement />;
            case 'security_reports':
            case 'security-reports':
            case 'security_incident_reports':
            case 'security_analytics':
                return role === 'visitor' ? <VisitorDashboard /> : <SecurityReportsView />;
            case 'security_profile':
            case 'security-profile':
            case 'security_officer_profile':
            case 'security-officer-profile':
                return <SecurityOfficerProfileView />;
            // Admin Notification Management (Module 13)
            case 'admin_notification_management':
            case 'notification_admin':
            case 'notification_management_home':
            case 'notification_templates':
            case 'notification_rules':
            case 'notification_queues':
            case 'notification_analytics':
                return role === 'admin' ? <NotificationAdminHome /> : <AdminDashboard />;
            case 'manual_notification_dashboard':
            case 'manual_notifications':
                return role === 'admin' ? <ManualNotificationDashboard /> : <AdminDashboard />;
            case 'notification_composer':
                return role === 'admin' ? <EnterpriseNotificationComposer /> : <AdminDashboard />;
            case 'notification_scheduling':
                return role === 'admin' ? <DraftAndSchedulingManager /> : <AdminDashboard />;
            case 'notification_broadcasts':
                return role === 'admin' ? <BroadcastAndAnnouncementCenter /> : <AdminDashboard />;
            case 'notification_delivery_tracking':
                return role === 'admin' ? <DeliveryTrackingAndMonitoring /> : <AdminDashboard />;
            case 'manual_notification_analytics':
                return role === 'admin' ? <ManualNotificationAnalyticsAndReports /> : <AdminDashboard />;
            case 'manual_notification_security':
                return role === 'admin' ? <ManualNotificationSecurityAndAudit /> : <AdminDashboard />;
            case 'rule_engine_dashboard':
                return role === 'admin' ? <RuleEngineDashboard /> : <AdminDashboard />;
            case 'rule_management':
                return role === 'admin' ? <RuleManagementCenter /> : <AdminDashboard />;
            case 'rule_builder':
                return role === 'admin' ? <VisualRuleAndWorkflowBuilder /> : <AdminDashboard />;
            case 'rule_recipients_channels':
                return role === 'admin' ? <RecipientAndChannelRules /> : <AdminDashboard />;
            case 'rule_scheduling_time':
                return role === 'admin' ? <SchedulingAndTimeRules /> : <AdminDashboard />;
            case 'rule_escalation_retry':
                return role === 'admin' ? <EscalationReminderAndRetry /> : <AdminDashboard />;
            case 'rule_approval_org':
                return role === 'admin' ? <ApprovalAndOrgRules /> : <AdminDashboard />;
            case 'rule_roles_groups':
                return role === 'admin' ? <RoleAndUserGroupRules /> : <AdminDashboard />;
            case 'rule_visitor_employee_appt':
                return role === 'admin' ? <VisitorEmployeeAppointmentRules /> : <AdminDashboard />;
            case 'rule_reception_security_pass':
                return role === 'admin' ? <ReceptionSecurityPassRules /> : <AdminDashboard />;
            case 'rule_checkin_emergency_system':
                return role === 'admin' ? <CheckinCheckoutEmergencySystemRules /> : <AdminDashboard />;
            case 'rule_testing_simulation':
                return role === 'admin' ? <RuleTestingAndSimulationCenter /> : <AdminDashboard />;
            case 'rule_version_import':
                return role === 'admin' ? <RuleVersionAndImportExport /> : <AdminDashboard />;
            case 'rule_analytics_perf':
                return role === 'admin' ? <RuleAnalyticsAndPerformance /> : <AdminDashboard />;
            case 'rule_dependency_templates':
                return role === 'admin' ? <RuleDependencyConflictTemplates /> : <AdminDashboard />;
            case 'rule_production_integration':
                return role === 'admin' ? <ProductionAndIntegrationCenter /> : <AdminDashboard />;
            case 'production_realtime_center':
                return role === 'admin' ? <RealtimeNotificationCenter /> : <AdminDashboard />;
            case 'production_queue_dashboard':
                return role === 'admin' ? <QueueManagementDashboard /> : <AdminDashboard />;
            case 'production_analytics_export':
                return role === 'admin' ? <AnalyticsAndExportCenter /> : <AdminDashboard />;
            case 'production_health_deployment':
                return role === 'admin' ? <HealthPerformanceAndDeploymentCenter /> : <AdminDashboard />;
            // Admin Notification Management — sidebar-driven, per-tab routing
            case 'admin_messages':
            case 'visitor_messages':
            case 'employee_messages':
            case 'emp-messages':
            case 'messages':
                return <UnifiedNotificationCenter initialTab="messages" onNavigate={(v) => navigate(`/dashboard?view=${v}`)}/>;
            case 'admin_system_chat':
            case 'system_chat':
            case 'system-chat':
                return <UnifiedNotificationCenter initialTab="system_chat" onNavigate={(v) => navigate(`/dashboard?view=${v}`)}/>;
            case 'admin_announcements':
            case 'visitor_announcements':
            case 'employee_announcements':
            case 'announcements':
                return <UnifiedNotificationCenter initialTab="announcements" onNavigate={(v) => navigate(`/dashboard?view=${v}`)}/>;
            case 'admin_notification_center':
            case 'enterprise_notification_center':
            case 'notification_admin_center':
            case 'notification_operations_center':
            case 'admin_notifications':
            case 'enterprise_notification_platform':
            case 'notification_platform':
                return <UnifiedNotificationCenter initialTab="notification_center" onNavigate={(v) => navigate(`/dashboard?view=${v}`)}/>;
            case 'admin_notification_settings':
            case 'notification_settings':
            case 'notification-settings':
                return <UnifiedNotificationCenter initialTab="settings" onNavigate={(v) => navigate(`/dashboard?view=${v}`)}/>;
            case 'manager_notification_center':
            case 'reception_notification_center':
            case 'reception_notifications':
            case 'security_notification_center':
            case 'emp-notifications':
                return <UnifiedNotificationCenter initialTab="notification_center" onNavigate={(v) => navigate(`/dashboard?view=${v}`)}/>;
            // Reports & Analytics & Security Telemetry
            case 'security_audit_logs':
            case 'security-audit-logs':
            case 'security_audit':
            case 'audit_trail':
                return <SecurityAuditLogsView />;
            case 'reports':
            case 'reporting':
            case 'reports_dashboard':
            case 'reporting_dashboard':
                return <ReportingDashboard onNavigate={(v) => navigate(`/dashboard?view=${v}`)} />;
            case 'operational_reports':
            case 'operational-reports':
            case 'reports_catalog':
                return <OperationalReports />;
            case 'visitor_reports':
                return role === 'visitor' ? <VisitorDashboard /> : <VisitorReportsView />;
            case 'appointment_reports':
                return role === 'visitor' ? <VisitorDashboard /> : <AppointmentReportsView />;
            case 'audit_logs':
            case 'audit-logs':
            case 'audit':
            case 'system_audit':
            case 'auditor_dashboard':
                return role === 'visitor' ? <VisitorDashboard /> : (role === 'security_officer' ? <SecurityAuditLogsView /> : <AuditorDashboard onNavigate={(v) => navigate(`/dashboard?view=${v}`)} />);
            // System Settings
            case 'settings':
            case 'system_settings':
            case 'system-settings':
            case 'admin_settings':
            case 'admin-settings':
            case 'settings_general':
            case 'settings_visitor':
            case 'settings_notifications':
            case 'settings_localization':
            case 'settings_maintenance':
                return role === 'visitor' ? <VisitorAdminSettings /> : <SystemSettings />;
            case 'profile':
                {
                    if (role === 'visitor')
                        return <VisitorProfile />;
                    if (role === 'receptionist')
                        return <ReceptionistProfileSettings />;
                    if (role === 'manager' || role === 'department_manager')
                        return <DepartmentManagerProfileView />;
                    if (role === 'security_officer' || role === 'security')
                        return <SecurityOfficerProfileView />;
                    return <EmployeeProfileView />;
                }
            case 'visitor_profile':
            case 'visitor-profile':
                return <VisitorProfile />;
            case 'passes':
                return role === 'receptionist' ? <VisitorPassIssuance /> : <VisitorPass />;
            case 'change_password':
                return <ChangePasswordView />;
            // Visitor Specific Views — always render visitor components
            case 'visitor_pass':
            case 'visitor-pass':
                return <VisitorPass />;
            case 'visitor_feedback':
            case 'visitor-feedback':
                return <VisitorFeedback />;
            case 'visitor_support':
            case 'visitor-support':
                return <VisitorSupport />;
            case 'visitor_settings':
                return role === 'visitor' ? <VisitorAdminSettings /> : <SystemSettings />;
            case 'my_appointments':
            case 'my-appointments':
                return <VisitorAppointments departments={departments} employees={employees} rooms={rooms}/>;
            case 'appointments':
                return role === 'visitor' ? <VisitorAppointments departments={departments} employees={employees} rooms={rooms}/> : <WalkInVisitors />;
            case 'request_appointment':
            case 'request-appointment':
                return (<div className="pt-4 pb-12 px-2">
            <NewAppointmentForm onSubmit={(data) => {
                        setSearchParams({ view: 'my_appointments' });
                    }} onCancel={() => setSearchParams({ view: 'my_appointments' })}/>
          </div>);
            case 'visit_history':
            case 'visit-history':
                return <VisitHistory />;
            case 'feedback':
                return <VisitorFeedback />;
            case 'support':
                return <VisitorSupport />;
            case 'notifications':
            case 'security_notifications':
            case 'visitor_notifications':
            case 'visitor_communication_center':
                return <UnifiedNotificationCenter initialTab="notification_center" onNavigate={(v) => navigate(`/dashboard?view=${v}`)}/>;
            case 'soc_console':
            case 'security_operations_center':
                return <SecurityNotificationCenter />;
            // Legacy/Fallback mappings
            case 'today_visitors':
                return role === 'visitor' ? <VisitorDashboard /> : <WalkInVisitors />;
            case 'home':
                return role === 'visitor' ? <VisitorDashboard /> : <EnterpriseVisitorDashboard />;
            case 'help':
                return role === 'visitor' ? <VisitorHelpDesk /> : <EmployeePortal />;
            // Department Manager Role Views
            case 'manager_dashboard':
            case 'department_manager_dashboard':
                return <ManagerDashboard onNavigate={(v) => navigate(`/dashboard?view=${v}`)}/>;
            case 'manager_employees':
            case 'department_employees':
                return <DepartmentEmployeesView />;
            case 'manager_availability':
            case 'host_availability':
                return <HostAvailabilityView />;
            case 'manager_requests':
            case 'manager-requests':
            case 'department_requests':
            case 'department-requests':
            case 'visitor_requests':
            case 'visitor-requests':
            case 'approvals':
                return role === 'visitor' ? <VisitorDashboard /> : <DepartmentVisitorRequestsView />;
            case 'manager_appointments':
            case 'department_appointments':
            case 'manager_meetings':
            case 'department_meetings':
            case 'manager_meeting_management':
                return <DepartmentAppointmentsView />;
            case 'manager_visitors':
            case 'department_visitors':
                return <DepartmentVisitorsView />;
            case 'manager_reports':
            case 'department_reports':
                return <DepartmentReportsView />;
            case 'manager_audit':
            case 'department_audit':
                return <DepartmentAuditLogsView />;
            case 'manager_profile':
            case 'department_manager_profile':
                return <DepartmentManagerProfileView />;
            // Identity Verification Module
            case 'identity_verification':
            case 'identity-verification':
                return <IdentityVerificationOverviewPage />;
            case 'select_document':
            case 'select-document':
                return <DocumentSelectionPage />;
            case 'capture_document':
            case 'capture-document':
                return <DocumentCapturePage />;
            case 'biometric_verification':
            case 'biometric-verification':
                return <BiometricVerificationPage />;
            case 'verification_status':
            case 'verification-status':
                return <VerificationStatusPage />;
            case 'identity_reviews':
            case 'identity-reviews':
            case 'security_identity_reviews':
                return <ReviewerQueuePage />;
            case 'identity_policy':
            case 'identity-policy':
                return <VerificationPolicySettingsPage />;
            // Main Fallbacks
            case 'dashboard':
            default:
                if (role === 'visitor')
                    return <VisitorDashboard />;
                if (role === 'staff' || role === 'employee')
                    return <EmployeeDashboard />;
                if (role === 'manager' || role === 'department_manager' || role.includes('manager'))
                    return <ManagerDashboard onNavigate={(v) => navigate(`/manager/dashboard?view=${v}`)}/>;
                if (role === 'receptionist')
                    return <ReceptionDashboard />;
                if (role === 'security_officer' || role === 'security')
                    return <SecurityDashboard />;
                return <AdminDashboard />;
        }
    };
    return (<DashboardLayout currentView={currentView}>
      <div className="w-full">
        <ViewErrorBoundary viewKey={currentView}>
          {renderMainContent()}
        </ViewErrorBoundary>
      </div>
    </DashboardLayout>);
}
function VisitorHelpDesk() {
    return (<div className="max-w-xl bg-[#0b101b] border border-slate-800 rounded-xl p-6">
      <h3 className="font-bold text-xs uppercase tracking-widest text-slate-300 mb-4 border-b border-slate-900 pb-2">
        Visitor Support & Help Center
      </h3>
      <div className="space-y-4 text-xs font-mono text-slate-400">
        <div>
          <h4 className="font-bold text-white uppercase mb-1">Q: How do I access the facility?</h4>
          <p>A: Once your host approves the appointment, you'll receive a digital pass with a QR code. Present it at the gate scanning terminal.</p>
        </div>
        <div>
          <h4 className="font-bold text-white uppercase mb-1">Q: What if I need to reschedule?</h4>
          <p>A: Please contact your host directly to adjust scheduled arrival times.</p>
        </div>
        <div>
          <h4 className="font-bold text-white uppercase mb-1">Support Contact</h4>
          <p>Help Desk Hotlines: +251 11 123 4567 (Ext. 9)</p>
          <p>Email Help: info@enterprisevms.com</p>
        </div>
      </div>
    </div>);
}
// Inline fallback for non-visitor notification view
function VisitorNotificationsInline() {
    return (<div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 shadow-2xl">
      <div className="py-8 text-center text-slate-650 text-xs font-semibold uppercase tracking-widest">No alerts.</div>
    </div>);
}
