import React, { useState } from 'react';
import { Sliders, Palette, Server, Clock, Cpu, Activity, Shield, Database, BarChart2, Settings } from 'lucide-react';
import EnterpriseNotificationSettingsView from './EnterpriseNotificationSettingsView';
import NotificationBrandingView from './NotificationBrandingView';
import ProviderAndFailoverView from './ProviderAndFailoverView';
import SchedulerConsoleView from './SchedulerConsoleView';
import WorkerManagementView from './WorkerManagementView';
import DiagnosticsCenterView from './DiagnosticsCenterView';
import SandboxEnvironmentView from './SandboxEnvironmentView';
import BackupAndRestoreView from './BackupAndRestoreView';
import NotificationUsageDashboardView from './NotificationUsageDashboardView';
export default function NotificationOperationsCenter() {
    const [activeTab, setActiveTab] = useState('settings');
    return (<div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-500 rounded-2xl shadow-xl text-white">
            <Settings className="h-7 w-7"/>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-0.5">
              <span>Visitor Management System</span>
              <span>/</span>
              <span>Module 13</span>
              <span>/</span>
              <span className="text-cyan-400 font-bold">Final Enhancement – Operations Center</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Enterprise Administrator Notification Operations Center</h1>
          </div>
        </div>

        {/* Master Navigation Bar */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex-wrap gap-1">
          {[
            { id: 'settings', label: 'Settings (§1)', icon: Sliders },
            { id: 'branding', label: 'Branding (§2)', icon: Palette },
            { id: 'providers', label: 'Providers (§3, §4)', icon: Server },
            { id: 'scheduler', label: 'Scheduler (§5)', icon: Clock },
            { id: 'workers', label: 'Workers (§6)', icon: Cpu },
            { id: 'diagnostics', label: 'Diagnostics (§7)', icon: Activity },
            { id: 'sandbox', label: 'Sandbox (§8)', icon: Shield },
            { id: 'backup', label: 'Backup (§9)', icon: Database },
            { id: 'usage', label: 'Usage (§10)', icon: BarChart2 }
        ].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                : 'text-slate-400 hover:text-slate-200'}`}>
              <t.icon className="h-4 w-4"/>
              <span>{t.label}</span>
            </button>))}
        </div>
      </div>

      {/* Render Selected View */}
      {activeTab === 'settings' && <EnterpriseNotificationSettingsView />}
      {activeTab === 'branding' && <NotificationBrandingView />}
      {activeTab === 'providers' && <ProviderAndFailoverView />}
      {activeTab === 'scheduler' && <SchedulerConsoleView />}
      {activeTab === 'workers' && <WorkerManagementView />}
      {activeTab === 'diagnostics' && <DiagnosticsCenterView />}
      {activeTab === 'sandbox' && <SandboxEnvironmentView />}
      {activeTab === 'backup' && <BackupAndRestoreView />}
      {activeTab === 'usage' && <NotificationUsageDashboardView />}
    </div>);
}
