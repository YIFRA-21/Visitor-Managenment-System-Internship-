import React from 'react';
import { Cpu } from 'lucide-react';
export function DashboardCard({ title, value, subtext, icon: Icon, color = 'blue' }) {
    const colorMap = {
        blue: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
        emerald: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
        amber: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
        purple: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
        rose: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
        cyan: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10'
    };
    return (<div className={`p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 relative overflow-hidden`}>
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && <div className={`p-2 rounded-xl ${colorMap[color]}`}><Icon className="h-4 w-4"/></div>}
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      {subtext && <span className="text-[11px] text-slate-500 font-mono block">{subtext}</span>}
    </div>);
}
export function ProviderCard({ name, type, subType, status, latencyMs, priority, enabled, onTest, onToggle }) {
    return (<div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] text-slate-500 font-mono uppercase block">{type} • Priority {priority}</span>
          <h4 className="text-sm font-bold text-white mt-0.5">{name}</h4>
          <span className="text-xs text-slate-400 font-mono">{subType}</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
          {status}
        </span>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs font-mono">
        <span className="text-slate-500">Latency: <strong className="text-cyan-400">{latencyMs} ms</strong></span>
        <div className="flex space-x-2">
          <button onClick={onTest} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-sans font-bold">
            Test
          </button>
          <button onClick={onToggle} className={`px-3 py-1 rounded-lg font-sans font-bold ${enabled ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-600/20 text-rose-400 border border-rose-500/30'}`}>
            {enabled ? 'Active' : 'Disabled'}
          </button>
        </div>
      </div>
    </div>);
}
export function WorkerCard({ name, status, assignedQueue, processedCount, failedCount, cpuUsagePct, onRestart }) {
    return (<div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-xs">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Cpu className="h-4 w-4 text-purple-400"/>
          <span className="font-bold text-white">{name}</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
          {status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 font-mono text-[11px] bg-slate-900 p-2.5 rounded-xl border border-slate-800">
        <div><span className="text-slate-500 block">Queue</span><span className="text-slate-300 font-bold">{assignedQueue}</span></div>
        <div><span className="text-slate-500 block">Processed</span><span className="text-emerald-400 font-bold">{processedCount}</span></div>
        <div><span className="text-slate-500 block">CPU</span><span className="text-purple-400 font-bold">{cpuUsagePct}%</span></div>
      </div>

      <button onClick={onRestart} className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold font-sans">
        Restart Worker Process
      </button>
    </div>);
}
