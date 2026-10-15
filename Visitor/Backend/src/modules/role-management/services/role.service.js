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

  // ── Role Lifecycle (Create, Update, Activate, Deactivate, Archive, Restore) ──

  async createRole(data, operatorUserId) {
    // 1. Unique code check
    const existingCode = await roleRepository.findByCode(data.roleCode);
    if (existingCode) {
      throw new AppError('Role code already exists', 409);
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
          createdBy: operatorUserId,
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

  async archiveRole(id, operatorUserId) {
    const role = await roleRepository.findById(id);
    if (!role) throw new AppError('Role not found', 404);

    if (role.is_system_role) {
      throw new AppError('Cannot archive a protected system role', 403);
    }

    if (Number(role.user_count) > 0) {
      throw new AppError(`Cannot archive role '${role.role_name}'. It currently has ${role.user_count} assigned active users. Reassign users first.`, 400);
    }

    await roleRepository.archiveRole(id, operatorUserId);
    invalidatePermissionCache();

    await auditRepository.log({
      userId: operatorUserId,
      action: 'ROLE_ARCHIVED',
      module: 'RBAC',
      entity: 'roles',
      recordId: id,
    });

    emitSocketEvent('ROLE_ARCHIVED', { roleId: id });
  }

  async restoreRole(id, operatorUserId) {
    const role = await roleRepository.findById(id);
    if (!role) throw new AppError('Role not found', 404);

    await roleRepository.restoreRole(id, operatorUserId);
    invalidatePermissionCache();

    await auditRepository.log({
      userId: operatorUserId,
      action: 'ROLE_RESTORED',
      module: 'RBAC',
      entity: 'roles',
      recordId: id,
    });

    emitSocketEvent('ROLE_UPDATED', { roleId: id, status: 'ACTIVE' });
  }

  async deleteRole(id, operatorUserId) {
    const role = await roleRepository.findById(id);
    if (!role) throw new AppError('Role not found', 404);

    if (role.is_system_role) {
      throw new AppError('Cannot delete a protected system role', 403);
    }

    if (Number(role.user_count) > 0) {
      throw new AppError(`Cannot delete role '${role.role_name}'. It currently has ${role.user_count} assigned active users. Reassign users first.`, 400);
    }

    await roleRepository.deleteRole(id, operatorUserId);
    invalidatePermissionCache();

    await auditRepository.log({
      userId: operatorUserId,
      action: 'ROLE_DELETED',
      module: 'RBAC',
      entity: 'roles',
      recordId: id,
    });

    emitSocketEvent('ROLE_DELETED', { roleId: id });
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

  async addHierarchyLink(parentRoleId, childRoleId, level, operatorUserId) {
    if (parentRoleId === childRoleId) {
      throw new AppError('Self-parenting is prohibited in role hierarchy', 400);
    }

    const parent = await roleRepository.findById(parentRoleId);
    const child = await roleRepository.findById(childRoleId);
    if (!parent || !child) throw new AppError('Parent or child role not found', 404);

    await roleRepository.addHierarchyLink(parentRoleId, childRoleId, level || 1);
    invalidatePermissionCache();

    await auditRepository.log({
      userId: operatorUserId,
      action: 'HIERARCHY_LINK_ADDED',
      module: 'RBAC',
      entity: 'role_hierarchy',
      newValues: { parentRoleId, childRoleId, level },
    });

    emitSocketEvent('ROLE_UPDATED', { parentRoleId, childRoleId });
  }

  async removeHierarchyLink(id, operatorUserId) {
    await roleRepository.removeHierarchyLink(id);
    invalidatePermissionCache();

    await auditRepository.log({
      userId: operatorUserId,
      action: 'HIERARCHY_LINK_REMOVED',
      module: 'RBAC',
      entity: 'role_hierarchy',
      recordId: id,
    });
  }

  // ── Role Assignments & Conflict / SoD Enforcement ─────────────────────────

  async getRoleUsers(roleId, filters) {
    return roleAssignmentRepository.findUsersByRoleId(roleId, filters);
  }

  async assignRoleToUser(data, operatorUserId) {
    const { userId, roleId } = data;

    const role = await roleRepository.findById(roleId);
    if (!role) throw new AppError('Role not found', 404);

    if (role.status !== 'ACTIVE') {
      throw new AppError(`Cannot assign role '${role.role_name}' because its status is ${role.status}`, 400);
    }

    // 1. Check Role Conflicts
    const conflicts = await roleAssignmentRepository.findRoleConflictsForUser(userId, roleId);
    if (conflicts.length > 0) {
      const conflictMsg = conflicts.map((c) => `'${c.role1_name}' conflicts with '${c.role2_name}' (${c.conflict_name})`).join('; ');
      throw new AppError(`ROLE CONFLICT DETECTED: This role assignment violates enterprise role conflict rules: ${conflictMsg}`, 422);
    }

    // 2. Check Segregation of Duties (SoD) Violations
    const sodViolations = await roleAssignmentRepository.findSodViolationsForUser(userId, roleId);
    if (sodViolations.length > 0) {
      const sodMsg = sodViolations.map((s) => `Rule '${s.rule_name}': ${s.perm1_code} conflicts with ${s.perm2_code}`).join('; ');
      throw new AppError(`SEGREGATION OF DUTIES (SoD) VIOLATION: Cannot assign role due to conflicting permission policies: ${sodMsg}`, 422);
    }

    // 3. Commit Assignment
    await roleAssignmentRepository.assignRole(
      {
        ...data,
        assignedBy: operatorUserId,
      }
    );

    invalidatePermissionCache();

    await auditRepository.log({
      userId: operatorUserId,
      action: 'ROLE_ASSIGNED',
      module: 'RBAC',
      entity: 'user_roles',
      recordId: roleId,
      newValues: { userId, roleId, scopeType: role.scope_type, startDate: data.startDate, endDate: data.endDate },
    });

    emitSocketEvent('ROLE_ASSIGNED', { userId, roleId, roleName: role.role_name });
  }

  async removeRoleAssignment(roleId, userId, operatorUserId) {
    await roleAssignmentRepository.removeRoleAssignment(roleId, userId, operatorUserId);
    invalidatePermissionCache();

    await auditRepository.log({
      userId: operatorUserId,
      action: 'ROLE_UNASSIGNED',
      module: 'RBAC',
      entity: 'user_roles',
      recordId: roleId,
      oldValues: { userId, roleId },
    });

    emitSocketEvent('ROLE_UNASSIGNED', { userId, roleId });
  }

  // ── Conflicts & SoD Rules Administration ──────────────────────────────────

  async listConflicts() {
    return roleRepository.findAllConflicts();
  }

  async createConflict(data, operatorUserId) {
    if (data.roleId1 === data.roleId2) {
      throw new AppError('Role conflict rule cannot be defined on the same role', 400);
    }
    const id = await roleRepository.createConflict(data, operatorUserId);
    return id;
  }

  async deleteConflict(id) {
    return roleRepository.deleteConflict(id);
  }

  async listSodRules() {
    return roleRepository.findAllSodRules();
  }

  async createSodRule(data, operatorUserId) {
    if (data.permissionId1 === data.permissionId2) {
      throw new AppError('SoD rule cannot pair a permission with itself', 400);
    }
    const id = await roleRepository.createSodRule(data, operatorUserId);
    return id;
  }

  async deleteSodRule(id) {
    return roleRepository.deleteSodRule(id);
  }

  // ── Templates Catalog ─────────────────────────────────────────────────────

  async listTemplates() {
    return roleRepository.findAllTemplates();
  }

  async instantiateTemplate(templateCode, customName, operatorUserId) {
    const templates = await roleRepository.findAllTemplates();
    const template = templates.find((t) => t.template_code === templateCode);
    if (!template) throw new AppError('Role template not found', 404);

    const generatedCode = `${template.template_code.replace('_TEMPLATE', '')}_${Date.now().toString().slice(-4)}`;
    const generatedName = customName || template.template_name.replace(' Template', '');

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
      operatorUserId
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

  async bulkOperation(operation, roleIds, operatorUserId) {
    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      throw new AppError('No role IDs provided for bulk operation', 400);
    }

    const results = [];
    for (const id of roleIds) {
      try {
        if (operation === 'activate') {
          await this.activateRole(id, operatorUserId);
        } else if (operation === 'deactivate') {
          await this.deactivateRole(id, operatorUserId);
        } else if (operation === 'archive') {
          await this.archiveRole(id, operatorUserId);
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
