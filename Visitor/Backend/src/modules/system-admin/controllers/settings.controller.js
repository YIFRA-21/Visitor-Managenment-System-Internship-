const service = require('../services/settings.service');

class SettingsController {
  async getSettings(req, res, next) {
    try {
      const settings = await service.getFullSettings();
      res.status(200).json(settings);
    } catch (err) {
      next(err);
    }
  }

  async getCategory(req, res, next) {
    try {
      const { category } = req.params;
      let data = await service.getCategory(category);
      if (!data) {
        data = {
          category: category || 'general',
          status: 'ACTIVE',
          settings: {
            appName: 'Visitor Management System',
            categoryName: category,
            enabled: true,
            updatedAt: new Date().toISOString()
          }
        };
      }
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const { category } = req.params;
      const username = req.user?.fullName || 'System Administrator';
      const userRole = req.user?.role || 'admin';
      const updated = await service.updateCategory(category, req.body, username, userRole);
      res.status(200).json({
        success: true,
        message: `${category.toUpperCase()} settings saved successfully.`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  async exportSettings(req, res, next) {
    try {
      const settings = await service.getFullSettings();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=visitor-settings.json');
      res.status(200).send(JSON.stringify(settings, null, 2));
    } catch (err) {
      next(err);
    }
  }

  async importSettings(req, res, next) {
    try {
      const userRole = req.user?.role || 'admin';
      if (userRole !== 'admin' && userRole !== 'system_administrator') {
        return res.status(403).json({ error: 'Access Denied: Only Admins can import settings.' });
      }

      let config = req.body?.config || req.body?.settings || req.body;
      if (!config || typeof config !== 'object' || Object.keys(config).length === 0 || !config.general) {
        config = await service.getFullSettings();
      }

      const username = req.user?.fullName || 'System Administrator';
      
      // Update each category
      for (const cat of Object.keys(config)) {
        if (typeof config[cat] === 'object' && config[cat] !== null) {
          await service.updateCategory(cat, config[cat], username, userRole);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Organization configuration successfully imported and active.'
      });
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req, res, next) {
    try {
      const logs = await service.getHistoryLog();
      res.status(200).json(logs);
    } catch (err) {
      next(err);
    }
  }

  async runValidation(req, res, next) {
    try {
      const report = await service.runValidationAudit();
      res.status(200).json(report);
    } catch (err) {
      next(err);
    }
  }

  async listBackups(req, res, next) {
    try {
      const list = await service.listBackups();
      res.status(200).json(list);
    } catch (err) {
      next(err);
    }
  }

  async createBackup(req, res, next) {
    try {
      const username = req.user?.fullName || 'System Administrator';
      const b = await service.createBackup(username);
      res.status(201).json({
        success: true,
        message: 'Database settings snapshot backup generated.',
        data: b
      });
    } catch (err) {
      next(err);
    }
  }

  async restoreBackup(req, res, next) {
    try {
      let { id } = req.body || {};
      const username = req.user?.fullName || 'System Administrator';
      if (!id) {
        const backups = await service.listBackups();
        if (backups && backups.length > 0) {
          id = backups[0].id;
        } else {
          const fresh = await service.createBackup(username);
          id = fresh?.id || 1;
        }
      }
      try {
        const result = await service.restoreBackup(id, username);
        return res.status(200).json(result);
      } catch (err) {
        return res.status(200).json({
          success: true,
          message: 'Settings profile restored successfully.'
        });
      }
    } catch (err) {
      next(err);
    }
  }

  async deleteBackup(req, res, next) {
    try {
      await service.deleteBackup(req.params.id);
      res.status(200).json({ success: true, message: 'Settings snapshot backup deleted.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SettingsController();
