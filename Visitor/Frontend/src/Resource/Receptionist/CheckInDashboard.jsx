import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserCheck, UserX, LogIn, Clock, TrendingUp, RefreshCw, Loader2, AlertCircle, ChevronRight, ArrowUpRight, Activity, Building2, ClipboardList } from 'lucide-react';
import { checkinApi } from '../../services/api';
import BackButton from '../../components/common/BackButton';
const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (dt) => dt ? new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
export default function CheckInDashboard() {
    const [stats, setStats] = useState(null);
    const [pending, setPending] = useState([]);
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [statsRes, pendingRes, queueRes] = await Promise.all([
                checkinApi.dashboard(date),
                checkinApi.pending(date),
                checkinApi.queueStatus(),
            ]);
            setStats(statsRes.data.data);
            setPending((pendingRes.data.data || []).slice(0, 8));
            setQueue((queueRes.data.data?.currentlyInside || []).slice(0, 8));
            setLastRefresh(new Date());
        }
        catch {
            setError('Failed to load dashboard data. Please refresh.');
        }
        finally {
            setLoading(false);
        }
    }, [date]);
    useEffect(() => { load(); }, [load]);
    // Auto-refresh every 60 seconds
    useEffect(() => {
        const t = setInterval(() => load(), 60000);
        return () => clearInterval(t);
    }, [load]);
    const maxHour = Math.max(...(stats?.hourlyDistribution.map(h => h.count) || [1]), 1);
    const KPICard = ({ icon: Icon, label, value, sub, color, gradient }) => (<div className={`rounded-2xl p-5 text-white shadow-lg ${gradient} relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 bg-white -translate-y-4 translate-x-4"/>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">{label}</p>
          <p className="text-4xl font-black">
            {loading ? <span className="opacity-50">—</span> : (value ?? '0')}
          </p>
          {sub && <p className="text-xs opacity-75 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-white/20 backdrop-blur`}>
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
              <Activity className="h-6 w-6 text-indigo-500"/>
              Check-In Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time visitor admission monitoring • Refreshed {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/>
            Refresh
          </button>
        </div>
      </div>

      {error && (<div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard icon={LogIn} label="Checked In Today" value={stats?.totalToday} gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"/>
        <KPICard icon={Users} label="Currently Inside" value={stats?.currentlyInside} gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"/>
        <KPICard icon={UserCheck} label="Checked Out" value={stats?.checkedOutToday} gradient="bg-gradient-to-br from-cyan-500 to-cyan-700"/>
        <KPICard icon={ClipboardList} label="Pending Arrivals" value={stats?.pendingCount} gradient="bg-gradient-to-br from-amber-500 to-orange-600"/>
        <KPICard icon={UserX} label="Walk-Ins Today" value={stats?.walkInsToday} gradient="bg-gradient-to-br from-violet-500 to-purple-700"/>
        <KPICard icon={Clock} label="Avg Visit Duration" value={stats?.avgVisitDuration ? `${Math.round(stats.avgVisitDuration)}m` : '—'} gradient="bg-gradient-to-br from-rose-500 to-pink-700"/>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Hourly Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-indigo-500"/>
            <h2 className="font-bold text-slate-800 dark:text-white">Hourly Check-In Traffic</h2>
          </div>
          {loading ? (<div className="h-40 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400"/>
            </div>) : (<div className="flex items-end gap-1 h-40">
              {Array.from({ length: 24 }, (_, i) => {
                const h = stats?.hourlyDistribution.find(x => x.hour === i);
                const count = h?.count || 0;
                const height = maxHour > 0 ? (count / maxHour) * 100 : 0;
                const isPeak = count === maxHour && count > 0;
                return (<div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className={`w-full rounded-t transition-all duration-500 ${isPeak ? 'bg-indigo-500' : 'bg-indigo-200 dark:bg-indigo-900/50 group-hover:bg-indigo-400'}`} style={{ height: `${Math.max(height, 2)}%` }}/>
                    {count > 0 && (<div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                        {i}:00 — {count}
                      </div>)}
                    {(i % 4 === 0) && (<span className="text-[9px] text-slate-400 mt-1">{i}h</span>)}
                  </div>);
            })}
            </div>)}
        </div>

        {/* Type Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-emerald-500"/>
            <h2 className="font-bold text-slate-800 dark:text-white">By Visit Type</h2>
          </div>
          {loading ? (<div className="h-40 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400"/>
            </div>) : stats?.byType && stats.byType.length > 0 ? (<div className="space-y-3">
              {stats.byType.map((t, i) => {
                const total = stats.byType.reduce((s, x) => s + x.count, 0);
                const pct = total > 0 ? Math.round((t.count / total) * 100) : 0;
                return (<div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{t.type}</span>
                      <span className="text-slate-500">{t.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}/>
                    </div>
                  </div>);
            })}
            </div>) : (<div className="h-40 flex items-center justify-center text-slate-400 text-sm">No data for today</div>)}
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Pending Check-Ins */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500"/>
              <h2 className="font-bold text-slate-800 dark:text-white">Pending Arrivals</h2>
              <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full px-2 py-0.5 font-semibold">
                {pending.length}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400"/>
          </div>
          {loading ? (<div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-amber-400"/></div>) : pending.length === 0 ? (<div className="p-8 text-center text-slate-400 text-sm">No pending arrivals for today</div>) : (<div className="divide-y divide-slate-50 dark:divide-slate-800">
              {pending.map(p => (<div key={p.appointmentId} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {(p.visitorName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{p.visitorName}</p>
                    <p className="text-xs text-slate-500 truncate">{p.visitorCompany || p.department} · Host: {p.hostName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{fmt(p.scheduledStart)}</p>
                    <p className="text-[10px] text-slate-400">{p.referenceCode}</p>
                  </div>
                </div>))}
            </div>)}
        </div>

        {/* Currently Inside */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-500"/>
              <h2 className="font-bold text-slate-800 dark:text-white">Currently Inside</h2>
              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full px-2 py-0.5 font-semibold">
                {queue.length}
              </span>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400"/>
          </div>
          {loading ? (<div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-emerald-400"/></div>) : queue.length === 0 ? (<div className="p-8 text-center text-slate-400 text-sm">No visitors currently inside</div>) : (<div className="divide-y divide-slate-50 dark:divide-slate-800">
              {queue.map(q => (<div key={q.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {(q.visitorName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{q.visitorName}</p>
                    <p className="text-xs text-slate-500 truncate">{q.company || '—'} · {q.department}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{q.minutesInside}m inside</p>
                    <p className="text-[10px] text-slate-400">In @ {fmt(q.checkedInAt)}</p>
                  </div>
                </div>))}
            </div>)}
        </div>
      </div>
    </div>);
}
