import React from 'react';

/**
 * Enterprise ToggleSwitch Component
 * 
 * Standalone, self-contained toggle switch that turns ON/OFF on its own:
 * - When ON: lights up with role-tailored vibrant color, ambient glow, and knob slides to the right.
 * - When OFF: remains neutral dark (no color) with knob on the left.
 * - Clean: does NOT render any external ON / OFF text badges.
 *
 * @param {boolean} checked - Current toggle state (true = on, false = off)
 * @param {function} onChange - Callback receiving (newCheckedState: boolean, event)
 * @param {boolean} disabled - Whether toggle is disabled
 * @param {'sm'|'md'|'lg'} size - Switch size (default: 'md')
 * @param {'indigo'|'emerald'|'blue'|'purple'|'cyan'|'amber'|'red'} color - Custom accent color theme
 * @param {'employee'|'reception'|'receptionist'|'security'|'manager'|'admin'|'system_admin'|'platform'} role - Role preset
 * @param {string} className - Additional CSS wrapper classes
 * @param {string} id - HTML ID
 * @param {string} name - Form field name
 * @param {string} title - Hover title tooltip
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

  // Role-to-color mapping for brand and role consistency across all pages
  const roleColorMap = {
    employee: 'indigo',
    reception: 'emerald',
    receptionist: 'emerald',
    security: 'blue',
    security_officer: 'blue',
    manager: 'purple',
    admin: 'cyan',
    system_admin: 'cyan',
    platform: 'cyan'
  };

  const activeColorKey = color || (role ? roleColorMap[role.toLowerCase()] : null) || 'cyan';

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

  // Vivid role colors when ON (lights up); when OFF it stays neutral dark
  const colorThemes = {
    cyan: {
      bgActive: '#06b6d4',
      borderActive: '#22d3ee',
      glow: '0 0 14px rgba(6, 182, 212, 0.55)',
      className: 'bg-cyan-500 border-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.55)]'
    },
    emerald: {
      bgActive: '#10b981',
      borderActive: '#34d399',
      glow: '0 0 14px rgba(16, 185, 129, 0.55)',
      className: 'bg-emerald-500 border-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.55)]'
    },
    indigo: {
      bgActive: '#6366f1',
      borderActive: '#818cf8',
      glow: '0 0 14px rgba(99, 102, 241, 0.55)',
      className: 'bg-indigo-500 border-indigo-400 shadow-[0_0_14px_rgba(99,102,241,0.55)]'
    },
    blue: {
      bgActive: '#2563eb',
      borderActive: '#60a5fa',
      glow: '0 0 14px rgba(37, 99, 235, 0.55)',
      className: 'bg-blue-600 border-blue-400 shadow-[0_0_14px_rgba(37,99,235,0.55)]'
    },
    purple: {
      bgActive: '#9333ea',
      borderActive: '#c084fc',
      glow: '0 0 14px rgba(147, 51, 234, 0.55)',
      className: 'bg-purple-600 border-purple-400 shadow-[0_0_14px_rgba(147,51,234,0.55)]'
    },
    amber: {
      bgActive: '#f59e0b',
      borderActive: '#fbbf24',
      glow: '0 0 14px rgba(245, 158, 11, 0.55)',
      className: 'bg-amber-500 border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.55)]'
    },
    red: {
      bgActive: '#f43f5e',
      borderActive: '#fb7185',
      glow: '0 0 14px rgba(244, 63, 94, 0.55)',
      className: 'bg-rose-500 border-rose-400 shadow-[0_0_14px_rgba(244,63,94,0.55)]'
    }
  };

  const theme = colorThemes[activeColorKey] || colorThemes.cyan;

  // Exact geometry specs for track and knob travel
  const sizeSpecs = {
    sm: {
      trackWidth: 38,
      trackHeight: 22,
      thumbSize: 18,
      padding: 2,
      travelPx: 16
    },
    md: {
      trackWidth: 46,
      trackHeight: 26,
      thumbSize: 22,
      padding: 2,
      travelPx: 20
    },
    lg: {
      trackWidth: 56,
      trackHeight: 32,
      thumbSize: 26,
      padding: 3,
      travelPx: 24
    }
  };

  const currentSize = sizeSpecs[size] || sizeSpecs.md;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      id={id}
      name={name}
      title={title || (isChecked ? 'Turn OFF' : 'Turn ON')}
      style={{
        width: `${currentSize.trackWidth}px`,
        height: `${currentSize.trackHeight}px`,
        padding: `${currentSize.padding}px`,
        backgroundColor: isChecked ? theme.bgActive : '#1e293b',
        borderColor: isChecked ? theme.borderActive : '#334155',
        boxShadow: isChecked ? theme.glow : 'inset 0 2px 4px rgba(0, 0, 0, 0.35)',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      className={`relative inline-flex shrink-0 items-center rounded-full border select-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'cursor-pointer hover:scale-[1.03] active:scale-95'
      } ${className}`}
    >
      {/* Pure white sliding thumb knob */}
      <span
        aria-hidden="true"
        style={{
          width: `${currentSize.thumbSize}px`,
          height: `${currentSize.thumbSize}px`,
          backgroundColor: '#ffffff',
          borderRadius: '9999px',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0, 0, 0, 0.2)',
          transform: isChecked ? `translateX(${currentSize.travelPx}px)` : 'translateX(0px)',
          transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        className="pointer-events-none inline-block rounded-full"
      />
    </button>
  );
}
