import React from 'react';
import { Activity } from 'lucide-react';
const PlatformDeliveryMonitorView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400"/> Real-Time Delivery Tracking & Monitor
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Track real-time delivery status, channel latency, and automatic fallback attempts.</p>
      </div>

      <div className="space-y-3">
        {[
            { event: 'blacklist.detected', channel: 'In-App + Socket.IO + Email', latency: '42ms', status: 'Delivered', tagCol: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
            { event: 'visitor.arrived', channel: 'In-App + Socket.IO + Email', latency: '85ms', status: 'Delivered', tagCol: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }
        ].map((d, i) => (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-white font-bold">{d.event}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${d.tagCol}`}>{d.status}</span>
              </div>
              <p className="text-slate-400 mt-1">Channels: {d.channel} • Latency: <span className="text-emerald-400">{d.latency}</span></p>
            </div>
            <button className="bg-slate-800 text-slate-200 px-3 py-1 rounded font-semibold border border-slate-700">
              Inspect Delivery Trace
            </button>
          </div>))}
      </div>
    </div>);
};
export default PlatformDeliveryMonitorView;
