import React, { useState } from 'react';
import { LogOut, Scan, CheckCircle2, AlertCircle, Loader2, Package } from 'lucide-react';
import { checkoutApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function CheckOutExitProcessing() {
    const { t } = useLanguage();
    const [code, setCode] = useState('');
    const [remarks, setRemarks] = useState('');
    const [passCondition, setPassCondition] = useState('GOOD');
    const [assets, setAssets] = useState([
        { name: 'Visitor Pass Badge', condition: 'GOOD', returned: true },
        { name: 'Lobby Access Card', condition: 'GOOD', returned: true },
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);
    const toggleAsset = (idx) => {
        setAssets(arr => arr.map((item, i) => i === idx ? { ...item, returned: !item.returned } : item));
    };
    const handleCheckout = async (e) => {
        e.preventDefault();
        if (!code.trim())
            return;
        setLoading(true);
        setError('');
        setSuccess(null);
        try {
            const res = await checkoutApi.process({
                code: code.trim(),
                remarks: remarks || undefined,
                passCondition,
                assets: assets.map(a => ({ name: a.name, condition: a.condition, returned: a.returned })),
            });
            setSuccess(res.data.data);
            setCode('');
            setRemarks('');
        }
        catch (err) {
            setError(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <LogOut className="h-6 w-6 text-rose-500"/> {t('checkout.exitProcessingTitle', 'Visitor Exit Processing')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('checkout.exitProcessingDesc', 'Process single visitor check-out, verify returned assets, and record departure')}
          </p>
        </div>

        {error && (<div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0"/> {error}
          </div>)}

        {success ? (<div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto"/>
            <p className="text-xl font-black text-slate-800 dark:text-white">{t('checkout.complete', 'Check-Out Complete')}</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{success.visitorName}</p>
            <p className="text-xs text-slate-500">{t('checkout.hostNotified', 'Host')} <strong>{success.hostName || 'Host'}</strong> {t('checkout.notifiedOfDeparture', 'notified of departure.')}</p>
            <p className="text-xs text-slate-400">{t('checkout.totalDuration', 'Total Duration')}: <strong>{success.totalVisitDuration || success.durationMinutes || '—'} {t('time.minutes', 'minutes')}</strong></p>
            <button onClick={() => setSuccess(null)} className="mt-2 px-5 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition shadow">
              {t('btn.processNextExit', 'Process Next Exit')}
            </button>
          </div>) : (<form onSubmit={handleCheckout} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                {t('form.scanBadgeOrCodeExit', 'Scan Badge / QR Code / Enter Reference Number')}
              </label>
              <div className="relative flex items-center">
                <Scan className="absolute left-3 h-4 w-4 text-slate-400"/>
                <input type="text" value={code} onChange={e => setCode(e.target.value)} autoFocus placeholder={t('placeholder.scanBadgeOrRef', 'Scan QR or enter VMS-XXXX / Badge number...')} className="w-full pl-9 pr-3 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-sm"/>
              </div>
            </div>

            {/* Asset Checklist */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                <Package className="h-3.5 w-3.5 text-rose-500"/> {t('checkout.assetReturnChecklist', 'Asset & Equipment Return Verification')}
              </label>
              <div className="space-y-2">
                {assets.map((item, idx) => (<div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                    <button type="button" onClick={() => toggleAsset(idx)} className={`px-3 py-1 text-xs font-bold rounded-lg transition ${item.returned ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
                      {item.returned ? t('status.returned', 'Returned ✓') : t('status.missing', 'Missing ✗')}
                    </button>
                  </div>))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">{t('form.passCondition', 'Pass Condition')}</label>
              <select value={passCondition} onChange={e => setPassCondition(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500">
                <option value="GOOD">{t('condition.good', 'Good Condition')}</option>
                <option value="DAMAGED">{t('condition.damaged', 'Damaged')}</option>
                <option value="LOST">{t('condition.lost', 'Lost / Unreturned')}</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">{t('form.exitRemarksOptional', 'Exit Remarks (Optional)')}</label>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} placeholder={t('placeholder.checkoutRemarks', 'Check-out remarks or incident notes...')} className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"/>
            </div>

            <button type="submit" disabled={loading || !code.trim()} className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 text-sm disabled:opacity-50">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin"/> {t('form.loading', 'Processing Exit...')}</> : <><LogOut className="h-4 w-4"/> {t('btn.completeCheckOut', 'Complete Check-Out')}</>}
            </button>
          </form>)}
      </div>
    </div>);
}
