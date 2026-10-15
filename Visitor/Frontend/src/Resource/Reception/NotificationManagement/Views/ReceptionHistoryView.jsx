import React from 'react';
import { History } from 'lucide-react';
const ReceptionHistoryView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-slate-400"/> Front-Desk Notification Audit History
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Historical log of all front-desk events, badge prints, check-ins, and security alerts.</p>
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
        <div className="flex justify-between items-center pb-3 border-b border-slate-900 font-semibold text-slate-400">
          <span>FRONT-DESK EVENT</span>
          <span>DATE & STAFF ACTOR</span>
        </div>

        {[
            { event: 'Check-In Processed', details: 'Sarah Jenkins checked in; Badge V-1044 printed.', actor: 'Receptionist (You)', date: '2026-08-06 10:15' },
            { event: 'Host Notified', details: 'Host David Miller alerted for VIP arrival.', actor: 'Receptionist (You)', date: '2026-08-06 10:10' }
        ].map((h, i) => (<div key={i} className="flex justify-between items-center py-2 border-b border-slate-900/60">
            <div>
              <span className="font-bold text-white block">{h.event}</span>
              <span className="text-slate-400 mt-0.5 block">{h.details}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-300 block">{h.actor}</span>
              <span className="text-slate-500 text-[11px] block">{h.date}</span>
            </div>
          </div>))}
      </div>
    </div>);
};
export default ReceptionHistoryView;
