import React, { useState, useEffect, useCallback } from 'react';
import { Eye, RefreshCw, Loader2, AlertCircle, Clock, MapPin, LogOut, CheckCircle2 } from 'lucide-react';
import { checkinApi, checkoutApi, getErrorMessage } from '../../services/api';
export default function LiveVisitorTracking() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');
    const [checkingOutId, setCheckingOutId] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await checkinApi.queueStatus();
            setItems(res.data.data?.currentlyInside || []);
            setLastRefresh(new Date());
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    }, []);
    const handleQuickCheckout = async (item) => {
        setCheckingOutId(item.id);
        setActionSuccess('');
        setError('');
        try {
            const code = item.badgeNumber || String(item.id);
            await checkoutApi.process({
                code,
                checkoutMethod: 'SECURITY_GATE',
                remarks: 'Direct gate checkout via Live Visitor Tracker'
            });
            setActionSuccess(`✓ ${item.visitorName} successfully checked out at Gate.`);
            // Optimistically remove from list and reload
            setItems(prev => prev.filter(i => i.id !== item.id));
            load();
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setCheckingOutId(null);
        }
    };
    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        const t = setInterval(load, 15000);
        return () => clearInterval(t);
    }, [load]);
    const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';
    return (<div className="min-h-screen bg-slate-950 text-white p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Eye className="h-6 w-6 text-emerald-500"/> Live Visitor Movement Tracking
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time inside-building location snapshot • Refreshed {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Refresh Feed
        </button>
      </div>

      {error && (<div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-900 rounded-xl text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      {actionSuccess && (<div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-900 rounded-xl text-emerald-400 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0"/> {actionSuccess}
        </div>)}

      {/* Grid of Active Visitors */}
      {loading ? (<div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-400"/></div>) : items.length === 0 ? (<div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          No visitors currently inside building
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (<div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"/>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400">{item.badgeNumber || `ID-${item.id}`}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {item.minutesInside}m inside
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{item.visitorName}</h3>
                  <p className="text-xs text-slate-400">{item.company || 'Independent Visitor'}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400"/> <span>Location: <strong>{item.department || 'Main Facility'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-slate-500"/> <span>Checked In @ {fmt(item.checkedInAt)} · Host: {item.hostName || 'Host'}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-800/80">
                <button onClick={() => handleQuickCheckout(item)} disabled={checkingOutId === item.id} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50">
                  <LogOut className="h-3.5 w-3.5"/>
                  <span>{checkingOutId === item.id ? 'Checking Out...' : 'Gate Check-Out'}</span>
                </button>
              </div>
            </div>))}
        </div>)}
    </div>);
}
