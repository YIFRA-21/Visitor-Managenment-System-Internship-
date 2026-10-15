// src/middleware/platformPermission.js
// Middleware to enforce RBAC permissions for Enterprise Notification Platform management

const { auditLog } = require('../utils/audit');

let getUserPermissions;
try {
  const AuthService = require('../modules/authentication/services/auth.service');
  getUserPermissions = AuthService.getUserPermissions;
} catch (e) {
  getUserPermissions = null;
}

/**
 * Middleware factory for Enterprise System Notification Platform RBAC
 * @param {string|string[]} requiredPermissions 
 */
function platformPermission(requiredPermissions) {
  const perms = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user || !user.id) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHENTICATED',
          message: 'Authentication token required'
        });
      }

      let userPerms = [];
      if (typeof getUserPermissions === 'function') {
        userPerms = await getUserPermissions(user.id);
      } else {
        // Default platform admin / operator permissions
        const isPlatformAdmin = [
          'admin',
          'system_administrator',
          'organization_administrator',
          'security_manager',
          'reception_supervisor',
          'department_manager'
        ].includes(user.role || 'admin');

        if (isPlatformAdmin) {
          userPerms = [
            'platform.notification.view',
            'platform.notification.manage',
            'platform.notification.send',
            'platform.notification.configure',
            'platform.notification.audit',
            'platform.notification.export'
          ];
        }
      }

      const hasPermission = perms.some(p => userPerms.includes(p));
      if (!hasPermission) {
        await auditLog({
          userId: user.id,
          entity: 'enterprise_notification_platform',
          action: 'unauthorized_platform_access',
          details: { requiredPermissions: perms, userRole: user.role, path: req.originalUrl }
        });

        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN',
          message: 'Access denied: Enterprise Notification Platform permissions required'
        });
      }

      req.platformScope = {
        userId: user.id,
        role: user.role || 'admin',
        organizationId: user.organizationId || 1,
        branchId: user.branchId || 101,
        buildingId: user.buildingId || 'bldg_hq'
      };

      next();
    } catch (err) {
      console.error('Platform permission error:', err);
      res.status(500).json({ success: false, message: 'Internal authorization evaluation error' });
    }
  };
}

module.exports = { platformPermission };
