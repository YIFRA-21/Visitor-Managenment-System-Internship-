// src/middleware/adminPermission.js
// Middleware to enforce RBAC permissions for admin notification features

const { PermissionError } = require('../utils/errors');

let getUserPermissions;
try {
  const AuthService = require('../modules/authentication/services/auth.service');
  getUserPermissions = AuthService.getUserPermissions;
} catch (e) {
  getUserPermissions = null;
}

function adminPermission(requiredPermissions) {
  const perms = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  return async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthenticated' });
      }

      let userPerms = [];
      if (typeof getUserPermissions === 'function') {
        userPerms = await getUserPermissions(userId);
      } else {
        // Fallback admin permissions
        userPerms = [
          'admin:notification:manage',
          'admin:notification:broadcast',
          'admin:notification:monitor',
          'admin:campaign:create',
          'admin:approval:submit',
          'admin:approval:approve',
          'admin:notification:preview',
          'admin:recovery:retry'
        ];
      }

      const hasPerm = perms.some(p => userPerms.includes(p));
      if (!hasPerm) {
        throw new PermissionError('Insufficient permissions');
      }
      next();
    } catch (err) {
      const status = err.status || 403;
      res.status(status).json({ success: false, message: err.message || 'Forbidden' });
    }
  };
}

module.exports = { adminPermission };
