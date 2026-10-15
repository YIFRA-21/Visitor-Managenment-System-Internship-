import React from 'react';
import { Users } from 'lucide-react';
const SecurityEscortVipView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-pink-400"/> VIP & Diplomatic Escort Management
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">VIP delegation tracking, armed escort assignments, and security escort status updates.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Diplomatic Escort Assigned', vip: 'Ambassador Elena Rostova', officer: 'Officer Marcus Vance', status: 'Escort Active', time: '15m ago' }
        ].map((item, idx) => (<div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-white block">{item.title}</span>
              <span className="text-slate-300 mt-0.5 block">VIP: {item.vip} • Assigned Guard: <span className="text-slate-400">{item.officer}</span></span>
            </div>
            <button className="bg-pink-600/20 text-pink-300 border border-pink-500/30 px-3 py-1.5 rounded font-semibold hover:bg-pink-600/30">
              Update Escort Status
            </button>
          </div>))}
      </div>
    </div>);
};
export default SecurityEscortVipView;
