const orgSettingsService = require('../services/org-settings.service');

class OrgSettingsController {
  async get(req, res, next) {
    try {
      const settings = await orgSettingsService.getSettings(req.params.id);
      res.status(200).json({
        success: true,
        data: settings
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const settings = await orgSettingsService.updateSettings(req.params.id, req.body, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Organization settings updated successfully.',
        data: settings
      });
    } catch (err) {
      next(err);
    }
  }

  async updateBranding(req, res, next) {
    try {
      const branding = await orgSettingsService.updateBranding(req.params.id, req.body, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Organization branding updated successfully.',
        data: branding
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrgSettingsController();
