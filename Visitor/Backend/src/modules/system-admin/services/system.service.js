const db = require('../../../config/db');

class SystemAdminService {
  async getDashboardStats() {
    const employeesCount = (db.mockDb?.employees || []).filter(e => !e.deleted_at).length;
    const activeVisitorsCount = (db.mockDb?.visitors || []).length;
    const appointmentsCount = (db.mockDb?.appointments || []).length;
    const auditLogsCount = (db.mockDb?.audit_logs || []).length;
    const backupJobsCount = (db.mockDb?.backup_jobs || []).length;

    return {
      systemHealth: {
        status: 'HEALTHY',
        databaseStatus: 'ONLINE',
        emailStatus: 'ACTIVE',
        smsStatus: 'ACTIVE',
        queueStatus: 'IDLE',
        storageUsagePct: 28.4,
        cpuUsagePct: 14.2,
        memoryUsagePct: 41.8,
        uptimeSeconds: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'production',
        appVersion: 'v2.4.0-enterprise'
      },
      kpis: {
        activeEmployees: employeesCount || 5,
        totalVisitors: activeVisitorsCount || 12,
        totalAppointments: appointmentsCount || 8,
        auditRecords: auditLogsCount || 45,
        completedBackups: backupJobsCount || 2,
        activeBranches: 1,
        activeDepartments: 4
      },
      maintenanceMode: db.mockDb?.maintenance_config || { is_active: false }
    };
  }

  async getSystemSettings() {
    return db.mockDb?.system_settings || [];
  }

  async updateSystemSetting(key, value) {
    const list = db.mockDb?.system_settings || [];
    const setting = list.find(s => s.key === key);
    if (setting) {
      setting.value = String(value);
      setting.updated_at = new Date().toISOString();
      return setting;
    } else {
      const newSetting = {
        id: list.length + 1,
        key,
        value: String(value),
        category: 'custom',
        updated_at: new Date().toISOString()
      };
      list.push(newSetting);
      return newSetting;
    }
  }

  async getFeatureFlags() {
    return db.mockDb?.feature_flags || [];
  }

  async toggleFeatureFlag(key, enabled) {
    const flags = db.mockDb?.feature_flags || [];
    const flag = flags.find(f => f.key === key);
    if (flag) {
      flag.enabled = Boolean(enabled);
      return flag;
    }
    return null;
  }

  async getBackupHistory() {
    return db.mockDb?.backup_jobs || [];
  }

  async triggerBackup(type = 'FULL') {
    const list = db.mockDb?.backup_jobs || [];
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const newBackup = {
      id: list.length + 1,
      filename: `vms_backup_${dateStr}_${timeStr}_${type.toLowerCase()}.sql`,
      type,
      size_mb: Number((Math.random() * 50 + 150).toFixed(1)),
      status: 'COMPLETED',
      created_at: now.toISOString(),
      duration_sec: Math.floor(Math.random() * 20 + 10)
    };
    list.unshift(newBackup);
    return newBackup;
  }

  async getScheduledJobs() {
    return db.mockDb?.scheduled_jobs || [];
  }

  async getIntegrations() {
    return db.mockDb?.integration_configs || [];
  }

  async getSecurityPolicies() {
    return db.mockDb?.security_policies || {};
  }

  async updateSecurityPolicies(policies) {
    db.mockDb.security_policies = {
      ...db.mockDb.security_policies,
      ...policies
    };
    return db.mockDb.security_policies;
  }

  async getMaintenanceConfig() {
    return db.mockDb?.maintenance_config || { is_active: false };
  }

  async setMaintenanceConfig(config) {
    db.mockDb.maintenance_config = {
      ...db.mockDb.maintenance_config,
      ...config
    };
    return db.mockDb.maintenance_config;
  }
}

module.exports = new SystemAdminService();
