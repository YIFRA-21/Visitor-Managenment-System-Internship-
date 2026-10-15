const workingScheduleService = require('../services/working-schedule.service');

class WorkingScheduleController {
  async getOrgSchedule(req, res, next) {
    try {
      const { organizationId } = req.query;
      if (!organizationId) {
        return res.status(400).json({ error: 'organizationId is required.' });
      }
      const sched = await workingScheduleService.getOrgSchedule(organizationId);
      res.status(200).json(sched);
    } catch (err) {
      next(err);
    }
  }

  async saveOrgSchedule(req, res, next) {
    try {
      const userRole = req.user?.role || 'admin';
      const result = await workingScheduleService.saveOrgSchedule(req.body, userRole);
      res.status(200).json({
        success: true,
        message: 'Organization working schedule updated successfully.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getBranchSchedule(req, res, next) {
    try {
      const { organizationId, branchId } = req.query;
      if (!organizationId || !branchId) {
        return res.status(400).json({ error: 'organizationId and branchId are required.' });
      }
      const sched = await workingScheduleService.getBranchSchedule(organizationId, branchId);
      res.status(200).json(sched);
    } catch (err) {
      next(err);
    }
  }

  async saveBranchSchedule(req, res, next) {
    try {
      const userRole = req.user?.role || 'admin';
      const result = await workingScheduleService.saveBranchSchedule(req.body, userRole);
      res.status(200).json({
        success: true,
        message: 'Branch schedule override saved successfully.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async resetBranchSchedule(req, res, next) {
    try {
      const userRole = req.user?.role || 'admin';
      const { organizationId, branchId } = req.body;
      if (!organizationId || !branchId) {
        return res.status(400).json({ error: 'organizationId and branchId are required.' });
      }
      const result = await workingScheduleService.resetBranchSchedule(organizationId, branchId, userRole);
      res.status(200).json({
        success: true,
        message: 'Branch schedule reset to organization defaults.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new WorkingScheduleController();
