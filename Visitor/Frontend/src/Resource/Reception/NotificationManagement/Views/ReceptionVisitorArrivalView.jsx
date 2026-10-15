import React from 'react';
import { UserCheck } from 'lucide-react';
const ReceptionVisitorArrivalView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-400"/> Reception Visitor Arrival Notifications
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Real-time alerts for pre-registered arrivals, walk-ins, delayed visitors, and no-shows.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'VIP Ambassador Arrival', visitor: 'Elena Rostova', host: 'Elena Gilbert', type: 'Pre-Registered', time: '5m ago', tagCol: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
            { title: 'Walk-In Visitor Registered', visitor: 'Carlos Santana (Vendor)', host: 'Carlos Smith', type: 'Walk-In', time: '12m ago', tagCol: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
            { title: 'Visitor Delayed Notice', visitor: 'Tech Solutions Team', host: 'David Miller', type: 'Delayed', time: '25m ago', tagCol: 'bg-amber-500/10 text-amber-400 border-amber-500/30' }
        ].map((item, idx) => (<div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{item.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${item.tagCol}`}>{item.type}</span>
              </div>
              <p className="text-slate-300 mt-1">{item.visitor} • Host: <span className="text-slate-400">{item.host}</span></p>
            </div>
            <span className="text-slate-500">{item.time}</span>
          </div>))}
      </div>
    </div>);
};
export default ReceptionVisitorArrivalView;
