/**
 * Role Assignment Repository
 * ──────────────────────────
 * Data access layer for user-role assignments, scoped roles, temporary roles,
 * role conflict checks, and Segregation of Duties (SoD) enforcement.
 */

const db = require('../../../config/db');

class RoleAssignmentRepository {
  /**
   * Find all assignments for a given role ID with user details
   */
  async findUsersByRoleId(roleId, filters = {}) {
    let sql = `
      SELECT ur.user_role_id AS assignment_id, ur.user_id, ur.role_id,
             u.full_name, u.email, u.phone, u.status AS user_status, u.account_status,
             r.role_name, r.role_code,
             ur.organization_id, ur.branch_id, ur.department_id, ur.building_id,
             org.name AS organization_name, b.branch_name AS branch_name, d.department_name,
             ur.assigned_at, ur.start_date, ur.end_date, ur.expires_at,
             ur.is_active, ur.assignment_status, ur.assignment_reason,
             ab.full_name AS assigned_by_name
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN organizations org ON ur.organization_id = org.id
      LEFT JOIN branches b ON ur.branch_id = b.id
      LEFT JOIN departments d ON ur.department_id = d.id
      LEFT JOIN users ab ON ur.assigned_by = ab.id
      WHERE ur.role_id = ? AND ur.deleted_at IS NULL
    `;
    const params = [roleId];

    if (filters.status) {
      sql += ` AND ur.assignment_status = ?`;
      params.push(filters.status);
    }
    if (filters.search) {
      sql += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    sql += ` ORDER BY ur.assigned_at DESC`;
    return db.query(sql, params);
  }

  /**
   * Find all active role assignments for a user with effective permissions
   */
  async findRolesByUserId(userId) {
    return db.query(
      `SELECT ur.user_role_id AS assignment_id, ur.role_id,
              r.role_name, r.role_code, r.scope_type, r.is_system_role, r.status AS role_status,
              ur.organization_id, ur.branch_id, ur.department_id, ur.building_id,
              ur.assigned_at, ur.start_date, ur.end_date, ur.assignment_status,
              (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.id) AS permission_count
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ? AND ur.deleted_at IS NULL AND r.deleted_at IS NULL
         AND ur.is_active = TRUE AND (ur.assignment_status = 'ACTIVE' OR ur.assignment_status IS NULL)
         AND (ur.start_date IS NULL OR ur.start_date <= CURRENT_TIMESTAMP)
         AND (ur.end_date IS NULL OR ur.end_date >= CURRENT_TIMESTAMP)
       ORDER BY r.priority DESC, r.role_name ASC`,
      [userId]
    );
  }

  /**
   * Assign a role to a user (with transaction conn optional)
   */
  async assignRole(data, conn = db) {
    const sql = `
      INSERT INTO user_roles (
        user_id, role_id, organization_id, branch_id, department_id, building_id,
        start_date, end_date, expires_at, is_active, assignment_status, assignment_reason, assigned_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 'ACTIVE', ?, ?)
      ON DUPLICATE KEY UPDATE
        organization_id = VALUES(organization_id),
        branch_id = VALUES(branch_id),
        department_id = VALUES(department_id),
        building_id = VALUES(building_id),
        start_date = VALUES(start_date),
        end_date = VALUES(end_date),
        expires_at = VALUES(expires_at),
        is_active = TRUE,
        assignment_status = 'ACTIVE',
        assignment_reason = VALUES(assignment_reason),
        assigned_by = VALUES(assigned_by),
        deleted_at = NULL
    `;
    const params = [
      data.userId,
      data.roleId,
      data.organizationId || null,
      data.branchId || null,
      data.departmentId || null,
      data.buildingId || null,
      data.startDate || null,
      data.endDate || null,
      data.endDate || null,
      data.assignmentReason || null,
      data.assignedBy || null,
    ];

    const result = await conn.query(sql, params);
    return result.insertId || result.affectedRows;
  }

  /**
   * Remove/revoke a role assignment from a user
   */
  async removeRoleAssignment(roleId, userId, operatorUserId, conn = db) {
    return conn.query(
      `UPDATE user_roles SET deleted_at = CURRENT_TIMESTAMP, deleted_by = ?, is_active = FALSE, assignment_status = 'REVOKED'
       WHERE role_id = ? AND user_id = ? AND deleted_at IS NULL`,
      [operatorUserId, roleId, userId]
    );
  }

  /**
   * Check if assigning roleId to userId violates any active Role Conflicts
   */
  async findRoleConflictsForUser(userId, targetRoleId) {
    const existingRoles = await db.query(
      `SELECT ur.role_id, r.role_name, r.role_code
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ? AND ur.is_active = TRUE AND ur.deleted_at IS NULL`,
      [userId]
    );

    if (existingRoles.length === 0) return [];

    const existingRoleIds = existingRoles.map((r) => r.role_id);
    const placeholders = existingRoleIds.map(() => '?').join(', ');

    const conflicts = await db.query(
      `SELECT rc.id, rc.conflict_code, rc.conflict_name, rc.description, rc.severity,
              r1.role_name AS role1_name, r2.role_name AS role2_name
       FROM role_conflicts rc
       JOIN roles r1 ON rc.role_id_1 = r1.id
       JOIN roles r2 ON rc.role_id_2 = r2.id
       WHERE rc.is_active = TRUE
         AND ((rc.role_id_1 = ? AND rc.role_id_2 IN (${placeholders}))
           OR (rc.role_id_2 = ? AND rc.role_id_1 IN (${placeholders})))`,
      [targetRoleId, ...existingRoleIds, targetRoleId, ...existingRoleIds]
    );

    return conflicts;
  }

  /**
   * Check if assigning roleId to userId violates Segregation of Duties (SoD) permission rules
   */
  async findSodViolationsForUser(userId, targetRoleId) {
    // Target role permissions
    const targetPerms = await db.query(
      `SELECT permission_id FROM role_permissions WHERE role_id = ?`,
      [targetRoleId]
    );
    if (targetPerms.length === 0) return [];
    const targetPermIds = targetPerms.map((p) => p.permission_id);

    // Existing permissions held by user through other roles
    const existingPerms = await db.query(
      `SELECT DISTINCT rp.permission_id
       FROM user_roles ur
       JOIN role_permissions rp ON ur.role_id = rp.role_id
       WHERE ur.user_id = ? AND ur.is_active = TRUE AND ur.deleted_at IS NULL AND ur.role_id != ?`,
      [userId, targetRoleId]
    );
    if (existingPerms.length === 0) return [];
    const existingPermIds = existingPerms.map((p) => p.permission_id);

    const targetPlaceholders = targetPermIds.map(() => '?').join(', ');
    const existingPlaceholders = existingPermIds.map(() => '?').join(', ');

    const sodViolations = await db.query(
      `SELECT sod.id, sod.rule_code, sod.rule_name, sod.description, sod.risk_level,
              p1.permission_code AS perm1_code, p2.permission_code AS perm2_code
       FROM sod_rules sod
       JOIN permissions p1 ON sod.permission_id_1 = p1.id
       JOIN permissions p2 ON sod.permission_id_2 = p2.id
       WHERE sod.is_active = TRUE
         AND ((sod.permission_id_1 IN (${targetPlaceholders}) AND sod.permission_id_2 IN (${existingPlaceholders}))
           OR (sod.permission_id_2 IN (${targetPlaceholders}) AND sod.permission_id_1 IN (${existingPlaceholders})))`,
      [...targetPermIds, ...existingPermIds, ...targetPermIds, ...existingPermIds]
    );

    return sodViolations;
  }

  /**
   * Process temporary role assignment expirations
   */
  async processExpiredAssignments() {
    return db.query(
      `UPDATE user_roles
       SET assignment_status = 'EXPIRED', is_active = FALSE
       WHERE is_active = TRUE
         AND assignment_status = 'ACTIVE'
         AND end_date IS NOT NULL
         AND end_date <= CURRENT_TIMESTAMP`
    );
  }
}

module.exports = new RoleAssignmentRepository();
