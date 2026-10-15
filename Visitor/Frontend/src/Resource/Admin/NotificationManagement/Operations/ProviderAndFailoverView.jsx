import React, { useState } from 'react';
import { Server } from 'lucide-react';
import { ProviderCard } from './components/OperationsCards';
export default function ProviderAndFailoverView() {
    const [providers, setProviders] = useState([
        { id: 'prov_1', name: 'Primary SMTP Gateway', type: 'email', subType: 'SMTP', enabled: true, priority: 1, status: 'healthy', latencyMs: 35 },
        { id: 'prov_2', name: 'Backup Microsoft 365 Exchange', type: 'email', subType: 'M365', enabled: true, priority: 2, status: 'healthy', latencyMs: 48 },
        { id: 'prov_3', name: 'Twilio Bulk SMS Gateway', type: 'sms', subType: 'Twilio', enabled: true, priority: 1, status: 'degraded', latencyMs: 180 },
        { id: 'prov_4', name: 'Africa\'s Talking SMS Backup', type: 'sms', subType: 'AfricasTalking', enabled: true, priority: 2, status: 'healthy', latencyMs: 95 },
        { id: 'prov_5', name: 'Firebase Cloud Messaging (FCM)', type: 'push', subType: 'FCM', enabled: true, priority: 1, status: 'healthy', latencyMs: 12 }
    ]);
    const [activeTab, setActiveTab] = useState('providers');
    return (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-6 text-xs font-sans">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Server className="h-4 w-4 text-cyan-400"/>
            <span>Provider & Failover Management (§3, §4)</span>
          </h3>
          <p className="text-slate-400 mt-0.5">Manage external gateway credentials, health status, and multi-provider failover routing.</p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button onClick={() => setActiveTab('providers')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'providers' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>Providers (§3)</button>
          <button onClick={() => setActiveTab('failover')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'failover' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>Failover (§4)</button>
        </div>
      </div>

      {activeTab === 'providers' ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map(p => (<ProviderCard key={p.id} {...p} onTest={() => alert(`Connection test passed for ${p.name} (${p.latencyMs}ms)`)} onToggle={() => setProviders(prev => prev.map(item => item.id === p.id ? { ...item, enabled: !item.enabled } : item))}/>))}
        </div>) : (<div className="space-y-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <h4 className="font-bold uppercase text-[11px] text-amber-400">Automatic Failover Policy</h4>
            <p className="text-slate-400">If primary transport latency exceeds 5000ms or fails 3 consecutive times, traffic is rerouted automatically.</p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <h4 className="font-bold uppercase text-[11px] text-emerald-400">Active Routing Table</h4>

            <div className="space-y-2 font-mono">
              <div className="p-3 bg-slate-900 rounded-xl flex justify-between items-center">
                <span>Email Channel</span>
                <span className="text-emerald-400 font-bold">Primary: SMTP Gateway (35ms)</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl flex justify-between items-center">
                <span>SMS Channel</span>
                <span className="text-amber-400 font-bold">Primary: Twilio (180ms - Degraded) → Auto Failover Target: Africa's Talking</span>
              </div>
            </div>
          </div>
        </div>)}
    </div>);
}
