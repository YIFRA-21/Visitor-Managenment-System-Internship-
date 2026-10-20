/**
 * VMS Global Enterprise Design System — Theme Toggle Component
 * ─────────────────────────────────────────────────────────────
 * Instant Dark/Light Theme Switching with smooth transition.
 */
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';

export function ThemeToggle({ className = '', showLabel = false }) {
    const { isDark, toggleTheme } = useTheme();
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`vms-theme-toggle inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 border cursor-pointer select-none active:scale-95 ${
          isDark
            ? 'bg-slate-900/90 hover:bg-slate-800 text-amber-300 border-slate-700/80 shadow-inner hover:border-amber-400/50'
            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm hover:border-slate-400'
        } ${className}`}
        title={isDark ? 'Switch to White (Light) Mode' : 'Switch to Black (Dark) Mode'}
        aria-label={isDark ? 'Switch to White Mode' : 'Switch to Black Mode'}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
        )}
        {showLabel && (
          <span className="text-xs font-semibold ml-2">
            {isDark ? 'White Mode' : 'Black Mode'}
          </span>
        )}
      </button>
    );
}

export default ThemeToggle;
