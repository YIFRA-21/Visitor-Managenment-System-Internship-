import React from 'react';
import { BarChart3, Clock, Users, LogIn, ShieldAlert } from 'lucide-react';
const ReceptionAnalyticsDashboardView = () => {
    const metrics = [
        { label: 'Avg Visitor Waiting Time', value: '11.5 min', trend: '+2.1m vs yesterday', icon: Clock, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
        { label: 'Check-In Throughput / Hour', value: '16', trend: 'Peak: 22 (10:00 AM)', icon: LogIn, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
        { label: 'Avg Host Response Time', value: '4.8 min', trend: '-1.2m improvement', icon: Users, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
        { label: 'Security Incidents Today', value: '1', trend: 'Watchlist Match Resolved', icon: ShieldAlert, color: 'text-red-400 bg-red-500/10 border-red-500/30' }
    ];
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400"/> Front-Desk Analytics Dashboard
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Real-time reception performance metrics, visitor flow throughput, and host response analytics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
            const Icon = m.icon;
            return (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 font-medium">{m.label}</span>
                <div className={`p-2 rounded-lg border ${m.color}`}>
                  <Icon className="w-4 h-4"/>
                </div>
              </div>
              <h3 className="text-2xl font-black text-white">{m.value}</h3>
              <span className="text-slate-500 text-[11px] mt-1 block">{m.trend}</span>
            </div>);
        })}
      </div>

      {/* Hourly Check-In Chart Placeholder */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Hourly Check-In Volume (Today)</h3>
        <div className="flex items-end gap-2 h-32">
          {[4, 8, 14, 22, 18, 16, 12, 9, 6].map((val, i) => (<div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-emerald-500/30 border border-emerald-500/40 rounded-t-md transition-all hover:bg-emerald-500/50" style={{ height: `${(val / 22) * 100}%` }}/>
              <span className="text-[10px] text-slate-500">{8 + i}:00</span>
            </div>))}
        </div>
      </div>
    </div>);
};
export default ReceptionAnalyticsDashboardView;
