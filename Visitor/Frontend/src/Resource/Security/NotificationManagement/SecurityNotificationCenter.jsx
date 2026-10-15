import React, { useState } from 'react';
import { Shield, ShieldAlert, UserCheck, Calendar, LogIn, LogOut, CreditCard, FileCheck, Eye, Lock, Siren, Users, Compass, HardDrive, Briefcase, Megaphone, History, BarChart3, FileSpreadsheet, Sliders, BookOpen, Settings, Inbox, RefreshCw } from 'lucide-react';
import SecurityDashboardView from './Views/SecurityDashboardView';
import SecurityInboxView from './Views/SecurityInboxView';
import SecurityVisitorNotificationsView from './Views/SecurityVisitorNotificationsView';
import SecurityAppointmentNotificationsView from './Views/SecurityAppointmentNotificationsView';
import SecurityCheckInNotificationsView from './Views/SecurityCheckInNotificationsView';
import SecurityCheckOutNotificationsView from './Views/SecurityCheckOutNotificationsView';
import SecurityPassAccessNotificationsView from './Views/SecurityPassAccessNotificationsView';
import SecurityIdentityVerificationView from './Views/SecurityIdentityVerificationView';
import SecurityWatchlistBlacklistView from './Views/SecurityWatchlistBlacklistView';
import SecurityRestrictedAreaView from './Views/SecurityRestrictedAreaView';
import SecurityEmergencyAlertsView from './Views/SecurityEmergencyAlertsView';
import SecurityEscortVipView from './Views/SecurityEscortVipView';
import SecurityPatrolShiftView from './Views/SecurityPatrolShiftView';
import SecurityEquipmentHealthView from './Views/SecurityEquipmentHealthView';
import SecurityInvestigationCenterView from './Views/SecurityInvestigationCenterView';
import SecurityManualDispatchView from './Views/SecurityManualDispatchView';
import SecurityHistoryView from './Views/SecurityHistoryView';
import SecurityAnalyticsDashboardView from './Views/SecurityAnalyticsDashboardView';
import SecurityReportsView from './Views/SecurityReportsView';
import SecurityPreferencesView from './Views/SecurityPreferencesView';
import SecurityHelpSopView from './Views/SecurityHelpSopView';
import SecuritySettingsView from './Views/SecuritySettingsView';
const SecurityNotificationCenter = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [zoneName] = useState('Zone Alpha (HQ Main Campus)');
    const navItems = [
        { id: 'dashboard', label: 'SOC Dashboard', icon: BarChart3, badge: null },
        { id: 'inbox', label: 'Security Alert Feed', icon: Inbox, badge: '4', critical: true },
        { id: 'visitor_sec', label: 'Visitor Security Alerts', icon: UserCheck, badge: '3' },
        { id: 'appointments_sec', label: 'High Security Visits', icon: Calendar, badge: null },
        { id: 'checkin_sec', label: 'Check-In Clearance Alerts', icon: LogIn, badge: '2' },
        { id: 'checkout_sec', label: 'Check-Out & Overstay', icon: LogOut, badge: '3', alert: true },
        { id: 'pass_access', label: 'Pass & Turnstile Access', icon: CreditCard, badge: '2' },
        { id: 'identity', label: 'Identity Verification Failures', icon: FileCheck, badge: null },
        { id: 'watchlist', label: 'Watchlist & Blacklist', icon: Eye, badge: '1', critical: true },
        { id: 'restricted', label: 'Restricted Area Violations', icon: Lock, badge: '1', critical: true },
        { id: 'emergency', label: 'Emergency Panic Console', icon: Siren, badge: '1', critical: true },
        { id: 'escort', label: 'VIP & Escort Tracking', icon: Users, badge: null },
        { id: 'patrol', label: 'Patrol & Shift Management', icon: Compass, badge: null },
        { id: 'equipment', label: 'Hardware & CCTV Health', icon: HardDrive, badge: '1' },
        { id: 'investigation', label: 'Investigation Cases', icon: Briefcase, badge: '1', alert: true },
        { id: 'dispatch', label: 'Manual Security Dispatch', icon: Megaphone, badge: null },
        { id: 'history', label: 'Security Audit Logs', icon: History, badge: null },
        { id: 'analytics', label: 'SOC Analytics Dashboard', icon: BarChart3, badge: null },
        { id: 'reports', label: 'Incident Reports & Export', icon: FileSpreadsheet, badge: null },
        { id: 'preferences', label: 'Alert Preferences', icon: Sliders, badge: null },
        { id: 'sop', label: 'SOP & Escalation Guides', icon: BookOpen, badge: null },
        { id: 'settings', label: 'Security Settings', icon: Settings, badge: null }
    ];
    return (<div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-6 h-6 animate-pulse"/>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Security Operations Center (SOC) Console</h1>
              <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span> Live Security Feed
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active Security Scope: <span className="text-red-400 font-semibold">{zoneName}</span> | SOC Command Post
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400"/>
            <span>Shift Alpha Patrol Active</span>
          </div>
          <button className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-red-500/20 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5"/> Refresh Security Feed
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-3 h-fit">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
            SOC Navigation Menu
          </p>
          <nav className="space-y-1 mt-1">
            {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (<button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${isActive
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 font-semibold'
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
          {activeTab === 'dashboard' && <SecurityDashboardView onNavigate={(tab) => setActiveTab(tab)}/>}
          {activeTab === 'inbox' && <SecurityInboxView />}
          {activeTab === 'visitor_sec' && <SecurityVisitorNotificationsView />}
          {activeTab === 'appointments_sec' && <SecurityAppointmentNotificationsView />}
          {activeTab === 'checkin_sec' && <SecurityCheckInNotificationsView />}
          {activeTab === 'checkout_sec' && <SecurityCheckOutNotificationsView />}
          {activeTab === 'pass_access' && <SecurityPassAccessNotificationsView />}
          {activeTab === 'identity' && <SecurityIdentityVerificationView />}
          {activeTab === 'watchlist' && <SecurityWatchlistBlacklistView />}
          {activeTab === 'restricted' && <SecurityRestrictedAreaView />}
          {activeTab === 'emergency' && <SecurityEmergencyAlertsView />}
          {activeTab === 'escort' && <SecurityEscortVipView />}
          {activeTab === 'patrol' && <SecurityPatrolShiftView />}
          {activeTab === 'equipment' && <SecurityEquipmentHealthView />}
          {activeTab === 'investigation' && <SecurityInvestigationCenterView />}
          {activeTab === 'dispatch' && <SecurityManualDispatchView />}
          {activeTab === 'history' && <SecurityHistoryView />}
          {activeTab === 'analytics' && <SecurityAnalyticsDashboardView />}
          {activeTab === 'reports' && <SecurityReportsView />}
          {activeTab === 'preferences' && <SecurityPreferencesView />}
          {activeTab === 'sop' && <SecurityHelpSopView />}
          {activeTab === 'settings' && <SecuritySettingsView />}
        </div>
      </div>
    </div>);
};
export default SecurityNotificationCenter;
