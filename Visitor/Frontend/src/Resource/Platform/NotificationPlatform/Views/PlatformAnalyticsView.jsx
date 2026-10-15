import React from 'react';
import { BarChart3 } from 'lucide-react';
const PlatformAnalyticsView = () => {
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400"/> Platform Notification Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">System-wide notification metrics, delivery latency, and channel distribution analytics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 font-medium block">Total Events Published</span>
          <h3 className="text-2xl font-black text-white mt-1">1,420</h3>
          <span className="text-slate-500 text-[11px]">Today</span>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 font-medium block">Notifications Delivered</span>
          <h3 className="text-2xl font-black text-white mt-1">4,890</h3>
          <span className="text-emerald-400 text-[11px]">99.4% Success Rate</span>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 font-medium block">Avg Delivery Latency</span>
          <h3 className="text-2xl font-black text-white mt-1">140 ms</h3>
          <span className="text-blue-400 text-[11px]">High Latency SLA OK</span>
        </div>
      </div>
    </div>);
};
export default PlatformAnalyticsView;
