import { useState, useEffect } from 'react';
import { Calendar, LayoutDashboard, Settings, Users, Award, AlertCircle, Search, ShieldCheck, Eye, BarChart3, Globe } from 'lucide-react';
import api from '../../../../services/api';
// Subcomponents
import CalendarDashboard from './CalendarDashboard';
import WorkingScheduleForm from './WorkingScheduleForm';
import BranchScheduleManager from './BranchScheduleManager';
import HolidayManagement from './HolidayManagement';
import SpecialWorkingDays from './SpecialWorkingDays';
import TimeZoneManagement from './TimeZoneManagement';
import CalendarSearch from './CalendarSearch';
import CalendarValidation from './CalendarValidation';
import CalendarPreview from './CalendarPreview';
import CalendarStatistics from './CalendarStatistics';
const TAB_BUTTONS = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4"/> },
    { key: 'org-schedule', label: 'Org Schedule', icon: <Settings className="h-4 w-4"/> },
    { key: 'branch-schedule', label: 'Branch Schedule', icon: <Users className="h-4 w-4"/> },
    { key: 'holidays', label: 'Holiday Mgmt', icon: <Award className="h-4 w-4"/> },
    { key: 'special-days', label: 'Special Days', icon: <Calendar className="h-4 w-4"/> },
    { key: 'timezones', label: 'Time Zones', icon: <Globe className="h-4 w-4"/> },
    { key: 'search', label: 'Calendar Search', icon: <Search className="h-4 w-4"/> },
    { key: 'validation', label: 'Validation', icon: <ShieldCheck className="h-4 w-4"/> },
    { key: 'preview', label: 'Calendar Preview', icon: <Eye className="h-4 w-4"/> },
    { key: 'statistics', label: 'Statistics', icon: <BarChart3 className="h-4 w-4"/> }
];
export default function BusinessCalendar() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    // Notification Toast state
    const [toast, setToast] = useState(null);
    const fetchStats = async () => {
        try {
            const res = await api.get('/calendar/dashboard', {
                params: { organizationId: 1 }
            });
            setStats(res.data);
        }
        catch (err) {
            console.error('Failed to load dashboard statistics.', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchStats();
    }, []);
    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 5000);
    };
    const handleSaveOrgSchedule = async (schedulePayload) => {
        try {
            await api.post('/calendar/schedules/org', schedulePayload);
            showToast('Organization working schedule configuration saved.', 'success');
            setActiveTab('dashboard');
            fetchStats();
        }
        catch {
            showToast('Failed to save organization schedule configuration.', 'danger');
        }
    };
    const renderActiveTabContent = () => {
        switch (activeTab) {
            case 'org-schedule':
                return (<WorkingScheduleForm initialData={stats} onSave={handleSaveOrgSchedule} onCancel={() => setActiveTab('dashboard')}/>);
            case 'branch-schedule':
                return <BranchScheduleManager onNotify={showToast}/>;
            case 'holidays':
                return <HolidayManagement onNotify={showToast}/>;
            case 'special-days':
                return <SpecialWorkingDays onNotify={showToast}/>;
            case 'timezones':
                return <TimeZoneManagement onNotify={showToast}/>;
            case 'search':
                return <CalendarSearch onNotify={showToast}/>;
            case 'validation':
                return <CalendarValidation onNotify={showToast}/>;
            case 'preview':
                return <CalendarPreview onNotify={showToast}/>;
            case 'statistics':
                return <CalendarStatistics stats={stats}/>;
            case 'dashboard':
            default:
                return <CalendarDashboard onNavigate={setActiveTab} stats={stats}/>;
        }
    };
    return (<div className="space-y-6">
      {/* Toast Alert Banner */}
      {toast && (<div className={`position-fixed bottom-0 end-0 m-4 z-50 p-3 rounded-lg border text-xs font-semibold shadow-lg d-flex align-items-center gap-2 ${toast.type === 'success' ? 'bg-success text-white border-success' : 'bg-danger text-white border-danger'}`} style={{ minWidth: '280px' }}>
          <AlertCircle className="h-4.5 w-4.5"/>
          <span>{toast.message}</span>
        </div>)}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight d-flex align-items-center gap-2">
            <Calendar className="text-blue-600 h-7 w-7"/> Business Calendar & Work Schedule
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
            Define official working hours, public holidays, daylight savings, and exceptions for visitor check-in workflows.
          </p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-bottom dark:border-slate-800">
        <ul className="nav nav-tabs border-0 flex flex-wrap gap-1">
          {TAB_BUTTONS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (<li key={tab.key} className="nav-item">
                <button onClick={() => setActiveTab(tab.key)} className={`nav-link border-0 text-xs font-extrabold px-3 py-2.5 d-flex align-items-center gap-2 transition-all duration-150 ${isActive
                    ? 'text-blue-600 dark:text-blue-400 border-bottom border-blue-600 dark:border-blue-400 border-3 active bg-transparent'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent'}`} style={{ borderRadius: '0' }}>
                  {tab.icon}
                  {tab.label}
                </button>
              </li>);
        })}
        </ul>
      </div>

      {/* Active Tab Panel Content */}
      <div className="mt-4">
        {loading ? (<div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-16 text-center shadow-sm">
            <div className="spinner-border text-primary" role="status"/>
            <p className="text-slate-400 text-xs fw-semibold mt-3">Loading calendar metadata...</p>
          </div>) : (renderActiveTabContent())}
      </div>
    </div>);
}
