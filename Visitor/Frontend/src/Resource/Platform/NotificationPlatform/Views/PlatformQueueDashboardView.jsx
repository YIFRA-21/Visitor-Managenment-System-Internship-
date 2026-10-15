import React from 'react';
import { Layers } from 'lucide-react';
const PlatformQueueDashboardView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-teal-400"/> Queue Engine & Worker Concurrency Dashboard
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Monitor active queue depth, worker concurrency, retries, and dead-letter queues.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 block font-medium">High-Priority Queue Depth</span>
          <span className="text-2xl font-black text-white mt-1 block">0 Jobs</span>
          <span className="text-emerald-400 text-[11px]">Worker Concurrency: 8</span>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 block font-medium">Default Bulk Queue Depth</span>
          <span className="text-2xl font-black text-white mt-1 block">3 Jobs</span>
          <span className="text-blue-400 text-[11px]">Worker Concurrency: 4</span>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 block font-medium">Failed / Dead-Letter Queue</span>
          <span className="text-2xl font-black text-white mt-1 block">0 Jobs</span>
          <span className="text-emerald-400 text-[11px]">Retry Policy OK</span>
        </div>
      </div>
    </div>);
};
export default PlatformQueueDashboardView;
