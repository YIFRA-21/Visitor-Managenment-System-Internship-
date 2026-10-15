import React, { useState } from 'react';
import { Search, CheckCircle2, AlertCircle, QrCode, User, Building, ArrowRight, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import BackButton from '../../components/common/BackButton';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AppointmentVerification({ onNavigate }) {
    const { t } = useLanguage();
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [message, setMessage] = useState('');
    const handleVerify = async (e) => {
        e.preventDefault();
        if (!query.trim())
            return;
        setLoading(true);
        setMessage('');
        try {
            const res = await api.post('/reception/verify-appointment', { query: query.trim() });
            setResult(res.data);
            if (!res.data.verified) {
                setMessage('No valid appointment record matched your search query.');
            }
        }
        catch (err) {
            console.error(err);
            setMessage(err.response?.data?.error || 'Verification query failed.');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="p-6 space-y-6 bg-slate-900 min-h-screen text-slate-100 font-sans">
      {/* Header Banner */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <BackButton onClick={onNavigate ? () => onNavigate('dashboard') : undefined} fallbackUrl="/dashboard"/>
          <div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-6 w-6 text-blue-400"/>
              <h1 className="text-xl font-black text-white tracking-tight uppercase">{t('reception.apptVerificationTitle', 'Appointment Verification Workspace')}</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t('reception.apptVerificationSub', 'Verify visitor appointment details, host assignment, and scheduled time prior to lobby check-in.')}
            </p>
          </div>
        </div>

        {/* Role Boundary Notice */}
        <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center space-x-2 text-amber-300 text-[11px] font-semibold">
          <ShieldAlert className="h-4 w-4 shrink-0"/>
          <span>{t('reception.infoOnlyNotice', 'Reception Mode: Info Verification Only (No Approval / Security Authority)')}</span>
        </div>
      </div>

      {/* Search Input Panel */}
      <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-3xl mx-auto space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Search className="h-4 w-4 text-blue-400"/>
          <span>{t('reception.searchRecord', 'Search & Verify Appointment Record')}</span>
        </h2>
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="relative">
            <input type="text" placeholder={t('placeholder.enterApptQuery', 'Enter Appointment Number (APT-...), Visitor ID, Ref Code, or QR Code Token...')} value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-slate-900 border-2 border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none shadow-inner"/>
          </div>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="text-[11px] text-slate-500 space-x-2">
              <span>{t('reception.quickSearchHints', 'Quick Search Hints:')}</span>
              <button type="button" onClick={() => setQuery('APT-2026-00101')} className="underline hover:text-blue-400">APT-2026-00101</button>
              <button type="button" onClick={() => setQuery('REF-8145-2026')} className="underline hover:text-blue-400">REF-8145-2026</button>
              <button type="button" onClick={() => setQuery('John Smith')} className="underline hover:text-blue-400">John Smith</button>
            </div>
            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg">
              {loading ? t('form.loading', 'Verifying...') : t('btn.verifyNow', 'Verify Now')}
              <ArrowRight className="h-4 w-4"/>
            </button>
          </div>
        </form>
      </div>

      {/* Message Output */}
      {message && (<div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs font-bold max-w-3xl mx-auto flex items-center gap-2">
          <AlertCircle className="h-4 w-4"/>
          <span>{message}</span>
        </div>)}

      {/* Results Verification Details */}
      {result && result.verified && result.records && (<div className="space-y-6 max-w-4xl mx-auto">
          <h2 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4"/>
            <span>Verification Success ({result.count} Match Found)</span>
          </h2>

          <div className="space-y-4">
            {result.records.map((rec) => (<div key={rec.id} className="bg-[#0a0f19] border-2 border-emerald-500/30 rounded-2xl p-6 shadow-2xl space-y-6">
                {/* Header info */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Appointment Verified
                    </span>
                    <h3 className="text-lg font-black text-white mt-1 font-mono">{rec.appointment_number}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-semibold">Status</span>
                    <span className="text-sm font-bold text-blue-400 uppercase">{rec.status || 'APPROVED'}</span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Visitor Section */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <User className="h-4 w-4 text-emerald-400"/>
                      <span>Visitor Information</span>
                    </h4>
                    <div className="space-y-1.5 text-slate-300">
                      <p><span className="text-slate-500">Name:</span> <strong className="text-white">{rec.visitor_name}</strong></p>
                      <p><span className="text-slate-500">Company:</span> {rec.visitor_company || 'N/A'}</p>
                      <p><span className="text-slate-500">Email:</span> {rec.visitor_email || 'N/A'}</p>
                      <p><span className="text-slate-500">Phone:</span> {rec.visitor_phone || 'N/A'}</p>
                      <p><span className="text-slate-500">ID Info:</span> {rec.id_type || 'National ID'} ({rec.id_number || 'N/A'})</p>
                    </div>
                  </div>

                  {/* Host Section */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Building className="h-4 w-4 text-purple-400"/>
                      <span>Host & Meeting Details</span>
                    </h4>
                    <div className="space-y-1.5 text-slate-300">
                      <p><span className="text-slate-500">Host Name:</span> <strong className="text-white">{rec.host_name}</strong></p>
                      <p><span className="text-slate-500">Department:</span> {rec.department_name}</p>
                      <p><span className="text-slate-500">Room Location:</span> {rec.room_name || 'Meeting Room'} ({rec.room_location || 'Lobby Fl 2'})</p>
                      <p><span className="text-slate-500">Scheduled:</span> <strong className="text-indigo-300">{new Date(rec.scheduled_start).toLocaleString()}</strong></p>
                      <p><span className="text-slate-500">Purpose:</span> {rec.purpose || 'Official Business'}</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap justify-end gap-3">
                  <button onClick={() => onNavigate && onNavigate('arrivals')} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg">
                    <CheckCircle2 className="h-4 w-4"/>
                    <span>Proceed to Confirm Arrival</span>
                  </button>
                  <button onClick={() => onNavigate && onNavigate('passes')} className="px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <QrCode className="h-4 w-4"/>
                    <span>Issue Visitor Pass</span>
                  </button>
                </div>
              </div>))}
          </div>
        </div>)}
    </div>);
}
