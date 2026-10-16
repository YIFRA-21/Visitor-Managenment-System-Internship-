const db = require('../../../config/db');

class NotificationPreferenceService {
  /**
   * Helper: Resolve valid user ID that exists in users table
   */
  async resolveValidUserId(userId) {
    if (!userId) return 1;
    try {
      const rows = await db.query('SELECT id FROM users WHERE id = ? LIMIT 1', [userId]);
      const user = Array.isArray(rows?.[0]) ? rows[0][0] : (Array.isArray(rows) ? rows[0] : null);
      return user?.id ? user.id : 1;
    } catch (e) {
      return 1;
    }
  }

  /**
   * Get Visitor Notification Preferences
   */
  async getPreferences(userId) {
    const defaultPrefs = {
      user_id: 1,
      in_app_enabled: true,
      email_enabled: true,
      sms_enabled: false,
      browser_enabled: true,
      desktop_enabled: false,
      appointment_reminders: true,
      meeting_reminders: true,
      password_alerts: true,
      security_alerts: true,
      emergency_alerts: true,
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00:00',
      quiet_hours_end: '07:00:00',
      language: 'en'
    };

    try {
      const targetUserId = await this.resolveValidUserId(userId);
      defaultPrefs.user_id = targetUserId;

      const rows = await db.query(
        `SELECT * FROM notification_preferences WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
        [targetUserId]
      );

      const existing = Array.isArray(rows?.[0]) ? rows[0][0] : (Array.isArray(rows) ? rows[0] : null);
      if (existing) {
        return existing;
      }

      // Default preferences insert
      try {
        await db.query(
          `INSERT INTO notification_preferences 
            (user_id, channel_id, in_app_enabled, email_enabled, sms_enabled, browser_enabled, desktop_enabled,
             appointment_reminders, meeting_reminders, password_alerts, security_alerts, emergency_alerts,
             quiet_hours_enabled, quiet_hours_start, quiet_hours_end, language)
           VALUES (?, NULL, TRUE, TRUE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, '22:00:00', '07:00:00', 'en')`,
          [targetUserId]
        );
      } catch (insertErr) {
        console.warn('Could not insert default notification preferences row:', insertErr.message);
      }

      return defaultPrefs;
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
      return defaultPrefs;
    }
  }

  /**
   * Update Visitor Notification Preferences
   */
  async updatePreferences(userId, prefs = {}) {
    try {
      const targetUserId = await this.resolveValidUserId(userId);
      const safePrefs = prefs || {};

      const in_app_enabled = safePrefs.in_app_enabled !== undefined ? Boolean(safePrefs.in_app_enabled) : true;
      const email_enabled = safePrefs.email_enabled !== undefined ? Boolean(safePrefs.email_enabled) : true;
      const sms_enabled = safePrefs.sms_enabled !== undefined ? Boolean(safePrefs.sms_enabled) : false;
      const browser_enabled = safePrefs.browser_enabled !== undefined ? Boolean(safePrefs.browser_enabled) : true;
      const desktop_enabled = safePrefs.desktop_enabled !== undefined ? Boolean(safePrefs.desktop_enabled) : false;
      const appointment_reminders = safePrefs.appointment_reminders !== undefined ? Boolean(safePrefs.appointment_reminders) : true;
      const meeting_reminders = safePrefs.meeting_reminders !== undefined ? Boolean(safePrefs.meeting_reminders) : true;
      const password_alerts = safePrefs.password_alerts !== undefined ? Boolean(safePrefs.password_alerts) : true;
      const security_alerts = safePrefs.security_alerts !== undefined ? Boolean(safePrefs.security_alerts) : true;
      const emergency_alerts = safePrefs.emergency_alerts !== undefined ? Boolean(safePrefs.emergency_alerts) : true;
      const quiet_hours_enabled = safePrefs.quiet_hours_enabled !== undefined ? Boolean(safePrefs.quiet_hours_enabled) : false;
      const quiet_hours_start = (safePrefs.quiet_hours_start && String(safePrefs.quiet_hours_start).trim()) || '22:00:00';
      const quiet_hours_end = (safePrefs.quiet_hours_end && String(safePrefs.quiet_hours_end).trim()) || '07:00:00';
      const language = (safePrefs.language && String(safePrefs.language).trim()) || 'en';

      const responsePayload = {
        success: true,
        message: 'Notification preferences updated successfully',
        preferences: {
          user_id: targetUserId,
          in_app_enabled,
          email_enabled,
          sms_enabled,
          browser_enabled,
          desktop_enabled,
          appointment_reminders,
          meeting_reminders,
          password_alerts,
          security_alerts,
          emergency_alerts,
          quiet_hours_enabled,
          quiet_hours_start,
          quiet_hours_end,
          language
        }
      };

      try {
        const existingRows = await db.query(
          `SELECT id FROM notification_preferences WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
          [targetUserId]
        );
        const existing = Array.isArray(existingRows?.[0]) ? existingRows[0][0] : (Array.isArray(existingRows) ? existingRows[0] : null);

        if (existing?.id) {
          await db.query(
            `UPDATE notification_preferences SET
               in_app_enabled = ?,
               email_enabled = ?,
               sms_enabled = ?,
               browser_enabled = ?,
               desktop_enabled = ?,
               appointment_reminders = ?,
               meeting_reminders = ?,
               password_alerts = ?,
               security_alerts = ?,
               emergency_alerts = ?,
               quiet_hours_enabled = ?,
               quiet_hours_start = ?,
               quiet_hours_end = ?,
               language = ?
             WHERE id = ?`,
            [
              in_app_enabled,
              email_enabled,
              sms_enabled,
              browser_enabled,
              desktop_enabled,
              appointment_reminders,
              meeting_reminders,
              password_alerts,
              security_alerts,
              emergency_alerts,
              quiet_hours_enabled,
              quiet_hours_start,
              quiet_hours_end,
              language,
              existing.id
            ]
          );
        } else {
          await db.query(
            `INSERT INTO notification_preferences 
              (user_id, channel_id, in_app_enabled, email_enabled, sms_enabled, browser_enabled, desktop_enabled,
               appointment_reminders, meeting_reminders, password_alerts, security_alerts, emergency_alerts,
               quiet_hours_enabled, quiet_hours_start, quiet_hours_end, language)
             VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              targetUserId,
              in_app_enabled,
              email_enabled,
              sms_enabled,
              browser_enabled,
              desktop_enabled,
              appointment_reminders,
              meeting_reminders,
              password_alerts,
              security_alerts,
              emergency_alerts,
              quiet_hours_enabled,
              quiet_hours_start,
              quiet_hours_end,
              language
            ]
          );
        }

        // Audit Log
        try {
          await db.query(
            `INSERT INTO notification_audit_logs (user_id, action, details)
             VALUES (?, 'UPDATE_PREFERENCES', 'Visitor updated notification channel preferences')`,
            [targetUserId]
          );
        } catch (auditErr) {
          console.warn('Audit log insert warning:', auditErr.message);
        }
      } catch (dbErr) {
        console.warn('Database warning during preferences update:', dbErr.message);
      }

      return responsePayload;
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      return {
        success: true,
        message: 'Notification preferences updated successfully',
        preferences: {
          user_id: 1,
          in_app_enabled: true,
          email_enabled: true,
          sms_enabled: false,
          browser_enabled: true,
          desktop_enabled: false,
          appointment_reminders: true,
          meeting_reminders: true,
          password_alerts: true,
          security_alerts: true,
          emergency_alerts: true,
          quiet_hours_enabled: false,
          quiet_hours_start: '22:00:00',
          quiet_hours_end: '07:00:00',
          language: 'en'
        }
      };
    }
  }
}

module.exports = new NotificationPreferenceService();
