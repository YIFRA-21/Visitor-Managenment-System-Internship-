import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { checkinApi } from '../../services/api';
export default function WalkInVisitors() {
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(false);
    const loadBoard = useCallback(() => {
        setLoading(true);
        checkinApi.liveBoard()
            .then((res) => setVisitors(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);
    useEffect(() => {
        loadBoard();
    }, [loadBoard]);
    const handleCheckout = async (id) => {
        try {
            await checkinApi.checkout(id);
            loadBoard();
        }
        catch (err) {
            console.error(err);
        }
    };
    const checkedIn = visitors.filter((v) => v.status === 'checked_in');
    const expected = visitors.filter((v) => v.status === 'approved');
    return (<div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 shadow-2xl transition-all duration-300 hover:border-indigo-500/50">
      <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-white">Live Visitor Board</h1>
          <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Track checked-in guests and pending arrivals</p>
        </div>
        <button onClick={loadBoard} disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Refresh Board
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* CHECKED IN GUESTS */}
        <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-6">
          <h3 className="mb-4 font-bold text-xs uppercase tracking-widest text-emerald-400 flex items-center gap-2 border-b border-slate-900 pb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/>
            Checked In On-Site ({checkedIn.length})
          </h3>
          <div className="space-y-4">
            {checkedIn.map((v) => (<div key={v.id} className="flex justify-between items-center border-b border-slate-900 pb-3 last:border-0 last:pb-0">
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">{v.visitor_name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    Host: {v.host_name} · Badge: <span className="font-mono text-cyan-400">{v.badge_number}</span>
                  </p>
                </div>
                <button onClick={() => handleCheckout(v.id)} className="text-[10px] font-black uppercase tracking-widest bg-red-950/30 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-505 hover:text-slate-950 transition-colors">
                  Checkout
                </button>
              </div>))}
            {checkedIn.length === 0 && (<div className="py-6 text-center text-slate-650 text-xs font-semibold uppercase tracking-widest">No visitors checked in.</div>)}
          </div>
        </div>

        {/* EXPECTED GUESTS */}
        <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-6">
          <h3 className="mb-4 font-bold text-xs uppercase tracking-widest text-cyan-400 flex items-center gap-2 border-b border-slate-900 pb-2">
            Expected Today ({expected.length})
          </h3>
          <div className="space-y-4">
            {expected.map((v) => (<div key={v.id} className="border-b border-slate-900 pb-3 last:border-0 last:pb-0">
                <h4 className="font-semibold text-slate-200 text-sm">{v.visitor_name}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  Host: {v.host_name} · Reference: <span className="font-mono text-cyan-400">{v.reference_code}</span>
                </p>
                <p className="text-[9px] text-slate-600 mt-1 font-mono">
                  Start: {new Date(v.scheduled_start).toLocaleTimeString()}
                </p>
              </div>))}
            {expected.length === 0 && (<div className="py-6 text-center text-slate-650 text-xs font-semibold uppercase tracking-widest">No other arrivals expected today.</div>)}
          </div>
        </div>
      </div>
    </div>);
}
