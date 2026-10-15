import React from 'react';
import { Users, PhoneCall } from 'lucide-react';
const ReceptionHostNotificationsView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400"/> Host Employee Notifications
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Host acceptance/rejection responses, host delays, and reception assistance requests.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Host Accepted Visitor Escort', host: 'David Miller', visitor: 'Sarah Jenkins', status: 'Coming Down to Lobby', time: '10m ago' },
            { title: 'Host Requested Reception Assistance', host: 'Alice Vance', visitor: 'Tech Solutions Team', status: 'Escort Escalate', time: '20m ago' }
        ].map((item, idx) => (<div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-white block">{item.title}</span>
              <span className="text-slate-300 mt-0.5 block">Host: {item.host} • Visitor: <span className="text-slate-400">{item.visitor}</span></span>
            </div>
            <button className="bg-blue-600/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded text-xs font-semibold flex items-center gap-1">
              <PhoneCall className="w-3 h-3"/> Call Host
            </button>
          </div>))}
      </div>
    </div>);
};
export default ReceptionHostNotificationsView;
