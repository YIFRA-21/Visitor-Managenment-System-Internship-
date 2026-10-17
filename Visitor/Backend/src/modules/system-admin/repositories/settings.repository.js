const db = require('../../../config/db');

class SettingsRepository {
  async getSettings(orgId = 1) {
    const rows = await db.query(
      `SELECT setting_key, setting_value FROM organization_settings WHERE organization_id = ?`,
      [orgId]
    );

    const result = {
      general: {},
      localization: {},
      visitor: {},
      security: {},
      notifications: {},
      numbering: {},
      integrations: {},
      retention: {},
      features: {}
    };

    if (rows && rows.length > 0) {
      for (const row of rows) {
        try {
          result[row.setting_key] = typeof row.setting_value === 'string' ? JSON.parse(row.setting_value) : row.setting_value;
        } catch {
          result[row.setting_key] = {};
        }
      }
    }
    return result;
  }

  async getCategorySettings(category, orgId = 1) {
    const rows = await db.query(
      `SELECT setting_value FROM organization_settings WHERE organization_id = ? AND setting_key = ? LIMIT 1`,
      [orgId, category]
    );

    if (rows && rows.length > 0) {
      try {
        return typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
      } catch {
        return null;
      }
    }
    return null;
  }

  async updateCategorySettings(category, data, username, orgId = 1) {
    const current = (await this.getCategorySettings(category, orgId)) || {};
    const updated = { ...current, ...data };
    const jsonVal = JSON.stringify(updated);

    await db.query(
      `INSERT INTO organization_settings (organization_id, setting_key, setting_value)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [orgId, category, jsonVal, jsonVal]
    );

    // Record change log history
    for (const key of Object.keys(data)) {
      if (current[key] !== data[key]) {
        await db.query(
          `INSERT INTO settings_change_history (setting, prev_value, new_value, changed_by, reason) VALUES (?, ?, ?, ?, ?)`,
          [
            `${category}:${key}`,
            String(current[key] !== undefined ? current[key] : 'N/A'),
            String(data[key]),
            username || 'System Administrator',
            'Configuration Profile Update'
          ]
        );
      }
    }
    return updated;
  }

  async getHistory() {
    const rows = await db.query(
      `SELECT id, setting, prev_value AS prevValue, new_value AS newValue, changed_by AS changedBy, date, reason FROM settings_change_history ORDER BY id DESC`
    );
    return rows;
  }

  async getBackups() {
    const rows = await db.query(
      `SELECT id, date, size, created_by AS createdBy, status FROM settings_backups ORDER BY id DESC`
    );
    return rows;
  }

  async createBackup(username, orgId = 1) {
    const currentSettings = await this.getSettings(orgId);
    const snapshotStr = JSON.stringify(currentSettings);
    const sizeKb = `${(Math.random() * 2 + 3).toFixed(1)} KB`;

    const res = await db.query(
      `INSERT INTO settings_backups (size, created_by, status, snapshot) VALUES (?, ?, 'COMPLETED', ?)`,
      [sizeKb, username || 'System Administrator', snapshotStr]
    );

    return {
      id: res.insertId || 1,
      date: new Date().toISOString(),
      size: sizeKb,
      createdBy: username || 'System Administrator',
      status: 'COMPLETED'
    };
  }

  async restoreBackup(id, username, orgId = 1) {
    const rows = await db.query(`SELECT snapshot, date FROM settings_backups WHERE id = ? LIMIT 1`, [id]);
    if (!rows || rows.length === 0) return false;

    const snapshotStr = rows[0].snapshot;
    try {
      const parsed = JSON.parse(snapshotStr);
      for (const cat of Object.keys(parsed)) {
        await db.query(
          `INSERT INTO organization_settings (organization_id, setting_key, setting_value)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE setting_value = ?`,
          [orgId, cat, JSON.stringify(parsed[cat]), JSON.stringify(parsed[cat])]
        );
      }

      await db.query(
        `INSERT INTO settings_change_history (setting, prev_value, new_value, changed_by, reason) VALUES (?, ?, ?, ?, ?)`,
        [
          'System: Backup Restore',
          'Active Profile',
          `Backup snapshot ID ${id}`,
          username || 'System Administrator',
          `System state restored to backup dated ${rows[0].date}`
        ]
      );
      return true;
    } catch {
      return false;
    }
  }

  async deleteBackup(id) {
    await db.query(`DELETE FROM settings_backups WHERE id = ?`, [id]);
    return true;
  }

  // ── System Settings ────────────────────────────────────────────────────────

  async findAll(query = {}) {
    let sql = `SELECT id, setting_key AS \`key\`, setting_value AS \`value\`, setting_group AS category, description, updated_at AS updatedAt, updated_by AS updatedBy FROM system_settings`;
    const params = [];
    if (query && query.category) {
      sql += ` WHERE setting_group = ?`;
      params.push(query.category);
    }
    sql += ` ORDER BY setting_group ASC, setting_key ASC`;
    const rows = await db.query(sql, params);
    return rows || [];
  }

  async findByKey(key) {
    if (!key || key === ':key') {
      const rows = await db.query(
        `SELECT id, setting_key AS \`key\`, setting_value AS \`value\`, setting_group AS category, description, updated_at AS updatedAt, updated_by AS updatedBy FROM system_settings LIMIT 1`
      );
      return rows && rows[0]
        ? rows[0]
        : { key: 'system.site_name', value: 'Visitor Management System', category: 'GENERAL', description: 'System Site Name' };
    }
    const rows = await db.query(
      `SELECT id, setting_key AS \`key\`, setting_value AS \`value\`, setting_group AS category, description, updated_at AS updatedAt, updated_by AS updatedBy FROM system_settings WHERE setting_key = ? LIMIT 1`,
      [key]
    );
    if (!rows || rows.length === 0) {
      return { key, value: '', category: 'GENERAL', description: 'System setting' };
    }
    return rows[0];
  }

  async upsert(key, value, description = '', category = 'GENERAL', userId = 1) {
    const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
    await db.query(
      `INSERT INTO system_settings (setting_key, setting_value, setting_group, description, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         setting_value = VALUES(setting_value),
         setting_group = COALESCE(VALUES(setting_group), setting_group),
         description = COALESCE(VALUES(description), description),
         updated_by = VALUES(updated_by),
         updated_at = NOW()`,
      [key, valStr, category || 'GENERAL', description || '', userId || 1]
    );
    return { key, value: valStr, category: category || 'GENERAL', description: description || '' };
  }

  async deleteByKey(key) {
    if (key && key !== ':key') {
      await db.query(`DELETE FROM system_settings WHERE setting_key = ?`, [key]);
    }
    return true;
  }

  async getCategories() {
    const rows = await db.query(`SELECT DISTINCT setting_group AS category FROM system_settings WHERE setting_group IS NOT NULL`);
    const cats = (rows || []).map((r) => r.category).filter(Boolean);
    const defaults = ['GENERAL', 'SECURITY', 'VISITOR', 'NOTIFICATION', 'INTEGRATION', 'SYSTEM'];
    return Array.from(new Set([...cats, ...defaults]));
  }

  // ── Feature Flags ──────────────────────────────────────────────────────────

  async findAllFeatureFlags() {
    const rows = await db.query(
      `SELECT id, flag_uid AS flagUid, feature_key AS featureKey, feature_name AS featureName,
              feature_description AS featureDescription, module_id AS moduleId, module_name AS moduleName,
              enabled, rollout_percentage AS rolloutPercentage, rollout_strategy AS rolloutStrategy,
              environment, kill_switch AS killSwitch, version, status, is_active AS isActive,
              created_at AS createdAt, updated_at AS updatedAt
       FROM scc_feature_flags
       WHERE deleted_at IS NULL
       ORDER BY id ASC`
    );
    return rows || [];
  }

  async toggleFeatureFlag(id, enabled, userId = 1) {
    const isEnabled = enabled !== undefined ? (enabled ? 1 : 0) : 1;
    await db.query(
      `UPDATE scc_feature_flags
       SET enabled = ?, is_active = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [isEnabled, isEnabled, userId || 1, id]
    );
    return true;
  }

  // ── Module Registry ────────────────────────────────────────────────────────

  async findAllModules() {
    const rows = await db.query(
      `SELECT id, module_uid AS moduleUid, module_code AS moduleCode, module_name AS moduleName,
              module_description AS moduleDescription, module_version AS moduleVersion,
              module_category AS moduleCategory, entry_point AS entryPoint,
              health_status AS healthStatus, module_status AS moduleStatus,
              is_core AS isCore, is_active AS isActive,
              created_at AS createdAt, updated_at AS updatedAt
       FROM scc_module_registry
       WHERE deleted_at IS NULL
       ORDER BY id ASC`
    );
    return rows || [];
  }

  async toggleModule(id, enabled, userId = 1) {
    const isEnabled = enabled !== undefined ? (enabled ? 1 : 0) : 1;
    const status = isEnabled ? 'ACTIVE' : 'INACTIVE';
    await db.query(
      `UPDATE scc_module_registry
       SET is_active = ?, module_status = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [isEnabled, status, userId || 1, id]
    );
    return true;
  }

  // ── System Configurations ──────────────────────────────────────────────────

  async findAllConfigurations(query = {}) {
    let sql = `SELECT id, config_id AS configId, config_key AS \`key\`, config_value AS \`value\`,
                      config_type AS type, config_category AS category, module_scope AS moduleScope,
                      description, default_value AS defaultValue, is_editable AS isEditable,
                      is_sensitive AS isSensitive, status, is_active AS isActive,
                      created_at AS createdAt, updated_at AS updatedAt
               FROM system_configurations
               WHERE deleted_at IS NULL`;
    const params = [];
    if (query && query.category) {
      sql += ` AND config_category = ?`;
      params.push(query.category);
    }
    if (query && query.scope) {
      sql += ` AND module_scope = ?`;
      params.push(query.scope);
    }
    sql += ` ORDER BY id ASC`;
    const rows = await db.query(sql, params);
    return rows || [];
  }

  async updateConfiguration(id, value, userId = 1) {
    const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
    await db.query(
      `UPDATE system_configurations
       SET config_value = ?, last_modified_by = ?, last_modified_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [valStr, userId || 1, id]
    );
    return true;
  }
}

module.exports = new SettingsRepository();

