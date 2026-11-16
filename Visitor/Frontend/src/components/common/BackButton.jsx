import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Standard Squircle Back Navigation Button
 * Matches the system-wide visual specification:
 * Dark navy squircle background, subtle border, white left arrow with micro-interaction.
 * Reliably responds across all user roles and prevents getting stuck in routing history loops.
 */
export default function BackButton({ onClick, fallbackUrl = '/dashboard', className = '', title = 'Go back to previous page', ariaLabel = 'Go back to previous page' }) {
    const navigate = useNavigate();
    const { user } = useAuth();

    const resolveRoleDashboard = () => {
        const rawRole = (user?.role || user?.role_name || user?.roleName || '').toLowerCase().trim();
        if (rawRole === 'admin' || rawRole === 'super_admin' || rawRole === 'system_admin') return '/admin/dashboard?view=dashboard';
        if (rawRole === 'manager' || rawRole.includes('manager')) return '/manager/dashboard?view=dashboard';
        if (rawRole === 'receptionist' || rawRole.includes('reception')) return '/reception/dashboard?view=dashboard';
        if (rawRole === 'security' || rawRole.includes('security')) return '/security/dashboard?view=dashboard';
        if (rawRole === 'employee' || rawRole === 'staff') return '/employee/dashboard?view=dashboard';
        return '/visitor/dashboard?view=dashboard';
    };

    const targetFallback = (fallbackUrl === '/dashboard' || fallbackUrl === '/dashboard?view=dashboard')
        ? resolveRoleDashboard()
        : fallbackUrl;

    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) {
            onClick();
            return;
        }

        const currentPath = window.location.pathname + window.location.search;
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
            // Safety timeout: if popping history stayed on the exact same location (trapped loop), forcefully route to targetFallback
            setTimeout(() => {
                if (window.location.pathname + window.location.search === currentPath) {
                    navigate(targetFallback);
                }
            }, 120);
        } else {
            navigate(targetFallback);
        }
    };
    return (<button type="button" onClick={handleClick} title={title} aria-label={ariaLabel} className={`w-10 h-10 rounded-2xl bg-[#0e172e] border border-slate-700/80 hover:border-indigo-500/60 hover:bg-[#15203d] text-white flex items-center justify-center transition-all duration-200 shadow-lg shadow-black/40 hover:scale-105 active:scale-95 group shrink-0 cursor-pointer ${className}`}>
      <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-0.5 transition-transform"/>
    </button>);
}
export { BackButton };
