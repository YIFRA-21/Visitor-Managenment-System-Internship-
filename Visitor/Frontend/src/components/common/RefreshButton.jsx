import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
export const RefreshButton = ({ onRefresh, label = 'Refresh', showLabel = true, size = 'sm', variant = 'default', tooltip = 'Refresh Data', disabled = false, className = '', autoRefreshInterval, hideToast = false, successMessage = 'Data refreshed successfully.', errorMessage = 'Unable to refresh data. Please try again.' }) => {
    const navigate = useNavigate();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [toast, setToast] = useState(null);
    const triggerToast = useCallback((message, type) => {
        if (hideToast)
            return;
        setToast({ message, type });
        const timer = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(timer);
    }, [hideToast]);
    const handleRefresh = useCallback(async () => {
        if (isRefreshing || disabled)
            return;
        setIsRefreshing(true);
        try {
            await onRefresh();
            triggerToast(successMessage, 'success');
        }
        catch (err) {
            console.error('[Enterprise RefreshButton] Refresh error:', err);
            // Check for authentication / authorization session expiry (401 / 403)
            const statusCode = err?.response?.status || err?.status;
            if (statusCode === 401) {
                triggerToast('Session expired. Redirecting to login...', 'error');
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            }
            else {
                triggerToast(errorMessage, 'error');
            }
        }
        finally {
            setIsRefreshing(false);
        }
    }, [isRefreshing, disabled, onRefresh, triggerToast, successMessage, errorMessage, navigate]);
    // Handle optional periodic auto-refresh if specified
    useEffect(() => {
        if (!autoRefreshInterval || autoRefreshInterval <= 0)
            return;
        const interval = setInterval(() => {
            handleRefresh();
        }, autoRefreshInterval);
        return () => clearInterval(interval);
    }, [autoRefreshInterval, handleRefresh]);
    // Size styling map
    const sizeClasses = {
        xs: 'px-2 py-1 text-[11px] gap-1 rounded-md',
        sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
        md: 'px-4 py-2 text-xs gap-2 rounded-xl',
        lg: 'px-5 py-2.5 text-sm gap-2.5 rounded-xl font-bold'
    };
    const iconSizes = {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18
    };
    // Variant styling map (Compatible with both light & dark enterprise design themes)
    const variantClasses = {
        default: 'vms-btn-refresh',
        outline: 'bg-transparent border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-white shadow-sm',
        primary: 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 border border-indigo-500',
        subtle: 'bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
    };
    return (<>
      <button type="button" onClick={handleRefresh} disabled={isRefreshing || disabled} title={tooltip} aria-label={tooltip || label} aria-live="polite" aria-busy={isRefreshing} className={`inline-flex items-center justify-center font-bold tracking-tight transition-all duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
        <RefreshCw size={iconSizes[size]} className={`shrink-0 transition-transform duration-300 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`}/>
        {showLabel && (<span className="whitespace-nowrap">
            {isRefreshing ? 'Refreshing...' : label}
          </span>)}
      </button>

      {/* Floating Interactive Toast Feedback Overlay */}
      {toast && !hideToast && (<div role="status" aria-live="assertive" className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900/95 border ${toast.type === 'success' ? 'border-emerald-500/50 text-emerald-300' : 'border-rose-500/50 text-rose-300'} rounded-xl shadow-2xl text-xs font-semibold backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3`}>
          {toast.type === 'success' ? (<CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0"/>) : (<AlertTriangle className="h-4 w-4 text-rose-400 shrink-0"/>)}
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white text-sm font-bold leading-none focus:outline-none" aria-label="Close notification">
            &times;
          </button>
        </div>)}
    </>);
};
export default RefreshButton;
