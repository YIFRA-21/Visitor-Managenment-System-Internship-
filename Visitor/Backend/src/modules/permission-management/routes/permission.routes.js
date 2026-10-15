const { Router } = require('express');
const { authenticate } = require('../../../middleware/auth');
const permissionController = require('../controllers/permission.controller');
const authController = require('../../authentication/controllers/auth.controller');

const router = Router();

// Protect all permission management routes
router.use(authenticate);

// ── Statistics & Matrix Routes ───────────────────────────────────────────────
router.get('/statistics', (req, res) => permissionController.getStatistics(req, res));
router.get('/matrix', (req, res) => permissionController.getMatrix(req, res));
router.post('/matrix', (req, res) => permissionController.updateMatrix(req, res));

// ── Groups, Templates & Simulation ──────────────────────────────────────────
router.get('/groups', (req, res) => permissionController.getGroups(req, res));
router.get('/templates', (req, res) => permissionController.getTemplates(req, res));
router.post('/authorize-test', (req, res) => permissionController.testAuthorization(req, res));

// ── Import & Export ──────────────────────────────────────────────────────────
router.post('/import', (req, res) => permissionController.importPermissions(req, res));
router.get('/export', (req, res) => permissionController.exportPermissions(req, res));

// ── User My Permissions ──────────────────────────────────────────────────────
router.get('/my-permissions', (req, res, next) => authController.getMyPermissions(req, res, next));

// ── Standard CRUD & Actions ──────────────────────────────────────────────────
router.get('/', (req, res) => permissionController.getAllPermissions(req, res));
router.post('/', (req, res) => permissionController.createPermission(req, res));
router.get('/:permissionId', (req, res) => permissionController.getPermissionById(req, res));
router.patch('/:permissionId', (req, res) => permissionController.updatePermission(req, res));

router.post('/:permissionId/activate', (req, res) => permissionController.activatePermission(req, res));
router.post('/:permissionId/deactivate', (req, res) => permissionController.deactivatePermission(req, res));
router.post('/:permissionId/archive', (req, res) => permissionController.archivePermission(req, res));
router.post('/:permissionId/restore', (req, res) => permissionController.restorePermission(req, res));
router.post('/:permissionId/clone', (req, res) => permissionController.clonePermission(req, res));

module.exports = router;
