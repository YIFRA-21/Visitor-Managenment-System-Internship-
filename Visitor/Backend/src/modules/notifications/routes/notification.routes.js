const { Router } = require('express');
const { authenticate } = require('../../../middleware/auth');
const NotificationService = require('../services/notification.service');
const NotificationController = require('../controllers/notification.controller');

const router = Router();

// Platform Health & Diagnostics Check
router.get('/health', async (req, res) => {
  try {
    const health = await NotificationService.getHealthStatus();
    res.json(health);
  } catch (err) {
    res.status(500).json({ status: 'ERROR', error: err.message });
  }
});

// Fetch Notifications List (User / Visitor Scoped)
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    const role = req.user?.role;
    const queryParams = { ...req.query, role };

    const result = await NotificationService.getUserNotifications(userId, userEmail, queryParams);
    res.json(result);
  } catch (err) {
    console.error('Fetch notifications route error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get Centralized Unread Counts for Authenticated User (Notifications & Messages)
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    const role = req.user?.role;
    const orgId = req.user?.organizationId;

    const result = await NotificationService.getUnreadCounts(userId, userEmail, role, orgId);
    res.json(result);
  } catch (err) {
    console.error('Fetch unread count route error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch unread count' });
  }
});

// Get Preferences
router.get('/preferences', authenticate, (req, res) => NotificationController.getPreferences(req, res));

// Update Preferences
router.put('/preferences', authenticate, (req, res) => NotificationController.updatePreferences(req, res));

// Get Announcements
router.get('/announcements', authenticate, (req, res) => NotificationController.getAnnouncements(req, res));

// Admin: Delivery Logs
router.get('/deliveries', authenticate, async (req, res) => {
  try {
    const result = await NotificationService.getDeliveryLogs(req.query);
    res.json(result);
  } catch (err) {
    console.error('Delivery logs route error:', err);
    res.status(500).json({ error: 'Failed to fetch delivery logs' });
  }
});

// Admin: Audit Logs
router.get('/audit-logs', authenticate, async (req, res) => {
  try {
    const db = require('../../../config/db');
    const { limit = 50, offset = 0 } = req.query;
    const rows = await db.query(
      `SELECT nal.*, u.full_name as user_name, u.email as user_email
       FROM notification_audit_logs nal
       LEFT JOIN users u ON nal.user_id = u.id
       ORDER BY nal.created_at DESC
       LIMIT ? OFFSET ?`,
      [Number(limit), Number(offset)]
    );
    res.json({ success: true, auditLogs: Array.isArray(rows) ? rows : [] });
  } catch (err) {
    console.error('Audit logs route error:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Mark All Notifications as Read (MUST be before /:id)
router.patch('/read-all', authenticate, (req, res) => NotificationController.markAllRead(req, res));
router.put('/read-all', authenticate, (req, res) => NotificationController.markAllRead(req, res));
router.post('/read-all', authenticate, (req, res) => NotificationController.markAllRead(req, res));
router.put('/mark-all-read', authenticate, (req, res) => NotificationController.markAllRead(req, res));
router.post('/mark-all-read', authenticate, (req, res) => NotificationController.markAllRead(req, res));
router.patch('/mark-all-read', authenticate, (req, res) => NotificationController.markAllRead(req, res));

// Bulk Delete Notifications (MUST be before /:id)
router.post('/bulk-delete', authenticate, (req, res) => NotificationController.bulkDeleteNotifications(req, res));
router.delete('/bulk', authenticate, (req, res) => NotificationController.bulkDeleteNotifications(req, res));

// Mark Single Notification as Read
router.patch('/:id/read', authenticate, (req, res) => NotificationController.markRead(req, res));
router.put('/:id/read', authenticate, (req, res) => NotificationController.markRead(req, res));
router.post('/:id/read', authenticate, (req, res) => NotificationController.markRead(req, res));

// Mark Single Notification as Unread
router.patch('/:id/unread', authenticate, (req, res) => NotificationController.markUnread(req, res));
router.put('/:id/unread', authenticate, (req, res) => NotificationController.markUnread(req, res));
router.post('/:id/unread', authenticate, (req, res) => NotificationController.markUnread(req, res));

// Delete Single Notification
router.delete('/:id', authenticate, (req, res) => NotificationController.deleteNotification(req, res));
router.post('/:id/delete', authenticate, (req, res) => NotificationController.deleteNotification(req, res));
router.delete('/:id/delete', authenticate, (req, res) => NotificationController.deleteNotification(req, res));

// Forward Notification
router.post('/:id/forward', authenticate, (req, res) => NotificationController.forwardNotification(req, res));

// Get Single Notification Metadata & Audit Info
router.get('/:id', authenticate, (req, res) => NotificationController.getNotificationDetails(req, res));

// Admin: Send Manual Notification
router.post('/send', authenticate, async (req, res) => {
  try {
    const senderUserId = req.user?.id;
    const result = await NotificationService.createManualNotification(req.body, senderUserId);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Manual send route error:', err);
    res.status(400).json({ success: false, error: err.message || 'Failed to send notification' });
  }
});

// Admin: Retry Failed Delivery
router.post('/:id/retry', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { channel } = req.body;
    const result = await NotificationService.retryDelivery(Number(id), channel || 'email');
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Retry delivery route error:', err);
    res.status(400).json({ success: false, error: err.message || 'Retry failed' });
  }
});

// Test: Trigger Notification Event
router.post('/trigger-test', authenticate, (req, res) => NotificationController.triggerTestEvent(req, res));
router.post('/test-trigger', authenticate, (req, res) => NotificationController.triggerTestEvent(req, res));

module.exports = router;

