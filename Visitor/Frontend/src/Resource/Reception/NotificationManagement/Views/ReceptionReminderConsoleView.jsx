import React from 'react';
import { Clock, Play } from 'lucide-react';
const ReceptionReminderConsoleView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400"/> Automated Reminder Engine Console
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Automated lead-time reminders for host pending responses, visitor arrivals, and pass expiries.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Host Response Pending (>10m)', target: 'Host David Miller (Sarah Jenkins Waiting)', category: 'Host Pending', interval: 'Every 5 Mins' },
            { title: 'Visitor Pass Expiry Lead Notice', target: 'Badge V-908 (Michael Brown)', category: 'Pass Expiry', interval: '15 Mins Before' }
        ].map((r, i) => (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-white block">{r.title}</span>
              <span className="text-slate-400 mt-0.5 block">{r.category} • Target: <span className="text-slate-300">{r.target}</span></span>
            </div>
            <button className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded text-xs font-semibold hover:bg-indigo-600/30 flex items-center gap-1">
              <Play className="w-3 h-3"/> Trigger Now
            </button>
          </div>))}
      </div>
    </div>);
};
export default ReceptionReminderConsoleView;
