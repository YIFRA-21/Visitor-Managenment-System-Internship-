import React from 'react';
import { motion } from 'framer-motion';

/**
 * Enterprise ToggleSwitch Component
 * Replaces generic square checkboxes with sleek, animated, professional on/off toggle switches.
 * 
 * @param {boolean} checked - Current toggle state (on/off)
 * @param {function} onChange - Callback receiving (newCheckedState: boolean, event)
 * @param {boolean} disabled - Whether toggle is disabled
 * @param {'sm'|'md'|'lg'} size - Switch size
 * @param {'indigo'|'emerald'|'blue'|'red'|'purple'|'amber'} color - Active accent color theme
 * @param {boolean} showLabelBadge - Whether to render 'ON' / 'OFF' mini status badge
 * @param {string} label - Optional label text
 * @param {string} description - Optional description text
 * @param {string} className - Additional CSS classes for container
 * @param {string} id - HTML ID
 * @param {string} name - Form field name
 */
export default function ToggleSwitch({
  checked = false,
  onChange,
  disabled = false,
  size = 'md',
  color = 'indigo',
  showLabelBadge = false,
  label = null,
  description = null,
  className = '',
  id,
  name,
  title
}) {
  const handleClick = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (onChange) {
      onChange(!checked, e);
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (onChange) {
        onChange(!checked, e);
      }
    }
  };

  // Color variants for the active "ON" state
  const colorStyles = {
    indigo: {
      activeTrack: 'bg-gradient-to-r from-indigo-500 to-indigo-600 border-indigo-400/50 shadow-[0_0_12px_rgba(99,102,241,0.4)]',
      thumbDot: 'bg-indigo-600',
      badge: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    },
    emerald: {
      activeTrack: 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.4)]',
      thumbDot: 'bg-emerald-600',
      badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    blue: {
      activeTrack: 'bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-400/50 shadow-[0_0_12px_rgba(59,130,246,0.4)]',
      thumbDot: 'bg-blue-600',
      badge: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    red: {
      activeTrack: 'bg-gradient-to-r from-rose-500 to-red-600 border-rose-400/50 shadow-[0_0_12px_rgba(244,63,94,0.4)]',
      thumbDot: 'bg-red-600',
      badge: 'text-red-400 bg-red-500/10 border-red-500/20'
    },
    purple: {
      activeTrack: 'bg-gradient-to-r from-purple-500 to-fuchsia-600 border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.4)]',
      thumbDot: 'bg-purple-600',
      badge: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    },
    amber: {
      activeTrack: 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
      thumbDot: 'bg-amber-600',
      badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    }
  };

  const theme = colorStyles[color] || colorStyles.indigo;

  // Size configurations
  const sizeMap = {
    sm: {
      track: 'w-9 h-5',
      thumb: 'w-3.5 h-3.5',
      translateX: 'translate-x-4',
      badgeText: 'text-[9px]'
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-4.5 h-4.5',
      translateX: 'translate-x-5',
      badgeText: 'text-[10px]'
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-5.5 h-5.5',
      translateX: 'translate-x-7',
      badgeText: 'text-xs'
    }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onClick={handleClick}
      title={title || label || (checked ? 'Toggle off' : 'Toggle on')}
    >
      {(label || description) && (
        <div className="flex-1">
          {label && <span className="font-bold text-white text-xs block">{label}</span>}
          {description && <span className="text-slate-400 text-[11px] block mt-0.5">{description}</span>}
        </div>
      )}

      {/* Hidden checkbox for accessibility & form support */}
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={Boolean(checked)}
        onChange={() => {}}
        disabled={disabled}
        className="sr-only"
        aria-checked={Boolean(checked)}
        role="switch"
      />

      <div className="flex items-center gap-2 shrink-0">
        {showLabelBadge && (
          <span
            className={`font-black uppercase tracking-wider px-1.5 py-0.5 rounded border transition-all ${currentSize.badgeText} ${
              checked ? theme.badge : 'text-slate-500 bg-slate-900 border-slate-800'
            }`}
          >
            {checked ? 'ON' : 'OFF'}
          </span>
        )}

        {/* Toggle Switch Pill Track */}
        <div
          role="switch"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
          aria-checked={Boolean(checked)}
          className={`relative rounded-full p-0.5 transition-all duration-300 ease-in-out border flex items-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
            currentSize.track
          } ${
            checked
              ? theme.activeTrack
              : 'bg-slate-900 border-slate-700/80 hover:border-slate-600 shadow-inner'
          }`}
        >
          {/* Animated Thumb Knob */}
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 600, damping: 35 }}
            className={`rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-200 ${
              currentSize.thumb
            } ${checked ? currentSize.translateX : 'translate-x-0.5'}`}
          >
            {/* Micro dot indicator inside knob */}
            <span
              className={`rounded-full transition-all duration-200 ${
                size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5'
              } ${checked ? theme.thumbDot : 'bg-slate-400'}`}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
