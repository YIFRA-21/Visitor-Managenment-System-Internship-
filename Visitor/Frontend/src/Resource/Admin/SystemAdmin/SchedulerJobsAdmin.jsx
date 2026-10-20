import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { useResponseNavigation } from '../../../modules/response';
export default function SchedulerJobsAdmin() {
    const { toConfirmation } = useResponseNavigation();
    const [jobs] = useState([
        { id: 1, name: 'Daily Visitor Overstay Check', cron: '0 * * * *', status: 'ACTIVE', last_run: '10 mins ago', next_run: 'in 50 mins' },
        { id: 2, name: 'Audit Log Archival', cron: '0 0 * * 0', status: 'ACTIVE', last_run: '4 days ago', next_run: 'in 3 days' },
        { id: 3, name: 'Notification Queue Retry', cron: '*/5 * * * *', status: 'ACTIVE', last_run: '1 min ago', next_run: 'in 4 mins' }
    ]);
    return (<div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Clock className="h-5 w-5"/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Background Jobs & Scheduler</h1>
            <p className="text-xs text-slate-400">Cron job schedules, queue consumers, and background task workers</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono text-[11px]">
            <tr>
              <th className="p-4">Status</th>
              <th className="p-4">Task Name</th>
              <th className="p-4">Cron Expression</th>
              <th className="p-4">Last Execution</th>
              <th className="p-4">Next Trigger</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {jobs.map(j => (<tr key={j.id} className="hover:bg-slate-800/40 transition">
                <td className="p-4">
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {j.status}
                  </span>
                </td>
                <td className="p-4 font-bold text-white">{j.name}</td>
                <td className="p-4 font-mono text-purple-300">{j.cron}</td>
                <td className="p-4 text-slate-400">{j.last_run}</td>
                <td className="p-4 text-slate-400">{j.next_run}</td>
                <td className="p-4 text-right">
                  <button onClick={() => {
                    toConfirmation({
                      title: 'Execute Background Job',
                      message: `Are you sure you want to manually trigger "${j.name}" now?`,
                      actionType: 'RUN_SCHEDULER_JOB',
                      targetEntity: j.name,
                      consequences: [
                        'The background scheduler worker will immediately begin executing this job.',
                        'Execution results will be appended to the job audit logs.'
                      ],
                      confirmLabel: 'Run Job Now',
                      cancelLabel: 'Cancel',
                      danger: false,
                      onConfirmApi: () => Promise.resolve({ data: { success: true } }),
                      successTitle: 'Job Triggered Successfully',
                      successMessage: `Background job "${j.name}" has been queued for execution.`,
                      returnUrl: '/admin?view=scheduler'
                    });
                  }} className="px-3 py-1 bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 border border-violet-500/30 rounded-lg text-xs font-semibold">
                    Run Now
                  </button>
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>);
}
