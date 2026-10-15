const { Router } = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authController = require('../../authentication/controllers/auth.controller');
const { authenticate, authorize } = require('../../../middleware/auth');

const router = Router();

router.use(authenticate);

// Standard Dashboard Root Stats (role-scoped, used by role workspaces)
router.get('/', authController.getDashboardStats);

const ADMIN_ROLES = ['admin', 'system_admin', 'super_admin', 'org_admin'];

// Module 15: Enterprise Dashboard API Endpoints.
// Only dashboard-enabled roles (admin) may consume the enterprise dashboard API.
router.get('/stats', authorize(...ADMIN_ROLES), dashboardController.getStats);
router.get('/activities', authorize(...ADMIN_ROLES), dashboardController.getActivities);
router.get('/layout', authorize(...ADMIN_ROLES), dashboardController.getLayout);
router.post('/layout', authorize(...ADMIN_ROLES), dashboardController.saveLayout);
router.get('/search', authorize(...ADMIN_ROLES), dashboardController.search);

module.exports = router;
