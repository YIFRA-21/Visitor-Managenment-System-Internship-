import React, { useState, useEffect, useCallback } from 'react';
import { Flame, ShieldAlert, RefreshCw, Loader2, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { checkoutApi, getErrorMessage } from '../../services/api';
export default function EmergencyEvacuationStatus() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [evacuated, setEvacuated] = useState({});
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await checkoutApi.evacuation();
            setData(res.data.data);
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    const toggleEvacuated = (id) => {
        setEvacuated(prev => ({ ...prev, [id]: !prev[id] }));
    };
    const rollCall = data?.rollCall || [];
    const safeCount = Object.values(evacuated).filter(Boolean).length;
    const remainingCount = Math.max(0, (data?.totalInside || 0) - safeCount);
    return (<div className="min-h-screen bg-slate-900 text-white p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-red-900/50 pb-4">
        <div>
          <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-widest text-xs">
            <Flame className="h-4 w-4 animate-pulse"/> Emergency Incident Management
          </div>
          <h1 className="text-2xl font-black flex items-center gap-2 mt-1">
            Evacuation Roll Call & Visitor Accounted Status
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time headcount of visitors inside facility during emergency evacuation
          </p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow transition disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Refresh Headcount
        </button>
      </div>

      {error && (<div className="flex items-center gap-2 p-3 bg-red-950/50 border border-red-900 rounded-xl text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      {/* Counter summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Total Inside Facility</p>
          <p className="text-4xl font-black text-white mt-1">{loading ? '—' : data?.totalInside}</p>
        </div>
        <div className="bg-emerald-950/40 rounded-2xl p-5 border border-emerald-800/50 text-center">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Marked Safe / Accounted</p>
          <p className="text-4xl font-black text-emerald-400 mt-1">{safeCount}</p>
        </div>
        <div className="bg-red-950/40 rounded-2xl p-5 border border-red-800/50 text-center">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-widest">Unaccounted / Remaining</p>
          <p className="text-4xl font-black text-red-500 mt-1">{remainingCount}</p>
        </div>
      </div>

      {/* Roll Call Table */}
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <Users className="h-4 w-4 text-red-400"/> Visitor Assembly Roll Call List
          </h2>
          <span className="text-xs text-slate-400">Click button to mark safe at assembly point</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700 text-[10px] uppercase font-bold text-slate-400">
                {['Visitor', 'Company / Phone', 'Department', 'Host Contact', 'Badge #', 'Assembly Status'].map(h => (<th key={h} className="px-4 py-3">{h}</th>))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-sm">
              {loading ? (<tr><td colSpan={6} className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin text-red-400 mx-auto"/></td></tr>) : rollCall.length === 0 ? (<tr><td colSpan={6} className="p-10 text-center text-slate-400">No visitors currently inside building. All clear!</td></tr>) : rollCall.map(item => {
            const isSafe = !!evacuated[item.checkinId];
            return (<tr key={item.checkinId} className={isSafe ? 'bg-emerald-950/20' : 'bg-red-950/10'}>
                    <td className="px-4 py-3 font-semibold text-white">{item.visitorName}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{item.visitorCompany || '—'} · {item.visitorPhone || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">{item.department || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {item.hostName} {item.hostPhone ? `(${item.hostPhone})` : ''}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{item.badgeNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleEvacuated(item.checkinId)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${isSafe ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                        {isSafe ? <CheckCircle2 className="h-4 w-4"/> : <ShieldAlert className="h-4 w-4"/>}
                        {isSafe ? 'Accounted (Safe) ✓' : 'Mark Safe'}
                      </button>
                    </td>
                  </tr>);
        })}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
}
