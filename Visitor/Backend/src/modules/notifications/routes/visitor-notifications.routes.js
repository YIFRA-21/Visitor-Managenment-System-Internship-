const { Router } = require('express');
const { authenticate } = require('../../../middleware/auth');
const NotificationController = require('../controllers/notification.controller');
const MessageController = require('../controllers/message.controller');

const router = Router();

// ==========================================
// NOTIFICATIONS API ENDPOINTS
// ==========================================

// Get Visitor Notifications List (With Category, Priority, Search & Status filters)
router.get('/notifications', authenticate, (req, res) => NotificationController.getNotifications(req, res));

// Get Single Notification Metadata & Audit Info
router.get('/notifications/:id', authenticate, (req, res) => NotificationController.getNotificationDetails(req, res));

// Mark Single Notification as Read
router.patch('/notifications/:id/read', authenticate, (req, res) => NotificationController.markRead(req, res));

// Mark All Notifications as Read
router.patch('/notifications/read-all', authenticate, (req, res) => NotificationController.markAllRead(req, res));

// Get Notification Preferences
router.get('/preferences', authenticate, (req, res) => NotificationController.getPreferences(req, res));

// Update Notification Preferences
router.put('/preferences', authenticate, (req, res) => NotificationController.updatePreferences(req, res));

// Get System Announcements
router.get('/announcements', authenticate, (req, res) => NotificationController.getAnnouncements(req, res));

// Trigger Event Notification (Test / Manual Trigger)
router.post('/notifications/test-trigger', authenticate, (req, res) => NotificationController.triggerTestEvent(req, res));


// ==========================================
// DIRECT MESSAGING API ENDPOINTS (RBAC AUTHORIZED)
// ==========================================

// Get Threads List
router.get('/messages/threads', authenticate, (req, res) => MessageController.getThreads(req, res));

// Create New Conversation Thread
router.post('/messages/threads', authenticate, (req, res) => MessageController.createThread(req, res));

// Get Messages in Thread
router.get('/messages/threads/:threadId', authenticate, (req, res) => MessageController.getThreadMessages(req, res));

// Send Message Reply
router.post('/messages/threads/:threadId/reply', authenticate, (req, res) => MessageController.sendMessage(req, res));

// Get Authorized Recipients List (Assigned Host, Receptionist, Support)
router.get('/messages/authorized-contacts', authenticate, (req, res) => MessageController.getAuthorizedContacts(req, res));

module.exports = router;
