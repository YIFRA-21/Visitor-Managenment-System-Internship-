import React, { useState } from 'react';
import { securityApi, checkoutApi } from '../../services/api';
import BackButton from '../../components/common/BackButton';
import { LogOut, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
export default function QRScanner() {
    const { t, tStatus } = useLanguage();
    const [code, setCode] = useState('');
    const [res, setRes] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const [checkoutMsg, setCheckoutMsg] = useState('');
    const handleVerify = async (e) => {
        e.preventDefault();
        setErr('');
        setRes(null);
        setCheckoutMsg('');
        setLoading(true);
        try {
            const verifyRes = await securityApi.verify(code.trim());
            setRes(verifyRes.data);
        }
        catch {
            setErr(t('response.error', 'Verification failed. Invalid reference code.'));
        }
        finally {
            setLoading(false);
        }
    };
    const handleGateCheckout = async () => {
        if (!res)
            return;
        setCheckingOut(true);
        setErr('');
        try {
            const targetCode = res.reference_code || res.referenceCode || code.trim();
            await checkoutApi.process({
                code: targetCode,
                checkoutMethod: 'SECURITY_GATE',
                remarks: 'Gate exit clearance confirmed by Security Officer'
            });
            setCheckoutMsg(`✓ ${t('response.checkOutSuccess', 'Visitor successfully checked out at Security Gate!')}`);
            setRes((prev) => prev ? { ...prev, status: 'CHECKED_OUT' } : null);
        }
        catch (checkoutErr) {
            setErr(checkoutErr?.response?.data?.message || checkoutErr?.response?.data?.error || t('response.error', 'Failed to process gate checkout.'));
        }
        finally {
            setCheckingOut(false);
        }
    };
    const isCheckedIn = (res?.status || '').toUpperCase() === 'CHECKED_IN';
    const isCheckedOut = (res?.status || '').toUpperCase() === 'CHECKED_OUT';
    return (<div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 shadow-2xl transition-all duration-300 hover:border-indigo-500/50 space-y-4">
      <div className="flex items-center gap-3">
        <BackButton fallbackUrl="/dashboard"/>
        <div>
          <h3 className="font-bold text-xs uppercase tracking-widest text-slate-300">{t('securityDash.verifyPass', 'Gate Pass & Security Clearance')}</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">{t('securityDash.subtitle', 'Validate appointment token and authorize gate exit / entry')}</p>
        </div>
      </div>
      <div className="max-w-md bg-[#0b101b] border border-slate-800 rounded-xl p-6">

        <form onSubmit={handleVerify} className="flex gap-2">
          <input className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono text-center" placeholder="VMS-XXXXX" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required/>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50">
            {loading ? t('form.loading', 'Verifying...') : t('form.approve', 'Verify')}
          </button>
        </form>

        {err && <div className="mt-4 text-rose-400 text-xs font-semibold font-mono bg-rose-950/30 p-2.5 rounded-lg border border-rose-900">&gt; {err}</div>}
        {checkoutMsg && <div className="mt-4 text-emerald-400 text-xs font-semibold font-mono bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900">{checkoutMsg}</div>}

        {res && (<div className={`mt-4 rounded-xl p-4 border ${res.is_blacklisted
                ? 'bg-rose-950/20 border-rose-500/20 text-rose-400'
                : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'}`}>
            <h4 className="font-bold text-sm text-white mb-2">{res.full_name}</h4>
            <div className="space-y-1 text-[10px] font-mono text-slate-400">
              <div>{t('table.company', 'Company')}: {res.company || 'N/A'}</div>
              <div>{t('table.host', 'Host')}: {res.host_name}</div>
              <div>{t('table.status', 'Status')}: <span className="font-bold uppercase text-white">{tStatus(res.status)}</span></div>
            </div>
            {res.is_blacklisted ? (<div className="mt-3 text-xs font-black text-rose-400 animate-pulse flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4"/> {t('status.blacklisted', 'WARNING: VISITOR BLACKLISTED')}
              </div>) : (<div className="mt-3 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4"/> {t('status.approved', 'VISITOR AUTHORIZED')}
              </div>)}

            {/* Check-Out Action for Security Officer when Visitor is inside */}
            {isCheckedIn && (<div className="mt-4 pt-3 border-t border-slate-800">
                <button type="button" onClick={handleGateCheckout} disabled={checkingOut} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-rose-600/20 transition">
                  <LogOut className="w-4 h-4"/>
                  <span>{checkingOut ? t('form.loading', 'Checking Out...') : t('form.checkOut', 'Process Gate Exit & Check-Out')}</span>
                </button>
              </div>)}

            {isCheckedOut && (<div className="mt-3 text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400"/> {t('status.checkedOut', 'Visit Completed / Checked Out')}
              </div>)}
          </div>)}
      </div>
    </div>);
}
