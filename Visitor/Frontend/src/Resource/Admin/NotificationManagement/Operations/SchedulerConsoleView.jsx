import React, { useState } from 'react';
import { Clock, Play, Pause } from 'lucide-react';
export default function SchedulerConsoleView() {
    const [schedules, setSchedules] = useState([
        { id: 'sch_101', name: 'Daily Visitor Digest', cron: '0 17 * * *', status: 'active', nextRun: '2026-08-06T17:00:00Z', channel: 'email', recipients: 'Department Managers' },
        { id: 'sch_102', name: 'Weekly Security Compliance Report', cron: '0 0 * * MON', status: 'active', nextRun: '2026-08-10T00:00:00Z', channel: 'email', recipients: 'Executive Security' },
        { id: 'sch_103', name: 'Monthly VIP Host Audit Reminder', cron: '0 9 1 * *', status: 'paused', nextRun: '2026-09-01T09:00:00Z', channel: 'in_app', recipients: 'Reception Supervisors' }
    ]);
    const toggleStatus = (id) => {
        setSchedules(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'paused' : 'active' } : s));
    };
    return (<div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-5 text-xs font-sans">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Clock className="h-4 w-4 text-purple-400"/>
            <span>Notification Scheduler Console (§5)</span>
          </h3>
          <p className="text-slate-400 mt-0.5">Manage recurring cron triggers, scheduled digests, and execution history.</p>
        </div>
      </div>

      <div className="space-y-3">
        {schedules.map(s => (<div key={s.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between font-mono">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white font-sans text-sm">{s.name}</span>
                <span className="text-purple-400 font-mono text-xs">[{s.cron}]</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5 font-sans">
                Next Run: <strong className="text-slate-300 font-mono">{s.nextRun}</strong> • Recipients: {s.recipients}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-sans ${s.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {s.status}
              </span>

              <button onClick={() => toggleStatus(s.id)} className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg">
                {s.status === 'active' ? <Pause className="h-4 w-4 text-amber-400"/> : <Play className="h-4 w-4 text-emerald-400"/>}
              </button>
            </div>
          </div>))}
      </div>
    </div>);
}
