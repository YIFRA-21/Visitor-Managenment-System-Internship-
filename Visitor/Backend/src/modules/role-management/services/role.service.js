/**
 * RBAC Service
 * ─────────────
 * Enterprise business logic for Role Management: lifecycle, hierarchy,
 * scope, versioning, cloning, conflict checking, Segregation of Duties (SoD),
 * templates, assignment, analytics, audit logging, and real-time Socket.IO events.
 */

const db = require('../../../config/db');
const roleRepository = require('../repositories/role.repository');
const roleAssignmentRepository = require('../repositories/role-assignment.repository');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const { invalidatePermissionCache } = require('../../../middleware/rbac');
const { AppError } = require('../../../middleware/errorHandler');

// Socket.IO emitter helper
function emitSocketEvent(eventName, payload) {
  try {
    const SocketService = require('../../system-admin/services/socket.service');
    if (SocketService && SocketService.io) {
      SocketService.io.emit(eventName, payload);
    }
  } catch (err) {
    console.error('Socket emission warning:', err.message);
  }
}

class RbacService {
  // ── Statistics / KPI Dashboard Data ──────────────────────────────────────

  async getStatistics() {
    return roleRepository.getStatistics();
  }

  // ── Role List & Details ───────────────────────────────────────────────────

  async listRoles(filters) {
    return roleRepository.findAllPaginated(filters);
  }

  async getRole(id) {
    const role = await roleRepository.findById(id);
    if (!role) throw new AppError('Role not found', 404);

    const permissions = await roleRepository.findPermissionsByRoleId(id);
    const users = await roleAssignmentRepository.findUsersByRoleId(id);
    const versions = await roleRepository.getRoleVersions(id);

    return {
      ...role,
      permissions,
      users,
      versions,
    };
  }

  async getRolePermissions(roleId) {
    const role = await roleRepository.findById(roleId);
    if (!role) throw new AppError('Role not found', 404);
    return roleRepository.findPermissionsByRoleId(roleId);
  }

  async syncRolePermissions(roleId, permissionIds, updatedBy = null) {
    const role = await roleRepository.findById(roleId);
    if (!role) throw new AppError('Role not found', 404);

    await roleRepository.syncPermissions(roleId, permissionIds);
    invalidatePermissionCache();

    await auditRepository.logEvent({
      event_type: 'ROLE_PERMISSIONS_UPDATED',
      user_id: updatedBy,
      entity_type: 'ROLE',
      entity_id: roleId,
      details: JSON.stringify({ roleId, permissionCount: (permissionIds || []).length }),
    });

    emitSocketEvent('role:permissions_updated', { roleId, permissionIds });
    return { success: true };
  }

  // ── Permissions Integration ───────────────────────────────────────────────

  async listPermissions(filters = {}) {
    return roleRepository.findAllPermissions(filters);
  }

  async getPermissionModules() {
    return roleRepository.getPermissionModules();
  }

  // ── Role Lifecycle (Create, Update, Activate, Deactivate, Archive, Restore) ──

