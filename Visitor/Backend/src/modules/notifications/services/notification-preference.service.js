const db = require('../../../config/db');

class NotificationPreferenceService {
  /**
   * Get Visitor Notification Preferences
   */
  async getPreferences(userId) {
    try {
      const rows = await db.query(
        `SELECT * FROM notification_preferences WHERE user_id = ? LIMIT 1`,
        [userId]
      );

      if (Array.isArray(rows) && rows.length > 0) {
        return rows[0];
      }

      // Default preferences insert
      const defaultPrefs = {
        user_id: userId,
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

      await db.query(
        `INSERT INTO notification_preferences 
          (user_id, in_app_enabled, email_enabled, sms_enabled, browser_enabled, desktop_enabled,
           appointment_reminders, meeting_reminders, password_alerts, security_alerts, emergency_alerts,
           quiet_hours_enabled, quiet_hours_start, quiet_hours_end, language)
         VALUES (?, TRUE, TRUE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, '22:00:00', '07:00:00', 'en')`,
        [userId]
      );

      return defaultPrefs;
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
      throw err;
    }
  }

  /**
   * Update Visitor Notification Preferences
   */
  async updatePreferences(userId, prefs) {
    try {
      const {
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
      } = prefs;

      await db.query(
        `INSERT INTO notification_preferences 
          (user_id, in_app_enabled, email_enabled, sms_enabled, browser_enabled, desktop_enabled,
           appointment_reminders, meeting_reminders, password_alerts, security_alerts, emergency_alerts,
           quiet_hours_enabled, quiet_hours_start, quiet_hours_end, language)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           in_app_enabled = VALUES(in_app_enabled),
           email_enabled = VALUES(email_enabled),
           sms_enabled = VALUES(sms_enabled),
           browser_enabled = VALUES(browser_enabled),
           desktop_enabled = VALUES(desktop_enabled),
           appointment_reminders = VALUES(appointment_reminders),
           meeting_reminders = VALUES(meeting_reminders),
           password_alerts = VALUES(password_alerts),
           security_alerts = VALUES(security_alerts),
           emergency_alerts = VALUES(emergency_alerts),
           quiet_hours_enabled = VALUES(quiet_hours_enabled),
           quiet_hours_start = VALUES(quiet_hours_start),
           quiet_hours_end = VALUES(quiet_hours_end),
           language = VALUES(language)`,
        [
          userId,
          in_app_enabled ?? true,
          email_enabled ?? true,
          sms_enabled ?? false,
          browser_enabled ?? true,
          desktop_enabled ?? false,
          appointment_reminders ?? true,
          meeting_reminders ?? true,
          password_alerts ?? true,
          security_alerts ?? true,
          emergency_alerts ?? true,
          quiet_hours_enabled ?? false,
          quiet_hours_start || '22:00:00',
          quiet_hours_end || '07:00:00',
          language || 'en'
        ]
      );

      // Audit Log
      await db.query(
        `INSERT INTO notification_audit_logs (user_id, action, details)
         VALUES (?, 'UPDATE_PREFERENCES', 'Visitor updated notification channel preferences')`,
        [userId]
      );

      return { success: true, message: 'Notification preferences updated successfully' };
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      throw err;
    }
  }
}

module.exports = new NotificationPreferenceService();
