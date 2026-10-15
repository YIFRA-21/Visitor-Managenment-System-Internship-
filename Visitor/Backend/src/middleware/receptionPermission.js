// src/middleware/receptionPermission.js
// Middleware to enforce RBAC permissions and front-desk operational scope

const { auditLog } = require('../utils/audit');

let getUserPermissions;
try {
  const AuthService = require('../modules/authentication/services/auth.service');
  getUserPermissions = AuthService.getUserPermissions;
} catch (e) {
  getUserPermissions = null;
}

/**
 * Middleware factory for Receptionist Notification RBAC & Scope Enforcer
 * @param {string|string[]} requiredPermissions 
 */
function receptionPermission(requiredPermissions) {
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
        // Default reception permissions in dev/test environment
        const isReceptionRole = ['receptionist', 'senior_receptionist', 'reception_supervisor', 'front_desk_officer', 'reception_manager', 'admin'].includes(user.role || 'receptionist');
        if (isReceptionRole) {
          userPerms = [
            'reception.notification.view',
            'reception.notification.manage',
            'reception.notification.send',
            'reception.notification.receive',
            'reception.notification.history',
            'reception.notification.preference'
          ];
        }
      }

      const hasPermission = perms.some(p => userPerms.includes(p));
      if (!hasPermission) {
        await auditLog({
          userId: user.id,
          entity: 'reception_notification',
          action: 'unauthorized_access_attempt',
          details: { requiredPermissions: perms, userRole: user.role, path: req.originalUrl }
        });

        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN',
          message: 'Access denied: Reception permissions required'
        });
      }

      // Attach reception scope resolution to request
      req.receptionScope = {
        receptionUserId: user.id,
        role: user.role || 'receptionist',
        deskId: user.deskId || 'desk_main_lobby_01',
        buildingId: user.buildingId || 'bldg_hq',
        branchId: user.branchId || 101,
        organizationId: user.organizationId || 1
      };

      next();
    } catch (err) {
      console.error('Reception permission error:', err);
      res.status(500).json({ success: false, message: 'Internal authorization evaluation error' });
    }
  };
}

module.exports = { receptionPermission };
