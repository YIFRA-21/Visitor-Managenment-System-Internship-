import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import CountdownAlert from '../components/common/CountdownAlert';
import { AnimatePresence } from 'framer-motion';

const ToastContext = createContext(null);

/**
 * Global Toast Provider
 *
 * Provides application-wide toast notifications featuring:
 * - 10-second animated decreasing loading bar
 * - Pause on mouse hover (to allow user to read)
 * - Resume countdown on mouse leave
 * - Auto-removal after 10s unhovered
 * - Manual dismissal via "✕" button
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 10) => {
    if (!message) return;
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    const newToast = { id, message, type, duration };

    setToasts((prev) => {
      // Keep up to 4 concurrent toasts on screen
      const filtered = prev.slice(-3);
      return [...filtered, newToast];
    });
    return id;
  }, []);

  const toast = useMemo(
    () => ({
      success: (msg, duration = 10) => showToast(msg, 'success', duration),
      error: (msg, duration = 10) => showToast(msg, 'error', duration),
      warning: (msg, duration = 10) => showToast(msg, 'warning', duration),
      info: (msg, duration = 10) => showToast(msg, 'info', duration),
      show: showToast,
      dismiss: removeToast,
    }),
    [showToast, removeToast]
  );

  // Expose global window helper for easy integration
  if (typeof window !== 'undefined') {
    window.appToast = toast;
  }

  return (
    <ToastContext.Provider value={{ toast, showToast, removeToast }}>
      {children}

      {/* Floating Global Toast Stack Container */}
      <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-3 sm:px-0">
        <AnimatePresence>
          {toasts.map((item) => (
            <div key={item.id} className="pointer-events-auto w-full drop-shadow-2xl">
              <CountdownAlert
                alert={{ type: item.type, message: item.message }}
                onClose={() => removeToast(item.id)}
                duration={item.duration || 10}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if used outside of ToastProvider
    return {
      showToast: (msg) => console.log('Toast:', msg),
      toast: {
        success: (msg) => console.log('Toast [success]:', msg),
        error: (msg) => console.log('Toast [error]:', msg),
        warning: (msg) => console.log('Toast [warning]:', msg),
        info: (msg) => console.log('Toast [info]:', msg),
      },
      removeToast: () => {},
    };
  }
  return context;
}

export default ToastContext;
