import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * CountdownAlert Component (Unified Response Bridge)
 *
 * Implements the unified response display requirement:
 * All responses are presented in ONE unified location (the Global Notification toast system)
 * instead of displaying duplicate in-page banners in the middle of page layouts.
 *
 * Any component rendering <CountdownAlert alert={alert} onClose={...} /> will seamlessly
 * route the response to window.notify, maintaining backward compatibility while
 * ensuring that responses are displayed in ONLY ONE place.
 */
export default function CountdownAlert({
  alert,
  onClose,
  duration = 4.5
}) {
  const lastProcessedRef = useRef(null);

  useEffect(() => {
    if (!alert || !alert.message) return;

    const messageKey = `${alert.type || 'info'}:${alert.message}`;
    if (lastProcessedRef.current === messageKey) return;
    lastProcessedRef.current = messageKey;

    const type = alert.type || 'info';
    const cleanMsg = typeof alert.message === 'string' ? alert.message : String(alert.message);

    if (typeof window !== 'undefined' && window.notify && typeof window.notify[type] === 'function') {
      window.notify[type](cleanMsg, duration, alert.title);
    } else if (typeof window !== 'undefined' && window.showNotification) {
      window.showNotification(cleanMsg, type, { duration, title: alert.title });
    }

    if (onClose) {
      onClose();
    }
  }, [alert, onClose, duration]);

  // Return null so no duplicate inline banner is rendered in the page layout
  return null;
}

CountdownAlert.propTypes = {
  alert: PropTypes.shape({
    type: PropTypes.string,
    message: PropTypes.string,
    title: PropTypes.string,
  }),
  onClose: PropTypes.func,
  duration: PropTypes.number,
  className: PropTypes.string
};
