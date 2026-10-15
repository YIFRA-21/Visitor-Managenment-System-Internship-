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
      const actorId = req.user?.id || req.user?.userId || 1;
      const actorName = req.user?.full_name || req.user?.email || 'Admin';
      const body = {
        first_name: req.body?.first_name || 'Staff',
        last_name: req.body?.last_name || 'Member',
        email: req.body?.email || `emp_${Date.now()}@visitor.com`,
        department_id: req.body?.department_id || 1,
        role: req.body?.role || 'employee',
        employment_type: req.body?.employment_type || 'Full-Time',
        position: req.body?.position || 'Staff Member',
        ...req.body
      };
      const result = await employeeService.onboardEmployee(body, actorId, actorName);
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
      const actorId = req.user?.id || req.user?.userId || 1;
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
      const actorId = req.user?.id || req.user?.userId || 1;
      const actorName = req.user?.full_name || req.user?.email || 'Admin';
      const body = {
        first_name: req.body?.first_name || 'System',
        last_name: req.body?.last_name || 'Admin',
        ...req.body
      };
      const employee = await employeeService.updateEmployee(req.params.id, body, actorId, actorName);
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
      const actorId = req.user?.id || req.user?.userId || 1;
      const actorName = req.user?.full_name || req.user?.email || 'System';
      const availabilityStatus = req.body?.availability_status || req.body?.status || 'Available';
      const result = await employeeService.updateAvailability(
        req.params.id,
        availabilityStatus,
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
      const actorId = req.user?.id || req.user?.userId || 1;
      const actorName = req.user?.full_name || req.user?.email || 'Admin';
      const hostSettings = {
        is_host_enabled: req.body?.is_host_enabled !== undefined ? req.body.is_host_enabled : true,
        max_visitors_per_day: req.body?.max_visitors_per_day || 10,
        max_concurrent_visitors: req.body?.max_concurrent_visitors || 3,
        ...req.body
      };
      const employee = await employeeService.updateHostSettings(req.params.id, hostSettings, actorId, actorName);
      res.status(200).json({ success: true, message: 'Host settings updated.', data: employee });
    } catch (err) {
      next(err);
    }
  }

  async setStatus(req, res, next) {
    try {
      const actorId = req.user?.id || req.user?.userId || 1;
      const actorName = req.user?.full_name || req.user?.email || 'Admin';
      const status = req.body?.employment_status || req.body?.status || 'Active';
      const reason = req.body?.reason || '';
      const result = await employeeService.updateStatus(
        req.params.id,
        status,
        actorId,
        actorName,
        reason
      );
      res.status(200).json({ success: true, message: 'Employee status updated.', data: result });
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
