import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * GlobalNotification Component
 *
 * Implements the system-wide notification card matching all project specifications:
 * - Slides smoothly from right to left upon entering
 * - Displays for 10 seconds (default), pausing when hovered and resuming when unhovered
 * - On expiration or dismissal, drops downward inside its container and fades out smoothly (600ms)
 * - Manual close (×) button
 * - NO countdown numbers displayed inside the notification
 * - Rounded design, subtle shadow, appropriate icon and color coding:
 *   - Error: Red/pink icon and text
 *   - Success: Green icon and text
 *   - Warning: Yellow/orange icon and text
 *   - Information: Blue icon and text
 */
export default function GlobalNotification({
  notification,
  onClose,
  duration = 10,
  className = ''
}) {
  const totalMs = (notification?.duration || duration) * 1000;
  const [remainingMs, setRemainingMs] = useState(totalMs);
  const [isHovered, setIsHovered] = useState(false);
  const lastTickRef = useRef(Date.now());
  const hasTriggeredCloseRef = useRef(false);

  const type = notification?.type || 'info';

  const handleDismiss = useCallback(() => {
    if (hasTriggeredCloseRef.current) return;
    hasTriggeredCloseRef.current = true;
    if (onClose) {
      onClose(notification?.id);
    }
  }, [onClose, notification?.id]);

  // High-frequency countdown loop with pause-on-hover capability
  useEffect(() => {
    if (!notification) return;

    lastTickRef.current = Date.now();
    hasTriggeredCloseRef.current = false;

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      // Only count down if not hovered
      if (!isHovered) {
        setRemainingMs((prev) => {
          const next = prev - delta;
          if (next <= 0) {
            clearInterval(interval);
            handleDismiss();
            return 0;
          }
          return next;
        });
      }
    }, 33); // ~30fps for silky smooth progress bar without CPU overhead

    return () => clearInterval(interval);
  }, [notification, isHovered, handleDismiss]);

  if (!notification) return null;

  const progressPercent = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));

  // Theming configuration strictly matching specifications
  const themeMap = {
    success: {
      containerBg: 'bg-slate-950/95 border-emerald-500/40 text-emerald-100 shadow-emerald-950/30 ring-1 ring-emerald-500/20',
      iconContainer: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      progressBar: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400',
      progressBarGlow: 'shadow-[0_0_8px_rgba(16,185,129,0.5)]',
      textColor: 'text-emerald-200',
      titleColor: 'text-emerald-400',
      closeBtn: 'hover:text-emerald-100 hover:bg-emerald-500/20 text-emerald-400/80',
      accentGlow: 'bg-emerald-500/10'
    },
    error: {
      containerBg: 'bg-slate-950/95 border-rose-500/40 text-rose-100 shadow-rose-950/30 ring-1 ring-rose-500/20',
      iconContainer: 'bg-rose-500/20 text-rose-400 border border-rose-500/40',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
      progressBar: 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-400',
      progressBarGlow: 'shadow-[0_0_8px_rgba(244,63,94,0.5)]',
      textColor: 'text-rose-200',
      titleColor: 'text-rose-400',
      closeBtn: 'hover:text-rose-100 hover:bg-rose-500/20 text-rose-400/80',
      accentGlow: 'bg-rose-500/10'
    },
    warning: {
      containerBg: 'bg-slate-950/95 border-amber-500/40 text-amber-100 shadow-amber-950/30 ring-1 ring-amber-500/20',
      iconContainer: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      progressBar: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400',
      progressBarGlow: 'shadow-[0_0_8px_rgba(245,158,11,0.5)]',
      textColor: 'text-amber-200',
      titleColor: 'text-amber-400',
      closeBtn: 'hover:text-amber-100 hover:bg-amber-500/20 text-amber-400/80',
      accentGlow: 'bg-amber-500/10'
    },
    info: {
      containerBg: 'bg-slate-950/95 border-blue-500/40 text-blue-100 shadow-blue-950/30 ring-1 ring-blue-500/20',
      iconContainer: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
      icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
      progressBar: 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-400',
      progressBarGlow: 'shadow-[0_0_8px_rgba(59,130,246,0.5)]',
      textColor: 'text-blue-200',
      titleColor: 'text-blue-400',
      closeBtn: 'hover:text-blue-100 hover:bg-blue-500/20 text-blue-400/80',
      accentGlow: 'bg-blue-500/10'
    }
  };

  const theme = themeMap[type] || themeMap.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 90, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{
        opacity: 0,
        y: 35,
        scale: 0.96,
        transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
      }}
      transition={{
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1]
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-shadow select-none group w-full ${theme.containerBg} ${
        isHovered ? 'shadow-[0_20px_40px_-10px_rgba(0,0,0,0.85)] ring-2' : ''
      } ${className}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {/* Background Ambient Glow */}
      <div className={`absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-40 ${theme.accentGlow}`} />

      <div className="flex items-start justify-between gap-3 relative z-10">
        {/* Left: Icon & Notification Content */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={`p-2 rounded-xl shrink-0 mt-0.5 shadow-sm ${theme.iconContainer}`}>
            {theme.icon}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            {notification.title && (
              <h4 className={`text-xs font-black uppercase tracking-wider mb-0.5 ${theme.titleColor}`}>
                {notification.title}
              </h4>
            )}
            <p className={`text-xs font-semibold leading-relaxed break-words ${theme.textColor}`}>
              {notification.message}
            </p>
          </div>
        </div>

        {/* Right: Manual Close Button (×) */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleDismiss}
            className={`p-1.5 rounded-xl transition-all cursor-pointer active:scale-90 ${theme.closeBtn}`}
            title="Dismiss notification"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── ANIMATED DECREASING LOADING BAR (10s Countdown, NO numbers) ── */}
      <div className="absolute left-0 right-0 bottom-0 h-[3px] bg-black/40 overflow-hidden">
        <div
          style={{
            width: `${progressPercent}%`,
            transition: isHovered ? 'none' : 'width 33ms linear'
          }}
          className={`h-full ${theme.progressBar} ${theme.progressBarGlow}`}
        />
      </div>
    </motion.div>
  );
}

GlobalNotification.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
    type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
    title: PropTypes.string,
    duration: PropTypes.number
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  duration: PropTypes.number,
  className: PropTypes.string
};
