import React, { useState } from 'react';
import { ShieldCheck, Search, CheckCircle2, Package, Loader2, AlertCircle } from 'lucide-react';
import { checkinApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
export default function VisitorScreening() {
    const { t, tStatus } = useLanguage();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [validation, setValidation] = useState(null);
    const [baggageChecked, setBaggageChecked] = useState(true);
    const [metalDetectorCleared, setMetalDetectorCleared] = useState(true);
    const [contrabandFound, setContrabandFound] = useState(false);
    const [escortRequired, setEscortRequired] = useState(false);
    const [notes, setNotes] = useState('');
    const [cleared, setCleared] = useState(false);
    const handleScan = async (e) => {
        e.preventDefault();
        if (!code.trim())
            return;
        setLoading(true);
        setError('');
        setValidation(null);
        setCleared(false);
        try {
            const isRef = code.startsWith('VMS-') || code.startsWith('WLK-');
            const res = await checkinApi.validate(isRef ? { referenceCode: code } : { qrToken: code });
            setValidation(res.data.data);
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    };
    const handleCompleteScreening = (approved) => {
        setCleared(true);
    };
    const checks = validation?.checks;
    const appt = checks?.appointment;
    return (<div className="min-h-screen bg-slate-950 text-white p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-500"/> {t('sidebar.visitorScreening', 'Security Screening Station')}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {t('securityDash.subtitle', 'Physical inspection, metal detector clearance, contraband check, and security authorization')}
          </p>
        </div>

        {/* Search / Scan Form */}
        <form onSubmit={handleScan} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              {t('checkin.searchVisitor', 'Visitor Pass / Reference Code / QR Token')}
            </label>
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-slate-400"/>
              <input type="text" value={code} onChange={e => setCode(e.target.value)} autoFocus placeholder={t('placeholder.scanQrCode', 'Scan QR or enter VMS-XXXX code...')} className="w-full pl-9 pr-3 py-3 bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"/>
            </div>
          </div>
          <button type="submit" disabled={loading || !code.trim()} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 text-sm disabled:opacity-50">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin"/> {t('form.loading', 'Verifying Credentials...')}</>
            : <><ShieldCheck className="h-4 w-4"/> {t('form.search', 'Load Visitor Security Record')}</>}
          </button>
        </form>

        {error && (<div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-900 rounded-xl text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0"/> {error}
          </div>)}

        {cleared && (<div className="bg-emerald-950/30 border border-emerald-800 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto"/>
            <p className="text-xl font-black text-white">{t('response.success', 'Security Screening Complete')}</p>
            <p className="text-sm text-slate-300">{t('screening.visitorClearedDesc', 'Visitor cleared for entrance into designated zone.')}</p>
            <button onClick={() => { setValidation(null); setCleared(false); setCode(''); }} className="mt-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-sm">
              {t('form.next', 'Screen Next Visitor')}
            </button>
          </div>)}

        {validation && !cleared && (<div className="space-y-4">
            {/* Visitor info summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shrink-0">
                {(appt?.visitorName || '?').charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-lg truncate">{appt?.visitorName || 'Unknown Visitor'}</p>
                <p className="text-xs text-slate-400">{appt?.email || '—'} · {t('table.status', 'Status')}: <span className="text-indigo-400 font-semibold">{tStatus(appt?.status) || 'N/A'}</span></p>
              </div>
            </div>

            {/* Inspection Checklist */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Package className="h-4 w-4 text-indigo-400"/> {t('screening.protocol', 'Physical Inspection Protocol')}
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-sm text-slate-300">{t('screening.baggageScanned', 'Baggage & Luggage Scanned')}</span>
                  <button type="button" onClick={() => setBaggageChecked(!baggageChecked)} className={`px-3 py-1 text-xs font-bold rounded-lg transition ${baggageChecked ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700' : 'bg-red-900/50 text-red-300 border border-red-700'}`}>
                    {baggageChecked ? t('status.passed', 'PASSED ✓') : t('status.failed', 'FAILED ✗')}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-sm text-slate-300">{t('screening.metalDetectorCleared', 'Metal Detector Gate Cleared')}</span>
                  <button type="button" onClick={() => setMetalDetectorCleared(!metalDetectorCleared)} className={`px-3 py-1 text-xs font-bold rounded-lg transition ${metalDetectorCleared ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700' : 'bg-red-900/50 text-red-300 border border-red-700'}`}>
                    {metalDetectorCleared ? t('status.cleared', 'CLEARED ✓') : t('status.alarm', 'ALARM ⚡')}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-sm text-slate-300">{t('screening.contrabandDetected', 'Contraband / Prohibited Items Detected')}</span>
                  <button type="button" onClick={() => setContrabandFound(!contrabandFound)} className={`px-3 py-1 text-xs font-bold rounded-lg transition ${contrabandFound ? 'bg-red-900/50 text-red-300 border border-red-700' : 'bg-slate-800 text-slate-400'}`}>
                    {contrabandFound ? t('status.yesAlert', 'YES ⚠') : t('status.none', 'NONE')}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-sm text-slate-300">{t('screening.escortRequired', 'Mandatory Security Escort Required')}</span>
                  <button type="button" onClick={() => setEscortRequired(!escortRequired)} className={`px-3 py-1 text-xs font-bold rounded-lg transition ${escortRequired ? 'bg-amber-900/50 text-amber-300 border border-amber-700' : 'bg-slate-800 text-slate-400'}`}>
                    {escortRequired ? t('status.requiredEscort', 'REQUIRED 🛡') : t('status.noEscort', 'NO ESCORT')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">{t('form.notes', 'Security Inspection Notes')}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder={t('placeholder.inspectionNotes', 'Inspection notes, temporary pass serial...')} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"/>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button" onClick={() => handleCompleteScreening(false)} className="py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition text-sm">
                  {t('form.reject', 'Deny Entry')}
                </button>
                <button type="button" onClick={() => handleCompleteScreening(true)} className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-sm shadow">
                  {t('form.approve', 'Authorize Clearance')}
                </button>
              </div>
            </div>
          </div>)}
      </div>
    </div>);
}
