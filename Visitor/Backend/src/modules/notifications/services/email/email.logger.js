/**
 * Production Safe Email Logger
 * ──────────────────────────────
 * Structured JSON logging for production observability.
 * STRICT SECURITY: Never logs OTP codes, passwords, API keys, or raw JWTs.
 */

class EmailLogger {
  maskEmail(email) {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return 'anonymous';
    }
    const [local, domain] = email.trim().toLowerCase().split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local.slice(0, 2)}***@${domain}`;
  }

  logInfo(event, details = {}) {
    const logPayload = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      event,
      operationId: details.operationId || 'N/A',
      purpose: details.purpose || 'GENERAL',
      recipient: this.maskEmail(details.recipient || details.to),
      provider: details.provider || 'unknown',
      status: details.status || 'INFO',
      attempt: details.attempt || 1,
      durationMs: details.durationMs || undefined,
      messageId: details.messageId || undefined,
    };
    console.log(`[EMAIL_EVENT] ${JSON.stringify(logPayload)}`);
  }

  logWarn(event, details = {}) {
    const logPayload = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      event,
      operationId: details.operationId || 'N/A',
      purpose: details.purpose || 'GENERAL',
      recipient: this.maskEmail(details.recipient || details.to),
      provider: details.provider || 'unknown',
      status: details.status || 'WARNING',
      attempt: details.attempt || 1,
      reason: details.reason || details.error || 'Warning',
    };
    console.warn(`[EMAIL_WARN] ${JSON.stringify(logPayload)}`);
  }

  logError(event, details = {}) {
    // Sanitize any potential credentials out of error message
    let sanitizedError = String(details.error?.message || details.error || 'Unknown error');
    sanitizedError = sanitizedError.replace(/pass(?:word)?\s*[:=]\s*[^\s,]+/gi, 'password=***');
    sanitizedError = sanitizedError.replace(/bearer\s+[a-z0-9._-]+/gi, 'Bearer ***');

    const logPayload = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      event,
      operationId: details.operationId || 'N/A',
      purpose: details.purpose || 'GENERAL',
      recipient: this.maskEmail(details.recipient || details.to),
      provider: details.provider || 'unknown',
      status: 'FAILED',
      attempt: details.attempt || 1,
      errorCode: details.errorCode || details.error?.code || 'EMAIL_DISPATCH_FAILED',
      errorMessage: sanitizedError,
    };
    console.error(`[EMAIL_ERROR] ${JSON.stringify(logPayload)}`);
  }
}

module.exports = new EmailLogger();

