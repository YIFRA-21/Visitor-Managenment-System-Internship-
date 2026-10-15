import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Download, RefreshCw, Loader2, AlertCircle, BarChart2, TrendingUp } from 'lucide-react';
import { securityApi, getErrorMessage } from '../../services/api';
export default function SecurityReportsAnalytics() {
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
            const res = await securityApi.analytics(dateFrom, dateTo);
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
    const exportCSV = () => {
        if (!data)
            return;
        const header = ['Date', 'Screening Count'];
        const rows = (data.screeningStats || []).map((s) => [s.date, s.total]);
        const csv = [header, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-analytics-${dateFrom}-${dateTo}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };
    return (<div className="min-h-screen bg-slate-950 text-white p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-indigo-500"/> Security Analytics & Threat Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Incident severity analysis, screening throughput, and threat breakdown</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 border border-slate-700 bg-slate-900 text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-800 transition">
            <Download className="h-4 w-4"/> Export CSV
          </button>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Refresh
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-3 py-2"/>
        <span className="text-slate-400 text-xs">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-3 py-2"/>
      </div>

      {error && (<div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-900 rounded-xl text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      {loading ? (<div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-400"/></div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Incident breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500"/> Incidents by Severity
            </h3>
            {!data?.incidentStats?.length ? (<p className="text-sm text-slate-400 p-4 text-center">No security incidents recorded in date range</p>) : (<div className="space-y-3">
                {data.incidentStats.map((item, i) => (<div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-sm text-slate-300 uppercase">{item.severity}</span>
                    <span className="text-sm font-black text-indigo-400">{item.count} incident(s)</span>
                  </div>))}
              </div>)}
          </div>

          {/* Daily screening volume */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500"/> Daily Security Screenings
            </h3>
            {!data?.screeningStats?.length ? (<p className="text-sm text-slate-400 p-4 text-center">No screening records in date range</p>) : (<div className="space-y-2">
                {data.screeningStats.map((item, i) => (<div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <span className="text-slate-400">{new Date(item.date).toLocaleDateString()}</span>
                    <span className="font-bold text-emerald-400">{item.total} screened</span>
                  </div>))}
              </div>)}
          </div>
        </div>)}
    </div>);
}
