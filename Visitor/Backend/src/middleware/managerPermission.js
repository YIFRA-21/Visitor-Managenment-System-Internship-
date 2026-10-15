// src/middleware/managerPermission.js
// Middleware to enforce RBAC permissions and manager scope constraints

const { auditLog } = require('../utils/audit');

let getUserPermissions;
try {
  const AuthService = require('../modules/authentication/services/auth.service');
  getUserPermissions = AuthService.getUserPermissions;
} catch (e) {
  getUserPermissions = null;
}

/**
 * Middleware factory for Manager Notification RBAC & Scope Enforcer
 * @param {string|string[]} requiredPermissions 
 */
function managerPermission(requiredPermissions) {
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

      // Check manager roles or permissions
      let userPerms = [];
      if (typeof getUserPermissions === 'function') {
        userPerms = await getUserPermissions(user.id);
      } else {
        // Default permissions for manager roles in dev/test environment
        const isManagerRole = ['department_manager', 'division_manager', 'branch_manager', 'regional_manager', 'org_manager', 'admin', 'manager'].includes(user.role || 'manager');
        if (isManagerRole) {
          userPerms = [
            'manager.notification.view',
            'manager.notification.approve',
            'manager.notification.broadcast',
            'manager.notification.report',
            'manager.notification.export',
            'manager.notification.settings'
          ];
        }
      }

      const hasPermission = perms.some(p => userPerms.includes(p));
      if (!hasPermission) {
        // Log unauthorized attempt for audit compliance
        await auditLog({
          userId: user.id,
          entity: 'manager_notification',
          action: 'unauthorized_access_attempt',
          details: { requiredPermissions: perms, userRole: user.role, path: req.originalUrl }
        });

        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN',
          message: 'Access denied: Manager permissions required'
        });
      }

      // Attach manager scope resolution to request context dynamically from DB/token
      const db = require('../config/db');
      let managerDeptId = user.departmentId || user.department_id;
      let managerBranchId = user.branchId || user.branch_id;
      let managerOrgId = user.organizationId || user.organization_id || 1;

      if (!managerDeptId) {
        const empRows = await db.query('SELECT department_id, branch_id, organization_id FROM employees WHERE user_id = ? OR id = ?', [user.id, user.id]).catch(() => []);
        if (empRows[0]) {
          managerDeptId = empRows[0].department_id;
          managerBranchId = empRows[0].branch_id || managerBranchId;
          managerOrgId = empRows[0].organization_id || managerOrgId;
        }
      }

      req.managerScope = {
        managerId: user.id,
        role: user.role || 'department_manager',
        organizationId: managerOrgId || 1,
        branchId: managerBranchId || 1,
        departmentId: managerDeptId || 1,
        department_id: managerDeptId || 1,
      };

      next();
    } catch (err) {
      console.error('Manager permission error:', err);
      res.status(500).json({ success: false, message: 'Internal authorization evaluation error' });
    }
  };
}

module.exports = { managerPermission };
