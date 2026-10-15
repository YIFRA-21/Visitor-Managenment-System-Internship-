const departmentStatusService = require('../services/department-status.service');

class DepartmentStatusController {
  async changeStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const actorId = req.user?.id || 1;

      if (!status) {
        return res.status(400).json({ message: 'Status is required.' });
      }

      const department = await departmentStatusService.changeStatus(id, status, reason, actorId);
      res.status(200).json({
        status: 'success',
        message: `Department status changed to ${status}.`,
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
