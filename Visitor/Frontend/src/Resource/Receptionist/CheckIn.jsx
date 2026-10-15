import React, { useState, useEffect, useRef } from 'react';
import { Camera, UserCheck, Search, QrCode, ShieldCheck, CheckCircle2, CheckCircle, AlertCircle, RefreshCw, Sparkles, Building, User, IdCard, Phone, Mail, Calendar, Check, LogOut, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { checkinApi, getErrorMessage } from '../../services/api';
import { resolvePhotoUrl } from '../../utils/photoUtils';
import { useLanguage } from '../../contexts/LanguageContext';
export default function CheckIn() {
    const navigate = useNavigate();
    const { t, tStatus } = useLanguage();
    const [activeTab, setActiveTab] = useState('id_ref');
    const [searchInput, setSearchInput] = useState('');
    const [badgeNumber, setBadgeNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    // Search Results & Matched State
    const [matchedResults, setMatchedResults] = useState([]);
    const [matchedVisitor, setMatchedVisitor] = useState(null);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    // Expected Today arrivals list
    const [expectedArrivals, setExpectedArrivals] = useState([]);
    const [loadingArrivals, setLoadingArrivals] = useState(false);
    // Camera / Face Scan states
    const videoRef = useRef(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [facialMatch, setFacialMatch] = useState(null);
    const [scanningFace, setScanningFace] = useState(false);
    // Generate random badge suggestion
    const generateNewBadge = () => {
        setBadgeNumber('BDG-' + Math.floor(1000 + Math.random() * 9000));
    };
    useEffect(() => {
        generateNewBadge();
        loadExpectedArrivals();
    }, []);
    const loadExpectedArrivals = async () => {
        setLoadingArrivals(true);
        try {
            const res = await api.get('/reception/arrivals?filter=TODAY');
            const list = Array.isArray(res.data) ? res.data : [];
            setExpectedArrivals(list);
        }
        catch (e) {
            console.warn('Failed to load expected arrivals:', e);
        }
        finally {
            setLoadingArrivals(false);
        }
    };
    // Start webcam stream for camera tab
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
    // Live lookup visitor by ALL WAYS: Name, Reference, Visitor ID, Phone, Email, Company, National ID, Badge
    const handleLookup = async (queryStr) => {
        const q = queryStr.trim();
        if (!q) {
            setMatchedVisitor(null);
            setMatchedResults([]);
            setHasSearched(false);
            return;
        }
        setSearching(true);
        setHasSearched(true);
        try {
            const res = await api.post('/reception/verify', { query: q });
            const records = Array.isArray(res.data?.records) ? res.data.records : [];
            setMatchedResults(records);
            if (records.length > 0) {
                setMatchedVisitor(records[0]);
                setMessage(null);
            }
            else if (res.data?.appointment) {
                setMatchedVisitor(res.data.appointment);
                setMatchedResults([res.data.appointment]);
                setMessage(null);
            }
            else if (res.data?.id) {
                setMatchedVisitor(res.data);
                setMatchedResults([res.data]);
                setMessage(null);
            }
            else {
                setMatchedVisitor(null);
                setMatchedResults([]);
            }
        }
        catch (err) {
            setMatchedVisitor(null);
            setMatchedResults([]);
        }
        finally {
            setSearching(false);
        }
    };
    const selectVisitor = (record) => {
        setMatchedVisitor(record);
        if (!badgeNumber)
            generateNewBadge();
    };
    // Perform Check-In execution
    const executeCheckIn = async (codeToUse) => {
        const targetCode = codeToUse || (matchedVisitor ? (matchedVisitor.reference_code || matchedVisitor.referenceCode || matchedVisitor.appointment_number || matchedVisitor.pass_code || String(matchedVisitor.id || matchedVisitor.appointment_id)) : searchInput.trim());
        if (!targetCode) {
            setMessage({ type: 'error', text: 'No visitor record or reference code selected for check-in.' });
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            const allocatedBadge = badgeNumber || 'BDG-' + Math.floor(1000 + Math.random() * 9000);
            const res = await checkinApi.scan({
                referenceCode: targetCode,
                qrToken: targetCode,
                badgeNumber: allocatedBadge,
                notes: `Checked in via Express Console (${activeTab.toUpperCase()})`
            });
            setMessage({
                type: 'success',
                text: `✓ Check-In Successful! ${res.data?.message || 'Visitor is now checked in.'} Assigned Badge: ${res.data?.badgeNumber || allocatedBadge}`
            });
            // Refresh arrivals and reset search
            loadExpectedArrivals();
            setMatchedVisitor(null);
            setMatchedResults([]);
            setSearchInput('');
            setFacialMatch(null);
            generateNewBadge();
        }
        catch (err) {
            setMessage({ type: 'error', text: getErrorMessage(err) });
        }
        finally {
            setLoading(false);
        }
    };
    const [capturedFrame, setCapturedFrame] = useState(null);

    // Capture real high-resolution frame from live WebRTC video
    const captureLiveFrame = () => {
        if (!videoRef.current) return null;
        const video = videoRef.current;
        if (!video.videoWidth || !video.videoHeight) return null;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.88);
    };

    // Real Face Recognition Scan against verified visitors & appointments
    const handleFaceScan = async () => {
        setScanningFace(true);
        setFacialMatch(null);
        setMessage(null);

        // Capture live frame from video stream
        const frame = captureLiveFrame();
        if (frame) {
            setCapturedFrame(frame);
        }

        try {
            const payload = {
                image: frame,
                visitorId: matchedVisitor?.id || matchedVisitor?.visitor_id,
                appointmentNumber: matchedVisitor?.appointment_number || matchedVisitor?.reference_code,
                code: searchInput.trim() || undefined
            };

            const res = await api.post('/reception/face-match', payload);
            const data = res.data;

            if (data && data.matched && data.visitor) {
                setFacialMatch(data);
                setMatchedVisitor(data.visitor);
                setMessage({
                    type: 'success',
                    text: `Biometric Identity Confirmed: ${data.visitor.visitor_name} (${data.confidence}% confidence)`
                });
            } else {
                setMessage({ type: 'error', text: 'No matching visitor record found in face database for this scan.' });
            }
        } catch (err) {
            console.error('Biometric matching error:', err);
            setMessage({ type: 'error', text: getErrorMessage(err) || 'Biometric face matching query failed.' });
        } finally {
            setScanningFace(false);
        }
    };
    return (<div className="p-4 md:p-6 bg-slate-950 min-h-screen text-slate-100 font-sans space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl shadow-inner">
              <UserCheck className="h-6 w-6 text-emerald-400"/>
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight uppercase">
                {t('checkin.title', 'Visitor Check-In Station')}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('checkin.subtitle', 'Fast multi-way search by Name, Reference #, Visitor ID, Phone, Email, National ID, or Biometric Face.')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/dashboard?view=checkout')} className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition">
            <LogOut className="h-3.5 w-3.5 text-rose-400"/>
            <span>{t('form.checkOut', 'Go to Check-Out')}</span>
          </button>
          <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {t('common.active', 'Check-In Gate Active')}
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
            ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
            : 'bg-[#0a0f19] border-slate-800 text-slate-400 hover:border-slate-700'}`}>
          <div className={`p-2.5 rounded-xl ${activeTab === 'id_ref' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
            <Search className="h-5 w-5"/>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider">{t('checkin.tabIdRef', '1. Search All Ways')}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{t('form.searchPlaceholder', 'By Name, Ref #, Visitor ID, Phone, Email, Company')}</div>
          </div>
        </button>

        <button onClick={() => setActiveTab('qr_scan')} className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${activeTab === 'qr_scan'
            ? 'bg-cyan-600/15 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
            : 'bg-[#0a0f19] border-slate-800 text-slate-400 hover:border-slate-700'}`}>
          <div className={`p-2.5 rounded-xl ${activeTab === 'qr_scan' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
            <QrCode className="h-5 w-5"/>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider">{t('checkin.tabQr', '2. Scan QR / Pass Code')}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{t('securityDash.scanQR', 'Optical scanner or printed pass QR token')}</div>
          </div>
        </button>

        <button onClick={() => setActiveTab('face_scan')} className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${activeTab === 'face_scan'
            ? 'bg-purple-600/15 border-purple-500 text-white shadow-lg shadow-purple-500/10'
            : 'bg-[#0a0f19] border-slate-800 text-slate-400 hover:border-slate-700'}`}>
          <div className={`p-2.5 rounded-xl ${activeTab === 'face_scan' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
            <Camera className="h-5 w-5"/>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider">{t('checkin.tabFace', '3. Biometric Face Match')}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{t('checkin.facialMatchSuccess', 'AI Facial Verification against database')}</div>
          </div>
        </button>
      </div>

      {/* Main Mode Panel */}
      <div className="bg-[#0a0f19] border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl">
        {/* MODE 1: SEARCH ALL WAYS */}
        {activeTab === 'id_ref' && (<div className="space-y-6">
            {/* Search Input Bar with pill tags */}
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-indigo-400"/>
                  <input type="text" placeholder={t('placeholder.searchComprehensive', 'Search by Visitor Name, Ref # (VMS-XXXX), Visitor ID (#42), Phone, Email, Company, Host...')} value={searchInput} onChange={(e) => {
                setSearchInput(e.target.value);
                handleLookup(e.target.value);
            }} onKeyDown={(e) => {
                if (e.key === 'Enter')
                    handleLookup(searchInput);
            }} autoFocus className="w-full bg-slate-900 border-2 border-slate-750 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition font-sans"/>
                  {searchInput && (<button onClick={() => {
                    setSearchInput('');
                    setMatchedVisitor(null);
                    setMatchedResults([]);
                    setHasSearched(false);
                }} className="absolute right-3 top-3 text-xs text-slate-500 hover:text-slate-300">
                      ✕
                    </button>)}
                </div>
                <button onClick={() => handleLookup(searchInput)} disabled={searching} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20">
                  {searching ? <RefreshCw className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                  <span>Search</span>
                </button>
              </div>

              {/* Search Way Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                <span className="font-semibold text-slate-500">Searchable by:</span>
                {['Visitor Name', 'Reference Code', 'Visitor ID #', 'Phone Number', 'Email Address', 'National ID / Passport', 'Company', 'Host Name'].map((tag) => (<span key={tag} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                    {tag}
                  </span>))}
              </div>
            </div>

            {/* Multiple Results Grid if search returned > 1 */}
            {matchedResults.length > 1 && (<div className="max-w-4xl mx-auto space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                  <span>Matching Visitors ({matchedResults.length} Found)</span>
                  <span className="text-[10px] text-indigo-400">Click a record to select for Check-In</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {matchedResults.map((rec, i) => {
                    const isSelected = matchedVisitor?.id === rec.id || matchedVisitor?.appointment_id === rec.appointment_id;
                    const isInside = rec.checked_in_at && !rec.checked_out_at;
                    return (<div key={i} onClick={() => selectVisitor(rec)} className={`p-3 rounded-xl border text-left cursor-pointer transition ${isSelected
                            ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'}`}>
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                            {rec.photo_url || rec.visitor_photo ? (<img src={resolvePhotoUrl(rec.photo_url || rec.visitor_photo)} alt="" className="h-full w-full object-cover"/>) : (<User className="h-4 w-4 text-slate-400"/>)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">{rec.visitor_name || rec.visitorName || rec.full_name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{rec.visitor_company || rec.company || 'Guest'}</p>
                          </div>
                          {isInside && (<span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded text-[9px] font-bold shrink-0">
                              Inside
                            </span>)}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/80 pt-1.5">
                          <span className="font-mono text-indigo-400">{rec.reference_code || rec.appointment_number || `ID #${rec.id}`}</span>
                          <span className="text-slate-400 font-medium">Host: {rec.host_name || rec.hostName || 'Desk'}</span>
                        </div>
                      </div>);
                })}
                </div>
              </div>)}

            {/* Matched Visitor Card Preview */}
            {matchedVisitor ? (<div className="max-w-2xl mx-auto bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-5 md:p-6 space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-widest">
                      {matchedVisitor.appointment_number || matchedVisitor.reference_code || matchedVisitor.referenceCode || `VISITOR #${matchedVisitor.id}`}
                    </span>
                    {matchedVisitor.badge_number && (<span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-bold">
                        Badge: {matchedVisitor.badge_number}
                      </span>)}
                  </div>
                  {matchedVisitor.checked_in_at && !matchedVisitor.checked_out_at ? (<span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping"></span>
                      Already Inside
                    </span>) : (<span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Check className="h-3 w-3"/> Ready for Check-In
                    </span>)}
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-md">
                    {matchedVisitor.visitor_photo || matchedVisitor.photo_url || matchedVisitor.profile_photo ? (<img src={resolvePhotoUrl(matchedVisitor.visitor_photo || matchedVisitor.photo_url || matchedVisitor.profile_photo)} alt="" className="h-full w-full object-cover"/>) : (<User className="h-8 w-8 text-slate-500"/>)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-black text-white truncate">
                      {matchedVisitor.visitor_name || matchedVisitor.visitorName || matchedVisitor.full_name}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1 text-xs text-slate-400">
                      <p className="flex items-center gap-1.5 truncate">
                        <Building className="h-3.5 w-3.5 text-slate-500 shrink-0"/>
                        {matchedVisitor.visitor_company || matchedVisitor.company || 'Independent Visitor'}
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0"/>
                        {matchedVisitor.visitor_phone || matchedVisitor.phone || 'No phone'}
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0"/>
                        {matchedVisitor.visitor_email || matchedVisitor.email || 'No email'}
                      </p>
                      {matchedVisitor.id_number && (<p className="flex items-center gap-1.5 truncate">
                          <IdCard className="h-3.5 w-3.5 text-slate-500 shrink-0"/>
                          ID: {matchedVisitor.id_number}
                        </p>)}
                    </div>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-950 p-3 rounded-xl text-xs border border-slate-850">
                  <div>
                    <span className="text-slate-500 text-[10px] block font-semibold">{t('form.host', 'Host Employee')}</span>
                    <span className="text-slate-200 font-bold">{matchedVisitor.host_name || matchedVisitor.hostName || 'Front Desk'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block font-semibold">{t('table.department', 'Department')} / {t('table.room', 'Room')}</span>
                    <span className="text-slate-200 font-bold">{matchedVisitor.department_name || matchedVisitor.department || matchedVisitor.room_name || 'Main Lobby'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block font-semibold">{t('checkin.badgeNumber', 'Badge Allocation')}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <input type="text" value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} placeholder={t('placeholder.badgeAllocation', 'BDG-XXXX')} className="bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded px-2 py-0.5 text-xs text-emerald-400 font-mono w-full focus:outline-none"/>
                      <button onClick={generateNewBadge} title={t('checkin.generateBadge', 'Generate random badge')} className="p-1 text-slate-400 hover:text-white bg-slate-850 rounded">
                        <RefreshCw className="h-3.5 w-3.5"/>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {matchedVisitor.checked_in_at && !matchedVisitor.checked_out_at ? (<div className="flex gap-2">
                    <button onClick={() => navigate('/dashboard?view=checkout')} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition">
                      <LogOut className="h-4 w-4"/>
                      <span>{t('checkin.checkOutVisitor', 'Proceed to Check-Out')}</span>
                    </button>
                  </div>) : (<button disabled={loading} onClick={() => executeCheckIn()} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 transition-all disabled:opacity-50">
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin"/> : <UserCheck className="h-4 w-4"/>}
                    <span>{t('checkin.checkInVisitor', 'Confirm Visitor Check-In Arrival')}</span>
                  </button>)}
              </div>) : hasSearched && !searching ? (<div className="max-w-md mx-auto p-6 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-amber-400 mx-auto"/>
                <p className="text-sm font-bold text-white">{t('response.notFound', 'No visitor record found')} for "{searchInput}"</p>
                <p className="text-xs text-slate-400">
                  {t('receptionDash.subtitle', 'Verify the search query or register a new walk-in guest.')}
                </p>
                <button onClick={() => navigate('/dashboard?view=walkin_management')} className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition">
                  {t('receptionDash.walkInRegistration', 'Register as Walk-In Visitor')}
                </button>
              </div>) : null}

            {/* Expected Visitors Today Quick Table */}
            <div className="max-w-4xl mx-auto pt-4 border-t border-slate-800/80 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-400"/>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                    {t('checkin.expectedArrivals', 'Expected Arrivals Today')} ({expectedArrivals.length})
                  </h3>
                </div>
                <button onClick={loadExpectedArrivals} disabled={loadingArrivals} className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-semibold">
                  <RefreshCw className={`h-3 w-3 ${loadingArrivals ? 'animate-spin' : ''}`}/>
                  {t('common.refresh', 'Refresh')}
                </button>
              </div>

              {expectedArrivals.length === 0 ? (<div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-xl text-center text-xs text-slate-500">
                  {t('checkin.noArrivals', 'No appointments scheduled for today.')}
                </div>) : (<div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">{t('table.visitor', 'Visitor Name')}</th>
                        <th className="py-2.5 px-3">{t('table.company', 'Company')}</th>
                        <th className="py-2.5 px-3">{t('table.host', 'Host Employee')}</th>
                        <th className="py-2.5 px-3">{t('table.time', 'Schedule')}</th>
                        <th className="py-2.5 px-3">{t('visitorPass.refNo', 'Ref Code')}</th>
                        <th className="py-2.5 px-3 text-right">{t('table.actions', 'Quick Action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {expectedArrivals.slice(0, 10).map((item, idx) => {
                    const isArrived = item.arrival_time !== null;
                    return (<tr key={idx} className="hover:bg-slate-850/50 transition">
                            <td className="py-2.5 px-3 font-semibold text-white">
                              {item.visitor_name || item.visitorName}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">{item.visitor_company || 'Guest'}</td>
                            <td className="py-2.5 px-3 text-slate-300">{item.host_name}</td>
                            <td className="py-2.5 px-3 text-slate-400">
                              {item.scheduled_start ? new Date(item.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-400">
                              {item.reference_code || item.appointment_number}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button onClick={() => {
                            selectVisitor(item);
                            executeCheckIn(item.reference_code || item.appointment_number || String(item.id));
                        }} disabled={loading} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition">
                                {t('form.checkIn', 'Check-In')}
                              </button>
                            </td>
                          </tr>);
                })}
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
                <span>Optical QR Pass Scanner</span>
              </h2>
              <p className="text-xs text-slate-400">Position digital pass or printed QR code in front of camera sensor.</p>
            </div>

            {/* Video Feed Box */}
            <div className="relative w-full aspect-video bg-slate-950 border-2 border-cyan-500/40 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted></video>
              
              {/* Scanning Overlay Reticle */}
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

            {/* Manual QR Input Fallback */}
            <div className="pt-2 space-y-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{t('checkin.orEnterManual', 'Or enter Pass Code / QR Token string manually:')}</p>
              <div className="flex gap-2">
                <input type="text" placeholder={t('placeholder.scanQrToken', 'Scan or paste QR Token (e.g. PASS-OZJFIA or VMS-XXXX)')} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono text-center focus:outline-none focus:border-cyan-500"/>
                <button disabled={loading || !searchInput.trim()} onClick={() => executeCheckIn(searchInput.trim())} className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition">
                  {t('btn.checkInPass', 'Check-In Pass')}
                </button>
              </div>
            </div>
          </div>)}

        {/* MODE 3: BIOMETRIC FACE MATCH */}
        {activeTab === 'face_scan' && (<div className="space-y-6 max-w-4xl mx-auto text-center">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span>AI Biometric Facial Recognition Gate</span>
              </div>
              <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center justify-center gap-2">
                <Camera className="h-5 w-5 text-purple-400"/>
                <span>Biometric Identity & Document Verification Station</span>
              </h2>
              <p className="text-xs text-slate-400 max-w-xl mx-auto">
                Align visitor's face within the scanning reticle. The system performs real-time 128-point landmark extraction and matches against verified government ID records.
              </p>
            </div>

            {/* Video Viewport with Biometric HUD Overlays */}
            <div className="relative w-full max-w-2xl mx-auto aspect-video bg-slate-950 border-2 border-purple-500/40 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center group">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted></video>

              {/* Biometric HUD Corner Brackets */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-purple-400 pointer-events-none"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-purple-400 pointer-events-none"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-purple-400 pointer-events-none"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-purple-400 pointer-events-none"></div>

              {/* Biometric Face Target Reticle */}
              <div className="absolute h-48 w-40 border-2 border-dashed border-purple-400/70 rounded-[50%] pointer-events-none shadow-[0_0_25px_rgba(168,85,247,0.25)] flex flex-col items-center justify-center">
                <div className="absolute -top-3 px-2 py-0.5 bg-purple-950/90 border border-purple-400/50 rounded text-[9px] font-mono text-purple-300 uppercase tracking-widest font-black">
                  FACE ALIGNMENT
                </div>
                {/* Crosshairs */}
                <div className="w-3 h-0.5 bg-purple-400/60 absolute left-1"></div>
                <div className="w-3 h-0.5 bg-purple-400/60 absolute right-1"></div>
                <div className="h-3 w-0.5 bg-purple-400/60 absolute top-1"></div>
                <div className="h-3 w-0.5 bg-purple-400/60 absolute bottom-1"></div>
              </div>

              {/* Laser scan line animation when scanning */}
              {scanningFace && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_15px_#c084fc] animate-[bounce_1.5s_infinite] pointer-events-none"></div>
              )}

              {/* Sensor Telemetry Badges */}
              <div className="absolute top-3 left-14 flex items-center gap-2 pointer-events-none">
                <span className="px-2 py-0.5 bg-slate-950/80 border border-slate-700/80 rounded text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  SENSOR ACTIVE
                </span>
                <span className="px-2 py-0.5 bg-slate-950/80 border border-slate-700/80 rounded text-[9px] font-mono text-slate-300">
                  128 LANDMARK MESH
                </span>
              </div>

              {/* Camera Error or Inactive Overlay */}
              {!cameraActive && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-slate-400 space-y-3">
                  <Camera className="h-10 w-10 text-purple-400 animate-pulse"/>
                  <p className="text-xs font-bold text-slate-300">{cameraError || 'Camera Initializing or Permissions Required...'}</p>
                  <button onClick={startCamera} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition">
                    Retry / Grant Camera Access
                  </button>
                </div>
              )}

              {/* Scanning Active Overlay */}
              {scanningFace && (
                <div className="absolute inset-0 bg-purple-950/60 backdrop-blur-xs flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="h-10 w-10 text-purple-300 animate-spin"/>
                  <p className="text-sm font-black uppercase text-purple-200 tracking-widest">
                    Extracting Biometric Vector & Matching Database...
                  </p>
                  <p className="text-[11px] text-purple-300/80 font-mono">
                    Measuring pupil ratio, nasal bridge, jaw contour & liveness
                  </p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="max-w-2xl mx-auto flex items-center gap-3">
              <button 
                disabled={scanningFace || loading} 
                onClick={handleFaceScan} 
                className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {scanningFace ? <RefreshCw className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
                <span>{scanningFace ? 'Analyzing Face Biometrics...' : 'Scan & Verify Live Face'}</span>
              </button>

              {facialMatch && (
                <button
                  onClick={() => {
                    setFacialMatch(null);
                    setCapturedFrame(null);
                  }}
                  className="px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition shrink-0"
                >
                  Clear Scan
                </button>
              )}
            </div>

            {/* Side-by-Side Biometric Verification Result Panel */}
            {facialMatch && facialMatch.visitor && (
              <div className="bg-slate-900/90 border border-purple-500/40 rounded-2xl p-5 md:p-6 space-y-5 text-left shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Result Status Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-purple-500/20 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <ShieldCheck className="h-5 w-5 text-emerald-400"/>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wide">
                        Biometric Identity Confirmed & Verified
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Live face probe authenticated against stored visitor biometric profile
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-inner">
                      {facialMatch.confidence}% Biometric Match
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/30">
                      SECURE CLEARANCE
                    </span>
                  </div>
                </div>

                {/* Side-by-Side Visual Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Live Captured Probe */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-purple-300">
                      <span className="flex items-center gap-1.5">
                        <Camera className="h-3 w-3 text-purple-400"/> Live Probe Capture
                      </span>
                      <span className="text-slate-500 font-mono">GATE CAM 01</span>
                    </div>
                    <div className="aspect-4/3 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center relative">
                      {capturedFrame ? (
                        <img src={capturedFrame} alt="Live Probe" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-slate-500 text-xs font-mono">Camera Frame Cached</div>
                      )}
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-950/80 rounded text-[9px] font-mono text-purple-300 border border-purple-500/30">
                        PROBE SENSOR • {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Right: Government Document / Stored Record */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <IdCard className="h-3 w-3 text-emerald-400"/> Stored ID Portrait
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                        VERIFIED ID
                      </span>
                    </div>
                    <div className="aspect-4/3 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center relative">
                      <img 
                        src={resolvePhotoUrl(facialMatch.visitor.document_photo || facialMatch.visitor.visitor_photo || facialMatch.visitor.photo_url || capturedFrame)} 
                        alt="Stored Document Portrait" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-950/80 rounded text-[9px] font-mono text-emerald-300 border border-emerald-500/30">
                        {facialMatch.visitor.id_type || 'National ID'} • {facialMatch.visitor.id_number || 'VERIFIED'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Anatomical Part-by-Part Face Match Matrix */}
                {facialMatch.biometricAnalysis?.partMatches && (
                  <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-purple-400"/>
                        Anatomical Feature Alignment Matrix
                      </span>
                      <span className="text-[10px] font-mono text-purple-400">128-POINT FACIAL VECTOR MESH</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                      {facialMatch.biometricAnalysis.partMatches.map((part, pIdx) => (
                        <div key={pIdx} className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400 font-medium truncate">{part.feature}</span>
                            <span className="font-mono font-bold text-emerald-400 shrink-0">{part.score}</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                              style={{ width: part.score.endsWith('%') ? part.score : `${part.score}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visitor & Appointment Details Summary */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-white">
                      {facialMatch.visitor.visitor_name || facialMatch.visitor.full_name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-slate-500"/>
                        {facialMatch.visitor.visitor_company || 'Independent Visitor'}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span>Host: <strong className="text-slate-200">{facialMatch.visitor.host_name || 'Front Desk'}</strong></span>
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-indigo-400 font-bold">
                        {facialMatch.visitor.appointment_number || facialMatch.visitor.reference_code || `VISITOR #${facialMatch.visitor.id}`}
                      </span>
                    </div>
                  </div>

                  {/* One-Click Biometric Check-In Arrival Button */}
                  <button 
                    disabled={loading} 
                    onClick={() => executeCheckIn(facialMatch.visitor.appointment_number || facialMatch.visitor.reference_code || String(facialMatch.visitor.id))} 
                    className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin"/> : <UserCheck className="h-4 w-4"/>}
                    <span>Approve & Complete Biometric Check-In</span>
                  </button>
                </div>
              </div>
            )}
          </div>)}
      </div>
    </div>);
}
