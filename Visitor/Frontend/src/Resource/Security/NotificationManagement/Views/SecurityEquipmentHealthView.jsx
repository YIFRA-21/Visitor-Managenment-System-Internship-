import React from 'react';
import { HardDrive } from 'lucide-react';
const SecurityEquipmentHealthView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-teal-400"/> Security Hardware & CCTV Device Health
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">CCTV camera Heartbeat pings, turnstile access controller offline alerts, and badge printer status.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Hardware Alert: Camera CCTV-Lobby-04 Offline', location: 'Main Lobby North Angle', status: 'Offline (>5m)', tagCol: 'bg-red-500/10 text-red-400 border-red-500/30' }
        ].map((eq, i) => (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-white block">{eq.title}</span>
              <span className="text-slate-400 mt-0.5 block">{eq.location}</span>
            </div>
            <button className="bg-teal-600/20 text-teal-300 border border-teal-500/30 px-3 py-1.5 rounded font-semibold hover:bg-teal-600/30">
              Ping Hardware
            </button>
          </div>))}
      </div>
    </div>);
};
export default SecurityEquipmentHealthView;
