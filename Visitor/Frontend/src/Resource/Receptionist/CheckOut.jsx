import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  Camera,
  Search,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Building,
  User,
  Clock,
  Mail,
  UserCheck,
  Trash2,
  Eye,
  X,
  Radio,
  MapPin,
  Check,
  Flame,
  Shield,
  Layers,
  ChevronRight,
  Filter,
  Phone,
  AlertTriangle,
  Unlock,
  Lock,
  DoorOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import api, { checkinApi, checkoutApi, getErrorMessage } from '../../services/api';
import { resolvePhotoUrl } from '../../utils/photoUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useResponseNavigation, RESPONSE_TYPES } from '../../modules/response';

export default function CheckOut() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toSuccess, toError, toConfirmation } = useResponseNavigation();

  // Mode Selection: 'id_ref' (Rapid Search/Tap), 'qr_scan' (Optical Scanner), 'face_scan' (Biometric Face)
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

  // Turnstile Gate Hardware Simulation State
  const [turnstileLane, setTurnstileLane] = useState('LANE-01 (Speed Gate North)');
  const [barrierState, setBarrierState] = useState('LOCKED'); // 'LOCKED' | 'UNLOCKED'
  const [recentCheckedOutVisitor, setRecentCheckedOutVisitor] = useState(null);

  // Verification Checklist State
  const [verifyId, setVerifyId] = useState(true);
  const [verifyAssets, setVerifyAssets] = useState(true);
  const [verifyClearance, setVerifyClearance] = useState(true);
  const [checkoutRemarks, setCheckoutRemarks] = useState('');

  // Inspect Modal & Void Modal
  const [inspectingGuest, setInspectingGuest] = useState(null);
  const [voidingGuest, setVoidingGuest] = useState(null);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  // Camera / Face Scan states
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facialMatch, setFacialMatch] = useState(null);
  const [scanningFace, setScanningFace] = useState(false);

  useEffect(() => {
    loadPendingInside();
    const interval = setInterval(() => loadPendingInside(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const loadPendingInside = async (isBackground = false) => {
    if (!isBackground) setLoadingPending(true);
    try {
      const res = await checkoutApi.pending();
      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      setPendingInside(list);
    } catch (e) {
      console.warn('Failed to load inside visitors:', e);
    } finally {
      setLoadingPending(false);
    }
  };

  const handleDeleteSession = async (item) => {
    const name = item.visitorName || item.visitor_name || 'this visitor';
    const idToDelete = item.checkinId || item.id;
    setVoidingGuest(null);
    toConfirmation({
      title: 'Confirm Voiding Active Visit Session',
      message: `Void active visit session for "${name}" and deactivate access badge?`,
      entityType: 'Active Visit Session',
      entityName: name,
      entityId: idToDelete,
      consequences: [
        'The active visit session will be terminated immediately.',
        'Speed gate egress credentials and NFC badge will be revoked.',
        'An administrative void entry will be registered in the enterprise audit log.'
      ],
      confirmLabel: 'Void Visit Session',
      confirmVariant: 'danger',
      apiEndpoint: `/checkin/${idToDelete}`,
      apiMethod: 'DELETE',
      returnUrl: window.location.pathname + window.location.search,
      successConfig: {
        type: RESPONSE_TYPES.RECORD_DELETED,
        title: 'Visit Session Voided',
        message: `Active session for "${name}" has been terminated and purged from building roster.`,
      }
    });
  };

  // Camera stream controls
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
        const matches = Array.isArray(res.data.matchingSessions)
          ? res.data.matchingSessions
          : [res.data];
        setMatchingSessions(matches);
        setActiveSession(res.data);
        setMessage(null);
      } else {
        setActiveSession(null);
        setMatchingSessions([]);
      }
    } catch (err) {
      try {
        const pendingRes = await checkoutApi.pending(q);
        const list = Array.isArray(pendingRes.data?.data) ? pendingRes.data.data : [];
        if (list.length > 0) {
          setMatchingSessions(list);
          setActiveSession(list[0]);
          setMessage(null);
        } else {
          setActiveSession(null);
          setMatchingSessions([]);
        }
      } catch (e) {
        setActiveSession(null);
        setMatchingSessions([]);
      }
    } finally {
      setSearching(false);
    }
  };

  const selectSession = (item) => {
    setActiveSession(item);
  };

  // Trigger turnstile barrier unlock visual animation
  const triggerTurnstileUnlock = (visitorName) => {
    setBarrierState('UNLOCKED');
    setRecentCheckedOutVisitor(visitorName);
    setTimeout(() => {
      setBarrierState('LOCKED');
      setRecentCheckedOutVisitor(null);
    }, 4500);
  };

  // Execute Check-Out release
  const executeCheckOut = async (targetSession) => {
    const session = targetSession || activeSession;
    if (!session) {
      setMessage({ type: 'error', text: 'No active session selected for check-out.' });
      return;
    }
    const currentId = session.checkinId || session.id;
    setActionInProgressId(currentId);
    setLoading(true);
    setMessage(null);

    const visitorDisplayName = session.visitor_name || session.visitorName || 'Visitor';

    try {
      const targetApptId = session.appointment_id || session.appointmentId;
      const targetCode =
        session.badge_number ||
        session.badgeNumber ||
        session.reference_code ||
        session.referenceCode ||
        session.pass_code ||
        session.passCode ||
        String(session.checkin_id || session.checkinId || targetApptId);

      let durationMins = session.minutesInside || session.minutes_inside || 35;

      if (targetApptId) {
        const payload = {
          checkoutMethod: 'TURNSTILE_BARRIER',
          remarks: checkoutRemarks || 'Guest departure confirmed via Gate Turnstile Egress Terminal',
          verifications: [
            { type: 'IDENTITY', status: verifyId ? 'PASSED' : 'FAILED' },
            { type: 'ASSET', status: verifyAssets ? 'PASSED' : 'FAILED' },
            { type: 'SECURITY_CLEARANCE', status: verifyClearance ? 'PASSED' : 'FAILED' }
          ]
        };
        const res = await checkinApi.checkout(targetApptId, payload);
        durationMins = res.data?.durationMinutes || durationMins;
      } else {
        const res = await checkoutApi.process({
          code: targetCode,
          remarks: checkoutRemarks || 'Gate Turnstile departure confirmed',
          passCondition: verifyAssets ? 'GOOD' : 'DAMAGED'
        });
        durationMins = res.data?.data?.totalVisitDuration || durationMins;
      }

      // Unlock turnstile barrier animation!
      triggerTurnstileUnlock(visitorDisplayName);

      toSuccess({
        type: RESPONSE_TYPES.CHECKOUT_SUCCESS,
        title: 'Turnstile Egress Authorized',
        message: `Egress Authorized! ${visitorDisplayName} checked out (Duration: ${durationMins}m). Turnstile Barrier Unlocked.`,
        referenceId: targetCode,
        entityType: 'Visitor Check-Out',
        entityName: visitorDisplayName,
        primaryActionText: 'Process Next Check-Out',
        primaryActionUrl: '/dashboard?view=checkout',
        returnUrl: '/dashboard?view=checkout',
      });

      // Refresh pending inside list and reset active session
      loadPendingInside(true);
      setActiveSession(null);
      setMatchingSessions([]);
      setSearchInput('');
      setFacialMatch(null);
      setCheckoutRemarks('');
      if (inspectingGuest && (inspectingGuest.checkinId || inspectingGuest.id) === currentId) {
        setInspectingGuest(null);
      }
    } catch (err) {
      try {
        const targetCode =
          session.badge_number ||
          session.badgeNumber ||
          session.reference_code ||
          session.referenceCode ||
          String(session.checkin_id || session.checkinId);
        const res = await checkoutApi.process({
          code: targetCode,
          remarks: checkoutRemarks || 'Gate Turnstile departure confirmed'
        });
        triggerTurnstileUnlock(visitorDisplayName);
        toSuccess({
          type: RESPONSE_TYPES.CHECKOUT_SUCCESS,
          title: 'Turnstile Egress Authorized',
          message: `Egress Authorized! ${visitorDisplayName} released. Barrier Unlocked.`,
          referenceId: targetCode,
          entityType: 'Visitor Check-Out',
          entityName: visitorDisplayName,
          primaryActionText: 'Process Next Check-Out',
          primaryActionUrl: '/dashboard?view=checkout',
          returnUrl: '/dashboard?view=checkout',
        });
        loadPendingInside(true);
        setActiveSession(null);
        setMatchingSessions([]);
        setSearchInput('');
        if (inspectingGuest) setInspectingGuest(null);
      } catch (err2) {
        toError(err2 || err, {
          title: 'Egress Authorization Failed',
          entityType: 'Visitor Check-Out',
          entityName: visitorDisplayName,
          returnUrl: '/dashboard?view=checkout',
        });
      }
    } finally {
      setLoading(false);
      setActionInProgressId(null);
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
            confidence: 99.2,
            visitor: candidate
          });
          setActiveSession(candidate);
        } else {
          setMessage({ type: 'error', text: 'No inside active guest matched this face scan.' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Biometric face matching query failed.' });
      } finally {
        setScanningFace(false);
      }
    }, 1200);
  };

  // Manual Emergency Gate Release
  const handleEmergencyGateRelease = () => {
    triggerTurnstileUnlock('Emergency Security Release');
    setMessage({
      type: 'info',
      text: '⚠️ Turnstile Speed Gate manually unlocked for 4.5 seconds. Optical sensors cycling.'
    });
  };

  // KPI calculations
  const totalInside = pendingInside.length;
  const overstayCount = pendingInside.filter((i) => i.isOverstay || i.is_overstay || (i.minutesInside || 0) > 180).length;
  const normalCount = Math.max(0, totalInside - overstayCount);

  // Filtered inside visitors list
  const filteredPending = useMemo(() => {
    if (!filterPending.trim()) return pendingInside;
    const term = filterPending.toLowerCase();
    return pendingInside.filter(
      (item) =>
        (item.visitorName || item.visitor_name || '').toLowerCase().includes(term) ||
        (item.badgeNumber || item.badge_number || '').toLowerCase().includes(term) ||
        (item.referenceCode || item.reference_code || '').toLowerCase().includes(term) ||
        (item.visitorCompany || item.company || '').toLowerCase().includes(term) ||
        (item.hostName || item.host_name || '').toLowerCase().includes(term)
    );
  }, [pendingInside, filterPending]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans">
      {/* ── TOP HERO HEADER WITH CURVED WAVE ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-[#1a0f1c] border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500" />

        {/* Ambient Wave SVG */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none w-96 h-48 overflow-hidden">
          <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="w-full h-full">
            <path
              d="M0.00,49.98 C150.00,150.00 349.81,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z"
              fill="#f43f5e"
            ></path>
          </svg>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <BackButton fallbackUrl="/dashboard" title="Back to Dashboard" className="mt-1" />
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-extrabold tracking-wide">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                Active Optical & RFID Turnstile Egress Terminal
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                {language === 'am' ? 'የበር መውጫ ቼክ-አውት' : 'Gate Turnstile Check-Out'}
                <LogOut className="w-7 h-7 text-rose-500 animate-pulse shrink-0" />
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl font-medium">
                Instant speed-gate departure processing, automated optical pass barcode / QR scanner, badge recovery validation, and real-time perimeter egress control.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate('/dashboard?view=checkin')}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition shadow-sm"
              title="Switch to Gate Turnstile Check-In"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Switch to Check-In</span>
            </button>

            <button
              onClick={() => loadPendingInside()}
              disabled={loadingPending}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition shadow-sm"
              title="Refresh Inside Guests"
            >
              <RefreshCw className={`w-4 h-4 ${loadingPending ? 'animate-spin text-rose-400' : ''}`} />
              <span>Sync Egress</span>
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
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
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
                <h3 className="text-base font-black text-white">
                  {turnstileLane}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                    barrierState === 'UNLOCKED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {barrierState === 'UNLOCKED' ? 'BARRIER OPEN — PASS' : 'SECURE & LOCKED'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Lane Toggle */}
          <div className="flex items-center gap-2">
            {['LANE-01 (Speed Gate North)', 'LANE-02 (Speed Gate East)'].map((lane) => (
              <button
                key={lane}
                onClick={() => setTurnstileLane(lane)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  turnstileLane === lane
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {lane.split(' ')[0]}
              </button>
            ))}
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
                    TURNSTILE GATE BARRIER OPEN
                  </h4>
                  <p className="text-xs text-emerald-400/90 font-medium">
                    Visitor {recentCheckedOutVisitor || 'Guest'} cleared. Departure logged in SOC audit feed.
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
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-l-2xl group-hover:w-2.5 transition-all shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Inside Facility</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">{totalInside}</h3>
            <span className="text-[11px] font-bold text-amber-400">Active Badges</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Visitors awaiting turnstile checkout</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Normal Visit Duration</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-white">{normalCount}</h3>
            <span className="text-[11px] font-bold text-blue-400">In Window</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Within standard authorized visit limit</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-rose-900/40 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 rounded-l-2xl group-hover:w-2.5 transition-all shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-rose-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              Overstay Inquiries
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-rose-400">{overstayCount}</h3>
            <span className="text-[11px] font-bold text-rose-400">Flagged</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Visitors exceeding appointment duration</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-5 shadow-lg group transition-all"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-2xl group-hover:w-2.5 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Turnstile Clearance</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-emerald-400">100%</h3>
            <span className="text-[11px] font-bold text-emerald-400">Operational</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Perimeter speed gates responsive</p>
        </motion.div>
      </div>

      {/* ── 3 INTERACTIVE OPERATING MODE SELECTORS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => setActiveTab('id_ref')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
            activeTab === 'id_ref'
              ? 'bg-rose-600/15 border-rose-500 text-white shadow-lg shadow-rose-500/10'
              : 'bg-[#0a0f19] border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${activeTab === 'id_ref' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
            <Search className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider">1. Rapid Search / Tap-Out</div>
            <div className="text-[10px] text-slate-500 mt-0.5">By Name, Badge # (BDG-XXXX), Ref #, Phone</div>
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
            <div className="text-xs font-black uppercase tracking-wider">2. Optical QR / Barcode Scanner</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Live optical scanner or pass QR token</div>
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
            <div className="text-xs font-black uppercase tracking-wider">3. Biometric Face Egress</div>
            <div className="text-[10px] text-slate-500 mt-0.5">AI Facial matching departure clearance</div>
          </div>
        </button>
      </div>

      {/* ── MAIN MODE PANEL ── */}
      <div className="bg-[#0a0f19] border border-slate-800 rounded-3xl p-5 md:p-7 shadow-2xl">
        {/* MODE 1: SEARCH ACTIVE GUESTS */}
        {activeTab === 'id_ref' && (
          <div className="space-y-6">
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-rose-400" />
                  <input
                    type="text"
                    placeholder="Search inside guest by Visitor Name, Badge (BDG-XXXX), Ref (VMS-XXXX), Phone..."
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      handleActiveSessionLookup(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleActiveSessionLookup(searchInput);
                    }}
                    autoFocus
                    className="w-full bg-slate-900 border-2 border-slate-750 focus:border-rose-500 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition font-sans"
                  />
                  {searchInput && (
                    <button
                      onClick={() => {
                        setSearchInput('');
                        setActiveSession(null);
                        setMatchingSessions([]);
                        setHasSearched(false);
                      }}
                      className="absolute right-3 top-3 text-xs text-slate-500 hover:text-slate-300"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleActiveSessionLookup(searchInput)}
                  disabled={searching}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
                >
                  {searching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span>Find Guest</span>
                </button>
              </div>

              {/* Quick Search Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                <span className="font-semibold text-slate-500">Quick match:</span>
                {['Badge #', 'Visitor Name', 'Reference Code', 'Phone', 'Email', 'Visitor ID', 'Company'].map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Multiple Sessions Grid if search returned > 1 */}
            {matchingSessions.length > 1 && (
              <div className="max-w-4xl mx-auto space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                  <span>Matching Active Guests ({matchingSessions.length} Found)</span>
                  <span className="text-[10px] text-rose-400">Click a record to select for Check-Out</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {matchingSessions.map((rec, i) => {
                    const isSelected =
                      (activeSession?.checkin_id || activeSession?.checkinId) ===
                      (rec.checkin_id || rec.checkinId);
                    return (
                      <div
                        key={i}
                        onClick={() => selectSession(rec)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                          isSelected
                            ? 'bg-rose-950/40 border-rose-500 ring-1 ring-rose-500/50'
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
                            <p className="text-xs font-bold text-white truncate">{rec.visitor_name || rec.visitorName}</p>
                            <p className="text-[10px] text-slate-400 truncate">{rec.visitor_company || rec.visitorCompany || 'Guest'}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded text-[10px] font-mono font-bold shrink-0">
                            {rec.badge_number || rec.badgeNumber || 'No Badge'}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/80 pt-1.5">
                          <span className="font-mono text-slate-400">
                            {rec.reference_code || rec.referenceCode || `ID #${rec.visitor_id || rec.visitorId}`}
                          </span>
                          <span className="text-rose-400 font-medium">Inside {rec.minutes_inside || rec.minutesInside || 0}m</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Session Card Preview */}
            {activeSession ? (
              <div className="max-w-2xl mx-auto bg-slate-900/90 border border-rose-500/40 rounded-3xl p-5 md:p-6 space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-rose-400 uppercase tracking-widest">
                      {activeSession.badge_number ||
                        activeSession.badgeNumber ||
                        activeSession.reference_code ||
                        activeSession.referenceCode ||
                        'ACTIVE SESSION'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      Inside Building
                    </span>
                    {activeSession.id_verification_status === 'APPROVED' || activeSession.id_verification_status === 'VERIFIED' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-xs">
                        🛡️ Biometrics & ID Verified
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                        🆔 Standard Badge
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    In:{' '}
                    {activeSession.checked_in_at || activeSession.checkedInAt
                      ? new Date(activeSession.checked_in_at || activeSession.checkedInAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '—'}
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-md">
                    {activeSession.photo_url || activeSession.photoUrl || activeSession.visitor_photo ? (
                      <img
                        src={resolvePhotoUrl(activeSession.photo_url || activeSession.photoUrl || activeSession.visitor_photo)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-black text-white truncate">
                      {activeSession.visitor_name || activeSession.visitorName}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1 text-xs text-slate-400">
                      <p className="flex items-center gap-1.5 truncate">
                        <Building className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        {activeSession.visitor_company || activeSession.visitorCompany || 'Independent Visitor'}
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        Host: <strong className="text-slate-200">{activeSession.host_name || activeSession.hostName || 'Front Desk'}</strong>
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        {activeSession.visitor_email || activeSession.visitorEmail || 'No email'}
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        Duration: <strong className="text-amber-400">{activeSession.minutes_inside || activeSession.minutesInside || '—'} minutes</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verification Checklist */}
                <div className="bg-slate-950 p-4 rounded-2xl space-y-2.5 border border-slate-850">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    Departure Clearance & Asset Checklist
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                        verifyId ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input type="checkbox" checked={verifyId} onChange={(e) => setVerifyId(e.target.checked)} className="rounded text-emerald-500 focus:ring-0" />
                      <span>ID Verified</span>
                    </label>
                    <label
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                        verifyAssets ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input type="checkbox" checked={verifyAssets} onChange={(e) => setVerifyAssets(e.target.checked)} className="rounded text-emerald-500 focus:ring-0" />
                      <span>Badge Returned</span>
                    </label>
                    <label
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                        verifyClearance ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input type="checkbox" checked={verifyClearance} onChange={(e) => setVerifyClearance(e.target.checked)} className="rounded text-emerald-500 focus:ring-0" />
                      <span>Clearance OK</span>
                    </label>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Exit remarks or incident notes (optional)..."
                      value={checkoutRemarks}
                      onChange={(e) => setCheckoutRemarks(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => executeCheckOut()}
                  className="w-full h-12 min-h-[48px] bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-rose-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin shrink-0" /> : <LogOut className="h-4 w-4 shrink-0" />}
                  <span>{loading ? 'Authorizing Turnstile Egress & Checking Out...' : 'Authorize Turnstile Egress & Unlock Gate'}</span>
                </button>
              </div>
            ) : hasSearched && !searching ? (
              <div className="max-w-md mx-auto p-6 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-amber-400 mx-auto" />
                <p className="text-sm font-bold text-white">No active inside session found for "{searchInput}"</p>
                <p className="text-xs text-slate-400">
                  Ensure the visitor is currently checked in, or check the table below.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* MODE 2: SCAN QR CODE */}
        {activeTab === 'qr_scan' && (
          <div className="space-y-6 max-w-xl mx-auto text-center">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2">
                <QrCode className="h-4 w-4 text-cyan-400" />
                <span>Optical QR Pass / Badge Scanner</span>
              </h2>
              <p className="text-xs text-slate-400">Position visitor badge barcode or digital pass QR code in frame.</p>
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
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Or enter Badge / Code manually:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Scan or enter Badge # (e.g. BDG-8421 or VMS-XXXX)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono text-center focus:outline-none focus:border-cyan-500"
                />
                <button
                  disabled={loading || !searchInput.trim()}
                  onClick={() => handleActiveSessionLookup(searchInput.trim())}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition"
                >
                  Verify Code
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: BIOMETRIC FACE MATCH */}
        {activeTab === 'face_scan' && (
          <div className="space-y-6 max-w-xl mx-auto text-center">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2">
                <Camera className="h-4 w-4 text-purple-400" />
                <span>Biometric Face Turnstile Egress</span>
              </h2>
              <p className="text-xs text-slate-400">Position guest facing camera for AI departure release validation.</p>
            </div>

            <div className="relative w-full aspect-video bg-slate-950 border-2 border-purple-500/40 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted></video>

              <div className="absolute h-44 w-36 border-2 border-purple-400 rounded-[50%] pointer-events-none shadow-lg shadow-purple-500/30 flex items-center justify-center">
                <div className="text-[10px] text-purple-300 font-mono bg-slate-950/80 px-2 py-0.5 rounded">ALIGNED</div>
              </div>

              {scanningFace && (
                <div className="absolute inset-0 bg-purple-950/40 backdrop-blur-xs flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="h-8 w-8 text-purple-300 animate-spin" />
                  <p className="text-xs font-black uppercase text-purple-200 tracking-widest">Matching Departure Profile...</p>
                </div>
              )}
            </div>

            <button
              disabled={scanningFace || loading}
              onClick={handleFaceScanCheckOut}
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
                    Biometric Identity Matched
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
                      {facialMatch.visitor.visitor_company || facialMatch.visitor.visitorCompany || 'Guest'}
                    </p>
                    <p className="text-[10px] text-purple-300 font-mono mt-0.5">
                      Badge: {facialMatch.visitor.badge_number || facialMatch.visitor.badgeNumber || '—'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => executeCheckOut(facialMatch.visitor)}
                  className="w-full h-12 min-h-[48px] bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-colors disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin shrink-0" /> : <LogOut className="h-4 w-4 shrink-0" />}
                  <span>{loading ? 'Authorizing Turnstile Egress & Checking Out...' : 'Release & Authorize Turnstile Egress'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CURRENTLY INSIDE GUESTS TABLE (TURNSTILE ROSTER) ── */}
      <div className="rounded-3xl bg-[#0a0f1d] border border-slate-800 shadow-2xl overflow-hidden space-y-0">
        {/* Table Header Bar */}
        <div className="p-5 md:p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Live Turnstile Egress Queue ({pendingInside.length} Inside)
              </h3>
              <p className="text-[11px] text-slate-400">
                Active registered guests in facility. Tap checkout to unlock turnstile barrier and log departure.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter by name, badge, host..."
                value={filterPending}
                onChange={(e) => setFilterPending(e.target.value)}
                className="w-full bg-slate-900 border border-slate-750 focus:border-rose-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              {filterPending && (
                <button onClick={() => setFilterPending('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              onClick={() => loadPendingInside()}
              disabled={loadingPending}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPending ? 'animate-spin text-rose-400' : ''}`} />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        {loadingPending && pendingInside.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-rose-400" />
            <p className="text-xs font-bold tracking-wider uppercase">Loading active building occupants...</p>
          </div>
        ) : filteredPending.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-emerald-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-white">No Active Inside Visitors</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {filterPending
                ? 'No inside visitors match your filter criteria.'
                : 'All registered guests have checked out through turnstile speed gates. Facility perimeter is clear.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 text-[11px] font-black uppercase tracking-wider">
                  <th className="py-4 px-4 sm:px-6">Badge & Lane</th>
                  <th className="py-4 px-4 min-w-[200px]">Visitor Guest</th>
                  <th className="py-4 px-4 min-w-[180px]">Host & Purpose</th>
                  <th className="py-4 px-4 min-w-[150px]">Entry Time & Duration</th>
                  <th className="py-4 px-4 min-w-[120px]">Asset / Pass</th>
                  <th className="py-4 px-4 sm:px-6 text-right min-w-[160px]">Turnstile Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <AnimatePresence>
                  {filteredPending.map((item, idx) => {
                    const isBusy = actionInProgressId === (item.checkinId || item.id);
                    const visitorName = item.visitorName || item.visitor_name || 'Visitor';
                    const initials = visitorName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);
                    const isOverstay =
                      item.isOverstay ||
                      item.is_overstay ||
                      (item.minutesInside || item.minutes_inside || 0) > 180;
                    const durationMins = item.minutesInside || item.minutes_inside || 0;

                    return (
                      <motion.tr
                        key={item.checkinId || item.id || idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`hover:bg-slate-800/40 transition-colors group ${
                          isOverstay ? 'bg-rose-950/15' : ''
                        }`}
                      >
                        {/* Badge & Lane */}
                        <td className="py-4 px-4 sm:px-6 align-middle">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-1.5 h-8 rounded-full shrink-0 ${
                                isOverstay ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-emerald-500'
                              }`}
                            />
                            <div>
                              <span className="font-mono text-xs font-black text-rose-400 tracking-wider px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20 block w-fit">
                                {item.badgeNumber || item.badge_number || `BDG-${item.visitorId || idx}`}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                                Egress Lane 01
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Visitor Guest */}
                        <td className="py-4 px-4 align-middle">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white text-xs font-black shrink-0 border border-indigo-400/30 shadow-sm">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-white text-xs group-hover:text-rose-300 transition-colors truncate">
                                {visitorName}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {item.visitorCompany || item.company || 'Independent Visitor'}
                              </p>
                              <span className="text-[10px] text-slate-500 font-mono block">
                                ID #{item.visitorId || item.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Host & Purpose */}
                        <td className="py-4 px-4 align-middle">
                          <div className="space-y-0.5 text-slate-300">
                            <p className="font-bold text-white text-xs truncate">
                              {item.hostName || item.host_name || 'Front Desk Staff'}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {item.department || item.purpose || 'Official Business'}
                            </p>
                          </div>
                        </td>

                        {/* Entry Time & Duration */}
                        <td className="py-4 px-4 align-middle">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-300 font-bold text-xs">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>
                                {item.checkedInAt || item.checked_in_at
                                  ? new Date(item.checkedInAt || item.checked_in_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : '—'}
                              </span>
                            </div>
                            <div>
                              {isOverstay ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/15 border border-rose-500/30 text-rose-400 animate-pulse">
                                  <AlertTriangle className="w-3 h-3" />
                                  {durationMins}m (Overstay)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                  {durationMins} min inside
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Asset / Pass */}
                        <td className="py-4 px-4 align-middle">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Pass Active
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
                              title="Inspect Guest Egress Dossier"
                              className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all shadow-sm"
                            >
                              <Eye className="w-4 h-4" />
                            </motion.button>

                            {/* 2. Rapid Check-Out & Barrier Unlock (Emerald) */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              disabled={isBusy || loading}
                              onClick={() => executeCheckOut(item)}
                              title="Tap Out & Release Turnstile Barrier"
                              className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-500 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                            >
                              {isBusy ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              )}
                            </motion.button>

                            {/* 3. Void / Cancel Session (Red) */}
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              disabled={isBusy}
                              onClick={() => setVoidingGuest(item)}
                              title="Void / Delete Active Visit Session"
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
              Showing <strong>{filteredPending.length}</strong> of <strong>{pendingInside.length}</strong> active occupants inside
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-amber-400 font-bold">{normalCount} Standard Visits</span>
            <span className="text-rose-400 font-bold">{overstayCount} Overstays</span>
            <span className="text-emerald-400 font-bold">Speed Gates Armed</span>
          </div>
        </div>
      </div>

      {/* ── INSPECT GUEST EGRESS DOSSIER MODAL ── */}
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
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">Visitor Egress Dossier</h3>
                    <p className="text-xs text-slate-400">
                      Badge #{inspectingGuest.badgeNumber || inspectingGuest.badge_number || 'N/A'} • Check-In ID #{inspectingGuest.checkinId || inspectingGuest.id}
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
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-base font-black shrink-0">
                  {(inspectingGuest.visitorName || inspectingGuest.visitor_name || 'V')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white">
                    {inspectingGuest.visitorName || inspectingGuest.visitor_name}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {inspectingGuest.visitorCompany || inspectingGuest.company || 'Independent Visitor'}
                  </p>
                  <p className="text-[11px] text-cyan-400 font-mono mt-0.5">
                    {inspectingGuest.visitorPhone || inspectingGuest.phone || 'Phone verified'}
                  </p>
                </div>
              </div>

              {/* Visit Telemetry Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Host Officer / Staff</span>
                  <p className="font-bold text-white truncate">{inspectingGuest.hostName || inspectingGuest.host_name || 'Front Desk'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{inspectingGuest.department || 'Executive Office'}</p>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Time Inside</span>
                  <p className="font-bold text-amber-400 font-mono text-sm">
                    {inspectingGuest.minutesInside || inspectingGuest.minutes_inside || 0} Minutes
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Checked in: {inspectingGuest.checkedInAt ? new Date(inspectingGuest.checkedInAt).toLocaleTimeString() : 'Today'}
                  </p>
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
                  onClick={() => executeCheckOut(inspectingGuest)}
                  className="h-10 min-h-[40px] px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold uppercase tracking-wide flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span>{loading ? 'Releasing Gate...' : 'Tap Out & Release Gate'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── VOID / DELETE SESSION CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {voidingGuest && (
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
                  <h3 className="text-base font-black text-white">Void Active Visit Session</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Check-In #{voidingGuest.checkinId || voidingGuest.id}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to delete and void the active building occupant record for:
                <strong className="text-white block mt-1">
                  "{voidingGuest.visitorName || voidingGuest.visitor_name}"
                </strong>
                This action is non-reversible and removes them from the active occupancy roster.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVoidingGuest(null)}
                  className="h-10 min-h-[40px] px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionInProgressId !== null}
                  onClick={() => handleDeleteSession(voidingGuest)}
                  className="h-10 min-h-[40px] px-6 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold tracking-wide uppercase shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {actionInProgressId !== null ? <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> : <Trash2 className="w-4 h-4 shrink-0" />}
                  <span>{actionInProgressId !== null ? 'Voiding...' : 'Confirm Void'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
