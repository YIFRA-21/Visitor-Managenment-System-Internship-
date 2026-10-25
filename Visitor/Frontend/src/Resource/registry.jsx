import UnifiedNotificationCenter from '../modules/notifications/components/UnifiedNotificationCenter';
// Admin
import AdminDashboard from './Admin/AdminDashboard';
import UserManagement from './Admin/UserManagement';
import RoleManagement from './Admin/RoleManagement';
import PermissionManagement from './Admin/PermissionManagement';
import OrganizationSettings from './Admin/OrganizationSettings';
import DepartmentSettings from './Admin/DepartmentSettings';
import AuditLogs from './Admin/AuditLogs';
import SystemSettings from './Admin/SystemSettings';
// Admin Visitor Management (Module)
import VisitorManagementHome from './Admin/VisitorManagement/Home/VisitorManagementHome';
import VisitorList from './Admin/VisitorManagement/List/VisitorList';
import VisitorApprovals from './Admin/VisitorManagement/Approvals/VisitorApprovals';
import VisitorPolicySettings from './Admin/VisitorManagement/Policy/VisitorPolicySettings';
import VisitorWatchlist from './Admin/VisitorManagement/Watchlist/VisitorWatchlist';
import VisitorActivityLogs from './Admin/VisitorManagement/Logs/VisitorActivityLogs';
import VisitorAnalytics from './Admin/VisitorManagement/Analytics/VisitorAnalytics';
import VisitorAdminSettings from './Admin/VisitorManagement/Settings/VisitorSettings';
import VisitorProfilesManagement from './Admin/VisitorManagement/Profiles/VisitorProfilesManagement';
import VisitorDocumentManagement from './Admin/VisitorManagement/Documents/VisitorDocumentManagement';
import VisitorCategoryManagement from './Admin/VisitorManagement/Categories/VisitorCategoryManagement';
import CategoryDetails from './Admin/VisitorManagement/Categories/CategoryDetails';
import VisitorHistoryManagement from './Admin/VisitorManagement/History/VisitorHistoryManagement';
import VisitorHistoryDetails from './Admin/VisitorManagement/History/VisitorHistoryDetails';
import WorkflowManagementHome from './Admin/ApprovalWorkflow/WorkflowManagementHome';
import EmployeeManagementHome from './Admin/EmployeeManagement/EmployeeManagementHome';
import EmployeeProfilePage from './Admin/EmployeeManagement/EmployeeProfilePage';
import NotificationAdminHome from './Admin/NotificationManagement/NotificationAdminHome';
import ManualNotificationDashboard from './Admin/NotificationManagement/Manual/ManualNotificationDashboard';
import EnterpriseNotificationComposer from './Admin/NotificationManagement/Manual/EnterpriseNotificationComposer';
import DraftAndSchedulingManager from './Admin/NotificationManagement/Manual/DraftAndSchedulingManager';
import BroadcastAndAnnouncementCenter from './Admin/NotificationManagement/Manual/BroadcastAndAnnouncementCenter';
import DeliveryTrackingAndMonitoring from './Admin/NotificationManagement/Manual/DeliveryTrackingAndMonitoring';
import ManualNotificationAnalyticsAndReports from './Admin/NotificationManagement/Manual/ManualNotificationAnalyticsAndReports';
import ManualNotificationSecurityAndAudit from './Admin/NotificationManagement/Manual/ManualNotificationSecurityAndAudit';
import RuleEngineDashboard from './Admin/NotificationManagement/RuleEngine/RuleEngineDashboard';
import RuleManagementCenter from './Admin/NotificationManagement/RuleEngine/RuleManagementCenter';
import VisualRuleAndWorkflowBuilder from './Admin/NotificationManagement/RuleEngine/VisualRuleAndWorkflowBuilder';
import RecipientAndChannelRules from './Admin/NotificationManagement/RuleEngine/RecipientAndChannelRules';
import SchedulingAndTimeRules from './Admin/NotificationManagement/RuleEngine/SchedulingAndTimeRules';
import EscalationReminderAndRetry from './Admin/NotificationManagement/RuleEngine/EscalationReminderAndRetry';
import ApprovalAndOrgRules from './Admin/NotificationManagement/RuleEngine/ApprovalAndOrgRules';
import RoleAndUserGroupRules from './Admin/NotificationManagement/RuleEngine/RoleAndUserGroupRules';
import VisitorEmployeeAppointmentRules from './Admin/NotificationManagement/RuleEngine/VisitorEmployeeAppointmentRules';
import ReceptionSecurityPassRules from './Admin/NotificationManagement/RuleEngine/ReceptionSecurityPassRules';
import CheckinCheckoutEmergencySystemRules from './Admin/NotificationManagement/RuleEngine/CheckinCheckoutEmergencySystemRules';
import RuleTestingAndSimulationCenter from './Admin/NotificationManagement/RuleEngine/RuleTestingAndSimulationCenter';
import RuleVersionAndImportExport from './Admin/NotificationManagement/RuleEngine/RuleVersionAndImportExport';
import RuleAnalyticsAndPerformance from './Admin/NotificationManagement/RuleEngine/RuleAnalyticsAndPerformance';
import RuleDependencyConflictTemplates from './Admin/NotificationManagement/RuleEngine/RuleDependencyConflictTemplates';
import ProductionAndIntegrationCenter from './Admin/NotificationManagement/RuleEngine/ProductionAndIntegrationCenter';
import RealtimeNotificationCenter from './Admin/NotificationManagement/Production/RealtimeNotificationCenter';
import QueueManagementDashboard from './Admin/NotificationManagement/Production/QueueManagementDashboard';
import AnalyticsAndExportCenter from './Admin/NotificationManagement/Production/AnalyticsAndExportCenter';
import HealthPerformanceAndDeploymentCenter from './Admin/NotificationManagement/Production/HealthPerformanceAndDeploymentCenter';
import ReceptionNotificationCenter from './Reception/NotificationManagement/ReceptionNotificationCenter';
import EnterpriseNotificationPlatformCenter from './Platform/NotificationPlatform/EnterpriseNotificationPlatformCenter';
// Module 17 — System Administration
import SystemAdminDashboard from './Admin/SystemAdmin/SystemAdminDashboard';
import SystemConfiguration from './Admin/SystemAdmin/SystemConfiguration';
import SecurityAdministration from './Admin/SystemAdmin/SecurityAdministration';
import BrandingAdministration from './Admin/SystemAdmin/BrandingAdministration';
import BusinessRulesEngine from './Admin/SystemAdmin/BusinessRulesEngine';
import BackupRecovery from './Admin/SystemAdmin/BackupRecovery';
import PerformanceMonitoring from './Admin/SystemAdmin/PerformanceMonitoring';
import IntegrationManagement from './Admin/SystemAdmin/IntegrationManagement';
import SchedulerJobsAdmin from './Admin/SystemAdmin/SchedulerJobsAdmin';
import MaintenanceMode from './Admin/SystemAdmin/MaintenanceMode';
import FeatureFlags from './Admin/SystemAdmin/FeatureFlags';
import DataRetentionArchiving from './Admin/SystemAdmin/DataRetentionArchiving';
import CalendarHolidayAdmin from './Admin/SystemAdmin/CalendarHolidayAdmin';
import VisitorPolicyAdmin from './Admin/SystemAdmin/VisitorPolicyAdmin';
import LocalizationLanguage from './Admin/SystemAdmin/LocalizationLanguage';
import LicenseEnvironment from './Admin/SystemAdmin/LicenseEnvironment';
import AuditComplianceAdmin from './Admin/SystemAdmin/AuditComplianceAdmin';
import HelpDocsDiagnostics from './Admin/SystemAdmin/HelpDocsDiagnostics';
import NotificationSettingsAdmin from './Admin/SystemAdmin/NotificationSettingsAdmin';
// Organization Management (Module 3)
import OrganizationManagementHome from './Admin/Organization/Home/OrganizationManagementHome';
import OrgDashboard from './Admin/Organization/Dashboard/OrgDashboard';
import OrgList from './Admin/Organization/List/OrgList';
import CreateOrgWizard from './Admin/Organization/Wizard/CreateOrgWizard';
import OrgDetails from './Admin/Organization/Details/OrgDetails';
import BranchList from './Admin/Organization/Branch/BranchList';
import DepartmentList from './Admin/Organization/Department/DepartmentList';
import OrgTreeView from './Admin/Organization/Tree/OrgTreeView';
import BusinessCalendar from './Admin/Organization/Calendar/BusinessCalendar';
import OrgSettings from './Admin/Organization/Settings/OrgSettings';
// Organization Profile Management (Module 3.2 Additions)
import OrgProfileEdit from './Admin/Organization/Profile/OrgProfileEdit';
import OrgStatusManagement from './Admin/Organization/Profile/OrgStatusManagement';
import OrgSearch from './Admin/Organization/Profile/OrgSearch';
// Branch Management (Module 3.3)
import CreateBranchWizard from './Admin/Organization/Branch/CreateBranchWizard';
import BranchDetails from './Admin/Organization/Branch/BranchDetails';
import BranchEdit from './Admin/Organization/Branch/BranchEdit';
import BranchStatusManagement from './Admin/Organization/Branch/BranchStatusManagement';
import BranchSearch from './Admin/Organization/Branch/BranchSearch';
import BranchStatistics from './Admin/Organization/Branch/BranchStatistics';
// Department Management (Module 3.4)
import CreateDepartmentWizard from './Admin/Organization/Department/CreateDepartmentWizard';
import DepartmentDetails from './Admin/Organization/Department/DepartmentDetails';
import DepartmentEdit from './Admin/Organization/Department/DepartmentEdit';
import DepartmentStatusManagement from './Admin/Organization/Department/DepartmentStatusManagement';
import DepartmentSearch from './Admin/Organization/Department/DepartmentSearch';
import DepartmentStatistics from './Admin/Organization/Department/DepartmentStatistics';
import DepartmentHierarchy from './Admin/Organization/Department/DepartmentHierarchy';
// Organization Hierarchy Management (Module 3.5)
import HierarchyDashboard from './Admin/Organization/Hierarchy/HierarchyDashboard';
import OrganizationTree from './Admin/Organization/Hierarchy/OrganizationTree';
import HierarchyAssignment from './Admin/Organization/Hierarchy/HierarchyAssignment';
import HierarchyDetails from './Admin/Organization/Hierarchy/HierarchyDetails';
import HierarchySearch from './Admin/Organization/Hierarchy/HierarchySearch';
import HierarchyValidation from './Admin/Organization/Hierarchy/HierarchyValidation';
// Module 3.6 & Enterprise Physical Location & Workplace Infrastructure
import BuildingManagement from './Admin/Organization/Building/BuildingManagement';
import FloorManagement from './Admin/Organization/Floor/FloorManagement';
import RoomManagement from './Admin/Organization/Room/RoomManagement';
import WorkplaceManagement from './Admin/Organization/Workplace/WorkplaceManagement';
import HierarchyStatistics from './Admin/Organization/Hierarchy/HierarchyStatistics';
// Visitor
import VisitorDashboard from './Visitor/VisitorDashboard';
import EnterpriseVisitorDashboard from './Admin/VisitorManagement/EnterpriseVisitorDashboard';
import VisitorDashboardDispatcher from './Visitor/VisitorDashboardDispatcher';
import VisitorRegistrationPage from './Visitor/VisitorRegistrationPage';
import VisitorProfile from './Visitor/VisitorProfile';
import VisitorAppointments from './Visitor/VisitorAppointments';
import VisitorDocuments from './Visitor/VisitorDocuments';
import VisitorNotifications from './Visitor/VisitorNotifications';
import VisitHistory from './Visitor/VisitHistory';
import VisitorPass from './Visitor/VisitorPass';
import VisitorFeedback from './Visitor/VisitorFeedback';
import VisitorSupport from './Visitor/VisitorSupport';
import VisitorMasterFlow from './Visitor/VisitorMasterFlow';
import SystemChat from './Visitor/components/SystemChat';
import FeedbackSupportCenter from './Common/FeedbackSupportCenter';
// Employee
import EmployeePortal from './Employee/EmployeePortal';
import EmployeeDashboard from './Employee/EmployeeDashboard';
import EmployeeProfileView from './Employee/EmployeeProfileView';
import EmployeeVisitorRequests from './Employee/EmployeeVisitorRequests';
import EmployeeAppointments from './Employee/EmployeeAppointments';
import Calendar from './Employee/Calendar';
import EmployeeVisitors from './Employee/EmployeeVisitors';
import EmployeeMeetingManagement from './Employee/EmployeeMeetingManagement';
import EmployeeNotifications from './Employee/EmployeeNotifications';
import EmployeeReports from './Employee/EmployeeReports';
import EmployeeHelpSupport from './Employee/EmployeeHelpSupport';
import EmployeeSettings from './Employee/EmployeeSettings';
import VisitorInvitation from './Employee/VisitorInvitation';
import AppointmentManagement from './Employee/AppointmentManagement';
import EmployeeVisitorHistory from './Employee/EmployeeVisitorHistory';
// Appointment Management (Module 5)
import AppointmentManagementHome from './Admin/Appointments/AppointmentManagementHome';
// Manager
import ManagerDashboard from './Manager/ManagerDashboard';
import Approvals from './Manager/Approvals';
import DepartmentVisitors from './Manager/DepartmentVisitors';
import DepartmentReports from './Manager/DepartmentReports';
import DepartmentManagerProfileView from './Manager/DepartmentManagerProfileView';
// Receptionist
import ReceptionDashboard from './Receptionist/ReceptionDashboard';
import ReceptionManagementHome from './Receptionist/ReceptionManagementHome';
import VisitorRegistration from './Receptionist/VisitorRegistration';
import VisitorVerification from './Receptionist/VisitorVerification';
import BadgeManagement from './Receptionist/BadgeManagement';
import CheckIn from './Receptionist/CheckIn';
import CheckOut from './Receptionist/CheckOut';
import WalkInVisitors from './Receptionist/WalkInVisitors';
import VisitorArrivalManagement from './Receptionist/VisitorArrivalManagement';
import AppointmentVerification from './Receptionist/AppointmentVerification';
import WalkInVisitorManagement from './Receptionist/WalkInVisitorManagement';
import VisitorQueueManagement from './Receptionist/VisitorQueueManagement';
import VisitorPassIssuance from './Receptionist/VisitorPassIssuance';
import HostNotificationView from './Receptionist/HostNotificationView';
import WaitingAreaManagement from './Receptionist/WaitingAreaManagement';
import ReceptionSearchDirectory from './Receptionist/ReceptionSearchDirectory';
import ReceptionReportsView from './Receptionist/ReceptionReportsView';
import ReceptionActivityLogView from './Receptionist/ReceptionActivityLogView';
import ReceptionistProfileSettings from './Receptionist/ReceptionistProfileSettings';
import CheckInDashboard from './Receptionist/CheckInDashboard';
import CheckInHistory from './Receptionist/CheckInHistory';
import CheckInAnalytics from './Receptionist/CheckInAnalytics';
import CheckInValidation from './Receptionist/CheckInValidation';
import GroupCheckIn from './Receptionist/GroupCheckIn';
import VIPCheckIn from './Receptionist/VIPCheckIn';
import ContractorCheckIn from './Receptionist/ContractorCheckIn';
import VehicleCheckIn from './Receptionist/VehicleCheckIn';
import CheckOutDashboard from './Receptionist/CheckOutDashboard';
import CheckOutExitProcessing from './Receptionist/CheckOutExitProcessing';
import PendingCheckOuts from './Receptionist/PendingCheckOuts';
import OverstayManagement from './Receptionist/OverstayManagement';
import AssetReturnVerification from './Receptionist/AssetReturnVerification';
import GroupCheckOut from './Receptionist/GroupCheckOut';
import EmergencyEvacuationStatus from './Receptionist/EmergencyEvacuationStatus';
import CheckOutHistory from './Receptionist/CheckOutHistory';
// Security
import SecurityDashboard from './Security/SecurityDashboard';
import QRScanner from './Security/QRScanner';
import AccessControl from './Security/AccessControl';
import IncidentManagement from './Security/IncidentManagement';
import VisitorMovement from './Security/VisitorMovement';
import VisitorScreening from './Security/VisitorScreening';
import RiskAndWatchlist from './Security/RiskAndWatchlist';
import AccessControlRules from './Security/AccessControlRules';
import LiveVisitorTracking from './Security/LiveVisitorTracking';
import EscortManagement from './Security/EscortManagement';
import SecurityReportsAnalytics from './Security/SecurityReportsAnalytics';
import SecurityOfficerProfileView from './Security/SecurityOfficerProfileView';
import SecurityReportsView from './Security/SecurityReportsView';
import SecurityAuditLogsView from './Security/SecurityAuditLogsView';
// Module 14: Enterprise Reporting & Analytics Management
import ReportingDashboard from './Reports/ReportingDashboard';
import OperationalReports from './Reports/OperationalReports';
import VisitorAnalyticsView from './Reports/VisitorAnalyticsView';
import CustomReportBuilder from './Reports/CustomReportBuilder';
import ScheduledReports from './Reports/ScheduledReports';
import ExportCenter from './Reports/ExportCenter';
// Module 15: Enterprise Dashboard Management
import UniversalDashboardDispatcher from './Dashboard/UniversalDashboardDispatcher';
import ExecutiveDashboard from './Dashboard/ExecutiveDashboard';
import AuditorDashboard from './Dashboard/AuditorDashboard';
import WidgetCustomizerModal from './Dashboard/WidgetCustomizerModal';
import GlobalSearchModal from './Dashboard/GlobalSearchModal';

