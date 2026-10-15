import React from 'react';
import { Zap, Sliders, Server, Activity, ArrowRight } from 'lucide-react';
const PlatformDashboardView = ({ onNavigate }) => {
    const kpis = [
        { title: 'Events Processed Today', val: '1,420', sub: '16 Active Types', icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', tab: 'events' },
        { title: 'Notifications Delivered', val: '4,890', sub: '99.4% Success Rate', icon: Activity, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', tab: 'delivery' },
        { title: 'Active Platform Rules', val: '3', sub: 'Rule Engine OK', icon: Sliders, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', tab: 'rules' },
        { title: 'Provider Status', val: '4/4 Healthy', icon: Server, color: 'text-teal-400 bg-teal-500/10 border-teal-500/30', tab: 'providers' }
    ];
    return (<div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Enterprise Notification Platform Dashboard</h2>
        <p className="text-xs text-slate-400 mt-0.5">Centralized event-driven architecture overview, delivery statistics, and provider health.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (<div key={idx} onClick={() => onNavigate(kpi.tab)} className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:scale-[1.02] cursor-pointer group shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 font-medium">{kpi.title}</p>
                  <h3 className="text-2xl font-black text-white mt-1 group-hover:text-blue-400 transition-colors">{kpi.val}</h3>
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

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400"/> Platform Architecture & Integration Flow
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The Enterprise System Notification Platform serves as the single event bus for all modules (Authentication, Visitor, Appointment, Reception, Security, Admin). Business events published into the platform are dynamically matched against configurable rules, resolved via RBAC permissions, and delivered through multi-channel fallbacks (In-App, Socket.IO, Email, SMS, Webhook).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button onClick={() => onNavigate('events')} className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-semibold p-3 rounded-lg text-xs flex items-center justify-between transition-all">
            <span>Explore Business Events</span>
            <ArrowRight className="w-4 h-4"/>
          </button>
          <button onClick={() => onNavigate('rules')} className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 font-semibold p-3 rounded-lg text-xs flex items-center justify-between transition-all">
            <span>Configure Rule Engine</span>
            <ArrowRight className="w-4 h-4"/>
          </button>
          <button onClick={() => onNavigate('providers')} className="bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 text-teal-300 font-semibold p-3 rounded-lg text-xs flex items-center justify-between transition-all">
            <span>Inspect Provider Failover</span>
            <ArrowRight className="w-4 h-4"/>
          </button>
        </div>
      </div>
    </div>);
};
export default PlatformDashboardView;
