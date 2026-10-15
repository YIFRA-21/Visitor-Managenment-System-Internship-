import React from 'react';
import { LogIn } from 'lucide-react';
const SecurityCheckInNotificationsView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <LogIn className="w-5 h-5 text-cyan-400"/> Check-In Clearance & Security Verification
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Alerts for clearance requirements, identity mismatches, and unauthorized check-in attempts.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Security Clearance Required for High-Risk Visitor', visitor: 'Jessica Taylor (Third-Party Auditor)', status: 'Clearance Pending', tagCol: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
            { title: 'Identity Verification Mismatch Alert', visitor: 'Unknown Badge Attempt', status: 'Denied', tagCol: 'bg-red-500/10 text-red-400 border-red-500/30' }
        ].map((item, idx) => (<div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{item.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${item.tagCol}`}>{item.status}</span>
              </div>
              <p className="text-slate-300 mt-1">{item.visitor}</p>
            </div>
            <button className="bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded font-semibold hover:bg-cyan-600/30">
              Review Clearance
            </button>
          </div>))}
      </div>
    </div>);
};
export default SecurityCheckInNotificationsView;
