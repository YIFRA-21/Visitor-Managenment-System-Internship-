import React from 'react';
import { BarChart3 } from 'lucide-react';
const ManagerAnalyticsDashboardView = () => {
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400"/> Manager Analytics & SLA Metrics
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Performance statistics, average approval response times, and notification delivery trends.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block font-medium">Notification Read Rate</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">92.5%</span>
          <span className="text-[11px] text-slate-500 mt-1 block">+4.2% from last week</span>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block font-medium">Avg Approval Response Time</span>
          <span className="text-2xl font-black text-blue-400 mt-1 block">18.4 mins</span>
          <span className="text-[11px] text-slate-500 mt-1 block">Well within 60m SLA target</span>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block font-medium">Emergency Response SLA</span>
          <span className="text-2xl font-black text-purple-400 mt-1 block">100%</span>
          <span className="text-[11px] text-slate-500 mt-1 block">All alerts acknowledged &lt;5m</span>
        </div>
      </div>
    </div>);
};
export default ManagerAnalyticsDashboardView;
