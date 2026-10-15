import React from 'react';
import { ShieldAlert, AlertOctagon, UserCheck, Building, Clock, Eye, Lock, Siren, Users, Compass, HardDrive, Briefcase, ArrowRight, Activity } from 'lucide-react';
const SecurityDashboardView = ({ onNavigate }) => {
    const kpiCards = [
        { title: 'Active Security Alerts', count: '4', sub: '2 Unacknowledged', icon: ShieldAlert, color: 'border-red-500/30 text-red-400 bg-red-500/10', tab: 'inbox' },
        { title: 'Critical Alerts', count: '1', sub: 'Blacklist Match', icon: AlertOctagon, color: 'border-red-600/40 text-red-500 bg-red-600/20', tab: 'watchlist' },
        { title: 'Visitors Clearance Req.', count: '2', sub: 'High Security VIP', icon: UserCheck, color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10', tab: 'checkin_sec' },
        { title: 'Visitors Inside Buildings', count: '48', sub: 'HQ Main Campus', icon: Building, color: 'border-blue-500/30 text-blue-400 bg-blue-500/10', tab: 'visitor_sec' },
        { title: 'Visitors Overdue', count: '3', sub: 'Exceeded Duration', icon: Clock, color: 'border-amber-500/30 text-amber-400 bg-amber-500/10', tab: 'checkout_sec' },
        { title: 'Watchlist Matches', count: '1', sub: 'Entry #WL-804', icon: Eye, color: 'border-purple-500/30 text-purple-400 bg-purple-500/10', tab: 'watchlist' },
        { title: 'Access Violations', count: '2', sub: 'Door Forced Open', icon: Lock, color: 'border-orange-500/30 text-orange-400 bg-orange-500/10', tab: 'restricted' },
        { title: 'Emergency Incidents', count: '1', sub: 'Panic Alarm #1', icon: Siren, color: 'border-red-500/40 text-red-400 bg-red-500/20', tab: 'emergency' },
        { title: 'Escort Requests', count: '2', sub: 'Diplomatic Escort', icon: Users, color: 'border-pink-500/30 text-pink-400 bg-pink-500/10', tab: 'escort' },
        { title: 'Active Patrols', count: '3', sub: 'Shift Alpha On Duty', icon: Compass, color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10', tab: 'patrol' },
        { title: 'Device Health', count: '98.5%', sub: '1 Camera Offline', icon: HardDrive, color: 'border-teal-500/30 text-teal-400 bg-teal-500/10', tab: 'equipment' },
        { title: 'Active Investigations', count: '1', sub: 'Case #CASE-8001', icon: Briefcase, color: 'border-violet-500/30 text-violet-400 bg-violet-500/10', tab: 'investigation' }
    ];
    return (<div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Security Operations Command Overview</h2>
        <p className="text-xs text-slate-400 mt-0.5">Real-time awareness for access control, watchlist hits, emergency alarms, and patrol status.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (<div key={idx} onClick={() => onNavigate(kpi.tab)} className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:scale-[1.02] cursor-pointer shadow-lg group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 font-medium">{kpi.title}</p>
                  <h3 className="text-2xl font-black text-white mt-1 group-hover:text-red-400 transition-colors">{kpi.count}</h3>
                </div>
                <div className={`p-2.5 rounded-xl border ${kpi.color}`}>
                  <Icon className="w-5 h-5"/>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800/60 text-xs">
                <span className="text-slate-400 font-medium">{kpi.sub}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all"/>
              </div>
            </div>);
        })}
      </div>

      {/* Live Timeline & SOC Quick Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-400"/> Security Operations Live Event Stream
            </h3>
            <span className="text-xs text-slate-400">Live Socket Updates</span>
          </div>

          <div className="space-y-3">
            {[
            { time: '2m ago', title: 'Blacklist Watchlist Hit', desc: 'Arthur Pendelton matched Watchlist Entry #WL-804 at Turnstile #3.', tag: 'Critical', tagCol: 'bg-red-500/20 text-red-400 border-red-500/40' },
            { time: '8m ago', title: 'Door Forced Open Alarm', desc: 'Sensor #D-402 (Server Room Annex B) forced open.', tag: 'High', tagCol: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
            { time: '10m ago', title: 'Reception Silent Panic Alert', desc: 'Triggered at Reception Desk #1. Guard #4 dispatched.', tag: 'Emergency', tagCol: 'bg-red-500/10 text-red-400 border-red-500/30' },
            { time: '25m ago', title: 'Visitor Overstay Alert', desc: 'Contractor Michael Brown overdue by 45 mins in Exec Suite.', tag: 'Overstay', tagCol: 'bg-amber-500/10 text-amber-400 border-amber-500/30' }
        ].map((act, i) => (<div key={i} className="flex items-start justify-between bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{act.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${act.tagCol}`}>{act.tag}</span>
                  </div>
                  <p className="text-slate-400 mt-1">{act.desc}</p>
                </div>
                <span className="text-slate-500 text-[11px] whitespace-nowrap">{act.time}</span>
              </div>))}
          </div>
        </div>

        {/* SOC Quick Response Controls */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400"/> SOC Quick Response Controls
          </h3>

          <button onClick={() => onNavigate('emergency')} className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 font-semibold p-3 rounded-lg text-xs flex items-center justify-between transition-all">
            <span>Dispatch Emergency Lockdown</span>
            <ArrowRight className="w-4 h-4"/>
          </button>

          <button onClick={() => onNavigate('investigation')} className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 font-semibold p-3 rounded-lg text-xs flex items-center justify-between transition-all">
            <span>Open Investigation Case</span>
            <ArrowRight className="w-4 h-4"/>
          </button>

          <button onClick={() => onNavigate('dispatch')} className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-semibold p-3 rounded-lg text-xs flex items-center justify-between transition-all">
            <span>Issue Security Alert Broadcast</span>
            <ArrowRight className="w-4 h-4"/>
          </button>

          <button onClick={() => onNavigate('reports')} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold p-3 rounded-lg text-xs flex items-center justify-between transition-all">
            <span>Export SOC Shift Incident Log</span>
            <ArrowRight className="w-4 h-4 text-slate-400"/>
          </button>
        </div>
      </div>
    </div>);
};
export default SecurityDashboardView;
