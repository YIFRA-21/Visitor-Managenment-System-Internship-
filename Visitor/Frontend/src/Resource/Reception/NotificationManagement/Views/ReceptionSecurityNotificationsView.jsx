import React from 'react';
import { ShieldAlert } from 'lucide-react';
const ReceptionSecurityNotificationsView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-400"/> Security & Watchlist Match Notifications
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Blacklisted visitor matches, restricted access requests, and unauthorized entry alerts.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Blacklisted Visitor Watchlist Match Found', visitor: 'Arthur Pendelton', reason: 'Matched Entry #WL-804', severity: 'Critical', status: 'Security Dispatched' },
            { title: 'Expired Badge Scanned at Turnstile #2', visitor: 'Unknown Badge V-802', reason: 'Turnstile Access Denied', severity: 'High', status: 'Turnstile Locked' }
        ].map((sec, i) => (<div key={i} className="bg-slate-950/70 border border-red-500/30 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{sec.title}</span>
                <span className="bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold">{sec.severity}</span>
              </div>
              <p className="text-slate-300 mt-1">{sec.visitor} — <span className="text-slate-400">{sec.reason}</span></p>
            </div>
            <button className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded text-xs shadow-lg shadow-red-600/30">
              Hold Check-In
            </button>
          </div>))}
      </div>
    </div>);
};
export default ReceptionSecurityNotificationsView;
