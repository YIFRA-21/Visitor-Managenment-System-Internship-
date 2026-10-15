import React from 'react';
import { Clock } from 'lucide-react';
const PlatformReminderManagerView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400"/> Automated Lead-Time Reminder Engine
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Configure scheduled reminders for upcoming appointments, visitor overstays, and pending approvals.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Upcoming Appointment Host Reminder', interval: '15 Minutes Before Meeting', target: 'Host Employee' },
            { title: 'Pending Approval Escalation Warning', interval: '30 Minutes Unresponded', target: 'Department Manager' }
        ].map((r, i) => (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-white block">{r.title}</span>
              <span className="text-slate-400 mt-0.5 block">{r.interval} • Target: <span className="text-slate-300">{r.target}</span></span>
            </div>
            <button className="bg-amber-600/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded font-semibold hover:bg-amber-600/30">
              Configure Reminder
            </button>
          </div>))}
      </div>
    </div>);
};
export default PlatformReminderManagerView;
