const { Router } = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const buildingController = require('../controllers/building.controller');

const router = Router();

// Utilization & details
router.get('/:id/utilization', authenticate, buildingController.getUtilization);

// CRUD operations
router.get('/', authenticate, buildingController.list);
router.get('/:id', authenticate, buildingController.get);

// Admin-only management routes
router.post('/', authenticate, authorize('admin', 'system_admin'), buildingController.create);
router.put('/:id', authenticate, authorize('admin', 'system_admin'), buildingController.update);
router.patch('/:id/status', authenticate, authorize('admin', 'system_admin'), buildingController.changeStatus);
router.delete('/:id', authenticate, authorize('admin', 'system_admin'), buildingController.delete);

module.exports = router;
