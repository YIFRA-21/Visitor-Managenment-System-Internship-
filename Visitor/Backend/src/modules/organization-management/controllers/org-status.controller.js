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
      const { status, reason } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required. Allowed values: ACTIVE, INACTIVE, SUSPENDED.',
        });
      }

      const allowedStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED'];
      if (!allowedStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid status value '${status}'. Allowed: ${allowedStatuses.join(', ')}.`,
        });
      }

      const result = await statusService.changeStatus(
        id,
        status.toUpperCase(),
        req.user.id,
        reason || ''
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
