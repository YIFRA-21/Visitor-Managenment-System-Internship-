import React, { useState } from 'react';
import { Bell, Cpu, Zap, Sliders, FileCode, Layers, Activity, Clock, ArrowUpRight, Server, Monitor, ShieldCheck, BarChart3, FileSpreadsheet, Settings, HelpCircle, RefreshCw, Globe } from 'lucide-react';
import PlatformDashboardView from './Views/PlatformDashboardView';
import PlatformNotificationCenterView from './Views/PlatformNotificationCenterView';
import PlatformEventExplorerView from './Views/PlatformEventExplorerView';
import PlatformRuleManagerView from './Views/PlatformRuleManagerView';
import PlatformTemplateManagerView from './Views/PlatformTemplateManagerView';
import PlatformQueueDashboardView from './Views/PlatformQueueDashboardView';
import PlatformDeliveryMonitorView from './Views/PlatformDeliveryMonitorView';
import PlatformReminderManagerView from './Views/PlatformReminderManagerView';
import PlatformEscalationManagerView from './Views/PlatformEscalationManagerView';
import PlatformProviderManagementView from './Views/PlatformProviderManagementView';
import PlatformMonitoringDashboardView from './Views/PlatformMonitoringDashboardView';
import PlatformAuditViewerView from './Views/PlatformAuditViewerView';
import PlatformAnalyticsView from './Views/PlatformAnalyticsView';
import PlatformReportsView from './Views/PlatformReportsView';
import PlatformPreferencesView from './Views/PlatformPreferencesView';
import PlatformHelpSupportView from './Views/PlatformHelpSupportView';
const EnterpriseNotificationPlatformCenter = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const navItems = [
        { id: 'dashboard', label: 'Platform Dashboard', icon: Cpu, badge: null },
        { id: 'center', label: 'Unified Notification Center', icon: Bell, badge: '3', alert: true },
        { id: 'events', label: 'Business Event Catalog', icon: Zap, badge: '16' },
        { id: 'rules', label: 'Notification Rule Engine', icon: Sliders, badge: '3' },
        { id: 'templates', label: 'Template Engine & Editor', icon: FileCode, badge: null },
        { id: 'queues', label: 'Queue Engine Dashboard', icon: Layers, badge: null },
        { id: 'delivery', label: 'Delivery Tracking & Monitor', icon: Activity, badge: null },
        { id: 'reminders', label: 'Lead-Time Reminder Engine', icon: Clock, badge: null },
        { id: 'escalation', label: 'Escalation & Timeout Rules', icon: ArrowUpRight, badge: null },
        { id: 'providers', label: 'Channel & Provider Configs', icon: Server, badge: '4', ok: true },
        { id: 'monitoring', label: 'System Health & Gateway', icon: Monitor, badge: '99.4%' },
        { id: 'audit', label: 'Audit Trail Inspector', icon: ShieldCheck, badge: null },
        { id: 'analytics', label: 'Platform Analytics', icon: BarChart3, badge: null },
        { id: 'reports', label: 'Reports & Data Export', icon: FileSpreadsheet, badge: null },
        { id: 'preferences', label: 'Platform Defaults', icon: Settings, badge: null },
        { id: 'help', label: 'SDK & Architecture Guides', icon: HelpCircle, badge: null }
    ];
    return (<div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      {/* Platform Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Globe className="w-6 h-6 animate-spin-slow"/>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Enterprise System Notification Platform</h1>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Event Bus Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Centralized Event-Driven Architecture | Serving All VMS Modules & Roles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400"/>
            <span>1,420 Events Processed Today</span>
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-blue-500/20 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5"/> Sync Platform Status
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-3 h-fit">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
            Platform Menu
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
                  {item.badge && (<span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.ok
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
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
          {activeTab === 'dashboard' && <PlatformDashboardView onNavigate={(tab) => setActiveTab(tab)}/>}
          {activeTab === 'center' && <PlatformNotificationCenterView />}
          {activeTab === 'events' && <PlatformEventExplorerView />}
          {activeTab === 'rules' && <PlatformRuleManagerView />}
          {activeTab === 'templates' && <PlatformTemplateManagerView />}
          {activeTab === 'queues' && <PlatformQueueDashboardView />}
          {activeTab === 'delivery' && <PlatformDeliveryMonitorView />}
          {activeTab === 'reminders' && <PlatformReminderManagerView />}
          {activeTab === 'escalation' && <PlatformEscalationManagerView />}
          {activeTab === 'providers' && <PlatformProviderManagementView />}
          {activeTab === 'monitoring' && <PlatformMonitoringDashboardView />}
          {activeTab === 'audit' && <PlatformAuditViewerView />}
          {activeTab === 'analytics' && <PlatformAnalyticsView />}
          {activeTab === 'reports' && <PlatformReportsView />}
          {activeTab === 'preferences' && <PlatformPreferencesView />}
          {activeTab === 'help' && <PlatformHelpSupportView />}
        </div>
      </div>
    </div>);
};
export default EnterpriseNotificationPlatformCenter;
