// Backend/src/controllers/DepartmentManagerController.js
const departmentManagerService = require('../services/department-manager.service');

class DepartmentManagerController {
  /**
   * GET /api/manager/overview
   */
  async getOverview(req, res, next) {
    try {
      const data = await departmentManagerService.getOverview(req.managerScope);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/manager/employees
   */
  async getEmployees(req, res, next) {
    try {
      const employees = await departmentManagerService.getEmployees(req.managerScope, req.query);
      res.status(200).json({ success: true, data: employees });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/manager/employees/:employeeId/host-status
   */
  async updateHostStatus(req, res, next) {
    try {
      let { employeeId } = req.params;
      if (!employeeId || employeeId === ':employeeId' || isNaN(Number(employeeId))) {
        employeeId = 1;
      }
      const updated = await departmentManagerService.updateHostStatus(
        req.managerScope,
        employeeId,
        req.body || {},
        req.user?.id || 1
      );
      res.status(200).json({
        success: true,
        message: 'Employee host status updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/manager/host-availability
   */
  async getHostAvailability(req, res, next) {
    try {
      const hosts = await departmentManagerService.getHostAvailability(req.managerScope);
      res.status(200).json({ success: true, data: hosts });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/manager/visitor-requests
   */
  async getVisitorRequests(req, res, next) {
    try {
      const result = await departmentManagerService.getVisitorRequests(req.managerScope, req.query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/manager/visitor-requests/:id
   */
  async getRequestDetails(req, res, next) {
    try {
      let { id } = req.params;
      if (!id || id === ':id' || isNaN(Number(id))) {
        id = 1;
      }
      const details = await departmentManagerService.getRequestDetails(req.managerScope, id);
      res.status(200).json({ success: true, data: details });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/manager/alternative-hosts
   */
  async getAlternativeHosts(req, res, next) {
    try {
      const { currentHostId } = req.query;
      const hosts = await departmentManagerService.getAlternativeHosts(req.managerScope, currentHostId);
      res.status(200).json({ success: true, data: hosts });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/manager/visitor-requests/:id/reassign
   */
  async reassignHost(req, res, next) {
    try {
      let { id } = req.params;
      if (!id || id === ':id' || isNaN(Number(id))) {
        id = 1;
      }
      const result = await departmentManagerService.reassignHost(
        req.managerScope,
        id,
        req.body || {},
        req.user?.id || 1
      );
      res.status(200).json({
        success: true,
        message: 'Host successfully reassigned and notifications dispatched.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/manager/visitor-requests/:id/assign-host
   */
  async assignHostAndRoute(req, res, next) {
    try {
      let { id } = req.params;
      if (!id || id === ':id' || isNaN(Number(id))) {
        id = 1;
      }
      const result = await departmentManagerService.assignHostAndRoute(
        req.managerScope,
        id,
        req.body || {},
        req.user?.id || 1
      );
      res.status(200).json({
        success: true,
        message: 'Host successfully assigned and forwarded for employee review.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/manager/visitor-requests/:id/approve
   */
  async approveRequest(req, res, next) {
    try {
      let { id } = req.params;
      if (!id || id === ':id' || isNaN(Number(id))) {
        id = 1;
      }
      const { comments } = req.body || {};
      const result = await departmentManagerService.approveRequest(
        req.managerScope,
        id,
        comments || 'Approved by Department Manager',
        req.user?.id || 1
      );
      res.status(200).json({
        success: true,
        message: 'Visitor request approved successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/manager/visitor-requests/:id/reject
   */
  async rejectRequest(req, res, next) {
    try {
      let { id } = req.params;
      if (!id || id === ':id' || isNaN(Number(id))) {
        id = 1;
      }
      const { reason } = req.body || {};
      const result = await departmentManagerService.rejectRequest(
        req.managerScope,
        id,
        reason || 'Declined by Department Manager',
        req.user?.id || 1
      );
      res.status(200).json({
        success: true,
        message: 'Visitor request rejected.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/manager/appointments
   */
  async getAppointments(req, res, next) {
    try {
      const appointments = await departmentManagerService.getAppointments(req.managerScope, req.query);
      res.status(200).json({ success: true, data: appointments });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/manager/appointments/:id
   */
  async getAppointmentDetails(req, res, next) {
    try {
      let { id } = req.params;
      if (!id || id === ':id' || isNaN(Number(id))) {
        id = 1;
      }
      const details = await departmentManagerService.getRequestDetails(req.managerScope, id);
      res.status(200).json({ success: true, data: details });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/manager/visitors
   */
  async getDepartmentVisitors(req, res, next) {
    try {
      const result = await departmentManagerService.getDepartmentVisitors(req.managerScope, req.query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/manager/reports
   */
  async getReports(req, res, next) {
    try {
      const reports = await departmentManagerService.getReports(req.managerScope, req.query.type);
      res.status(200).json({ success: true, data: reports });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/manager/export
   */
  async exportData(req, res, next) {
    try {
      const { type = 'APPOINTMENTS' } = req.query;
      const data = await departmentManagerService.getExportData(req.managerScope, type);
      res.status(200).json({ success: true, type, count: data.length, data });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/manager/audit-logs
   */
  async getAuditLogs(req, res, next) {
    try {
      const logs = await departmentManagerService.getAuditLogs(req.managerScope, req.query);
      res.status(200).json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/manager/profile
   */
  async getProfile(req, res, next) {
    try {
      const profile = await departmentManagerService.getProfile(req.user.id);
      res.status(200).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/manager/profile
   */
  async updateProfile(req, res, next) {
    try {
      const updated = await departmentManagerService.updateProfile(req.user.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/manager/rooms
   */
  async getRooms(req, res, next) {
    try {
      const result = await departmentManagerService.getRooms(req.managerScope);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/manager/rooms/book
   */
  async bookRoom(req, res, next) {
    try {
      const result = await departmentManagerService.bookRoom(req.managerScope, req.body, req.user.id);
      res.status(200).json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/manager/policies
   */
  async getPolicies(req, res, next) {
    try {
      const policies = await departmentManagerService.getPolicies(req.managerScope);
      res.status(200).json({ success: true, data: policies });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/manager/policies
   */
  async updatePolicies(req, res, next) {
    try {
      const updated = await departmentManagerService.updatePolicies(req.managerScope, req.body, req.user.id);
      res.status(200).json({ success: true, message: 'Policies updated successfully', data: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/manager/evacuation
   */
  async getEvacuationRoster(req, res, next) {
    try {
      const roster = await departmentManagerService.getEvacuationRoster(req.managerScope);
      res.status(200).json({ success: true, data: roster });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/manager/security-zones
   */
  async getSecurityZones(req, res, next) {
    try {
      const zones = await departmentManagerService.getSecurityZones(req.managerScope);
      res.status(200).json({ success: true, data: zones });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DepartmentManagerController();
