const statusService = require('../services/org-status.service');

class OrganizationStatusController {
  /**
   * PATCH /api/organizations/:id/status
   * Change organization status with validation.
   * Body: { status: 'ACTIVE'|'INACTIVE'|'SUSPENDED', reason?: string }
   */
  async changeStatus(req, res, next) {
    try {
      const { id } = req.params;
      const rawStatus = req.body?.status || req.body?.state || req.body?.org_status || req.body?.newStatus || 'ACTIVE';
      const status = String(rawStatus).trim().toUpperCase();
      const reason = req.body?.reason || '';
      const operatorId = req.user?.id || req.user?.userId || 1;

      const result = await statusService.changeStatus(
        id,
        status,
        operatorId,
        reason
      );

      res.status(200).json({
        success: true,
        message: `Organization status changed from ${result.previousStatus} to ${result.currentStatus}.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/organizations/:id/status/history
   * Get status change history for an organization.
   */
  async getHistory(req, res, next) {
    try {
      const { id } = req.params;
      const history = await statusService.getStatusHistory(id);
      res.status(200).json(history);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/organizations/:id/status
   * Get current status info with allowed transitions.
   */
  async getCurrentStatus(req, res, next) {
    try {
      const { id } = req.params;
      const statusInfo = await statusService.getCurrentStatus(id);
      res.status(200).json(statusInfo);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrganizationStatusController();
