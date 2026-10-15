import React from 'react';
import { Compass } from 'lucide-react';
const SecurityPatrolShiftView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Compass className="w-5 h-5 text-emerald-400"/> Patrol & Shift Management Notifications
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Shift handover alerts, missed checkpoint notifications, and scheduled patrol reminders.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Shift Alpha Handover Complete', details: 'Shift Lead Guard #4 completed perimeter check.', status: 'Handover Verified', time: 'Shift 06:00 - 14:00' }
        ].map((p, i) => (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-white block">{p.title}</span>
              <span className="text-slate-400 mt-0.5 block">{p.details} ({p.time})</span>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded font-semibold">{p.status}</span>
          </div>))}
      </div>
    </div>);
};
export default SecurityPatrolShiftView;
