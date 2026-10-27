import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { AnimatePresence } from 'framer-motion';
import GlobalNotification from '../components/common/GlobalNotification';

const NotificationContext = createContext(null);

// Global event bus fallback so notifications can be triggered from anywhere (including outside React tree like axios interceptors)
let globalNotifyHandler = null;

/**
 * Global Notification Provider
 *
 * Provides application-wide response and status notifications in ONE unified place:
 * - Slide-in from right to left
 * - 4.5-second default visible duration
 * - Pause countdown on hover, resume on mouse leave
 * - Downward drop & smooth fade-out exit animation (600ms)
 * - Manual dismissal via (×) button
 * - NO countdown numbers inside notifications
 * - Strictly ONE notification displayed at a time (replaces previous to avoid stacking clutter)
 * - Automatically clears stale notifications upon route navigation
 * - Strict type-based color scheme: error (red/pink), success (green), warning (yellow/orange), info (blue)
 * - Built-in deduplication within 2 seconds to prevent spam
 */
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const recentMessagesRef = useRef(new Map());
  const location = useLocation();

  // Dismiss a notification by ID
  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Automatically clear transient notifications upon navigating to a new route
  useEffect(() => {
    setNotifications([]);
  }, [location.pathname]);

  // Core show notification handler with message sanitization and deduplication
  const showNotification = useCallback((message, type = 'info', options = {}) => {
    if (!message) return null;

    // Handle string or simple object message
    let cleanMessage = message;
    if (typeof message === 'object' && message !== null) {
      if (typeof message.message === 'string') {
        cleanMessage = message.message;
      } else if (typeof message.error === 'string') {
        cleanMessage = message.error;
      } else {
        try {
          cleanMessage = JSON.stringify(message);
        } catch {
          cleanMessage = 'An error occurred';
        }
      }
    }

    // Sanitize string to avoid displaying raw database/server stack dumps
    cleanMessage = String(cleanMessage).trim();
    if (!cleanMessage) return null;

    // Suppress technical token / protected endpoint / authentication toast messages on login/logout
    if (/authenticated user token|protected endpoint requires|authentication required/i.test(cleanMessage)) {
      return null;
    }

    // Suppress raw JSON / syntax parsing errors or malformed null responses from user toasts
    if (/unexpected token|is not valid json|syntaxerror/i.test(cleanMessage)) {
      return null;
    }

    // Suppress generic backend fallback error messages on page load, refresh, or login
    if (/something went wrong on our end|please try again later/i.test(cleanMessage)) {
      return null;
    }

    // Hide sensitive raw SQL errors from user
    if (/select|insert|update|delete|table|column|sql|syntax error|foreign key/i.test(cleanMessage) && cleanMessage.length > 50) {
      cleanMessage = 'A database operation could not be completed. Please verify your data and try again.';
    }

    // Determine normalized type
    const normalizedType = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
    const duration = typeof options === 'number' ? options : (options?.duration || 4.5);
    const title = typeof options === 'object' ? options?.title : undefined;

    // Normalized message key for deduplication (strip quotes and spaces)
    const normMsg = cleanMessage.replace(/["']/g, '').replace(/\s+/g, ' ').toLowerCase();
    const dedupKey = `${normalizedType}:${normMsg}`;
    const now = Date.now();
    const lastShown = recentMessagesRef.current.get(dedupKey);
    if (lastShown && now - lastShown < 2000) {
      return null; // Suppress duplicate
    }
    recentMessagesRef.current.set(dedupKey, now);

    // Prune stale cache entries
    if (recentMessagesRef.current.size > 50) {
      for (const [key, timestamp] of recentMessagesRef.current.entries()) {
        if (now - timestamp > 5000) {
          recentMessagesRef.current.delete(key);
        }
      }
    }

    const id = `${now}-${Math.random().toString(36).substring(2, 8)}`;
    const newNotification = {
      id,
      message: cleanMessage,
      type: normalizedType,
      title,
      duration
    };

    // Strictly ONE unified notification visible on screen at any time (replaces prior notification)
    setNotifications([newNotification]);

    return id;
  }, []);

  // Connect global notify handler
  useEffect(() => {
    globalNotifyHandler = showNotification;
    return () => {
      if (globalNotifyHandler === showNotification) {
        globalNotifyHandler = null;
      }
    };
  }, [showNotification]);

  // Convenient notification API
  const notify = useMemo(
    () => ({
      success: (msg, duration = 4.5, title) => showNotification(msg, 'success', { duration, title }),
      error: (msg, duration = 4.5, title) => showNotification(msg, 'error', { duration, title }),
      warning: (msg, duration = 4.5, title) => showNotification(msg, 'warning', { duration, title }),
      info: (msg, duration = 4.5, title) => showNotification(msg, 'info', { duration, title }),
      show: showNotification,
      dismiss: dismissNotification,
      clear: clearAllNotifications
    }),
    [showNotification, dismissNotification, clearAllNotifications]
  );

  // Expose global window helper for easy integration across non-React code (e.g. axios interceptors)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.showNotification = showNotification;
      window.notify = notify;
      // Backward compatibility aliases
      window.appToast = notify;
      window.toast = notify;
    }
  }, [notify, showNotification]);

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        notify,
        dismissNotification,
        clearAllNotifications,
        // Backward compatibility
        toast: notify,
        showToast: showNotification,
        removeToast: dismissNotification
      }}
    >
      {children}

      {/* Floating Global Notification Stack Container (Top-Right) */}
      <div
        className="fixed top-5 right-5 z-[999999] flex flex-col gap-3 max-w-md w-[calc(100vw-2.5rem)] sm:w-full pointer-events-none px-2 sm:px-0"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence mode="popLayout">
          {notifications.map((item) => (
            <div key={item.id} className="pointer-events-auto w-full drop-shadow-2xl">
              <GlobalNotification
                notification={item}
                onClose={() => dismissNotification(item.id)}
                duration={item.duration || 10}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Primary React Hook to access the notification system
 */
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    // Fallback if called outside provider or during tests
    return {
      showNotification: (msg, type) => {
        if (globalNotifyHandler) return globalNotifyHandler(msg, type);
        console.log(`[Notification ${type}]:`, msg);
      },
      notify: {
        success: (msg) => globalNotifyHandler ? globalNotifyHandler(msg, 'success') : console.log('[Success]:', msg),
        error: (msg) => globalNotifyHandler ? globalNotifyHandler(msg, 'error') : console.error('[Error]:', msg),
        warning: (msg) => globalNotifyHandler ? globalNotifyHandler(msg, 'warning') : console.warn('[Warning]:', msg),
        info: (msg) => globalNotifyHandler ? globalNotifyHandler(msg, 'info') : console.info('[Info]:', msg),
        dismiss: () => {},
        clear: () => {}
      },
      dismissNotification: () => {},
      clearAllNotifications: () => {},
      toast: {
        success: (msg) => globalNotifyHandler ? globalNotifyHandler(msg, 'success') : console.log('[Success]:', msg),
        error: (msg) => globalNotifyHandler ? globalNotifyHandler(msg, 'error') : console.error('[Error]:', msg),
        warning: (msg) => globalNotifyHandler ? globalNotifyHandler(msg, 'warning') : console.warn('[Warning]:', msg),
        info: (msg) => globalNotifyHandler ? globalNotifyHandler(msg, 'info') : console.info('[Info]:', msg),
        dismiss: () => {},
        clear: () => {}
      },
      showToast: (msg, type) => {
        if (globalNotifyHandler) return globalNotifyHandler(msg, type);
        console.log(`[Toast ${type}]:`, msg);
      },
      removeToast: () => {}
    };
  }
  return context;
}

/**
 * Backward compatibility hook for existing codebase
 */
export const useToast = useNotification;

/**
 * Non-React helper to trigger notifications anywhere (e.g., in utility functions, API clients)
 */
export const notify = {
  success: (msg, duration, title) => {
    if (typeof window !== 'undefined' && window.notify) {
      return window.notify.success(msg, duration, title);
    }
    if (globalNotifyHandler) return globalNotifyHandler(msg, 'success', { duration, title });
    console.log('[Notification Success]:', msg);
  },
  error: (msg, duration, title) => {
    if (typeof window !== 'undefined' && window.notify) {
      return window.notify.error(msg, duration, title);
    }
    if (globalNotifyHandler) return globalNotifyHandler(msg, 'error', { duration, title });
    console.error('[Notification Error]:', msg);
  },
  warning: (msg, duration, title) => {
    if (typeof window !== 'undefined' && window.notify) {
      return window.notify.warning(msg, duration, title);
    }
    if (globalNotifyHandler) return globalNotifyHandler(msg, 'warning', { duration, title });
    console.warn('[Notification Warning]:', msg);
  },
  info: (msg, duration, title) => {
    if (typeof window !== 'undefined' && window.notify) {
      return window.notify.info(msg, duration, title);
    }
    if (globalNotifyHandler) return globalNotifyHandler(msg, 'info', { duration, title });
    console.info('[Notification Info]:', msg);
  },
  show: (msg, type, options) => {
    if (typeof window !== 'undefined' && window.showNotification) {
      return window.showNotification(msg, type, options);
    }
    if (globalNotifyHandler) return globalNotifyHandler(msg, type, options);
  }
};

export default NotificationContext;
