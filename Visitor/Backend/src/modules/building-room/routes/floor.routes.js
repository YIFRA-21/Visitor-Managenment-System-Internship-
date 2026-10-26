const { Router } = require('express');
const { authenticate, authorize, optionalAuth } = require('../../../middleware/auth');
const floorController = require('../controllers/floor.controller');

const router = Router();

// Read operations
router.get('/', optionalAuth, floorController.list);
router.get('/:id', optionalAuth, floorController.get);

// Admin-only management routes
router.post('/', authenticate, authorize('admin', 'system_admin'), floorController.create);
router.put('/:id', authenticate, authorize('admin', 'system_admin'), floorController.update);
router.patch('/:id/status', authenticate, authorize('admin', 'system_admin'), floorController.changeStatus);
router.delete('/:id', authenticate, authorize('admin', 'system_admin'), floorController.delete);

module.exports = router;
