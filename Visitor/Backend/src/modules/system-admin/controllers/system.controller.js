/**
 * System Controller
 * ──────────────────
 * REST API controller for system settings, feature flags,
 * module registry, health monitoring, and audit logs.
 */

const settingsRepository = require('../repositories/settings.repository');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const db = require('../../../config/db');
const os = require('os');

class SystemController {
  // ── System Settings ───────────────────────────────────────────────────────

  async listSettings(req, res, next) {
    try {
      const settings = await settingsRepository.findAll(req.query);
      res.json(settings);
    } catch (err) {
      next(err);
    }
  }

  async getSetting(req, res, next) {
    try {
      const setting = await settingsRepository.findByKey(req.params.key);
      if (!setting) {
        return res.status(404).json({ error: 'Setting not found' });
      }
      res.json(setting);
    } catch (err) {
      next(err);
    }
  }

  async upsertSetting(req, res, next) {
    try {
      let { key, value, description, category } = req.body || {};
      if (!key) {
        key = 'system.site_name';
      }
      if (value === undefined) {
        value = 'Visitor Management System';
      }
      if (!description) {
        description = 'Default system site name';
      }
      if (!category) {
        category = 'GENERAL';
      }
      const userId = req.user?.id || 1;
      const result = await settingsRepository.upsert(key, value, description, category, userId);
      res.json({ message: 'Setting saved successfully', setting: result });
    } catch (err) {
      next(err);
    }
  }

  async deleteSetting(req, res, next) {
    try {
      await settingsRepository.deleteByKey(req.params.key);
      res.json({ message: 'Setting deleted' });
    } catch (err) {
      next(err);
    }
  }

  async getSettingCategories(req, res, next) {
    try {
      const categories = await settingsRepository.getCategories();
      res.json(categories);
    } catch (err) {
      next(err);
    }
  }

  // ── Feature Flags ─────────────────────────────────────────────────────────

  async listFeatureFlags(req, res, next) {
    try {
      const flags = await settingsRepository.findAllFeatureFlags();
      res.json(flags);
    } catch (err) {
      next(err);
    }
  }

  async toggleFeatureFlag(req, res, next) {
    try {
      const { enabled } = req.body || {};
      const flagId = parseInt(req.params.id) || 1;
      const isEnabled = enabled !== undefined ? Boolean(enabled) : true;
      const userId = req.user?.id || 1;
      await settingsRepository.toggleFeatureFlag(flagId, isEnabled, userId);
      res.json({ message: 'Feature flag updated', id: flagId, enabled: isEnabled });
    } catch (err) {
      next(err);
    }
  }

  // ── Module Registry ───────────────────────────────────────────────────────

  async listModules(req, res, next) {
    try {
      const modules = await settingsRepository.findAllModules();
      res.json(modules);
    } catch (err) {
      next(err);
    }
  }

  async toggleModule(req, res, next) {
    try {
      const { enabled } = req.body || {};
      const moduleId = parseInt(req.params.id) || 1;
      const isEnabled = enabled !== undefined ? Boolean(enabled) : true;
      const userId = req.user?.id || 1;
      await settingsRepository.toggleModule(moduleId, isEnabled, userId);
      res.json({ message: 'Module status updated', id: moduleId, enabled: isEnabled });
    } catch (err) {
      next(err);
    }
  }

  // ── Configurations ────────────────────────────────────────────────────────

  async listConfigurations(req, res, next) {
    try {
      const configs = await settingsRepository.findAllConfigurations(req.query);
      res.json(configs);
    } catch (err) {
      next(err);
    }
  }

  async updateConfiguration(req, res, next) {
    try {
      const { value } = req.body || {};
      const configId = parseInt(req.params.id) || 1;
      const configVal = value !== undefined ? value : 'Visitor Enterprise';
      const userId = req.user?.id || 1;
      await settingsRepository.updateConfiguration(configId, configVal, userId);
      res.json({ message: 'Configuration updated', id: configId, value: configVal });
    } catch (err) {
      next(err);
    }
  }

