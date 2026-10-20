/**
 * Enterprise Visitor Management System (VMS)
 * Centralized Response Navigation Hook & Utility
 * Manages safe redirects, role-aware dashboard destinations, and response transitions
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import apiClient from '../../services/apiClient';
import { getRoleLanding, ROUTES } from '../../config/routes';
import { RESPONSE_TYPES } from './responseConfig';
import { normalizeApiError } from './errorNormalizationService';

/**
 * Validate and sanitize return URLs to strictly prevent open redirects
 */
export function sanitizeReturnUrl(targetUrl, fallbackUrl = '/dashboard') {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return fallbackUrl;
  }
  let trimmed = targetUrl.trim();
  // Disallow absolute external URLs (e.g., http://, https://, //, javascript:)
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:')
  ) {
    return fallbackUrl;
  }
  // Must begin with a single slash
  if (!trimmed.startsWith('/')) {
    trimmed = `/${trimmed}`;
  }

  // Prevent looping to confirmation or response screens
  if (trimmed.startsWith('/response') || trimmed.startsWith('/confirm')) {
    return fallbackUrl;
  }

  // Normalize root role paths that lack sub-routes so React Router matches reliably
  if (trimmed.startsWith('/admin?') || trimmed === '/admin') {
    trimmed = trimmed.replace(/^\/admin/, '/admin/dashboard');
  } else if (trimmed.startsWith('/employee?') || trimmed === '/employee') {
    trimmed = trimmed.replace(/^\/employee/, '/employee/dashboard');
  } else if (trimmed.startsWith('/manager?') || trimmed === '/manager') {
    trimmed = trimmed.replace(/^\/manager/, '/manager/dashboard');
  } else if (trimmed.startsWith('/reception?') || trimmed === '/reception') {
    trimmed = trimmed.replace(/^\/reception/, '/reception/dashboard');
  } else if (trimmed.startsWith('/security?') || trimmed === '/security') {
    trimmed = trimmed.replace(/^\/security/, '/security/dashboard');
  } else if (trimmed.startsWith('/visitor?') || trimmed === '/visitor') {
    trimmed = trimmed.replace(/^\/visitor/, '/visitor/dashboard');
  }

  return trimmed;
}

/**
 * Hook providing clean methods for in-place responses and notifications.
 * Eliminates full-page confirmation and response redirects across all roles and pages.
 */
