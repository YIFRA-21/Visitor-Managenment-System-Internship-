import React from 'react';
import { Eye } from 'lucide-react';
const SecurityWatchlistBlacklistView = () => {
    return (<div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Eye className="w-5 h-5 text-red-400"/> Watchlist & Blacklist Match Alerts
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">High-priority detection alerts for blacklisted individuals, repeat offenders, and law enforcement notices.</p>
      </div>

      <div className="space-y-3">
        {[
            { title: 'Critical Watchlist Match: Arthur Pendelton', matchType: 'Restricted Watchlist Entry #WL-804', location: 'Main Lobby Turnstile #3', severity: 'Critical', status: 'Security Intercept Dispatched' }
        ].map((w, i) => (<div key={i} className="bg-slate-950/70 border border-red-500/40 rounded-xl p-4 flex justify-between items-center text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{w.title}</span>
                <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded text-[10px] font-bold">{w.severity}</span>
              </div>
              <p className="text-slate-300 mt-1">{w.matchType} • Location: <span className="text-slate-400">{w.location}</span></p>
            </div>
            <button className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded text-xs shadow-lg shadow-red-600/30">
              Open Investigation
            </button>
          </div>))}
      </div>
    </div>);
};
export default SecurityWatchlistBlacklistView;
