// src/routes/platform/platform-notification-api.js
// REST API routes for Enterprise System Notification Platform

const express = require('express');
const router = express.Router();
const { platformPermission } = require('../../../middleware/platformPermission');
const PlatformNotificationController = require('../controllers/platform-notification.controller');

// 1. Event Publisher API
router.post('/events/publish', platformPermission('platform.notification.send'), PlatformNotificationController.publishEvent);
router.get('/events/catalog', platformPermission('platform.notification.view'), PlatformNotificationController.getEventCatalog);

// 2. Notification Center Feed
router.get('/inbox', platformPermission('platform.notification.view'), PlatformNotificationController.getNotifications);
router.put('/inbox/:id/read', platformPermission('platform.notification.view'), PlatformNotificationController.markAsRead);

// 3. Platform Rules & Provider Management
router.get('/rules', platformPermission('platform.notification.manage'), PlatformNotificationController.getRules);
router.get('/providers/health', platformPermission('platform.notification.configure'), PlatformNotificationController.getProviderHealth);

// 4. Analytics & Reports
router.get('/analytics', platformPermission('platform.notification.view'), PlatformNotificationController.getAnalytics);
router.get('/reports/export', platformPermission('platform.notification.export'), PlatformNotificationController.exportReport);

module.exports = router;
