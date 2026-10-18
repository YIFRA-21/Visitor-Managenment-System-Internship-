import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  ShieldAlert,
  FileQuestion,
  Clock,
  AlertTriangle,
  ArrowLeft,
  RotateCcw,
  Home,
  LogIn
} from 'lucide-react';
import Button from '../Button/Button';

/**
 * Standardized Response Feedback State Component
 * Supports:
 * - 'success': Operation successful
 * - 'error': Operation failed
 * - 'access_denied': Access denied
 * - 'not_found': Record not found
 * - 'session_expired': Session expired
 * - 'upload_failed': Upload or document-processing failure
 */
export default function ResponseFeedbackState({
  type = 'success',
  title,
  description,
  details,
  primaryAction,
  secondaryAction,
  onPrimaryClick,
  onSecondaryClick,
  onRetry,
  className = '',
  fullScreen = false
}) {
  const navigate = useNavigate();

  const configs = {
    success: {
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-400" />,
      borderGlow: 'border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.2)]',
      iconBg: 'bg-emerald-950/30 border-emerald-500/40',
      topLine: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      defaultTitle: 'Operation Successful',
      defaultDesc: 'The requested action was completed successfully.',
      defaultPrimary: 'Back to Dashboard',
      defaultPrimaryAction: () => navigate('/dashboard')
    },
    error: {
      icon: <XCircle className="w-8 h-8 text-rose-500" />,
      borderGlow: 'border-rose-500/30 shadow-[0_0_25px_rgba(244,63,94,0.2)]',
      iconBg: 'bg-rose-950/30 border-rose-500/40',
      topLine: 'bg-gradient-to-r from-rose-500 to-red-600',
      defaultTitle: 'Operation Failed',
      defaultDesc: 'An unexpected issue occurred while processing your request.',
      defaultPrimary: 'Retry Action',
      defaultPrimaryAction: onRetry || (() => window.location.reload())
    },
    access_denied: {
      icon: <ShieldAlert className="w-8 h-8 text-amber-400" />,
      borderGlow: 'border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.2)]',
      iconBg: 'bg-amber-950/30 border-amber-500/40',
      topLine: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      defaultTitle: 'Access Denied',
      defaultDesc: 'Your account does not have permission to view or execute this resource.',
      defaultPrimary: 'Return to Dashboard',
      defaultPrimaryAction: () => navigate('/dashboard')
    },
    not_found: {
      icon: <FileQuestion className="w-8 h-8 text-cyan-400" />,
      borderGlow: 'border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.2)]',
      iconBg: 'bg-cyan-950/30 border-cyan-500/40',
      topLine: 'bg-gradient-to-r from-cyan-500 to-blue-500',
      defaultTitle: 'Record Not Found',
      defaultDesc: 'The requested record or resource could not be located in the system.',
      defaultPrimary: 'Go Back',
      defaultPrimaryAction: () => navigate(-1)
    },
    session_expired: {
      icon: <Clock className="w-8 h-8 text-purple-400" />,
      borderGlow: 'border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.2)]',
      iconBg: 'bg-purple-950/30 border-purple-500/40',
      topLine: 'bg-gradient-to-r from-purple-500 to-indigo-500',
      defaultTitle: 'Session Expired',
      defaultDesc: 'Your security session has timed out. Please sign in again to continue.',
      defaultPrimary: 'Sign In',
      defaultPrimaryAction: () => navigate('/login')
    },
    upload_failed: {
      icon: <AlertTriangle className="w-8 h-8 text-rose-400" />,
      borderGlow: 'border-rose-500/30 shadow-[0_0_25px_rgba(244,63,94,0.2)]',
      iconBg: 'bg-rose-950/30 border-rose-500/40',
      topLine: 'bg-gradient-to-r from-rose-500 to-amber-500',
      defaultTitle: 'Document Upload Failed',
      defaultDesc: 'The document could not be validated or processed. Please verify format and try again.',
      defaultPrimary: 'Retry Upload',
      defaultPrimaryAction: onRetry || (() => window.location.reload())
    }
  };

  const config = configs[type] || configs.error;
  const resolvedTitle = title || config.defaultTitle;
  const resolvedDesc = description || config.defaultDesc;
  const resolvedPrimaryText = primaryAction || config.defaultPrimary;
  const resolvedPrimaryAction = onPrimaryClick || config.defaultPrimaryAction;

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`relative w-full max-w-md mx-auto rounded-2xl bg-[#090e1a]/95 border ${config.borderGlow} p-6 sm:p-8 text-center backdrop-blur-xl overflow-hidden ${className}`}
    >
      {/* Top Status Gradient Accent */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${config.topLine}`} />

      {/* Status Icon */}
      <div className="flex justify-center mb-5">
        <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center ${config.iconBg}`}>
          {config.icon}
        </div>
      </div>

      {/* Headings */}
      <h3 className="text-lg font-bold text-white tracking-wide uppercase">
        {resolvedTitle}
      </h3>
      <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
        {resolvedDesc}
      </p>

      {/* Optional Technical Details snippet */}
      {details && (
        <div className="mt-4 p-3 rounded-lg bg-black/40 border border-slate-800 text-[11px] font-mono text-slate-400 text-left overflow-x-auto max-h-24">
          {details}
        </div>
      )}

      {/* Action Buttons Group */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
        {secondaryAction && (
          <Button
            variant="secondary"
            size="md"
            className="w-full sm:w-auto"
            onClick={onSecondaryClick || (() => navigate('/dashboard'))}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            {secondaryAction}
          </Button>
        )}

        <Button
          variant={type === 'success' ? 'success' : (type === 'error' || type === 'upload_failed' ? 'danger' : 'primary')}
          size="md"
          className="w-full sm:w-auto min-w-[140px]"
          onClick={resolvedPrimaryAction}
          icon={
            type === 'session_expired' ? <LogIn className="w-4 h-4" /> :
            (type === 'error' || type === 'upload_failed') ? <RotateCcw className="w-4 h-4" /> :
            <Home className="w-4 h-4" />
          }
        >
          {resolvedPrimaryText}
        </Button>
      </div>
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b13] p-4 relative overflow-hidden font-sans">
        <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1524_1px,transparent_1px),linear-gradient(to_bottom,#0c1524_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-15 pointer-events-none" />
        <div className="relative z-10 w-full flex justify-center">
          {content}
        </div>
      </div>
    );
  }

  return content;
}

ResponseFeedbackState.propTypes = {
  type: PropTypes.oneOf(['success', 'error', 'access_denied', 'not_found', 'session_expired', 'upload_failed']),
  title: PropTypes.string,
  description: PropTypes.string,
  details: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  primaryAction: PropTypes.string,
  secondaryAction: PropTypes.string,
  onPrimaryClick: PropTypes.func,
  onSecondaryClick: PropTypes.func,
  onRetry: PropTypes.func,
  className: PropTypes.string,
  fullScreen: PropTypes.bool
};
