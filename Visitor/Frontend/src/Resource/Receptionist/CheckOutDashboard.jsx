import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, Users, AlertTriangle, Clock, RefreshCw, Loader2, AlertCircle, TrendingUp, ShieldAlert } from 'lucide-react';
import { checkoutApi, getErrorMessage } from '../../services/api';
import BackButton from '../../components/common/BackButton';
const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';
export default function CheckOutDashboard() {
    const [stats, setStats] = useState(null);
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [statsRes, pendingRes] = await Promise.all([
                checkoutApi.dashboard(),
                checkoutApi.pending(),
            ]);
            setStats(statsRes.data.data);
            setPending((pendingRes.data.data || []).slice(0, 8));
            setLastRefresh(new Date());
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    const maxHour = Math.max(...(stats?.hourlyDistribution.map(h => h.count) || [1]), 1);
    const KPICard = ({ icon: Icon, label, value, sub, gradient }) => (<div className={`rounded-2xl p-5 text-white shadow-lg ${gradient} relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 bg-white -translate-y-4 translate-x-4"/>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">{label}</p>
          <p className="text-4xl font-black">{loading ? '—' : (value ?? '0')}</p>
          {sub && <p className="text-xs opacity-75 mt-1">{sub}</p>}
        </div>
        <div className="p-3 rounded-xl bg-white/20 backdrop-blur">
          <Icon className="h-6 w-6"/>
        </div>
      </div>
    </div>);
    return (<div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/dashboard"/>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <LogOut className="h-6 w-6 text-rose-500"/>
              Check-Out Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time visitor exit monitoring • Refreshed {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Refresh
        </button>
      </div>

      {error && (<div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      {/* Overstay Warning Banner if any overstays exist */}
      {(stats?.overstayCount || 0) > 0 && (<div className="flex items-center justify-between p-4 bg-amber-500 text-white rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-7 w-7 shrink-0"/>
            <div>
              <p className="font-black text-lg">{stats?.overstayCount} Overstay Visitor(s) Detected</p>
              <p className="text-xs opacity-90">Visitors have exceeded their scheduled end time. Review overstay management list.</p>
            </div>
          </div>
        </div>)}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={LogOut} label="Checked Out Today" value={stats?.checkedOutToday} gradient="bg-gradient-to-br from-rose-500 to-pink-700"/>
        <KPICard icon={Users} label="Currently Inside" value={stats?.currentlyInside} gradient="bg-gradient-to-br from-emerald-500 to-teal-700"/>
        <KPICard icon={AlertTriangle} label="Overstays Detected" value={stats?.overstayCount} gradient="bg-gradient-to-br from-amber-500 to-orange-600"/>
        <KPICard icon={Clock} label="Avg Stay Duration" value={stats?.avgVisitDuration ? `${Math.round(stats.avgVisitDuration)}m` : '—'} gradient="bg-gradient-to-br from-indigo-500 to-purple-700"/>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Peak Exit Traffic Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-rose-500"/>
            <h2 className="font-bold text-slate-800 dark:text-white">Peak Exit Traffic</h2>
          </div>
          {loading ? (<div className="h-44 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-rose-400"/></div>) : (<div className="flex items-end gap-1 h-44">
              {Array.from({ length: 24 }, (_, i) => {
                const h = stats?.hourlyDistribution.find(x => x.hour === i);
                const count = h?.count || 0;
                const height = maxHour > 0 ? (count / maxHour) * 100 : 0;
                const isPeak = count === maxHour && count > 0;
                return (<div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className={`w-full rounded-t transition-all ${isPeak ? 'bg-rose-500' : 'bg-rose-200 dark:bg-rose-900/40 group-hover:bg-rose-400'}`} style={{ height: `${Math.max(height, 2)}%` }}/>
                    {count > 0 && (<div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                        {i}:00 — {count} exits
                      </div>)}
                    {i % 4 === 0 && <span className="text-[9px] text-slate-400 mt-1">{i}h</span>}
                  </div>);
            })}
            </div>)}
        </div>

        {/* Pending Check-Outs Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-500"/>
              <h2 className="font-bold text-slate-800 dark:text-white">Active Visitors Inside</h2>
            </div>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full px-2 py-0.5 font-bold">
              {pending.length}
            </span>
          </div>
          {loading ? (<div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-emerald-400"/></div>) : pending.length === 0 ? (<div className="p-8 text-center text-slate-400 text-sm">No active visitors inside</div>) : (<div className="divide-y divide-slate-50 dark:divide-slate-800">
              {pending.map(item => (<div key={item.checkinId} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{item.visitorName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{item.visitorCompany || item.department} · In: {fmt(item.checkedInAt)}</p>
                  </div>
                  {item.isOverstay && (<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0">
                      Overstay ({item.overstayMinutes}m)
                    </span>)}
                </div>))}
            </div>)}
        </div>
      </div>
    </div>);
}