// Real Identity Verification Module
import IdentityVerificationOverviewPage from '../modules/identity-verification/pages/IdentityVerificationOverviewPage';
import DocumentSelectionPage from '../modules/identity-verification/pages/DocumentSelectionPage';
import DocumentCapturePage from '../modules/identity-verification/pages/DocumentCapturePage';
import BiometricVerificationPage from '../modules/identity-verification/pages/BiometricVerificationPage';
import VerificationStatusPage from '../modules/identity-verification/pages/VerificationStatusPage';
import ReviewerQueuePage from '../modules/identity-verification/pages/ReviewerQueuePage';
import ReviewerCaseDetailPage from '../modules/identity-verification/pages/ReviewerCaseDetailPage';
import VerificationPolicySettingsPage from '../modules/identity-verification/pages/VerificationPolicySettingsPage';
import CheckInOutHistory from './Receptionist/CheckInOutHistory';

export const componentRegistry = {
    // Admin
    AdminDashboard,
    UserManagement,
    RoleManagement,
    PermissionManagement,
    OrganizationSettings,
    DepartmentSettings,
    AuditLogs,
    SystemSettings,
    // Admin Visitor Management
    VisitorManagementHome,
    WorkflowManagementHome,
    EmployeeManagementHome,
    employee_management: EmployeeManagementHome,
    'employee-management': EmployeeManagementHome,
    employee_directory: EmployeeManagementHome,
    'employee-directory': EmployeeManagementHome,
    EmployeeProfilePage,
    employee_profile: EmployeeProfilePage,
    'employee-profile': EmployeeProfilePage,
    employee_profile_details: EmployeeProfilePage,
    approval_workflow_management: WorkflowManagementHome,
    'approval-workflow-management': WorkflowManagementHome,
    approval_workflows: WorkflowManagementHome,
    'approval-workflows': WorkflowManagementHome,
    workflow_management: WorkflowManagementHome,
    'workflow-management': WorkflowManagementHome,
    VisitorList,
    VisitorApprovals,
    VisitorPolicySettings,
    VisitorWatchlist,
    VisitorActivityLogs,
    VisitorAnalytics,
    VisitorAdminSettings,
    VisitorProfilesManagement,
    VisitorNotifications,
    visitor_notifications: VisitorNotifications,
    'visitor-notifications': VisitorNotifications,
    visitor_communication_center: VisitorNotifications,
    'visitor-communication-center': VisitorNotifications,
    visitor_messages: VisitorNotifications,
    'visitor-messages': VisitorNotifications,
    visitor_announcements: VisitorNotifications,
    'visitor-announcements': VisitorNotifications,
    visitor_notification_preferences: VisitorNotifications,
    'visitor-notification-preferences': VisitorNotifications,
    // Admin Notification Engine Management (Module 13)
    NotificationAdminHome,
    admin_notification_management: NotificationAdminHome,
    'admin-notification-management': NotificationAdminHome,
    notification_admin: NotificationAdminHome,
    'notification-admin': NotificationAdminHome,
    notification_management_home: NotificationAdminHome,
    'notification-management-home': NotificationAdminHome,
    notification_rules: NotificationAdminHome,
    'notification-rules': NotificationAdminHome,
    notification_templates: NotificationAdminHome,
    'notification-templates': NotificationAdminHome,
    notification_queues: NotificationAdminHome,
    'notification-queues': NotificationAdminHome,
    notification_analytics: NotificationAdminHome,
    'notification-analytics': NotificationAdminHome,
    // Manual Notification Management (Module 13 Parts 4.1 - 4.3)
    ManualNotificationDashboard,
    manual_notification_dashboard: ManualNotificationDashboard,
    'manual-notification-dashboard': ManualNotificationDashboard,
    manual_notifications: ManualNotificationDashboard,
    'manual-notifications': ManualNotificationDashboard,
    // Parts 4.4 - 4.7
    EnterpriseNotificationComposer,
    notification_composer: EnterpriseNotificationComposer,
    'notification-composer': EnterpriseNotificationComposer,
    DraftAndSchedulingManager,
    notification_scheduling: DraftAndSchedulingManager,
    'notification-scheduling': DraftAndSchedulingManager,
    BroadcastAndAnnouncementCenter,
    notification_broadcasts: BroadcastAndAnnouncementCenter,
    'notification-broadcasts': BroadcastAndAnnouncementCenter,
    DeliveryTrackingAndMonitoring,
    notification_delivery_tracking: DeliveryTrackingAndMonitoring,
    'notification-delivery-tracking': DeliveryTrackingAndMonitoring,
    // Parts 4.8 & 4.9
    ManualNotificationAnalyticsAndReports,
    manual_notification_analytics: ManualNotificationAnalyticsAndReports,
    'manual-notification-analytics': ManualNotificationAnalyticsAndReports,
    ManualNotificationSecurityAndAudit,
    manual_notification_security: ManualNotificationSecurityAndAudit,
    'manual-notification-security': ManualNotificationSecurityAndAudit,
    // Part 5 (Sections 5.1 - 5.12)
    RuleEngineDashboard,
    rule_engine_dashboard: RuleEngineDashboard,
    'rule-engine-dashboard': RuleEngineDashboard,
    RuleManagementCenter,
    rule_management: RuleManagementCenter,
    'rule-management': RuleManagementCenter,
    VisualRuleAndWorkflowBuilder,
    rule_builder: VisualRuleAndWorkflowBuilder,
    'rule-builder': VisualRuleAndWorkflowBuilder,
    RecipientAndChannelRules,
    rule_recipients_channels: RecipientAndChannelRules,
    'rule-recipients-channels': RecipientAndChannelRules,
    // Part 5 (Sections 5.13 - 5.24)
    SchedulingAndTimeRules,
    rule_scheduling_time: SchedulingAndTimeRules,
    'rule-scheduling-time': SchedulingAndTimeRules,
    EscalationReminderAndRetry,
    rule_escalation_retry: EscalationReminderAndRetry,
    'rule-escalation-retry': EscalationReminderAndRetry,
    ApprovalAndOrgRules,
    rule_approval_org: ApprovalAndOrgRules,
    'rule-approval-org': ApprovalAndOrgRules,
    RoleAndUserGroupRules,
    rule_roles_groups: RoleAndUserGroupRules,
    'rule-roles-groups': RoleAndUserGroupRules,
    // Part 5 (Sections 5.25 - 5.36)
    VisitorEmployeeAppointmentRules,
    rule_visitor_employee_appt: VisitorEmployeeAppointmentRules,
    'rule-visitor-employee-appt': VisitorEmployeeAppointmentRules,
    ReceptionSecurityPassRules,
    rule_reception_security_pass: ReceptionSecurityPassRules,
    'rule-reception-security-pass': ReceptionSecurityPassRules,
    CheckinCheckoutEmergencySystemRules,
    rule_checkin_emergency_system: CheckinCheckoutEmergencySystemRules,
    'rule-checkin-emergency-system': CheckinCheckoutEmergencySystemRules,
    RuleTestingAndSimulationCenter,
    rule_testing_simulation: RuleTestingAndSimulationCenter,
    'rule-testing-simulation': RuleTestingAndSimulationCenter,
    // Part 5 (Sections 5.37 - 5.50)
    RuleVersionAndImportExport,
    rule_version_import: RuleVersionAndImportExport,
    'rule-version-import': RuleVersionAndImportExport,
    RuleAnalyticsAndPerformance,
    rule_analytics_perf: RuleAnalyticsAndPerformance,
    'rule-analytics-perf': RuleAnalyticsAndPerformance,
    RuleDependencyConflictTemplates,
    rule_dependency_templates: RuleDependencyConflictTemplates,
    'rule-dependency-templates': RuleDependencyConflictTemplates,
    ProductionAndIntegrationCenter,
    rule_production_integration: ProductionAndIntegrationCenter,
    'rule-production-integration': ProductionAndIntegrationCenter,
    // Part 8 Real-Time & Production Platform
    RealtimeNotificationCenter,
    production_realtime_center: RealtimeNotificationCenter,
    'production-realtime-center': RealtimeNotificationCenter,
    QueueManagementDashboard,
    production_queue_dashboard: QueueManagementDashboard,
    'production-queue-dashboard': QueueManagementDashboard,
    AnalyticsAndExportCenter,
    production_analytics_export: AnalyticsAndExportCenter,
    'production-analytics-export': AnalyticsAndExportCenter,
    HealthPerformanceAndDeploymentCenter,
    production_health_deployment: HealthPerformanceAndDeploymentCenter,
    'production-health-deployment': HealthPerformanceAndDeploymentCenter,
    // Part 9 Enterprise Administrator Notification Center
    EnterpriseNotificationCenter: UnifiedNotificationCenter,
    enterprise_notification_center: UnifiedNotificationCenter,
    'enterprise-notification-center': UnifiedNotificationCenter,
    // Final Enhancement – Operations Center
    NotificationOperationsCenter: UnifiedNotificationCenter,
    notification_operations_center: UnifiedNotificationCenter,
    'notification-operations-center': UnifiedNotificationCenter,
    // Manager Notification Center
    ManagerNotificationCenter: UnifiedNotificationCenter,
    manager_notification_center: UnifiedNotificationCenter,
    'manager-notification-center': UnifiedNotificationCenter,
    // Reception Notification Center (Enterprise Edition)
    ReceptionNotificationCenter: UnifiedNotificationCenter,
    reception_notification_center: UnifiedNotificationCenter,
    'reception-notification-center': UnifiedNotificationCenter,
    // Security Officer Notification Center (Enterprise Edition)
    SecurityNotificationCenter: UnifiedNotificationCenter,
    security_notification_center: UnifiedNotificationCenter,
    'security-notification-center': UnifiedNotificationCenter,
    // Enterprise System Notification Platform (Unified Central Architecture)
    EnterpriseNotificationPlatformCenter,
    enterprise_notification_platform: EnterpriseNotificationPlatformCenter,
    'enterprise-notification-platform': EnterpriseNotificationPlatformCenter,
    notification_platform: EnterpriseNotificationPlatformCenter,
    'notification-platform': EnterpriseNotificationPlatformCenter,
    // Lowercase & Hyphenated Aliases for Admin Visitor Management
    visitor_management_home: VisitorManagementHome,
    'visitor-management-home': VisitorManagementHome,
    visitor_management: VisitorDashboardDispatcher,
    'visitor-management': VisitorDashboardDispatcher,
    visitor_admin: VisitorDashboardDispatcher,
    'visitor-admin': VisitorDashboardDispatcher,
    visitor_list: VisitorList,
    'visitor-list': VisitorList,
    visitors: VisitorProfilesManagement,
    visitor_profiles: VisitorProfilesManagement,
    'visitor-profiles': VisitorProfilesManagement,
    visitor_profile_management: VisitorProfilesManagement,
    'visitor-profile-management': VisitorProfilesManagement,
    visitor_profiles_management: VisitorProfilesManagement,
    'visitor-profiles-management': VisitorProfilesManagement,
    visitor_approvals: VisitorApprovals,
    'visitor-approvals': VisitorApprovals,
    visitor_policy: VisitorPolicySettings,
    'visitor-policy': VisitorPolicySettings,
    visitor_watchlist: VisitorWatchlist,
    'visitor-watchlist': VisitorWatchlist,
    visitor_activity_logs: VisitorActivityLogs,
    'visitor-activity-logs': VisitorActivityLogs,
    visitor_analytics: VisitorAnalytics,
    'visitor-analytics': VisitorAnalytics,
    visitor_documents: VisitorDocuments,
    'visitor-documents': VisitorDocuments,
    my_documents: VisitorDocuments,
    'my-documents': VisitorDocuments,
    visitor_documents_management: VisitorDocumentManagement,
    'visitor-documents-management': VisitorDocumentManagement,
    VisitorCategoryManagement,
    visitor_categories: VisitorCategoryManagement,
    'visitor-categories': VisitorCategoryManagement,
    visitor_category_management: VisitorCategoryManagement,
    'visitor-category-management': VisitorCategoryManagement,
    CategoryDetails,
    visitor_category_details: CategoryDetails,
    'visitor-category-details': CategoryDetails,
    VisitorHistoryManagement,
    visitor_history: VisitorHistoryManagement,
    'visitor-history': VisitorHistoryManagement,
    visitor_history_management: VisitorHistoryManagement,
    'visitor-history-management': VisitorHistoryManagement,
    VisitorHistoryDetails,
    visitor_history_details: VisitorHistoryDetails,
    'visitor-history-details': VisitorHistoryDetails,
    // Organization Management (Module 3)
    OrganizationManagementHome,
    OrgDashboard,
    OrgList,
    CreateOrgWizard,
    OrgDetails,
    BranchList,
    DepartmentList,
    OrgTreeView,
    BusinessCalendar,
    OrgSettings,
    // Module 3.2 Additions
    OrgProfileEdit,
    OrgStatusManagement,
    OrgSearch,
    // Module 3.4 Additions
    CreateDepartmentWizard,
    DepartmentDetails,
    DepartmentEdit,
    DepartmentStatusManagement,
    DepartmentSearch,
    DepartmentStatistics,
    DepartmentHierarchy,
    // Facility & Workplace Architecture
    BuildingManagement,
    FloorManagement,
    RoomManagement,
    WorkplaceManagement,
    // Visitor
    VisitorDashboard,
    EnterpriseVisitorDashboard,
    VisitorDashboardDispatcher,
    visitor_portal_dashboard: VisitorDashboard,
    'visitor-portal-dashboard': VisitorDashboard,
    visitor_dashboard: VisitorDashboardDispatcher,
    'visitor-dashboard': VisitorDashboardDispatcher,
    enterprise_visitor_dashboard: EnterpriseVisitorDashboard,
    'enterprise-visitor-dashboard': EnterpriseVisitorDashboard,
    visitor_management_dashboard: EnterpriseVisitorDashboard,
    'visitor-management-dashboard': EnterpriseVisitorDashboard,
    VisitorRegistrationPage,
    visitor_registration: VisitorRegistrationPage,
    VisitorProfile,
    visitor_profile: VisitorProfile,
    'visitor-profile': VisitorProfile,
    VisitorAppointments,
    VisitorDocuments,
    VisitHistory,
    visit_history: VisitHistory,
    'visit-history': VisitHistory,
    CheckInOutHistory,
    checkin_checkout_history: CheckInOutHistory,
    'checkin-checkout-history': CheckInOutHistory,
    VisitorPass,
    visitor_pass: VisitorPass,
    'visitor-pass': VisitorPass,
    // Real Identity Verification
    IdentityVerificationOverviewPage,
    identity_verification: IdentityVerificationOverviewPage,
    'identity-verification': IdentityVerificationOverviewPage,
    DocumentSelectionPage,
    'select-document': DocumentSelectionPage,
    DocumentCapturePage,
    'capture-document': DocumentCapturePage,
    BiometricVerificationPage,
    'biometric-verification': BiometricVerificationPage,
    VerificationStatusPage,
    'verification-status': VerificationStatusPage,
    ReviewerQueuePage,
    'identity-reviews': ReviewerQueuePage,
    'security-identity-reviews': ReviewerQueuePage,
    ReviewerCaseDetailPage,
    VerificationPolicySettingsPage,
    'identity-policy': VerificationPolicySettingsPage,
    VisitorFeedback,
    VisitorSupport,
    FeedbackSupportCenter,
    'feedback-support': FeedbackSupportCenter,
    feedback_support: FeedbackSupportCenter,
    'support-feedback': FeedbackSupportCenter,
    support_feedback: FeedbackSupportCenter,
    FeedbackSupport: FeedbackSupportCenter,
    VisitorSettings: VisitorAdminSettings,
    SystemChat,
    // Employee & Appointments
    EmployeePortal,
    EmployeeDashboard,
    EmployeeProfileView,
    EmployeeVisitorRequests,
    EmployeeAppointments,
    Calendar,
    EmployeeVisitors,
    EmployeeMeetingManagement,
    EmployeeNotifications,
    EmployeeReports,
    EmployeeHelpSupport,
    EmployeeSettings,
    employee_portal: EmployeePortal,
    'employee-portal': EmployeePortal,
    employee_dashboard: EmployeeDashboard,
    'employee-dashboard': EmployeeDashboard,
    employee_requests: EmployeeVisitorRequests,
    'employee-requests': EmployeeVisitorRequests,
    employee_appointments: EmployeeAppointments,
    'employee-appointments': EmployeeAppointments,
    employee_calendar: Calendar,
    'employee-calendar': Calendar,
    employee_visitors: EmployeeVisitors,
    'employee-visitors': EmployeeVisitors,
    employee_meetings: EmployeeMeetingManagement,
    'employee-meetings': EmployeeMeetingManagement,
    employee_notifications: UnifiedNotificationCenter,
    'employee-notifications': UnifiedNotificationCenter,
    employee_reports: EmployeeReports,
    'employee-reports': EmployeeReports,
    employee_help: EmployeeHelpSupport,
    'employee-help': EmployeeHelpSupport,
    employee_settings: EmployeeSettings,
    'employee-settings': EmployeeSettings,
    VisitorInvitation,
    AppointmentManagement,
    AppointmentManagementHome,
    appointment_management: AppointmentManagementHome,
    'appointment-management': AppointmentManagementHome,
    appointment_management_home: AppointmentManagementHome,
    'appointment-management-home': AppointmentManagementHome,
    appointment_dashboard: AppointmentManagementHome,
    'appointment-dashboard': AppointmentManagementHome,
    appointment_calendar: AppointmentManagementHome,
    'appointment-calendar': AppointmentManagementHome,
    EmployeeVisitorHistory,
    // Manager
    ManagerDashboard,
    Approvals,
    DepartmentVisitors,
    DepartmentReports,
    DepartmentManagerProfileView,
    manager_profile: DepartmentManagerProfileView,
    'manager-profile': DepartmentManagerProfileView,
    department_manager_profile: DepartmentManagerProfileView,
    'department-manager-profile': DepartmentManagerProfileView,
    // Receptionist
    ReceptionDashboard,
    ReceptionManagementHome,
    VisitorRegistration,
    VisitorVerification,
    BadgeManagement,
    CheckIn,
    CheckOut,
    WalkInVisitors,
    VisitorArrivalManagement,
    AppointmentVerification,
    WalkInVisitorManagement,
    VisitorQueueManagement,
    VisitorPassIssuance,
    HostNotificationView,
    WaitingAreaManagement,
    ReceptionSearchDirectory,
    ReceptionReportsView,
    ReceptionActivityLogView,
    ReceptionistProfileSettings,
    CheckInDashboard,
    CheckInHistory,
    CheckInAnalytics,
    CheckInValidation,
    GroupCheckIn,
    VIPCheckIn,
    ContractorCheckIn,
    VehicleCheckIn,
    CheckOutDashboard,
    CheckOutExitProcessing,
    PendingCheckOuts,
    OverstayManagement,
    AssetReturnVerification,
    GroupCheckOut,
    EmergencyEvacuationStatus,
    CheckOutHistory,
    // Module 11 Check-Out view-key mappings
    checkout_dashboard: CheckOutDashboard,
    'checkout-dashboard': CheckOutDashboard,
    checkout_process: CheckOutExitProcessing,
    'checkout-process': CheckOutExitProcessing,
    pending_checkouts: PendingCheckOuts,
    'pending-checkouts': PendingCheckOuts,
    overstay_management: OverstayManagement,
    'overstay-management': OverstayManagement,
    asset_return: AssetReturnVerification,
    'asset-return': AssetReturnVerification,
    group_checkout: GroupCheckOut,
    'group-checkout': GroupCheckOut,
    evacuation_status: EmergencyEvacuationStatus,
    'evacuation-status': EmergencyEvacuationStatus,
    checkout_history: CheckOutHistory,
    'checkout-history': CheckOutHistory,
    // Module 10 Check-In view-key mappings
    checkin_dashboard: CheckInDashboard,
    'checkin-dashboard': CheckInDashboard,
    checkin_history: CheckInHistory,
    'checkin-history': CheckInHistory,
    checkin_analytics: CheckInAnalytics,
    'checkin-analytics': CheckInAnalytics,
    checkin_validation: CheckInValidation,
    'checkin-validation': CheckInValidation,
    group_checkin: GroupCheckIn,
    'group-checkin': GroupCheckIn,
    vip_checkin: VIPCheckIn,
    'vip-checkin': VIPCheckIn,
    contractor_checkin: ContractorCheckIn,
    'contractor-checkin': ContractorCheckIn,
    vehicle_checkin: VehicleCheckIn,
    'vehicle-checkin': VehicleCheckIn,
    // Module 8 Reception view-key mappings
    reception_dashboard: ReceptionDashboard,
    'reception-dashboard': ReceptionDashboard,
    reception_home: ReceptionDashboard,
    'reception-home': ReceptionDashboard,
    reception_management: ReceptionDashboard,
    'reception-management': ReceptionDashboard,
    visitor_arrivals: VisitorArrivalManagement,
    'visitor-arrivals': VisitorArrivalManagement,
    reception_arrivals: VisitorArrivalManagement,
    'reception-arrivals': VisitorArrivalManagement,
    appointment_verification: AppointmentVerification,
    'appointment-verification': AppointmentVerification,
    walkin_management: WalkInVisitorManagement,
    'walkin-management': WalkInVisitorManagement,
    walk_in_management: WalkInVisitorManagement,
    'walk-in-management': WalkInVisitorManagement,
    visitor_queue: VisitorQueueManagement,
    'visitor-queue': VisitorQueueManagement,
    reception_queue: VisitorQueueManagement,
    'reception-queue': VisitorQueueManagement,
    visitor_pass_issuance: VisitorPassIssuance,
    'visitor-pass-issuance': VisitorPassIssuance,
    reception_passes: VisitorPassIssuance,
    'reception-passes': VisitorPassIssuance,
    host_notifications: HostNotificationView,
    'host-notifications': HostNotificationView,
    reception_notifications: ReceptionNotificationCenter,
    'reception-notifications': ReceptionNotificationCenter,
    waiting_area: WaitingAreaManagement,
    'waiting-area': WaitingAreaManagement,
    reception_waiting: WaitingAreaManagement,
    'reception-waiting': WaitingAreaManagement,
    reception_search: ReceptionSearchDirectory,
    'reception-search': ReceptionSearchDirectory,
    reception_directory: ReceptionSearchDirectory,
    'reception-directory': ReceptionSearchDirectory,
    reception_reports: ReceptionReportsView,
    'reception-reports': ReceptionReportsView,
    reception_activity_log: ReceptionActivityLogView,
    'reception-activity-log': ReceptionActivityLogView,
    reception_logs: ReceptionActivityLogView,
    'reception-logs': ReceptionActivityLogView,
    reception_profile: ReceptionistProfileSettings,
    'reception-profile': ReceptionistProfileSettings,
    reception_settings: ReceptionistProfileSettings,
    'reception-settings': ReceptionistProfileSettings,
    reception_checkin: CheckIn,
    'reception-checkin': CheckIn,
    reception_checkout: CheckOut,
    'reception-checkout': CheckOut,
    badge_management: BadgeManagement,
    'badge-management': BadgeManagement,
    visitor_verification: VisitorVerification,
    'visitor-verification': VisitorVerification,
    passes: VisitorPassIssuance,
    visitor_passes: VisitorPassIssuance,
    'visitor-passes': VisitorPassIssuance,
    live_board: VisitorQueueManagement,
    'live-board': VisitorQueueManagement,
    reception_workspace: ReceptionDashboard,
    'reception-workspace': ReceptionDashboard,
    // Security
    SecurityDashboard,
    QRScanner,
    AccessControl,
    IncidentManagement,
    VisitorMovement,
    VisitorScreening,
    RiskAndWatchlist,
    AccessControlRules,
    LiveVisitorTracking,
    EscortManagement,
    SecurityReportsAnalytics,
    // Module 12 Security view-key mappings
    security_dashboard: SecurityDashboard,
    'security-dashboard': SecurityDashboard,
    visitor_screening: VisitorScreening,
    'visitor-screening': VisitorScreening,
    risk_watchlist: RiskAndWatchlist,
    'risk-watchlist': RiskAndWatchlist,
    incident_management: IncidentManagement,
    'incident-management': IncidentManagement,
    access_control_rules: AccessControlRules,
    'access-control-rules': AccessControlRules,
    live_visitor_tracking: LiveVisitorTracking,
    'live-visitor-tracking': LiveVisitorTracking,
    escort_management: EscortManagement,
    'escort-management': EscortManagement,
    security_analytics: SecurityReportsAnalytics,
    'security-analytics': SecurityReportsAnalytics,
    SecurityOfficerProfileView,
    security_profile: SecurityOfficerProfileView,
    'security-profile': SecurityOfficerProfileView,
    security_officer_profile: SecurityOfficerProfileView,
    'security-officer-profile': SecurityOfficerProfileView,
    // Lowercase view-key mappings for module 3
    org_home: OrganizationManagementHome,
    org_dashboard: OrgDashboard,
    organizations: OrgList,
    create_organization: CreateOrgWizard,
    org_details: OrgDetails,
    branches: BranchList,
    departments: DepartmentList,
    departments_mgmt: DepartmentList,
    department_settings: DepartmentSettings,
    'department-settings': DepartmentSettings,
    org_tree: OrganizationTree,
    business_calendar: BusinessCalendar,
    'business-calendar': BusinessCalendar,
    org_settings: OrgSettings,
    'org-settings': OrgSettings,
    'organization-settings': OrgSettings,
    // Module 3.2 lowercases
    org_edit: OrgProfileEdit,
    org_status: OrgStatusManagement,
    org_search: OrgSearch,
    // Module 3.3 Branch Management
    branch_create: CreateBranchWizard,
    branch_details: BranchDetails,
    branch_edit: BranchEdit,
    branch_status: BranchStatusManagement,
    branch_search: BranchSearch,
    branch_statistics: BranchStatistics,
    // Module 3.4 Department Management
    dept_create: CreateDepartmentWizard,
    dept_details: DepartmentDetails,
    dept_edit: DepartmentEdit,
    dept_status: DepartmentStatusManagement,
    dept_search: DepartmentSearch,
    dept_statistics: DepartmentStatistics,
    dept_hierarchy: DepartmentHierarchy,
    // Hyphenated aliases for direct route URL matching
    'departments-mgmt': DepartmentList,
    'dept-create': CreateDepartmentWizard,
    'dept-details': DepartmentDetails,
    'dept-edit': DepartmentEdit,
    'dept-status': DepartmentStatusManagement,
    'dept-search': DepartmentSearch,
    'dept-statistics': DepartmentStatistics,
    'dept-hierarchy': DepartmentHierarchy,
    'organization-tree': OrganizationTree,
    'org-tree': OrganizationTree,
    // Module 3.5 Organization Hierarchy Management
    HierarchyDashboard,
    OrganizationTree,
    HierarchyAssignment,
    HierarchyDetails,
    HierarchySearch,
    HierarchyValidation,
    HierarchyStatistics,
    // Module 3.5 lowercase view-key mappings
    hierarchy_dashboard: HierarchyDashboard,
    org_hierarchy: HierarchyDashboard,
    hierarchy_tree: OrganizationTree,
    hierarchy_assignment: HierarchyAssignment,
    hierarchy_details: HierarchyDetails,
    hierarchy_search: HierarchySearch,
    hierarchy_validation: HierarchyValidation,
    hierarchy_statistics: HierarchyStatistics,
    // Module 3.5 hyphenated aliases for direct route URL matching
    'hierarchy-dashboard': HierarchyDashboard,
    'hierarchy-tree': OrganizationTree,
    'hierarchy-assignment': HierarchyAssignment,
    'hierarchy-details': HierarchyDetails,
    'hierarchy-search': HierarchySearch,
    'hierarchy-validation': HierarchyValidation,
    'hierarchy-statistics': HierarchyStatistics,
    // Enterprise Location, Building, Floor, Room & Workplace Routing
    buildings: BuildingManagement,
    building_management: BuildingManagement,
    'building-management': BuildingManagement,
    floors: FloorManagement,
    floor_management: FloorManagement,
    'floor-management': FloorManagement,
    rooms: RoomManagement,
    room_management: RoomManagement,
    'room-management': RoomManagement,
    workplace: WorkplaceManagement,
    workplace_management: WorkplaceManagement,
    'workplace-management': WorkplaceManagement,
    workplace_assignments: WorkplaceManagement,
    'workplace-assignments': WorkplaceManagement,
    // Visitor Complete Flow (All 15 Views)
    VisitorMasterFlow,
    visitor_master_flow: VisitorMasterFlow,
    visitor_flow: VisitorMasterFlow,
    'visitor-flow': VisitorMasterFlow,
    'visitor-master-flow': VisitorMasterFlow,
    // ── Module 14: Enterprise Reporting & Analytics Management ──────────────
    ReportingDashboard,
    OperationalReports,
    VisitorAnalyticsView,
    CustomReportBuilder,
    ScheduledReports,
    ExportCenter,
    // Module 14 view-key mappings
    reporting_dashboard: ReportingDashboard,
    'reporting-dashboard': ReportingDashboard,
    bi_dashboard: ReportingDashboard,
    'bi-dashboard': ReportingDashboard,
    operational_reports: OperationalReports,
    'operational-reports': OperationalReports,
    SecurityReportsView,
    security_reports: SecurityReportsView,
    'security-reports': SecurityReportsView,
    SecurityAuditLogsView,
    security_audit_logs: SecurityAuditLogsView,
    'security-audit-logs': SecurityAuditLogsView,
    visitor_analytics_view: VisitorAnalyticsView,
    'visitor-analytics-view': VisitorAnalyticsView,
    occupancy_analytics: VisitorAnalyticsView,
    'occupancy-analytics': VisitorAnalyticsView,
    custom_report_builder: CustomReportBuilder,
    'custom-report-builder': CustomReportBuilder,
    report_builder: CustomReportBuilder,
    'report-builder': CustomReportBuilder,
    scheduled_reports: ScheduledReports,
    'scheduled-reports': ScheduledReports,
    export_center: ExportCenter,
    'export-center': ExportCenter,
    // ── Module 15: Enterprise Dashboard Management ───────────────────────────
    UniversalDashboardDispatcher,
    ExecutiveDashboard,
    AuditorDashboard,
    WidgetCustomizerModal,
    GlobalSearchModal,
    // Module 15 view-key mappings
    enterprise_dashboard: UniversalDashboardDispatcher,
    'enterprise-dashboard': UniversalDashboardDispatcher,
    dashboard_dispatcher: UniversalDashboardDispatcher,
    'dashboard-dispatcher': UniversalDashboardDispatcher,
    executive_dashboard: ExecutiveDashboard,
    'executive-dashboard': ExecutiveDashboard,
    auditor_dashboard: AuditorDashboard,
    'auditor-dashboard': AuditorDashboard,
    // ── Module 17: System Administration ────────────────────────────────────
    SystemAdminDashboard,
    SystemConfiguration,
    SecurityAdministration,
    BrandingAdministration,
    BusinessRulesEngine,
    BackupRecovery,
    PerformanceMonitoring,
    IntegrationManagement,
    SchedulerJobsAdmin,
    MaintenanceMode,
    FeatureFlags,
    DataRetentionArchiving,
    CalendarHolidayAdmin,
    VisitorPolicyAdmin,
    LocalizationLanguage,
    LicenseEnvironment,
    AuditComplianceAdmin,
    HelpDocsDiagnostics,
    NotificationSettingsAdmin,
    system_admin_dashboard: SystemAdminDashboard,
    'system-admin-dashboard': SystemAdminDashboard,
    system_admin: SystemAdminDashboard,
    'system-admin': SystemAdminDashboard,
    system_configuration: SystemConfiguration,
    'system-configuration': SystemConfiguration,
    security_administration: SecurityAdministration,
    'security-administration': SecurityAdministration,
    branding_administration: BrandingAdministration,
    'branding-administration': BrandingAdministration,
    business_rules_engine: BusinessRulesEngine,
    'business-rules-engine': BusinessRulesEngine,
    backup_recovery: BackupRecovery,
    'backup-recovery': BackupRecovery,
    performance_monitoring: PerformanceMonitoring,
    'performance-monitoring': PerformanceMonitoring,
    integration_management: IntegrationManagement,
    'integration-management': IntegrationManagement,
    scheduler_jobs_admin: SchedulerJobsAdmin,
    'scheduler-jobs-admin': SchedulerJobsAdmin,
    maintenance_mode: MaintenanceMode,
    'maintenance-mode': MaintenanceMode,
    feature_flags: FeatureFlags,
    'feature-flags': FeatureFlags,
    data_retention_archiving: DataRetentionArchiving,
    'data-retention-archiving': DataRetentionArchiving,
    calendar_holiday_admin: CalendarHolidayAdmin,
    'calendar-holiday-admin': CalendarHolidayAdmin,
    visitor_policy_admin: VisitorPolicyAdmin,
    'visitor-policy-admin': VisitorPolicyAdmin,
    localization_language: LocalizationLanguage,
    'localization-language': LocalizationLanguage,
    license_environment: LicenseEnvironment,
    'license-environment': LicenseEnvironment,
    audit_compliance_admin: AuditComplianceAdmin,
    'audit-compliance-admin': AuditComplianceAdmin,
    help_docs_diagnostics: HelpDocsDiagnostics,
    'help-docs-diagnostics': HelpDocsDiagnostics,
    notification_settings_admin: NotificationSettingsAdmin,
    'notification-settings-admin': NotificationSettingsAdmin,
};
export default componentRegistry;
