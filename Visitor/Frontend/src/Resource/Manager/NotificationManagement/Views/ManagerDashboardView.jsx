import React from 'react';
import { Bell, CheckCircle2, Calendar, Siren, ShieldAlert, Clock, UserCheck, AlertTriangle, ArrowRight, TrendingUp, Activity } from 'lucide-react';
const ManagerDashboardView = ({ onNavigate }) => {
    const kpiCards = [
        { title: 'Unread Notifications', count: '4', sub: '2 High Priority', icon: Bell, color: 'border-blue-500/30 text-blue-400 bg-blue-500/10', tab: 'inbox' },
        { title: 'Pending Approvals', count: '2', sub: '1 Overdue SLA', icon: CheckCircle2, color: 'border-amber-500/30 text-amber-400 bg-amber-500/10', tab: 'approvals' },
        { title: 'Today\'s Visitors', count: '18', sub: '12 Checked In', icon: UserCheck, color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10', tab: 'visitors' },
        { title: 'Today\'s Appointments', count: '14', sub: '4 Remaining', icon: Calendar, color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10', tab: 'appointments' },
        { title: 'Emergency Alerts', count: '1', sub: 'Security Incident', icon: Siren, color: 'border-red-500/30 text-red-400 bg-red-500/10', tab: 'emergency' },
        { title: 'Escalated Items', count: '1', sub: 'Waiting >30m', icon: ShieldAlert, color: 'border-purple-500/30 text-purple-400 bg-purple-500/10', tab: 'escalations' },
        { title: 'Upcoming Meetings', count: '5', sub: 'Next at 14:00', icon: Clock, color: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10', tab: 'department' },
        { title: 'Expiring Passes', count: '3', sub: 'Expiring <15m', icon: AlertTriangle, color: 'border-orange-500/30 text-orange-400 bg-orange-500/10', tab: 'visitors' },
    ];
    return (<div className="space-y-6">
      {/* View Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Manager Operations Overview</h2>
        <p className="text-xs text-slate-400 mt-0.5">Real-time status of department visitors, appointments, approvals, and emergency alerts.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (<div key={idx} onClick={() => onNavigate(kpi.tab)} className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:scale-[1.02] cursor-pointer shadow-lg group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 font-medium">{kpi.title}</p>
                  <h3 className="text-2xl font-black text-white mt-1 group-hover:text-blue-400 transition-colors">{kpi.count}</h3>
                </div>
                <div className={`p-2.5 rounded-xl border ${kpi.color}`}>
                  <Icon className="w-5 h-5"/>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800/60 text-xs">
                <span className="text-slate-400 font-medium">{kpi.sub}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all"/>
              </div>
            </div>);
        })}
      </div>

      {/* Quick Action Dashboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Timeline */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400"/> Recent Department Activity Timeline
            </h3>
            <span className="text-xs text-slate-400">Live Socket Updates</span>
          </div>

          <div className="space-y-3">
            {[
            { time: '10m ago', title: 'Security Incident Acknowledged', desc: 'Manager acknowledged Zone C badge scanner alert.', tag: 'Emergency', tagCol: 'bg-red-500/10 text-red-400 border-red-500/30' },
            { time: '15m ago', title: 'VIP Visitor Registered', desc: 'Sarah Jenkins registered for David Miller (Host).', tag: 'Visitor', tagCol: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
            { time: '45m ago', title: 'After-Hours Access Submitted', desc: 'Contractor Team requested server access approval.', tag: 'Approval', tagCol: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
            { time: '2h ago', title: 'Visitor Checked Out', desc: 'Contractor John Vance completed inspection.', tag: 'Check-out', tagCol: 'bg-blue-500/10 text-blue-400 border-blue-500/30' }
        ].map((act, i) => (<div key={i} className="flex items-start justify-between bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{act.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${act.tagCol}`}>{act.tag}</span>
                  </div>
                  <p className="text-slate-400 mt-1">{act.desc}</p>
                </div>
                <span className="text-slate-500 text-[11px] whitespace-nowrap">{act.time}</span>
              </div>))}
          </div>
        </div>

        {/* Quick Operations Panel */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400"/> Manager Quick Controls
          </h3>

          <button onClick={() => onNavigate('broadcast')} className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-semibold p-3 rounded-lg text-xs flex items-center justify-between transition-all">
            <span>Send Department Broadcast</span>
            <ArrowRight className="w-4 h-4"/>
          </button>

          <button onClick={() => onNavigate('approvals')} className="w-full bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 font-semibold p-3 rounded-lg text-xs flex items-center justify-between transition-all">
            <span>Review Pending Approvals (2)</span>
            <ArrowRight className="w-4 h-4"/>
          </button>

          <button onClick={() => onNavigate('reports')} className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-semibold p-3 rounded-lg text-xs flex items-center justify-between transition-all">
            <span>Export Department PDF Report</span>
            <ArrowRight className="w-4 h-4"/>
          </button>

          <button onClick={() => onNavigate('preferences')} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold p-3 rounded-lg text-xs flex items-center justify-between transition-all">
            <span>Configure Quiet Hours & Alerts</span>
            <ArrowRight className="w-4 h-4 text-slate-400"/>
          </button>
        </div>
      </div>
    </div>);
};
export default ManagerDashboardView;
