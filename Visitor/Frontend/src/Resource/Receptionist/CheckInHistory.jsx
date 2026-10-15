import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, RefreshCw, ChevronLeft, ChevronRight, Loader2, AlertCircle, Clock } from 'lucide-react';
import { checkinApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

const fmt = (dt) => dt ? new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDur = (mins) => {
    if (!mins)
        return '—';
    if (mins < 60)
        return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};
export default function CheckInHistory() {
    const { t, tStatus } = useLanguage();
    const [records, setRecords] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [isWalkIn, setIsWalkIn] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [expanded, setExpanded] = useState(null);
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = { page, limit: 20 };
            if (search)
                params.search = search;
            if (status)
                params.status = status;
            if (isWalkIn !== '')
                params.isWalkIn = isWalkIn;
            if (dateFrom)
                params.dateFrom = dateFrom;
            if (dateTo)
                params.dateTo = dateTo;
            const res = await checkinApi.history(params);
            setRecords(res.data.data || []);
            setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    }, [page, search, status, isWalkIn, dateFrom, dateTo]);
    useEffect(() => { load(); }, [load]);
    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        load();
    };
    const exportCSV = () => {
        const header = ['ID', 'Visitor', 'Company', 'Host', 'Department', 'Checked In', 'Checked Out', 'Duration', 'Badge', 'Type', 'Reference'];
        const rows = records.map(r => [
            r.id, r.visitorName, r.visitorCompany, r.hostName, r.department,
            fmt(r.checkedInAt), fmt(r.checkedOutAt), fmtDur(r.durationMinutes),
            r.badgeNumber || '', r.isWalkIn ? 'Walk-In' : 'Pre-Registered', r.referenceCode || ''
        ]);
        const csv = [header, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `checkin-history-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };
    const initials = (name) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return (<div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Clock className="h-6 w-6 text-indigo-500"/>
            {t('receptionist.checkInHistoryTitle', 'Check-In History')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {pagination.total.toLocaleString()} {t('table.totalRecords', 'total records')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            <Download className="h-4 w-4"/> {t('btn.exportCsv', 'Export CSV')}
          </button>
          <button onClick={() => { setPage(1); load(); }} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> {t('btn.refresh', 'Refresh')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t('table.search', 'Search')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('placeholder.searchHistory', 'Visitor name, badge, reference...')} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
          </div>
          <div className="w-36">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t('table.status', 'Status')}</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full py-2 px-3 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">{t('filter.all', 'All')}</option>
              <option value="active">{t('status.activeInside', 'Active (Inside)')}</option>
              <option value="completed">{t('status.completed', 'Completed')}</option>
            </select>
          </div>
          <div className="w-36">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t('table.type', 'Type')}</label>
            <select value={isWalkIn} onChange={e => setIsWalkIn(e.target.value)} className="w-full py-2 px-3 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">{t('filter.allTypes', 'All Types')}</option>
              <option value="false">{t('type.preRegistered', 'Pre-Registered')}</option>
              <option value="true">{t('type.walkIn', 'Walk-In')}</option>
            </select>
          </div>
          <div className="w-36">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t('form.fromDate', 'From Date')}</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full py-2 px-3 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          </div>
          <div className="w-36">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t('form.toDate', 'To Date')}</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full py-2 px-3 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          </div>
          <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow transition flex items-center gap-1.5">
            <Filter className="h-4 w-4"/> {t('btn.apply', 'Apply')}
          </button>
        </form>
      </div>

      {error && (<div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {[t('table.visitor', 'Visitor'), t('table.type', 'Type'), t('table.checkIn', 'Check-In'), t('table.checkOut', 'Check-Out'), t('table.duration', 'Duration'), t('table.hostDept', 'Host / Dept'), t('table.badge', 'Badge'), t('table.status', 'Status')].map(h => (<th key={h} className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{h}</th>))}
              </tr>
            </thead>
            <tbody>
              {loading ? (<tr><td colSpan={8} className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-400 mx-auto"/></td></tr>) : records.length === 0 ? (<tr><td colSpan={8} className="p-10 text-center text-slate-400 text-sm">{t('empty.records', 'No records found')}</td></tr>) : records.map(r => (<React.Fragment key={r.id}>
                  <tr onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {initials(r.visitorName || '?')}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white text-sm">{r.visitorName}</p>
                          <p className="text-[11px] text-slate-400">{r.visitorCompany || r.visitorEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${r.isWalkIn ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'}`}>
                        {r.isWalkIn ? 'Walk-In' : 'Pre-Reg'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{fmt(r.checkedInAt)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{r.checkedOutAt ? fmt(r.checkedOutAt) : <span className="text-emerald-600 text-xs font-semibold">Inside</span>}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{fmtDur(r.durationMinutes)}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{r.hostName || '—'}</p>
                      <p className="text-[11px] text-slate-400">{r.department || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600 dark:text-slate-400">{r.badgeNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${r.checkedOutAt ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                        {r.checkedOutAt ? 'Completed' : '● Active'}
                      </span>
                    </td>
                  </tr>
                  {expanded === r.id && (<tr className="bg-indigo-50/50 dark:bg-indigo-950/20">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Reference Code</p><p className="font-mono text-slate-700 dark:text-slate-300">{r.referenceCode || '—'}</p></div>
                          <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Purpose</p><p className="text-slate-700 dark:text-slate-300">{r.purpose || '—'}</p></div>
                          <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Receptionist</p><p className="text-slate-700 dark:text-slate-300">{r.receptionistName || '—'}</p></div>
                          <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Notes</p><p className="text-slate-700 dark:text-slate-300">{r.notes || '—'}</p></div>
                        </div>
                      </td>
                    </tr>)}
                </React.Fragment>))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (<div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.pages} · {pagination.total} records
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <ChevronLeft className="h-4 w-4"/>
              </button>
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                const p = i + 1;
                return (<button key={p} onClick={() => setPage(p)} className={`w-8 h-8 text-sm font-semibold rounded-lg transition ${page === p ? 'bg-indigo-600 text-white' : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                    {p}
                  </button>);
            })}
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <ChevronRight className="h-4 w-4"/>
              </button>
            </div>
          </div>)}
      </div>
    </div>);
}
