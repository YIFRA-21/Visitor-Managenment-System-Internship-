import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Loader2, Search, Eye, AlertCircle } from 'lucide-react';
import { checkinApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

const fmt = (dt) => dt ? new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
export default function CheckInValidation() {
    const { t } = useLanguage();
    const [code, setCode] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const validate = async (e) => {
        e.preventDefault();
        if (!code.trim())
            return;
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const isRef = code.startsWith('VMS-') || code.startsWith('WLK-');
            const res = await checkinApi.validate(isRef ? { referenceCode: code } : { qrToken: code });
            setResult(res.data.data);
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    };
    const StatusBadge = ({ ok, label }) => (<div className={`flex items-center gap-2 p-3 rounded-xl border ${ok ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40'}`}>
      {ok ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0"/> : <XCircle className="h-5 w-5 text-red-500 shrink-0"/>}
      <span className={`text-sm font-semibold ${ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{label}</span>
    </div>);
    const checks = result?.checks;
    const appt = checks?.appointment;
    const pass = checks?.pass;
    const bl = checks?.blacklist;
    const id = checks?.identity;
    return (<div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-500"/>
            {t('receptionist.preCheckValidation', 'Pre-Check Validation')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('receptionist.preCheckValidationDesc', 'Validate visitor credentials before processing check-in')}
          </p>
        </div>

        {/* Scan Input */}
        <form onSubmit={validate} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
              {t('form.refCodeOrPass', 'Reference Code / QR Token / Pass Code')}
            </label>
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-slate-400"/>
              <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder={t('placeholder.scanQrOrRef', 'Scan QR or enter reference code (VMS-XXXX)...')} autoFocus className="w-full pl-9 pr-3 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"/>
            </div>
          </div>
          <button type="submit" disabled={loading || !code.trim()} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin"/> {t('form.loading', 'Validating...')}</> : <><ShieldCheck className="h-4 w-4"/> {t('btn.validateVisitor', 'Validate Visitor')}</>}
          </button>
        </form>

        {error && (<div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0"/> {error}
          </div>)}

        {result && (<div className="space-y-4">
            {/* Overall Status Banner */}
            <div className={`rounded-2xl p-5 border-2 ${result.allClear
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700'
                : 'bg-red-50 dark:bg-red-950/30 border-red-400 dark:border-red-700'}`}>
              <div className="flex items-center gap-3">
                {result.allClear
                ? <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0"/>
                : <AlertTriangle className="h-8 w-8 text-red-500 shrink-0"/>}
                <div>
                  <p className={`text-lg font-black ${result.allClear ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}`}>
                    {result.allClear ? 'All Clear — Ready to Check In' : 'Validation Failed — Do Not Proceed'}
                  </p>
                  <p className={`text-sm ${result.allClear ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {result.allClear ? 'All security checks passed.' : 'One or more checks require attention.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Visitor Info */}
            {appt && (<div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-3 flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-indigo-400"/> Visitor Details
                </h3>
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-black shrink-0">
                    {(appt.visitorName || '?').charAt(0)}
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm flex-1">
                    <div><p className="text-[10px] text-slate-400 uppercase tracking-wider">Name</p><p className="font-semibold text-slate-800 dark:text-white">{appt.visitorName}</p></div>
                    <div><p className="text-[10px] text-slate-400 uppercase tracking-wider">Email</p><p className="font-semibold text-slate-800 dark:text-white">{appt.email}</p></div>
                    <div><p className="text-[10px] text-slate-400 uppercase tracking-wider">Appointment</p><p className="font-semibold text-slate-700 dark:text-slate-300">{appt.status}</p></div>
                    <div><p className="text-[10px] text-slate-400 uppercase tracking-wider">Scheduled</p><p className="font-semibold text-slate-700 dark:text-slate-300">{fmt(appt.scheduledStart)}</p></div>
                  </div>
                </div>
              </div>)}

            {/* Check Results */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-1 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400"/> Security Checks
              </h3>

              {appt && <StatusBadge ok={appt.valid} label={`Appointment: ${appt.valid ? 'Approved & Valid' : `Not Valid (${appt.status})`}`}/>}
              {pass && <StatusBadge ok={pass.valid} label={`Visitor Pass: ${pass.valid ? 'Active' : `Not Active (${pass.status})`}`}/>}
              {bl && <StatusBadge ok={!bl.onList} label={bl.onList ? `Blacklist: ⚠ On Watchlist — ${bl.reason}` : 'Blacklist: Not on Watchlist'}/>}
              {id && <StatusBadge ok={id.verified} label={`Identity: ${id.verified ? 'Verified' : `Not Verified (${id.status})`}`}/>}

              {!appt && !pass && !bl && !id && (<div className="flex items-center gap-2 text-amber-600 text-sm p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40">
                  <AlertTriangle className="h-4 w-4 shrink-0"/> No appointment or pass found for this code.
                </div>)}
            </div>
          </div>)}
      </div>
    </div>);
}
