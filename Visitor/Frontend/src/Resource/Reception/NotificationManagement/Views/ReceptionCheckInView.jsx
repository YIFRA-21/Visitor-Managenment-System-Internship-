import React from 'react';
import { LogIn } from 'lucide-react';
const ReceptionCheckInView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <LogIn className="w-5 h-5 text-emerald-400"/> Reception Check-In Notifications
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Identity verified alerts, photo capture, badge printing, and check-in completions.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Identity Verified Successfully', visitor: 'Sarah Jenkins', badge: 'Badge V-1044', status: 'Badge Printed', tagCol: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
            { title: 'Check-In Completed', visitor: 'John Vance (HVAC Services)', badge: 'Badge V-1045', status: 'Escorted', tagCol: 'bg-blue-500/10 text-blue-400 border-blue-500/30' }
        ].map((item, idx) => (<div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{item.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${item.tagCol}`}>{item.status}</span>
              </div>
              <p className="text-slate-300 mt-1">{item.visitor} — <span className="text-slate-400 font-mono">{item.badge}</span></p>
            </div>
            <button className="bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded font-semibold hover:bg-emerald-600/30">
              Print Badge
            </button>
          </div>))}
      </div>
    </div>);
};
export default ReceptionCheckInView;
