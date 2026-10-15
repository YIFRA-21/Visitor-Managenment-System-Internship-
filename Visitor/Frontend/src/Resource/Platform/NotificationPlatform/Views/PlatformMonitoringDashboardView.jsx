import React from 'react';
import { Monitor, Cpu, Database, Network } from 'lucide-react';
const PlatformMonitoringDashboardView = () => {
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Monitor className="w-5 h-5 text-blue-400"/> Platform Infrastructure & Gateway Health
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Real-time health monitoring of Notification Engine, Queue Workers, Database Pool, and Socket.IO.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <Cpu className="w-4 h-4 text-blue-400"/> Worker Process Memory
          </div>
          <h3 className="text-xl font-bold text-white">124 MB / 512 MB</h3>
          <span className="text-emerald-400 text-[11px]">CPU Usage: 2.1%</span>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <Database className="w-4 h-4 text-purple-400"/> MySQL Pool Connections
          </div>
          <h3 className="text-xl font-bold text-white">4 Active / 20 Pool</h3>
          <span className="text-emerald-400 text-[11px]">Query Latency: 4ms</span>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <Network className="w-4 h-4 text-teal-400"/> Socket.IO Gateway Clients
          </div>
          <h3 className="text-xl font-bold text-white">84 Connected Sockets</h3>
          <span className="text-emerald-400 text-[11px]">Heartbeat OK</span>
        </div>
      </div>
    </div>);
};
export default PlatformMonitoringDashboardView;