export function useResponseNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const notificationCtx = useNotification();

  const notify = notificationCtx?.notify || (typeof window !== 'undefined' ? window.notify : null) || {
    success: (m) => console.log(m),
    error: (m) => console.error(m),
    warning: (m) => console.warn(m),
    info: (m) => console.log(m),
  };

  const userRole = user?.role || 'visitor';
  const roleDashboard = getRoleLanding(userRole, user) || '/dashboard';

  /**
   * Display in-page Success notification without navigating away
   */
  const toSuccess = ({
    title = 'Operation Completed Successfully',
    message = 'The action has been validated and committed successfully.',
    returnUrl = null,
  } = {}) => {
    const displayMsg = message || title;
    notify.success(displayMsg);
    if (returnUrl && returnUrl !== location.pathname && returnUrl !== '/response' && returnUrl !== '/confirm') {
      const safe = sanitizeReturnUrl(returnUrl, roleDashboard);
      if (safe && safe !== location.pathname) {
        navigate(safe, { replace: true });
      }
    }
  };

  /**
   * Display in-page Error notification without navigating away
   */
  const toError = (error, options = {}) => {
    const normalized = normalizeApiError(error, options);
    const displayMsg = options?.message || normalized.message || 'Operation failed.';
    notify.error(displayMsg);
  };

  /**
   * Execute consequential actions in-place and display a status toast.
   * Completely avoids full-page /confirm or /response transitions.
   */
  const toConfirmation = async ({
    title = 'Confirm Operation',
    message = 'Please confirm before proceeding with this action.',
    entityType = 'Record',
    entityName = '',
    apiEndpoint = null,
    apiMethod = 'DELETE',
    apiPayload = null,
    returnUrl = null,
    successConfig = null,
    onConfirm = null,
    onConfirmApi = null,
    successTitle = null,
    successMessage = null,
  } = {}) => {
    const resolvedEndpoint = apiEndpoint || (typeof onConfirmApi === 'string' ? onConfirmApi : null);

    try {
      if (resolvedEndpoint) {
        const method = (apiMethod || 'DELETE').toUpperCase();
        if (method === 'DELETE') {
          await apiClient.delete(resolvedEndpoint, { data: apiPayload });
        } else if (method === 'POST') {
          await apiClient.post(resolvedEndpoint, apiPayload);
        } else if (method === 'PUT') {
          await apiClient.put(resolvedEndpoint, apiPayload);
        } else if (method === 'PATCH') {
          await apiClient.patch(resolvedEndpoint, apiPayload);
        } else {
          await apiClient.get(resolvedEndpoint);
        }
      } else if (typeof onConfirmApi === 'function') {
        await onConfirmApi();
      } else if (typeof onConfirm === 'function') {
        await onConfirm();
      }

      if (typeof onSuccess === 'function') {
        await onSuccess();
      }

      const successMsg = successConfig?.message || successMessage || `${entityName || entityType || 'Record'} processed successfully.`;
      notify.success(successMsg);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vms-record-updated', {
          detail: { entityType, entityName, apiEndpoint: resolvedEndpoint }
        }));
      }

      const currentFullPath = location.pathname + location.search;
      if (
        returnUrl &&
        returnUrl !== currentFullPath &&
        returnUrl !== location.pathname &&
        returnUrl !== '/response' &&
        returnUrl !== '/confirm'
      ) {
        const safe = sanitizeReturnUrl(returnUrl, roleDashboard);
        if (safe && safe !== currentFullPath && safe !== location.pathname) {
          navigate(safe, { replace: true });
        }
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Operation could not be completed.';
      notify.error(errMsg);
    }
  };

  /**
   * Navigate to dedicated Not Found page
   */
  const toNotFound = ({ resourceName = 'Record', returnUrl = null } = {}) => {
    const safeReturn = sanitizeReturnUrl(returnUrl || location.pathname, roleDashboard);
    navigate('/not-found', {
      replace: true,
      state: {
        type: RESPONSE_TYPES.NOT_FOUND,
        title: `${resourceName} Not Found`,
        message: `The requested ${resourceName.toLowerCase()} could not be found or has been archived.`,
        returnUrl: safeReturn,
        primaryActionText: 'Return to Safety',
        primaryActionUrl: safeReturn,
        secondaryActionText: 'Go to Dashboard',
        secondaryActionUrl: roleDashboard,
      },
    });
  };

  /**
   * Navigate to dedicated Unauthorized / Access Denied page
   */
  const toForbidden = ({ message = 'Access Denied', returnUrl = null } = {}) => {
    const safeReturn = sanitizeReturnUrl(returnUrl || location.pathname, roleDashboard);
    navigate(ROUTES.PUBLIC.UNAUTHORIZED || '/unauthorized', {
      replace: true,
      state: {
        type: RESPONSE_TYPES.FORBIDDEN,
        title: 'Access Restricted (403 Forbidden)',
        message,
        returnUrl: safeReturn,
        secondaryActionUrl: roleDashboard,
      },
    });
  };

  /**
   * Generic notification dispatcher
   */
  const toResponse = (type, customState = {}) => {
    const msg = customState.message || customState.title || 'Operation Completed';
    if (String(type).includes('ERROR') || String(type).includes('FAILED')) {
      notify.error(msg);
    } else if (String(type).includes('WARN')) {
      notify.warning(msg);
    } else {
      notify.success(msg);
    }
    if (customState.returnUrl && customState.returnUrl !== location.pathname && customState.returnUrl !== '/response' && customState.returnUrl !== '/confirm') {
      const safe = sanitizeReturnUrl(customState.returnUrl, roleDashboard);
      if (safe && safe !== location.pathname) {
        navigate(safe, { replace: true });
      }
    }
  };

  return {
    toSuccess,
    toError,
    toConfirmation,
    toNotFound,
    toForbidden,
    toResponse,
    sanitizeReturnUrl,
    roleDashboard,
    userRole,
  };
}

export default useResponseNavigation;
