import React from 'react';
import { motion } from 'framer-motion';

/**
 * Enterprise ToggleSwitch Component
 * Sleek, animated, professional on/off toggle switch.
 * 
 * @param {boolean} checked - Current toggle state (on/off)
 * @param {function} onChange - Callback receiving (newCheckedState: boolean, event)
 * @param {boolean} disabled - Whether toggle is disabled
 * @param {'sm'|'md'|'lg'} size - Switch size (default: 'md')
 * @param {'indigo'|'emerald'|'blue'|'red'|'purple'|'amber'} color - Active accent color theme
 * @param {string} label - Optional label text
 * @param {string} description - Optional description text
 * @param {string} className - Additional CSS classes for container
 * @param {string} id - HTML ID
 * @param {string} name - Form field name
 * @param {string} title - Hover title
 */
export default function ToggleSwitch({
  checked = false,
  onChange,
  disabled = false,
  size = 'md',
  color = 'indigo',
  label = null,
  description = null,
  className = '',
  id,
  name,
  title
}) {
  const isChecked = Boolean(checked);

  const handleClick = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (onChange) {
      onChange(!isChecked, e);
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (onChange) {
        onChange(!isChecked, e);
      }
    }
  };

  // Color variants for the active "ON" state track & inner dot
  const colorStyles = {
    indigo: {
      activeTrack: 'bg-indigo-600 border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.5)]',
      thumbDot: 'bg-indigo-600'
    },
    emerald: {
      activeTrack: 'bg-emerald-500 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]',
      thumbDot: 'bg-emerald-600'
    },
    blue: {
      activeTrack: 'bg-blue-600 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]',
      thumbDot: 'bg-blue-600'
    },
    red: {
      activeTrack: 'bg-rose-600 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.5)]',
      thumbDot: 'bg-rose-600'
    },
    purple: {
      activeTrack: 'bg-purple-600 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.5)]',
      thumbDot: 'bg-purple-600'
    },
    amber: {
      activeTrack: 'bg-amber-500 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]',
      thumbDot: 'bg-amber-600'
    }
  };

  const theme = colorStyles[color] || colorStyles.indigo;

  // Size configurations
  const sizeMap = {
    sm: {
      track: 'w-9 h-5',
      thumb: 'w-4 h-4',
      dot: 'w-1.5 h-1.5',
      translateX: 16
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      dot: 'w-2 h-2',
      translateX: 20
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      dot: 'w-2.5 h-2.5',
      translateX: 26
    }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onClick={handleClick}
      title={title || label || (isChecked ? 'Toggle off' : 'Toggle on')}
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
        checked={isChecked}
        onChange={() => {}}
        disabled={disabled}
        className="sr-only"
        aria-checked={isChecked}
        role="switch"
      />

      {/* Toggle Switch Pill Track */}
      <div
        role="switch"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        aria-checked={isChecked}
        className={`relative rounded-full p-0.5 transition-colors duration-250 ease-in-out border flex items-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shrink-0 ${
          currentSize.track
        } ${
          isChecked
            ? theme.activeTrack
            : 'bg-slate-900 border-slate-700 hover:border-slate-600 shadow-inner'
        }`}
      >
        {/* Animated Thumb Knob */}
        <motion.div
          initial={false}
          animate={{ x: isChecked ? currentSize.translateX : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`rounded-full bg-white shadow-md flex items-center justify-center shrink-0 ${currentSize.thumb}`}
        >
          {/* Micro dot indicator inside knob */}
          <span
            className={`rounded-full transition-colors duration-200 ${currentSize.dot} ${
              isChecked ? theme.thumbDot : 'bg-slate-300'
            }`}
          />
        </motion.div>
      </div>
    </div>
  );
}
