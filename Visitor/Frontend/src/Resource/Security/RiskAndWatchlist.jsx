import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, UserX, Plus, Trash2, Search, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { securityApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function RiskAndWatchlist() {
    const { t } = useLanguage();
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [form, setForm] = useState({ email: '', phone: '', reason: '', riskLevel: 'MEDIUM' });
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await securityApi.watchlist();
            setWatchlist(res.data.data || res.data || []);
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.reason.trim())
            return;
        try {
            await securityApi.addToWatchlist(form);
            setShowAddModal(false);
            setForm({ email: '', phone: '', reason: '', riskLevel: 'MEDIUM' });
            load();
        }
        catch (err) {
            alert(getErrorMessage(err));
        }
    };
    const handleRemove = async (id) => {
        if (!confirm(t('confirm.removeWatchlist', 'Are you sure you want to remove this record from watchlist/blacklist?')))
            return;
        try {
            await securityApi.removeFromWatchlist(id);
            setWatchlist(prev => prev.filter(x => x.id !== id));
        }
        catch (err) {
            alert(getErrorMessage(err));
        }
    };
    const filtered = watchlist.filter(w => !search || (w.visitorName || w.email || w.phone || w.reason || '').toLowerCase().includes(search.toLowerCase()));
    const RiskBadge = ({ level }) => {
        const colors = {
            LOW: 'bg-blue-950 text-blue-400 border-blue-800',
            MEDIUM: 'bg-amber-950 text-amber-400 border-amber-800',
            HIGH: 'bg-orange-950 text-orange-400 border-orange-800',
            CRITICAL: 'bg-red-950 text-red-400 border-red-800',
        };
        return (<span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${colors[level] || colors.MEDIUM}`}>
        {level || 'MEDIUM'}
      </span>);
    };
    return (<div className="min-h-screen bg-slate-950 text-white p-4 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-500"/> {t('security.watchlistHub', 'Watchlist & Threat Intelligence Hub')}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {t('security.watchlistHubDesc', 'Blacklist and watchlist risk monitoring for flagged individuals')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow transition">
            <Plus className="h-4 w-4"/> {t('btn.addFlaggedVisitor', 'Add Flagged Visitor')}
          </button>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> {t('btn.refresh', 'Refresh')}
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('placeholder.searchWatchlist', 'Search by name, email, phone, or reason...')} className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"/>
        </div>
      </div>

      {error && (<div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-900 rounded-xl text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-extrabold uppercase text-slate-400">
                {[t('table.visitorContact', 'Visitor / Contact'), t('table.threatLevel', 'Threat Level'), t('table.reasonDetails', 'Reason & Details'), t('table.dateAdded', 'Added Date'), t('table.actions', 'Action')].map(h => (<th key={h} className="px-4 py-3">{h}</th>))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {loading ? (<tr><td colSpan={5} className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin text-red-400 mx-auto"/></td></tr>) : filtered.length === 0 ? (<tr><td colSpan={5} className="p-10 text-center text-slate-400">{t('empty.watchlist', 'No watchlist records found')}</td></tr>) : filtered.map(item => (<tr key={item.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3">
                    <p className="font-bold text-white">{item.visitorName || item.email || 'Anonymous'}</p>
                    <p className="text-xs text-slate-400">{item.phone || item.email || 'No contact details'}</p>
                  </td>
                  <td className="px-4 py-3"><RiskBadge level={item.riskLevel}/></td>
                  <td className="px-4 py-3 text-xs text-slate-300 max-w-md">{item.reason}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleRemove(item.id)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition">
                      <Trash2 className="h-4 w-4"/>
                    </button>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-500"/> {t('security.flagVisitorTitle', 'Flag Visitor to Watchlist')}
            </h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('form.emailOrId', 'Visitor Email / Identifier')}</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder={t('placeholder.email', 'visitor@example.com')} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"/>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('form.phone', 'Phone Number')}</label>
                <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder={t('placeholder.phone', '+251-9XX-XXX-XXX')} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"/>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('form.threatLevel', 'Threat Level')}</label>
                <select value={form.riskLevel} onChange={e => setForm(f => ({ ...f, riskLevel: e.target.value }))} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm">
                  <option value="LOW">{t('risk.low', 'Low Risk')}</option>
                  <option value="MEDIUM">{t('risk.medium', 'Medium Risk')}</option>
                  <option value="HIGH">{t('risk.high', 'High Risk')}</option>
                  <option value="CRITICAL">{t('risk.critical', 'Critical Threat / Blacklist')}</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('form.reasonForFlagging', 'Reason for Flagging *')}</label>
                <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required rows={3} placeholder={t('placeholder.reasonForFlagging', 'Describe threat or security concern...')} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm resize-none"/>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-sm">{t('btn.cancel', 'Cancel')}</button>
                <button type="submit" className="flex-1 py-2 bg-red-600 text-white font-bold rounded-xl text-sm shadow">{t('btn.flagVisitor', 'Flag Visitor')}</button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
