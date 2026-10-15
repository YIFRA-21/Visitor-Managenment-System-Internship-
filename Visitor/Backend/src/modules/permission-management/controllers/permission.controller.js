const permissionRepo = require('../repositories/permission.repository');

class PermissionController {
  // ── Statistics ─────────────────────────────────────────────────────────────
  async getStatistics(req, res) {
    try {
      const stats = await permissionRepo.findStatistics();
      return res.status(200).json({
        success: true,
        message: 'Permission statistics retrieved successfully',
        data: stats
      });
    } catch (err) {
      console.error('getStatistics error:', err);
      return res.status(500).json({
        success: false,
        code: 'DATABASE_ERROR',
        message: err.message || 'Failed to fetch permission statistics'
      });
    }
  }

  // ── List All Permissions (Search, Filter, Sort, Pagination) ───────────────
  async getAllPermissions(req, res) {
    try {
      const result = await permissionRepo.findAll(req.query);
      return res.status(200).json({
        success: true,
        message: 'Permissions retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (err) {
      console.error('getAllPermissions error:', err);
      return res.status(500).json({
        success: false,
        code: 'DATABASE_ERROR',
        message: err.message || 'Failed to fetch permissions list'
      });
    }
  }

  // ── Get Single Permission Details ──────────────────────────────────────────
  async getPermissionById(req, res) {
    try {
      const id = parseInt(req.params.permissionId, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, code: 'INVALID_INPUT', message: 'Invalid permission ID' });
      }

      const permission = await permissionRepo.findById(id);
      if (!permission) {
        return res.status(404).json({ success: false, code: 'PERMISSION_NOT_FOUND', message: 'Permission record not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Permission details retrieved',
        data: permission
      });
    } catch (err) {
      console.error('getPermissionById error:', err);
      return res.status(500).json({ success: false, code: 'DATABASE_ERROR', message: err.message });
    }
  }

  // ── Create Permission ──────────────────────────────────────────────────────
  async createPermission(req, res) {
    try {
      const { permission_code, permission_name, module } = req.body;
      if (!permission_code || !permission_name) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_INPUT',
          message: 'Permission Code and Permission Name are required fields.'
        });
      }

