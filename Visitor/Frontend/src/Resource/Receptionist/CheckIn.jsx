import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  UserCheck,
  Search,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Building,
  User,
  IdCard,
  Phone,
  Mail,
  Calendar,
  Check,
  LogOut,
  Eye,
  LogIn,
  Trash2,
  X,
  Clock,
  Radio,
  MapPin,
  Lock,
  DoorOpen,
  Unlock,
  AlertTriangle,
  BadgeCheck,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import api, { checkinApi, getErrorMessage } from '../../services/api';
import { resolvePhotoUrl } from '../../utils/photoUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useResponseNavigation, RESPONSE_TYPES } from '../../modules/response';

export default function CheckIn() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { toSuccess, toError, toConfirmation } = useResponseNavigation();

  // Mode Selection: 'id_ref' (Rapid Search/Tap), 'qr_scan' (Optical Scanner), 'face_scan' (Biometric Face)
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
  const [filterArrivals, setFilterArrivals] = useState('');

  // Turnstile Gate Hardware Simulation State
  const [turnstileLane, setTurnstileLane] = useState('LANE-01 (Speed Gate North)');
  const [barrierState, setBarrierState] = useState('LOCKED'); // 'LOCKED' | 'UNLOCKED'
  const [recentCheckedInVisitor, setRecentCheckedInVisitor] = useState(null);

  // Inspect Modal & Cancel Modal
  const [inspectingGuest, setInspectingGuest] = useState(null);
  const [cancellingArrival, setCancellingArrival] = useState(null);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  // Camera / Face Scan states
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facialMatch, setFacialMatch] = useState(null);
  const [scanningFace, setScanningFace] = useState(false);
  const [capturedFrame, setCapturedFrame] = useState(null);

  // Generate random badge suggestion
  const generateNewBadge = () => {
    setBadgeNumber('BDG-' + Math.floor(1000 + Math.random() * 9000));
  };

  useEffect(() => {
    generateNewBadge();
    loadExpectedArrivals();
    const interval = setInterval(() => loadExpectedArrivals(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const loadExpectedArrivals = async (isBackground = false) => {
    if (!isBackground) setLoadingArrivals(true);
    try {
      const res = await api.get('/reception/arrivals?filter=TODAY');
      const list = Array.isArray(res.data) ? res.data : [];
      setExpectedArrivals(list);
    } catch (e) {
      console.warn('Failed to load expected arrivals:', e);
    } finally {
      setLoadingArrivals(false);
    }
  };

  const handleDeleteArrival = async (item) => {
    const name = item.visitor_name || item.visitorName || 'this visitor';
    const idToDelete = item.id;
    setCancellingArrival(null);
    toConfirmation({
      title: 'Confirm Removal of Expected Arrival',
      message: `Remove expected arrival reservation for "${name}" from today's ingress queue?`,
      entityType: 'Arrival Record',
      entityName: name,
      entityId: idToDelete,
      consequences: [
        'The visitor appointment status will be updated or removed from expected arrivals.',
        'Speed gate pre-authorization credentials will be deactivated.',
        'The host will be informed that the arrival was cancelled.'
      ],
      confirmLabel: 'Remove Expected Arrival',
      confirmVariant: 'danger',
      apiEndpoint: `/appointments/${idToDelete}`,
      apiMethod: 'DELETE',
      returnUrl: window.location.pathname + window.location.search,
      successConfig: {
        type: RESPONSE_TYPES.RECORD_DELETED,
        title: 'Arrival Record Removed',
        message: `Arrival record for "${name}" has been removed from today's registry.`,
      }
    });
  };

  // Start webcam stream for camera tab
  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(false);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      } else {
        setCameraError('Camera access is not supported on this device/browser.');
      }
    } catch (err) {
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
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  // Capture real frame from live video
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

  // Turnstile barrier unlock visual trigger
  const triggerTurnstileUnlock = (visitorName) => {
    setBarrierState('UNLOCKED');
    setRecentCheckedInVisitor(visitorName);
    setTimeout(() => {
      setBarrierState('LOCKED');
      setRecentCheckedInVisitor(null);
    }, 4500);
  };

  // Multi-way search lookup
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
      const res = await api.get(`/reception/arrivals?search=${encodeURIComponent(q)}`);
      const results = Array.isArray(res.data) ? res.data : [];
      setMatchedResults(results);
      if (results.length > 0) {
        setMatchedVisitor(results[0]);
        setMessage(null);
      } else {
        setMatchedVisitor(null);
      }
    } catch (e) {
      setMatchedVisitor(null);
      setMatchedResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectMatchedResult = (visitor) => {
    setMatchedVisitor(visitor);
    if (!badgeNumber) generateNewBadge();
  };

  // Execute Check-In & Gate Unlock
  const executeCheckIn = async (codeToUse) => {
    const targetCode =
      codeToUse ||
      (matchedVisitor
        ? matchedVisitor.reference_code ||
          matchedVisitor.referenceCode ||
          matchedVisitor.appointment_number ||
          matchedVisitor.pass_code ||
          String(matchedVisitor.id || matchedVisitor.appointment_id)
        : searchInput.trim());

    if (!targetCode) {
      setMessage({ type: 'error', text: 'No visitor record or reference code selected for check-in.' });
      return;
    }

    const currentId = matchedVisitor?.id || matchedVisitor?.appointment_id;
    if (currentId) setActionInProgressId(currentId);
    setLoading(true);
    setMessage(null);

    const visitorName =
      matchedVisitor?.visitor_name ||
      matchedVisitor?.visitorName ||
      matchedVisitor?.full_name ||
      'Guest';

    try {
      const allocatedBadge = badgeNumber || 'BDG-' + Math.floor(1000 + Math.random() * 9000);
      const res = await checkinApi.scan({
        referenceCode: targetCode,
        qrToken: targetCode,
        badgeNumber: allocatedBadge,
        notes: `Checked in via Gate Turnstile Ingress Terminal (${turnstileLane})`
      });

      // Trigger Turnstile Barrier Unlock animation!
      triggerTurnstileUnlock(visitorName);

      toSuccess({
        type: RESPONSE_TYPES.CHECKIN_SUCCESS,
        title: 'Turnstile Ingress Authorized',
        message: `Ingress Authorized! Welcome ${visitorName}. Assigned Badge: ${res.data?.badgeNumber || allocatedBadge}. Lane: ${turnstileLane}.`,
        referenceId: res.data?.badgeNumber || allocatedBadge,
        entityType: 'Visitor Check-In',
        entityName: visitorName,
        primaryActionText: 'Process Next Check-In',
        primaryActionUrl: '/dashboard?view=checkin',
        returnUrl: '/dashboard?view=checkin',
      });

      // Refresh arrivals and reset search
      loadExpectedArrivals(true);
      setMatchedVisitor(null);
      setMatchedResults([]);
      setSearchInput('');
      setFacialMatch(null);
      generateNewBadge();
      if (inspectingGuest && inspectingGuest.id === currentId) {
        setInspectingGuest(null);
      }
    } catch (err) {
      toError(err, {
        title: 'Ingress Check-In Verification Failed',
        entityType: 'Visitor Check-In',
        entityName: visitorName,
        returnUrl: '/dashboard?view=checkin',
      });
    } finally {
      setLoading(false);
      setActionInProgressId(null);
    }
  };

  // Biometric Face Recognition Scan
  const handleFaceScan = async () => {
    setScanningFace(true);
    setFacialMatch(null);
    setMessage(null);

    const frame = captureLiveFrame();
    if (frame) setCapturedFrame(frame);

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

  // Manual Turnstile Emergency Cycle
  const handleEmergencyGateRelease = () => {
    triggerTurnstileUnlock('Emergency Security Entry');
    setMessage({
      type: 'info',
      text: '⚠️ Turnstile Ingress Speed Gate manually unlocked for 4.5 seconds. Optical sensors cycling.'
    });
  };

  // KPI Calculations
  const totalExpected = expectedArrivals.length;
  const arrivalsTodayCount = expectedArrivals.filter((i) => i.is_checked_in || i.isCheckin).length;
  const pendingCheckinsCount = Math.max(0, totalExpected - arrivalsTodayCount);

  // Filtered expected arrivals
  const filteredArrivals = useMemo(() => {
    if (!filterArrivals.trim()) return expectedArrivals;
    const term = filterArrivals.toLowerCase();
    return expectedArrivals.filter(
      (item) =>
        (item.visitor_name || item.visitorName || '').toLowerCase().includes(term) ||
        (item.reference_code || item.referenceCode || '').toLowerCase().includes(term) ||
        (item.appointment_number || item.appointmentNumber || '').toLowerCase().includes(term) ||
        (item.company || '').toLowerCase().includes(term) ||
        (item.host_name || item.hostName || '').toLowerCase().includes(term)
    );
  }, [expectedArrivals, filterArrivals]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans">
      {/* ── TOP HERO HEADER WITH CURVED WAVE ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-[#0d1627] border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-indigo-500" />

        {/* Ambient Wave SVG */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none w-96 h-48 overflow-hidden">
          <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="w-full h-full">
            <path
              d="M0.00,49.98 C150.00,150.00 349.81,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z"
              fill="#10b981"
            ></path>
          </svg>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <BackButton fallbackUrl="/dashboard" title="Back to Dashboard" className="mt-1" />
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold tracking-wide">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Active Inbound Optical & RFID Turnstile Ingress Gate
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                {language === 'am' ? 'የበር መግቢያ ቼክ-ኢን' : 'Gate Turnstile Check-In'}
                <UserCheck className="w-7 h-7 text-emerald-400 animate-pulse shrink-0" />
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl font-medium">
                Instant speed-gate entry processing, automated optical pass barcode / QR scanner, badge issuance, and real-time facility ingress authorization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate('/dashboard?view=checkout')}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition shadow-sm"
              title="Switch to Gate Turnstile Check-Out"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Switch to Check-Out</span>
            </button>

            <button
              onClick={() => loadExpectedArrivals()}
              disabled={loadingArrivals}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition shadow-sm"
              title="Refresh Inbound Arrivals"
            >
              <RefreshCw className={`w-4 h-4 ${loadingArrivals ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Sync Ingress</span>
            </button>

            <button
              onClick={handleEmergencyGateRelease}
              className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-extrabold flex items-center gap-2 transition"
              title="Manual Barrier Cycle"
            >
              <Unlock className="w-4 h-4" />
              <span>Cycle Gate</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK TOAST ALERT */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mt-4 p-4 rounded-2xl text-xs font-bold flex items-center justify-between border ${
                message.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : message.type === 'info'
                  ? 'bg-blue-950/60 border-blue-500/40 text-blue-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                )}
                <span>{message.text}</span>
              </div>
              <button onClick={() => setMessage(null)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── TURNSTILE HARDWARE STATUS & BARRIER VISUALIZER ── */}
      <div className="rounded-3xl bg-[#0a0f1d] border border-slate-800 p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Lane Selector & Hardware Health */}
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                barrierState === 'UNLOCKED'
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.7)] animate-bounce'
                  : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
              }`}
            >
              {barrierState === 'UNLOCKED' ? (
                <DoorOpen className="w-7 h-7" />
              ) : (
                <Lock className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">{turnstileLane}</h3>
              </div>
            </div>
          </div>

          {/* Quick Lane Toggle & Allocated Badge Preview */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {['LANE-01 (Speed Gate North)', 'LANE-02 (Speed Gate East)'].map((lane) => (
                <button
                  key={lane}
                  onClick={() => setTurnstileLane(lane)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    turnstileLane === lane
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {lane.split(' ')[0]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400 font-bold">Next Badge:</span>
              <span className="font-mono text-emerald-400 font-black">{badgeNumber}</span>
              <button
                onClick={generateNewBadge}
                title="Regenerate Badge"
                className="text-slate-400 hover:text-white p-0.5"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Barrier Unlocked Visual Banner */}
        <AnimatePresence>
          {barrierState === 'UNLOCKED' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-emerald-950/80 border border-emerald-500/50 flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-300">
                    TURNSTILE GATE BARRIER OPEN — WELCOME
                  </h4>
                  <p className="text-xs text-emerald-400/90 font-medium">
                    Visitor {recentCheckedInVisitor || 'Guest'} cleared. Entry badge issued and logged in SOC audit feed.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 animate-pulse font-bold">
                AUTO-CLOSING IN 4s...
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 4 ANIMATED KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Expected Inbound</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">{totalExpected}</h3>
            <span className="text-[11px] font-bold text-blue-400">Today</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Approved pre-registered arrivals</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-2xl group-hover:w-2.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">Turnstile Entries</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">{arrivalsTodayCount}</h3>
            <span className="text-[11px] font-bold text-emerald-400">Cleared</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Visitors checked in through speed gates</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Pending Arrivals</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-purple-300">{pendingCheckinsCount}</h3>
            <span className="text-[11px] font-bold text-purple-400">Awaiting Tap</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Scheduled guests approaching lobby</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Ingress Clearance</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-emerald-400">100%</h3>
            <span className="text-[11px] font-bold text-emerald-400">Armed & Ready</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Optical turnstiles operational</p>
        </motion.div>
      </div>

      {/* ── 3 INTERACTIVE OPERATING MODE SELECTORS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => setActiveTab('id_ref')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
            activeTab === 'id_ref'
              ? 'bg-emerald-600/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
              : 'bg-[#0a0f19] border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${activeTab === 'id_ref' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
            <Search className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider">1. Rapid Search & Badge Tap</div>
            <div className="text-[10px] text-slate-500 mt-0.5">By Name, Ref # (VMS-XXXX), Phone, National ID</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('qr_scan')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
            activeTab === 'qr_scan'
              ? 'bg-cyan-600/15 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
              : 'bg-[#0a0f19] border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${activeTab === 'qr_scan' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider">2. Optical QR Pass Scanner</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Scan printed pass or mobile QR token</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('face_scan')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
            activeTab === 'face_scan'
              ? 'bg-purple-600/15 border-purple-500 text-white shadow-lg shadow-purple-500/10'
              : 'bg-[#0a0f19] border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${activeTab === 'face_scan' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider">3. Biometric Face Ingress</div>
            <div className="text-[10px] text-slate-500 mt-0.5">AI Facial matching arrival clearance</div>
          </div>
        </button>
      </div>

      {/* ── MAIN MODE PANEL ── */}
      <div className="bg-[#0a0f19] border border-slate-800 rounded-3xl p-5 md:p-7 shadow-2xl">
        {/* MODE 1: SEARCH ALL WAYS */}
        {activeTab === 'id_ref' && (
          <div className="space-y-6">
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-emerald-400" />
                  <input
                    type="text"
                    placeholder="Search arrival by Visitor Name, Ref # (VMS-XXXX), Phone, Email, Company..."
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      handleLookup(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleLookup(searchInput);
                    }}
                    autoFocus
                    className="w-full bg-slate-900 border-2 border-slate-750 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition font-sans"
                  />
                  {searchInput && (
                    <button
                      onClick={() => {
                        setSearchInput('');
                        setMatchedVisitor(null);
                        setMatchedResults([]);
                        setHasSearched(false);
                      }}
                      className="absolute right-3 top-3 text-xs text-slate-500 hover:text-slate-300"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleLookup(searchInput)}
                  disabled={searching}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  {searching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span>Find Arrival</span>
                </button>
              </div>

              {/* Quick Search Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                <span className="font-semibold text-slate-500">Fast Match:</span>
                {['Ref #', 'Visitor Name', 'Appointment Code', 'Phone', 'Email', 'Visitor ID', 'Company'].map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Multiple Sessions Grid if search returned > 1 */}
            {matchedResults.length > 1 && (
              <div className="max-w-4xl mx-auto space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                  <span>Matching Inbound Visitors ({matchedResults.length} Found)</span>
                  <span className="text-[10px] text-emerald-400">Click a record to select for Check-In</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {matchedResults.map((rec, i) => {
                    const isSelected =
                      (matchedVisitor?.id || matchedVisitor?.appointment_id) ===
                      (rec.id || rec.appointment_id);
                    return (
                      <div
                        key={i}
                        onClick={() => selectMatchedResult(rec)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                            {rec.photo_url || rec.photoUrl || rec.visitor_photo ? (
                              <img
                                src={resolvePhotoUrl(rec.photo_url || rec.photoUrl || rec.visitor_photo)}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">
                              {rec.visitor_name || rec.visitorName || rec.full_name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {rec.company || 'Guest'}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded text-[10px] font-mono font-bold shrink-0">
                            {rec.reference_code || rec.referenceCode || `ID #${rec.id}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Matched Arrival Card Preview */}
            {matchedVisitor ? (
              <div className="max-w-2xl mx-auto bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-5 md:p-6 space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                      {matchedVisitor.reference_code ||
                        matchedVisitor.referenceCode ||
                        matchedVisitor.appointment_number ||
                        `APT-${matchedVisitor.id}`}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Approved Arrival
                    </span>
                    {matchedVisitor.id_verification_status === 'APPROVED' || matchedVisitor.id_verification_status === 'VERIFIED' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-xs">
                        🛡️ Biometrics & ID Verified
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-xs">
                        ⚠️ ID Verification Pending
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-400" />
                    Scheduled:{' '}
                    {matchedVisitor.scheduled_start || matchedVisitor.scheduledStart
                      ? new Date(matchedVisitor.scheduled_start || matchedVisitor.scheduledStart).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Today'}
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-md">
                    {matchedVisitor.photo_url || matchedVisitor.photoUrl || matchedVisitor.visitor_photo ? (
                      <img
                        src={resolvePhotoUrl(matchedVisitor.photo_url || matchedVisitor.photoUrl || matchedVisitor.visitor_photo)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-black text-white truncate">
                      {matchedVisitor.visitor_name || matchedVisitor.visitorName || matchedVisitor.full_name}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1 text-xs text-slate-400">
                      <p className="flex items-center gap-1.5 truncate">
                        <Building className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        {matchedVisitor.company || 'Independent Visitor'}
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        Host: <strong className="text-slate-200">{matchedVisitor.host_name || matchedVisitor.hostName || 'Front Desk'}</strong>
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        {matchedVisitor.email || matchedVisitor.visitor_email || 'No email'}
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        {matchedVisitor.phone || matchedVisitor.visitor_phone || 'Phone verified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Badge Allocation Bar */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-slate-300 font-bold">Assigned Physical Badge:</span>
                    <span className="font-mono text-sm font-black text-emerald-400 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                      {badgeNumber}
                    </span>
                  </div>
                  <button
                    onClick={generateNewBadge}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Change</span>
                  </button>
                </div>

                <button
                  disabled={loading}
                  onClick={() => executeCheckIn()}
                  className="w-full h-11 min-h-[44px] bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
                      <span>Checking in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 shrink-0" />
                      <span>Authorize Turnstile Ingress & Issue Badge</span>
                    </>
                  )}
                </button>
              </div>
            ) : hasSearched && !searching ? (
              <div className="max-w-md mx-auto p-6 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-amber-400 mx-auto" />
                <p className="text-sm font-bold text-white">No arrival record found for "{searchInput}"</p>
                <p className="text-xs text-slate-400">
                  Verify the appointment reference or check the expected roster below.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* MODE 2: SCAN QR PASS */}
        {activeTab === 'qr_scan' && (
          <div className="space-y-6 max-w-xl mx-auto text-center">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2">
                <QrCode className="h-4 w-4 text-cyan-400" />
                <span>Optical QR Pass / Badge Scanner</span>
              </h2>
              <p className="text-xs text-slate-400">Scan visitor appointment QR code or physical badge.</p>
            </div>

            <div className="relative w-full aspect-video bg-slate-950 border-2 border-cyan-500/40 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted></video>

              <div className="absolute inset-0 border-2 border-dashed border-cyan-400/50 m-8 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="h-1 w-full bg-cyan-400/80 animate-pulse shadow-lg shadow-cyan-500"></div>
              </div>

              {!cameraActive && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-slate-400 space-y-3">
                  <QrCode className="h-10 w-10 text-cyan-400 animate-pulse" />
                  <p className="text-xs font-bold text-slate-300">{cameraError || 'Camera Initializing...'}</p>
                  <button onClick={startCamera} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl">
                    Retry Camera
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 space-y-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Or enter Reference / Code manually:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Scan or enter Reference Code (e.g. VMS-2026-0041)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono text-center focus:outline-none focus:border-cyan-500"
                />
                <button
                  disabled={loading || !searchInput.trim()}
                  onClick={() => executeCheckIn(searchInput.trim())}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition"
                >
                  Verify & Enter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: BIOMETRIC FACE INGRESS */}
        {activeTab === 'face_scan' && (
          <div className="space-y-6 max-w-xl mx-auto text-center">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2">
                <Camera className="h-4 w-4 text-purple-400" />
                <span>Biometric Face Turnstile Ingress</span>
              </h2>
              <p className="text-xs text-slate-400">Position guest facing camera for AI entry authorization.</p>
            </div>

            <div className="relative w-full aspect-video bg-slate-950 border-2 border-purple-500/40 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted></video>

              <div className="absolute h-44 w-36 border-2 border-purple-400 rounded-[50%] pointer-events-none shadow-lg shadow-purple-500/30 flex items-center justify-center">
                <div className="text-[10px] text-purple-300 font-mono bg-slate-950/80 px-2 py-0.5 rounded">ALIGNED</div>
              </div>

              {scanningFace && (
                <div className="absolute inset-0 bg-purple-950/40 backdrop-blur-xs flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="h-8 w-8 text-purple-300 animate-spin" />
                  <p className="text-xs font-black uppercase text-purple-200 tracking-widest">Matching Identity Profile...</p>
                </div>
              )}
            </div>

            <button
              disabled={scanningFace || loading}
              onClick={handleFaceScan}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>Match Face & Unlock Gate</span>
            </button>

            {facialMatch && facialMatch.visitor && (
              <div className="bg-purple-950/20 border border-purple-500/40 rounded-2xl p-5 space-y-4 text-left shadow-xl">
                <div className="flex justify-between items-center border-b border-purple-500/20 pb-3">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Biometric Identity Confirmed
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {facialMatch.confidence}% Match Confidence
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-purple-500/40 overflow-hidden shrink-0">
                    <img
                      src={resolvePhotoUrl(
                        facialMatch.visitor.photo_url ||
                          facialMatch.visitor.photoUrl ||
                          facialMatch.visitor.visitor_photo
                      )}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {facialMatch.visitor.visitor_name || facialMatch.visitor.visitorName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {facialMatch.visitor.company || 'Guest'}
                    </p>
                    <p className="text-[10px] text-purple-300 font-mono mt-0.5">
                      Ref: {facialMatch.visitor.reference_code || facialMatch.visitor.appointment_number || 'Confirmed'}
                    </p>
                  </div>
                </div>

                <button
                  disabled={loading}
                  onClick={() => executeCheckIn(facialMatch.visitor.reference_code || facialMatch.visitor.appointment_number)}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-colors"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  <span>Authorize Ingress & Unlock Gate</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── EXPECTED ARRIVALS ROSTER TABLE ── */}
      <div className="rounded-3xl bg-[#0a0f1d] border border-slate-800 shadow-2xl overflow-hidden space-y-0">
        {/* Table Header Bar */}
        <div className="p-5 md:p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Expected Ingress Queue ({expectedArrivals.length} Approved Today)
              </h3>
              <p className="text-[11px] text-slate-400">
                Scheduled visitors approaching facility. Click check-in to issue badge and unlock turnstile speed gate.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter arrivals by name, ref, host..."
                value={filterArrivals}
                onChange={(e) => setFilterArrivals(e.target.value)}
                className="w-full bg-slate-900 border border-slate-750 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              {filterArrivals && (
                <button onClick={() => setFilterArrivals('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              onClick={() => loadExpectedArrivals()}
              disabled={loadingArrivals}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingArrivals ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        {loadingArrivals && expectedArrivals.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400" />
            <p className="text-xs font-bold tracking-wider uppercase">Loading today's expected visitors...</p>
          </div>
        ) : filteredArrivals.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-emerald-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-white">No Expected Arrivals Pending</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {filterArrivals
                ? 'No arrivals match your filter criteria.'
                : 'All scheduled arrivals for today have cleared turnstiles or no more visitors are scheduled.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 text-[11px] font-black uppercase tracking-wider">
                  <th className="py-4 px-4 sm:px-6">Appointment Ref & Lane</th>
                  <th className="py-4 px-4 min-w-[200px]">Visitor Guest</th>
                  <th className="py-4 px-4 min-w-[180px]">Host Officer & Dept</th>
                  <th className="py-4 px-4 min-w-[150px]">Scheduled Arrival</th>
                  <th className="py-4 px-4 min-w-[120px]">Clearance Status</th>
                  <th className="py-4 px-4 sm:px-6 text-right min-w-[160px]">Turnstile Ingress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <AnimatePresence>
                  {filteredArrivals.map((item, idx) => {
                    const isBusy = actionInProgressId === item.id;
                    const visitorName = item.visitor_name || item.visitorName || item.full_name || 'Visitor';
                    const initials = visitorName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    const isCheckedIn = item.is_checked_in || item.isCheckin;

                    return (
                      <motion.tr
                        key={item.id || idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`hover:bg-slate-800/40 transition-colors group ${
                          isCheckedIn ? 'bg-emerald-950/10' : ''
                        }`}
                      >
                        {/* Ref & Lane */}
                        <td className="py-4 px-4 sm:px-6 align-middle">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-1.5 h-8 rounded-full shrink-0 ${
                                isCheckedIn ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-blue-500'
                              }`}
                            />
                            <div>
                              <span className="font-mono text-xs font-black text-emerald-400 tracking-wider px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 block w-fit">
                                {item.reference_code || item.referenceCode || item.appointment_number || `APT-${item.id}`}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                                Ingress Lane 01
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Visitor Guest */}
                        <td className="py-4 px-4 align-middle">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white text-xs font-black shrink-0 border border-emerald-400/30 shadow-sm">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-white text-xs group-hover:text-emerald-300 transition-colors truncate">
                                {visitorName}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {item.company || 'Independent Visitor'}
                              </p>
                              <span className="text-[10px] text-slate-500 font-mono block">
                                ID #{item.visitor_id || item.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Host & Dept */}
                        <td className="py-4 px-4 align-middle">
                          <div className="space-y-0.5 text-slate-300">
                            <p className="font-bold text-white text-xs truncate">
                              {item.host_name || item.hostName || 'Department Host'}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {item.department_name || item.department || item.purpose || 'Official Business'}
                            </p>
                          </div>
                        </td>

                        {/* Scheduled Arrival */}
                        <td className="py-4 px-4 align-middle">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-300 font-bold text-xs">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>
                                {item.scheduled_start || item.scheduledStart
                                  ? new Date(item.scheduled_start || item.scheduledStart).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : 'Today'}
                              </span>
                            </div>
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                Approved Today
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Security Clearance */}
                        <td className="py-4 px-4 align-middle">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Pre-Screened
                          </span>
                        </td>

                        {/* Turnstile Action Hub */}
                        <td className="py-4 px-4 sm:px-6 align-middle text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1. Inspect Guest Dossier (Cyan) */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setInspectingGuest(item)}
                              title="Inspect Inbound Guest Dossier"
                              className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all shadow-sm"
                            >
                              <Eye className="w-4 h-4" />
                            </motion.button>

                            {/* 2. Rapid Check-In & Gate Unlock (Emerald) */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              disabled={isBusy || loading}
                              onClick={() => {
                                selectMatchedResult(item);
                                executeCheckIn(item.reference_code || item.referenceCode || item.appointment_number || String(item.id));
                              }}
                              title="Authorize Ingress & Unlock Gate"
                              className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-500 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                            >
                              {isBusy ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              )}
                            </motion.button>

                            {/* 3. Restricted Area Access Badge Studio (Amber/Red) */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                const visId = item.visitor_id || item.id;
                                navigate(`/dashboard?view=badge_management&visitorId=${visId}`);
                              }}
                              title="Provision Restricted Area Badge"
                              className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all shadow-sm"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </motion.button>

                            {/* 4. Cancel / Remove Arrival (Red) */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              disabled={isBusy}
                              onClick={() => setCancellingArrival(item)}
                              title="Cancel Inbound Appointment"
                              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all shadow-sm disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Summary */}
        <div className="bg-slate-900/60 border-t border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              Showing <strong>{filteredArrivals.length}</strong> of <strong>{expectedArrivals.length}</strong> expected inbound arrivals
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-blue-400 font-bold">{pendingCheckinsCount} Awaiting Ingress</span>
            <span className="text-emerald-400 font-bold">{arrivalsTodayCount} Admitted</span>
            <span className="text-cyan-400 font-bold">Speed Gates Armed</span>
          </div>
        </div>
      </div>

      {/* ── INSPECT INBOUND DOSSIER MODAL ── */}
      <AnimatePresence>
        {inspectingGuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0f1d] border border-cyan-500/40 rounded-3xl p-6 md:p-8 w-full max-w-xl shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">Inbound Arrival Dossier</h3>
                    <p className="text-xs text-slate-400">
                      Ref #{inspectingGuest.reference_code || inspectingGuest.appointment_number || `APT-${inspectingGuest.id}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectingGuest(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Guest Profile Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-base font-black shrink-0">
                  {(inspectingGuest.visitor_name || inspectingGuest.full_name || 'V')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white">
                    {inspectingGuest.visitor_name || inspectingGuest.full_name}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {inspectingGuest.company || 'Independent Visitor'}
                  </p>
                  <p className="text-[11px] text-cyan-400 font-mono mt-0.5">
                    {inspectingGuest.phone || 'Phone verified'}
                  </p>
                </div>
              </div>

              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Host Officer / Dept</span>
                  <p className="font-bold text-white truncate">{inspectingGuest.host_name || 'Department Host'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{inspectingGuest.department_name || inspectingGuest.purpose || 'Official Visit'}</p>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Scheduled Time</span>
                  <p className="font-bold text-emerald-400 font-mono text-sm">
                    {inspectingGuest.scheduled_start
                      ? new Date(inspectingGuest.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Today'}
                  </p>
                  <p className="text-[10px] text-slate-400">Status: Approved Pre-Screened</p>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setInspectingGuest(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    selectMatchedResult(inspectingGuest);
                    executeCheckIn(inspectingGuest.reference_code || inspectingGuest.appointment_number || String(inspectingGuest.id));
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold uppercase tracking-wide flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Authorize Ingress & Unlock Gate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CANCEL ARRIVAL CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {cancellingArrival && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-[#0a0f1d] border border-red-500/40 p-6 md:p-8 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Cancel Expected Arrival</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Appointment #{cancellingArrival.id}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to cancel the scheduled inbound visit appointment for:
                <strong className="text-white block mt-1">
                  "{cancellingArrival.visitor_name || cancellingArrival.full_name}"
                </strong>
                This action is non-reversible and removes them from today's ingress roster.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingArrival(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionInProgressId !== null}
                  onClick={() => handleDeleteArrival(cancellingArrival)}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold tracking-wide uppercase shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  Confirm Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
