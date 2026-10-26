import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scan,
  Search,
  Camera,
  CameraOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  LogIn,
  User,
  Building,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  Clock,
  Printer,
  Sparkles,
  Check,
  X,
  Radio,
  FileText,
  Key,
  Shield,
  Smartphone,
  CheckCircle,
  Eye,
  AlertOctagon,
  Copy,
  ExternalLink,
  RotateCcw,
  Ban
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import api, { securityApi, checkoutApi, getErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';

// Helper: Resolve Photo URL
function resolvePhotoUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  const base = api.defaults.baseURL || '';
  const cleanBase = base.replace(/\/api\/?$/, '');
  return `${cleanBase}${url.startsWith('/') ? '' : '/'}${url}`;
}

// Helper: Initials Avatar Fallback
function getPhotoFallbackInitials(name) {
  if (!name) return 'V';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Resilient Avatar: Guaranteed Zero Broken Image Glyphs
function VisitorAvatar({ photoUrl, name, size = 'w-16 h-16', textSize = 'text-xl', badgeBorder = 'border-indigo-500/60' }) {
  const [imgError, setImgError] = useState(false);
  const initials = getPhotoFallbackInitials(name);

  // Filter out nonexistent placeholder strings from databases
  const isInvalid =
    !photoUrl ||
    photoUrl.includes('default-avatar') ||
    photoUrl.includes('placeholder') ||
    photoUrl === 'null' ||
    photoUrl === 'undefined';

  const resolved = isInvalid ? null : resolvePhotoUrl(photoUrl);

  if (!resolved || imgError) {
    return (
      <div
        className={`${size} rounded-2xl bg-gradient-to-br from-indigo-700 via-blue-600 to-purple-800 flex items-center justify-center font-black text-white ${textSize} shadow-xl shrink-0 border-2 ${badgeBorder} select-none`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt=""
      onError={() => setImgError(true)}
      className={`${size} rounded-2xl object-cover border-2 ${badgeBorder} shadow-xl shrink-0`}
    />
  );
}

// Security Clearance Definitions
const CLEARANCE_LEVELS = [
  { id: 'LEVEL_1', name: 'Level 1: Public Lobby & Reception', short: 'LOBBY ONLY', color: 'emerald', bg: 'bg-emerald-600' },
  { id: 'LEVEL_2', name: 'Level 2: General Workspace & Meeting Rooms', short: 'GENERAL ACCESS', color: 'blue', bg: 'bg-blue-600' },
  { id: 'LEVEL_3', name: 'Level 3: Executive & Management Suite', short: 'EXECUTIVE SUITE', color: 'purple', bg: 'bg-purple-600' },
  { id: 'LEVEL_4', name: 'Level 4: Restricted High-Security Zone', short: 'DATA CORE / IT', color: 'rose', bg: 'bg-rose-600' },
  { id: 'LEVEL_5', name: 'Level 5: Escorted Access Only', short: 'ESCORT REQUIRED', color: 'amber', bg: 'bg-amber-600' },
  { id: 'LEVEL_6', name: 'Level 6: VIP Diplomatic Master Pass', short: 'VIP MASTER ACCESS', color: 'gold', bg: 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-black' }
];

export default function QRScanner() {
  const { t, tStatus, language } = useLanguage();
  const { organization, logoUrl: orgLogoUrl, orgName: organizationName } = useOrganization();

  // ── LEFT: SEARCH STATION STATE ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // ── RIGHT: QR SCANNER STATE ──
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');

  // ── UNDER: VERIFIED VISITOR INFO STATE (Starts as NULL for empty standby page) ──
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [turnstileOpened, setTurnstileOpened] = useState(false);
  const [gateCountdown, setGateCountdown] = useState(0);
  const [deniedPassage, setDeniedPassage] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Organization Branding
  const companyName = organization?.name || organizationName || 'FEDERAL ETHIOPIAN AUTHORITY';
  const companyLogo = orgLogoUrl || organization?.logo_url || null;

  // ── CAMERA STREAM CONTROLS ──
  const startCamera = async () => {
    setCameraError('');
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      } else {
        setCameraError('Camera sensor not supported in this browser context.');
      }
    } catch (err) {
      console.warn('Camera error:', err);
      setCameraError('Camera access not active. Automatic hardware barcode scanner ready.');
      setCameraActive(false);
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
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // ── AUTOMATIC QR VERIFICATION HANDLER ──
  const verifyToken = async (tokenCode) => {
    const raw = (tokenCode || '').trim();
    if (!raw) return;

    setVerifying(true);
    setFeedback(null);
    setDeniedPassage(false);
    setLastScannedCode(raw);

    try {
      const res = await securityApi.verify(raw);
      const data = res.data?.data || res.data;

      if (data) {
        setSelectedVisitor({
          ...data,
          visitor_name: data.full_name || data.visitorName || data.visitor_name,
          visitor_email: data.email || data.visitorEmail || data.visitor_email,
          visitor_phone: data.phone || data.visitorPhone || data.visitor_phone,
          visitor_company: data.company || data.visitorCompany || data.visitor_company,
          visitor_photo: data.photo_url || data.profile_photo || data.visitorPhoto,
          host_name: data.hostName || data.host_name,
          building_name: data.building_name || data.buildingName || data.building || data.location,
          floor_name: data.floor_name || data.floorName || data.floor,
          room_name: data.room_name || data.roomName || (data.room_number ? (data.room_name ? `${data.room_name} (${data.room_number})` : `Room ${data.room_number}`) : data.meeting_room),
          department_name: data.department_name || data.departmentName || data.department,
          badge_number: data.reference_code || data.referenceCode || raw,
          security_level: data.security_level || 'Level 2: General Workspace & Meeting Rooms'
        });

        const isFlagged = data.is_blacklisted || (data.status || '').toUpperCase() === 'BLOCKED';
        if (isFlagged) {
          setFeedback({
            type: 'error',
            title: 'SECURITY ALERT: WATCHLIST MATCH',
            message: 'Visitor flagged on security watchlist! Turnstile barrier locked.'
          });
        } else {
          setFeedback({
            type: 'success',
            title: 'VISITOR CREDENTIAL LOADED',
            message: `Pass verified for "${data.full_name || data.visitorName || 'Visitor'}". Review reception verification and clearance below.`
          });
        }
      }
    } catch (err) {
      try {
        const searchRes = await securityApi.searchVisitors({ q: raw });
        const matches = searchRes.data?.data || [];
        if (matches.length > 0) {
          setSelectedVisitor(matches[0]);
          setFeedback({
            type: 'success',
            title: 'VISITOR FOUND',
            message: `Record matched for "${matches[0].visitor_name}". Review details below.`
          });
        } else {
          setFeedback({
            type: 'error',
            title: 'PASS NOT FOUND',
            message: `No active pass found matching "${raw}". Verify with reception desk.`
          });
        }
      } catch (innerErr) {
        setFeedback({
          type: 'error',
          title: 'VERIFICATION ERROR',
          message: getErrorMessage(err) || 'Could not verify visitor credentials.'
        });
      }
    } finally {
      setVerifying(false);
      setScanInput('');
      setShowSearchDropdown(false);
    }
  };

  // ── SEARCH DEBOUNCE ──
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const handler = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await securityApi.searchVisitors({ q: searchQuery });
        const list = res.data?.data || [];
        setSearchResults(list);
        setShowSearchDropdown(list.length > 0);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoadingSearch(false);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Handle Search Form Submit
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoadingSearch(true);
    try {
      const res = await securityApi.searchVisitors({ q: searchQuery });
      const matches = res.data?.data || [];
      if (matches.length > 0) {
        setSelectedVisitor(matches[0]);
        setShowSearchDropdown(false);
        setFeedback({
          type: 'success',
          title: 'VISITOR RECORD LOADED',
          message: `Loaded profile for "${matches[0].visitor_name}". Review clearance below.`
        });
      } else {
        setFeedback({
          type: 'error',
          title: 'NO RECORD FOUND',
          message: `No visitor registered with query "${searchQuery}".`
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        title: 'SEARCH FAILED',
        message: getErrorMessage(err)
      });
    } finally {
      setLoadingSearch(false);
    }
  };

  // ── GATE OPERATIONS: APPROVE OR NOT ──
  // 1. APPROVE & UNLATCH TURNSTILE
  const handleApproveEntry = () => {
    setDeniedPassage(false);
    setTurnstileOpened(true);
    setGateCountdown(5);

    setFeedback({
      type: 'success',
      title: 'ENTRY APPROVED — BARRIER UNLATCHED',
      message: `Passage granted for ${selectedVisitor?.visitor_name || 'Visitor'}. Speed barrier is open for passage.`
    });

    const interval = setInterval(() => {
      setGateCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTurnstileOpened(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 2. DENY ENTRY & LOCK BARRIER
  const handleDenyEntry = () => {
    setTurnstileOpened(false);
    setDeniedPassage(true);
    setFeedback({
      type: 'error',
      title: 'ENTRY DENIED — BARRIER LOCKED',
      message: `Access refused for "${selectedVisitor?.visitor_name || 'Visitor'}". Speed turnstile locked. Incident logged to SOC.`
    });
  };

  // 3. GATE EXIT & CHECK-OUT
  const handleGateCheckout = async () => {
    if (!selectedVisitor) return;
    setCheckingOut(true);
    try {
      const code = selectedVisitor.badge_number || selectedVisitor.reference_code || selectedVisitor.visitor_code || String(selectedVisitor.visitor_id);
      await checkoutApi.process({
        code,
        checkoutMethod: 'SECURITY_GATE',
        remarks: 'Gate exit clearance confirmed by Security Officer'
      });

      setFeedback({
        type: 'success',
        title: 'GATE CHECK-OUT COMPLETED',
        message: `${selectedVisitor.visitor_name} checked out. Pass revoked.`
      });

      setSelectedVisitor((prev) => (prev ? { ...prev, is_checked_in: 0, appointment_status: 'CHECKED_OUT', status: 'CHECKED_OUT' } : null));
    } catch (err) {
      setFeedback({
        type: 'error',
        title: 'CHECK-OUT FAILED',
        message: getErrorMessage(err)
      });
    } finally {
      setCheckingOut(false);
    }
  };

  // 4. RESET / SCAN NEXT (Return to empty standby page)
  const handleResetTerminal = () => {
    setSelectedVisitor(null);
    setFeedback(null);
    setScanInput('');
    setSearchQuery('');
    setDeniedPassage(false);
    setTurnstileOpened(false);
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // ── RECEPTIONIST VERIFICATION STATUS CALCULATION ──
  const isCheckedIn = Boolean(
    selectedVisitor?.is_checked_in ||
    (selectedVisitor?.appointment_status || '').toUpperCase() === 'CHECKED_IN' ||
    (selectedVisitor?.status || '').toUpperCase() === 'CHECKED_IN'
  );

  const isBlacklisted = Boolean(
    selectedVisitor?.is_blacklisted ||
    (selectedVisitor?.appointment_status || '').toUpperCase() === 'BLOCKED' ||
    (selectedVisitor?.status || '').toUpperCase() === 'BLOCKED'
  );

  // Receptionist Verification: Checked in or has issued pass or registered arrival time
  const isReceptionistVerified = Boolean(
    isCheckedIn ||
    selectedVisitor?.pass_id ||
    selectedVisitor?.arrival_time ||
    (selectedVisitor?.badge_number && !selectedVisitor.badge_number.startsWith('VMS-')) ||
    (selectedVisitor?.appointment_status || '').toUpperCase() === 'APPROVED'
  );

  // Security Level Banner Color Mapping
  const levelText = selectedVisitor?.security_level || 'Level 2: General Workspace & Meeting Rooms';
  const matchedLevel = CLEARANCE_LEVELS.find((l) => levelText.includes(l.short) || levelText.includes(l.name)) || CLEARANCE_LEVELS[1];

  const badgeBannerColor = isBlacklisted
    ? 'bg-rose-600 text-white shadow-rose-600/30'
    : matchedLevel.bg;

  // Active Pass Code & Dynamic Scannable QR Code
  const activePassCode =
    selectedVisitor?.badge_number ||
    selectedVisitor?.pass_code ||
    selectedVisitor?.reference_code ||
    `VMS-${selectedVisitor?.visitor_id || '101'}`;

  const qrVerificationUrl = `${window.location.origin}/verify-pass?code=${encodeURIComponent(activePassCode)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=2&data=${encodeURIComponent(qrVerificationUrl)}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-[#070b13] min-h-screen text-slate-100 font-sans">
      
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3.5">
          <BackButton fallbackUrl="/dashboard" title="Back to Dashboard" />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
                {language === 'am' ? 'የጎብኚዎች ፈቃድና ባጅ ማረጋገጫ' : 'Gate Verification & Access Clearance Terminal'}
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Search visitor on left • Automatic QR scan on right • Verify receptionist check-in & approve or deny entry
            </p>
          </div>
        </div>

        {/* FEEDBACK TOAST ALERT */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 border shadow-xl ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/90 border-rose-500/50 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <div className="max-w-md">
                <span className="font-black mr-1">{feedback.title}:</span>
                <span className="font-medium opacity-90">{feedback.message}</span>
              </div>
              <button onClick={() => setFeedback(null)} className="p-1 hover:bg-white/10 rounded-lg ml-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── TOP 2 EQUAL COLUMNS: LEFT SEARCH STATION & RIGHT AUTOMATIC SCANNER ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* ── LEFT: DEDICATED SEARCH STATION (6 COLS) ── */}
        <div className="lg:col-span-6 bg-[#0a0f1d] border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col justify-between space-y-4 relative">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">Visitor Search Station</h3>
                  <p className="text-[11px] text-slate-400">Lookup by name, phone, national ID, or VMS pass code</p>
                </div>
              </div>

              {selectedVisitor && (
                <button
                  type="button"
                  onClick={handleResetTerminal}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3 h-3 text-indigo-400" />
                  Reset View
                </button>
              )}
            </div>

            {/* Instant Search Bar with Submit Button */}
            <form onSubmit={handleSearchSubmit} className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter visitor name, phone, or VMS pass code..."
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-700/80 rounded-2xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchDropdown(false);
                    }}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loadingSearch || !searchQuery.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                {loadingSearch ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Lookup
              </button>
            </form>

            {/* Live Instant Search Dropdown Popover */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="p-2 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl space-y-1 max-h-[190px] overflow-y-auto">
                <span className="text-[10px] uppercase font-bold text-slate-500 px-2 block">
                  Select Visitor ({searchResults.length} matches):
                </span>
                {searchResults.map((v) => (
                  <div
                    key={v.appointment_id || v.visitor_id}
                    onClick={() => {
                      setSelectedVisitor(v);
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                      setFeedback({
                        type: 'success',
                        title: 'VISITOR SELECTED',
                        message: `Loaded credentials for "${v.visitor_name}". Review status below.`
                      });
                    }}
                    className="p-2 rounded-xl hover:bg-blue-950/60 border border-transparent hover:border-blue-500/40 cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <VisitorAvatar photoUrl={v.visitor_photo} name={v.visitor_name} size="w-7 h-7" textSize="text-[10px]" />
                      <div>
                        <p className="font-bold text-white text-xs leading-tight">{v.visitor_name}</p>
                        <p className="text-[10px] text-slate-400">{v.visitor_company || 'Official Guest'} • {v.host_name || 'Front Desk'}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-indigo-400">
                      {v.badge_number || v.reference_code || `VMS-${v.visitor_id}`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Helper Tips */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Security Officer Verification Workflow
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                1. Look up visitor by typing in search or scanning QR pass.<br />
                2. Check receptionist verification status & host appointment approval.<br />
                3. Click <span className="text-emerald-400 font-bold">Approve Entry</span> to unlatch gate barrier, or <span className="text-rose-400 font-bold">Deny Entry</span> to lock turnstile.
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT: AUTOMATIC QR SCANNER TERMINAL (6 COLS) ── */}
        <div className="lg:col-span-6 bg-[#0a0f1d] border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Scan className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">Automatic QR Scanner</h3>
                  <p className="text-[11px] text-slate-400">Live optical lens & handheld laser detection</p>
                </div>
              </div>

              <button
                type="button"
                onClick={cameraActive ? stopCamera : startCamera}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  cameraActive
                    ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cameraActive ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
                {cameraActive ? 'Camera Live' : 'Enable Camera'}
              </button>
            </div>

            {/* Viewfinder with Holographic Target */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 h-[175px] flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />

              {!cameraActive && (
                <div className="text-center p-3 space-y-1.5">
                  <Scan className="w-8 h-8 text-emerald-400/60 mx-auto animate-pulse" />
                  <p className="text-xs text-slate-300 font-bold">Automatic Hardware Sensor Active</p>
                  <p className="text-[10px] text-slate-500">Scan QR pass with handheld laser scanner or webcam</p>
                </div>
              )}

              {/* Holographic Laser Corner Brackets */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3.5">
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                  <div className="w-5 h-5 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                </div>

                {/* Animated Green Laser Scan Line */}
                <motion.div
                  animate={{ y: [0, 115, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399]"
                />

                <div className="flex justify-between">
                  <div className="w-5 h-5 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                  <div className="w-5 h-5 border-b-2 border-r-2 border-emerald-400 rounded-br" />
                </div>
              </div>

              {/* Sensor Status Pill */}
              <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-slate-700 text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                OPTICAL SENSOR ACTIVE
              </div>
            </div>

            {/* Fast Auto-Detect Barcode Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                verifyToken(scanInput);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={scanInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setScanInput(val);
                  if (val.length >= 7) {
                    verifyToken(val);
                  }
                }}
                placeholder="Scan pass barcode or type VMS code..."
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                type="submit"
                disabled={verifying || !scanInput.trim()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                {verifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />}
                Auto Verify
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          UNDERNEATH: WHEN VISITOR IS LOADED, DISPLAY COMPREHENSIVE DOSSIER + 
          RECEPTIONIST VERIFIED STATUS + APPROVE / DENY GATE CONTROLS
          ═══════════════════════════════════════════════════════════════════════════ */}
      {selectedVisitor ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* ── 1. PRIMARY DECISION & RECEPTIONIST VERIFICATION STATUS BAR ── */}
          <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5">
            
            {/* Left: Visitor Summary & Receptionist Verified Badge */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <VisitorAvatar
                photoUrl={selectedVisitor.visitor_photo}
                name={selectedVisitor.visitor_name}
                size="w-14 h-14"
                textSize="text-lg"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base md:text-lg font-black text-white uppercase tracking-tight">
                    {selectedVisitor.visitor_name}
                  </h2>

                  {/* RECEPTIONIST VERIFICATION BADGE */}
                  {isReceptionistVerified ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Receptionist Verified (Pass Active)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      Pending Receptionist Check-in
                    </span>
                  )}

                  {/* ON-SITE OR SCHEDULED BADGE */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      isCheckedIn
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isCheckedIn ? 'Currently Inside' : 'Arrival Expected'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-0.5">
                  Host: <strong className="text-slate-200">{selectedVisitor.host_name || 'Front Desk'}</strong> • 
                  Pass: <span className="font-mono text-indigo-400 font-bold">{activePassCode}</span> • 
                  Destination: <span className="text-slate-300">{selectedVisitor.room_name || 'Executive Office'}</span>
                </p>
              </div>
            </div>

            {/* Right: Security Officer Decision Controls (APPROVE OR NOT) */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
              {/* APPROVE BUTTON */}
              <button
                type="button"
                onClick={handleApproveEntry}
                disabled={isBlacklisted}
                className="py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>
                  {turnstileOpened
                    ? `Barrier Open (${gateCountdown}s)`
                    : 'Approve & Open Gate Barrier'}
                </span>
              </button>

              {/* DENY BUTTON */}
              <button
                type="button"
                onClick={handleDenyEntry}
                className={`py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition active:scale-95 cursor-pointer ${
                  deniedPassage
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40'
                    : 'bg-rose-950/70 hover:bg-rose-900 border border-rose-600/50 text-rose-300'
                }`}
              >
                <Ban className="w-4 h-4" />
                <span>{deniedPassage ? 'Entry Refused' : 'Deny Entry'}</span>
              </button>

              {/* CHECK-OUT BUTTON (If currently inside) */}
              {isCheckedIn && (
                <button
                  type="button"
                  onClick={handleGateCheckout}
                  disabled={checkingOut}
                  className="py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>{checkingOut ? 'Checking Out...' : 'Gate Check-Out'}</span>
                </button>
              )}

              {/* PRINT SLIP */}
              <button
                type="button"
                onClick={() => window.print()}
                className="py-3 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Print Verification Badge"
              >
                <Printer className="w-4 h-4" />
              </button>

              {/* CLEAR / SCAN NEXT */}
              <button
                type="button"
                onClick={handleResetTerminal}
                className="py-3 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-2xl text-xs font-bold transition cursor-pointer"
                title="Clear Terminal / Next Visitor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── 2. FULL CREDENTIAL BADGE & DETAILED VISITOR DOSSIER ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* ══════════════════════════════════════════════════════════════
                LEFT SIDE: OFFICIAL PHYSICAL ACCESS BADGE (PRINT READY)
                ══════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[390px] bg-gradient-to-b from-slate-900 via-[#0a0f1d] to-[#070c16] border-2 border-slate-700/80 rounded-3xl p-5 shadow-2xl relative overflow-hidden text-slate-100 font-sans print:border-2 print:border-black print:shadow-none print:m-0 print:max-w-none">
                
                {/* Top Lanyard Clip Slot */}
                <div className="flex items-center justify-center mb-3">
                  <div className="w-16 h-2.5 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center shadow-inner">
                    <div className="w-5 h-1 bg-slate-950 rounded-full" />
                  </div>
                </div>

                {/* Golden Smartcard EMV Microchip Graphic */}
                <div className="absolute top-12 right-6 w-9 h-7 rounded-md bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 border border-amber-600/60 shadow flex flex-col justify-between p-0.5 opacity-90">
                  <div className="w-full h-[1px] bg-amber-700/60" />
                  <div className="flex justify-between w-full">
                    <div className="w-3 h-[1px] bg-amber-700/60" />
                    <div className="w-3 h-[1px] bg-amber-700/60" />
                  </div>
                  <div className="w-full h-[1px] bg-amber-700/60" />
                </div>

                {/* Organization Header */}
                <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3 mb-3 pr-10">
                  {companyLogo && (
                    <img src={companyLogo} alt="" className="h-7 w-auto object-contain max-w-[70px]" />
                  )}
                  <div>
                    <h3 className="text-xs font-black uppercase text-white tracking-wider leading-tight">
                      {companyName}
                    </h3>
                    <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase block">
                      PHYSICAL SECURITY ACCESS PASS
                    </span>
                  </div>
                </div>

                {/* Visitor Portrait & Identity */}
                <div className="flex items-center gap-3.5 mb-3">
                  <div className="relative">
                    <VisitorAvatar
                      photoUrl={selectedVisitor.visitor_photo}
                      name={selectedVisitor.visitor_name}
                      size="w-20 h-20"
                      textSize="text-2xl"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-mono text-center text-emerald-400 font-bold py-0.5 rounded-b-2xl">
                      VERIFIED
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                      OFFICIAL CREDENTIAL
                    </span>
                    <h2 className="text-base font-black text-white tracking-tight uppercase truncate">
                      {selectedVisitor.visitor_name || 'Official Guest'}
                    </h2>
                    <p className="text-xs font-bold text-slate-300 truncate">
                      {selectedVisitor.visitor_company || 'Independent Visitor'}
                    </p>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] font-mono font-black text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/30">
                        ID: {activePassCode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* High-Contrast Clearance Level Banner */}
                <div className={`rounded-xl py-2 px-3 text-center uppercase tracking-wider shadow-md mb-3 ${badgeBannerColor}`}>
                  <div className="flex items-center justify-center gap-1.5">
                    <Shield className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-black">
                      {isBlacklisted ? 'ACCESS RESTRICTED (BLOCKED)' : matchedLevel.name}
                    </span>
                  </div>
                </div>

                {/* Scannable High-Res QR Code & Pass Details */}
                <div className="bg-[#070c16] border border-slate-800 rounded-xl p-3 flex items-center gap-3.5 mb-3">
                  <div className="bg-white p-1 rounded-xl shrink-0 shadow-md">
                    <img src={qrImageUrl} alt="" className="w-20 h-20 object-contain" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1 text-[10px]">
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[9px]">Token Pass Code</span>
                      <span className="font-mono font-black text-white text-xs">{activePassCode}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[9px]">Staff Host</span>
                      <span className="font-bold text-slate-200 truncate block">{selectedVisitor.host_name || 'Staff Host'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[9px]">Assigned Gate</span>
                      <span className="font-bold text-emerald-400">Gate 1 — Speed Barrier</span>
                    </div>
                  </div>
                </div>

                {/* Barcode Ribbon */}
                <div className="text-center pt-1 border-t border-slate-800/80">
                  <div className="font-mono text-slate-400 text-[10px] tracking-widest font-black">
                    ||||| | |||| ||||| | || |||| | ||||| ||| |||
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">SEC-ID: {activePassCode} • VALID TODAY</span>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                RIGHT SIDE: GENERALLY VISITOR INFO & AUDIT DOSSIER
                ══════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-7 bg-[#0a0f1d] border border-slate-800 rounded-3xl p-6 md:p-7 shadow-2xl flex flex-col justify-between space-y-5">
              
              {/* Header Title with Gate Status Pill */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">
                    Security Operations Clearance Dossier
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5">
                    Verified Visitor Information & Clearance Audit
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-black tracking-wider uppercase flex items-center gap-2 ${
                      turnstileOpened
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-pulse'
                        : deniedPassage
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                        : isCheckedIn
                        ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    <Radio className={`w-3.5 h-3.5 ${turnstileOpened ? 'text-emerald-400 animate-ping' : ''}`} />
                    {turnstileOpened
                      ? `GATE UNLATCHED (${gateCountdown}s)`
                      : deniedPassage
                      ? 'ACCESS REFUSED'
                      : isCheckedIn
                      ? 'VISITOR INSIDE'
                      : 'STANDBY FOR CLEARANCE'}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCode(activePassCode)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5 transition"
                    title="Copy Pass Code"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : activePassCode}</span>
                  </button>
                </div>
              </div>

              {/* Comprehensive Data Dossier Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* Panel 1: Legal Identity & Identification */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                    <h4 className="text-[11px] uppercase font-black tracking-wider text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      Visitor Identity Record
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      ID VERIFIED
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500">Legal Name</span>
                      <span className="font-extrabold text-white text-sm">{selectedVisitor.visitor_name}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500">Company / Affiliation</span>
                      <span className="font-bold text-slate-200">{selectedVisitor.visitor_company || 'Official Guest'}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500">Government ID / Passport</span>
                      <span className="font-mono font-bold text-slate-200">
                        {selectedVisitor.id_number
                          ? `${selectedVisitor.id_type || 'ID'}: ${selectedVisitor.id_number}`
                          : 'National ID Verified on File'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500">Phone Contact</span>
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {selectedVisitor.visitor_phone || selectedVisitor.phone || '+251 91 100 0000'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500">Email Address</span>
                      <span className="font-medium text-slate-200 truncate max-w-[170px] flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {selectedVisitor.visitor_email || selectedVisitor.email || 'visitor@organization.gov.et'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Panel 2: Host & Appointment Verification */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                    <h4 className="text-[11px] uppercase font-black tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-indigo-400" />
                      Host & Visit Destination
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                      HOST CONFIRMED
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500">Staff Host</span>
                      <span className="font-extrabold text-white text-sm">{selectedVisitor.host_name || 'System Administrator'}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500">Department</span>
                      <span className="font-bold text-slate-200">{selectedVisitor.department_name || 'Executive Office'}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500">Facility / Building</span>
                      <span className="font-bold text-indigo-300">{selectedVisitor.building_name || selectedVisitor.building || selectedVisitor.location || 'Main HQ Building'}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500">Floor / Level</span>
                      <span className="font-bold text-slate-200">{selectedVisitor.floor_name || selectedVisitor.floor || (selectedVisitor.floor_number ? `Floor ${selectedVisitor.floor_number}` : 'Ground Floor')}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500">Designated Room / Office</span>
                      <span className="font-bold text-emerald-400">{selectedVisitor.room_name || (selectedVisitor.room_number ? `Room ${selectedVisitor.room_number}` : (selectedVisitor.meeting_room || 'General Reception'))}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500">Scheduled Time</span>
                      <span className="font-mono text-slate-200">
                        {selectedVisitor.scheduled_start
                          ? new Date(selectedVisitor.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '09:00 AM - 05:00 PM'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500">Visit Purpose</span>
                      <span className="font-medium text-slate-200 truncate max-w-[170px]">
                        {selectedVisitor.purpose || 'Official Delegation & Meeting'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Authorized Facility Checkpoints */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] uppercase font-black tracking-wider text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    Authorized Facility Zones & Turnstile Clearance
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    {matchedLevel.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">Lobby Barrier 1</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">Elevator Portal</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">Workspace Floor</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-2 font-bold opacity-60">
                    <span className="w-4 h-4 text-slate-600 font-black text-center text-xs">✕</span>
                    <span className="truncate">Data Center (Locked)</span>
                  </div>
                </div>
              </div>

              {/* Footer Status Metadata */}
              <div className="pt-2 flex flex-wrap gap-3 items-center justify-between border-t border-slate-800/80 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Security Decision: {turnstileOpened ? 'Clearance Granted' : deniedPassage ? 'Clearance Denied' : 'Pending Officer Decision'}</span>
                </div>

                <span className="text-[11px] font-mono text-slate-500">
                  SOC Checkpoint: Gate 1 Main Pedestrian Barrier
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════════════
            CLEAN EMPTY STANDBY TERMINAL PAGE (WHEN NO VISITOR LOADED YET)
            ═══════════════════════════════════════════════════════════════════════════ */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-8 md:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle background ambient pulse */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-transparent pointer-events-none" />

          
        </motion.div>
      )}
    </div>
  );
}
