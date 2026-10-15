import React from 'react';
import { Calendar } from 'lucide-react';
const ManagerAppointmentNotificationsView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400"/> Manager Appointment Notifications
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Appointment lifecycle notifications across your assigned department and branch.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'New Appointment Requested', visitor: 'Tech Solutions Team', date: 'Tomorrow 10:00 AM', status: 'Pending Review', tagCol: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
            { title: 'Appointment Rescheduled', visitor: 'Carlos Santana (Vendor)', date: 'Today 15:30 PM', status: 'Rescheduled', tagCol: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
            { title: 'Missed Appointment Alert', visitor: 'Global Logistics Rep', date: 'Today 09:00 AM', status: 'Missed', tagCol: 'bg-red-500/10 text-red-400 border-red-500/30' }
        ].map((a, i) => (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{a.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${a.tagCol}`}>{a.status}</span>
              </div>
              <p className="text-slate-300 mt-1">{a.visitor} — <span className="text-slate-400">{a.date}</span></p>
            </div>
            <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">View Schedule</button>
          </div>))}
      </div>
    </div>);
};
export default ManagerAppointmentNotificationsView;
