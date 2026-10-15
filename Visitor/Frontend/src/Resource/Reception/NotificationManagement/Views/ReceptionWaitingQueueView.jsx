import React from 'react';
import { Clock, ArrowRightLeft } from 'lucide-react';
const ReceptionWaitingQueueView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400"/> Waiting Queue Alerts & Performance
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Queue length alerts, long waiting time breaches (&gt;15 mins), and queue load reassignments.</p>

      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
        <div className="flex justify-between items-center pb-3 border-b border-slate-900">
          <div>
            <span className="font-bold text-white text-sm">Active Lobby Waiting Queue: 5 Visitors</span>
            <p className="text-slate-400 text-[11px] mt-0.5">Average waiting time: 11.5 minutes</p>
          </div>
          <button className="bg-amber-600/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded font-semibold flex items-center gap-1">
            <ArrowRightLeft className="w-3.5 h-3.5"/> Reassign Queue Load
          </button>
        </div>

        <div className="space-y-2">
          {[
            { ticket: 'T-101', visitor: 'Sarah Jenkins', type: 'VIP Appointment', wait: '18m', warning: true },
            { ticket: 'T-102', visitor: 'Michael Brown', type: 'Contractor', wait: '12m', warning: false },
            { ticket: 'T-103', visitor: 'Carlos Santana', type: 'Walk-in', wait: '8m', warning: false }
        ].map((q, i) => (<div key={i} className="p-3 bg-slate-900/60 rounded-lg flex justify-between items-center">
              <div>
                <span className="font-bold text-white">{q.ticket} — {q.visitor}</span>
                <span className="text-slate-400 block text-[11px]">{q.type}</span>
              </div>
              <span className={`font-bold px-2 py-0.5 rounded border ${q.warning ? 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                {q.wait} Wait
              </span>
            </div>))}
        </div>
      </div>
    </div>);
};
export default ReceptionWaitingQueueView;
