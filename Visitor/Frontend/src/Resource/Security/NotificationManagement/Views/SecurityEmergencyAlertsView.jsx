import React from 'react';
import { Siren, AlertTriangle } from 'lucide-react';
const SecurityEmergencyAlertsView = () => {
    return (<div className="space-y-4">
      <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-600/20 border border-red-500/40 rounded-xl text-red-400">
            <Siren className="w-6 h-6 animate-pulse"/>
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Emergency Incident Response Console</h2>
            <p className="text-xs text-red-300 mt-0.5">Fire, medical, lockdown, panic, and suspicious package alerts bypass all quiet hours automatically.</p>
          </div>
        </div>

        <button className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-red-600/30">
          <AlertTriangle className="w-4 h-4"/> Trigger Campus Lockdown
        </button>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Reception Silent Panic Sensor Triggered', location: 'Main Lobby Desk #1', status: 'Active Emergency', time: '10m ago' }
        ].map((e, i) => (<div key={i} className="bg-slate-950/70 border border-red-500/30 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-white block">{e.title}</span>
              <span className="text-slate-400 mt-0.5 block">{e.location} ({e.time})</span>
            </div>
            <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-3 py-1 rounded font-bold">{e.status}</span>
          </div>))}
      </div>
    </div>);
};
export default SecurityEmergencyAlertsView;
