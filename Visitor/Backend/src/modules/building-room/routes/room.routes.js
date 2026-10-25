const { Router } = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const roomController = require('../controllers/room.controller');

const router = Router();

// Availability check (Public/Authenticated)
router.get('/:id/availability', roomController.getAvailability);

// Room reservation with double-booking prevention check
router.post('/:id/reserve', authenticate, roomController.reserve);

// Read rooms
router.get('/', authenticate, roomController.list);
router.get('/:id', authenticate, roomController.get);

// Admin / Manager Room Configuration
router.post('/', authenticate, authorize('admin', 'system_admin'), roomController.create);
router.put('/:id', authenticate, authorize('admin', 'system_admin'), roomController.update);
router.patch('/:id/status', authenticate, authorize('admin', 'system_admin'), roomController.changeStatus);
router.delete('/:id', authenticate, authorize('admin', 'system_admin'), roomController.delete);

module.exports = router;
