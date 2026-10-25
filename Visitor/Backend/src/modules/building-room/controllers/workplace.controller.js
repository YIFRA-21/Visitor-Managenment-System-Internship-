const workplaceService = require('../services/workplace.service');

class WorkplaceController {
  async getEmployeeWorkplace(req, res, next) {
    try {
      const workplace = await workplaceService.getEmployeeWorkplace(req.params.id);
      res.status(200).json({ success: true, data: workplace });
    } catch (err) {
      next(err);
    }
  }

  async assignWorkplace(req, res, next) {
    try {
      const actorUser = req.user;
      const updated = await workplaceService.assignWorkplace(req.params.id, req.body, actorUser);
      res.status(200).json({
        success: true,
        message: 'Employee workplace assignment updated successfully',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  async getWorkplaceHistory(req, res, next) {
    try {
      const history = await workplaceService.getWorkplaceHistory(req.params.id);
      res.status(200).json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new WorkplaceController();
