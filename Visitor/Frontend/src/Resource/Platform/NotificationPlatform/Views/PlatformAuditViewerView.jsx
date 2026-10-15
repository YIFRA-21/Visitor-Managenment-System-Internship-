import React from 'react';
import { ShieldCheck } from 'lucide-react';
const PlatformAuditViewerView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400"/> Immutable Audit Trail Inspector
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Traceable audit logs for all published events, rule evaluations, delivery receipts, and escalations.</p>
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
        <div className="flex justify-between items-center pb-3 border-b border-slate-900 font-semibold text-slate-400">
          <span>EVENT & AUDIT ACTION</span>
          <span>TIMESTAMP & USER</span>
        </div>

        {[
            { action: 'publish_event (blacklist.detected)', details: 'Published by Security Engine (Turnstile #3)', actor: 'System Worker', time: '2026-08-06 10:25' },
            { action: 'publish_event (visitor.arrived)', details: 'Published by Front Desk #1', actor: 'Receptionist Desk #1', time: '2026-08-06 10:15' }
        ].map((a, i) => (<div key={i} className="flex justify-between items-center py-2 border-b border-slate-900/60">
            <div>
              <span className="font-mono font-bold text-white block">{a.action}</span>
              <span className="text-slate-400 mt-0.5 block">{a.details}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-300 block">{a.actor}</span>
              <span className="text-slate-500 text-[11px] block">{a.time}</span>
            </div>
          </div>))}
      </div>
    </div>);
};
export default PlatformAuditViewerView;
