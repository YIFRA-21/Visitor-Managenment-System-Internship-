// src/middleware/securityPermission.js
// Middleware to enforce RBAC permissions and security officer operational scope

const { auditLog } = require('../utils/audit');

let getUserPermissions;
try {
  const AuthService = require('../modules/authentication/services/auth.service');
  getUserPermissions = AuthService.getUserPermissions;
} catch (e) {
  getUserPermissions = null;
}

/**
 * Middleware factory for Security Officer Notification RBAC & Scope Enforcer
 * @param {string|string[]} requiredPermissions 
 */
function securityPermission(requiredPermissions) {
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
        // Default security permissions in dev/test environment
        const isSecurityRole = [
          'security_officer',
          'senior_security_officer',
          'chief_security_officer',
          'security_supervisor',
          'soc_officer',
          'security_manager',
          'admin'
        ].includes(user.role || 'security_officer');

        if (isSecurityRole) {
          userPerms = [
            'security.notification.view',
            'security.notification.receive',
            'security.notification.respond',
            'security.notification.acknowledge',
            'security.notification.investigate',
            'security.notification.escalate',
            'security.notification.report',
            'security.notification.export'
          ];
        }
      }

      const hasPermission = perms.some(p => userPerms.includes(p));
      if (!hasPermission) {
        await auditLog({
          userId: user.id,
          entity: 'security_notification',
          action: 'unauthorized_access_attempt',
          details: { requiredPermissions: perms, userRole: user.role, path: req.originalUrl }
        });

        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN',
          message: 'Access denied: Security Officer permissions required'
        });
      }

      // Attach security officer scope resolution to request
      req.securityScope = {
        securityUserId: user.id,
        role: user.role || 'security_officer',
        buildingId: user.buildingId || 'bldg_hq',
        campusId: user.campusId || 'campus_main',
        zoneId: user.zoneId || 'zone_perimeter_alpha',
        branchId: user.branchId || 101,
        organizationId: user.organizationId || 1
      };

      next();
    } catch (err) {
      console.error('Security permission error:', err);
      res.status(500).json({ success: false, message: 'Internal authorization evaluation error' });
    }
  };
}

module.exports = { securityPermission };
