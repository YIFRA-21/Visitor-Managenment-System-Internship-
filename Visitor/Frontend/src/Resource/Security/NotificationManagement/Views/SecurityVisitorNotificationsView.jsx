import React from 'react';
import { UserCheck } from 'lucide-react';
const SecurityVisitorNotificationsView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-blue-400"/> Visitor Security Notifications
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Real-time alerts for registered arrivals, walk-ins, overstays, and missing visitor reports.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Visitor Stay Overdue Alert (>45m)', visitor: 'Michael Brown (Contractor)', host: 'David Miller', zone: 'Exec Suite Annex', status: 'Overstayed', tagCol: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
            { title: 'Walk-In Visitor Clearance Alert', visitor: 'Carlos Santana (HVAC Vendor)', host: 'Facilities Office', zone: 'Main Lobby', status: 'Clearance Required', tagCol: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' }
        ].map((v, i) => (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{v.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${v.tagCol}`}>{v.status}</span>
              </div>
              <p className="text-slate-300 mt-1">{v.visitor} • Host: {v.host} • Zone: <span className="text-slate-400">{v.zone}</span></p>
            </div>
            <button className="bg-blue-600/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded font-semibold hover:bg-blue-600/30">
              Locate Visitor
            </button>
          </div>))}
      </div>
    </div>);
};
export default SecurityVisitorNotificationsView;
