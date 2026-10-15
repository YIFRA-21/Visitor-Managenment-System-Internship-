const employeeService = require('../services/employee.service');

class EmployeeController {
  // ── List & Search ──────────────────────────────────────────────────────────
  async list(req, res, next) {
    try {
      const filters = { ...req.query };
      const userRole = (req.user?.role || '').toLowerCase();
      if (userRole === 'manager' || userRole === 'department_manager') {
        const deptId = req.user?.departmentId || req.user?.department_id;
        if (deptId) filters.department_id = deptId;
      }
      const result = await employeeService.listEmployees(filters);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async get(req, res, next) {
    try {
      const employee = await employeeService.getEmployee(req.params.id);
      res.status(200).json({ success: true, data: employee });
    } catch (err) {
      next(err);
    }
  }

  async getMyProfile(req, res, next) {
    try {
      const userId = req.user?.id || req.user?.userId;
      const employee = await employeeService.getMyProfile(userId);
      res.status(200).json({ success: true, data: employee });
    } catch (err) {
      next(err);
    }
  }

  // ── Dashboard Stats & Analytics ────────────────────────────────────────────
  async getDashboardStats(req, res, next) {
    try {
      const stats = await employeeService.getDashboardStats();
      res.status(200).json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const limit = req.query.limit || 50;
      const employeeId = req.query.employeeId || req.params.id || null;
      const logs = await employeeService.getAuditLogs(limit, employeeId);
      res.status(200).json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────
  async onboard(req, res, next) {
    try {
      const actorId = req.user?.id || req.user?.userId;
      const actorName = req.user?.full_name || req.user?.email || 'Admin';
      const result = await employeeService.onboardEmployee(req.body, actorId, actorName);
      res.status(201).json({
        success: true,
        message: 'Employee onboarded successfully.',
        data: result.employee,
        registration: result.registration,
      });
    } catch (err) {
      next(err);
    }
  }

  async resendRegistrationEmail(req, res, next) {
    try {
      const actorId = req.user?.id || req.user?.userId;
      const actorName = req.user?.full_name || req.user?.email || 'Admin';
      const result = await employeeService.resendRegistrationEmail(req.params.id, actorId, actorName);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.registration,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const actorId = req.user?.id || req.user?.userId;
      const actorName = req.user?.full_name || req.user?.email || 'Admin';
      const employee = await employeeService.updateEmployee(req.params.id, req.body, actorId, actorName);
      res.status(200).json({
        success: true,
        message: 'Employee updated successfully.',
        data: employee,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateAvailability(req, res, next) {
    try {
      const actorId = req.user?.id || req.user?.userId;
      const actorName = req.user?.full_name || req.user?.email || 'System';
      const result = await employeeService.updateAvailability(
        req.params.id,
        req.body.availability_status,
        actorId,
        actorName
      );
      res.status(200).json({ success: true, message: 'Availability status updated.', data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateHostSettings(req, res, next) {
    try {
      const actorId = req.user?.id || req.user?.userId;
      const actorName = req.user?.full_name || req.user?.email || 'Admin';
      const employee = await employeeService.updateHostSettings(req.params.id, req.body, actorId, actorName);
      res.status(200).json({ success: true, message: 'Host settings updated.', data: employee });
    } catch (err) {
      next(err);
    }
  }

  async setStatus(req, res, next) {
    try {
      const actorId = req.user?.id || req.user?.userId;
      const actorName = req.user?.full_name || req.user?.email || 'Admin';
      const reason = req.body.reason || '';
      const result = await employeeService.updateStatus(
        req.params.id,
        req.body.employment_status,
        actorId,
        actorName,
        reason
      );
      res.status(200).json({ success: true, message: 'Employment status updated.', data: result });
    } catch (err) {
      next(err);
    }
  }

  // ── Soft Delete / Archive / Restore ───────────────────────────────────────
  async delete(req, res, next) {
    try {
      const actorId = req.user?.id || req.user?.userId;
      const actorName = req.user?.full_name || req.user?.email || 'Admin';
      await employeeService.deleteEmployee(req.params.id, actorId, actorName);
      res.status(200).json({ success: true, message: 'Employee soft deleted.' });
    } catch (err) {
      next(err);
    }
  }

  async archive(req, res, next) {
    try {
      const actorId = req.user?.id || req.user?.userId;
      const actorName = req.user?.full_name || req.user?.email || 'Admin';
      await employeeService.archiveEmployee(req.params.id, actorId, actorName);
      res.status(200).json({ success: true, message: 'Employee archived.' });
    } catch (err) {
      next(err);
    }
  }

  async restore(req, res, next) {
    try {
      const actorId = req.user?.id || req.user?.userId;
      const actorName = req.user?.full_name || req.user?.email || 'Admin';
      await employeeService.restoreEmployee(req.params.id, actorId, actorName);
      res.status(200).json({ success: true, message: 'Employee restored.' });
    } catch (err) {
      next(err);
    }
  }

  // ── Integration Endpoints ─────────────────────────────────────────────────
  async getAppointmentHistory(req, res, next) {
    try {
      const data = await employeeService.getEmployeeAppointmentHistory(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ── Bulk Operations ───────────────────────────────────────────────────────
  async bulkImport(req, res, next) {
    try {
      const actorId = req.user?.id || req.user?.userId;
      const actorName = req.user?.full_name || req.user?.email || 'Admin';
      const result = await employeeService.bulkImport(req.body.employees || [], actorId, actorName);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new EmployeeController();
