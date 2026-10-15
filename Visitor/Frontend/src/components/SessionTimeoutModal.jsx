import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
export const SessionTimeoutModal = ({ warningMinutesBeforeExpiry = 2, }) => {
    const { sessionExpiresAt, refreshSession, logout } = useAuth();
    const [secondsRemaining, setSecondsRemaining] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    useEffect(() => {
        if (!sessionExpiresAt) {
            setSecondsRemaining(null);
            return;
        }
        const interval = setInterval(() => {
            const now = Date.now();
            const remainingMs = sessionExpiresAt - now;
            const warningThresholdMs = warningMinutesBeforeExpiry * 60 * 1000;
            if (remainingMs <= 0) {
                setSecondsRemaining(0);
                logout();
            }
            else if (remainingMs <= warningThresholdMs) {
                setSecondsRemaining(Math.ceil(remainingMs / 1000));
            }
            else {
                setSecondsRemaining(null);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [sessionExpiresAt, warningMinutesBeforeExpiry, logout]);
    if (secondsRemaining === null || secondsRemaining <= 0) {
        return null;
    }
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    const handleExtend = async () => {
        setIsRefreshing(true);
        try {
            await refreshSession();
        }
        finally {
            setIsRefreshing(false);
        }
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-purple-500/30 bg-[#0d111d] p-6 shadow-2xl">
        <div className="mb-4 flex items-center space-x-3 text-purple-400">
          <svg className="h-6 w-6 animate-pulse text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <h3 className="text-xl font-bold text-white">Session Expiring Soon</h3>
        </div>

        <p className="mb-4 text-sm text-gray-300">
          Your active session will expire in <span className="font-bold text-purple-400">{formattedTime}</span> due to inactivity. Would you like to extend your session?
        </p>

        <div className="flex justify-end space-x-3">
          <button type="button" onClick={logout} className="rounded-lg border border-gray-600 bg-transparent px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white">
            Logout
          </button>
          <button type="button" onClick={handleExtend} disabled={isRefreshing} className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50">
            {isRefreshing ? 'Extending...' : 'Extend Session'}
          </button>
        </div>
      </div>
    </div>);
};
export default SessionTimeoutModal;
