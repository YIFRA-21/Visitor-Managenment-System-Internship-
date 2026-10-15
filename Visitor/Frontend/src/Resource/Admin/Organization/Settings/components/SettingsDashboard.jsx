import { ToggleLeft, Bell, Key, RefreshCw, Database, History, HardDriveDownload, Settings } from 'lucide-react';
export default function SettingsDashboard({ settings, onNavigate, backupsCount, historyCount }) {
    // Compute counts
    const enabledFeatures = Object.values(settings?.features || {}).filter(Boolean).length;
    const activeNotifications = Object.values(settings?.notifications?.email || {}).filter(Boolean).length;
    const connectedIntegrations = Object.values(settings?.integrations || {}).filter(val => val !== '').length;
    const cards = [
        { label: 'Organization Status', value: 'ACTIVE', desc: 'Active in hierarchy scope', icon: <ToggleLeft className="h-5 w-5 text-emerald-500"/>, bg: 'rgba(16,185,129,0.08)' },
        { label: 'Active Configurations', value: '9 Profiles', desc: 'Scope system limits', icon: <Key className="h-5 w-5 text-blue-500"/>, bg: 'rgba(59,130,246,0.08)' },
        { label: 'Enabled Features', value: enabledFeatures, desc: 'Switches currently active', icon: <ToggleLeft className="h-5 w-5 text-purple-500"/>, bg: 'rgba(139,92,246,0.08)' },
        { label: 'Active Integrations', value: connectedIntegrations, desc: 'External SMTP / SMS APIs', icon: <RefreshCw className="h-5 w-5 text-cyan-500"/>, bg: 'rgba(6,182,212,0.08)' },
        { label: 'Notification Events', value: activeNotifications, desc: 'Email/SMS channel flags', icon: <Bell className="h-5 w-5 text-amber-500"/>, bg: 'rgba(245,158,11,0.08)' },
        { label: 'Settings Snapshots', value: backupsCount, desc: 'Database backup count', icon: <Database className="h-5 w-5 text-slate-500"/>, bg: 'rgba(148,163,184,0.08)' }
    ];
    return (<div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="row g-3">
        {cards.map((c, i) => (<div key={i} className="col-12 col-md-4 col-xl-2">
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm h-100 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-start">
                <span className="text-[10px] uppercase font-bold text-slate-400">{c.label}</span>
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: c.bg }}>
                  {c.icon}
                </div>
              </div>
              <div className="mt-2">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{c.value}</span>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold leading-tight">{c.desc}</p>
              </div>
            </div>
          </div>))}
      </div>

      {/* Visual Analytics */}
      <div className="row g-4">
        {/* Category Share chart */}
        <div className="col-12 col-lg-8">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm h-100">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-3">
              Settings Profile Distribution
            </h3>
            <p className="text-xxs text-slate-400 font-semibold mb-4">Quantity of specific configurations mapped under each organization subdomain.</p>

            <div className="d-flex align-items-end justify-content-between pt-6 px-4" style={{ height: '150px' }}>
              {[
            { label: 'General', val: 9, color: '#3b82f6' },
            { label: 'Local', val: 8, color: '#10b981' },
            { label: 'Visitor', val: 8, color: '#8b5cf6' },
            { label: 'Security', val: 8, color: '#f59e0b' },
            { label: 'Notif', val: 24, color: '#ec4899' },
            { label: 'Number', val: 6, color: '#06b6d4' },
            { label: 'Integr', val: 6, color: '#64748b' }
        ].map((item, i) => {
            const percent = (item.val / 28) * 100;
            return (<div key={i} className="d-flex flex-column align-items-center flex-grow-1">
                    <span className="text-[9px] font-bold text-slate-500 mb-1">{item.val}</span>
                    <div className="w-50 rounded-t" style={{
                    height: `${percent * 1.2}px`,
                    background: item.color,
                    minHeight: '10px'
                }}/>
                    <span className="text-[9px] font-bold text-slate-455 mt-2">{item.label}</span>
                  </div>);
        })}
            </div>
          </div>
        </div>

        {/* Categories checklist summary */}
        <div className="col-12 col-lg-4">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3 h-100">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white border-bottom pb-2 dark:border-slate-800 mb-0">
              System Audit Highlights
            </h3>

            <div className="space-y-2 text-xs font-semibold text-slate-650 dark:text-slate-350">
              <div className="d-flex align-items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"/>
                <div>
                  <p className="mb-0 text-slate-850 dark:text-slate-100 font-bold">Localization Compliance Passed</p>
                  <p className="text-[9px] text-slate-400 mb-0">Standard timezone & calendar rules fully active.</p>
                </div>
              </div>
              <div className="d-flex align-items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0"/>
                <div>
                  <p className="mb-0 text-slate-850 dark:text-slate-100 font-bold">Import logs secure</p>
                  <p className="text-[9px] text-slate-400 mb-0">JSON profiles import validations verified.</p>
                </div>
              </div>
              <div className="d-flex align-items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5 shrink-0"/>
                <div>
                  <p className="mb-0 text-slate-850 dark:text-slate-100 font-bold">Audit retention active</p>
                  <p className="text-[9px] text-slate-400 mb-0">Logs archived daily. Inactive clean-up enabled.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Card */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white mb-4">
          Quick Actions Shortcut Panels
        </h3>

        <div className="row g-3">
          {[
            { label: 'Edit Configuration Profile', view: 'general', desc: 'Configure default date formats, local currency, language, and tz limits.', icon: <Settings className="h-5 w-5 text-blue-500"/> },
            { label: 'Visitor Check-in Rules', view: 'visitor', desc: 'Toggle walk-in, appointment rules, badges templates, and photo verification.', icon: <ToggleLeft className="h-5 w-5 text-purple-500"/> },
            { label: 'System Integration Config', view: 'integrations', desc: 'Save API gateway keys, Webhook routing links, and active SMTP rules.', icon: <RefreshCw className="h-5 w-5 text-cyan-500"/> },
            { label: 'Import / Export JSON Profiles', view: 'import-export', desc: 'Export full active parameters to desktop or upload configuration snapshots.', icon: <HardDriveDownload className="h-5 w-5 text-emerald-500"/> },
            { label: 'State Snapshot Backups', view: 'backups', desc: 'Restore database configurations or generate restore backups.', icon: <Database className="h-5 w-5 text-amber-500"/> },
            { label: 'Settings Mutation Logs', view: 'history', desc: 'Browse historical settings changes with changed fields, reasons, and editors.', icon: <History className="h-5 w-5 text-slate-500"/> }
        ].map((act, i) => (<div key={i} className="col-12 col-md-6 col-lg-4">
              <button onClick={() => onNavigate(act.view)} className="w-100 text-start bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-xl p-4 transition-all duration-200 d-flex gap-3 align-items-start">
                <div className="p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xxs">
                  {act.icon}
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">{act.label}</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold leading-normal">{act.desc}</p>
                </div>
              </button>
            </div>))}
        </div>
      </div>
    </div>);
}
