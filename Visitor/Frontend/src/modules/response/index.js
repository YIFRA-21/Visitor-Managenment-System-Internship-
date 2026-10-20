/**
 * Enterprise Visitor Management System (VMS)
 * Centralized Response Page System Module Barrel
 */

export { default as ResponsePage } from './ResponsePage';
export { default as ConfirmationPage } from './ConfirmationPage';
export { default as NotFoundPage } from './NotFoundPage';
export { default as UnauthorizedPage } from './UnauthorizedPage';
export { default as GlobalErrorPage } from './GlobalErrorPage';
export { default as useResponseNavigation, sanitizeReturnUrl } from './useResponseNavigation';
export { default as responseConfig, RESPONSE_TYPES, RESPONSE_SEVERITY, RESPONSE_TYPE_CONFIG } from './responseConfig';
export { default as errorNormalizationService, normalizeApiError, sanitizeTechnicalDetails, NormalizedResponse } from './errorNormalizationService';
