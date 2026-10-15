import React from 'react';
import { UserCheck } from 'lucide-react';
const ManagerVisitorNotificationsView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-400"/> Manager Visitor Notifications
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Real-time alerts for visitor registration, check-in, pass expiry, and security blacklists.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'VIP Visitor Registered', name: 'Sarah Jenkins (IT Park)', host: 'David Miller', type: 'Registration', time: '15m ago', tagCol: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
            { title: 'Pass Expiring Warning', name: 'Michael Brown (Badge V-908)', host: 'Security Lobby', type: 'Pass Expiry', time: '1.5h ago', tagCol: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
            { title: 'Visitor Checked In', name: 'Dr. Aris Thorne (IT Park)', host: 'Elena Gilbert', type: 'Check-In', time: '2h ago', tagCol: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
            { title: 'Security Blacklist Watch Alert', name: 'Flagged Name Match', host: 'Reception Desk', type: 'Blacklist Alert', time: 'Yesterday', tagCol: 'bg-red-500/10 text-red-400 border-red-500/30' }
        ].map((v, i) => (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{v.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${v.tagCol}`}>{v.type}</span>
              </div>
              <p className="text-slate-300 mt-1">{v.name} • Host: <span className="text-slate-400">{v.host}</span></p>
            </div>
            <span className="text-slate-500">{v.time}</span>
          </div>))}
      </div>
    </div>);
};
export default ManagerVisitorNotificationsView;
