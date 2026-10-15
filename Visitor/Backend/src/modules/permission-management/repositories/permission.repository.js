const db = require('../../../config/db');
const { clearAllPermissionCache } = require('../../../middleware/rbac');

class PermissionRepository {
  // ── Statistics ─────────────────────────────────────────────────────────────
  async findStatistics() {
    const totalRows = await db.query(`SELECT COUNT(*) AS total FROM permissions WHERE deleted_at IS NULL`);
    const activeRows = await db.query(`SELECT COUNT(*) AS total FROM permissions WHERE status = 'ACTIVE' AND deleted_at IS NULL`);
    const inactiveRows = await db.query(`SELECT COUNT(*) AS total FROM permissions WHERE status = 'INACTIVE' AND deleted_at IS NULL`);
    const systemRows = await db.query(`SELECT COUNT(*) AS total FROM permissions WHERE (is_system_permission = 1 OR permission_type = 'SYSTEM') AND deleted_at IS NULL`);
    const customRows = await db.query(`SELECT COUNT(*) AS total FROM permissions WHERE (is_system_permission = 0 OR permission_type = 'CUSTOM') AND deleted_at IS NULL`);
    const highRiskRows = await db.query(`SELECT COUNT(*) AS total FROM permissions WHERE risk_level = 'HIGH' AND deleted_at IS NULL`);
    const criticalRows = await db.query(`SELECT COUNT(*) AS total FROM permissions WHERE risk_level = 'CRITICAL' AND deleted_at IS NULL`);
    
    const assignedRows = await db.query(`
      SELECT COUNT(DISTINCT p.id) AS total 
      FROM permissions p 
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      LEFT JOIN user_permissions up ON p.id = up.permission_id
      WHERE (rp.role_id IS NOT NULL OR up.user_id IS NOT NULL) AND p.deleted_at IS NULL
    `);

    const unusedRows = await db.query(`
      SELECT COUNT(*) AS total 
      FROM permissions p 
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      LEFT JOIN user_permissions up ON p.id = up.permission_id
      WHERE rp.role_id IS NULL AND up.user_id IS NULL AND p.deleted_at IS NULL
    `);

    const groupRows = await db.query(`SELECT COUNT(*) AS total FROM permission_groups`);
    const moduleRows = await db.query(`SELECT COUNT(DISTINCT module) AS total FROM permissions WHERE deleted_at IS NULL AND module IS NOT NULL`);
    const resourceRows = await db.query(`SELECT COUNT(DISTINCT resource) AS total FROM permissions WHERE deleted_at IS NULL AND resource IS NOT NULL`);
    const actionRows = await db.query(`SELECT COUNT(DISTINCT action) AS total FROM permissions WHERE deleted_at IS NULL AND action IS NOT NULL`);

    return {
      totalPermissions: totalRows[0]?.total || 0,
      activePermissions: activeRows[0]?.total || 0,
      inactivePermissions: inactiveRows[0]?.total || 0,
      systemPermissions: systemRows[0]?.total || 0,
      customPermissions: customRows[0]?.total || 0,
      assignedPermissions: assignedRows[0]?.total || 0,
      unusedPermissions: unusedRows[0]?.total || 0,
      highRiskPermissions: highRiskRows[0]?.total || 0,
      criticalPermissions: criticalRows[0]?.total || 0,
      permissionGroups: groupRows[0]?.total || 0,
      modules: moduleRows[0]?.total || 0,
      resources: resourceRows[0]?.total || 0,
      actions: actionRows[0]?.total || 0,
    };
  }