      const newPerm = await permissionRepo.createPermission(req.body, req.user?.id);
      return res.status(201).json({
        success: true,
        message: 'Permission created successfully',
        data: newPerm
      });
    } catch (err) {
      console.error('createPermission error:', err);
      const statusCode = err.code === 'PERMISSION_CODE_EXISTS' ? 409 : 500;
      return res.status(statusCode).json({
        success: false,
        code: err.code || 'DATABASE_ERROR',
        message: err.message || 'Failed to create permission'
      });
    }
  }

  // ── Update Permission ──────────────────────────────────────────────────────
  async updatePermission(req, res) {
    try {
      const id = parseInt(req.params.permissionId, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, code: 'INVALID_INPUT', message: 'Invalid permission ID' });
      }

      const updated = await permissionRepo.updatePermission(id, req.body, req.user?.id);
      return res.status(200).json({
        success: true,
        message: 'Permission updated successfully',
        data: updated
      });
    } catch (err) {
      console.error('updatePermission error:', err);
      const statusCode = err.code === 'PERMISSION_NOT_FOUND' ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        code: err.code || 'DATABASE_ERROR',
        message: err.message || 'Failed to update permission'
      });
    }
  }

  // ── Status Operations (Activate, Deactivate, Archive, Restore) ─────────────
  async activatePermission(req, res) {
    try {
      const id = parseInt(req.params.permissionId, 10);
      const updated = await permissionRepo.setStatus(id, 'ACTIVE', req.user?.id);
      return res.status(200).json({ success: true, message: 'Permission activated', data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, code: 'DATABASE_ERROR', message: err.message });
    }
  }

  async deactivatePermission(req, res) {
    try {
      const id = parseInt(req.params.permissionId, 10);
      const updated = await permissionRepo.setStatus(id, 'INACTIVE', req.user?.id);
      return res.status(200).json({ success: true, message: 'Permission deactivated', data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, code: 'DATABASE_ERROR', message: err.message });
    }
  }

  async archivePermission(req, res) {
    try {
      const id = parseInt(req.params.permissionId, 10);
      await permissionRepo.archive(id, req.user?.id);
      return res.status(200).json({ success: true, message: 'Permission archived successfully' });
    } catch (err) {
      return res.status(500).json({ success: false, code: 'DATABASE_ERROR', message: err.message });
    }
  }

  async restorePermission(req, res) {
    try {
      const id = parseInt(req.params.permissionId, 10);
      const updated = await permissionRepo.restore(id, req.user?.id);
      return res.status(200).json({ success: true, message: 'Permission restored', data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, code: 'DATABASE_ERROR', message: err.message });
    }
  }

  // ── Clone Permission ───────────────────────────────────────────────────────
  async clonePermission(req, res) {
    try {
      const id = parseInt(req.params.permissionId, 10);
      const { newCode, newName } = req.body;
      if (!newCode) {
        return res.status(400).json({ success: false, code: 'INVALID_INPUT', message: 'New permission code is required' });
      }

      const cloned = await permissionRepo.clonePermission(id, newCode, newName, req.user?.id);
      return res.status(201).json({ success: true, message: 'Permission cloned successfully', data: cloned });
    } catch (err) {
      return res.status(500).json({ success: false, code: 'DATABASE_ERROR', message: err.message });
    }
  }

  // ── Permission Matrix ──────────────────────────────────────────────────────
  async getMatrix(req, res) {
    try {
      const matrix = await permissionRepo.getPermissionMatrix();
      return res.status(200).json({ success: true, message: 'Permission matrix retrieved', data: matrix });
    } catch (err) {
      return res.status(500).json({ success: false, code: 'DATABASE_ERROR', message: err.message });
    }
  }

  async updateMatrix(req, res) {
    try {
      const { assignments } = req.body;
      if (!Array.isArray(assignments)) {
        return res.status(400).json({ success: false, code: 'INVALID_INPUT', message: 'assignments must be an array' });
      }

      await permissionRepo.updateMatrixAssignments(assignments, req.user?.id);
      return res.status(200).json({ success: true, message: 'Permission matrix updated successfully' });
    } catch (err) {
      return res.status(500).json({ success: false, code: 'DATABASE_ERROR', message: err.message });
    }
  }

  // ── Groups & Templates ─────────────────────────────────────────────────────
  async getGroups(req, res) {
    try {
      const groups = await permissionRepo.findGroups();
      return res.status(200).json({ success: true, message: 'Permission groups retrieved', data: groups });
    } catch (err) {
      return res.status(500).json({ success: false, code: 'DATABASE_ERROR', message: err.message });
    }
  }

  async getTemplates(req, res) {
    try {
      const templates = await permissionRepo.findTemplates();
      return res.status(200).json({ success: true, message: 'Permission templates retrieved', data: templates });
    } catch (err) {
      return res.status(500).json({ success: false, code: 'DATABASE_ERROR', message: err.message });
    }
  }

  // ── Authorization Simulator ────────────────────────────────────────────────
  async testAuthorization(req, res) {
    try {
      const { userId, permissionCode, resourceObject } = req.body;
      if (!userId || !permissionCode) {
        return res.status(400).json({ success: false, code: 'INVALID_INPUT', message: 'userId and permissionCode are required' });
      }

      const result = await permissionRepo.authorizeUserRequest(userId, permissionCode, resourceObject);
      return res.status(200).json({ success: true, message: 'Authorization test executed', data: result });
    } catch (err) {
      return res.status(500).json({ success: false, code: 'DATABASE_ERROR', message: err.message });
    }
  }

  // ── Bulk Import & Export ───────────────────────────────────────────────────
  async importPermissions(req, res) {
    try {
      const { permissions } = req.body;
      if (!Array.isArray(permissions) || permissions.length === 0) {
        return res.status(400).json({ success: false, code: 'INVALID_INPUT', message: 'No valid permission rows found for import' });
      }

      let createdCount = 0;
      let failedCount = 0;
      const errors = [];

      for (const row of permissions) {
        try {
          if (!row.permission_code || !row.permission_name) {
            failedCount++;
            errors.push(`Row missing required code or name: ${JSON.stringify(row)}`);
            continue;
          }
          await permissionRepo.createPermission(row, req.user?.id);
          createdCount++;
        } catch (err) {
          failedCount++;
          errors.push(`Failed '${row.permission_code}': ${err.message}`);
        }
      }

      return res.status(200).json({
        success: true,
        message: `Import processed: ${createdCount} created, ${failedCount} failed.`,
        data: { createdCount, failedCount, errors }
      });
    } catch (err) {
      return res.status(500).json({ success: false, code: 'DATABASE_ERROR', message: err.message });
    }
  }

  async exportPermissions(req, res) {
    try {
      const result = await permissionRepo.findAll({ limit: 10000 });
      const exportData = result.data.map(p => ({
        permission_code: p.permission_code,
        permission_name: p.permission_name,
        module: p.module,
        resource: p.resource,
        action: p.action,
        scope_type: p.scope_type,
        risk_level: p.risk_level,
        status: p.status,
        role_count: p.role_count,
        created_at: p.created_at
      }));

      return res.status(200).json({
        success: true,
        message: 'Permissions export generated',
        data: exportData
      });
    } catch (err) {
      return res.status(500).json({ success: false, code: 'DATABASE_ERROR', message: err.message });
    }
  }
}

module.exports = new PermissionController();
