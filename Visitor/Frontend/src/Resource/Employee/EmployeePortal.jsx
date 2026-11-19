import React from 'react';
import { useSearchParams } from 'react-router-dom';
import EmployeeDashboard from './EmployeeDashboard';
import EmployeeProfileView from './EmployeeProfileView';
import EmployeeVisitorRequests from './EmployeeVisitorRequests';
import EmployeeAppointments from './EmployeeAppointments';
import CalendarView from './Calendar';
import EmployeeVisitors from './EmployeeVisitors';
import EmployeeMeetingManagement from './EmployeeMeetingManagement';
import UnifiedNotificationCenter from '../../modules/notifications/components/UnifiedNotificationCenter';
import EmployeeReports from './EmployeeReports';
import EmployeeHelpSupport from './EmployeeHelpSupport';
import EmployeeSettings from './EmployeeSettings';

export default function EmployeePortal() {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get('view') || 'employee_dashboard';

    const renderActiveView = () => {
        switch (currentTab) {
            case 'employee_profile':
            case 'profile':
            case 'my_profile':
                return <EmployeeProfileView />;
            case 'employee_requests':
            case 'requests':
                return <EmployeeVisitorRequests />;
            case 'employee_create':
            case 'employee_appointments':
            case 'appointments':
            case 'my_appointments':
                return <EmployeeAppointments autoOpenCreate={currentTab === 'employee_create'} />;
            case 'employee_calendar':
            case 'calendar':
                return <CalendarView />;
            case 'employee_visitors':
            case 'visitors':
            case 'my_visitors':
                return <EmployeeVisitors />;
            case 'employee_meetings':
            case 'meetings':
            case 'meeting_rooms':
                return <EmployeeMeetingManagement />;
            case 'employee_notifications':
            case 'notifications':
                return <UnifiedNotificationCenter initialTab="messages"/>;
            case 'employee_reports':
            case 'reports':
                return <EmployeeReports />;
            case 'employee_help':
            case 'help':
                return <EmployeeHelpSupport />;
            case 'employee_settings':
            case 'settings':
                return <EmployeeSettings />;
            case 'employee_dashboard':
            case 'dashboard':
            default:
                return <EmployeeDashboard onNavigate={(v) => setSearchParams({ view: v })} />;
        }
    };

    return (
        <div className="w-full">
            {renderActiveView()}
        </div>
    );
}
