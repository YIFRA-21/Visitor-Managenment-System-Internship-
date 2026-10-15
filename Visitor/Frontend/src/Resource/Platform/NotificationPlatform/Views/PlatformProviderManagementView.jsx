import React from 'react';
import { Server, CheckCircle2 } from 'lucide-react';
const PlatformProviderManagementView = () => {
    const providers = [
        { name: 'Enterprise SMTP Mailer', type: 'Email Provider', status: 'Healthy', latency: '120ms', priority: 'Primary' },
        { name: 'Twilio SMS Gateway', type: 'SMS Provider', status: 'Healthy', latency: '350ms', priority: 'Primary' },
        { name: 'Socket.IO Gateway', type: 'Real-Time WebSockets', status: 'Healthy', latency: '12ms', priority: 'Primary' },
        { name: 'Enterprise Webhook Dispatcher', type: 'REST Webhook', status: 'Healthy', latency: '180ms', priority: 'Secondary' }
    ];
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-teal-400"/> Channel & Provider Management
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Configure delivery gateways, failover routing, and monitor provider health status.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {providers.map((p, i) => (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">{p.name}</span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-semibold text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3"/> {p.status}
              </span>
            </div>
            <p className="text-slate-400">{p.type} • Priority: <span className="text-slate-200">{p.priority}</span> • Latency: <span className="text-teal-400">{p.latency}</span></p>
          </div>))}
      </div>
    </div>);
};
export default PlatformProviderManagementView;
