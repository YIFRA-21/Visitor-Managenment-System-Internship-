import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CountdownAlert Component
 *
 * Displays response / notification text with an animated decreasing progress bar (default: 10s).
 * - Decreasing loading bar animates from 100% to 0% over `duration` seconds.
 * - When hovered by mouse: timer and progress bar PAUSE so user has time to read.
 * - When unhovered: timer and progress bar RESUME decreasing.
 * - Auto-removes when countdown reaches 0.
 * - Supports manual close via the "✕" button anytime.
 *
 * @param {Object} props
 * @param {Object|null} props.alert - { type: 'success' | 'error' | 'warning' | 'info', message: string }
 * @param {Function} props.onClose - Callback triggered when dismissed manually or auto-removed
 * @param {number} [props.duration=10] - Countdown duration in seconds (defaults to 10s)
 * @param {string} [props.className=''] - Additional class names
 */
export default function CountdownAlert({
  alert,
  onClose,
  duration = 10,
  className = ''
}) {
  const totalMs = duration * 1000;
  const [remainingMs, setRemainingMs] = useState(totalMs);
  const [isHovered, setIsHovered] = useState(false);
  const lastTickRef = useRef(Date.now());
  const alertIdRef = useRef(null);

  // Reset timer whenever alert message or alert instance changes
  useEffect(() => {
    if (alert) {
      setRemainingMs(totalMs);
      setIsHovered(false);
      lastTickRef.current = Date.now();
      alertIdRef.current = alert.message + (alert.type || '') + Date.now();
    }
  }, [alert?.message, alert?.type, totalMs]);

  // Decreasing countdown loop with pause-on-hover logic
  useEffect(() => {
    if (!alert) return;

    lastTickRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      // Only decrease if NOT hovered
      if (!isHovered) {
        setRemainingMs((prev) => {
          const next = prev - delta;
          if (next <= 0) {
            clearInterval(interval);
            if (onClose) onClose();
            return 0;
          }
          return next;
        });
      }
    }, 40); // 40ms high-frequency tick for silky smooth 60fps decrease

    return () => clearInterval(interval);
  }, [alert, isHovered, onClose]);

  if (!alert) return null;

  const type = alert.type || 'success';
  const progressPercent = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  // Theming configurations
  const themes = {
    success: {
      containerBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />,
      barColor: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400',
      glowShadow: 'shadow-[0_0_10px_rgba(16,185,129,0.5)]',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      closeBtnHover: 'hover:text-emerald-100'
    },
    error: {
      containerBg: 'bg-red-500/10 border-red-500/30 text-red-300',
      icon: <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />,
      barColor: 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-400',
      glowShadow: 'shadow-[0_0_10px_rgba(244,63,94,0.5)]',
      badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
      closeBtnHover: 'hover:text-red-100'
    },
    warning: {
      containerBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      icon: <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />,
      barColor: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400',
      glowShadow: 'shadow-[0_0_10px_rgba(245,158,11,0.5)]',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      closeBtnHover: 'hover:text-amber-100'
    },
    info: {
      containerBg: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
      icon: <Info className="h-4 w-4 text-blue-400 shrink-0" />,
      barColor: 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-400',
      glowShadow: 'shadow-[0_0_10px_rgba(59,130,246,0.5)]',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      closeBtnHover: 'hover:text-blue-100'
    }
  };

  const currentTheme = themes[type] || themes.success;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative overflow-hidden rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all duration-200 select-none ${currentTheme.containerBg} ${
          isHovered ? 'ring-1 ring-white/10 shadow-2xl' : ''
        } ${className}`}
        role="alert"
      >
        <div className="flex items-center justify-between gap-3 relative z-10">
          {/* Left: Icon & Alert Message */}
          <div className="flex items-center space-x-2.5 text-xs font-bold min-w-0 flex-1">
            {currentTheme.icon}
            <span className="truncate sm:whitespace-normal leading-relaxed">{alert.message}</span>
          </div>

          {/* Right: Pause Badge / Countdown Indicator & Manual Close Button */}
          <div className="flex items-center space-x-2 shrink-0">
            {isHovered ? (
              <span
                className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wider animate-pulse ${currentTheme.badgeBg}`}
                title="Countdown is paused while reading"
              >
                <Pause className="w-2.5 h-2.5" />
                <span>Paused ({remainingSeconds}s)</span>
              </span>
            ) : (
              <span
                className="text-[10px] font-mono font-semibold opacity-70 hover:opacity-100 transition-opacity"
                title={`${remainingSeconds}s remaining before auto-close`}
              >
                {remainingSeconds}s
              </span>
            )}

            {/* Manual Close Button */}
            <button
              type="button"
              onClick={onClose}
              className={`p-1 text-xs font-bold opacity-70 hover:opacity-100 transition-all rounded-lg hover:bg-white/10 active:scale-95 ${currentTheme.closeBtnHover}`}
              title="Dismiss message now"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── ANIMATED DECREASING LOADING BAR (10s Countdown) ── */}
        <div className="absolute left-0 right-0 bottom-0 h-[3.5px] bg-black/25 overflow-hidden">
          <div
            style={{
              width: `${progressPercent}%`,
              transition: isHovered ? 'none' : 'width 40ms linear'
            }}
            className={`h-full ${currentTheme.barColor} ${currentTheme.glowShadow}`}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
