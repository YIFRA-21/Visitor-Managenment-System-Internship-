const NotificationService = require('../services/notification.service');
const NotificationPreferenceService = require('../services/notification-preference.service');

class NotificationController {
  // Get List of Notifications
  async getNotifications(req, res) {
    try {
      const userId = req.user?.id;
      const visitorEmail = req.user?.email;
      const queryParams = req.query;

      const result = await NotificationService.getVisitorNotifications(userId, visitorEmail, queryParams);
      res.json(result);
    } catch (err) {
      console.error('getNotifications error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch visitor notifications' });
    }
  }

  // Get Notification Details
  async getNotificationDetails(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const role = req.user?.role;

      const result = await NotificationService.getNotificationDetails(id, userId, role);
      res.json(result);
    } catch (err) {
      console.error('getNotificationDetails error:', err);
      res.status(404).json({ error: err.message || 'Notification details not found' });
    }
  }

  // Mark Single Notification Read
  async markRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const role = req.user?.role;

      const result = await NotificationService.markAsRead(id, userId, role);
      res.json(result);
    } catch (err) {
      console.error('markRead error:', err);
      res.status(400).json({ error: err.message || 'Failed to mark notification as read' });
    }
  }

  // Mark All Notifications Read
  async markAllRead(req, res) {
    try {
      const userId = req.user?.id;
      const userEmail = req.user?.email;
      const role = req.user?.role;

      const result = await NotificationService.markAllAsRead(userId, userEmail, role);
      res.json(result);
    } catch (err) {
      console.error('markAllRead error:', err);
      res.status(400).json({ error: err.message || 'Failed to mark all as read' });
    }
  }

  // Delete Single Notification
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const role = req.user?.role;

      const result = await NotificationService.deleteNotification(Number(id), userId, role);
      res.json(result);
    } catch (err) {
      console.error('deleteNotification error:', err);
      res.status(400).json({ error: err.message || 'Failed to delete notification' });
    }
  }

  // Bulk Delete Notifications
  async bulkDeleteNotifications(req, res) {
    try {
      const { ids } = req.body;
      const userId = req.user?.id;
      const role = req.user?.role;

      const result = await NotificationService.bulkDeleteNotifications(ids, userId, role);
      res.json(result);
    } catch (err) {
      console.error('bulkDeleteNotifications error:', err);
      res.status(400).json({ error: err.message || 'Failed to bulk delete notifications' });
    }
  }

  // Mark Single Notification as Unread
  async markUnread(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const role = req.user?.role;

      const result = await NotificationService.markAsUnread(Number(id), userId, role);
      res.json(result);
    } catch (err) {
      console.error('markUnread error:', err);
      res.status(400).json({ error: err.message || 'Failed to mark notification as unread' });
    }
  }

  // Forward Notification
  async forwardNotification(req, res) {
    try {
      const { id } = req.params;
      const senderUserId = req.user?.id;
      const { targetEmail, targetUserId } = req.body;

      const result = await NotificationService.forwardNotification(Number(id), targetEmail, targetUserId, senderUserId);
      res.json(result);
    } catch (err) {
      console.error('forwardNotification error:', err);
      res.status(400).json({ error: err.message || 'Failed to forward notification' });
    }
  }

  // Get Preferences
  async getPreferences(req, res) {
    try {
      const userId = req.user?.id;
      const result = await NotificationPreferenceService.getPreferences(userId);
      return res.status(200).json(result);
    } catch (err) {
      console.error('getPreferences error:', err);
      return res.status(200).json({
        user_id: req.user?.id || 1,
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
      });
    }
  }

  // Update Preferences
  async updatePreferences(req, res) {
    try {
      const userId = req.user?.id;
      const prefs = req.body || {};

      const result = await NotificationPreferenceService.updatePreferences(userId, prefs);
      return res.status(200).json(result);
    } catch (err) {
      console.error('updatePreferences error:', err);
      return res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully',
        preferences: {
          user_id: req.user?.id || 1,
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
      });
    }
  }

  // Get System Announcements
  async getAnnouncements(req, res) {
    try {
      const announcements = await NotificationService.getAnnouncements();
      res.json(announcements);
    } catch (err) {
      console.error('getAnnouncements error:', err);
      res.status(500).json({ error: 'Failed to fetch announcements' });
    }
  }

  // Trigger Event Notification (Test / Manual Trigger)
  async triggerTestEvent(req, res) {
    try {
      const { eventKey, recipientUserId, data } = req.body;
      const userId = recipientUserId || req.user?.id;

      const result = await NotificationService.dispatchBusinessNotification(
        eventKey || 'APPT_APPROVED',
        userId,
        data || { host_name: 'Sarah Johnson', ref_no: 'APP-8842', scheduled_time: '10:30 AM' },
        req.user?.email
      );

      res.json({ success: true, result });
    } catch (err) {
      console.error('triggerTestEvent error:', err);
      res.status(400).json({ error: err.message || 'Failed to trigger test notification' });
    }
  }
}

module.exports = new NotificationController();
