// Frontend/src/Resource/Manager/components/ExecutiveMetricCard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const USER_DASHBOARD_THEMES = {
  blue: {
    barColor: '#3b82f6',
    hoverBarColor: '#60a5fa',
    darkHoverBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(30, 58, 138, 0.25) 55%, #0a0f1d 100%)',
    textColor: 'text-blue-400',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    activeRing: 'ring-blue-500/50',
  },
  emerald: {
    barColor: '#10b981',
    hoverBarColor: '#34d399',
    darkHoverBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(6, 78, 59, 0.25) 55%, #0a0f1d 100%)',
    textColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    activeRing: 'ring-emerald-500/50',
  },
  amber: {
    barColor: '#f59e0b',
    hoverBarColor: '#fbbf24',
    darkHoverBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(120, 53, 15, 0.25) 55%, #0a0f1d 100%)',
    textColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    activeRing: 'ring-amber-500/50',
  },
  indigo: {
    barColor: '#6366f1',
    hoverBarColor: '#818cf8',
    darkHoverBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(49, 46, 129, 0.25) 55%, #0a0f1d 100%)',
    textColor: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    activeRing: 'ring-indigo-500/50',
  },
  rose: {
    barColor: '#f43f5e',
    hoverBarColor: '#fb7185',
    darkHoverBg: 'linear-gradient(135deg, rgba(244, 63, 94, 0.35) 0%, rgba(136, 19, 55, 0.25) 55%, #0a0f1d 100%)',
    textColor: 'text-rose-400',
    badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    activeRing: 'ring-rose-500/50',
  },
  teal: {
    barColor: '#14b8a6',
    hoverBarColor: '#2dd4bf',
    darkHoverBg: 'linear-gradient(135deg, rgba(20, 184, 166, 0.35) 0%, rgba(19, 78, 74, 0.25) 55%, #0a0f1d 100%)',
    textColor: 'text-teal-400',
    badgeBg: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    activeRing: 'ring-teal-500/50',
  },
  cyan: {
    barColor: '#06b6d4',
    hoverBarColor: '#22d3ee',
    darkHoverBg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.35) 0%, rgba(22, 78, 99, 0.25) 55%, #0a0f1d 100%)',
    textColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    activeRing: 'ring-cyan-500/50',
  },
  purple: {
    barColor: '#a855f7',
    hoverBarColor: '#c084fc',
    darkHoverBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(88, 28, 135, 0.25) 55%, #0a0f1d 100%)',
    textColor: 'text-purple-400',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    activeRing: 'ring-purple-500/50',
  },
  sky: {
    barColor: '#0284c7',
    hoverBarColor: '#38bdf8',
    darkHoverBg: 'linear-gradient(135deg, rgba(2, 132, 199, 0.35) 0%, rgba(120, 53, 15, 0.25) 55%, #0a0f1d 100%)',
    textColor: 'text-sky-400',
    badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    activeRing: 'ring-sky-500/50',
  },
};

export const dashboardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const dashboardItemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 22 },
  },
};

/**
 * AnimatedCounter: smooth 60fps counter animation from 0 to real data count
 */
export function AnimatedCounter({ value, duration = 650 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    if (target === 0) {
      setCount(0);
      return;
    }
    const start = 0;
    const startTime = performance.now();

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * easeOut);
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    const frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span>{count}</span>;
}

/**
 * Executive MetricCard matching Manager Dashboard styling:
 * - Solid glowing vertical left bar with width expansion on hover
 * - Dark hover fill overlay gradient
 * - Sleek vertical oval pill icon capsule container
 * - Responsive typography and 60fps animated counter
 * - Optional badge pill, active filter ring, and subtitle
 */
export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  theme = 'blue',
  onClick,
  badge,
  suffix = '',
  isActive = false,
  className = '',
}) {
  const [hovered, setHovered] = useState(false);
  const styles = USER_DASHBOARD_THEMES[theme] || USER_DASHBOARD_THEMES.blue;

  return (
    <motion.div
      variants={dashboardItemVariants}
      whileHover={{ y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`border rounded-2xl p-4 sm:p-5 pl-5 sm:pl-6 min-h-[140px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden group bg-[#0a0f1d] border-slate-800/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] ${
        onClick ? 'cursor-pointer' : ''
      } ${hovered ? 'shadow-2xl border-slate-700' : ''} ${
        isActive ? `ring-2 ring-offset-2 ring-offset-[#080d16] ${styles.activeRing} border-slate-700` : ''
      } ${className}`}
    >
      {/* Dark Hover Fill Overlay */}
      <div
        style={{
          background: styles.darkHoverBg,
          opacity: hovered || isActive ? 1 : 0,
        }}
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
      />

      {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER */}
      <div
        style={{
          backgroundColor: hovered || isActive ? styles.hoverBarColor : styles.barColor,
          boxShadow: hovered || isActive ? `0 0 20px ${styles.barColor}` : `0 0 8px ${styles.barColor}`,
        }}
        className={`absolute left-0 top-0 bottom-0 ${isActive ? 'w-[10px]' : 'w-[6px]'} rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10`}
      />

      <div className="flex items-start justify-between relative z-10 gap-2">
        <span className="text-[11px] xl:text-xs font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors leading-tight min-w-0 pr-1">
          {title}
        </span>

        {/* Sleek Vertical Oval Pill Icon Capsule Container */}
        <div className="w-8 h-10 sm:w-9 sm:h-11 rounded-full border border-slate-700/80 bg-slate-800/90 flex items-center justify-center text-slate-200 group-hover:scale-110 transition-all shadow-sm shrink-0">
          {icon}
        </div>
      </div>

      <div className="mt-2.5 relative z-10">
        <div className="flex items-baseline space-x-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            <AnimatedCounter value={value} />{suffix}
          </h2>
          {badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${styles.badgeBg}`}>
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className={`text-[11px] sm:text-xs font-semibold mt-1 transition-colors ${styles.textColor} opacity-90 group-hover:opacity-100 truncate`}>
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default MetricCard;
