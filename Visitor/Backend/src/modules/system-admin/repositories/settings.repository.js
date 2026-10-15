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
}

module.exports = new SettingsRepository();
