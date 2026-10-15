import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
export function useSessionMonitor(options = {}) {
    const { warningMinutesBeforeExpiry = 2, onWarning } = options;
    const { sessionExpiresAt, refreshSession, logout, isSessionExpired } = useAuth();
    const [secondsRemaining, setSecondsRemaining] = useState(null);
    const [isWarningActive, setIsWarningActive] = useState(false);
    useEffect(() => {
        if (!sessionExpiresAt) {
            setSecondsRemaining(null);
            setIsWarningActive(false);
            return;
        }
        const interval = setInterval(() => {
            const now = Date.now();
            const remainingMs = sessionExpiresAt - now;
            const warningThresholdMs = warningMinutesBeforeExpiry * 60 * 1000;
            if (remainingMs <= 0) {
                setSecondsRemaining(0);
                setIsWarningActive(false);
                logout();
            }
            else if (remainingMs <= warningThresholdMs) {
                const secs = Math.ceil(remainingMs / 1000);
                setSecondsRemaining(secs);
                setIsWarningActive(true);
                if (onWarning) {
                    onWarning(secs);
                }
            }
            else {
                setSecondsRemaining(Math.ceil(remainingMs / 1000));
                setIsWarningActive(false);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [sessionExpiresAt, warningMinutesBeforeExpiry, onWarning, logout]);
    const extendSession = useCallback(async () => {
        const success = await refreshSession();
        if (success) {
            setIsWarningActive(false);
        }
        return success;
    }, [refreshSession]);
    return {
        secondsRemaining,
        isWarningActive,
        isExpired: isSessionExpired(),
        extendSession,
        logout,
    };
}
export default useSessionMonitor;
