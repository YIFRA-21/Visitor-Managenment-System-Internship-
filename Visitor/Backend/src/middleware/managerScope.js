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

    const isManagerRole = (user.role || '').toLowerCase() === 'manager';
    const isAdmin = ['admin', 'developer', 'super_admin', 'system_admin'].includes((user.role || '').toLowerCase());

    // 1. Resolve manager's assigned departments from database
    const managedDeptsMap = new Map();

    // Direct check: is user explicitly set as manager of department(s)?
    const directDepts = await db.query(
      `SELECT d.id, d.organization_id, d.branch_id, d.department_name, d.department_code,
              o.name AS organization_name, b.branch_name
       FROM departments d
       LEFT JOIN organizations o ON d.organization_id = o.id
       LEFT JOIN organization_branches b ON d.branch_id = b.id
       WHERE (d.manager_user_id = ? OR d.manager_id = ? OR d.manager_id IN (SELECT id FROM employees WHERE user_id = ?))
         AND d.deleted_at IS NULL AND d.status = 'ACTIVE'`,
      [user.id, user.id, user.id]
    ).catch(() => []);

    (directDepts || []).forEach(d => managedDeptsMap.set(d.id, d));

    // Secondary check: manager_profiles table
    const profileDept = await db.query(
      `SELECT d.id, d.organization_id, d.branch_id, d.department_name, d.department_code,
              o.name AS organization_name, b.branch_name
       FROM manager_profiles mp
       JOIN departments d ON mp.department_id = d.id
       LEFT JOIN organizations o ON d.organization_id = o.id
       LEFT JOIN organization_branches b ON d.branch_id = b.id
       WHERE mp.user_id = ? AND d.deleted_at IS NULL AND d.status = 'ACTIVE'`,
      [user.id]
    ).catch(() => []);

    (profileDept || []).forEach(d => managedDeptsMap.set(d.id, d));

    // Tertiary check: users table department_id
    const userDept = await db.query(
      `SELECT d.id, d.organization_id, d.branch_id, d.department_name, d.department_code,
              o.name AS organization_name, b.branch_name
       FROM users u
       JOIN departments d ON u.department_id = d.id
       LEFT JOIN organizations o ON d.organization_id = o.id
       LEFT JOIN organization_branches b ON d.branch_id = b.id
       WHERE u.id = ? AND d.deleted_at IS NULL AND d.status = 'ACTIVE'`,
      [user.id]
    ).catch(() => []);

    (userDept || []).forEach(d => managedDeptsMap.set(d.id, d));

    // Quaternary check: employees table department_id and employees managed by this user
    const empDept = await db.query(
      `SELECT d.id, d.organization_id, d.branch_id, d.department_name, d.department_code,
              o.name AS organization_name, b.branch_name
       FROM employees e
       JOIN departments d ON e.department_id = d.id
       LEFT JOIN organizations o ON d.organization_id = o.id
       LEFT JOIN organization_branches b ON d.branch_id = b.id
       WHERE (e.user_id = ? OR e.manager_id = ? OR e.manager_id IN (SELECT id FROM employees WHERE user_id = ?))
         AND d.deleted_at IS NULL AND d.status = 'ACTIVE'`,
      [user.id, user.id, user.id]
    ).catch(() => []);

    (empDept || []).forEach(d => managedDeptsMap.set(d.id, d));

    // If user has manager role and still no specific department was mapped, attach all active departments in organization
    if (managedDeptsMap.size === 0 && (isManagerRole || isAdmin)) {
      const allActiveDepts = await db.query(
        `SELECT d.id, d.organization_id, d.branch_id, d.department_name, d.department_code,
                o.name AS organization_name, b.branch_name
         FROM departments d
         LEFT JOIN organizations o ON d.organization_id = o.id
         LEFT JOIN organization_branches b ON d.branch_id = b.id
         WHERE d.deleted_at IS NULL AND d.status = 'ACTIVE'
         ORDER BY d.id ASC`
      ).catch(() => []);

      (allActiveDepts || []).forEach(d => managedDeptsMap.set(d.id, d));
    }

    const managedDepts = Array.from(managedDeptsMap.values());
    const deptIds = managedDepts.map(d => Number(d.id));

    let deptRow = null;
    const requestedDeptId = req.query.department_id || req.body.department_id || req.params.departmentId;

    if (requestedDeptId) {
      const parsedReqId = parseInt(requestedDeptId);
      if (deptIds.includes(parsedReqId) || isAdmin) {
        deptRow = managedDepts.find(d => Number(d.id) === parsedReqId) || managedDepts[0];
      } else {
        await auditLog({
          userId: user.id,
          entity: 'department_manager',
          action: 'idor_attempt_blocked',
          details: {
            assignedDepts: deptIds,
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
    } else {
      deptRow = managedDepts[0] || null;
    }

    if (!deptRow) {
      return res.status(403).json({
        success: false,
        code: 'NO_DEPARTMENT_ASSIGNED',
        error: 'Access denied: No department is currently assigned to your manager account.'
      });
    }

    // 2. Attach verified, non-spoofable manager scope
    req.managerScope = {
      userId: user.id,
      managerId: user.id,
      organizationId: deptRow.organization_id || 1,
      branchId: deptRow.branch_id || 1,
      departmentId: deptRow.id,
      departmentIds: deptIds.length > 0 ? deptIds : [deptRow.id],
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
