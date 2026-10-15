import React from 'react';
import { LogOut } from 'lucide-react';
const ReceptionCheckOutView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <LogOut className="w-5 h-5 text-indigo-400"/> Reception Check-Out Notifications
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Meeting completions, badge return tracking, overdue visitor stays, and checkout confirmations.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Meeting Completed by Host', visitor: 'Michael Brown', badge: 'Badge V-908', status: 'Ready for Check-Out', tagCol: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
            { title: 'Visitor Stay Overdue Alert', visitor: 'Carlos Santana', badge: 'Badge V-902', status: 'Pass Not Returned', tagCol: 'bg-red-500/10 text-red-400 border-red-500/30' }
        ].map((item, idx) => (<div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{item.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${item.tagCol}`}>{item.status}</span>
              </div>
              <p className="text-slate-300 mt-1">{item.visitor} — <span className="text-slate-400 font-mono">{item.badge}</span></p>
            </div>
            <button className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded font-semibold hover:bg-indigo-600/30">
              Confirm Check-Out
            </button>
          </div>))}
      </div>
    </div>);
};
export default ReceptionCheckOutView;
