const jwt = require('jsonwebtoken');
const environment = require('../config/environment');

// Role to Permissions Static Map for high-performance claim verification
const ROLE_PERMISSIONS = {
  admin: ['*'],
  manager: [
    'appointment:create',
    'appointment:read',
    'appointment:cancel',
    'approval:approve',
    'approval:read',
    'liveboard:read',
    'reports:read',
  ],
  department_manager: [
    'appointment:create',
    'appointment:read',
    'appointment:cancel',
    'approval:approve',
    'approval:read',
    'liveboard:read',
    'reports:read',
  ],
  staff: [
    'appointment:create',
    'appointment:read',
    'appointment:cancel',
    'approval:approve',
    'approval:read',
    'liveboard:read',
  ],
  employee: [
    'appointment:create',
    'appointment:read',
    'appointment:cancel',
    'approval:approve',
    'approval:read',
    'liveboard:read',
  ],
  receptionist: [
    'visitor:create',
    'visitor:read',
    'appointment:read',
    'checkin:create',
    'checkout:create',
    'liveboard:read',
  ],
  security: [
    'visitor:read',
    'appointment:read',
    'checkin:create',
    'checkout:create',
    'liveboard:read',
    'reports:read',
  ],
  security_officer: [
    'visitor:read',
    'appointment:read',
    'checkin:create',
    'checkout:create',
    'liveboard:read',
    'reports:read',
  ],
  visitor: [
    'appointment:create',
    'appointment:read',
    'appointment:cancel',
  ],
};

const db = require('../config/db');
const { checkPermission, checkRole } = require('./rbac');

// Endpoints a user with a pending first-login password change is still allowed to call.
// Everything else is blocked with 403 PASSWORD_CHANGE_REQUIRED until the user changes
// their temporary password.
const PASSWORD_CHANGE_ALLOWED_PREFIXES = [
  '/api/auth/me',
  '/api/auth/change-password',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/auth/sessions',
  '/api/auth/profile',
  '/api/auth/my-profile',
  '/api/auth/verify-route',
];

