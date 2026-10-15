import React from 'react';
import { CreditCard } from 'lucide-react';
const SecurityPassAccessNotificationsView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-400"/> Visitor Pass & Access Control Alerts
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Invalid pass scans, duplicate badge usage, expired pass turnstile attempts, and access denied events.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Expired Badge Scanned at Turnstile #2', badge: 'Badge V-802', location: 'Main Lobby Turnstile', status: 'Access Denied', tagCol: 'bg-red-500/10 text-red-400 border-red-500/30' },
            { title: 'Duplicate Badge Anti-Passback Violation', badge: 'Badge V-1044', location: 'Server Room Turnstile', status: 'Blocked', tagCol: 'bg-amber-500/10 text-amber-400 border-amber-500/30' }
        ].map((item, idx) => (<div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{item.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${item.tagCol}`}>{item.status}</span>
              </div>
              <p className="text-slate-300 mt-1">{item.badge} • Location: <span className="text-slate-400">{item.location}</span></p>
            </div>
            <button className="bg-purple-600/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded font-semibold hover:bg-purple-600/30">
              Lock Turnstile
            </button>
          </div>))}
      </div>
    </div>);
};
export default SecurityPassAccessNotificationsView;
