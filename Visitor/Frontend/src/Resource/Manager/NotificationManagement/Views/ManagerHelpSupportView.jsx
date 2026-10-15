import React from 'react';
import { HelpCircle, BookOpen, ShieldCheck } from 'lucide-react';
const ManagerHelpSupportView = () => {
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-400"/> Manager Guidelines & Help Support
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Operational guidelines for department managers, approval SLAs, and escalation protocols.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <BookOpen className="w-5 h-5 text-blue-400 mb-1"/>
          <h3 className="font-bold text-white text-sm">Manager Authority Scope</h3>
          <p className="text-slate-400 leading-relaxed">
            Managers are granted authority over employees, visitors, and appointments within their assigned department or branch. Systems automatically restrict notifications outside your scope.
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400 mb-1"/>
          <h3 className="font-bold text-white text-sm">Approval SLA Standards</h3>
          <p className="text-slate-400 leading-relaxed">
            Standard visitor approval requests must be reviewed within 60 minutes. Requests exceeding 120 minutes will trigger automated manager escalation alerts.
          </p>
        </div>
      </div>
    </div>);
};
export default ManagerHelpSupportView;
