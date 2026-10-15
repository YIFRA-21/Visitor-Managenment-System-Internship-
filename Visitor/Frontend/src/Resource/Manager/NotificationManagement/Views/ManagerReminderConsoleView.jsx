import React from 'react';
import { Clock, Play } from 'lucide-react';
const ManagerReminderConsoleView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400"/> Automated Reminder Engine Console
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Automated lead-time notifications for upcoming visitor arrivals, pass expiries, and pending approvals.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Pending After-Hours Approval Overdue SLA', interval: 'Every 30 Mins', category: 'Approval Deadline', status: 'Active Queue' },
            { title: 'VIP Visitor Arrival Lead Notice', interval: '60 Mins Before Arrival', category: 'Visitor Arrival', status: 'Active Queue' },
            { title: 'Visitor Pass Expiry Notification', interval: '15 Mins Before Expiry', category: 'Visitor Pass Expiry', status: 'Active Queue' }
        ].map((r, i) => (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-white block">{r.title}</span>
              <span className="text-slate-400 mt-0.5 block">{r.category} • Interval: <span className="text-slate-300">{r.interval}</span></span>
            </div>
            <button className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded text-xs font-semibold hover:bg-indigo-600/30 flex items-center gap-1">
              <Play className="w-3 h-3"/> Trigger Now
            </button>
          </div>))}
      </div>
    </div>);
};
export default ManagerReminderConsoleView;
