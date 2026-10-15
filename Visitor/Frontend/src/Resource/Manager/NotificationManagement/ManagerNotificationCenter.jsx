import React, { useState } from 'react';
import { Bell, CheckCircle2, UserCheck, Calendar, Users, Building2, Megaphone, Clock, Siren, ShieldAlert, History, BarChart3, FileSpreadsheet, Sliders, HelpCircle, Settings, Inbox, RefreshCw, Layers } from 'lucide-react';
import ManagerDashboardView from './Views/ManagerDashboardView';
import ManagerInboxView from './Views/ManagerInboxView';
import ManagerApprovalCenterView from './Views/ManagerApprovalCenterView';
import ManagerVisitorNotificationsView from './Views/ManagerVisitorNotificationsView';
import ManagerAppointmentNotificationsView from './Views/ManagerAppointmentNotificationsView';
import ManagerEmployeeNotificationsView from './Views/ManagerEmployeeNotificationsView';
import ManagerDepartmentNotificationsView from './Views/ManagerDepartmentNotificationsView';
import ManagerBroadcastCenterView from './Views/ManagerBroadcastCenterView';
import ManagerReminderConsoleView from './Views/ManagerReminderConsoleView';
import ManagerEmergencyAlertsView from './Views/ManagerEmergencyAlertsView';
import ManagerEscalationCenterView from './Views/ManagerEscalationCenterView';
import ManagerNotificationHistoryView from './Views/ManagerNotificationHistoryView';
import ManagerAnalyticsDashboardView from './Views/ManagerAnalyticsDashboardView';
import ManagerReportsView from './Views/ManagerReportsView';
import ManagerPreferencesView from './Views/ManagerPreferencesView';
import ManagerHelpSupportView from './Views/ManagerHelpSupportView';
import ManagerSettingsView from './Views/ManagerSettingsView';
const ManagerNotificationCenter = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [departmentName] = useState('Operations & Security');
    const navItems = [
        { id: 'dashboard', label: 'Manager Dashboard', icon: BarChart3, badge: null },
        { id: 'inbox', label: 'Notification Center', icon: Inbox, badge: '4' },
        { id: 'approvals', label: 'Approval Center', icon: CheckCircle2, badge: '2', alert: true },
        { id: 'visitors', label: 'Visitor Notifications', icon: UserCheck, badge: null },
        { id: 'appointments', label: 'Appointment Notifications', icon: Calendar, badge: null },
        { id: 'employees', label: 'Employee Notifications', icon: Users, badge: null },
        { id: 'department', label: 'Department Notifications', icon: Building2, badge: null },
        { id: 'broadcast', label: 'Broadcast Center', icon: Megaphone, badge: null },
        { id: 'reminders', label: 'Reminder Center', icon: Clock, badge: null },
        { id: 'emergency', label: 'Emergency Alerts', icon: Siren, badge: '1', critical: true },
        { id: 'escalations', label: 'Escalation Center', icon: ShieldAlert, badge: '1' },
        { id: 'history', label: 'Notification History', icon: History, badge: null },
        { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart3, badge: null },
        { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet, badge: null },
        { id: 'preferences', label: 'Notification Preferences', icon: Sliders, badge: null },
        { id: 'help', label: 'Help & Support', icon: HelpCircle, badge: null },
        { id: 'settings', label: 'Settings', icon: Settings, badge: null }
    ];
    return (<div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Bell className="w-6 h-6 animate-pulse"/>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Manager Notification Operations</h1>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Socket
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Authority Scope: <span className="text-blue-400 font-semibold">{departmentName}</span> | Organization & Branch Level
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400"/>
            <span>Scoped Manager View</span>
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-blue-500/20 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5"/> Refresh Data
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-3 h-fit">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
            Manager Control Center
          </p>
          <nav className="space-y-1 mt-1">
            {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (<button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`}/>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (<span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.critical
                        ? 'bg-red-500 text-white animate-bounce'
                        : item.alert
                            ? 'bg-amber-500 text-slate-950 font-extrabold'
                            : isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                      {item.badge}
                    </span>)}
                </button>);
        })}
          </nav>
        </div>

        {/* View Workspace */}
        <div className="lg:col-span-9 bg-slate-900 border border-slate-800 rounded-xl p-5 min-h-[600px]">
          {activeTab === 'dashboard' && <ManagerDashboardView onNavigate={(tab) => setActiveTab(tab)}/>}
          {activeTab === 'inbox' && <ManagerInboxView />}
          {activeTab === 'approvals' && <ManagerApprovalCenterView />}
          {activeTab === 'visitors' && <ManagerVisitorNotificationsView />}
          {activeTab === 'appointments' && <ManagerAppointmentNotificationsView />}
          {activeTab === 'employees' && <ManagerEmployeeNotificationsView />}
          {activeTab === 'department' && <ManagerDepartmentNotificationsView />}
          {activeTab === 'broadcast' && <ManagerBroadcastCenterView />}
          {activeTab === 'reminders' && <ManagerReminderConsoleView />}
          {activeTab === 'emergency' && <ManagerEmergencyAlertsView />}
          {activeTab === 'escalations' && <ManagerEscalationCenterView />}
          {activeTab === 'history' && <ManagerNotificationHistoryView />}
          {activeTab === 'analytics' && <ManagerAnalyticsDashboardView />}
          {activeTab === 'reports' && <ManagerReportsView />}
          {activeTab === 'preferences' && <ManagerPreferencesView />}
          {activeTab === 'help' && <ManagerHelpSupportView />}
          {activeTab === 'settings' && <ManagerSettingsView />}
        </div>
      </div>
    </div>);
};
export default ManagerNotificationCenter;