function isPasswordChangeAllowed(req) {
  const path = (req.originalUrl || req.url || '').split('?')[0].toLowerCase();
  return PASSWORD_CHANGE_ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function blockPasswordChangeRequired(req, res) {
  return res.status(403).json({
    success: false,
    error: 'You must change your temporary password before you can continue.',
    code: 'PASSWORD_CHANGE_REQUIRED',
    nextAction: 'CHANGE_PASSWORD',
    redirectTo: '/change-password',
  });
}

function enforcePasswordChange(req, res, next) {
  if (req.user && req.user.mustChangePassword) {
    if (req.user.role?.toLowerCase() === 'admin' || process.env.DEV_BYPASS_AUTH === 'true') {
      return next();
    }
    if (!isPasswordChangeAllowed(req)) {
      return blockPasswordChangeRequired(req, res);
    }
  }
  next();
}

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  const isDevBypass = process.env.DEV_BYPASS_AUTH === 'true';

  let token = null;
  if (header && header.startsWith('Bearer ')) {
    token = header.slice(7).trim();
  } else if (req.query && req.query.token) {
    token = String(req.query.token).trim();
  }

  if (token) {
    if ((token === 'mock-jwt-token-for-dev' || token === 'mock-token' || token === 'dev-token') && isDevBypass) {
      req.user = {
        id: 1,
        username: 'admin',
        role: 'admin',
        organizationId: 1,
        permissions: ['*'],
        authenticated: true,
      };
      return next();
    }

    try {
      const decoded = jwt.verify(token, environment.JWT.SECRET);

      // CRITICAL SECURITY CHECK: Check database to ensure user is not blocked, suspended, or deactivated
      if (decoded && decoded.id) {
        try {
          const userRows = await db.query(
            'SELECT id, account_status, status, is_active, deleted_at, first_login_required FROM users WHERE id = ?',
            [decoded.id]
          );
          const userRecord = userRows && userRows[0];
          if (!userRecord || userRecord.deleted_at) {
            return res.status(401).json({
              success: false,
              error: 'User account no longer exists or has been removed.',
              code: 'USER_NOT_FOUND',
            });
          }

          const statusUpper = String(userRecord.account_status || userRecord.status || '').trim().toUpperCase();
          const isBlocked = ['BLOCKED', 'SUSPENDED', 'DEACTIVATED', 'ARCHIVED', 'INACTIVE', 'DISABLED'].includes(statusUpper) ||
                            userRecord.is_active === 0 || userRecord.is_active === false;

          if (isBlocked) {
            await db.query('UPDATE user_sessions SET is_active = FALSE WHERE user_id = ?', [decoded.id]).catch(() => {});
            return res.status(403).json({
              success: false,
              error: 'Your account has been blocked or suspended by the administrator. Access is denied.',
              code: 'ACCOUNT_BLOCKED',
              status: 'fail',
              isBlocked: true,
            });
          }

          req.user = {
            ...decoded,
            accountStatus: statusUpper,
            status: statusUpper.toLowerCase(),
            firstLoginRequired: !!userRecord.first_login_required,
            mustChangePassword: !!userRecord.first_login_required,
          };
        } catch (dbErr) {
          req.user = decoded;
        }
      } else {
        req.user = decoded;
      }

      return enforcePasswordChange(req, res, next);
    } catch (err) {
      console.warn('[AUTH] Token verification failed:', err.message);
      if (isDevBypass) {
        req.user = {
          id: 1,
          username: 'admin',
          role: 'admin',
          organizationId: 1,
          permissions: ['*'],
          authenticated: true,
        };
        return next();
      }
      return res.status(401).json({
        success: false,
        error: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
        message: err.name === 'TokenExpiredError'
          ? 'Your session token has expired. Please re-authenticate at POST /api/auth/login to get a fresh token.'
          : `Token verification failed: ${err.message}.`,
        code: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
      });
    }
  }

  if (isDevBypass) {
    req.user = {
      id: 1,
      username: 'admin',
      role: 'admin',
      organizationId: 1,
      permissions: ['*'],
      authenticated: true,
    };
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'Authentication required',
    message: 'Authentication required'
  });
}

function authorize(...roles) {
  return async (req, res, next) => {
    const isDevBypass = process.env.DEV_BYPASS_AUTH === 'true';
    if (isDevBypass) {
      return next();
    }
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userRole = String(req.user.role || '').toLowerCase();
    if (['admin', 'administrator', 'system_administrator', 'super_admin'].includes(userRole)) {
      return next();
    }

    if (roles.length) {
      // Check if user has any of the requested roles
      let hasRole = false;
      for (const role of roles) {
        // Run a manual query or check for database-driven role inheritance
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
          const result = await db.query(sql, [req.user.id, role.toLowerCase(), role.toLowerCase()]);
          if (result[0] && result[0].count > 0) {
            hasRole = true;
            break;
          }
        } catch (err) {
          console.error('Error in DB authorize check:', err);
        }

        // Fallback to legacy single-column role match
        if (req.user.role && req.user.role.toLowerCase() === role.toLowerCase()) {
          hasRole = true;
          break;
        }
      }

      if (!hasRole) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }
    next();
  };
}

function hasPermission(permission) {
  return checkPermission(permission);
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const token = header.slice(7);
      req.user = jwt.verify(token, environment.JWT.SECRET);
      if (req.user && req.user.mustChangePassword && !isPasswordChangeAllowed(req)) {
        return blockPasswordChangeRequired(req, res);
      }
      return next();
    } catch (err) {
      // ignore invalid token for optional auth
    }
  }

  if (process.env.DEV_BYPASS_AUTH === 'true') {
    req.user = {
      id: 1,
      username: 'Developer',
      role: 'admin',
      organizationId: 1,
      permissions: ['*'],
      authenticated: true
    };
    return next();
  }
  next();
}

module.exports = {
  authenticate,
  authenticateToken: authenticate,
  authorize,
  hasPermission,
  optionalAuth,
};
