const { Router } = require('express');
const { authenticate, authorize, optionalAuth } = require('../../../middleware/auth');
const buildingController = require('../controllers/building.controller');

const router = Router();

// Utilization & details
router.get('/:id/utilization', optionalAuth, buildingController.getUtilization);

// CRUD operations
router.get('/', optionalAuth, buildingController.list);
router.get('/:id', optionalAuth, buildingController.get);

// Admin-only management routes
router.post('/', authenticate, authorize('admin', 'system_admin'), buildingController.create);
router.put('/:id', authenticate, authorize('admin', 'system_admin'), buildingController.update);
router.patch('/:id/status', authenticate, authorize('admin', 'system_admin'), buildingController.changeStatus);
router.delete('/:id', authenticate, authorize('admin', 'system_admin'), buildingController.delete);

module.exports = router;
