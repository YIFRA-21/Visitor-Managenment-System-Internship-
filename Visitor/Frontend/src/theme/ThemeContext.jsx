/**
 * VMS Design System — Global Theme Context
 * ──────────────────────────────────────────
 * Dark/Light Enterprise Theme Provider.
 * Persists selected theme in localStorage and updates root CSS tokens instantly.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
const STORAGE_KEY = 'vms_theme';
const ThemeContext = createContext(undefined);
function getInitialTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark')
        return stored;
    return 'dark';
}
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
    document.documentElement.style.colorScheme = theme;
    if (document.body) {
        document.body.setAttribute('data-theme', theme);
        document.body.setAttribute('data-bs-theme', theme);
    }
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body?.classList.add('dark');
        document.documentElement.style.backgroundColor = '#070b13';
        if (document.body) document.body.style.backgroundColor = '#070b13';
    }
    else {
        document.documentElement.classList.remove('dark');
        document.body?.classList.remove('dark');
        document.documentElement.style.backgroundColor = '#f8fafc';
        if (document.body) document.body.style.backgroundColor = '#f8fafc';
    }
}
export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(getInitialTheme);
    useEffect(() => {
        applyTheme(theme);
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                setThemeState(e.matches ? 'dark' : 'light');
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);
    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
    }, []);
    const setTheme = useCallback((newTheme) => {
        setThemeState(newTheme);
    }, []);
    return (<ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>);
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
export default ThemeContext;
