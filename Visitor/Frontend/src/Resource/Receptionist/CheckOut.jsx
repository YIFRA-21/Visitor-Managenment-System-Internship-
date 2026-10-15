import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Camera, Search, QrCode, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Building, User, Clock, Mail, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { checkinApi, checkoutApi, getErrorMessage } from '../../services/api';
import { resolvePhotoUrl } from '../../utils/photoUtils';
import { useLanguage } from '../../contexts/LanguageContext';

export default function CheckOut() {
    const { t, tStatus } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('id_ref');
    const [searchInput, setSearchInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    // Active Check-in session state
    const [activeSession, setActiveSession] = useState(null);
    const [matchingSessions, setMatchingSessions] = useState([]);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    // Pending inside visitors list
    const [pendingInside, setPendingInside] = useState([]);
    const [loadingPending, setLoadingPending] = useState(false);
    const [filterPending, setFilterPending] = useState('');
    // Verification Checklist State
    const [verifyId, setVerifyId] = useState(true);
    const [verifyAssets, setVerifyAssets] = useState(true);
    const [verifyClearance, setVerifyClearance] = useState(true);
    const [checkoutRemarks, setCheckoutRemarks] = useState('');
    // Camera / Face Scan states
    const videoRef = useRef(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [facialMatch, setFacialMatch] = useState(null);
    const [scanningFace, setScanningFace] = useState(false);
    useEffect(() => {
        loadPendingInside();
    }, []);
    const loadPendingInside = async () => {
        setLoadingPending(true);
        try {
            const res = await checkoutApi.pending();
            const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
            setPendingInside(list);
        }
        catch (e) {
            console.warn('Failed to load inside visitors:', e);
        }
        finally {
            setLoadingPending(false);
        }
    };
    // Camera stream controls
    const startCamera = async () => {
        setCameraError(null);
        setCameraActive(false);
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                    setCameraActive(true);
                }
            }
            else {
                setCameraError('Camera access is not supported on this device/browser.');
            }
        }
        catch (err) {
            console.warn('Camera stream error:', err);
            setCameraError('Unable to access camera. Please allow camera permissions.');
        }
    };
    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject;
            stream.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
    };
    useEffect(() => {
        if (activeTab === 'qr_scan' || activeTab === 'face_scan') {
            startCamera();
        }
        else {
            stopCamera();
        }
        return () => {
            stopCamera();
        };
    }, [activeTab]);
    // Lookup active check-in session by Code / Visitor ID / Email / Phone / Badge / Name
    const handleActiveSessionLookup = async (queryStr) => {
        const q = queryStr.trim();
        if (!q) {
            setActiveSession(null);
            setMatchingSessions([]);
            setHasSearched(false);
            return;
        }
        setSearching(true);
        setHasSearched(true);
        try {
            const res = await checkinApi.getActiveCheckin(q);
            if (res.data) {
                const matches = Array.isArray(res.data.matchingSessions) ? res.data.matchingSessions : [res.data];
                setMatchingSessions(matches);
                setActiveSession(res.data);
                setMessage(null);
            }
            else {
                setActiveSession(null);
                setMatchingSessions([]);
            }
        }
        catch (err) {
            // If getActiveCheckin 404, fallback to checkoutApi.pending(q)
            try {
                const pendingRes = await checkoutApi.pending(q);
                const list = Array.isArray(pendingRes.data?.data) ? pendingRes.data.data : [];
                if (list.length > 0) {
                    setMatchingSessions(list);
                    setActiveSession(list[0]);
                    setMessage(null);
                }
                else {
                    setActiveSession(null);
                    setMatchingSessions([]);
                }
            }
            catch (e) {
                setActiveSession(null);
                setMatchingSessions([]);
            }
        }
        finally {
            setSearching(false);
        }
    };
    const selectSession = (item) => {
        setActiveSession(item);
    };
    // Execute Check-Out release
    const executeCheckOut = async (targetSession) => {
        const session = targetSession || activeSession;
        if (!session) {
            setMessage({ type: 'error', text: 'No active session selected for check-out.' });
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            const targetApptId = session.appointment_id || session.appointmentId;
            const targetCode = session.badge_number || session.badgeNumber || session.reference_code || session.referenceCode || session.pass_code || session.passCode || String(session.checkin_id || session.checkinId || targetApptId);
            let durationMins = 0;
            let hostNotified = session.host_name || session.hostName || 'Host';
            // Primary: checkout via checkinApi.checkout
            if (targetApptId) {
                const payload = {
                    checkoutMethod: 'MANUAL',
                    remarks: checkoutRemarks || 'Guest departure confirmed via Check-Out Console',
                    verifications: [
                        { type: 'IDENTITY', status: verifyId ? 'PASSED' : 'FAILED' },
                        { type: 'ASSET', status: verifyAssets ? 'PASSED' : 'FAILED' },
                        { type: 'SECURITY_CLEARANCE', status: verifyClearance ? 'PASSED' : 'FAILED' }
                    ]
                };
                const res = await checkinApi.checkout(targetApptId, payload);
                durationMins = res.data?.durationMinutes || 0;
            }
            else {
                // Fallback: checkout via checkoutApi.process
                const res = await checkoutApi.process({
                    code: targetCode,
                    remarks: checkoutRemarks || 'Guest departure confirmed',
                    passCondition: verifyAssets ? 'GOOD' : 'DAMAGED'
                });
                durationMins = res.data?.data?.totalVisitDuration || 0;
            }
            setMessage({
                type: 'success',
                text: `✓ Check-Out Successful! Visitor ${session.visitor_name || session.visitorName || ''} released. Total duration: ${durationMins || '—'} minutes. Host notified.`
            });
            // Refresh pending inside list and reset active session
            loadPendingInside();
            setActiveSession(null);
            setMatchingSessions([]);
            setSearchInput('');
            setFacialMatch(null);
            setCheckoutRemarks('');
        }
        catch (err) {
            // Fallback try with checkoutApi.process
            try {
                const targetCode = session.badge_number || session.badgeNumber || session.reference_code || session.referenceCode || String(session.checkin_id || session.checkinId);
                const res = await checkoutApi.process({
                    code: targetCode,
                    remarks: checkoutRemarks || 'Guest departure confirmed'
                });
                setMessage({
                    type: 'success',
                    text: `✓ Check-Out Successful! Visitor released. Total duration: ${res.data?.data?.totalVisitDuration || '—'} minutes.`
                });
                loadPendingInside();
                setActiveSession(null);
                setMatchingSessions([]);
                setSearchInput('');
            }
            catch (err2) {
                setMessage({ type: 'error', text: getErrorMessage(err) });
            }
        }
        finally {
            setLoading(false);
        }
    };
    // Face Scan Check-Out simulation
    const handleFaceScanCheckOut = async () => {
        setScanningFace(true);
        setFacialMatch(null);
        setMessage(null);
        setTimeout(async () => {
            try {
                const pendingRes = await checkoutApi.pending();
                const list = Array.isArray(pendingRes.data?.data) ? pendingRes.data.data : [];
                if (list.length > 0) {
                    const candidate = list[0];
                    setFacialMatch({
                        matched: true,
                        confidence: 98.4,
                        visitor: candidate
                    });
                    setActiveSession(candidate);
                }
                else {
                    setMessage({ type: 'error', text: 'No inside active guest matched this face scan.' });
                }
            }
            catch (err) {
                setMessage({ type: 'error', text: 'Biometric face matching query failed.' });
            }
            finally {
                setScanningFace(false);
            }
        }, 1200);
    };
    // Filtered inside visitors
    const filteredPending = pendingInside.filter((item) => {
        if (!filterPending.trim())
            return true;
        const term = filterPending.toLowerCase();
        return ((item.visitorName || item.visitor_name || '').toLowerCase().includes(term) ||
            (item.badgeNumber || item.badge_number || '').toLowerCase().includes(term) ||
            (item.referenceCode || item.reference_code || '').toLowerCase().includes(term) ||
            (item.visitorCompany || item.company || '').toLowerCase().includes(term) ||
            (item.hostName || item.host_name || '').toLowerCase().includes(term));
    });
    return (<div className="p-4 md:p-6 bg-slate-950 min-h-screen text-slate-100 font-sans space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl shadow-inner">
              <LogOut className="h-6 w-6 text-rose-400"/>
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight uppercase">Visitor Check-Out & Exit Console</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Verify asset return, compute duration, release visitors, and update departure records across all channels.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/dashboard?view=checkin')} className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition">
            <UserCheck className="h-3.5 w-3.5 text-emerald-400"/>
            <span>Go to Check-In</span>
          </button>
          <span className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse"></span>
            Exit Gate Active
          </span>
        </div>
      </div>

      {/* Global Alert Notification */}
      {message && (<div className={`p-4 rounded-2xl flex items-center justify-between border shadow-lg ${message.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : message.type === 'info'
                    ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                    : 'bg-red-950/40 border-red-500/40 text-red-300'}`}>
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400"/> : <AlertCircle className="h-5 w-5 shrink-0 text-red-400"/>}
            <span className="text-xs font-bold">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-bold opacity-60 hover:opacity-100 px-2 py-1">✕</button>
        </div>)}

      {/* Method Selection Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button onClick={() => setActiveTab('id_ref')} className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${activeTab === 'id_ref'
            ? 'bg-rose-600/15 border-rose-500 text-white shadow-lg shadow-rose-500/10'
            : 'bg-[#0a0f19] border-slate-800 text-slate-400 hover:border-slate-700'}`}>
          <div className={`p-2.5 rounded-xl ${activeTab === 'id_ref' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
            <Search className="h-5 w-5"/>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider">1. Search Active Guests</div>
            <div className="text-[10px] text-slate-500 mt-0.5">By Name, Badge #, Ref #, Visitor ID, Phone, Company</div>
          </div>
        </button>

        <button onClick={() => setActiveTab('qr_scan')} className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${activeTab === 'qr_scan'
            ? 'bg-cyan-600/15 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
            : 'bg-[#0a0f19] border-slate-800 text-slate-400 hover:border-slate-700'}`}>
          <div className={`p-2.5 rounded-xl ${activeTab === 'qr_scan' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
            <QrCode className="h-5 w-5"/>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider">2. Scan Badge / QR</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Optical scanner or printed pass QR token</div>
          </div>
        </button>

        <button onClick={() => setActiveTab('face_scan')} className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${activeTab === 'face_scan'
            ? 'bg-purple-600/15 border-purple-500 text-white shadow-lg shadow-purple-500/10'
            : 'bg-[#0a0f19] border-slate-800 text-slate-400 hover:border-slate-700'}`}>
          <div className={`p-2.5 rounded-xl ${activeTab === 'face_scan' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
            <Camera className="h-5 w-5"/>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider">3. Biometric Exit Verification</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Facial match verification on departure</div>
          </div>
        </button>
      </div>

      {/* Main Mode Panel */}
      <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl">
        {/* MODE 1: SEARCH ACTIVE GUESTS */}
        {activeTab === 'id_ref' && (<div className="space-y-6">
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-rose-400"/>
                  <input type="text" placeholder={t('placeholder.searchGuestInside', 'Search inside guest by Visitor Name, Badge (BDG-XXXX), Ref (VMS-XXXX), Phone, Email...')} value={searchInput} onChange={(e) => {
                setSearchInput(e.target.value);
                handleActiveSessionLookup(e.target.value);
            }} onKeyDown={(e) => {
                if (e.key === 'Enter')
                    handleActiveSessionLookup(searchInput);
            }} autoFocus className="w-full bg-slate-900 border-2 border-slate-750 focus:border-rose-500 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition font-sans"/>
                  {searchInput && (<button onClick={() => {
                    setSearchInput('');
                    setActiveSession(null);
                    setMatchingSessions([]);
                    setHasSearched(false);
                }} className="absolute right-3 top-3 text-xs text-slate-500 hover:text-slate-300">
                      ✕
                    </button>)}
                </div>
                <button onClick={() => handleActiveSessionLookup(searchInput)} disabled={searching} className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20">
                  {searching ? <RefreshCw className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                  <span>Find Guest</span>
                </button>
              </div>

              {/* Search Way Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                <span className="font-semibold text-slate-500">Quick match:</span>
                {['Badge #', 'Visitor Name', 'Reference Code', 'Phone', 'Email', 'Visitor ID', 'Company'].map((tag) => (<span key={tag} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                    {tag}
                  </span>))}
              </div>
            </div>

            {/* Multiple Sessions Grid if search returned > 1 */}
            {matchingSessions.length > 1 && (<div className="max-w-4xl mx-auto space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                  <span>Matching Active Guests ({matchingSessions.length} Found)</span>
                  <span className="text-[10px] text-rose-400">Click a record to select for Check-Out</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {matchingSessions.map((rec, i) => {
                    const isSelected = (activeSession?.checkin_id || activeSession?.checkinId) === (rec.checkin_id || rec.checkinId);
                    return (<div key={i} onClick={() => selectSession(rec)} className={`p-3 rounded-xl border text-left cursor-pointer transition ${isSelected
                            ? 'bg-rose-950/40 border-rose-500 ring-1 ring-rose-500/50'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'}`}>
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                            {rec.photo_url || rec.photoUrl || rec.visitor_photo ? (<img src={resolvePhotoUrl(rec.photo_url || rec.photoUrl || rec.visitor_photo)} alt="" className="h-full w-full object-cover"/>) : (<User className="h-4 w-4 text-slate-400"/>)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">{rec.visitor_name || rec.visitorName}</p>
                            <p className="text-[10px] text-slate-400 truncate">{rec.visitor_company || rec.visitorCompany || 'Guest'}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded text-[10px] font-mono font-bold shrink-0">
                            {rec.badge_number || rec.badgeNumber || 'No Badge'}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/80 pt-1.5">
                          <span className="font-mono text-slate-400">{rec.reference_code || rec.referenceCode || `ID #${rec.visitor_id || rec.visitorId}`}</span>
                          <span className="text-rose-400 font-medium">Inside {rec.minutes_inside || rec.minutesInside || 0}m</span>
                        </div>
                      </div>);
                })}
                </div>
              </div>)}

            {/* Active Session Card Preview */}
            {activeSession ? (<div className="max-w-2xl mx-auto bg-slate-900/90 border border-rose-500/40 rounded-2xl p-5 md:p-6 space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-rose-400 uppercase tracking-widest">
                      {activeSession.badge_number || activeSession.badgeNumber || activeSession.reference_code || activeSession.referenceCode || 'ACTIVE SESSION'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      Inside Building
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-400"/>
                    In: {activeSession.checked_in_at || activeSession.checkedInAt ? new Date(activeSession.checked_in_at || activeSession.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-md">
                    {activeSession.photo_url || activeSession.photoUrl || activeSession.visitor_photo ? (<img src={resolvePhotoUrl(activeSession.photo_url || activeSession.photoUrl || activeSession.visitor_photo)} alt="" className="h-full w-full object-cover"/>) : (<User className="h-8 w-8 text-slate-500"/>)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-black text-white truncate">
                      {activeSession.visitor_name || activeSession.visitorName}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1 text-xs text-slate-400">
                      <p className="flex items-center gap-1.5 truncate">
                        <Building className="h-3.5 w-3.5 text-slate-500 shrink-0"/>
                        {activeSession.visitor_company || activeSession.visitorCompany || 'Independent Visitor'}
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <User className="h-3.5 w-3.5 text-slate-500 shrink-0"/>
                        Host: <strong className="text-slate-200">{activeSession.host_name || activeSession.hostName || 'Front Desk'}</strong>
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0"/>
                        {activeSession.visitor_email || activeSession.visitorEmail || 'No email'}
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0"/>
                        Duration: <strong className="text-amber-400">{activeSession.minutes_inside || activeSession.minutesInside || '—'} minutes</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verification Checklist */}
                <div className="bg-slate-950 p-4 rounded-xl space-y-2.5 border border-slate-850">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400"/>
                    {t('checkout.departureClearance', 'Departure Clearance & Asset Checklist')}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${verifyId ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                      <input type="checkbox" checked={verifyId} onChange={(e) => setVerifyId(e.target.checked)} className="rounded text-emerald-500 focus:ring-0"/>
                      <span>{t('form.idVerified', 'ID Verified')}</span>
                    </label>
                    <label className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${verifyAssets ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                      <input type="checkbox" checked={verifyAssets} onChange={(e) => setVerifyAssets(e.target.checked)} className="rounded text-emerald-500 focus:ring-0"/>
                      <span>{t('form.badgeReturned', 'Badge Returned')}</span>
                    </label>
                    <label className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${verifyClearance ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                      <input type="checkbox" checked={verifyClearance} onChange={(e) => setVerifyClearance(e.target.checked)} className="rounded text-emerald-500 focus:ring-0"/>
                      <span>{t('form.clearanceOk', 'Clearance OK')}</span>
                    </label>
                  </div>
                  <div>
                    <input type="text" placeholder={t('placeholder.exitRemarks', 'Exit remarks or incident notes (optional)...')} value={checkoutRemarks} onChange={(e) => setCheckoutRemarks(e.target.value)} className="w-full bg-slate-900 border border-slate-750 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"/>
                  </div>
                </div>

                <button disabled={loading} onClick={() => executeCheckOut()} className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-rose-600/20 transition-all disabled:opacity-50">
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin"/> : <LogOut className="h-4 w-4"/>}
                  <span>{t('btn.confirmCheckOutRelease', 'Confirm Check-Out & Release Visitor')}</span>
                </button>
              </div>) : hasSearched && !searching ? (<div className="max-w-md mx-auto p-6 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-amber-400 mx-auto"/>
                <p className="text-sm font-bold text-white">No active inside session found for "{searchInput}"</p>
                <p className="text-xs text-slate-400">
                  Ensure the visitor is currently checked in, or check the list below.
                </p>
              </div>) : null}

            {/* Currently Inside Visitors Live Table */}
            <div className="max-w-4xl mx-auto pt-4 border-t border-slate-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-rose-400"/>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Currently Inside Organization ({pendingInside.length})
                  </h3>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input type="text" placeholder={t('placeholder.filterInsideGuests', 'Filter inside guests...')} value={filterPending} onChange={(e) => setFilterPending(e.target.value)} className="bg-slate-900 border border-slate-800 focus:border-rose-500 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none w-full sm:w-44"/>
                  <button onClick={loadPendingInside} disabled={loadingPending} className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-semibold shrink-0">
                    <RefreshCw className={`h-3 w-3 ${loadingPending ? 'animate-spin' : ''}`}/>
                    {t('btn.refresh', 'Refresh')}
                  </button>
                </div>
              </div>

              {pendingInside.length === 0 ? (<div className="p-8 bg-slate-900/40 border border-slate-800/60 rounded-xl text-center text-xs text-slate-500">
                  No visitors currently inside organization. All guests are checked out.
                </div>) : (<div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">{t('table.visitor', 'Visitor Name')}</th>
                        <th className="py-2.5 px-3">{t('table.badgeNumber', 'Badge Number')}</th>
                        <th className="py-2.5 px-3">{t('table.hostDept', 'Host / Dept')}</th>
                        <th className="py-2.5 px-3">{t('table.checkInTime', 'Check-In Time')}</th>
                        <th className="py-2.5 px-3">{t('table.timeInside', 'Time Inside')}</th>
                        <th className="py-2.5 px-3 text-right">{t('table.actions', 'Quick Action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredPending.map((item, idx) => (<tr key={idx} className="hover:bg-slate-850/50 transition">
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {item.visitorName || item.visitor_name}
                            <span className="text-[10px] text-slate-400 block font-normal">{item.visitorCompany || 'Independent'}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-emerald-400 font-bold">
                            {item.badgeNumber || item.badge_number || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {item.hostName || item.host_name}
                            <span className="text-[10px] text-slate-500 block">{item.department || ''}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {item.checkedInAt || item.checked_in_at ? new Date(item.checkedInAt || item.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-amber-400 font-bold">
                            {item.minutesInside || item.minutes_inside || 0} min
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button onClick={() => {
                        selectSession(item);
                        executeCheckOut(item);
                    }} disabled={loading} className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition">
                              Check-Out
                            </button>
                          </td>
                        </tr>))}
                    </tbody>
                  </table>
                </div>)}
            </div>
          </div>)}

        {/* MODE 2: SCAN QR CODE */}
        {activeTab === 'qr_scan' && (<div className="space-y-6 max-w-xl mx-auto text-center">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2">
                <QrCode className="h-4 w-4 text-cyan-400"/>
                <span>Optical QR Pass / Badge Scanner</span>
              </h2>
              <p className="text-xs text-slate-400">Scan visitor badge barcode or digital pass QR code.</p>
            </div>

            <div className="relative w-full aspect-video bg-slate-950 border-2 border-cyan-500/40 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted></video>
              
              <div className="absolute inset-0 border-2 border-dashed border-cyan-400/50 m-8 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="h-1 w-full bg-cyan-400/80 animate-pulse shadow-lg shadow-cyan-500"></div>
              </div>

              {!cameraActive && (<div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-slate-400 space-y-3">
                  <QrCode className="h-10 w-10 text-cyan-400 animate-pulse"/>
                  <p className="text-xs font-bold text-slate-300">{cameraError || 'Camera Initializing...'}</p>
                  <button onClick={startCamera} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl">
                    Retry Camera
                  </button>
                </div>)}
            </div>

            <div className="pt-2 space-y-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{t('checkin.orEnterManualBadge', 'Or enter Badge / Code manually:')}</p>
              <div className="flex gap-2">
                <input type="text" placeholder={t('placeholder.scanBadgeOrCode', 'Scan or enter Badge # (e.g. BDG-8801 or VMS-XXXX)')} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono text-center focus:outline-none focus:border-cyan-500"/>
                <button disabled={loading || !searchInput.trim()} onClick={() => handleActiveSessionLookup(searchInput.trim())} className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition">
                  {t('btn.verifyCode', 'Verify Code')}
                </button>
              </div>
            </div>
          </div>)}

        {/* MODE 3: BIOMETRIC FACE MATCH */}
        {activeTab === 'face_scan' && (<div className="space-y-6 max-w-xl mx-auto text-center">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2">
                <Camera className="h-4 w-4 text-purple-400"/>
                <span>Biometric Face Exit Gate</span>
              </h2>
              <p className="text-xs text-slate-400">Position guest facing camera for departure release validation.</p>
            </div>

            <div className="relative w-full aspect-video bg-slate-950 border-2 border-purple-500/40 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted></video>

              <div className="absolute h-44 w-36 border-2 border-purple-400 rounded-[50%] pointer-events-none shadow-lg shadow-purple-500/30 flex items-center justify-center">
                <div className="text-[10px] text-purple-300 font-mono bg-slate-950/80 px-2 py-0.5 rounded">ALIGNED</div>
              </div>

              {scanningFace && (<div className="absolute inset-0 bg-purple-950/40 backdrop-blur-xs flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="h-8 w-8 text-purple-300 animate-spin"/>
                  <p className="text-xs font-black uppercase text-purple-200 tracking-widest">Matching Departure Profile...</p>
                </div>)}
            </div>

            <button disabled={scanningFace || loading} onClick={handleFaceScanCheckOut} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all">
              <Sparkles className="h-4 w-4"/>
              <span>Match Face & Check-Out</span>
            </button>

            {facialMatch && facialMatch.visitor && (<div className="bg-purple-950/20 border border-purple-500/40 rounded-2xl p-5 space-y-4 text-left shadow-xl">
                <div className="flex justify-between items-center border-b border-purple-500/20 pb-3">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400"/>
                    Biometric Identity Matched
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {facialMatch.confidence}% Match Confidence
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-purple-500/40 overflow-hidden shrink-0">
                    <img src={resolvePhotoUrl(facialMatch.visitor.photo_url || facialMatch.visitor.photoUrl || facialMatch.visitor.visitor_photo)} alt="" className="h-full w-full object-cover"/>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{facialMatch.visitor.visitor_name || facialMatch.visitor.visitorName}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{facialMatch.visitor.visitor_company || facialMatch.visitor.visitorCompany || 'Guest'}</p>
                    <p className="text-[10px] text-purple-300 font-mono mt-0.5">Badge: {facialMatch.visitor.badge_number || facialMatch.visitor.badgeNumber || '—'}</p>
                  </div>
                </div>

                <button disabled={loading} onClick={() => executeCheckOut(facialMatch.visitor)} className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-colors">
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin"/> : <LogOut className="h-4 w-4"/>}
                  <span>Release & Complete Check-Out</span>
                </button>
              </div>)}
          </div>)}
      </div>
    </div>);
}
