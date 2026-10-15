import React from 'react';
import { Calendar } from 'lucide-react';
const SecurityAppointmentNotificationsView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400"/> High-Security & VIP Appointment Notices
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Notifications for diplomatic visits, confidential meetings, VIP delegations, and high-risk contractors.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Diplomatic Delegation Visit Clearance', delegation: 'Ambassador Elena Rostova & Escort Security', time: 'Today 14:00', zone: 'Executive Boardroom Wing', tag: 'High Security VIP', tagCol: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
            { title: 'Confidential Audit Contractor Access', delegation: 'IT Park Audit Team (5 Technicians)', time: 'Today 15:30', zone: 'Data Center Level 2', tag: 'Restricted Access', tagCol: 'bg-amber-500/10 text-amber-400 border-amber-500/30' }
        ].map((a, i) => (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{a.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${a.tagCol}`}>{a.tag}</span>
              </div>
              <p className="text-slate-300 mt-1">{a.delegation} — Zone: <span className="text-slate-400">{a.zone}</span> ({a.time})</p>
            </div>
            <button className="bg-purple-600/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded font-semibold hover:bg-purple-600/30">
              Assign Escort
            </button>
          </div>))}
      </div>
    </div>);
};
export default SecurityAppointmentNotificationsView;
