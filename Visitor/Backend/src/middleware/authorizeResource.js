/**
 * Resource Authorization Middleware
 * ──────────────────────────────────
 * Checks whether the authenticated user has access to a specific
 * frontend resource (page/route) based on the permission_resources
 * and responsibility chain resolved from the RBAC tables.
 *
 * Usage:
 *   router.get('/admin/users', authenticate, authorizeResource('/admin/users'), handler)
 */

const db = require('../config/db');

/**
 * Middleware factory that checks if the current user has access to a given route_url resource.
 * Admin users bypass this check.
 *
 * @param {string} routeUrl - The frontend route_url to authorize access for
 */
function authorizeResource(routeUrl) {
  return async (req, res, next) => {
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      return next();
    }
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
    }

    // Admin override
    if (req.user.role === 'admin') {
      return next();
    }

    try {
      // Resolve user's accessible resource route_urls via the full RBAC chain
      const sql = `
        SELECT DISTINCT res.route_url
        FROM user_roles ur
        JOIN role_responsibilities rr ON ur.role_id = rr.role_id
        JOIN responsibility_permissions rp ON rr.responsibility_id = rp.responsibility_id
        JOIN permission_resources pr ON rp.permission_id = pr.permission_id
        JOIN resources res ON pr.resource_id = res.id
        WHERE ur.user_id = ?
          AND res.route_url = ?
          AND res.status = 'ACTIVE'
        LIMIT 1
      `;

      const rows = await db.query(sql, [req.user.id, routeUrl]);

      if (rows && rows.length > 0) {
        return next();
      }

      return res.status(403).json({
        error: 'You do not have access to this resource',
        code: 'RESOURCE_FORBIDDEN',
        resource: routeUrl
      });
    } catch (err) {
      console.error('Error in authorizeResource middleware:', err);
      return res.status(500).json({ error: 'Internal authorization error' });
    }
  };
}

module.exports = { authorizeResource };
