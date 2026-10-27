import React from 'react';

/**
 * Enterprise Ultra-High-Contrast ToggleSwitch Component
 * Designed for immediate, unmistakable ON / OFF clarity in dark & light themes.
 *
 * @param {boolean} checked - Current toggle state (on/off)
 * @param {function} onChange - Callback receiving (newCheckedState: boolean, event)
 * @param {boolean} disabled - Whether toggle is disabled
 * @param {'sm'|'md'|'lg'} size - Switch size (default: 'md')
 * @param {'indigo'|'emerald'|'blue'|'purple'|'cyan'|'amber'|'red'} color - Active accent color theme
 * @param {'employee'|'reception'|'receptionist'|'security'|'manager'|'admin'|'platform'} role - Role-based color preset
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
  className = '',
  id,
  name,
  title
}) {
  const isChecked = Boolean(checked);

  // Role-to-color mapping for consistent brand themes per user role
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

  // Vivid, glowing role color themes for the active ON state
  const colorStyles = {
    indigo: {
      // Employee / Host (Vibrant Indigo)
      activeTrack: 'bg-indigo-600 border-indigo-300 shadow-[0_0_14px_rgba(99,102,241,0.7)]',
      dotColor: '#4f46e5'
    },
    emerald: {
      // Receptionist / Front Desk (Vibrant Emerald)
      activeTrack: 'bg-emerald-500 border-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.7)]',
      dotColor: '#059669'
    },
    blue: {
      // Security Officer (Electric Tactical Blue)
      activeTrack: 'bg-blue-600 border-blue-300 shadow-[0_0_14px_rgba(37,99,235,0.7)]',
      dotColor: '#2563eb'
    },
    purple: {
      // Department Manager (Royal Purple / Executive Violet)
      activeTrack: 'bg-purple-600 border-purple-300 shadow-[0_0_14px_rgba(147,51,234,0.7)]',
      dotColor: '#9333ea'
    },
    cyan: {
      // System Admin / Platform Ops (High-Tech Cyan)
      activeTrack: 'bg-cyan-500 border-cyan-200 shadow-[0_0_14px_rgba(6,182,212,0.7)]',
      dotColor: '#0891b2'
    },
    amber: {
      // Audio Chimes / Warnings (Amber / Gold)
      activeTrack: 'bg-amber-500 border-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.7)]',
      dotColor: '#d97706'
    },
    red: {
      // Emergency Overrides / Lockdown (Crimson Rose)
      activeTrack: 'bg-rose-600 border-rose-300 shadow-[0_0_14px_rgba(225,29,72,0.7)]',
      dotColor: '#e11d48'
    }
  };

  const theme = colorStyles[activeColorKey] || colorStyles.indigo;

  // Ultra-precise geometry ensuring crisp alignment & travel
  const sizeStyles = {
    sm: {
      track: 'w-9 h-5',
      thumb: 'w-3.5 h-3.5',
      translateOn: 'translate-x-4',
      translateOff: 'translate-x-0',
      dot: 'w-1 h-1',
      glyphSize: 'text-[8px]'
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-4 h-4',
      translateOn: 'translate-x-5',
      translateOff: 'translate-x-0',
      dot: 'w-1.5 h-1.5',
      glyphSize: 'text-[9px]'
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-5 h-5',
      translateOn: 'translate-x-7',
      translateOff: 'translate-x-0',
      dot: 'w-2 h-2',
      glyphSize: 'text-[11px]'
    }
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      title={title || (isChecked ? 'Toggle off' : 'Toggle on')}
      id={id}
      name={name}
      className={`relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-all duration-200 ease-in-out border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 select-none ${
        currentSize.track
      } ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'cursor-pointer hover:scale-[1.03] active:scale-95'
      } ${
        isChecked
          ? theme.activeTrack
          : 'bg-slate-700/90 border-slate-500/90 hover:border-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]'
      } ${className}`}
    >
      {/* High-visibility inner ON/OFF indicator glyphs */}
      {isChecked ? (
        <span
          className={`absolute left-1.5 font-black text-white/95 select-none pointer-events-none leading-none ${currentSize.glyphSize}`}
        >
          ON
        </span>
      ) : (
        <span
          className={`absolute right-1.5 font-bold text-slate-300 select-none pointer-events-none leading-none ${currentSize.glyphSize}`}
        >
          OFF
        </span>
      )}

      {/* Guaranteed bright white knob thumb with 3D depth and centered indicator */}
      <span
        aria-hidden="true"
        style={{ backgroundColor: '#ffffff' }}
        className={`pointer-events-none inline-flex items-center justify-center rounded-full border border-slate-200/90 shadow-[0_2px_5px_rgba(0,0,0,0.5)] transform transition-transform duration-200 ease-in-out z-10 ${
          currentSize.thumb
        } ${
          isChecked ? currentSize.translateOn : currentSize.translateOff
        }`}
      >
        {/* Centered micro-dot: colored when ON, muted slate when OFF */}
        <span
          className={`rounded-full transition-colors duration-200 ${currentSize.dot}`}
          style={{
            backgroundColor: isChecked ? theme.dotColor : '#64748b'
          }}
        />
      </span>
    </button>
  );
}

