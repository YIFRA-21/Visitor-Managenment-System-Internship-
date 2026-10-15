const systemAdminService = require('../services/system.service');

class SystemAdminController {
  async getDashboardStats(req, res, next) {
    try {
      const stats = await systemAdminService.getDashboardStats();
      res.status(200).json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  async getSystemSettings(req, res, next) {
    try {
      const settings = await systemAdminService.getSystemSettings();
      res.status(200).json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  async updateSystemSetting(req, res, next) {
    try {
      const { key, value } = req.body;
      const updated = await systemAdminService.updateSystemSetting(key, value);
      res.status(200).json({ success: true, data: updated, message: `Setting '${key}' updated.` });
    } catch (err) {
      next(err);
    }
  }

  async getFeatureFlags(req, res, next) {
    try {
      const flags = await systemAdminService.getFeatureFlags();
      res.status(200).json({ success: true, data: flags });
    } catch (err) {
      next(err);
    }
  }

  async toggleFeatureFlag(req, res, next) {
    try {
      const { key } = req.params;
      const { enabled } = req.body;
      const updated = await systemAdminService.toggleFeatureFlag(key, enabled);
      res.status(200).json({ success: true, data: updated, message: `Feature flag '${key}' set to ${enabled}` });
    } catch (err) {
      next(err);
    }
  }

  async getBackupHistory(req, res, next) {
    try {
      const history = await systemAdminService.getBackupHistory();
      res.status(200).json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }

  async triggerBackup(req, res, next) {
    try {
      const { type } = req.body;
      const backup = await systemAdminService.triggerBackup(type || 'FULL');
      res.status(201).json({ success: true, data: backup, message: 'System backup triggered successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async getScheduledJobs(req, res, next) {
    try {
      const jobs = await systemAdminService.getScheduledJobs();
      res.status(200).json({ success: true, data: jobs });
    } catch (err) {
      next(err);
    }
  }

  async getIntegrations(req, res, next) {
    try {
      const integrations = await systemAdminService.getIntegrations();
      res.status(200).json({ success: true, data: integrations });
    } catch (err) {
      next(err);
    }
  }

  async getSecurityPolicies(req, res, next) {
    try {
      const policies = await systemAdminService.getSecurityPolicies();
      res.status(200).json({ success: true, data: policies });
    } catch (err) {
      next(err);
    }
  }

  async updateSecurityPolicies(req, res, next) {
    try {
      const updated = await systemAdminService.updateSecurityPolicies(req.body);
      res.status(200).json({ success: true, data: updated, message: 'Security policies updated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async getMaintenanceConfig(req, res, next) {
    try {
      const config = await systemAdminService.getMaintenanceConfig();
      res.status(200).json({ success: true, data: config });
    } catch (err) {
      next(err);
    }
  }

  async setMaintenanceConfig(req, res, next) {
    try {
      const updated = await systemAdminService.setMaintenanceConfig(req.body);
      res.status(200).json({ success: true, data: updated, message: 'Maintenance mode updated.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SystemAdminController();
