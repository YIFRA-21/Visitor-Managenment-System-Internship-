/**
 * RBAC Middleware
 * ────────────────
 * Dynamically resolves user permissions from roles, user_roles,
 * role_permissions, and role_hierarchy using recursive CTEs.
 * Implements in-memory caching to avoid database overhead.
 */

const db = require('../config/db');

// In-memory permission cache
// Key: userId, Value: { permissions: Set, expiresAt: timestamp }
const permissionCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

/**
 * Clear permission cache for a user (useful on role/permission updates)
 * @param {number} userId 
 */
function clearUserPermissionCache(userId) {
  if (userId) {
    permissionCache.delete(userId);
  }
}

/**
 * Clear the entire permission cache (useful on global permission matrix change)
 */
function clearAllPermissionCache() {
  permissionCache.clear();
}

/**
 * Resolves permissions for a user from the database
 * @param {number} userId 
 * @returns {Promise<Set<string>>}
 */
async function resolveUserPermissions(userId) {
  // Check cache first
  const cached = permissionCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.permissions;
  }

  const permissions = new Set();

  try {
    // 1. Fetch user's direct permissions and inherited permissions through hierarchy
    // We use a WITH RECURSIVE query to climb/traverse the role hierarchy
    const sql = `
      WITH RECURSIVE role_tree AS (
        SELECT role_id 
        FROM user_roles 
        WHERE user_id = ? 
          AND is_active = TRUE 
          AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
          AND deleted_at IS NULL
        
        UNION
        
        SELECT rh.child_role_id 
        FROM role_hierarchy rh
        INNER JOIN role_tree rt ON rh.parent_role_id = rt.role_id
      )
      SELECT DISTINCT p.permission_code 
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id IN (SELECT role_id FROM role_tree)
        AND p.status = 'ACTIVE' 
        AND p.deleted_at IS NULL
    `;

    const rows = await db.query(sql, [userId]);

    for (const row of rows) {
      if (row.permission_code) {
        permissions.add(row.permission_code.toLowerCase());
      }
    }

    // 2. Fallback check for single role cache column on users table
    // (Ensure backwards compatibility with users created/modified without user_roles row)
    const userRows = await db.query(
      `SELECT role FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [userId]
    );

    if (userRows.length > 0 && userRows[0].role) {
      const legacyRole = userRows[0].role.toLowerCase();
      // Resolve system admin special cases
      if (legacyRole === 'admin') {
        permissions.add('*');
      } else {
        // Find permission of that role from roles table directly
        const legacyPermRows = await db.query(`
          SELECT p.permission_code 
          FROM role_permissions rp
          JOIN roles r ON rp.role_id = r.id
          JOIN permissions p ON rp.permission_id = p.id
          WHERE (LOWER(r.role_code) = ? 
            OR LOWER(r.role_name) = ?)
            AND p.status = 'ACTIVE'
            AND p.deleted_at IS NULL
        `, [legacyRole, legacyRole]);

        for (const row of legacyPermRows) {
          if (row.permission_code) {
            permissions.add(row.permission_code.toLowerCase());
          }
        }
      }
    }

    // Save to cache
    permissionCache.set(userId, {
      permissions,
      expiresAt: Date.now() + CACHE_TTL_MS
    });

  } catch (err) {
    console.error(`Error resolving permissions for user ${userId}:`, err);
    // Return empty set on error rather than crashing
  }

  return permissions;
}

/**
 * Express middleware to check if the user has a specific permission
 * @param {string} requiredPermission 
 */
function checkPermission(requiredPermission) {
  return async (req, res, next) => {
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      return next();
    }
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
    }

    // Admins always have access
    if (req.user.role === 'admin') {
      return next();
    }

    const userPermissions = await resolveUserPermissions(req.user.id);

    if (userPermissions.has('*') || userPermissions.has(requiredPermission.toLowerCase())) {
      return next();
    }

    return res.status(403).json({
      error: 'Insufficient permissions for this operation',
      code: 'FORBIDDEN',
      requiredPermission
    });
  };
}

/**
 * Express middleware to check if the user has a specific role (directly or inherited)
 * @param {string} roleCode 
 */
function checkRole(roleCode) {
  return async (req, res, next) => {
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      return next();
    }
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
    }

    // Admins always have access
    if (req.user.role === 'admin') {
      return next();
    }

    try {
      const sql = `
        WITH RECURSIVE role_tree AS (
          SELECT role_id 
          FROM user_roles 
          WHERE user_id = ? 
            AND is_active = TRUE 
            AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            AND deleted_at IS NULL
          
          UNION
          
          SELECT rh.child_role_id 
          FROM role_hierarchy rh
          INNER JOIN role_tree rt ON rh.parent_role_id = rt.role_id
        )
        SELECT COUNT(*) as count 
        FROM role_tree rt
        JOIN roles r ON rt.role_id = r.id
        WHERE LOWER(r.role_code) = ? OR LOWER(r.role_name) = ?
      `;

      const result = await db.query(sql, [req.user.id, roleCode.toLowerCase(), roleCode.toLowerCase()]);
      
      if (result[0] && result[0].count > 0) {
        return next();
      }

      // Check legacy single-column role fallback
      if (req.user.role && req.user.role.toLowerCase() === roleCode.toLowerCase()) {
        return next();
      }

      return res.status(403).json({
        error: `Requires role: ${roleCode}`,
        code: 'FORBIDDEN_ROLE'
      });

    } catch (err) {
      console.error('Error in checkRole middleware:', err);
      return res.status(500).json({ error: 'Internal RBAC server error' });
    }
  };
}

module.exports = {
  checkPermission,
  checkRole,
  clearUserPermissionCache,
  clearAllPermissionCache,
  invalidatePermissionCache: clearAllPermissionCache,
  resolveUserPermissions
};