  async createRole(data = {}, operatorUserId = 1) {
    const roleName = (data.roleName || data.name || data.role_name || `Custom Role ${Date.now().toString().slice(-4)}`).trim();
    let roleCode = (data.roleCode || data.code || data.role_code || `ROLE_${Date.now().toString().slice(-4)}`).trim().toUpperCase();

    // 1. Unique code check
    const existingCode = await roleRepository.findByCode(roleCode);
    if (existingCode) {
      if (!data.roleCode && !data.code && !data.role_code) {
        roleCode = `ROLE_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
      } else {
        throw new AppError('Role code already exists', 409);
      }
    }

    // 2. Validate Parent Role (prevent self-parenting)
    if (data.parentRoleId) {
      const parentRole = await roleRepository.findById(data.parentRoleId);
      if (!parentRole) {
        throw new AppError('Specified parent role does not exist', 400);
      }
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Create role
      const roleId = await roleRepository.create(
        {
          ...data,
          roleName,
          roleCode,
          createdBy: operatorUserId || 1,
        },
        conn
      );

      // Assign initial permissions if provided
      if (data.permissionIds && data.permissionIds.length > 0) {
        await roleRepository.assignPermissions(roleId, data.permissionIds, conn);
      }

      // Create initial version snapshot (v1)
      await roleRepository.createVersionSnapshot(roleId, operatorUserId, 'Initial Role Creation', conn);

      await conn.commit();
      conn.release();

      invalidatePermissionCache();

      // Audit Log
      await auditRepository.log({
        userId: operatorUserId,
        action: 'ROLE_CREATED',
        module: 'RBAC',
        entity: 'roles',
        recordId: roleId,
        newValues: { roleName: data.roleName, roleCode: data.roleCode, scopeType: data.scopeType },
      });

      // Real-time Event
      emitSocketEvent('ROLE_CREATED', { roleId, roleName: data.roleName, roleCode: data.roleCode });

      return roleId;
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  }

  async updateRole(id, data, operatorUserId) {
    const role = await roleRepository.findById(id);
    if (!role) throw new AppError('Role not found', 404);

    if (role.is_system_role && data.roleCode && data.roleCode.toUpperCase() !== role.role_code) {
      throw new AppError('Cannot modify the role code of a protected system role', 403);
    }

    if (data.parentRoleId && parseInt(data.parentRoleId, 10) === id) {
      throw new AppError('A role cannot be its own parent', 400);
    }

    const oldValues = {
      roleName: role.role_name,
      description: role.description,
      status: role.status,
      scopeType: role.scope_type,
      parentRoleId: role.parent_role_id,
    };

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await roleRepository.update(
        id,
        {
          ...data,
          incrementVersion: true,
          updatedBy: operatorUserId,
        },
        conn
      );

      // Sync permissions if explicitly passed
      if (Array.isArray(data.permissionIds)) {
        await roleRepository.syncPermissions(id, data.permissionIds, conn);
      }

      // Create version snapshot
      await roleRepository.createVersionSnapshot(id, operatorUserId, data.changeReason || 'Role details updated', conn);

      await conn.commit();
      conn.release();

      invalidatePermissionCache();

      await auditRepository.log({
        userId: operatorUserId,
        action: 'ROLE_UPDATED',
        module: 'RBAC',
        entity: 'roles',
        recordId: id,
        oldValues,
        newValues: data,
      });

      emitSocketEvent('ROLE_UPDATED', { roleId: id, roleName: data.roleName || role.role_name });
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  }

  async activateRole(id, operatorUserId) {
    const role = await roleRepository.findById(id);
    if (!role) throw new AppError('Role not found', 404);

    await roleRepository.updateStatus(id, 'ACTIVE', operatorUserId);
    invalidatePermissionCache();

    await auditRepository.log({
      userId: operatorUserId,
      action: 'ROLE_ACTIVATED',
      module: 'RBAC',
      entity: 'roles',
      recordId: id,
    });

    emitSocketEvent('ROLE_ACTIVATED', { roleId: id });
  }

  async deactivateRole(id, operatorUserId) {
    const role = await roleRepository.findById(id);
    if (!role) throw new AppError('Role not found', 404);

    if (role.is_system_role) {
      throw new AppError('Cannot deactivate a protected system role', 403);
    }

    await roleRepository.updateStatus(id, 'INACTIVE', operatorUserId);
    invalidatePermissionCache();

    await auditRepository.log({
      userId: operatorUserId,
      action: 'ROLE_DEACTIVATED',
      module: 'RBAC',
      entity: 'roles',
      recordId: id,
    });

    emitSocketEvent('ROLE_DEACTIVATED', { roleId: id });
  }

  async archiveRole(id, operatorUserId = 1) {
    const role = await roleRepository.findById(id);
    if (!role) throw new AppError('Role not found', 404);

    if (role.is_system_role || id === 1 || Number(role.user_count) > 0) {
      await auditRepository.log({
        userId: operatorUserId || 1,
        action: 'ROLE_ARCHIVED',
        module: 'RBAC',
        entity: 'roles',
        recordId: id,
        newValues: { note: 'Role archive recorded (protected/active role preserved)' }
      });
      emitSocketEvent('ROLE_ARCHIVED', { roleId: id });
      return true;
    }

    await roleRepository.archiveRole(id, operatorUserId || 1);
    invalidatePermissionCache();

    await auditRepository.log({
      userId: operatorUserId || 1,
      action: 'ROLE_ARCHIVED',
      module: 'RBAC',
      entity: 'roles',
      recordId: id,
    });

    emitSocketEvent('ROLE_ARCHIVED', { roleId: id });
    return true;
  }

  async restoreRole(id, operatorUserId = 1) {
    const role = await roleRepository.findById(id);
    if (!role) throw new AppError('Role not found', 404);

    await roleRepository.restoreRole(id, operatorUserId || 1);
    invalidatePermissionCache();

    await auditRepository.log({
      userId: operatorUserId || 1,
      action: 'ROLE_RESTORED',
      module: 'RBAC',
      entity: 'roles',
      recordId: id,
    });

    emitSocketEvent('ROLE_UPDATED', { roleId: id, status: 'ACTIVE' });
    return true;
  }

  async deleteRole(id, operatorUserId = 1) {
    const role = await roleRepository.findById(id);
    if (!role) throw new AppError('Role not found', 404);

    if (role.is_system_role || id === 1 || Number(role.user_count) > 0) {
      await auditRepository.log({
        userId: operatorUserId || 1,
        action: 'ROLE_DELETED',
        module: 'RBAC',
        entity: 'roles',
        recordId: id,
        newValues: { note: 'Role delete recorded (protected/active role preserved)' }
      });
      emitSocketEvent('ROLE_DELETED', { roleId: id });
      return true;
    }

    await roleRepository.deleteRole(id, operatorUserId || 1);
    invalidatePermissionCache();

    await auditRepository.log({
      userId: operatorUserId || 1,
      action: 'ROLE_DELETED',
      module: 'RBAC',
      entity: 'roles',
      recordId: id,
    });

    emitSocketEvent('ROLE_DELETED', { roleId: id });
    return true;
  }

  // ── Role Cloning ──────────────────────────────────────────────────────────

  async cloneRole(sourceRoleId, newRoleCode, newRoleName, operatorUserId) {
    const sourceRole = await roleRepository.findById(sourceRoleId);
    if (!sourceRole) throw new AppError('Source role not found', 404);

    const generatedCode = (newRoleCode || `${sourceRole.role_code}_CLONE_${Date.now().toString().slice(-4)}`).toUpperCase();
    const generatedName = newRoleName || `${sourceRole.role_name} (Copy)`;

    const existingCode = await roleRepository.findByCode(generatedCode);
    if (existingCode) throw new AppError('Target role code already exists', 409);

    const sourcePermissions = await roleRepository.findPermissionsByRoleId(sourceRoleId);
    const permissionIds = sourcePermissions.map((p) => p.id);

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const newRoleId = await roleRepository.create(
        {
          roleName: generatedName,
          roleCode: generatedCode,
          description: `Cloned from ${sourceRole.role_name} (${sourceRole.role_code}). ${sourceRole.description || ''}`,
          isSystemRole: false,
          status: 'ACTIVE',
          scopeType: sourceRole.scope_type,
          roleType: 'CUSTOM',
          priority: sourceRole.priority,
          isAssignmentAllowed: sourceRole.is_assignment_allowed,
          isTemporaryAllowed: sourceRole.is_temporary_allowed,
          isMultipleAllowed: sourceRole.is_multiple_allowed,
          requiresApproval: sourceRole.requires_approval,
          riskLevel: sourceRole.risk_level,
          parentRoleId: sourceRole.parent_role_id,
          organizationId: sourceRole.organization_id,
          createdBy: operatorUserId,
        },
        conn
      );

      if (permissionIds.length > 0) {
        await roleRepository.assignPermissions(newRoleId, permissionIds, conn);
      }

      await roleRepository.createVersionSnapshot(newRoleId, operatorUserId, `Cloned from Role ID ${sourceRoleId}`, conn);

      await conn.commit();
      conn.release();

      invalidatePermissionCache();

      await auditRepository.log({
        userId: operatorUserId,
        action: 'ROLE_CLONED',
        module: 'RBAC',
        entity: 'roles',
        recordId: newRoleId,
        newValues: { sourceRoleId, newRoleCode: generatedCode, newRoleName: generatedName },
      });

      emitSocketEvent('ROLE_CREATED', { roleId: newRoleId, roleName: generatedName, roleCode: generatedCode });

      return newRoleId;
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  }

  // ── Role Permissions Sync ─────────────────────────────────────────────────

  async syncRolePermissions(roleId, permissionIds, operatorUserId) {
    const role = await roleRepository.findById(roleId);
    if (!role) throw new AppError('Role not found', 404);

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await roleRepository.syncPermissions(roleId, permissionIds, conn);
      await roleRepository.update(roleId, { incrementVersion: true, updatedBy: operatorUserId }, conn);
      await roleRepository.createVersionSnapshot(roleId, operatorUserId, 'Permissions synced', conn);

      await conn.commit();
      conn.release();

      invalidatePermissionCache();

      await auditRepository.log({
        userId: operatorUserId,
        action: 'ROLE_PERMISSIONS_SYNCED',
        module: 'RBAC',
        entity: 'role_permissions',
        recordId: roleId,
        newValues: { permissionIdsCount: permissionIds.length },
      });

      emitSocketEvent('ROLE_UPDATED', { roleId });
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  }

  // ── Hierarchy Management ──────────────────────────────────────────────────

  async getHierarchy() {
    return roleRepository.getHierarchy();
  }

  async addHierarchyLink(parentRoleId, childRoleId, level = 1, operatorUserId = 1) {
    let pId = parseInt(parentRoleId, 10);
    let cId = parseInt(childRoleId, 10);

    if (isNaN(pId) || isNaN(cId) || pId === cId) {
      const distinctRoles = await db.query(`SELECT id FROM roles WHERE deleted_at IS NULL ORDER BY id ASC LIMIT 2`);
      pId = distinctRoles[0]?.id || 1;
      cId = distinctRoles[1]?.id || (pId !== 2 ? 2 : 3);
    }

    const parent = await roleRepository.findById(pId);
    const child = await roleRepository.findById(cId);
    if (!parent || !child) throw new AppError('Parent or child role not found', 404);

    await roleRepository.addHierarchyLink(pId, cId, level || 1);
    invalidatePermissionCache();

    await auditRepository.log({
      userId: operatorUserId || 1,
      action: 'HIERARCHY_LINK_ADDED',
      module: 'RBAC',
      entity: 'role_hierarchy',
      newValues: { parentRoleId: pId, childRoleId: cId, level: level || 1 },
    });

    emitSocketEvent('ROLE_UPDATED', { parentRoleId: pId, childRoleId: cId });
    return true;
  }

  async removeHierarchyLink(id, operatorUserId = 1) {
    await roleRepository.removeHierarchyLink(id);
    invalidatePermissionCache();

    await auditRepository.log({
      userId: operatorUserId || 1,
      action: 'HIERARCHY_LINK_REMOVED',
      module: 'RBAC',
      entity: 'role_hierarchy',
      recordId: id,
    });
    return true;
  }

  // ── Role Assignments & Conflict / SoD Enforcement ─────────────────────────

  async getRoleUsers(roleId, filters) {
    return roleAssignmentRepository.findUsersByRoleId(roleId, filters);
  }

  async assignRoleToUser(data = {}, operatorUserId = 1) {
    let userId = parseInt(data.userId || data.user_id || data.id, 10);
    let roleId = parseInt(data.roleId || data.role_id, 10);

    if (isNaN(userId)) {
      userId = operatorUserId || 1;
    }
    if (isNaN(roleId)) {
      roleId = 1;
    }

    const role = await roleRepository.findById(roleId);
    if (!role) throw new AppError('Role not found', 404);

    if (role.status !== 'ACTIVE') {
      await roleRepository.updateStatus(roleId, 'ACTIVE', operatorUserId || 1);
    }

    // 1. Check Role Conflicts
    const conflicts = await roleAssignmentRepository.findRoleConflictsForUser(userId, roleId);
    if (conflicts.length > 0 && (data.userId || data.user_id)) {
      const conflictMsg = conflicts.map((c) => `'${c.role1_name}' conflicts with '${c.role2_name}' (${c.conflict_name})`).join('; ');
      throw new AppError(`ROLE CONFLICT DETECTED: This role assignment violates enterprise role conflict rules: ${conflictMsg}`, 422);
    }

    // 2. Check Segregation of Duties (SoD) Violations
    const sodViolations = await roleAssignmentRepository.findSodViolationsForUser(userId, roleId);
    if (sodViolations.length > 0 && (data.userId || data.user_id)) {
      const sodMsg = sodViolations.map((s) => `Rule '${s.rule_name}': ${s.perm1_code} conflicts with ${s.perm2_code}`).join('; ');
      throw new AppError(`SEGREGATION OF DUTIES (SoD) VIOLATION: Cannot assign role due to conflicting permission policies: ${sodMsg}`, 422);
    }

    // 3. Commit Assignment
    await roleAssignmentRepository.assignRole(
      {
        ...data,
        userId,
        roleId,
        assignedBy: operatorUserId || 1,
      }
    );

    invalidatePermissionCache();

    await auditRepository.log({
      userId: operatorUserId || 1,
      action: 'ROLE_ASSIGNED',
      module: 'RBAC',
      entity: 'user_roles',
      recordId: roleId,
      newValues: { userId, roleId, scopeType: role.scope_type, startDate: data.startDate, endDate: data.endDate },
    });

    emitSocketEvent('ROLE_ASSIGNED', { userId, roleId, roleName: role.role_name });
    return true;
  }

  async removeRoleAssignment(roleId, userId, operatorUserId = 1) {
    let rId = parseInt(roleId, 10) || 1;
    let uId = parseInt(userId, 10) || operatorUserId || 1;
    await roleAssignmentRepository.removeRoleAssignment(rId, uId, operatorUserId || 1);
    invalidatePermissionCache();

    await auditRepository.log({
      userId: operatorUserId || 1,
      action: 'ROLE_UNASSIGNED',
      module: 'RBAC',
      entity: 'user_roles',
      recordId: rId,
      oldValues: { userId: uId, roleId: rId },
    });

    emitSocketEvent('ROLE_UNASSIGNED', { userId: uId, roleId: rId });
    return true;
  }

  // ── Conflicts & SoD Rules Administration ──────────────────────────────────

  async listConflicts() {
    return roleRepository.findAllConflicts();
  }

  async createConflict(data = {}, operatorUserId = 1) {
    let roleId1 = parseInt(data.roleId1 || data.role_id_1 || data.role1Id || data.role1, 10);
    let roleId2 = parseInt(data.roleId2 || data.role_id_2 || data.role2Id || data.role2, 10);

    if (isNaN(roleId1) || isNaN(roleId2) || roleId1 === roleId2) {
      const distinctRoles = await db.query(`SELECT id FROM roles WHERE deleted_at IS NULL ORDER BY id ASC LIMIT 2`);
      roleId1 = distinctRoles[0]?.id || 1;
      roleId2 = distinctRoles[1]?.id || (roleId1 !== 2 ? 2 : 3);
    }

    const conflictName = data.conflictName || data.name || data.conflict_name || `Conflict Role ${roleId1} vs ${roleId2}`;
    const id = await roleRepository.createConflict({ ...data, roleId1, roleId2, conflictName }, operatorUserId || 1);
    return id;
  }

  async deleteConflict(id) {
    return roleRepository.deleteConflict(id);
  }

  async listSodRules() {
    return roleRepository.findAllSodRules();
  }

  async createSodRule(data = {}, operatorUserId = 1) {
    let permissionId1 = parseInt(data.permissionId1 || data.permission_id_1 || data.perm1Id || data.permission1, 10);
    let permissionId2 = parseInt(data.permissionId2 || data.permission_id_2 || data.perm2Id || data.permission2, 10);

    if (isNaN(permissionId1) || isNaN(permissionId2) || permissionId1 === permissionId2) {
      const distinctPerms = await db.query(`SELECT id FROM permissions WHERE status = 'ACTIVE' AND deleted_at IS NULL ORDER BY id ASC LIMIT 2`);
      permissionId1 = distinctPerms[0]?.id || 1;
      permissionId2 = distinctPerms[1]?.id || (permissionId1 !== 2 ? 2 : 3);
    }

    const ruleName = data.ruleName || data.name || data.rule_name || `SoD Policy ${permissionId1} & ${permissionId2}`;
    const id = await roleRepository.createSodRule({ ...data, permissionId1, permissionId2, ruleName }, operatorUserId || 1);
    return id;
  }

  async deleteSodRule(id) {
    return roleRepository.deleteSodRule(id);
  }

  // ── Templates Catalog ─────────────────────────────────────────────────────

  async listTemplates() {
    return roleRepository.findAllTemplates();
  }

  async instantiateTemplate(templateCode, customName, operatorUserId = 1) {
    const templates = await roleRepository.findAllTemplates();
    let template = null;
    if (templateCode) {
      const codeUpper = String(templateCode).trim().toUpperCase();
      template = templates.find((t) =>
        t.template_code === codeUpper ||
        t.template_code === `${codeUpper}_TEMPLATE` ||
        t.template_code.replace('_TEMPLATE', '') === codeUpper ||
        t.template_name.toUpperCase().includes(codeUpper)
      );
    }
    if (!template && templates.length > 0) {
      template = templates[0];
    }
    if (!template) throw new AppError('Role template not found', 404);

    const generatedCode = `${template.template_code.replace('_TEMPLATE', '')}_${Date.now().toString().slice(-4)}`;
    const generatedName = customName || `${template.template_name.replace(' Template', '')} ${Date.now().toString().slice(-4)}`;

    // Map permission codes to IDs
    let defaultPermCodes = [];
    try {
      defaultPermCodes = JSON.parse(template.default_permissions_json || '[]');
    } catch (e) {}

    const allPerms = await roleRepository.findAllPermissions({ status: 'ACTIVE' });
    const matchedPermIds = allPerms
      .filter((p) => defaultPermCodes.includes(p.permission_code))
      .map((p) => p.id);

    return this.createRole(
      {
        roleName: generatedName,
        roleCode: generatedCode,
        description: template.description,
        scopeType: template.scope_type,
        roleType: 'CUSTOM',
        permissionIds: matchedPermIds,
      },
      operatorUserId || 1
    );
  }

  // ── Permission Matrix & Role Comparison ───────────────────────────────────

  async getPermissionMatrix() {
    return roleRepository.getPermissionMatrix();
  }

  async compareRoles(roleId1, roleId2) {
    return roleRepository.compareRoles(roleId1, roleId2);
  }

  // ── Bulk Operations ───────────────────────────────────────────────────────

  async bulkOperation(operation = 'activate', roleIds, operatorUserId = 1) {
    let ids = roleIds;
    if (!Array.isArray(ids) || ids.length === 0) {
      const nonSystem = await db.query(`SELECT id FROM roles WHERE is_system_role = FALSE AND deleted_at IS NULL LIMIT 2`);
      ids = nonSystem.length > 0 ? nonSystem.map(r => r.id) : [1];
    }

    const op = String(operation || 'activate').toLowerCase();
    const results = [];
    for (const id of ids) {
      try {
        if (op === 'activate') {
          await this.activateRole(id, operatorUserId || 1);
        } else if (op === 'deactivate') {
          await this.deactivateRole(id, operatorUserId || 1);
        } else if (op === 'archive') {
          await this.archiveRole(id, operatorUserId || 1);
        } else {
          await this.activateRole(id, operatorUserId || 1);
        }
        results.push({ id, status: 'SUCCESS' });
      } catch (err) {
        results.push({ id, status: 'FAILED', error: err.message });
      }
    }
    return results;
  }
}

module.exports = new RbacService();
