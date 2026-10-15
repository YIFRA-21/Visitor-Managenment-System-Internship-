import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Clock, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { reportsApi, getErrorMessage } from '../../services/api';
export default function VisitorAnalyticsView() {
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
            const res = await reportsApi.occupancy(dateFrom, dateTo);
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
    const maxHour = Math.max(...(data?.hourlyPeak?.map((h) => h.count) || [1]), 1);
    return (<div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-indigo-500"/> Visitor & Occupancy Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Deep analysis of peak traffic, daily arrival volumes, and duration trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2"/>
          <span className="text-slate-400 text-xs">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2"/>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Refresh
          </button>
        </div>
      </div>

      {error && (<div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      {loading ? (<div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-400"/></div>) : (<div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Hourly Traffic Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500"/> Hourly Arrival Peaks
            </h3>
            <div className="flex items-end gap-1 h-44">
              {Array.from({ length: 24 }, (_, i) => {
                const item = data?.hourlyPeak?.find((x) => x.hour === i);
                const count = item?.count || 0;
                const height = maxHour > 0 ? (count / maxHour) * 100 : 2;
                return (<div key={i} className="flex-1 flex flex-col items-center group relative">
                    <div className="w-full rounded-t bg-indigo-500 dark:bg-indigo-600 transition-all hover:bg-indigo-400" style={{ height: `${Math.max(height, 3)}%` }}/>
                    {count > 0 && (<div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                        {i}:00 — {count} arrivals
                      </div>)}
                    {i % 4 === 0 && <span className="text-[9px] text-slate-400 mt-1">{i}h</span>}
                  </div>);
            })}
            </div>
          </div>

          {/* Daily Arrivals vs Exits */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500"/> Daily Arrival & Exit Volumes
            </h3>
            {!data?.dailyOccupancy?.length ? (<p className="text-sm text-slate-400 p-8 text-center">No occupancy data for this date range</p>) : (<div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {data.dailyOccupancy.map((d, i) => (<div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(d.date).toLocaleDateString()}</span>
                    <div className="flex gap-4">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{d.totalArrivals} Arrivals</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{d.totalExits} Exits</span>
                    </div>
                  </div>))}
              </div>)}
          </div>
        </div>)}
    </div>);
}
