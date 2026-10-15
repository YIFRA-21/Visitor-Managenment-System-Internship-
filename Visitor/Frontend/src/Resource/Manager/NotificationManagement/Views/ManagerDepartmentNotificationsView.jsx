import React from 'react';
import { Building2 } from 'lucide-react';
const ManagerDepartmentNotificationsView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-purple-400"/> Department Announcements & Policy Updates
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Departmental notices, safety policy updates, and executive briefings.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Updated Visitor NDA & Safety Protocol v4.2', date: '2026-08-05', author: 'Corporate Compliance', status: 'Mandatory Review' },
            { title: 'Q3 Physical Security Audit Preparation', date: '2026-08-04', author: 'Division Manager', status: 'In Progress' }
        ].map((d, i) => (<div key={i} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-white block">{d.title}</span>
              <span className="text-slate-400 mt-0.5 block">{d.author} • {d.date}</span>
            </div>
            <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2.5 py-1 rounded text-[11px] font-semibold">
              {d.status}
            </span>
          </div>))}
      </div>
    </div>);
};
export default ManagerDepartmentNotificationsView;
