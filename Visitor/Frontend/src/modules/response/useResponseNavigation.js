/**
 * Enterprise Visitor Management System (VMS)
 * Centralized Response Navigation Hook & Utility
 * Manages safe redirects, role-aware dashboard destinations, and response transitions
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
  const trimmed = targetUrl.trim();
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
    return `/${trimmed}`;
  }
  return trimmed;
}

/**
 * Hook providing clean methods for navigating to dedicated response & confirmation pages
 */
export function useResponseNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const userRole = user?.role || 'visitor';
  const roleDashboard = getRoleLanding(userRole, user) || '/dashboard';

  /**
   * Navigate to the dedicated Success response page
   */
  const toSuccess = ({
    title = 'Operation Completed Successfully',
    message = 'The action has been validated and committed successfully.',
    referenceId = null,
    entityType = null,
    entityName = null,
    module = null,
    details = null,
    metadata = null,
    returnUrl = null,
    primaryActionText = null,
    primaryActionUrl = null,
    secondaryActionText = 'Return to Dashboard',
    secondaryActionUrl = roleDashboard,
    type = RESPONSE_TYPES.SUCCESS,
  } = {}) => {
    const safeReturn = sanitizeReturnUrl(returnUrl || location.pathname, roleDashboard);

    navigate('/response', {
      replace: true,
      state: {
        type,
        title,
        message,
        referenceId,
        entityType,
        entityName,
        module,
        details,
        metadata,
        returnUrl: safeReturn,
        confirmText: 'Confirm',
        primaryActionText: 'Confirm',
        primaryActionUrl: primaryActionUrl ? sanitizeReturnUrl(primaryActionUrl, safeReturn) : safeReturn,
        timestamp: new Date().toISOString(),
      },
    });
  };

  /**
   * Navigate to the dedicated Error response page with sanitized normalization
   */
  const toError = (error, options = {}) => {
    const normalized = normalizeApiError(error, options);
    const safeReturn = sanitizeReturnUrl(options.returnUrl || location.pathname, roleDashboard);
    const safeRetry = options.retryUrl ? sanitizeReturnUrl(options.retryUrl, safeReturn) : safeReturn;

    navigate('/response', {
      replace: true,
      state: {
        type: normalized.type || RESPONSE_TYPES.ERROR,
        title: options.title || normalized.title,
        message: options.message || normalized.message,
        details: normalized.details,
        validationErrors: normalized.validationErrors,
        statusCode: normalized.statusCode,
        errorCode: normalized.errorCode,
        actionableGuidance: normalized.actionableGuidance,
        entityType: options.entityType,
        entityName: options.entityName,
        module: options.module,
        returnUrl: safeReturn,
        retryUrl: safeRetry,
        confirmText: 'Confirm',
        primaryActionText: 'Confirm',
        primaryActionUrl: safeRetry,
        timestamp: normalized.timestamp || new Date().toISOString(),
      },
    });
  };

  /**
   * Navigate to dedicated Consequential Confirmation page
   */
  const toConfirmation = ({
    title = 'Confirm Consequential Action',
    message = 'Please confirm before proceeding with this permanent action.',
    entityType = 'Record',
    entityName = '',
    entityId = null,
    consequences = [],
    confirmLabel = 'Confirm & Proceed',
    cancelLabel = 'Cancel & Go Back',
    confirmVariant = 'danger', // danger | warning | primary | success
    apiEndpoint = null,
    apiMethod = 'DELETE',
    apiPayload = null,
    returnUrl = null,
    successConfig = null,
    onConfirm = null,
  } = {}) => {
    const safeReturn = sanitizeReturnUrl(returnUrl || location.pathname, roleDashboard);

    navigate('/confirm', {
      state: {
        title,
        message,
        entityType,
        entityName,
        entityId,
        consequences: Array.isArray(consequences) && consequences.length > 0 
          ? consequences 
          : ['This action modifies corporate records and cannot be undone.'],
        confirmLabel,
        cancelLabel,
        confirmVariant,
        apiEndpoint,
        apiMethod,
        apiPayload,
        returnUrl: safeReturn,
        successConfig: successConfig || {
          type: RESPONSE_TYPES.SUCCESS,
          title: 'Operation Completed',
          message: `${entityType || 'Record'} has been successfully updated.`,
          returnUrl: safeReturn,
        },
        hasDirectCallback: Boolean(onConfirm),
      },
    });
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
   * Generic dispatcher for any specific response type
   */
  const toResponse = (type, customState = {}) => {
    const safeReturn = sanitizeReturnUrl(customState.returnUrl || location.pathname, roleDashboard);
    navigate('/response', {
      replace: true,
      state: {
        type: type || RESPONSE_TYPES.INFO,
        returnUrl: safeReturn,
        secondaryActionUrl: roleDashboard,
        ...customState,
        timestamp: new Date().toISOString(),
      },
    });
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
