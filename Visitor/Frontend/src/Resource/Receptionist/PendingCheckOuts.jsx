import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, RefreshCw, Loader2, AlertCircle, LogOut, ShieldAlert, Trash2 } from 'lucide-react';
import { checkinApi, checkoutApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';
export default function PendingCheckOuts() {
    const { t } = useLanguage();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [checkoutLoading, setCheckoutLoading] = useState(null);
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await checkoutApi.pending(search);
            setItems(res.data.data || []);
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    }, [search]);
    useEffect(() => { load(); }, [load]);
    const handleQuickCheckout = async (item) => {
        setCheckoutLoading(item.checkinId);
        try {
            await checkoutApi.process({ code: item.referenceCode || item.badgeNumber || String(item.checkinId) });
            setItems(prev => prev.filter(x => x.checkinId !== item.checkinId));
        }
        catch (err) {
            alert(getErrorMessage(err));
        }
        finally {
            setCheckoutLoading(null);
        }
    };
    const handleDeleteCheckin = async (item) => {
        const targetName = item.visitorName || 'this visitor';
        if (!window.confirm(`Are you sure you want to delete the check-in record for "${targetName}"?`)) return;
        try {
            await checkinApi.delete(item.checkinId);
            setItems(prev => prev.filter(x => x.checkinId !== item.checkinId));
        }
        catch (err) {
            alert(getErrorMessage(err, 'Failed to delete check-in record'));
        }
    };
    return (<div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-500"/> Pending Check-Outs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {items.length} active visitors currently inside organization
          </p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search active visitors by name, company, badge..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
        </div>
      </div>

      {error && (<div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{t('table.visitor', 'Visitor')}</th>
                <th className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{t('table.hostDept', 'Host / Dept')}</th>
                <th className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{t('table.checkInTime', 'Check-In Time')}</th>
                <th className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{t('table.timeInside', 'Time Inside')}</th>
                <th className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{t('table.badgeNumber', 'Badge / Ref')}</th>
                <th className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{t('table.status', 'Status')}</th>
                <th className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{t('table.action', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (<tr><td colSpan={7} className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-400 mx-auto"/></td></tr>) : items.length === 0 ? (<tr><td colSpan={7} className="p-10 text-center text-slate-400 text-sm">No active visitors inside</td></tr>) : items.map(item => (<tr key={item.checkinId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800 dark:text-white text-sm">{item.visitorName}</p>
                    <p className="text-[11px] text-slate-400">{item.visitorCompany || 'Independent'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-700 dark:text-slate-300">{item.hostName || '—'}</p>
                    <p className="text-[11px] text-slate-400">{item.department || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{fmt(item.checkedInAt)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400">{item.minutesInside}m</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-600 dark:text-slate-400">{item.badgeNumber || item.referenceCode || '—'}</td>
                  <td className="px-4 py-3">
                    {item.isOverstay ? (<span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                        <ShieldAlert className="h-3 w-3"/> Overstay (+{item.overstayMinutes}m)
                      </span>) : (<span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                        ● Inside
                      </span>)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleQuickCheckout(item)}
                        disabled={checkoutLoading === item.checkinId}
                        className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 hover:bg-amber-600 hover:text-white border border-amber-500/30 flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                        title="Check Out"
                      >
                        {checkoutLoading === item.checkinId ? <Loader2 className="h-4 w-4 animate-spin"/> : <LogOut className="h-4 w-4"/>}
                      </button>
                      <button
                        onClick={() => handleDeleteCheckin(item)}
                        className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-600 hover:text-white hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/40 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                        title="Delete Check-In Record"
                      >
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    </div>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
}
