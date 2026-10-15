import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Download, RefreshCw, Loader2, AlertCircle, Search, Users, ShieldAlert, LogOut } from 'lucide-react';
import { reportsApi, getErrorMessage } from '../../services/api';
export default function OperationalReports() {
    const [tab, setTab] = useState('visitors');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [search, setSearch] = useState('');
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            let res;
            if (tab === 'visitors')
                res = await reportsApi.visitors(dateFrom, dateTo);
            else if (tab === 'security')
                res = await reportsApi.auditLogs();
            else if (tab === 'audit')
                res = await reportsApi.auditLogs();
            else
                res = await reportsApi.visitors(dateFrom, dateTo);
            setData(Array.isArray(res.data) ? res.data : res.data.data || []);
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    }, [tab, dateFrom, dateTo]);
    useEffect(() => { load(); }, [load]);
    const exportCSV = () => {
        if (!data.length)
            return;
        const header = Object.keys(data[0]);
        const rows = data.map(obj => header.map(k => JSON.stringify(obj[k] ?? '')));
        const csv = [header, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${tab}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };
    return (<div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-500"/> Operational Reports Catalog
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Query operational datasets across visitors, check-ins, security, and audit logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            <Download className="h-4 w-4"/> Export CSV
          </button>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        {[
            { id: 'visitors', label: 'Visitor Reports', icon: Users },
            { id: 'checkins', label: 'Check-In/Exit Logs', icon: LogOut },
            { id: 'security', label: 'Security Reports', icon: ShieldAlert },
            { id: 'audit', label: 'System Audit Logs', icon: FileText },
        ].map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (<button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition ${active ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              <Icon className="h-4 w-4"/> {t.label}
            </button>);
        })}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter current view..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
        </div>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl px-3 py-2"/>
        <span className="text-slate-400 text-xs">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl px-3 py-2"/>
      </div>

      {error && (<div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      {/* Report Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (<div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-400 mx-auto"/></div>) : data.length === 0 ? (<div className="p-12 text-center text-slate-400 text-sm">No report records found</div>) : (<div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500">
                  {Object.keys(data[0] || {}).slice(0, 7).map(k => (<th key={k} className="px-4 py-3">{k.replace(/_/g, ' ')}</th>))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                {data.map((row, i) => (<tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    {Object.keys(row).slice(0, 7).map(k => (<td key={k} className="px-4 py-3 text-slate-700 dark:text-slate-300 truncate max-w-xs">
                        {String(row[k] ?? '—')}
                      </td>))}
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </div>
    </div>);
}
