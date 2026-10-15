import React, { useState, useEffect, useCallback } from 'react';
import { BarChart2, TrendingUp, Users, Clock, UserCheck, RefreshCw, Loader2, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { checkinApi, getErrorMessage } from '../../services/api';
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];
export default function CheckInAnalytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dateFrom, setDateFrom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 29);
        return d.toISOString().split('T')[0];
    });
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await checkinApi.analytics(dateFrom, dateTo);
            setData(res.data.data);
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo]);
    useEffect(() => { load(); }, [load]);
    const maxDaily = Math.max(...(data?.daily.map(d => d.total) || [1]), 1);
    const maxHour = Math.max(...(data?.hourly.map(h => h.count) || [1]), 1);
    const completionRate = data?.summary?.totalCheckins
        ? Math.round((data.summary.totalCompleted / data.summary.totalCheckins) * 100) : 0;
    const walkInRate = data?.summary?.totalCheckins
        ? Math.round((data.summary.totalWalkIns / data.summary.totalCheckins) * 100) : 0;
    const MetricCard = ({ label, value, sub, icon: Icon, color, trend }) => (<div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl`} style={{ backgroundColor: color + '20' }}>
          <Icon className="h-5 w-5" style={{ color }}/>
        </div>
        {trend !== undefined && (<span className={`flex items-center gap-0.5 text-xs font-bold ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight className="h-3 w-3"/> : <ArrowDownRight className="h-3 w-3"/>}
            {Math.abs(trend)}%
          </span>)}
      </div>
      <p className="text-3xl font-black text-slate-800 dark:text-white">{loading ? '—' : value}</p>
      <p className="text-xs font-semibold text-slate-500 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>);
    return (<div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-indigo-500"/>
            Check-In Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Performance insights and traffic trends</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          <span className="text-slate-400 text-sm">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Apply
          </button>
        </div>
      </div>

      {error && (<div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users} label="Total Check-Ins" value={data?.summary?.totalCheckins?.toLocaleString() || '0'} color="#6366f1"/>
        <MetricCard icon={UserCheck} label="Completed Visits" value={data?.summary?.totalCompleted?.toLocaleString() || '0'} color="#10b981"/>
        <MetricCard icon={TrendingUp} label="Completion Rate" value={`${completionRate}%`} color="#f59e0b"/>
        <MetricCard icon={Clock} label="Avg Visit Duration" value={data?.summary?.avgDuration ? `${Math.round(data.summary.avgDuration)}m` : '—'} color="#8b5cf6"/>
      </div>

      {/* Daily Trend Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500"/>
            <h2 className="font-bold text-slate-800 dark:text-white">Daily Check-In Trend</h2>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-indigo-500"/>Total</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-500"/>Completed</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-500"/>Walk-Ins</span>
          </div>
        </div>
        {loading ? (<div className="h-48 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-400"/></div>) : !data?.daily?.length ? (<div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data for this period</div>) : (<div className="overflow-x-auto">
            <div className="flex items-end gap-1 h-48 min-w-max">
              {data.daily.map((d, i) => (<div key={i} className="flex flex-col items-center gap-0.5 group relative" style={{ minWidth: 28 }}>
                  <div className="flex items-end gap-0.5 h-40">
                    <div className="w-3 rounded-t bg-indigo-500 transition-all duration-500" style={{ height: `${(d.total / maxDaily) * 100}%` }}/>
                    <div className="w-3 rounded-t bg-emerald-500 transition-all duration-500" style={{ height: `${(d.completed / maxDaily) * 100}%` }}/>
                    <div className="w-3 rounded-t bg-amber-400 transition-all duration-500" style={{ height: `${((d.walkIns || 0) / maxDaily) * 100}%` }}/>
                  </div>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] rounded px-1.5 py-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 text-center">
                    <p>{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    <p>Total: {d.total} | Done: {d.completed}</p>
                  </div>
                  <span className="text-[9px] text-slate-400 rotate-45 mt-1">
                    {new Date(d.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                  </span>
                </div>))}
            </div>
          </div>)}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Hourly distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-purple-500"/>
            <h2 className="font-bold text-slate-800 dark:text-white">Peak Hours Distribution</h2>
          </div>
          {loading ? (<div className="h-32 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-purple-400"/></div>) : (<div className="flex items-end gap-0.5 h-32">
              {Array.from({ length: 24 }, (_, i) => {
                const h = data?.hourly.find(x => x.hour === i);
                const count = h?.count || 0;
                const height = maxHour > 0 ? (count / maxHour) * 100 : 2;
                const isPeak = count === maxHour && count > 0;
                return (<div key={i} className="flex-1 flex flex-col items-center group relative">
                    <div className={`w-full rounded-t transition-all ${isPeak ? 'bg-purple-500' : 'bg-purple-200 dark:bg-purple-900/40 group-hover:bg-purple-400'}`} style={{ height: `${Math.max(height, 3)}%` }}/>
                    {count > 0 && (<div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                        {i}:00 — {count}
                      </div>)}
                    {i % 6 === 0 && <span className="text-[9px] text-slate-400 mt-1">{i}h</span>}
                  </div>);
            })}
            </div>)}
        </div>

        {/* Summary stats */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-5 w-5 text-emerald-500"/>
            <h2 className="font-bold text-slate-800 dark:text-white">Period Summary</h2>
          </div>
          {loading ? (<div className="h-32 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-emerald-400"/></div>) : (<div className="space-y-3">
              {[
                { label: 'Completion Rate', value: completionRate, color: '#10b981' },
                { label: 'Walk-In Rate', value: walkInRate, color: '#f59e0b' },
                { label: 'Registered Visits', value: 100 - walkInRate, color: '#6366f1' },
            ].map((item, i) => (<div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className="text-slate-500 font-bold">{item.value}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.value}%`, backgroundColor: item.color }}/>
                  </div>
                </div>))}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-2xl font-black text-slate-800 dark:text-white">{data?.summary?.totalCheckins || 0}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800 dark:text-white">{data?.summary?.avgDuration ? `${Math.round(data.summary.avgDuration)}m` : '—'}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Avg Duration</p>
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </div>);
}