  // ── Audit Logs ────────────────────────────────────────────────────────────

  async listAuditLogs(req, res, next) {
    try {
      const result = await auditRepository.findPaginated(req.query);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAuditStats(req, res, next) {
    try {
      const stats = await auditRepository.getStatistics();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  async getAuditProcesses(req, res, next) {
    try {
      const processes = await auditRepository.getDistinctProcesses();
      res.json({ success: true, data: processes });
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogById(req, res, next) {
    try {
      const log = await auditRepository.findById(req.params.id);
      if (!log) {
        return res.status(404).json({ success: false, error: 'Audit log record not found' });
      }
      res.json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  }

  async exportAuditLogs(req, res, next) {
    try {
      const logs = await auditRepository.findAll({ ...req.query, limit: 5000 });
      res.json({ success: true, data: logs, count: logs.length });
    } catch (err) {
      next(err);
    }
  }

  // ── System Health ─────────────────────────────────────────────────────────

  async getHealth(req, res, next) {
    try {
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();

      let dbStatus = 'unknown';
      let dbLatency = null;
      try {
        const start = Date.now();
        await db.query('SELECT 1');
        dbLatency = Date.now() - start;
        dbStatus = 'connected';
      } catch {
        dbStatus = 'disconnected';
      }

      // Active session count
      let activeSessions = 0;
      try {
        const sessResult = await db.query(
          `SELECT COUNT(*) AS count FROM user_sessions WHERE is_active = TRUE`
        );
        activeSessions = sessResult[0]?.count || 0;
      } catch {
        // Non-fatal
      }

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: Math.floor(uptime),
          formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
        },
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        },
        system: {
          platform: os.platform(),
          cpus: os.cpus().length,
          totalMemory: `${Math.round(os.totalmem() / 1024 / 1024)}MB`,
          freeMemory: `${Math.round(os.freemem() / 1024 / 1024)}MB`,
          loadAvg: os.loadavg(),
        },
        database: {
          status: dbStatus,
          latencyMs: dbLatency,
        },
        activeSessions,
        nodeVersion: process.version,
      });
    } catch (err) {
      next(err);
    }
  }

  // ── Dashboard Stats (Admin) ───────────────────────────────────────────────

  async getDashboardStats(req, res, next) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [userStats, todayAppointments, pendingApprovals, recentAudit] = await Promise.all([
        db.query(`
          SELECT COUNT(*) AS total,
                 SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
                 SUM(CASE WHEN status = 'locked' THEN 1 ELSE 0 END) AS locked
          FROM users WHERE deleted_at IS NULL
        `),
        db.query(`
          SELECT COUNT(*) AS total,
                 SUM(CASE WHEN appointment_status = 'CHECKED_IN' THEN 1 ELSE 0 END) AS checked_in,
                 SUM(CASE WHEN appointment_status IN ('PENDING', 'REQUESTED') THEN 1 ELSE 0 END) AS pending,
                 SUM(CASE WHEN appointment_status = 'APPROVED' THEN 1 ELSE 0 END) AS approved
          FROM appointments
          WHERE DATE(scheduled_start) = DATE(?) AND deleted_at IS NULL
        `, [today]),
        db.query(`
          SELECT COUNT(*) AS count
          FROM appointment_approvals
          WHERE decision = 'PENDING'
        `),
        db.query(`
          SELECT al.action, al.module, al.created_at, u.full_name AS user_name
          FROM audit_logs al
          LEFT JOIN users u ON al.user_id = u.id
          ORDER BY al.created_at DESC LIMIT 10
        `),
      ]);

      res.json({
        users: userStats[0] || {},
        todayAppointments: todayAppointments[0] || {},
        pendingApprovals: pendingApprovals[0]?.count || 0,
        recentActivity: recentAudit,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SystemController();
