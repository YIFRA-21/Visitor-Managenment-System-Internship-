/**
 * Enterprise Visitor Management System (VMS)
 * Shared API Error Normalization Service
 * Sanitizes backend exceptions, formats validation issues, and maps to standardized response types
 */

import { RESPONSE_TYPES } from './responseConfig';

export class NormalizedResponse {
  constructor({
    type = RESPONSE_TYPES.ERROR,
    title = 'Operation Failed',
    message = 'An unexpected error occurred.',
    details = null,
    validationErrors = [],
    statusCode = 500,
    errorCode = 'UNKNOWN_ERROR',
    timestamp = new Date().toISOString(),
    isSafeForUser = true,
    actionableGuidance = null,
  }) {
    this.type = type;
    this.title = title;
    this.message = message;
    this.details = details;
    this.validationErrors = validationErrors;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.timestamp = timestamp;
    this.isSafeForUser = isSafeForUser;
    this.actionableGuidance = actionableGuidance;
  }
}

/**
 * Filter out raw SQL keywords, table names, syntax errors, and stack traces
 */
export function sanitizeTechnicalDetails(raw) {
  if (!raw) return null;
  const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
  
  // Sensitive SQL or backend internals patterns
  const patternsToScrub = [
    /SELECT\s+.*?\s+FROM/gi,
    /INSERT\s+INTO/gi,
    /DELETE\s+FROM/gi,
    /UPDATE\s+.*?\s+SET/gi,
    /SQLSTATE\[.*?\]/gi,
    /errno:\s*\d+/gi,
    /at\s+.*?\s+\(.*?\)/gi, // Stack trace lines
    /password|secret|jwt|token|authorization/gi,
  ];

  let cleaned = str;
  for (const pattern of patternsToScrub) {
    cleaned = cleaned.replace(pattern, '[REDACTED_SYSTEM_DETAIL]');
  }

  // If message was completely composed of SQL error, provide safe enterprise message
  if (cleaned.includes('REDACTED_SYSTEM_DETAIL') && (cleaned.length < 50 || cleaned.includes('syntax'))) {
    return 'The database encountered an operational constraint violation. Details have been logged for security review.';
  }

  return cleaned.length > 500 ? `${cleaned.substring(0, 500)}...` : cleaned;
}

/**
 * Normalize any API or runtime error into a clean NormalizedResponse
 */
