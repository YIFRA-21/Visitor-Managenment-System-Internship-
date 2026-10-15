import React from 'react';
import { Users } from 'lucide-react';
const ManagerEmployeeNotificationsView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400"/> Employee & Host Availability Alerts
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Host status changes, emergency assistance requests, and appointment reassignments.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Host Out of Office (Sick Leave)', employee: 'Robert Chen (Senior Sec Engineer)', action: 'Reassign 2 Appointments', priority: 'High' },
            { title: 'Employee Requested Security Assistance', employee: 'Alice Vance (Lobby Desk)', action: 'Dispatched Guard #3', priority: 'Critical' }
        ].map((e, i) => (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-white block">{e.title}</span>
              <span className="text-slate-300 mt-0.5 block">{e.employee}</span>
            </div>
            <button className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-600/30">
              {e.action}
            </button>
          </div>))}
      </div>
    </div>);
};
export default ManagerEmployeeNotificationsView;
