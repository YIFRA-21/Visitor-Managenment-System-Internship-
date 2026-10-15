import React from 'react';
import { Sliders, Plus } from 'lucide-react';
const PlatformRuleManagerView = () => {
    const rules = [
        { id: 'rule_101', name: 'Blacklist Watchlist Alert Rule', event: 'blacklist.detected', roles: 'Security Officer, SOC Officer', channels: 'In-App, Socket.IO, Email, Desktop', severity: 'Critical' },
        { id: 'rule_102', name: 'Visitor Arrival Host Notification', event: 'visitor.arrived', roles: 'Host Employee, Receptionist', channels: 'In-App, Socket.IO, Email, Browser', severity: 'High' },
        { id: 'rule_103', name: 'Emergency Lockdown Alert Rule', event: 'emergency.triggered', roles: 'Security, Reception, Admin', channels: 'In-App, Socket.IO, Email, SMS, Desktop', severity: 'Critical' }
    ];
    return (<div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400"/> Configurable Notification Rule Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Map business events to dynamic recipient resolution rules and multi-channel delivery priorities.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1">
          <Plus className="w-3.5 h-3.5"/> Create New Rule
        </button>
      </div>

      <div className="space-y-3">
        {rules.map((r, i) => (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{r.name}</span>
                <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded font-mono border border-slate-700">{r.event}</span>
              </div>
              <p className="text-slate-300 mt-1">Recipients: {r.roles} • Channels: <span className="text-slate-400">{r.channels}</span></p>
            </div>
            <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded font-semibold border border-slate-700">
              Edit Rule
            </button>
          </div>))}
      </div>
    </div>);
};
export default PlatformRuleManagerView;
