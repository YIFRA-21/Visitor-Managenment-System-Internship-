import React from 'react';
import { Calendar } from 'lucide-react';
const ReceptionAppointmentView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400"/> Reception Appointment Notifications
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Approved appointments, VIP briefings, starting soon notices, and group visit schedules.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'VIP Boardroom Briefing Starting Soon', visitor: 'Ambassador Elena Rostova', host: 'MD Office', time: 'Starting in 15m', tag: 'VIP Group', tagCol: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
            { title: 'Group Audit Visit Approved', visitor: 'IT park Maintenance Team (5 Members)', host: 'David Miller', time: 'Today 14:00', tag: 'Approved Group', tagCol: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }
        ].map((item, idx) => (<div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{item.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${item.tagCol}`}>{item.tag}</span>
              </div>
              <p className="text-slate-300 mt-1">{item.visitor} — <span className="text-slate-400">{item.time}</span></p>
            </div>
            <button className="text-xs text-emerald-400 font-medium hover:text-emerald-300">View Schedule</button>
          </div>))}
      </div>
    </div>);
};
export default ReceptionAppointmentView;
