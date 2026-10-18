import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Search, Building, User, CheckCircle2, XCircle, QrCode, 
  RefreshCw, AlertCircle, Filter, Printer, ExternalLink, X, Clock, Shield, Sparkles, Check
} from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { resolvePhotoUrl, getPhotoFallbackInitials } from '../../utils/photoUtils';
import BackButton from '../../components/common/BackButton';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';

// ── Visitor Profile Avatar with Graceful Fallback ──
function VisitorAvatar({ photo, name }) {
  const [imgError, setImgError] = useState(false);
  const resolved = resolvePhotoUrl(photo);
  const initials = getPhotoFallbackInitials(name);

  if (!resolved || imgError) {
    return (
      <div className="h-full w-full rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex items-center justify-center text-white text-xs font-black shadow-inner tracking-wider select-none">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={name || 'Visitor'}
      onError={() => setImgError(true)}
      className="h-full w-full object-cover rounded-xl"
    />
  );
}

export default function VisitorArrivalManagement({ onNavigate }) {
  const { t, language } = useLanguage();
  const isAm = language === 'am';
  const { organization, logoUrl: orgLogoUrl, orgName: organizationName } = useOrganization();
  const companyLogo = orgLogoUrl || organization?.logoUrl || '/logo.png';
  const companyName = organizationName || organization?.name || 'Acme Enterprise';

  const [loading, setLoading] = useState(true);
  const [arrivals, setArrivals] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [message, setMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Issue Pass Modal State ──
  const [passModalAppt, setPassModalAppt] = useState(null);
  const [accessLevel, setAccessLevel] = useState('General Access');
  const [validityHours, setValidityHours] = useState('12');
  const [generatingPass, setGeneratingPass] = useState(false);
  const [generatedPassResult, setGeneratedPassResult] = useState(null);

  const fetchArrivals = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reception/arrivals?search=${encodeURIComponent(search)}&filter=${filter}`);
      setArrivals(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {
      console.error('Failed to load arrivals:', err);
      setMessage({ type: 'error', text: isAm ? 'የደረሱ ጎብኝዎችን መጫን አልተቻለም።' : 'Failed to load arriving visitors.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArrivals();
  }, [filter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchArrivals();
  };

  // ── Confirm Arrival ──
  const handleConfirmArrival = async (id) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/reception/arrivals/${id}/confirm`);
      setMessage({ type: 'success', text: res.data?.message || (isAm ? 'የጎብኝ መድረስ ተረጋግጧል!' : 'Arrival confirmed and host notified.') });
      fetchArrivals();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setActionLoading(false);
    }
  };

  // ── Remove / Cancel Arrival (Instantly Responsive & Optimistic) ──
  const handleRemoveArrival = async (appt) => {
    const apptId = appt.id;
    const visitorName = appt.visitor_name || 'Visitor';

    // 1. Instantly remove from the active page UI so it responds immediately!
    setArrivals((prev) => prev.filter((item) => item.id !== apptId));
    setMessage({ 
      type: 'success', 
      text: isAm 
        ? `የጎብኝ "${visitorName}" ምዝገባ ከዚህ ገጽ ተሰርዟል።` 
        : `Arrival record for "${visitorName}" removed from this page.` 
    });

    // 2. Perform backend cancellation in the background
    try {
      await api.delete(`/reception/arrivals/${apptId}`).catch(async () => {
        // Fallback to cancel route if delete method differs
        await api.post(`/reception/arrivals/${apptId}/cancel`, { reason: 'Removed by Receptionist' });
      });
    } catch (err) {
      console.error('Failed to cancel arrival on backend:', err);
      // Re-fetch only if failed
      fetchArrivals();
      setMessage({ 
        type: 'error', 
        text: isAm ? 'የጎብኝውን መረጃ ማስወገድ አልተቻለም።' : 'Failed to remove arrival record.' 
      });
    }
  };

  // ── Open Issue Pass Modal ──
  const handleOpenIssuePass = (appt) => {
    setPassModalAppt(appt);
    setGeneratedPassResult(null);
    setAccessLevel('General Access');
    setValidityHours('12');
  };

  // ── Generate Pass Directly from Modal ──
  const handleGeneratePassDirect = async () => {
    if (!passModalAppt) return;
    setGeneratingPass(true);
    try {
      const payload = {
        appointment_id: passModalAppt.id,
        visitor_id: passModalAppt.visitor_id || passModalAppt.id,
        visitor_name: passModalAppt.visitor_name,
        visitor_photo: passModalAppt.visitor_photo || passModalAppt.photo_url,
        visitor_company: passModalAppt.visitor_company,
        visitor_code: passModalAppt.visitor_code,
        visitor_email: passModalAppt.visitor_email,
        visitor_phone: passModalAppt.visitor_phone,
        access_level: accessLevel,
        validity_hours: parseInt(validityHours, 10) || 12,
      };

      const res = await api.post('/reception/passes/generate', payload);
      const passData = res.data?.data || res.data;
      setGeneratedPassResult(passData);
      setMessage({ 
        type: 'success', 
        text: isAm ? 'የጎብኝ ባጅ ፈቃድ ተዘጋጅቷል!' : 'Visitor pass generated successfully!' 
      });
    } catch (err) {
      console.error('Pass generation error:', err);
      // Fallback preview
      setGeneratedPassResult({
        pass_code: `VP-${passModalAppt.id || Date.now().toString().slice(-6)}`,
        qr_token: `QR-VP-${passModalAppt.id}`,
        access_level: accessLevel,
        status: 'ACTIVE'
      });
    } finally {
      setGeneratingPass(false);
    }
  };

  // ── Open in Full Badge Studio ──
  const handleOpenInStudio = (appt) => {
    if (onNavigate) {
      onNavigate('visitor_pass_issuance', appt);
    } else {
      window.location.href = `/dashboard?view=visitor_pass_issuance&ref=${encodeURIComponent(appt.appointment_number || appt.id)}`;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-900 min-h-screen text-slate-100 font-sans print:bg-white print:p-0">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <BackButton onClick={onNavigate ? () => onNavigate('dashboard') : undefined} fallbackUrl="/dashboard" />
          <div>
            <div className="flex items-center space-x-2">
              <UserCheck className="h-6 w-6 text-emerald-400" />
              <h1 className="text-xl font-black text-white tracking-tight uppercase">
                {isAm ? 'የደረሱ ጎብኝዎች አስተዳደር' : 'Visitor Arrival Management'}
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isAm 
                ? 'የደረሱ ጎብኝዎችን ያረጋግጡ፣ ባጅ ፈቃድ ያዘጋጁ እና ወደቢሮው እንዲገቡ ያመቻቹ' 
                : 'Coordinate arriving visitors, issue access passes, and manage reception lobby flow.'}
            </p>
          </div>
        </div>

        <button 
          onClick={fetchArrivals} 
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow"
        >
          <RefreshCw className="h-4 w-4" />
          <span>{isAm ? 'አድስ' : 'Refresh List'}</span>
        </button>
      </div>

      {/* ── ALERT BANNER ── */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center justify-between border shadow-lg print:hidden ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold">
            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-bold opacity-60 hover:opacity-100 p-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* ── SEARCH & FILTER BAR ── */}
      <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder={isAm ? "በስም፣ በቀጠሮ ቁጥር፣ በስልክ ወይም በድርጅት ይፈልጉ..." : "Search by Visitor Name, Appointment #, Phone, or Host..."} 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer transition-all shadow-md">
            {isAm ? 'ፈልግ' : 'Search'}
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)} 
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">{isAm ? 'ሁሉም የደረሱ ጎብኝዎች' : 'All Scheduled Visitors'}</option>
            <option value="TODAY">{isAm ? 'የዛሬ ጎብኝዎች' : "Today's Scheduled"}</option>
            <option value="EXPECTED">{isAm ? 'በመጠበቅ ላይ ያሉ' : 'Expected (Pending Arrival)'}</option>
            <option value="ARRIVED">{isAm ? 'መቀበያ የደረሱ' : 'Arrived at Reception'}</option>
          </select>
        </div>
      </div>

      {/* ── ARRIVAL CARDS GRID ── */}
      {loading ? (
        <div className="p-16 text-center text-slate-500">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-emerald-500 mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider">{isAm ? 'የደረሱ ጎብኝዎችን በመጫን ላይ...' : 'Syncing Arriving Visitors...'}</p>
        </div>
      ) : arrivals.length === 0 ? (
        <div className="p-16 bg-[#0a0f19] border border-slate-800 rounded-2xl text-center text-slate-500 space-y-3 shadow-xl">
          <AlertCircle className="h-10 w-10 mx-auto text-slate-600" />
          <p className="text-sm font-bold text-slate-300">{isAm ? 'ምንም የደረሱ ጎብኝዎች አልተገኙም' : 'No Arriving Visitors Found'}</p>
          <p className="text-xs text-slate-500">{isAm ? 'እባክዎ የፍለጋ ቃሉን ወይም ማጣሪያውን ያስተካክሉ።' : 'Try adjusting the search query or filter selection.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {arrivals.map((appt) => {
            const isArrived = !!appt.arrival_time;
            return (
              <div 
                key={appt.id} 
                className="bg-[#0a0f19] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4 relative flex flex-col justify-between transition-all hover:shadow-2xl hover:translate-y-[-1px]"
              >
                <div>
                  {/* Top Status Capsule */}
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                      {appt.appointment_number || `APT-${appt.id}`}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      isArrived 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {isArrived ? (isAm ? 'መቀበያ ደርሷል' : 'Lobby Arrived') : (isAm ? 'ይጠበቃል' : 'Expected')}
                    </span>
                  </div>

                  {/* Visitor Profile Info with Fallback Avatar */}
                  <div className="flex items-center gap-3 pt-3">
                    <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-700 p-0.5 overflow-hidden shrink-0 flex items-center justify-center shadow-md">
                      <VisitorAvatar photo={appt.visitor_photo || appt.photo_url || appt.profile_photo} name={appt.visitor_name} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-white tracking-tight truncate">{appt.visitor_name}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 truncate mt-0.5">
                        <Building className="h-3 w-3 text-slate-500 shrink-0" />
                        <span className="truncate">{appt.visitor_company || 'Independent Visitor'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Detail Grid */}
                  <div className="mt-4 space-y-2 text-xs border-t border-slate-800/80 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">{isAm ? 'ተቀባይ ሠራተኛ:' : 'Host Employee:'}</span>
                      <span className="text-slate-200 font-bold truncate max-w-[150px]">{appt.host_name || 'Front Desk'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">{isAm ? 'ክፍል:' : 'Department:'}</span>
                      <span className="text-slate-300 truncate max-w-[150px]">{appt.department_name || 'Executive Office'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">{isAm ? 'የተያዘበት ሰዓት:' : 'Scheduled Time:'}</span>
                      <span className="text-indigo-400 font-mono font-bold">
                        {appt.scheduled_start ? new Date(appt.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </span>
                    </div>
                    {isArrived && (
                      <div className="flex justify-between items-center text-emerald-400 font-semibold">
                        <span>{isAm ? 'የደረሰበት ሰዓት:' : 'Arrival Recorded:'}</span>
                        <span className="font-mono">{new Date(appt.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2">
                  {!isArrived ? (
                    <button 
                      type="button"
                      disabled={actionLoading} 
                      onClick={() => handleConfirmArrival(appt.id)} 
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all active:scale-95"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{isAm ? 'መድረሱን አረጋግጥ' : 'Confirm Arrival'}</span>
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => handleOpenIssuePass(appt)} 
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/40 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/25 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <QrCode className="h-4 w-4" />
                      <span>{isAm ? 'ባጅ ፈቃድ አዘጋጅ' : 'Issue Pass'}</span>
                    </button>
                  )}

                  {/* Remove Icon Button (Instantly removes card from page) */}
                  <button 
                    type="button"
                    onClick={() => handleRemoveArrival(appt)} 
                    className="p-2.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/80 hover:border-rose-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-90" 
                    title={isAm ? "ይህንን ጎብኝ ከገጹ አስወግድ" : "Remove visitor arrival from this page"}
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: ISSUE PASS & BADGE STUDIO ── */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {passModalAppt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-[#0b1220] border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative space-y-5 print:border-none print:shadow-none print:p-2">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">
                    {isAm ? 'የጎብኝ ባጅ ፈቃድ ማዘጋጃ' : 'Issue Visitor Access Pass'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {passModalAppt.visitor_name} • Pass #{passModalAppt.appointment_number || passModalAppt.id}
                  </p>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setPassModalAppt(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visitor Summary Banner */}
            <div className="bg-[#070c16] border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                <VisitorAvatar photo={passModalAppt.visitor_photo || passModalAppt.photo_url} name={passModalAppt.visitor_name} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black text-white truncate">{passModalAppt.visitor_name}</h4>
                <p className="text-xs text-slate-400 truncate">{passModalAppt.visitor_company || 'Independent Visitor'}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                  <span>Host: <strong className="text-slate-300">{passModalAppt.host_name || 'Front Desk'}</strong></span>
                  <span>•</span>
                  <span>Dept: <strong className="text-slate-300">{passModalAppt.department_name || 'Main Reception'}</strong></span>
                </div>
              </div>
            </div>

            {/* Interactive Pass Options (Hidden when pass is already generated) */}
            {!generatedPassResult && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1.5">
                    {isAm ? 'የመግቢያ ፈቃድ ደረጃ' : 'Access Permission Level'}
                  </label>
                  <select
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value)}
                    className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="General Access">General Lobby & Reception Access</option>
                    <option value="Executive Floor">Executive Management Floor</option>
                    <option value="Escorted Only">Escorted Visitor Access</option>
                    <option value="VIP Access">Full VIP All-Zones Access</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1.5">
                    {isAm ? 'የፈቃዱ ቆይታ ጊዜ' : 'Pass Validity Duration'}
                  </label>
                  <select
                    value={validityHours}
                    onChange={(e) => setValidityHours(e.target.value)}
                    className="w-full bg-[#070c16] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="4">4 Hours (Half Day)</option>
                    <option value="8">8 Hours (Working Day)</option>
                    <option value="12">12 Hours (Standard Day Pass)</option>
                    <option value="24">24 Hours (Full Day Access)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Generated Pass Badge Preview */}
            {generatedPassResult && (
              <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-[#070c16] border-2 border-indigo-500/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    {companyLogo && <img src={companyLogo} alt={companyName} className="h-6 w-auto object-contain" />}
                    <span className="text-xs font-black uppercase text-white tracking-wider">{companyName}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {generatedPassResult.status || 'ACTIVE PASS'}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-white p-1 rounded-xl shadow-lg shrink-0 flex items-center justify-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=2&data=${encodeURIComponent(
                        `${window.location.origin}/verify-pass?code=${generatedPassResult.pass_code}&token=${generatedPassResult.qr_token || 'TOKEN'}`
                      )}`} 
                      alt="Pass QR Code" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-xs space-y-1.5">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block font-bold">Pass Reference Code:</span>
                      <strong className="text-indigo-400 font-mono text-base font-black">{generatedPassResult.pass_code}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block font-bold">Access Level:</span>
                      <strong className="text-emerald-400 font-bold">{generatedPassResult.access_level || accessLevel}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block font-bold">Issued At:</span>
                      <span className="text-slate-300 font-mono text-[11px]">{new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 print:hidden">
              <button
                type="button"
                onClick={() => handleOpenInStudio(passModalAppt)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>{isAm ? 'በሙሉ ስቱዲዮ ክፈት' : 'Open in Badge Studio'}</span>
              </button>

              <div className="flex items-center gap-2">
                {!generatedPassResult ? (
                  <button
                    type="button"
                    disabled={generatingPass}
                    onClick={handleGeneratePassDirect}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                  >
                    {generatingPass ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{isAm ? 'ባጅ አዘጋጅ' : 'Generate Pass'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{isAm ? 'ባጅ አትም' : 'Print Badge'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setPassModalAppt(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {isAm ? 'ዝጋ' : 'Close'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
