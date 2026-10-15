/**
 * VMS Global Enterprise Design System — Theme Toggle Component
 * ─────────────────────────────────────────────────────────────
 * Instant Dark/Light Theme Switching with smooth transition.
 */
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';
export function ThemeToggle({ className = '', showLabel = false }) {
    const { isDark, toggleTheme } = useTheme();
    return (<button onClick={toggleTheme} className={`vms-btn vms-btn--ghost ${className}`} title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} style={{ padding: showLabel ? '0.5rem 0.875rem' : '0.5rem', borderRadius: '0.5rem' }}>
      {isDark ? (<Moon size={18} style={{ color: '#A5B4FC' }}/>) : (<Sun size={18} style={{ color: '#F59E0B' }}/>)}
      {showLabel && <span style={{ marginLeft: '0.375rem' }}>{isDark ? 'Dark Mode' : 'Light Mode'}</span>}
    </button>);
}
export default ThemeToggle;