  // ── Find All Permissions (Search, Filter, Sort, Pagination) ───────────────
  async findAll(filters = {}) {
    const page = parseInt(filters.page || '1', 10);
    const limit = Math.min(parseInt(filters.limit || '25', 10), 100);
    const offset = (page - 1) * limit;

    let whereClause = `WHERE p.deleted_at IS NULL`;
    const params = [];

    if (filters.search) {
      whereClause += ` AND (p.permission_name LIKE ? OR p.permission_code LIKE ? OR p.module LIKE ? OR p.resource LIKE ? OR p.action LIKE ?)`;
      const s = `%${filters.search.trim()}%`;
      params.push(s, s, s, s, s);
    }

    if (filters.module && filters.module !== 'ALL') {
      whereClause += ` AND p.module = ?`;
      params.push(filters.module);
    }

    if (filters.resource && filters.resource !== 'ALL') {
      whereClause += ` AND p.resource = ?`;
      params.push(filters.resource);
    }

    if (filters.action && filters.action !== 'ALL') {
      whereClause += ` AND p.action = ?`;
      params.push(filters.action);
    }

    if (filters.scope_type && filters.scope_type !== 'ALL') {
      whereClause += ` AND p.scope_type = ?`;
      params.push(filters.scope_type);
    }

    if (filters.risk_level && filters.risk_level !== 'ALL') {
      whereClause += ` AND p.risk_level = ?`;
      params.push(filters.risk_level);
    }

    if (filters.status && filters.status !== 'ALL') {
      whereClause += ` AND p.status = ?`;
      params.push(filters.status);
    }

    if (filters.permission_type && filters.permission_type !== 'ALL') {
      whereClause += ` AND (p.permission_type = ? OR (p.is_system_permission = 1 AND ? = 'SYSTEM'))`;
      params.push(filters.permission_type, filters.permission_type);
    }

    if (filters.usage === 'unused') {
      whereClause += ` AND p.id NOT IN (SELECT DISTINCT permission_id FROM role_permissions) AND p.id NOT IN (SELECT DISTINCT permission_id FROM user_permissions)`;
    } else if (filters.usage === 'assigned') {
      whereClause += ` AND (p.id IN (SELECT DISTINCT permission_id FROM role_permissions) OR p.id IN (SELECT DISTINCT permission_id FROM user_permissions))`;
    }

    // Whitelisted Sort Fields
    const validSortFields = {
      permission_name: 'p.permission_name',
      permission_code: 'p.permission_code',
      module: 'p.module',
      resource: 'p.resource',
      action: 'p.action',
      risk_level: 'p.risk_level',
      created_at: 'p.created_at',
      status: 'p.status'
    };

    const sortOrder = filters.sortOrder === 'DESC' ? 'DESC' : 'ASC';
    const sortBy = validSortFields[filters.sortBy] ? `${validSortFields[filters.sortBy]} ${sortOrder}` : 'p.module ASC, p.permission_name ASC';

    const countSql = `SELECT COUNT(*) AS total FROM permissions p ${whereClause}`;
    const countRows = await db.query(countSql, params);
    const total = countRows[0]?.total || 0;

    const dataSql = `
      SELECT p.*,
             (SELECT COUNT(*) FROM role_permissions rp WHERE rp.permission_id = p.id) AS role_count,
             (SELECT COUNT(*) FROM user_permissions up WHERE up.permission_id = p.id) AS user_count
      FROM permissions p
      ${whereClause}
      ORDER BY ${sortBy}
      LIMIT ? OFFSET ?
    `;

    const data = await db.query(dataSql, [...params, limit, offset]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  // ── Find By ID ─────────────────────────────────────────────────────────────
  async findById(id) {
    const rows = await db.query(`
      SELECT p.*,
             (SELECT COUNT(*) FROM role_permissions rp WHERE rp.permission_id = p.id) AS role_count,
             (SELECT COUNT(*) FROM user_permissions up WHERE up.permission_id = p.id) AS user_count
      FROM permissions p
      WHERE p.id = ? AND p.deleted_at IS NULL
    `, [id]);

    if (rows.length === 0) return null;
    const permission = rows[0];

    // Fetch Assigned Roles
    const roles = await db.query(`
      SELECT r.id, r.role_name, r.role_code, r.scope_type, r.status, rp.created_at AS assigned_at
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      WHERE rp.permission_id = ? AND r.deleted_at IS NULL
      ORDER BY r.role_name ASC
    `, [id]);

    // Fetch Assigned Direct Users
    const users = await db.query(`
      SELECT u.id, u.full_name, u.email, u.user_code, u.role, up.assignment_type, up.scope_type, up.created_at AS assigned_at
      FROM user_permissions up
      JOIN users u ON up.user_id = u.id
      WHERE up.permission_id = ? AND u.deleted_at IS NULL
      ORDER BY u.full_name ASC
    `, [id]);

    // Fetch Dependencies
    const dependencies = await db.query(`
      SELECT pd.id, pd.dependency_type, p.id AS depends_on_id, p.permission_name, p.permission_code, p.module
      FROM permission_dependencies pd
      JOIN permissions p ON pd.depends_on_permission_id = p.id
      WHERE pd.permission_id = ?
    `, [id]);

    // Fetch Conflicts
    const conflicts = await db.query(`
      SELECT pc.id, pc.conflict_name, pc.risk_level, pc.description,
             p.id AS conflicting_permission_id, p.permission_name, p.permission_code
      FROM permission_conflicts pc
      JOIN permissions p ON (CASE WHEN pc.permission_id_1 = ? THEN pc.permission_id_2 ELSE pc.permission_id_1 END) = p.id
      WHERE (pc.permission_id_1 = ? OR pc.permission_id_2 = ?)
    `, [id, id, id]);

    // Fetch Version History
    const versions = await db.query(`
      SELECT * FROM permission_versions WHERE permission_id = ? ORDER BY version_number DESC
    `, [id]);

    return {
      ...permission,
      roles,
      users,
      dependencies,
      conflicts,
      versions
    };
  }

  // ── Find By Code ───────────────────────────────────────────────────────────
  async findByCode(code) {
    const rows = await db.query(`SELECT * FROM permissions WHERE permission_code = ? AND deleted_at IS NULL`, [code]);
    return rows[0] || null;
  }

  // ── Create Permission ──────────────────────────────────────────────────────
  async createPermission(data, actorId = null) {
    const existing = await this.findByCode(data.permission_code);
    if (existing) {
      const err = new Error(`Permission code '${data.permission_code}' already exists.`);
      err.code = 'PERMISSION_CODE_EXISTS';
      throw err;
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(`
        INSERT INTO permissions (
          permission_code, permission_name, module, resource, action,
          scope_type, permission_type, risk_level, is_sensitive,
          requires_approval, requires_audit, description, status, version, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `, [
        data.permission_code,
        data.permission_name,
        data.module || 'GENERAL',
        data.resource || data.module || 'GENERAL',
        data.action || 'VIEW',
        data.scope_type || 'ORGANIZATION',
        data.permission_type || 'CUSTOM',
        data.risk_level || 'LOW',
        data.is_sensitive ? 1 : 0,
        data.requires_approval ? 1 : 0,
        data.requires_audit !== undefined ? (data.requires_audit ? 1 : 0) : 1,
        data.description || '',
        data.status || 'ACTIVE',
        actorId
      ]);

      const newId = result.insertId;

      // Version 1 snapshot
      const snapshot = {
        id: newId,
        permission_code: data.permission_code,
        permission_name: data.permission_name,
        module: data.module,
        resource: data.resource,
        action: data.action,
        scope_type: data.scope_type,
        risk_level: data.risk_level,
        status: data.status || 'ACTIVE'
      };

      await conn.query(`
        INSERT INTO permission_versions (permission_id, version_number, snapshot_json, changed_by, change_reason)
        VALUES (?, 1, ?, ?, 'Initial Permission Creation')
      `, [newId, JSON.stringify(snapshot), actorId]);

      // Audit Log
      await conn.query(`
        INSERT INTO audit_logs (action, user_id, module, entity, record_id, new_values, created_at)
        VALUES ('PERMISSION_CREATED', ?, 'PERMISSION', 'permissions', ?, ?, NOW())
      `, [actorId, newId, JSON.stringify({ permission_id: newId, code: data.permission_code })]);

      await conn.commit();
      clearAllPermissionCache();
      return this.findById(newId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // ── Update Permission ──────────────────────────────────────────────────────
  async updatePermission(id, data, actorId = null) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Permission not found.');
      err.code = 'PERMISSION_NOT_FOUND';
      throw err;
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const newVersion = (existing.version || 1) + 1;

      await conn.query(`
        UPDATE permissions SET
          permission_name = COALESCE(?, permission_name),
          module = COALESCE(?, module),
          resource = COALESCE(?, resource),
          action = COALESCE(?, action),
          scope_type = COALESCE(?, scope_type),
          risk_level = COALESCE(?, risk_level),
          is_sensitive = COALESCE(?, is_sensitive),
          requires_approval = COALESCE(?, requires_approval),
          requires_audit = COALESCE(?, requires_audit),
          description = COALESCE(?, description),
          status = COALESCE(?, status),
          version = ?,
          updated_by = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        data.permission_name,
        data.module,
        data.resource,
        data.action,
        data.scope_type,
        data.risk_level,
        data.is_sensitive !== undefined ? (data.is_sensitive ? 1 : 0) : undefined,
        data.requires_approval !== undefined ? (data.requires_approval ? 1 : 0) : undefined,
        data.requires_audit !== undefined ? (data.requires_audit ? 1 : 0) : undefined,
        data.description,
        data.status,
        newVersion,
        actorId,
        id
      ]);

      const updated = await this.findById(id);

      // Snapshot version update
      await conn.query(`
        INSERT INTO permission_versions (permission_id, version_number, snapshot_json, changed_by, change_reason)
        VALUES (?, ?, ?, ?, ?)
      `, [id, newVersion, JSON.stringify(updated), actorId, data.change_reason || 'Permission definition modified']);

      await conn.query(`
        INSERT INTO audit_logs (action, user_id, module, entity, record_id, new_values, created_at)
        VALUES ('PERMISSION_UPDATED', ?, 'PERMISSION', 'permissions', ?, ?, NOW())
      `, [actorId, id, JSON.stringify({ permission_id: id, version: newVersion })]);

      await conn.commit();
      clearAllPermissionCache();
      return updated;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // ── Status Operations (Activate, Deactivate, Archive) ─────────────────────
  async setStatus(id, status, actorId = null) {
    await db.query(`UPDATE permissions SET status = ?, updated_at = NOW(), updated_by = ? WHERE id = ?`, [status, actorId, id]);
    clearAllPermissionCache();
    return this.findById(id);
  }

  async archive(id, actorId = null) {
    await db.query(`UPDATE permissions SET status = 'INACTIVE', deleted_at = NOW(), deleted_by = ? WHERE id = ?`, [actorId, id]);
    clearAllPermissionCache();
    return true;
  }

  async restore(id, actorId = null) {
    await db.query(`UPDATE permissions SET status = 'ACTIVE', deleted_at = NULL, updated_by = ? WHERE id = ?`, [actorId, id]);
    clearAllPermissionCache();
    return this.findById(id);
  }

  // ── Clone Permission ───────────────────────────────────────────────────────
  async clonePermission(id, newCode, newName, actorId = null) {
    const source = await this.findById(id);
    if (!source) throw new Error('Source permission not found');

    return this.createPermission({
      permission_code: newCode,
      permission_name: newName || `${source.permission_name} (Clone)`,
      module: source.module,
      resource: source.resource,
      action: source.action,
      scope_type: source.scope_type,
      permission_type: 'CUSTOM',
      risk_level: source.risk_level,
      is_sensitive: source.is_sensitive,
      requires_approval: source.requires_approval,
      requires_audit: source.requires_audit,
      description: `Cloned from ${source.permission_code}. ${source.description || ''}`,
      status: 'ACTIVE'
    }, actorId);
  }

  // ── Permission Matrix Data ─────────────────────────────────────────────────
  async getPermissionMatrix() {
    const roles = await db.query(`SELECT id, role_name, role_code, scope_type FROM roles WHERE deleted_at IS NULL ORDER BY role_name ASC`);
    const permissions = await db.query(`SELECT id, permission_code, permission_name, module, resource, action, risk_level, status FROM permissions WHERE deleted_at IS NULL ORDER BY module ASC, permission_name ASC`);
    const rolePermissions = await db.query(`SELECT role_id, permission_id FROM role_permissions`);

    const modulesMap = {};
    for (const p of permissions) {
      const mod = p.module || 'GENERAL';
      if (!modulesMap[mod]) modulesMap[mod] = [];
      modulesMap[mod].push(p);
    }

    return {
      roles,
      modules: Object.keys(modulesMap).map(m => ({ module_name: m, permissions: modulesMap[m] })),
      assignments: rolePermissions
    };
  }

  async updateMatrixAssignments(matrixAssignments, actorId = null) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(`TRUNCATE TABLE role_permissions`);

      if (Array.isArray(matrixAssignments) && matrixAssignments.length > 0) {
        const placeholders = matrixAssignments.map(() => '(?, ?)').join(', ');
        const params = matrixAssignments.flatMap(item => [item.role_id, item.permission_id]);
        await conn.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES ${placeholders}`, params);
      }

      await conn.query(`
        INSERT INTO audit_logs (action, user_id, module, entity, new_values, created_at)
        VALUES ('PERMISSION_MATRIX_UPDATED', ?, 'PERMISSION', 'role_permissions', ?, NOW())
      `, [actorId, JSON.stringify({ total_assignments: matrixAssignments.length })]);

      await conn.commit();
      clearAllPermissionCache();
      return true;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // ── Groups, Templates, Dependencies ──────────────────────────────────────
  async findGroups() {
    return db.query(`SELECT * FROM permission_groups ORDER BY group_name ASC`);
  }

  async findTemplates() {
    return db.query(`SELECT * FROM permission_templates ORDER BY template_name ASC`);
  }

  // ── Centralized Authorization Engine Resolution ────────────────────────────
  async authorizeUserRequest(userId, requiredPermissionCode, targetResource = null) {
    if (!userId || !requiredPermissionCode) return { authorized: false, reason: 'Invalid arguments' };

    const userRows = await db.query(`SELECT id, role, account_status FROM users WHERE id = ? AND deleted_at IS NULL`, [userId]);
    if (userRows.length === 0) return { authorized: false, reason: 'User not found' };
    const user = userRows[0];

    if (user.account_status !== 'ACTIVE') return { authorized: false, reason: 'User account is not ACTIVE' };
    if (user.role === 'admin') return { authorized: true, reason: 'Admin bypass' };

    // Resolve user roles
    const roleRows = await db.query(`SELECT role_id FROM user_roles WHERE user_id = ? AND is_active = 1`, [userId]);
    const roleIds = roleRows.map(r => r.role_id);

    // Resolve permissions from roles
    let rolePerms = [];
    if (roleIds.length > 0) {
      rolePerms = await db.query(`
        SELECT p.*
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id IN (?) AND p.status = 'ACTIVE' AND p.deleted_at IS NULL
      `, [roleIds]);
    }

    // Resolve direct user permissions
    const directPerms = await db.query(`
      SELECT p.*, up.assignment_type, up.scope_type AS direct_scope
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = ? AND (up.expires_at IS NULL OR up.expires_at > NOW()) AND p.status = 'ACTIVE'
    `, [userId]);

    // Explicit DENY check
    const denied = directPerms.filter(dp => dp.assignment_type === 'DENY' && dp.permission_code.toLowerCase() === requiredPermissionCode.toLowerCase());
    if (denied.length > 0) return { authorized: false, reason: 'Explicit DENY assignment' };

    // Combined ALLOW check
    const matchedPerm = [...rolePerms, ...directPerms.filter(dp => dp.assignment_type === 'ALLOW')].find(
      p => p.permission_code.toLowerCase() === requiredPermissionCode.toLowerCase()
    );

    if (!matchedPerm) return { authorized: false, reason: 'Permission code not assigned to user' };

    // Scope Type Validation (SELF, DEPARTMENT, BRANCH, ORGANIZATION)
    if (matchedPerm.scope_type === 'SELF' && targetResource) {
      if (targetResource.user_id && targetResource.user_id !== userId) {
        return { authorized: false, reason: 'SELF scope violation: Cannot access another user resource' };
      }
    }

    return { authorized: true, reason: 'Authorized by RBAC Engine', permission: matchedPerm };
  }
}

module.exports = new PermissionRepository();
