/**
 * Rate Limiter Middleware
 * ────────────────────────
 * In-memory sliding-window rate limiter for auth endpoints.
 * Prevents brute-force login and password reset attacks.
 * 
 * Configuration:
 *   - 5 attempts per 15-minute window per IP
 *   - Returns 429 Too Many Requests with Retry-After header
 *   - Audit log integration for blocked requests
 */

const auditRepository = require('../modules/audit-log/repositories/audit.repository');

// In-memory store: Map<string, { count: number, windowStart: number, blocked: boolean }>
const rateLimitStore = new Map();

// Cleanup interval — purge expired entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.windowStart > entry.windowMs) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

/**
 * Creates a rate limiter middleware with configurable options.
 * @param {object} options
 * @param {number} options.windowMs   - Time window in milliseconds (default: 15 min)
 * @param {number} options.maxAttempts - Max requests per window (default: 5)
 * @param {string} options.endpoint    - Name of the endpoint (for audit logging)
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000,  // 15 minutes
    maxAttempts = 5,
    endpoint = 'unknown'
  } = options;

  return async (req, res, next) => {
    // Skip rate limiting in dev bypass mode or relax for localhost in development
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      return next();
    }

    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
    const isLocalhost = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1' || clientIp === 'localhost';
    const effectiveMaxAttempts = isLocalhost ? Math.max(maxAttempts, 100) : maxAttempts;

    const key = `${endpoint}:${clientIp}`;
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    // Initialize or reset window if expired
    if (!entry || (now - entry.windowStart > windowMs)) {
      entry = {
        count: 0,
        windowStart: now,
        windowMs,
        blocked: false
      };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    // Check if limit exceeded
    if (entry.count > effectiveMaxAttempts) {
      const retryAfterMs = windowMs - (now - entry.windowStart);
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

      // Log first block occurrence per window
      if (!entry.blocked) {
        entry.blocked = true;
        try {
          await auditRepository.log({
            userId: null,
            action: 'RATE_LIMIT_EXCEEDED',
            module: 'AUTH',
            entity: 'rate_limiter',
            ipAddress: clientIp,
            userAgent: req.headers['user-agent'],
            newValues: {
              endpoint,
              attempts: entry.count,
              windowMs,
              clientIp
            }
          });
        } catch (err) {
          console.error('Rate limiter audit log error:', err.message);
        }
      }

      res.set('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds
      });
    }

    // Set rate limit headers
    res.set('X-RateLimit-Limit', String(maxAttempts));
    res.set('X-RateLimit-Remaining', String(Math.max(0, maxAttempts - entry.count)));
    res.set('X-RateLimit-Reset', String(Math.ceil((entry.windowStart + windowMs) / 1000)));

    next();
  };
}

// Pre-configured rate limiters for common auth endpoints
const loginRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,  // 1 minute (60 seconds)
  maxAttempts: 7,       // 7 requests per minute
  endpoint: 'login'
});

const forgotPasswordRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  maxAttempts: 60,
  endpoint: 'forgot-password'
});

const registrationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxAttempts: 5,
  endpoint: 'register'
});

/**
 * Manually clear rate limit for an IP (e.g., after admin intervention)
 * @param {string} endpoint 
 * @param {string} ip 
 */
function clearRateLimit(endpoint, ip) {
  const key = `${endpoint}:${ip}`;
  rateLimitStore.delete(key);
}

/**
 * Get current rate limit status for an IP
 * @param {string} endpoint 
 * @param {string} ip 
 */
function getRateLimitStatus(endpoint, ip) {
  const key = `${endpoint}:${ip}`;
  const entry = rateLimitStore.get(key);
  if (!entry) return { limited: false, remaining: 5 };
  const now = Date.now();
  if (now - entry.windowStart > entry.windowMs) {
    return { limited: false, remaining: 5 };
  }
  return {
    limited: entry.count >= 5,
    remaining: Math.max(0, 5 - entry.count),
    retryAfterMs: entry.windowMs - (now - entry.windowStart)
  };
}

module.exports = {
  createRateLimiter,
  loginRateLimiter,
  forgotPasswordRateLimiter,
  registrationRateLimiter,
  clearRateLimit,
  getRateLimitStatus
};
