/**
 * In-Memory High-Performance TTL Cache Middleware for Read-Heavy Endpoints
 * Delivers sub-5ms responses for static reference & catalog lookups
 * Automatically invalidates on mutation methods (POST, PUT, PATCH, DELETE)
 */

const cacheStore = new Map();

/**
 * Creates an in-memory caching middleware for Express routes.
 * @param {number} ttlSeconds Time-to-live in seconds (default: 20)
 */
function apiCache(ttlSeconds = 20) {
  const ttlMs = ttlSeconds * 1000;

  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Bypass cache if explicitly requested via headers or query
    if (
      req.headers['cache-control'] === 'no-cache' ||
      req.headers['pragma'] === 'no-cache' ||
      req.query._refresh === 'true' ||
      req.query.nocache === '1'
    ) {
      return next();
    }

    // Key includes user role or userId if endpoint is user-scoped
    const authScope = req.user ? `${req.user.role || 'USER'}:${req.user.id || 0}:` : 'PUB:';
    const cacheKey = `${authScope}${req.originalUrl || req.url}`;

    const cachedEntry = cacheStore.get(cacheKey);
    const now = Date.now();

    if (cachedEntry && now < cachedEntry.expiresAt) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-TTL', Math.ceil((cachedEntry.expiresAt - now) / 1000));
      return res.status(cachedEntry.status).set(cachedEntry.headers).send(cachedEntry.body);
    }

    // Intercept res.send to store in cache
    const originalSend = res.send.bind(res);
    res.send = (body) => {
      // Only cache successful 200 responses
      if (res.statusCode === 200) {
        // Clone headers to replay
        const headers = {};
        const contentHeader = res.getHeader('content-type');
        if (contentHeader) headers['content-type'] = contentHeader;

        cacheStore.set(cacheKey, {
          status: res.statusCode,
          headers,
          body,
          expiresAt: now + ttlMs,
        });

        res.setHeader('X-Cache', 'MISS');
      }
      return originalSend(body);
    };

    next();
  };
}

/**
 * Invalidate cache entries matching a prefix or pattern
 * @param {string|RegExp} pattern
 */
function invalidateCache(pattern) {
  if (!pattern) {
    cacheStore.clear();
    return;
  }

  for (const key of cacheStore.keys()) {
    if (typeof pattern === 'string' && key.includes(pattern)) {
      cacheStore.delete(key);
    } else if (pattern instanceof RegExp && pattern.test(key)) {
      cacheStore.delete(key);
    }
  }
}

/**
 * Mutation auto-invalidation middleware
 * Clears cached data when entities are updated
 */
function autoInvalidateCache(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const originalEnd = res.end.bind(res);
    res.end = (...args) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const path = req.baseUrl || req.path || '';
        if (path.includes('/users')) invalidateCache('/users');
        if (path.includes('/departments')) invalidateCache('/departments');
        if (path.includes('/roles')) invalidateCache('/roles');
        if (path.includes('/organizations')) invalidateCache('/organizations');
        if (path.includes('/branches')) invalidateCache('/branches');
        if (path.includes('/rooms')) invalidateCache('/rooms');
      }
      return originalEnd(...args);
    };
  }
  next();
}

module.exports = {
  apiCache,
  invalidateCache,
  autoInvalidateCache,
};
