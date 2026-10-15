import React from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
const PlatformNotificationCenterView = () => {
    const notifications = [
        { id: 'platnotif_1001', category: 'Security', title: 'Critical Security: Blacklist Match Detected', message: 'Arthur Pendelton (ID-99021-X) matched Restricted Watchlist #WL-804 at Turnstile #3.', severity: 'Critical', time: '5m ago' },
        { id: 'platnotif_1002', category: 'Reception', title: 'Visitor Arrival Alert', message: 'Visitor Elena Rostova has arrived at Front Desk #1 to see host David Miller.', severity: 'High', time: '15m ago' },
        { id: 'platnotif_1003', category: 'Administration', title: 'System Maintenance Notice', message: 'Automated nightly database backup completed cleanly (2.4 GB).', severity: 'Info', time: '2h ago' }
    ];
    return (<div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400"/> Unified Notification Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Centralized, role-contextual notification feed for all system modules and events.</p>
        </div>
        <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-1.5 font-medium transition-colors">
          <CheckCircle2 className="w-4 h-4 text-emerald-400"/> Mark All as Read
        </button>
      </div>

      <div className="space-y-2.5">
        {notifications.map((n) => (<div key={n.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex justify-between items-start text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{n.title}</span>
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-semibold">{n.category}</span>
              </div>
              <p className="text-slate-300 mt-1">{n.message}</p>
            </div>
            <span className="text-slate-500 text-xs">{n.time}</span>
          </div>))}
      </div>
    </div>);
};
export default PlatformNotificationCenterView;
