// src/routes/admin/notification-admin-api.js
// Admin routes for the Enterprise Administrator Notification Center
// All routes are protected by authentication and adminPermission middleware.

const express = require('express');
const router = express.Router();
const { adminPermission } = require('../../../middleware/adminPermission');
const { getDashboardMetrics, getActivityFeed } = require('../controllers/notification-command-center.controller');
const BroadcastController = require('../controllers/broadcast.controller');
const CampaignController = require('../controllers/campaign.controller');
const ApprovalController = require('../controllers/approval-workflow.controller');
const PreviewController = require('../controllers/preview.controller');
const DeliveryTrackingController = require('../controllers/delivery-tracking.controller');
const PreferencesController = require('../controllers/preferences.controller');
const SubscriptionController = require('../controllers/subscription.controller');
const QuietHoursController = require('../controllers/quiet-hours.controller');
const DigestController = require('../controllers/digest.controller');
const SmartDeliveryController = require('../controllers/smart-delivery.controller');
const SLAController = require('../controllers/sla.controller');
const ArchiveController = require('../controllers/archive.controller');
const SearchController = require('../controllers/search.controller');
const TemplateDesignerController = require('../controllers/template-designer.controller');
const CostMonitoringController = require('../controllers/cost-monitoring.controller');
const HealthMonitoringController = require('../controllers/health-monitoring.controller');
const RecoveryController = require('../controllers/recovery.controller');
const MaintenanceController = require('../controllers/maintenance-mode.controller');

// Dashboard
router.get('/dashboard', adminPermission('admin:notification:monitor'), getDashboardMetrics);
router.get('/activity-feed', adminPermission('admin:notification:monitor'), getActivityFeed);

// Broadcast Management
router.post('/broadcast', adminPermission('admin:notification:broadcast'), BroadcastController.sendBroadcast);
router.put('/broadcast/:id/schedule', adminPermission('admin:notification:broadcast'), BroadcastController.scheduleBroadcast);
router.delete('/broadcast/:id', adminPermission('admin:notification:broadcast'), BroadcastController.cancelBroadcast);
router.post('/broadcast/:id/recall', adminPermission('admin:notification:broadcast'), BroadcastController.recallBroadcast);

// Campaign Management
router.post('/campaign', adminPermission('admin:campaign:create'), CampaignController.createCampaign);
router.put('/campaign/:id', adminPermission('admin:campaign:update'), CampaignController.updateCampaign);
router.get('/campaign/:id', adminPermission('admin:campaign:view'), CampaignController.getCampaign);
router.delete('/campaign/:id', adminPermission('admin:campaign:delete'), CampaignController.deleteCampaign);
router.get('/campaign/:id/analytics', adminPermission('admin:campaign:analytics'), CampaignController.getAnalytics);

// Approval Workflow
router.post('/approval/:id/submit', adminPermission('admin:approval:submit'), ApprovalController.submitForApproval);
router.post('/approval/:id/approve', adminPermission('admin:approval:approve'), ApprovalController.approve);
router.post('/approval/:id/reject', adminPermission('admin:approval:reject'), ApprovalController.reject);

// Preview
router.post('/preview', adminPermission('admin:notification:preview'), PreviewController.renderPreview);

// Delivery Tracking
router.get('/delivery/:notificationId', adminPermission('admin:notification:track'), DeliveryTrackingController.getTrackingInfo);

// Preferences (user‑level, admin can view & edit defaults)
router.put('/preferences/:userId', adminPermission('admin:preferences:update'), PreferencesController.updatePreferences);
router.get('/preferences/:userId', adminPermission('admin:preferences:view'), PreferencesController.getPreferences);

// Subscription Management
router.put('/subscription/:userId', adminPermission('admin:subscription:update'), SubscriptionController.updateSubscription);
router.get('/subscription/:userId', adminPermission('admin:subscription:view'), SubscriptionController.getSubscription);

// Quiet Hours
router.put('/quiet-hours/:orgId', adminPermission('admin:quiethours:update'), QuietHoursController.updateQuietHours);
router.get('/quiet-hours/:orgId', adminPermission('admin:quiethours:view'), QuietHoursController.getQuietHours);

// Digest
router.post('/digest/:userId/schedule', adminPermission('admin:digest:schedule'), DigestController.scheduleDigest);
router.get('/digest/:userId', adminPermission('admin:digest:view'), DigestController.getDigestSchedule);

// Smart Delivery Engine configuration
router.put('/smart-delivery/:orgId', adminPermission('admin:smartdelivery:update'), SmartDeliveryController.updateConfig);
router.get('/smart-delivery/:orgId', adminPermission('admin:smartdelivery:view'), SmartDeliveryController.getConfig);

// SLA & Escalation
router.get('/sla/:notificationId', adminPermission('admin:sla:view'), SLAController.getSLAStatus);
router.post('/sla/:notificationId/escalate', adminPermission('admin:sla:escalate'), SLAController.escalate);

// Archive & Retention
router.post('/archive/:notificationId', adminPermission('admin:archive:create'), ArchiveController.archiveNotification);
router.post('/archive/:notificationId/restore', adminPermission('admin:archive:restore'), ArchiveController.restoreNotification);
router.get('/archive/search', adminPermission('admin:archive:search'), ArchiveController.searchArchives);

// Enterprise Search
router.get('/search', adminPermission('admin:search:query'), SearchController.search);

// Template Designer
router.post('/template', adminPermission('admin:template:create'), TemplateDesignerController.createTemplate);
router.put('/template/:id', adminPermission('admin:template:update'), TemplateDesignerController.updateTemplate);
router.get('/template/:id', adminPermission('admin:template:view'), TemplateDesignerController.getTemplate);
router.delete('/template/:id', adminPermission('admin:template:delete'), TemplateDesignerController.deleteTemplate);
router.get('/template/history/:id', adminPermission('admin:template:history'), TemplateDesignerController.getHistory);

// Cost Monitoring
router.get('/costs', adminPermission('admin:costs:view'), CostMonitoringController.getCostMetrics);

// Health Monitoring
router.get('/health', adminPermission('admin:health:view'), HealthMonitoringController.getHealthStatus);

// Recovery Center
router.post('/recovery/retry-failed', adminPermission('admin:recovery:retry'), RecoveryController.retryFailed);
router.post('/recovery/restart-queue', adminPermission('admin:recovery:restart'), RecoveryController.restartQueue);
router.post('/recovery/restart-workers', adminPermission('admin:recovery:restartWorkers'), RecoveryController.restartWorkers);

// Maintenance Mode
router.put('/maintenance', adminPermission('admin:maintenance:update'), MaintenanceController.updateMaintenanceMode);
router.get('/maintenance', adminPermission('admin:maintenance:view'), MaintenanceController.getMaintenanceStatus);

module.exports = router;
