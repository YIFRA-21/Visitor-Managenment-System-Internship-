/**
 * Role Controller
 * ────────────────
 * REST API controller for enterprise Role Management (roles, permissions,
 * hierarchy, assignments, conflicts, SoD, templates, versions, comparison, bulk operations).
 */

const rbacService = require('../services/role.service');

class RoleController {
  // ── Statistics / KPI Cards ────────────────────────────────────────────────

  async getStatistics(req, res, next) {
    try {
      const stats = await rbacService.getStatistics();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  // ── Roles Search, Filter, Sort, Pagination ───────────────────────────────

  async listRoles(req, res, next) {
    try {
      const result = await rbacService.listRoles(req.query);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getRole(req, res, next) {
    try {
      const role = await rbacService.getRole(parseInt(req.params.id, 10));
      res.json({ success: true, data: role });
    } catch (err) {
      next(err);
    }
  }

  async createRole(req, res, next) {
    try {
      const roleId = await rbacService.createRole(req.body || {}, req.user ? req.user.id : 1);
      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: { id: roleId },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateRole(req, res, next) {
    try {
      await rbacService.updateRole(parseInt(req.params.id, 10), req.body || {}, req.user ? req.user.id : 1);
      res.json({ success: true, message: 'Role updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async activateRole(req, res, next) {
    try {
      await rbacService.activateRole(parseInt(req.params.id, 10), req.user ? req.user.id : 1);
      res.json({ success: true, message: 'Role activated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async deactivateRole(req, res, next) {
    try {
      await rbacService.deactivateRole(parseInt(req.params.id, 10), req.user ? req.user.id : 1);
      res.json({ success: true, message: 'Role deactivated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async archiveRole(req, res, next) {
    try {
      await rbacService.archiveRole(parseInt(req.params.id, 10), req.user ? req.user.id : 1);
      res.json({ success: true, message: 'Role archived successfully' });
    } catch (err) {
      next(err);
    }
  }

  async restoreRole(req, res, next) {
    try {
      await rbacService.restoreRole(parseInt(req.params.id, 10), req.user ? req.user.id : 1);
      res.json({ success: true, message: 'Role restored successfully' });
    } catch (err) {
      next(err);
    }
  }

  async deleteRole(req, res, next) {
    try {
      await rbacService.deleteRole(parseInt(req.params.id, 10), req.user ? req.user.id : 1);
      res.json({ success: true, message: 'Role deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async cloneRole(req, res, next) {
    try {
      const body = req.body || {};
      const newRoleCode = body.newRoleCode || body.new_role_code || body.roleCode || body.code;
      const newRoleName = body.newRoleName || body.new_role_name || body.roleName || body.name;
      const operatorUserId = req.user ? req.user.id : 1;
      const roleId = parseInt(req.params.id, 10);

      const newRoleId = await rbacService.cloneRole(roleId, newRoleCode, newRoleName, operatorUserId);
      const clonedRole = await rbacService.getRole(newRoleId);

      res.status(201).json({
        success: true,
        message: 'Role cloned successfully',
        data: clonedRole || { id: newRoleId },
      });
    } catch (err) {
      next(err);
    }
  }

  // ── Permissions Integration ───────────────────────────────────────────────

  async listPermissions(req, res, next) {
    try {
      const permissions = await rbacService.listPermissions(req.query);
      res.json({ success: true, data: permissions });
    } catch (err) {
      next(err);
    }
  }

  async getPermissionModules(req, res, next) {
    try {
      const modules = await rbacService.getPermissionModules();
      res.json({ success: true, data: modules });
    } catch (err) {
      next(err);
    }
  }

  async getRolePermissions(req, res, next) {
    try {
      const perms = await rbacService.getRolePermissions(parseInt(req.params.id, 10));
      res.json({ success: true, data: perms });
    } catch (err) {
      next(err);
    }
  }

  async syncRolePermissions(req, res, next) {
    try {
      const { permissionIds } = req.body;
      await rbacService.syncRolePermissions(parseInt(req.params.id, 10), permissionIds || [], req.user.id);
      res.json({ success: true, message: 'Role permissions updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  // ── Role Users & Assignments ──────────────────────────────────────────────

  async getRoleUsers(req, res, next) {
    try {
      const users = await rbacService.getRoleUsers(parseInt(req.params.id, 10), req.query);
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }

  async assignUser(req, res, next) {
    try {
      const roleId = parseInt(req.params.id, 10);
      await rbacService.assignRoleToUser({ ...(req.body || {}), roleId }, req.user ? req.user.id : 1);
      res.status(201).json({ success: true, message: 'Role assigned to user successfully' });
    } catch (err) {
      next(err);
    }
  }

  async removeUser(req, res, next) {
    try {
      const roleId = parseInt(req.params.id, 10);
      let userId = parseInt(req.params.userId, 10);
      if (isNaN(userId)) {
        userId = parseInt(req.body?.userId || req.body?.user_id || req.query?.userId || req.query?.user_id, 10) || (req.user ? req.user.id : 1);
      }
      await rbacService.removeRoleAssignment(roleId, userId, req.user ? req.user.id : 1);
      res.json({ success: true, message: 'Role assignment removed successfully' });
    } catch (err) {
      next(err);
    }
  }

  // ── Role Hierarchy ────────────────────────────────────────────────────────

  async getHierarchy(req, res, next) {
    try {
      const hierarchy = await rbacService.getHierarchy();
      res.json({ success: true, data: hierarchy });
    } catch (err) {
      next(err);
    }
  }

  async addHierarchyLink(req, res, next) {
    try {
      const { parentRoleId, childRoleId, level } = req.body || {};
      await rbacService.addHierarchyLink(parentRoleId, childRoleId, level, req.user ? req.user.id : 1);
      res.status(201).json({ success: true, message: 'Role hierarchy link created' });
    } catch (err) {
      next(err);
    }
  }

  async removeHierarchyLink(req, res, next) {
    try {
      await rbacService.removeHierarchyLink(parseInt(req.params.id, 10), req.user ? req.user.id : 1);
      res.json({ success: true, message: 'Role hierarchy link removed' });
    } catch (err) {
      next(err);
    }
  }

  // ── Conflicts & Segregation of Duties (SoD) ───────────────────────────────

  async listConflicts(req, res, next) {
    try {
      const conflicts = await rbacService.listConflicts();
      res.json({ success: true, data: conflicts });
    } catch (err) {
      next(err);
    }
  }

  async createConflict(req, res, next) {
    try {
      const id = await rbacService.createConflict(req.body || {}, req.user ? req.user.id : 1);
      res.status(201).json({ success: true, message: 'Role conflict rule created', data: { id } });
    } catch (err) {
      next(err);
    }
  }

  async deleteConflict(req, res, next) {
    try {
      await rbacService.deleteConflict(parseInt(req.params.id, 10));
      res.json({ success: true, message: 'Role conflict rule removed' });
    } catch (err) {
      next(err);
    }
  }

  async listSodRules(req, res, next) {
    try {
      const sodRules = await rbacService.listSodRules();
      res.json({ success: true, data: sodRules });
    } catch (err) {
      next(err);
    }
  }

  async createSodRule(req, res, next) {
    try {
      const id = await rbacService.createSodRule(req.body || {}, req.user ? req.user.id : 1);
      res.status(201).json({ success: true, message: 'Segregation of Duties rule created', data: { id } });
    } catch (err) {
      next(err);
    }
  }

  async deleteSodRule(req, res, next) {
    try {
      await rbacService.deleteSodRule(parseInt(req.params.id, 10));
      res.json({ success: true, message: 'Segregation of Duties rule removed' });
    } catch (err) {
      next(err);
    }
  }

  // ── Role Templates Catalog ────────────────────────────────────────────────

  async listTemplates(req, res, next) {
    try {
      const templates = await rbacService.listTemplates();
      res.json({ success: true, data: templates });
    } catch (err) {
      next(err);
    }
  }

  async instantiateTemplate(req, res, next) {
    try {
      const { templateCode, customName } = req.body || {};
      const newRoleId = await rbacService.instantiateTemplate(templateCode, customName, req.user ? req.user.id : 1);
      res.status(201).json({ success: true, message: 'Role created from template', data: { id: newRoleId } });
    } catch (err) {
      next(err);
    }
  }

  // ── Matrix & Comparison & Versioning ──────────────────────────────────────

  async getPermissionMatrix(req, res, next) {
    try {
      const matrix = await rbacService.getPermissionMatrix();
      res.json({ success: true, data: matrix });
    } catch (err) {
      next(err);
    }
  }

  async compareRoles(req, res, next) {
    try {
      let roleId1 = parseInt(req.query?.role1 || req.query?.roleId1 || req.query?.r1, 10);
      let roleId2 = parseInt(req.query?.role2 || req.query?.roleId2 || req.query?.r2, 10);
      const comparison = await rbacService.compareRoles(roleId1, roleId2);
      res.json({ success: true, data: comparison });
    } catch (err) {
      next(err);
    }
  }

  // ── Bulk Operations & Export ──────────────────────────────────────────────

  async bulkOperations(req, res, next) {
    try {
      const { operation, roleIds } = req.body || {};
      const results = await rbacService.bulkOperation(operation, roleIds, req.user ? req.user.id : 1);
      res.json({ success: true, message: 'Bulk operation completed', data: results });
    } catch (err) {
      next(err);
    }
  }

  async exportRoles(req, res, next) {
    try {
      const roles = await rbacService.listRoles({ limit: 1000 });
      res.json({
        success: true,
        data: roles.data,
        exportedAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RoleController();
