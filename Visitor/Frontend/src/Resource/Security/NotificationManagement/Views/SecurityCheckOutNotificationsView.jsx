import React from 'react';
import { LogOut } from 'lucide-react';
const SecurityCheckOutNotificationsView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <LogOut className="w-5 h-5 text-amber-400"/> Check-Out & Visitor Overstay Monitoring
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Alerts for unreturned badges, failed check-outs, and campus overstay violations.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Pass Not Returned at Exit Turnstile', visitor: 'Michael Brown (Badge V-908)', status: 'Badge Missing', tagCol: 'bg-red-500/10 text-red-400 border-red-500/30' },
            { title: 'Visitor Exited Building Main Gate', visitor: 'Sarah Jenkins', status: 'Checked-Out', tagCol: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }
        ].map((item, idx) => (<div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{item.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${item.tagCol}`}>{item.status}</span>
              </div>
              <p className="text-slate-300 mt-1">{item.visitor}</p>
            </div>
            <button className="bg-amber-600/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded font-semibold hover:bg-amber-600/30">
              Flag Badge
            </button>
          </div>))}
      </div>
    </div>);
};
export default SecurityCheckOutNotificationsView;
