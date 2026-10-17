const timeZoneService = require('../services/timezone.service');

class TimeZoneController {
  async get(req, res, next) {
    try {
      const organizationId = req.query?.organizationId || req.query?.org_id || 1;
      const branchId = req.query?.branchId || null;
      const data = await timeZoneService.getTimeZones(organizationId, branchId);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  async save(req, res, next) {
    try {
      const userRole = req.user?.role || 'admin';
      const result = await timeZoneService.saveTimeZone(req.body, userRole);
      res.status(200).json({
        success: true,
        message: 'TimeZone configurations saved successfully.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TimeZoneController();
