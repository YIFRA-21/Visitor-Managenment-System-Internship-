import React, { useState } from 'react';
import { LayoutDashboard, Search, Sliders, ShieldCheck, Award, Users, ShieldAlert, CheckSquare, Calendar } from 'lucide-react';
import ExecutiveDashboard from './ExecutiveDashboard';
import AuditorDashboard from './AuditorDashboard';
import WidgetCustomizerModal from './WidgetCustomizerModal';
import GlobalSearchModal from './GlobalSearchModal';
// Existing Role Dashboard Imports
import AdminDashboard from '../Admin/AdminDashboard';
import SecurityDashboard from '../Security/SecurityDashboard';
import ReceptionDashboard from '../Receptionist/ReceptionDashboard';
import EmployeeDashboard from '../Employee/EmployeeDashboard';
import VisitorDashboard from '../Visitor/VisitorDashboard';
import { useLanguage } from '../../contexts/LanguageContext';

export default function UniversalDashboardDispatcher({ onNavigate }) {
    const { t } = useLanguage();
    const [activeRoleWorkspace, setActiveRoleWorkspace] = useState('admin');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
    const [widgets, setWidgets] = useState([
        { id: 'kpi_visits', name: 'Today\'s Total Visitors', category: 'Operational', enabled: true },
        { id: 'kpi_occupancy', name: 'Live Occupancy Gauge', category: 'Operational', enabled: true },
        { id: 'kpi_security', name: 'Security Alerts Ticker', category: 'Security', enabled: true },
        { id: 'kpi_approvals', name: 'Pending Approvals Counter', category: 'Workflow', enabled: true },
        { id: 'kpi_audit', name: 'Real-Time Audit Feed', category: 'Compliance', enabled: true },
    ]);
    const workspaces = [
        { id: 'admin', label: 'System Admin Workspace', icon: LayoutDashboard },
        { id: 'executive', label: 'Executive C-Suite', icon: Award },
        { id: 'security', label: 'Security & Access Control', icon: ShieldAlert },
        { id: 'reception', label: 'Reception & Check-In', icon: CheckSquare },
        { id: 'employee', label: 'Employee & Host Portal', icon: Users },
        { id: 'visitor', label: 'Visitor Workspace', icon: Calendar },
        { id: 'auditor', label: 'Compliance & Audit', icon: ShieldCheck },
    ];
    const handleCustomizerSave = (updated) => {
        setWidgets(updated);
    };
    return (<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Workspace & Control Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">{t('dashboard.workspace', 'Workspace')}:</span>
          {workspaces.map(w => {
            const Icon = w.icon;
            const active = activeRoleWorkspace === w.id;
            return (<button key={w.id} onClick={() => setActiveRoleWorkspace(w.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${active ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                <Icon className="h-3.5 w-3.5"/> {t('roleWorkspace.' + w.id, w.label)}
              </button>);
        })}
        </div>

        <div className="flex items-center gap-2">
          {/* Universal Search Button */}
          <button onClick={() => setIsSearchOpen(true)} className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <Search className="h-3.5 w-3.5 text-slate-400"/>
            <span className="hidden sm:inline">{t('form.search', 'Search...')}</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono">Ctrl K</kbd>
          </button>

          {/* Layout Customizer Button */}
          <button onClick={() => setIsCustomizerOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            <Sliders className="h-3.5 w-3.5 text-indigo-500"/> {t('dashboard.customizeLayout', 'Customize Layout')}
          </button>
        </div>
      </div>

      {/* Render Workspace */}
      <div className="flex-1 p-2 md:p-4">
        {activeRoleWorkspace === 'admin' && <AdminDashboard />}
        {activeRoleWorkspace === 'executive' && <ExecutiveDashboard onNavigate={onNavigate}/>}
        {activeRoleWorkspace === 'security' && <SecurityDashboard />}
        {activeRoleWorkspace === 'reception' && <ReceptionDashboard />}
        {activeRoleWorkspace === 'employee' && <EmployeeDashboard />}
        {activeRoleWorkspace === 'visitor' && <VisitorDashboard />}
        {activeRoleWorkspace === 'auditor' && <AuditorDashboard onNavigate={onNavigate}/>}
      </div>

      {/* Global Command Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onNavigate={(link) => onNavigate?.(link.replace('/', ''))}/>

      {/* Widget Layout Customizer Modal */}
      <WidgetCustomizerModal isOpen={isCustomizerOpen} onClose={() => setIsCustomizerOpen(false)} widgets={widgets} onSave={handleCustomizerSave}/>
    </div>);
}
