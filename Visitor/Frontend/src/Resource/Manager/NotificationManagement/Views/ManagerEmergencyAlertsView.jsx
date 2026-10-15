import React from 'react';
import { Siren, AlertTriangle, CheckCircle2 } from 'lucide-react';
const ManagerEmergencyAlertsView = () => {
    return (<div className="space-y-4">
      <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-600/20 border border-red-500/40 rounded-xl text-red-400">
            <Siren className="w-6 h-6 animate-pulse"/>
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Emergency Operations Center</h2>
            <p className="text-xs text-red-300 mt-0.5">Critical emergency alerts bypass manager quiet hours and sound settings automatically.</p>
          </div>
        </div>

        <button className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-red-600/30">
          <AlertTriangle className="w-4 h-4"/> Trigger Emergency Evacuation Alert
        </button>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Zone C Badge Scanner Tamper Alert', desc: 'Physical security sensor triggered at East Gate Badge Scanner #4.', time: '10m ago', status: 'Acknowledged' }
        ].map((em, i) => (<div key={i} className="bg-slate-950/70 border border-red-500/30 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{em.title}</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3"/> {em.status}
                </span>
              </div>
              <p className="text-slate-300 mt-1">{em.desc}</p>
            </div>
            <span className="text-slate-500">{em.time}</span>
          </div>))}
      </div>
    </div>);
};
export default ManagerEmergencyAlertsView;
