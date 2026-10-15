import React from 'react';
import { Settings, Save } from 'lucide-react';
const ManagerSettingsView = () => {
    return (<div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-400"/> Department Notification Settings
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Configure department lead times, auto-approval thresholds, and escalation rules.</p>
      </div>

      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
        <div>
          <label className="text-slate-300 font-bold block mb-1">Approval SLA Timeout (Minutes)</label>
          <input type="number" defaultValue={60} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"/>
        </div>

        <div>
          <label className="text-slate-300 font-bold block mb-1">Visitor Pass Expiry Warning Lead Time (Minutes)</label>
          <input type="number" defaultValue={15} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white"/>
        </div>

        <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-lg text-xs flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20">
          <Save className="w-4 h-4"/> Save Department Settings
        </button>
      </div>
    </div>);
};
export default ManagerSettingsView;
