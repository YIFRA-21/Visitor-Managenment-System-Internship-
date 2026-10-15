import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { securityApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
export default function EscortManagement() {
    const { t } = useLanguage();
    const [escorts, setEscorts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ visitorId: '', escortUserId: '' });
    const [showModal, setShowModal] = useState(false);
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await securityApi.escorts();
            setEscorts(res.data.data || res.data || []);
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    const handleAssign = async (e) => {
        e.preventDefault();
        if (!form.visitorId || !form.escortUserId)
            return;
        try {
            await securityApi.assignEscort({ visitorId: Number(form.visitorId), escortUserId: Number(form.escortUserId) });
            setShowModal(false);
            setForm({ visitorId: '', escortUserId: '' });
            load();
        }
        catch (err) {
            alert(getErrorMessage(err));
        }
    };
    return (<div className="min-h-screen bg-slate-950 text-white p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Shield className="h-6 w-6 text-amber-500"/> Security Escort Management
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Dispatch and monitor security escorts assigned to restricted area visitors and VIP guests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow transition">
            <Plus className="h-4 w-4"/> Assign Escort
          </button>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Refresh
          </button>
        </div>
      </div>

      {error && (<div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-900 rounded-xl text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0"/> {error}
        </div>)}

      {loading ? (<div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-400"/></div>) : escorts.length === 0 ? (<div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          No active security escort assignments
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {escorts.map(item => (<div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                  Escort Active
                </span>
                <span className="text-xs text-slate-400">Assigned: {new Date(item.assignedAt).toLocaleTimeString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm pt-1">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Visitor</p>
                  <p className="font-bold text-white mt-0.5">{item.visitorName}</p>
                  <p className="text-xs text-slate-400">{item.company || '—'}</p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Escort Officer</p>
                  <p className="font-bold text-amber-400 mt-0.5">{item.escortName}</p>
                  <p className="text-xs text-slate-400">{item.escortPhone || 'No phone'}</p>
                </div>
              </div>
            </div>))}
        </div>)}

      {showModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500"/> Assign Security Escort
            </h2>
            <form onSubmit={handleAssign} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('form.visitorId', 'Visitor ID')}</label>
                <input type="number" value={form.visitorId} onChange={e => setForm(f => ({ ...f, visitorId: e.target.value }))} required placeholder={t('placeholder.idNumber', 'Numeric visitor ID')} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"/>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t('form.escortOfficer', 'Escort Officer User ID')}</label>
                <input type="number" value={form.escortUserId} onChange={e => setForm(f => ({ ...f, escortUserId: e.target.value }))} required placeholder={t('placeholder.idNumber', 'Numeric officer user ID')} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm"/>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-sm">{t('btn.cancel', 'Cancel')}</button>
                <button type="submit" className="flex-1 py-2 bg-amber-600 text-white font-bold rounded-xl text-sm shadow">{t('btn.submit', 'Assign Escort')}</button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
