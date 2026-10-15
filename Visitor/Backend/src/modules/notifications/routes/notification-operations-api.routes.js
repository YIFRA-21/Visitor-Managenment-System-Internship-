// src/routes/admin/notification-operations-api.js
// REST APIs for the Enterprise Administrator Notification Operations Center

const express = require('express');
const router = express.Router();
const { adminPermission } = require('../../../middleware/adminPermission');

const SettingsController = require('../controllers/ops-notification-settings.controller');
const BrandingController = require('../controllers/ops-branding.controller');
const ProviderController = require('../controllers/ops-provider.controller');
const SchedulerController = require('../controllers/ops-scheduler.controller');
const WorkerController = require('../controllers/ops-worker.controller');
const DiagnosticsController = require('../controllers/ops-diagnostics.controller');
const SandboxController = require('../controllers/ops-sandbox.controller');
const BackupController = require('../controllers/ops-backup.controller');
const UsageController = require('../controllers/ops-usage.controller');

// 1. Enterprise Notification Settings (§1)
router.get('/settings', adminPermission('admin:notification:manage'), SettingsController.getSettings);
router.put('/settings', adminPermission('admin:notification:manage'), SettingsController.updateSettings);
router.post('/settings/test-connection', adminPermission('admin:notification:manage'), SettingsController.testConnection);

// 2. Notification Branding (§2)
router.get('/branding', adminPermission('admin:notification:manage'), BrandingController.getBranding);
router.put('/branding', adminPermission('admin:notification:manage'), BrandingController.updateBranding);
router.post('/branding/render-preview', adminPermission('admin:notification:preview'), BrandingController.renderTemplatePreview);

// 3 & 4. Provider Management & Provider Failover (§3, §4)
router.get('/providers', adminPermission('admin:notification:manage'), ProviderController.listProviders);
router.post('/providers', adminPermission('admin:notification:manage'), ProviderController.addProvider);
router.put('/providers/:id/toggle', adminPermission('admin:notification:manage'), ProviderController.toggleProvider);
router.post('/providers/:id/test', adminPermission('admin:notification:manage'), ProviderController.testConnection);
router.get('/failover/status', adminPermission('admin:notification:monitor'), ProviderController.getFailoverStatus);
router.post('/failover/trigger', adminPermission('admin:notification:manage'), ProviderController.triggerFailover);

// 5. Scheduler Console (§5)
router.get('/scheduler/jobs', adminPermission('admin:notification:manage'), SchedulerController.listSchedules);
router.put('/scheduler/jobs/:id/status', adminPermission('admin:notification:manage'), SchedulerController.toggleScheduleStatus);
router.put('/scheduler/jobs/:id/reschedule', adminPermission('admin:notification:manage'), SchedulerController.rescheduleJob);

// 6. Worker Management (§6)
router.get('/workers', adminPermission('admin:notification:monitor'), WorkerController.getWorkers);
router.post('/workers/:id/restart', adminPermission('admin:notification:manage'), WorkerController.restartWorker);

// 7. Diagnostics Center (§7)
router.post('/diagnostics/run', adminPermission('admin:notification:monitor'), DiagnosticsController.runDiagnostics);

// 8. Notification Sandbox (§8)
router.post('/sandbox/simulate', adminPermission('admin:notification:preview'), SandboxController.simulateEvent);
router.get('/sandbox/logs', adminPermission('admin:notification:monitor'), SandboxController.getLogs);

// 9. Configuration Backup & Restore (§9)
router.get('/backup/list', adminPermission('admin:notification:manage'), BackupController.listBackups);
router.post('/backup/create', adminPermission('admin:notification:manage'), BackupController.createBackup);
router.post('/backup/restore/:backupId', adminPermission('admin:notification:manage'), BackupController.restoreBackup);

// 10. Usage Analytics Dashboard (§10)
router.get('/usage/metrics', adminPermission('admin:notification:monitor'), UsageController.getUsageMetrics);

module.exports = router;
