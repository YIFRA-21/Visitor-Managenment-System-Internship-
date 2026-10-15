/**
 * System Routes
 * ──────────────
 * /api/system — Settings, feature flags, modules, health, audit logs (admin only)
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const { checkPermission, checkRole } = require('../../../middleware/rbac');
const systemController = require('../controllers/system.controller');
const { paramIsPositiveInt } = require('../../../middleware/validators/commonValidator');

router.use(authenticate);

// ── Dashboard ───────────────────────────────────────────────────────────────

// GET /api/system/dashboard — Admin dashboard stats
router.get('/dashboard', checkRole('admin'), systemController.getDashboardStats);

// ── System Health ───────────────────────────────────────────────────────────

// GET /api/system/health — System health monitoring
router.get('/health', checkRole('admin'), systemController.getHealth);

// ── System Settings ─────────────────────────────────────────────────────────

// GET /api/system/settings — List all settings
router.get('/settings', checkPermission('SYSTEM:SETTINGS_READ'), systemController.listSettings);

// GET /api/system/settings/categories — Setting categories
router.get('/settings/categories', checkPermission('SYSTEM:SETTINGS_READ'), systemController.getSettingCategories);

// GET /api/system/settings/:key — Get single setting
router.get('/settings/:key', checkPermission('SYSTEM:SETTINGS_READ'), systemController.getSetting);

// PUT /api/system/settings — Upsert a setting
router.put('/settings', checkPermission('SYSTEM:SETTINGS_WRITE'), systemController.upsertSetting);

// DELETE /api/system/settings/:key — Delete a setting
router.delete('/settings/:key', checkPermission('SYSTEM:SETTINGS_WRITE'), systemController.deleteSetting);

// ── Feature Flags ───────────────────────────────────────────────────────────

// GET /api/system/feature-flags — List all feature flags
router.get('/feature-flags', checkPermission('SYSTEM:FEATURE_FLAGS'), systemController.listFeatureFlags);

// PATCH /api/system/feature-flags/:id — Toggle feature flag
router.patch('/feature-flags/:id', paramIsPositiveInt('id'), checkPermission('SYSTEM:FEATURE_FLAGS'), systemController.toggleFeatureFlag);

// ── Module Registry ─────────────────────────────────────────────────────────

// GET /api/system/modules — List all modules
router.get('/modules', checkPermission('SYSTEM:MODULES'), systemController.listModules);

// PATCH /api/system/modules/:id — Toggle module
router.patch('/modules/:id', paramIsPositiveInt('id'), checkPermission('SYSTEM:MODULES'), systemController.toggleModule);

// ── Configurations ──────────────────────────────────────────────────────────

// GET /api/system/configurations — List configurations
router.get('/configurations', checkPermission('SYSTEM:SETTINGS_READ'), systemController.listConfigurations);

// PATCH /api/system/configurations/:id — Update configuration
router.patch('/configurations/:id', paramIsPositiveInt('id'), checkPermission('SYSTEM:SETTINGS_WRITE'), systemController.updateConfiguration);

// ── Audit Logs ──────────────────────────────────────────────────────────────

// GET /api/system/audit-logs/stats — High-level statistics and KPIs
router.get('/audit-logs/stats', checkPermission('AUDIT:READ'), systemController.getAuditStats);

// GET /api/system/audit-logs/processes — Distinct audit modules/processes
router.get('/audit-logs/processes', checkPermission('AUDIT:READ'), systemController.getAuditProcesses);

// GET /api/system/audit-logs/export — Export filtered audit logs
router.get('/audit-logs/export', checkPermission('AUDIT:READ'), systemController.exportAuditLogs);

// GET /api/system/audit-logs/:id — Single audit log record
router.get('/audit-logs/:id', checkPermission('AUDIT:READ'), systemController.getAuditLogById);

// GET /api/system/audit-logs — Browseable audit log with filters and pagination
router.get('/audit-logs', checkPermission('AUDIT:READ'), systemController.listAuditLogs);

module.exports = router;
