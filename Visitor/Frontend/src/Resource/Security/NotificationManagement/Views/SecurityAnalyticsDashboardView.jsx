import React from 'react';
import { BarChart3, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
const SecurityAnalyticsDashboardView = () => {
    const metrics = [
        { label: 'Avg Security Response Time', value: '2.1 min', trend: '-0.4m vs target', icon: Clock, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
        { label: 'Incident Resolution Rate', value: '96.2%', trend: '48/50 Closed', icon: CheckCircle2, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
        { label: 'Watchlist / Blacklist Matches', value: '4', trend: '1 Active Today', icon: ShieldAlert, color: 'text-red-400 bg-red-500/10 border-red-500/30' }
    ];
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-red-400"/> SOC Analytics & Performance Dashboard
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Real-time security response metrics, incident resolution trends, and patrol performance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Hourly Security Alert Volume Placeholder */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Hourly Security Alert Volume (Today)</h3>
        <div className="flex items-end gap-2 h-32">
          {[1, 3, 2, 6, 4, 3, 5, 2, 1].map((val, i) => (<div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-red-500/30 border border-red-500/40 rounded-t-md transition-all hover:bg-red-500/50" style={{ height: `${(val / 6) * 100}%` }}/>
              <span className="text-[10px] text-slate-500">{8 + i}:00</span>
            </div>))}
        </div>
      </div>
    </div>);
};
export default SecurityAnalyticsDashboardView;
