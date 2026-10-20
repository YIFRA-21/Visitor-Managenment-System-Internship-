/**
 * Enterprise Visitor Management System (VMS)
 * Global Centralized Response Page Component
 * Renders dedicated result screens for all operations, modules, and roles.
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Info,
  ShieldAlert,
  WifiOff,
  ServerCrash,
  FileQuestion,
  FileCheck2,
  Fingerprint,
  CalendarCheck,
  CalendarX,
  QrCode,
  LogIn,
  LogOut,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  RotateCcw,
  LayoutDashboard,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  ShieldBan,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleLanding } from '../../config/routes';
import { RESPONSE_TYPES, RESPONSE_TYPE_CONFIG } from './responseConfig';
import { sanitizeReturnUrl } from './useResponseNavigation';

export default function ResponsePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Extract from state or URL query params (graceful refresh handling)
  const state = location.state || {};
  const queryType = searchParams.get('type');
  const queryTitle = searchParams.get('title');
  const queryMessage = searchParams.get('message');
  const queryRef = searchParams.get('ref');

  const resolvedType = state.type || queryType || RESPONSE_TYPES.SUCCESS;
  const config = RESPONSE_TYPE_CONFIG[resolvedType] || RESPONSE_TYPE_CONFIG[RESPONSE_TYPES.INFO];

  const title = state.title || queryTitle || config.defaultTitle;
  const message = state.message || queryMessage || config.defaultMessage;
  const referenceId = state.referenceId || queryRef || null;
  const entityType = state.entityType || null;
  const entityName = state.entityName || null;
  const moduleName = state.module || null;
  const details = state.details || null;
  const validationErrors = state.validationErrors || [];
  const actionableGuidance = state.actionableGuidance || null;
  const timestamp = state.timestamp || new Date().toLocaleString();

  const userRole = user?.role || 'visitor';
  const roleDashboard = getRoleLanding(userRole, user) || '/dashboard';
  const returnUrl = sanitizeReturnUrl(state.returnUrl, roleDashboard);
  const primaryActionUrl = sanitizeReturnUrl(state.primaryActionUrl || returnUrl, roleDashboard);

  const confirmActionText = state.confirmText || 'Confirm';

  const handleConfirm = () => {
    // Navigate directly back to the initiating page (own page), never to dashboard unless no returnUrl
    const destination = primaryActionUrl || returnUrl;
    if (destination && destination !== '/response' && !destination.startsWith('/response')) {
      navigate(destination, { replace: true });
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(roleDashboard, { replace: true });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [primaryActionUrl, returnUrl]);

  const handleCopyRef = () => {
    if (referenceId) {
      navigator.clipboard.writeText(referenceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Determine appropriate icon for resolved response type
  const renderIcon = () => {
    switch (resolvedType) {
      case RESPONSE_TYPES.SUCCESS:
        return <CheckCircle2 className="w-10 h-10 text-emerald-400" />;
      case RESPONSE_TYPES.ERROR:
      case RESPONSE_TYPES.UNEXPECTED_ERROR:
        return <AlertOctagon className="w-10 h-10 text-rose-500" />;
      case RESPONSE_TYPES.WARNING:
      case RESPONSE_TYPES.DUPLICATE_RECORD:
        return <AlertTriangle className="w-10 h-10 text-amber-400" />;
      case RESPONSE_TYPES.NETWORK_ERROR:
        return <WifiOff className="w-10 h-10 text-rose-400" />;
      case RESPONSE_TYPES.SERVICE_UNAVAILABLE:
        return <ServerCrash className="w-10 h-10 text-rose-500" />;
      case RESPONSE_TYPES.NOT_FOUND:
        return <FileQuestion className="w-10 h-10 text-cyan-400" />;
      case RESPONSE_TYPES.UNAUTHORIZED:
      case RESPONSE_TYPES.SESSION_EXPIRED:
        return <Clock className="w-10 h-10 text-purple-400" />;
      case RESPONSE_TYPES.FORBIDDEN:
      case RESPONSE_TYPES.PERMISSION_DENIED:
        return <ShieldBan className="w-10 h-10 text-red-500" />;
      case RESPONSE_TYPES.FILE_UPLOAD_RESULT:
        return <FileCheck2 className="w-10 h-10 text-teal-400" />;
      case RESPONSE_TYPES.IDENTITY_VERIFICATION_RESULT:
        return <Fingerprint className="w-10 h-10 text-sky-400" />;
      case RESPONSE_TYPES.APPOINTMENT_SUBMISSION_RESULT:
      case RESPONSE_TYPES.APPOINTMENT_APPROVAL_RESULT:
        return <CalendarCheck className="w-10 h-10 text-emerald-400" />;
      case RESPONSE_TYPES.APPOINTMENT_REJECTION_RESULT:
        return <CalendarX className="w-10 h-10 text-rose-400" />;
      case RESPONSE_TYPES.VISITOR_PASS_RESULT:
        return <QrCode className="w-10 h-10 text-emerald-400" />;
      case RESPONSE_TYPES.CHECKIN_RESULT:
        return <LogIn className="w-10 h-10 text-emerald-400" />;
      case RESPONSE_TYPES.CHECKOUT_RESULT:
        return <LogOut className="w-10 h-10 text-cyan-400" />;
      case RESPONSE_TYPES.PASSWORD_UPDATE_RESULT:
      case RESPONSE_TYPES.ACCOUNT_ACTIVATION_RESULT:
        return <KeyRound className="w-10 h-10 text-emerald-400" />;
      case RESPONSE_TYPES.WATCHLIST_RESULT:
        return <ShieldAlert className="w-10 h-10 text-amber-400" />;
      default:
        return <Info className="w-10 h-10 text-sky-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Dynamic ambient background glow */}
      <div className="absolute top-[-25%] left-[-15%] h-[600px] w-[600px] rounded-full bg-emerald-950/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-15%] h-[600px] w-[600px] rounded-full bg-indigo-950/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[20%] h-[500px] w-[500px] rounded-full bg-amber-950/10 blur-[130px] pointer-events-none" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1524_1px,transparent_1px),linear-gradient(to_bottom,#0c1524_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-25 pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full px-6 py-4 border-b border-slate-800/80 bg-[#090e1a]/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-teal-400 to-emerald-500 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-[#090e1a] rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-wider text-white">VMS ENTERPRISE</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                SYSTEM VERIFIED
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Visitor Management & Access Control</p>
          </div>
        </div>

        {/* Ethiopia Accent Ribbon on header */}
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-1.5 rounded-sm bg-emerald-500" title="Integrity" />
          <span className="w-2.5 h-1.5 rounded-sm bg-amber-400" title="Security" />
          <span className="w-2.5 h-1.5 rounded-sm bg-rose-500" title="Verification" />
        </div>
      </header>

      {/* Main Content Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={`w-full max-w-2xl bg-[#0b101b]/95 border ${config.cardBorder} rounded-3xl p-6 sm:p-10 shadow-[0_15px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative overflow-hidden`}
        >
          {/* Top Status Gradient Glow */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${config.gradientTop}`} />

          {/* Header Row: Badge & Timestamp */}
          <div className="flex items-center justify-between mb-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {config.badgeText}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {timestamp}
            </span>
          </div>

          {/* Status Icon Presentation */}
          <div className="flex items-center space-x-5 mb-6">
            <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center shrink-0 ${config.iconBg}`}>
              {renderIcon()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {title}
              </h1>
              {moduleName && (
                <p className="text-xs text-indigo-400 font-semibold tracking-wide uppercase mt-1">
                  Module: {moduleName}
                </p>
              )}
            </div>
          </div>

          {/* Descriptive Message */}
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6 font-normal">
            {message}
          </p>

          {/* Consequential Context Box (Reference ID / Entity) */}
          {(referenceId || entityName || entityType) && (
            <div className="mb-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                {entityType && (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Target {entityType}
                  </span>
                )}
                <div className="text-sm font-semibold text-white">
                  {entityName || 'System Record'}
                </div>
              </div>

              {referenceId && (
                <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400">
                  <span>REF: {referenceId}</span>
                  <button
                    onClick={handleCopyRef}
                    className="text-slate-400 hover:text-white transition-colors p-1"
                    title="Copy Reference"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Validation Errors Breakdown */}
          {validationErrors.length > 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30">
              <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Validation Items Requiring Attention:
              </h4>
              <ul className="space-y-1.5 text-xs text-rose-200/90 list-disc list-inside">
                {validationErrors.map((err, idx) => (
                  <li key={idx} className="leading-snug">{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actionable Guidance Box */}
          {actionableGuidance && (
            <div className="mb-6 p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-200/90 flex items-start space-x-2">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>{actionableGuidance}</span>
            </div>
          )}

          {/* Sanitized Technical Details (Expandable) */}
          {details && (
            <details className="mb-6 group">
              <summary className="cursor-pointer text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-wider flex items-center gap-1 select-none">
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                Technical Diagnostic Info
              </summary>
              <div className="mt-2 p-3 rounded-xl bg-black/60 border border-slate-800 text-[11px] font-mono text-slate-400 overflow-x-auto max-h-32">
                {typeof details === 'object' ? JSON.stringify(details, null, 2) : String(details)}
              </div>
            </details>
          )}

          {/* Action Navigation Buttons - Single Confirm Button */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end">
            <button
              id="response-confirm-btn"
              onClick={handleConfirm}
              className={`w-full sm:w-auto min-w-[140px] px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                config.severity === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25 hover:shadow-rose-600/40'
                  : config.severity === 'warning'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25 hover:shadow-amber-600/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 hover:shadow-emerald-600/40'
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{confirmActionText}</span>
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer System Status */}
      <footer className="relative z-10 w-full px-6 py-3 border-t border-slate-800/60 bg-[#090e1a]/60 text-center text-[11px] text-slate-500">
        Enterprise Visitor Management System • Session Secured via TLS 1.3 & JWT Authorization
      </footer>
    </div>
  );
}
