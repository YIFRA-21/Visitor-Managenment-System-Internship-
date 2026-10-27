import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InteractiveWidgetCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconBgColor = 'rgba(99, 102, 241, 0.15)',
  iconColor = '#6366f1',
  badge,
  badgeColor,
  onClick,
  className = '',
}) {
  const [hovered, setHovered] = useState(false);
  const accentColor = iconColor || '#6366f1';

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 pl-6 shadow-sm transition-all duration-300 hover:shadow-2xl hover:border-slate-300 dark:hover:border-slate-700 overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Dark Hover Fill Overlay */}
      <div
        style={{
          background: `linear-gradient(135deg, ${accentColor}25 0%, ${accentColor}08 55%, transparent 100%)`,
          opacity: hovered ? 1 : 0,
        }}
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
      />

      {/* SOLID VERTICAL LEFT BAR WITH GLOW & FILL EXPANSION ON HOVER (Admin Dashboard Signature) */}
      <div
        style={{
          backgroundColor: accentColor,
          boxShadow: hovered ? `0 0 18px ${accentColor}` : `0 0 8px ${accentColor}`,
        }}
        className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-2xl transition-all duration-300 group-hover:w-[10px] z-10"
      />

      <div className="flex items-start justify-between relative z-10">
        <div
          className="p-2.5 rounded-xl border transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={{
            backgroundColor: iconBgColor,
            borderColor: `${accentColor}35`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color: accentColor }} />
        </div>
        {badge ? (
          <span
            className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md border font-mono tracking-wider ${
              badgeColor || 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            }`}
          >
            {badge}
          </span>
        ) : onClick ? (
          <span className="text-slate-400 dark:text-slate-500 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-1 relative z-10">
        <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white group-hover:translate-x-1 transition-transform">
          {value}
        </p>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
          {title}
        </p>
        {subtext && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-0.5 group-hover:text-slate-300 transition-colors font-medium">
            {subtext}
          </p>
        )}
      </div>
    </motion.div>
  );
}