export function normalizeApiError(err, context = {}) {
  // If already normalized
  if (err instanceof NormalizedResponse) {
    return err;
  }

  const timestamp = new Date().toISOString();
  
  // 1. Network / Connection Failures
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return new NormalizedResponse({
      type: RESPONSE_TYPES.NETWORK_ERROR,
      title: context.title || 'Network Connection Failure',
      message: 'Unable to reach the enterprise VMS gateway. Please check your internet connection or firewall.',
      details: 'Connection lost or gateway unreachable.',
      statusCode: 0,
      errorCode: 'NETWORK_DISCONNECTED',
      actionableGuidance: 'Verify your network status and retry the operation.',
      timestamp,
    });
  }

  if (err?.code === 'ECONNABORTED' || (typeof err?.message === 'string' && err.message.toLowerCase().includes('timeout'))) {
    return new NormalizedResponse({
      type: RESPONSE_TYPES.NETWORK_ERROR,
      title: context.title || 'Request Timeout',
      message: 'The server took too long to respond. The system prevented an unconfirmed state.',
      details: 'Gateway connection timed out (30s threshold).',
      statusCode: 408,
      errorCode: 'REQUEST_TIMEOUT',
      actionableGuidance: 'Check if the operation completed on your dashboard before retrying.',
      timestamp,
    });
  }

  // 2. HTTP Status Code Handling
  const status = err?.response?.status || err?.status || 500;
  const data = err?.response?.data || {};

  // Extract friendly message
  let extractedMessage = '';
  if (typeof data === 'string' && data.length < 200) {
    extractedMessage = data;
  } else if (data?.message && typeof data.message === 'string') {
    extractedMessage = data.message;
  } else if (data?.error && typeof data.error === 'string') {
    extractedMessage = data.error;
  } else if (err?.message && typeof err.message === 'string') {
    extractedMessage = err.message;
  }

  // Extract validation errors array
  const validationErrors = [];
  if (Array.isArray(data?.details)) {
    data.details.forEach(item => {
      if (typeof item === 'string') validationErrors.push(item);
      else if (item?.message) validationErrors.push(item.field ? `${item.field}: ${item.message}` : item.message);
    });
  } else if (Array.isArray(data?.errors)) {
    data.errors.forEach(item => {
      if (typeof item === 'string') validationErrors.push(item);
      else if (item?.msg) validationErrors.push(item.param ? `${item.param}: ${item.msg}` : item.msg);
    });
  }

  // 3. Status Code Classification
  if (status === 401) {
    return new NormalizedResponse({
      type: RESPONSE_TYPES.UNAUTHORIZED,
      title: 'Session Expired or Unauthorized',
      message: extractedMessage || 'Your security session has expired or requires valid authentication.',
      statusCode: 401,
      errorCode: 'UNAUTHORIZED_ACCESS',
      actionableGuidance: 'Please log in again to refresh your session credentials.',
      timestamp,
    });
  }

  if (status === 403) {
    const isAccountBlocked = data?.code === 'ACCOUNT_BLOCKED' || data?.isBlocked;
    return new NormalizedResponse({
      type: RESPONSE_TYPES.FORBIDDEN,
      title: isAccountBlocked ? 'Account Restricted / Suspended' : 'Access Restricted (403 Forbidden)',
      message: extractedMessage || 'You do not have administrative clearance to execute this operation.',
      statusCode: 403,
      errorCode: isAccountBlocked ? 'ACCOUNT_BLOCKED' : 'PERMISSION_DENIED',
      actionableGuidance: 'Contact your organization administrator or security officer if you require elevated roles.',
      timestamp,
    });
  }

  if (status === 404) {
    return new NormalizedResponse({
      type: RESPONSE_TYPES.NOT_FOUND,
      title: context.title || 'Resource Not Located',
      message: extractedMessage || 'The requested record, document, or identity profile could not be found.',
      statusCode: 404,
      errorCode: 'RECORD_NOT_FOUND',
      actionableGuidance: 'Check the reference ID or return to the directory listing.',
      timestamp,
    });
  }

  if (status === 409) {
    return new NormalizedResponse({
      type: RESPONSE_TYPES.DUPLICATE_RECORD,
      title: context.title || 'Conflicting Record or Operation',
      message: extractedMessage || 'A duplicate entry or scheduling collision was detected for this transaction.',
      details: sanitizeTechnicalDetails(data?.details || extractedMessage),
      statusCode: 409,
      errorCode: 'DUPLICATE_CONFLICT',
      actionableGuidance: 'Inspect existing records to ensure unique IDs, dates, and email addresses.',
      timestamp,
    });
  }

  if (status === 422 || (status === 400 && validationErrors.length > 0)) {
    return new NormalizedResponse({
      type: RESPONSE_TYPES.VALIDATION_FAILED,
      title: context.title || 'Form Submission Validation Failed',
      message: extractedMessage || 'One or more required fields contain invalid format or conflicting values.',
      validationErrors: validationErrors.length > 0 ? validationErrors : [extractedMessage],
      statusCode: status,
      errorCode: 'VALIDATION_ERROR',
      actionableGuidance: 'Review the listed validation errors and correct the form fields.',
      timestamp,
    });
  }

  if (status === 429) {
    return new NormalizedResponse({
      type: RESPONSE_TYPES.WARNING,
      title: 'Rate Limit Reached',
      message: 'Too many requests dispatched in a short interval. Security throttle activated.',
      statusCode: 429,
      errorCode: 'RATE_LIMIT_EXCEEDED',
      actionableGuidance: 'Wait 30-60 seconds before re-attempting this submission.',
      timestamp,
    });
  }

  if (status === 503) {
    return new NormalizedResponse({
      type: RESPONSE_TYPES.SERVICE_UNAVAILABLE,
      title: 'Service Temporarily Unavailable',
      message: 'The enterprise backend or one of its micro-engines is undergoing maintenance.',
      statusCode: 503,
      errorCode: 'SERVICE_UNAVAILABLE',
      actionableGuidance: 'Please retry shortly. If persistent, alert system support.',
      timestamp,
    });
  }

  // 4. Default 500 / General Server Error
  return new NormalizedResponse({
    type: RESPONSE_TYPES.ERROR,
    title: context.title || 'Operation Failed',
    message: extractedMessage || 'The server encountered an error while executing the requested action.',
    details: sanitizeTechnicalDetails(data?.error || data?.details || err.message),
    validationErrors,
    statusCode: status,
    errorCode: data?.code || 'SERVER_ERROR',
    actionableGuidance: 'Review the provided details or return to your dashboard.',
    timestamp,
  });
}

export default {
  NormalizedResponse,
  normalizeApiError,
  sanitizeTechnicalDetails,
};
