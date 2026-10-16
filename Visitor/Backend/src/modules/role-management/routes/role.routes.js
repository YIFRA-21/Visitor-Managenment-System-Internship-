const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const { checkPermission } = require('../../../middleware/rbac');
const roleController = require('../controllers/role.controller');
const { paramIsPositiveInt } = require('../../../middleware/validators/commonValidator');

// All routes require authentication
router.use(authenticate);

// ── Role Statistics & Global Catalog ─────────────────────────────────────
router.get('/statistics', checkPermission('ROLE:READ'), (req, res, next) => roleController.getStatistics(req, res, next));
router.get('/', checkPermission('ROLE:READ'), (req, res, next) => roleController.listRoles(req, res, next));
router.get('/matrix', checkPermission('ROLE:READ'), (req, res, next) => roleController.getPermissionMatrix(req, res, next));
router.get('/compare', checkPermission('ROLE:READ'), (req, res, next) => roleController.compareRoles(req, res, next));
router.get('/export', checkPermission('ROLE:READ'), (req, res, next) => roleController.exportRoles(req, res, next));

// ── Hierarchy Management ────────────────────────────────────────────────────
router.get('/hierarchy', checkPermission('ROLE:READ'), (req, res, next) => roleController.getHierarchy(req, res, next));
router.post('/hierarchy', checkPermission('ROLE:CREATE'), (req, res, next) => roleController.addHierarchyLink(req, res, next));
router.delete('/hierarchy/:id', paramIsPositiveInt('id'), checkPermission('ROLE:DELETE'), (req, res, next) => roleController.removeHierarchyLink(req, res, next));

// ── Conflict Rules & Segregation of Duties (SoD) ───────────────────────────
router.get('/conflicts', checkPermission('ROLE:READ'), (req, res, next) => roleController.listConflicts(req, res, next));
router.post('/conflicts', checkPermission('ROLE:CREATE'), (req, res, next) => roleController.createConflict(req, res, next));
router.delete('/conflicts/:id', paramIsPositiveInt('id'), checkPermission('ROLE:DELETE'), (req, res, next) => roleController.deleteConflict(req, res, next));

router.get('/sod-rules', checkPermission('ROLE:READ'), (req, res, next) => roleController.listSodRules(req, res, next));
router.post('/sod-rules', checkPermission('ROLE:CREATE'), (req, res, next) => roleController.createSodRule(req, res, next));
router.delete('/sod-rules/:id', paramIsPositiveInt('id'), checkPermission('ROLE:DELETE'), (req, res, next) => roleController.deleteSodRule(req, res, next));

// ── Templates Catalog ───────────────────────────────────────────────────────
router.get('/templates', checkPermission('ROLE:READ'), (req, res, next) => roleController.listTemplates(req, res, next));
router.post('/templates/instantiate', checkPermission('ROLE:CREATE'), (req, res, next) => roleController.instantiateTemplate(req, res, next));

// ── Bulk Operations ────────────────────────────────────────────────────────
router.post('/bulk-operations', checkPermission('ROLE:UPDATE'), (req, res, next) => roleController.bulkOperations(req, res, next));

// ── Permissions Integration ─────────────────────────────────────────────
router.get('/permissions/all', checkPermission('ROLE:READ'), (req, res, next) => roleController.listPermissions(req, res, next));
router.get('/permissions/modules', checkPermission('ROLE:READ'), (req, res, next) => roleController.getPermissionModules(req, res, next));

// ── Single Role CRUD & Lifecycle ──────────────────────────────────────────
router.get('/:id', paramIsPositiveInt('id'), checkPermission('ROLE:READ'), (req, res, next) => roleController.getRole(req, res, next));
router.post('/', checkPermission('ROLE:CREATE'), (req, res, next) => roleController.createRole(req, res, next));
router.put('/:id', paramIsPositiveInt('id'), checkPermission('ROLE:UPDATE'), (req, res, next) => roleController.updateRole(req, res, next));

router.post('/:id/activate', paramIsPositiveInt('id'), checkPermission('ROLE:UPDATE'), (req, res, next) => roleController.activateRole(req, res, next));
router.post('/:id/deactivate', paramIsPositiveInt('id'), checkPermission('ROLE:UPDATE'), (req, res, next) => roleController.deactivateRole(req, res, next));
router.post('/:id/archive', paramIsPositiveInt('id'), checkPermission('ROLE:DELETE'), (req, res, next) => roleController.archiveRole(req, res, next));
router.delete('/:id', paramIsPositiveInt('id'), checkPermission('ROLE:DELETE'), (req, res, next) => roleController.deleteRole(req, res, next));
router.post('/:id/restore', paramIsPositiveInt('id'), checkPermission('ROLE:UPDATE'), (req, res, next) => roleController.restoreRole(req, res, next));
router.post('/:id/clone', paramIsPositiveInt('id'), checkPermission('ROLE:CREATE'), (req, res, next) => roleController.cloneRole(req, res, next));

// ── Role Permissions Mapping ──────────────────────────────────────────────
router.get('/:id/permissions', paramIsPositiveInt('id'), checkPermission('ROLE:READ'), (req, res, next) => roleController.getRolePermissions(req, res, next));
router.put('/:id/permissions', paramIsPositiveInt('id'), checkPermission('ROLE:UPDATE'), (req, res, next) => roleController.syncRolePermissions(req, res, next));

// ── Role Users & Assignments ──────────────────────────────────────────────
router.get('/:id/users', paramIsPositiveInt('id'), checkPermission('ROLE:READ'), (req, res, next) => roleController.getRoleUsers(req, res, next));
router.post('/:id/users', paramIsPositiveInt('id'), checkPermission('ROLE:UPDATE'), (req, res, next) => roleController.assignUser(req, res, next));
router.delete('/:id/users/:userId', paramIsPositiveInt('id'), paramIsPositiveInt('userId'), checkPermission('ROLE:UPDATE'), (req, res, next) => roleController.removeUser(req, res, next));
router.delete('/:id/users', paramIsPositiveInt('id'), checkPermission('ROLE:UPDATE'), (req, res, next) => roleController.removeUser(req, res, next));

module.exports = router;
