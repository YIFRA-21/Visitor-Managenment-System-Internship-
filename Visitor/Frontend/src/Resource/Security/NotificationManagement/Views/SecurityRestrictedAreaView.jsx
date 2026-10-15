import React from 'react';
import { Lock } from 'lucide-react';
const SecurityRestrictedAreaView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-orange-400"/> Restricted Area & Perimeter Violations
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Door forced open alarms, out-of-hours access attempts, and unauthorized perimeter entries.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Door Forced Open Alarm: Sensor #D-402', location: 'Server Room Annex B', severity: 'High', status: 'CCTV Verified' },
            { title: 'Out-of-Hours Restricted Entry Attempt', location: 'Executive Vault Room', severity: 'High', status: 'Door Locked' }
        ].map((r, i) => (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{r.title}</span>
                <span className="bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded text-[10px] font-bold">{r.severity}</span>
              </div>
              <p className="text-slate-300 mt-1">Location: <span className="text-slate-400">{r.location}</span></p>
            </div>
            <button className="bg-orange-600/20 text-orange-300 border border-orange-500/30 px-3 py-1.5 rounded font-semibold hover:bg-orange-600/30">
              Playback CCTV
            </button>
          </div>))}
      </div>
    </div>);
};
export default SecurityRestrictedAreaView;
