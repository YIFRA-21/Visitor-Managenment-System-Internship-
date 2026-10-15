import React from 'react';
import { CreditCard, Printer } from 'lucide-react';
const ReceptionVisitorPassView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-400"/> Visitor Pass Management Alerts
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Badge generation, auto-print notifications, turnstile scans, pass expiries, and replacement requests.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Badge V-1044 Printed Automatically', visitor: 'John Vance', type: 'Printed', time: '12m ago', tagCol: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
            { title: 'Pass Expiring Warning', visitor: 'Michael Brown (Badge V-908)', type: 'Expiring <15m', time: '1.5h ago', tagCol: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
            { title: 'Pass Lost & Replaced Notice', visitor: 'Elena Rostova', type: 'Replaced', time: 'Yesterday', tagCol: 'bg-blue-500/10 text-blue-400 border-blue-500/30' }
        ].map((item, idx) => (<div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{item.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${item.tagCol}`}>{item.type}</span>
              </div>
              <p className="text-slate-300 mt-1">{item.visitor}</p>
            </div>
            <button className="bg-purple-600/20 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded font-semibold flex items-center gap-1 hover:bg-purple-600/30">
              <Printer className="w-3.5 h-3.5"/> Re-Print Badge
            </button>
          </div>))}
      </div>
    </div>);
};
export default ReceptionVisitorPassView;
