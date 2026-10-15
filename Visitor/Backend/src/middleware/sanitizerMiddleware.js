/**
 * Server-Side Input Sanitization Middleware
 * ─────────────────────────────────────────────────────────────────────────────
 * Protects backend endpoints against XSS, script injection, and control characters
 * before request data reaches validation or business controllers.
 */

function stripHtmlTags(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

function sanitizeValue(key, val) {
  if (val === null || val === undefined) return val;

  // Preserve binary files, passwords, tokens, base64 data URLs
  if (
    key.toLowerCase().includes('password') ||
    key.toLowerCase().includes('token') ||
    key.toLowerCase().includes('secret') ||
    key.toLowerCase().includes('photo') ||
    key.toLowerCase().includes('file') ||
    key.toLowerCase().includes('image') ||
    key.toLowerCase().includes('avatar')
  ) {
    return val;
  }

  if (typeof val === 'string') {
    // Preserve data URLs
    if (val.startsWith('data:image/') || val.startsWith('data:application/')) {
      return val;
    }

    // Strip control characters
    let cleaned = val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Normalize email
    if (key.toLowerCase().includes('email')) {
      return stripHtmlTags(cleaned).trim().toLowerCase();
    }

    // Normalize phone
    if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('mobile')) {
      const trimmed = cleaned.trim();
      const hasPlus = trimmed.startsWith('+');
      const digits = trimmed.replace(/\D/g, '');
      return hasPlus ? `+${digits}` : digits;
    }

    // Default string sanitization
    return stripHtmlTags(cleaned).trim();
  }

  if (typeof val === 'object' && !Array.isArray(val)) {
    return sanitizeObject(val);
  }

  if (Array.isArray(val)) {
    return val.map((item) => (typeof item === 'object' ? sanitizeObject(item) : sanitizeValue(key, item)));
  }

  return val;
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = {};
  for (const [key, val] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(key, val);
  }
  return sanitized;
}

function sanitizerMiddleware(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
}

module.exports = sanitizerMiddleware;
