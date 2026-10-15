import React, { useState } from 'react';
import { Bell, UserCheck, Calendar, LogIn, LogOut, Users, CreditCard, Clock, FileCheck, ShieldAlert, Siren, Megaphone, History, BarChart3, FileSpreadsheet, Sliders, HelpCircle, Settings, Inbox, RefreshCw, Building } from 'lucide-react';
import ReceptionDashboardView from './Views/ReceptionDashboardView';
import ReceptionInboxView from './Views/ReceptionInboxView';
import ReceptionVisitorArrivalView from './Views/ReceptionVisitorArrivalView';
import ReceptionAppointmentView from './Views/ReceptionAppointmentView';
import ReceptionCheckInView from './Views/ReceptionCheckInView';
import ReceptionCheckOutView from './Views/ReceptionCheckOutView';
import ReceptionHostNotificationsView from './Views/ReceptionHostNotificationsView';
import ReceptionVisitorPassView from './Views/ReceptionVisitorPassView';
import ReceptionWaitingQueueView from './Views/ReceptionWaitingQueueView';
import ReceptionDocumentVerificationView from './Views/ReceptionDocumentVerificationView';
import ReceptionSecurityNotificationsView from './Views/ReceptionSecurityNotificationsView';
import ReceptionEmergencyAlertsView from './Views/ReceptionEmergencyAlertsView';
import ReceptionReminderConsoleView from './Views/ReceptionReminderConsoleView';
import ReceptionBroadcastComposerView from './Views/ReceptionBroadcastComposerView';
import ReceptionHistoryView from './Views/ReceptionHistoryView';
import ReceptionAnalyticsDashboardView from './Views/ReceptionAnalyticsDashboardView';
import ReceptionReportsView from './Views/ReceptionReportsView';
import ReceptionPreferencesView from './Views/ReceptionPreferencesView';
import ReceptionHelpSupportView from './Views/ReceptionHelpSupportView';
import ReceptionSettingsView from './Views/ReceptionSettingsView';
const ReceptionNotificationCenter = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [deskName] = useState('Main Plaza Lobby Desk #1');
    const navItems = [
        { id: 'dashboard', label: 'Reception Dashboard', icon: BarChart3, badge: null },
        { id: 'inbox', label: 'Notification Center', icon: Inbox, badge: '5' },
        { id: 'visitor_arrival', label: 'Visitor Arrival Notices', icon: UserCheck, badge: '2', alert: true },
        { id: 'appointments', label: 'Appointment Notices', icon: Calendar, badge: null },
        { id: 'checkin', label: 'Check-In Notifications', icon: LogIn, badge: '4' },
        { id: 'checkout', label: 'Check-Out Notifications', icon: LogOut, badge: '2' },
        { id: 'host', label: 'Host Employee Alerts', icon: Users, badge: null },
        { id: 'pass', label: 'Visitor Pass Alerts', icon: CreditCard, badge: '6' },
        { id: 'queue', label: 'Waiting Queue Alerts', icon: Clock, badge: '1', alert: true },
        { id: 'document', label: 'Document Verification', icon: FileCheck, badge: null },
        { id: 'security', label: 'Security Notifications', icon: ShieldAlert, badge: '1', critical: true },
        { id: 'emergency', label: 'Emergency Alerts', icon: Siren, badge: null, critical: true },
        { id: 'reminders', label: 'Reminder Engine', icon: Clock, badge: null },
        { id: 'broadcast', label: 'Broadcast Composer', icon: Megaphone, badge: null },
        { id: 'history', label: 'Notification History', icon: History, badge: null },
        { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart3, badge: null },
        { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet, badge: null },
        { id: 'preferences', label: 'Notification Preferences', icon: Sliders, badge: null },
        { id: 'help', label: 'Help & Support', icon: HelpCircle, badge: null },
        { id: 'settings', label: 'Desk Settings', icon: Settings, badge: null }
    ];
    return (<div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Bell className="w-6 h-6 animate-pulse"/>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Front-Desk Reception Notification Operations</h1>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Socket Live
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active Desk Scope: <span className="text-emerald-400 font-semibold">{deskName}</span> | Building HQ Front-Desk
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-400"/>
            <span>Front Desk Active Scope</span>
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-emerald-500/20 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5"/> Refresh Desk Feed
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-3 h-fit">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
            Reception Control Center
          </p>
          <nav className="space-y-1 mt-1">
            {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (<button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 font-semibold'
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
          {activeTab === 'dashboard' && <ReceptionDashboardView onNavigate={(tab) => setActiveTab(tab)}/>}
          {activeTab === 'inbox' && <ReceptionInboxView />}
          {activeTab === 'visitor_arrival' && <ReceptionVisitorArrivalView />}
          {activeTab === 'appointments' && <ReceptionAppointmentView />}
          {activeTab === 'checkin' && <ReceptionCheckInView />}
          {activeTab === 'checkout' && <ReceptionCheckOutView />}
          {activeTab === 'host' && <ReceptionHostNotificationsView />}
          {activeTab === 'pass' && <ReceptionVisitorPassView />}
          {activeTab === 'queue' && <ReceptionWaitingQueueView />}
          {activeTab === 'document' && <ReceptionDocumentVerificationView />}
          {activeTab === 'security' && <ReceptionSecurityNotificationsView />}
          {activeTab === 'emergency' && <ReceptionEmergencyAlertsView />}
          {activeTab === 'reminders' && <ReceptionReminderConsoleView />}
          {activeTab === 'broadcast' && <ReceptionBroadcastComposerView />}
          {activeTab === 'history' && <ReceptionHistoryView />}
          {activeTab === 'analytics' && <ReceptionAnalyticsDashboardView />}
          {activeTab === 'reports' && <ReceptionReportsView />}
          {activeTab === 'preferences' && <ReceptionPreferencesView />}
          {activeTab === 'help' && <ReceptionHelpSupportView />}
          {activeTab === 'settings' && <ReceptionSettingsView />}
        </div>
      </div>
    </div>);
};
export default ReceptionNotificationCenter;
