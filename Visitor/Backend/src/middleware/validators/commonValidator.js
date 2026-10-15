/**
 * Request Validators — Common Validation Rules
 * ──────────────────────────────────────────────
 * Lightweight validation middleware using manual checks (no external dependency).
 * Each validator returns (req, res, next) middleware.
 */

// ── Helpers ─────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-()]{7,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;
const SAFE_STRING_RE = /^[^<>{}]*$/; // No angle brackets or curly braces (XSS prevention)

class ValidationError {
  constructor(field, message) {
    this.field = field;
    this.message = message;
  }
}

function collectErrors(checks) {
  const errors = [];
  for (const check of checks) {
    const result = check();
    if (result) errors.push(result);
  }
  return errors;
}

function sendValidationErrors(res, errors) {
  return res.status(400).json({
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: errors.map((e) => ({ field: e.field, message: e.message })),
  });
}

// ── Field Check Factories ───────────────────────────────────────────────────

function required(body, field, label) {
  return () => {
    const val = body[field];
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      return new ValidationError(field, `${label || field} is required`);
    }
    return null;
  };
}

function isEmail(body, field, label) {
  return () => {
    const val = body[field];
    if (val && !EMAIL_RE.test(val)) {
      return new ValidationError(field, `${label || field} must be a valid email`);
    }
    return null;
  };
}

function isPhone(body, field, label) {
  return () => {
    const val = body[field];
    if (val && !PHONE_RE.test(val)) {
      return new ValidationError(field, `${label || field} must be a valid phone number`);
    }
    return null;
  };
}

function isDate(body, field, label) {
  return () => {
    const val = body[field];
    if (val && !DATE_RE.test(val)) {
      return new ValidationError(field, `${label || field} must be a valid date (YYYY-MM-DD)`);
    }
    return null;
  };
}

function isDateTime(body, field, label) {
  return () => {
    const val = body[field];
    if (val && !DATETIME_RE.test(val)) {
      return new ValidationError(field, `${label || field} must be a valid datetime`);
    }
    return null;
  };
}

function minLength(body, field, min, label) {
  return () => {
    const val = body[field];
    if (val && typeof val === 'string' && val.trim().length < min) {
      return new ValidationError(field, `${label || field} must be at least ${min} characters`);
    }
    return null;
  };
}

function maxLength(body, field, max, label) {
  return () => {
    const val = body[field];
    if (val && typeof val === 'string' && val.length > max) {
      return new ValidationError(field, `${label || field} must be at most ${max} characters`);
    }
    return null;
  };
}

function isIn(body, field, allowed, label) {
  return () => {
    const val = body[field];
    if (val && !allowed.includes(val)) {
      return new ValidationError(field, `${label || field} must be one of: ${allowed.join(', ')}`);
    }
    return null;
  };
}

function isPositiveInt(body, field, label) {
  return () => {
    const val = body[field];
    if (val !== undefined && val !== null) {
      const num = Number(val);
      if (!Number.isInteger(num) || num <= 0) {
        return new ValidationError(field, `${label || field} must be a positive integer`);
      }
    }
    return null;
  };
}

function isSafeString(body, field, label) {
  return () => {
    const val = body[field];
    if (val && typeof val === 'string' && !SAFE_STRING_RE.test(val)) {
      return new ValidationError(field, `${label || field} contains invalid characters`);
    }
    return null;
  };
}

function passwordStrength(body, field, label) {
  return () => {
    const val = body[field];
    if (!val) return null;
    if (val.length < 8) {
      return new ValidationError(field, `${label || field} must be at least 8 characters`);
    }
    if (!/[A-Z]/.test(val)) {
      return new ValidationError(field, `${label || field} must contain at least one uppercase letter`);
    }
    if (!/[a-z]/.test(val)) {
      return new ValidationError(field, `${label || field} must contain at least one lowercase letter`);
    }
    if (!/[0-9]/.test(val)) {
      return new ValidationError(field, `${label || field} must contain at least one number`);
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(val)) {
      return new ValidationError(field, `${label || field} must contain at least one special character`);
    }
    return null;
  };
}

function dateNotInPast(body, field, label) {
  return () => {
    const val = body[field];
    if (!val) return null;
    const d = new Date(val);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (d < now) {
      return new ValidationError(field, `${label || field} cannot be in the past`);
    }
    return null;
  };
}

function dateRange(body, startField, endField) {
  return () => {
    const start = body[startField];
    const end = body[endField];
    if (start && end && new Date(start) >= new Date(end)) {
      return new ValidationError(endField, 'End date/time must be after start date/time');
    }
    return null;
  };
}

// ── Param Validators ────────────────────────────────────────────────────────

function paramIsPositiveInt(paramName) {
  return (req, res, next) => {
    const val = req.params[paramName];
    if (!val || !Number.isInteger(Number(val)) || Number(val) <= 0) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: [{ field: paramName, message: `${paramName} must be a positive integer` }],
      });
    }
    next();
  };
}

// ── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  // Field check factories (return check functions for collectErrors)
  required,
  isEmail,
  isPhone,
  isDate,
  isDateTime,
  minLength,
  maxLength,
  isIn,
  isPositiveInt,
  isSafeString,
  passwordStrength,
  dateNotInPast,
  dateRange,

  // Utilities
  collectErrors,
  sendValidationErrors,
  ValidationError,
  paramIsPositiveInt,
};
