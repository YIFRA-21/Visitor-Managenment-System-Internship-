import React from 'react';

/**
 * Enterprise Minimalist ToggleSwitch Component
 * Pure, sleek toggle switch with zero extraneous labels or badges.
 *
 * @param {boolean} checked - Current toggle state (on/off)
 * @param {function} onChange - Callback receiving (newCheckedState: boolean, event)
 * @param {boolean} disabled - Whether toggle is disabled
 * @param {'sm'|'md'|'lg'} size - Switch size (default: 'md')
 * @param {'indigo'|'emerald'|'blue'|'red'|'purple'|'amber'} color - Active accent color theme
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
  color = 'indigo',
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

  // Color variants for active ON state
  const colorStyles = {
    indigo: {
      activeTrack: 'bg-indigo-600 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]'
    },
    emerald: {
      activeTrack: 'bg-emerald-500 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
    },
    blue: {
      activeTrack: 'bg-blue-600 border-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.5)]'
    },
    red: {
      activeTrack: 'bg-rose-600 border-rose-500 shadow-[0_0_12px_rgba(225,29,72,0.5)]'
    },
    purple: {
      activeTrack: 'bg-purple-600 border-purple-500 shadow-[0_0_12px_rgba(147,51,234,0.5)]'
    },
    amber: {
      activeTrack: 'bg-amber-500 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
    }
  };

  const theme = colorStyles[color] || colorStyles.indigo;

  // Track & Thumb geometry (standard Tailwind CSS classes)
  const sizeStyles = {
    sm: {
      track: 'w-9 h-5',
      thumb: 'w-4 h-4',
      translateOn: 'translate-x-4',
      translateOff: 'translate-x-0.5'
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translateOn: 'translate-x-5',
      translateOff: 'translate-x-0.5'
    },
    lg: {
      track: 'w-14 h-8',
      thumb: 'w-7 h-7',
      translateOn: 'translate-x-6',
      translateOff: 'translate-x-0.5'
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
      className={`relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 ${
        currentSize.track
      } ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'cursor-pointer'
      } ${
        isChecked
          ? theme.activeTrack
          : 'bg-slate-800/90 border-slate-700/80 hover:border-slate-600'
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
          currentSize.thumb
        } ${
          isChecked ? currentSize.translateOn : currentSize.translateOff
        }`}
      />
    </button>
  );
}
