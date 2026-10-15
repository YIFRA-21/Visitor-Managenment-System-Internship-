import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutDashboard, User, CheckSquare, Calendar, Users, Building, Bell, BarChart3, HelpCircle, Settings, Clock, } from 'lucide-react';
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
import { useState, useEffect } from 'react';
import { employeePortalApi } from '../../services/api';
export default function EmployeePortal() {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get('view') || 'employee_dashboard';
    const [pendingCount, setPendingCount] = useState(0);
    useEffect(() => {
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
        const interval = setInterval(fetchPendingCount, 10000);
        return () => clearInterval(interval);
    }, []);
    const navItems = [
        { key: 'employee_dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { key: 'employee_profile', label: 'My Profile', icon: User },
        { key: 'employee_requests', label: 'Visitor Requests', icon: CheckSquare, badge: pendingCount },
        { key: 'employee_appointments', label: 'My Appointments', icon: Clock },
        { key: 'employee_calendar', label: 'My Calendar', icon: Calendar },
        { key: 'employee_visitors', label: 'My Visitors', icon: Users },
        { key: 'employee_meetings', label: 'Meeting Rooms', icon: Building },
        { key: 'employee_notifications', label: 'Notifications', icon: Bell },
        { key: 'employee_reports', label: 'Reports', icon: BarChart3 },
        { key: 'employee_help', label: 'Help & Support', icon: HelpCircle },
        { key: 'employee_settings', label: 'Settings', icon: Settings },
    ];
    const handleTabChange = (key) => {
        setSearchParams({ view: key });
    };
    const renderActiveView = () => {
        switch (currentTab) {
            case 'employee_profile':
            case 'profile':
            case 'my_profile':
                return <EmployeeProfileView />;
            case 'employee_requests':
            case 'requests':
                return <EmployeeVisitorRequests />;
            case 'employee_appointments':
            case 'appointments':
            case 'my_appointments':
                return <EmployeeAppointments />;
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
                return <EmployeeDashboard />;
        }
    };
    return (<div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Sub-Navigation Workspace Header Bar (Branch & Admin Design Style) */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 sticky top-0 z-30 shadow-lg overflow-x-auto">
        <div className="flex items-center space-x-1.5 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.key ||
                (item.key === 'employee_dashboard' && currentTab === 'dashboard') ||
                (item.key === 'employee_profile' && (currentTab === 'profile' || currentTab === 'my_profile')) ||
                (item.key === 'employee_requests' && currentTab === 'requests') ||
                (item.key === 'employee_appointments' && (currentTab === 'appointments' || currentTab === 'my_appointments')) ||
                (item.key === 'employee_calendar' && currentTab === 'calendar') ||
                (item.key === 'employee_visitors' && (currentTab === 'visitors' || currentTab === 'my_visitors')) ||
                (item.key === 'employee_meetings' && (currentTab === 'meetings' || currentTab === 'meeting_rooms')) ||
                (item.key === 'employee_notifications' && currentTab === 'notifications') ||
                (item.key === 'employee_reports' && currentTab === 'reports') ||
                (item.key === 'employee_help' && currentTab === 'help') ||
                (item.key === 'employee_settings' && currentTab === 'settings');
            return (<button key={item.key} onClick={() => handleTabChange(item.key)} className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all relative ${isActive
                    ? 'bg-blue-600 text-white shadow-md border border-blue-500'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'}`}>
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`}/>
                <span>{item.label}</span>
                {item.key === 'employee_requests' && pendingCount > 0 && (<span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-sm animate-pulse">
                    {pendingCount}
                  </span>)}
              </button>);
        })}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 p-4 md:p-6">{renderActiveView()}</div>
    </div>);
}
