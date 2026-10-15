import React from 'react';
import { Bell, Clock, UserCheck, LogIn, LogOut, CreditCard, AlertTriangle, Users, Calendar, Layers, ShieldAlert, Siren, ArrowRight, Activity } from 'lucide-react';
const ReceptionDashboardView = ({ onNavigate }) => {
    const kpiCards = [
        { title: 'Unread Notifications', count: '5', sub: '2 High Priority', icon: Bell, color: 'border-blue-500/30 text-blue-400 bg-blue-500/10', tab: 'inbox' },
        { title: 'Visitors Waiting', count: '5', sub: '1 Overdue >15m', icon: Clock, color: 'border-amber-500/30 text-amber-400 bg-amber-500/10', tab: 'queue' },
        { title: 'Visitors Arrived Today', count: '32', sub: '28 Scheduled', icon: UserCheck, color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10', tab: 'visitor_arrival' },
        { title: 'Pending Check-Ins', count: '4', sub: '2 VIPs Pending', icon: LogIn, color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10', tab: 'checkin' },
        { title: 'Pending Check-Outs', count: '2', sub: '1 Overdue Return', icon: LogOut, color: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10', tab: 'checkout' },
        { title: 'Passes Ready / Active', count: '6', sub: 'Automated Print', icon: CreditCard, color: 'border-purple-500/30 text-purple-400 bg-purple-500/10', tab: 'pass' },
        { title: 'Passes Expiring Soon', count: '3', sub: 'Expiring <15m', icon: AlertTriangle, color: 'border-orange-500/30 text-orange-400 bg-orange-500/10', tab: 'pass' },
        { title: 'Host Awaiting Response', count: '2', sub: 'David Miller', icon: Users, color: 'border-pink-500/30 text-pink-400 bg-pink-500/10', tab: 'host' },
        { title: 'Today\'s Appointments', count: '28', sub: '6 Remaining', icon: Calendar, color: 'border-teal-500/30 text-teal-400 bg-teal-500/10', tab: 'appointments' },
        { title: 'Queue Length', count: '5', sub: 'Avg wait: 11.5m', icon: Layers, color: 'border-violet-500/30 text-violet-400 bg-violet-500/10', tab: 'queue' },
        { title: 'Security Alerts', count: '1', sub: 'Blacklist Match', icon: ShieldAlert, color: 'border-red-500/30 text-red-400 bg-red-500/10', tab: 'security' },
        { title: 'Emergency Alerts', count: '0', sub: 'System All Clear', icon: Siren, color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10', tab: 'emergency' }
    ];
    return (<div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Front-Desk Operations Overview</h2>
        <p className="text-xs text-slate-400 mt-0.5">Real-time status of visitor arrivals, check-ins, waiting queues, and front-desk alerts.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (<div key={idx} onClick={() => onNavigate(kpi.tab)} className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:scale-[1.02] cursor-pointer shadow-lg group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 font-medium">{kpi.title}</p>
                  <h3 className="text-2xl font-black text-white mt-1 group-hover:text-emerald-400 transition-colors">{kpi.count}</h3>
                </div>
                <div className={`p-2.5 rounded-xl border ${kpi.color}`}>
                  <Icon className="w-5 h-5"/>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800/60 text-xs">
                <span className="text-slate-400 font-medium">{kpi.sub}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all"/>
              </div>
            </div>);
        })}
      </div>

      {/* Live Timeline & Front Desk Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400"/> Front-Desk Real-Time Activity Timeline
            </h3>
            <span className="text-xs text-slate-400">Live Socket Updates</span>
          </div>

          <div className="space-y-3">
            {[
            { time: '5m ago', title: 'VIP Visitor Arrived', desc: 'Ambassador Elena Rostova arrived at Main Plaza Reception.', tag: 'Arrival', tagCol: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
            { time: '12m ago', title: 'Badge Printed Automatically', desc: 'Temporary Badge V-1044 ready for John Vance.', tag: 'Pass', tagCol: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
            { time: '18m ago', title: 'Queue Threshold Warning', desc: '3 visitors waiting over 15 minutes at Desk #1.', tag: 'Queue', tagCol: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
            { time: '25m ago', title: 'Host Confirmed Escort', desc: 'David Miller coming down to lobby to meet Sarah Jenkins.', tag: 'Host', tagCol: 'bg-blue-500/10 text-blue-400 border-blue-500/30' }
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

        {/* Quick Operations Controls */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <LogIn className="w-4 h-4 text-cyan-400"/> Front-Desk Quick Controls
          </h3>

          <button onClick={() => onNavigate('checkin')} className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-semibold p-3 rounded-lg text-xs flex items-center justify-between transition-all">
            <span>Process Visitor Check-In</span>
            <ArrowRight className="w-4 h-4"/>
          </button>

          <button onClick={() => onNavigate('broadcast')} className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-semibold p-3 rounded-lg text-xs flex items-center justify-between transition-all">
            <span>Send Alert to Host Employee</span>
            <ArrowRight className="w-4 h-4"/>
          </button>

          <button onClick={() => onNavigate('queue')} className="w-full bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 font-semibold p-3 rounded-lg text-xs flex items-center justify-between transition-all">
            <span>Manage Waiting Queue (5)</span>
            <ArrowRight className="w-4 h-4"/>
          </button>

          <button onClick={() => onNavigate('reports')} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold p-3 rounded-lg text-xs flex items-center justify-between transition-all">
            <span>Export Daily Reception Report</span>
            <ArrowRight className="w-4 h-4 text-slate-400"/>
          </button>
        </div>
      </div>
    </div>);
};
export default ReceptionDashboardView;
