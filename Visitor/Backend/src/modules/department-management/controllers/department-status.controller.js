const departmentStatusService = require('../services/department-status.service');

class DepartmentStatusController {
  async changeStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body || {};
      const actorId = req.user?.id || 1;

      const targetStatus = status || 'ACTIVE';

      const department = await departmentStatusService.changeStatus(id, targetStatus, reason, actorId);
      res.status(200).json({
        status: 'success',
        message: `Department status changed to ${department.status}.`,
        data: department,
      });
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req, res, next) {
    try {
      const { id } = req.params;
      const result = await departmentStatusService.getStatusHistory(id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DepartmentStatusController();
