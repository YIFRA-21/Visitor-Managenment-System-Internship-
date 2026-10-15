import React from 'react';
import { Activity, Zap, Server, BarChart2 } from 'lucide-react';
export default function PerformanceMonitoring() {
    return (<div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="h-5 w-5"/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Performance & Telemetry Monitor</h1>
            <p className="text-xs text-slate-400">Real-time latency metrics, memory profiling, database query response times</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg API Latency</span>
          <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">18.4 ms</div>
          <p className="text-[11px] text-slate-400 mt-1">99.8th Percentile: <span className="text-white">45 ms</span></p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">DB Query Latency</span>
          <div className="text-3xl font-black text-cyan-400 mt-2 font-mono">4.2 ms</div>
          <p className="text-[11px] text-slate-400 mt-1">Pool Connections: <span className="text-white">8 / 20</span></p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">HTTP Throughput</span>
          <div className="text-3xl font-black text-indigo-400 mt-2 font-mono">142 req/s</div>
          <p className="text-[11px] text-slate-400 mt-1">Peak: <span className="text-white">380 req/s</span></p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Error Rate (5xx)</span>
          <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">0.00 %</div>
          <p className="text-[11px] text-slate-400 mt-1">Zero 5xx in last 24h</p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <BarChart2 className="h-4 w-4 text-emerald-400"/> Active System Threads & Telemetry Nodes
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl text-xs border border-slate-800/80">
            <span className="text-slate-200 font-semibold flex items-center gap-2"><Server className="h-4 w-4 text-indigo-400"/> Node Express Application Thread #1</span>
            <span className="font-mono text-emerald-400">RUNNING | CPU 14% | RAM 124MB</span>
          </div>
          <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl text-xs border border-slate-800/80">
            <span className="text-slate-200 font-semibold flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-400"/> Socket.IO Event Dispatcher</span>
            <span className="font-mono text-emerald-400">ACTIVE | 12 Connected Clients</span>
          </div>
        </div>
      </div>
    </div>);
}
