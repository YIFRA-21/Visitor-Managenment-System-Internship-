// Backend/src/middleware/managerScope.js
const db = require('../config/db');
const { auditLog } = require('../utils/audit');

/**
 * Middleware: managerScope
 * Resolves the authenticated user's department scope and enforces data isolation.
 * Prevents IDOR/BOLA attacks by rejecting cross-department access.
 */
async function managerScope(req, res, next) {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHENTICATED',
        error: 'Authentication token required'
      });
    }

    const isAdmin = ['admin', 'developer', 'super_admin', 'system_admin'].includes((user.role || '').toLowerCase());

    // 1. Resolve manager's assigned department from database
    let deptRow = null;

    // Direct check: is user the manager of a department?
    const directDept = await db.query(
      `SELECT d.id, d.organization_id, d.branch_id, d.department_name, d.department_code,
              o.name AS organization_name, b.branch_name
       FROM departments d
       LEFT JOIN organizations o ON d.organization_id = o.id
       LEFT JOIN organization_branches b ON d.branch_id = b.id
       WHERE (d.manager_user_id = ? OR d.manager_id = ?) AND d.deleted_at IS NULL AND d.status = 'ACTIVE'
       LIMIT 1`,
      [user.id, user.id]
    );

    if (directDept && directDept[0]) {
      deptRow = directDept[0];
    }

    // Secondary check: manager_profiles table
    if (!deptRow) {
      const profileDept = await db.query(
        `SELECT d.id, d.organization_id, d.branch_id, d.department_name, d.department_code,
                o.name AS organization_name, b.branch_name
         FROM manager_profiles mp
         JOIN departments d ON mp.department_id = d.id
         LEFT JOIN organizations o ON d.organization_id = o.id
         LEFT JOIN organization_branches b ON d.branch_id = b.id
         WHERE mp.user_id = ? AND d.deleted_at IS NULL
         LIMIT 1`,
        [user.id]
      );
      if (profileDept && profileDept[0]) {
        deptRow = profileDept[0];
      }
    }

    // Tertiary check: users table department_id
    if (!deptRow) {
      const userDept = await db.query(
        `SELECT d.id, d.organization_id, d.branch_id, d.department_name, d.department_code,
                o.name AS organization_name, b.branch_name
         FROM users u
         JOIN departments d ON u.department_id = d.id
         LEFT JOIN organizations o ON d.organization_id = o.id
         LEFT JOIN organization_branches b ON d.branch_id = b.id
         WHERE u.id = ? AND d.deleted_at IS NULL
         LIMIT 1`,
        [user.id]
      );
      if (userDept && userDept[0]) {
        deptRow = userDept[0];
      }
    }

    // Quaternary check: employees table department_id
    if (!deptRow) {
      const empDept = await db.query(
        `SELECT d.id, d.organization_id, d.branch_id, d.department_name, d.department_code,
                o.name AS organization_name, b.branch_name
         FROM employees e
         JOIN departments d ON e.department_id = d.id
         LEFT JOIN organizations o ON d.organization_id = o.id
         LEFT JOIN organization_branches b ON d.branch_id = b.id
         WHERE e.user_id = ? AND d.deleted_at IS NULL
         LIMIT 1`,
        [user.id]
      );
      if (empDept && empDept[0]) {
        deptRow = empDept[0];
      }
    }

    // Admin override fallback (defaults to first active department or requested department if admin)
    if (!deptRow && isAdmin) {
      const reqDeptId = req.query.department_id || req.body.department_id || 5;
      const adminDept = await db.query(
        `SELECT d.id, d.organization_id, d.branch_id, d.department_name, d.department_code,
                o.name AS organization_name, b.branch_name
         FROM departments d
         LEFT JOIN organizations o ON d.organization_id = o.id
         LEFT JOIN organization_branches b ON d.branch_id = b.id
         WHERE d.id = ? AND d.deleted_at IS NULL
         LIMIT 1`,
        [reqDeptId]
      );
      if (adminDept && adminDept[0]) {
        deptRow = adminDept[0];
      }
    }

    if (!deptRow) {
      return res.status(403).json({
        success: false,
        code: 'NO_DEPARTMENT_ASSIGNED',
        error: 'Access denied: No department is currently assigned to your manager account.'
      });
    }

    // 2. Anti-Tampering / IDOR Protection:
    // If the client explicitly provided a department_id that does not match their assigned department, block immediately.
    const requestedDeptId = req.query.department_id || req.body.department_id || req.params.departmentId;
    if (requestedDeptId && !isAdmin && parseInt(requestedDeptId) !== parseInt(deptRow.id)) {
      await auditLog({
        userId: user.id,
        entity: 'department_manager',
        action: 'idor_attempt_blocked',
        details: {
          assignedDept: deptRow.id,
          attemptedDept: requestedDeptId,
          path: req.originalUrl,
          method: req.method
        }
      }).catch(() => {});

      return res.status(403).json({
        success: false,
        code: 'CROSS_DEPARTMENT_FORBIDDEN',
        error: 'Access forbidden: You cannot access or modify resources outside your assigned department.'
      });
    }

    // 3. Attach verified, non-spoofable manager scope
    req.managerScope = {
      userId: user.id,
      managerId: user.id,
      organizationId: deptRow.organization_id || 1,
      branchId: deptRow.branch_id || 1,
      departmentId: deptRow.id,
      departmentName: deptRow.department_name,
      departmentCode: deptRow.department_code,
      organizationName: deptRow.organization_name || 'Enterprise Organization',
      branchName: deptRow.branch_name || 'Main Branch',
      isAdmin
    };

    next();
  } catch (err) {
    console.error('[MANAGER_SCOPE_ERROR]', err);
    return res.status(500).json({
      success: false,
      code: 'SCOPE_RESOLUTION_ERROR',
      error: 'Failed to verify department manager security scope.'
    });
  }
}

module.exports = managerScope;
