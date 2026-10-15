import React, { useState } from 'react';
import VisitorHomeSidebar from './components/VisitorHomeSidebar';
import VisitorList from '../List/VisitorList';
import VisitorApprovals from '../Approvals/VisitorApprovals';
import VisitorPolicySettings from '../Policy/VisitorPolicySettings';
import VisitorWatchlist from '../Watchlist/VisitorWatchlist';
import VisitorActivityLogs from '../Logs/VisitorActivityLogs';
import VisitorAnalytics from '../Analytics/VisitorAnalytics';
import VisitorSettings from '../Settings/VisitorSettings';
export default function VisitorManagementHome() {
    const [currentView, setCurrentView] = useState('visitor_mgmt_overview');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const renderActiveView = () => {
        switch (currentView) {
            case 'visitor_list':
                return <VisitorList />;
            case 'visitor_approvals':
                return <VisitorApprovals />;
            case 'visitor_watchlist':
                return <VisitorWatchlist />;
            case 'visitor_activity_logs':
                return <VisitorActivityLogs />;
            case 'visitor_policy':
                return <VisitorPolicySettings />;
            case 'visitor_analytics':
                return <VisitorAnalytics />;
            case 'visitor_settings':
                return <VisitorSettings />;
            case 'visitor_mgmt_overview':
            default:
                return (<div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div onClick={() => setCurrentView('visitor_list')} className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] group">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Total Visitors</div>
                  <i className="bi bi-people text-indigo-400 text-xl"></i>
                </div>
                <div className="text-3xl font-black text-white mt-2">1,482</div>
                <div className="text-[11px] text-indigo-400 font-semibold group-hover:underline mt-2">
                  View Directory &rarr;
                </div>
              </div>

              <div onClick={() => setCurrentView('visitor_approvals')} className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] group">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Pending Approvals</div>
                  <i className="bi bi-clock-history text-amber-400 text-xl"></i>
                </div>
                <div className="text-3xl font-black text-amber-400 mt-2">8</div>
                <div className="text-[11px] text-amber-400 font-semibold group-hover:underline mt-2">
                  Review Queue &rarr;
                </div>
              </div>

              <div onClick={() => setCurrentView('visitor_watchlist')} className="bg-slate-900 border border-slate-800 hover:border-rose-500/50 p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] group">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Watchlist Alerts</div>
                  <i className="bi bi-shield-exclamation text-rose-400 text-xl"></i>
                </div>
                <div className="text-3xl font-black text-rose-400 mt-2">3</div>
                <div className="text-[11px] text-rose-400 font-semibold group-hover:underline mt-2">
                  Manage Alerts &rarr;
                </div>
              </div>

              <div onClick={() => setCurrentView('visitor_activity_logs')} className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] group">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Checked-In Now</div>
                  <i className="bi bi-person-check text-emerald-400 text-xl"></i>
                </div>
                <div className="text-3xl font-black text-emerald-400 mt-2">24</div>
                <div className="text-[11px] text-emerald-400 font-semibold group-hover:underline mt-2">
                  View Movement Logs &rarr;
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3 flex items-center gap-2">
                <i className="bi bi-sliders text-indigo-400"></i> Admin Visitor Management Modules
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div onClick={() => setCurrentView('visitor_list')} className="bg-slate-950 border border-slate-800 hover:border-indigo-500/60 p-4 rounded-xl cursor-pointer transition-all space-y-1 hover:bg-slate-800/40">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <i className="bi bi-people text-indigo-400"></i> Visitor Directory
                  </div>
                  <p className="text-xs text-slate-400">Search, view, filter, and export all visitor records.</p>
                </div>

                <div onClick={() => setCurrentView('visitor_policy')} className="bg-slate-950 border border-slate-800 hover:border-indigo-500/60 p-4 rounded-xl cursor-pointer transition-all space-y-1 hover:bg-slate-800/40">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <i className="bi bi-shield-check text-indigo-400"></i> Security Rules & Policy
                  </div>
                  <p className="text-xs text-slate-400">Set NDA requirements, stay limits, and ID upload rules.</p>
                </div>

                <div onClick={() => setCurrentView('visitor_analytics')} className="bg-slate-950 border border-slate-800 hover:border-indigo-500/60 p-4 rounded-xl cursor-pointer transition-all space-y-1 hover:bg-slate-800/40">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <i className="bi bi-bar-chart-line text-indigo-400"></i> Visitor Analytics
                  </div>
                  <p className="text-xs text-slate-400">View peak traffic hours, category distribution, and trends.</p>
                </div>
              </div>
            </div>
          </div>);
        }
    };
    return (<div className="vms-visitor-mgmt-home space-y-6">
      {/* Top Title Banner */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <i className="bi bi-building-gear"></i> Administration Resource Center
          </div>
          <h1 className="text-2xl font-black text-white">Visitor Management Hub</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise administration control panel for visitor directory, security policies, watchlist, and approvals.
          </p>
        </div>

        {/* Quick Nav Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { key: 'visitor_mgmt_overview', label: 'Overview', icon: 'bi-grid' },
            { key: 'visitor_list', label: 'Directory', icon: 'bi-people' },
            { key: 'visitor_approvals', label: 'Approvals', icon: 'bi-check-square' },
            { key: 'visitor_policy', label: 'Policy Rules', icon: 'bi-shield' },
            { key: 'visitor_watchlist', label: 'Watchlist', icon: 'bi-slash-circle' },
        ].map((tab) => (<button key={tab.key} onClick={() => setCurrentView(tab.key)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${currentView === tab.key
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}>
              <i className={`bi ${tab.icon}`}></i> {tab.label}
            </button>))}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className={sidebarCollapsed ? 'lg:col-span-1' : 'lg:col-span-3'}>
          <VisitorHomeSidebar currentView={currentView} onNavigate={(vk) => setCurrentView(vk)} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}/>
        </div>

        {/* Right Dynamic View Content */}
        <div className={sidebarCollapsed ? 'lg:col-span-11' : 'lg:col-span-9'}>{renderActiveView()}</div>
      </div>
    </div>);
}
