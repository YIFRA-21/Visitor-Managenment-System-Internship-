/**
 * ToastContext (Backward Compatibility Layer)
 *
 * Re-exports from the centralized NotificationContext.
 * All existing calls to useToast(), ToastProvider, showToast, etc.,
 * automatically route to the global GlobalNotification engine.
 */
export {
  NotificationProvider as ToastProvider,
  useNotification as useToast,
  useNotification,
  NotificationProvider,
  notify,
  notify as toast
} from './NotificationContext';

export { default } from './NotificationContext';
