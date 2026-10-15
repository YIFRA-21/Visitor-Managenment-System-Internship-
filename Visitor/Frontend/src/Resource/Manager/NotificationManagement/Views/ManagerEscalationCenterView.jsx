import React from 'react';
import { ShieldAlert } from 'lucide-react';
const ManagerEscalationCenterView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-purple-400"/> Manager Escalation Center
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">SLA breaches, overdue approvals, long-waiting visitors, and un-checked-out visitor passes.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'After-Hours Access Request Approval SLA Breach', reason: 'Approval pending for over 120 minutes exceeding 60-min SLA threshold.', severity: 'High', status: 'Open' },
            { title: 'Visitor Waiting Time Threshold Exceeded (>30 mins)', reason: 'VIP Visitor Sarah Jenkins waiting at reception lobby for host David Miller.', severity: 'Critical', status: 'Open' }
        ].map((esc, i) => (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{esc.title}</span>
                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-bold">{esc.severity} Severity</span>
              </div>
              <p className="text-slate-300 mt-1">{esc.reason}</p>
            </div>
            <button className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded text-xs font-semibold">
              Resolve Escalation
            </button>
          </div>))}
      </div>
    </div>);
};
export default ManagerEscalationCenterView;
