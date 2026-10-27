import React from 'react';

/**
 * Enterprise ToggleSwitch Component
 * High-contrast toggle switch displaying distinct role colors when ON,
 * neutral uncolored styling when OFF, and explicit ON / OFF text status.
 *
 * @param {boolean} checked - Current toggle state (on/off)
 * @param {function} onChange - Callback receiving (newCheckedState: boolean, event)
 * @param {boolean} disabled - Whether toggle is disabled
 * @param {'sm'|'md'|'lg'} size - Switch size (default: 'md')
 * @param {'indigo'|'emerald'|'blue'|'purple'|'cyan'|'amber'|'red'} color - Active accent color theme
 * @param {'employee'|'reception'|'receptionist'|'security'|'manager'|'admin'|'platform'} role - Role-based preset
 * @param {boolean} showText - Whether to display ON / OFF text badge (default: true)
 * @param {string} className - Additional CSS classes
 * @param {string} id - HTML ID
 * @param {string} name - Form field name
 * @param {string} title - Hover title
 */
export default function ToggleSwitch({
  checked = false,
  onChange,
  disabled = false,
  size = 'md',
  color,
  role,
  showText = true,
  className = '',
  id,
  name,
  title
}) {
  const isChecked = Boolean(checked);

  // Automatic role-to-color mapping for brand consistency
  const roleColorMap = {
    employee: 'indigo',
    reception: 'emerald',
    receptionist: 'emerald',
    security: 'blue',
    manager: 'purple',
    admin: 'cyan',
    system_admin: 'cyan',
    platform: 'cyan'
  };

  const activeColorKey = color || (role ? roleColorMap[role.toLowerCase()] : null) || 'indigo';

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

  // Vivid role colors when ON; when OFF it remains neutral (no color)
  const colorStyles = {
    indigo: {
      // Employee / Host
      activeTrack: 'bg-indigo-600 border-indigo-400 shadow-[0_0_14px_rgba(99,102,241,0.6)]',
      activeBadge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_8px_rgba(99,102,241,0.3)]',
      dotColor: '#4f46e5'
    },
    emerald: {
      // Receptionist / Front Desk
      activeTrack: 'bg-emerald-500 border-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.6)]',
      activeBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]',
      dotColor: '#059669'
    },
    blue: {
      // Security Officer
      activeTrack: 'bg-blue-600 border-blue-400 shadow-[0_0_14px_rgba(37,99,235,0.6)]',
      activeBadge: 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-[0_0_8px_rgba(37,99,235,0.3)]',
      dotColor: '#2563eb'
    },
    purple: {
      // Department Manager
      activeTrack: 'bg-purple-600 border-purple-400 shadow-[0_0_14px_rgba(147,51,234,0.6)]',
      activeBadge: 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_8px_rgba(147,51,234,0.3)]',
      dotColor: '#9333ea'
    },
    cyan: {
      // System Admin / Platform Ops
      activeTrack: 'bg-cyan-500 border-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.6)]',
      activeBadge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]',
      dotColor: '#0891b2'
    },
    amber: {
      // Audio Chimes / Warnings
      activeTrack: 'bg-amber-500 border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.6)]',
      activeBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]',
      dotColor: '#d97706'
    },
    red: {
      // Emergency / Overrides
      activeTrack: 'bg-rose-600 border-rose-400 shadow-[0_0_14px_rgba(225,29,72,0.6)]',
      activeBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_8px_rgba(225,29,72,0.3)]',
      dotColor: '#e11d48'
    }
  };

  const theme = colorStyles[activeColorKey] || colorStyles.indigo;

  // Ultra-precise geometry for track, thumb and status badge
  const sizeStyles = {
    sm: {
      track: 'w-9 h-5',
      thumb: 'w-3.5 h-3.5',
      thumbPx: '14px',
      translateOn: 'translate-x-4',
      translateOff: 'translate-x-0',
      dot: 'w-1 h-1',
      badge: 'text-[10px] px-1.5 py-0.5 rounded min-w-[32px]'
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-4 h-4',
      thumbPx: '16px',
      translateOn: 'translate-x-5',
      translateOff: 'translate-x-0',
      dot: 'w-1.5 h-1.5',
      badge: 'text-[11px] px-2 py-0.5 rounded-md min-w-[38px]'
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-5 h-5',
      thumbPx: '20px',
      translateOn: 'translate-x-7',
      translateOff: 'translate-x-0',
      dot: 'w-2 h-2',
      badge: 'text-xs px-2.5 py-1 rounded-lg min-w-[44px]'
    }
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
      onClick={handleClick}
      title={title || (isChecked ? 'Click to toggle OFF' : 'Click to toggle ON')}
    >
      {/* The Toggle Track button */}
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        id={id}
        name={name}
        className={`relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-all duration-200 ease-in-out border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 ${
          currentSize.track
        } ${
          disabled
            ? 'cursor-not-allowed'
            : 'cursor-pointer hover:scale-[1.03] active:scale-95'
        } ${
          isChecked
            ? theme.activeTrack
            : 'bg-slate-850 border-slate-700 hover:border-slate-600 shadow-inner'
        }`}
      >
        {/* Guaranteed bright white knob thumb */}
        <span
          aria-hidden="true"
          style={{
            backgroundColor: '#ffffff',
            minWidth: currentSize.thumbPx,
            minHeight: currentSize.thumbPx
          }}
          className={`vms-switch-knob pointer-events-none inline-flex items-center justify-center rounded-full border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.4)] transform transition-transform duration-200 ease-in-out z-10 ${
            currentSize.thumb
          } ${
            isChecked ? currentSize.translateOn : currentSize.translateOff
          }`}
        >
          {/* Centered micro-dot */}
          <span
            className={`rounded-full transition-colors duration-200 ${currentSize.dot}`}
            style={{
              backgroundColor: isChecked ? theme.dotColor : '#94a3b8'
            }}
          />
        </span>
      </button>

      {/* Clear, High-Contrast Text Status Badge: ON or OFF */}
      {showText && (
        <span
          className={`inline-flex items-center justify-center font-black tracking-wider uppercase text-center transition-all duration-200 border ${
            currentSize.badge
          } ${
            isChecked
              ? theme.activeBadge
              : 'bg-slate-800/90 text-slate-400 border-slate-700/80 hover:text-slate-300'
          }`}
        >
          {isChecked ? 'ON' : 'OFF'}
        </span>
      )}
    </div>
  );
}


