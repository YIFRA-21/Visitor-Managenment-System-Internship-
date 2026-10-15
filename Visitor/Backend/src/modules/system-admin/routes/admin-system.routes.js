const express = require('express');
const router = express.Router();
const systemAdminController = require('../controllers/system-admin.controller');

// All system admin endpoints
router.get('/dashboard', (req, res, next) => systemAdminController.getDashboardStats(req, res, next));
router.get('/settings', (req, res, next) => systemAdminController.getSystemSettings(req, res, next));
router.put('/settings', (req, res, next) => systemAdminController.updateSystemSetting(req, res, next));

router.get('/features', (req, res, next) => systemAdminController.getFeatureFlags(req, res, next));
router.put('/features/:key', (req, res, next) => systemAdminController.toggleFeatureFlag(req, res, next));

router.get('/backups', (req, res, next) => systemAdminController.getBackupHistory(req, res, next));
router.post('/backups', (req, res, next) => systemAdminController.triggerBackup(req, res, next));

router.get('/scheduled-jobs', (req, res, next) => systemAdminController.getScheduledJobs(req, res, next));
router.get('/integrations', (req, res, next) => systemAdminController.getIntegrations(req, res, next));

router.get('/security-policies', (req, res, next) => systemAdminController.getSecurityPolicies(req, res, next));
router.put('/security-policies', (req, res, next) => systemAdminController.updateSecurityPolicies(req, res, next));

router.get('/maintenance', (req, res, next) => systemAdminController.getMaintenanceConfig(req, res, next));
router.put('/maintenance', (req, res, next) => systemAdminController.setMaintenanceConfig(req, res, next));

module.exports = router;
