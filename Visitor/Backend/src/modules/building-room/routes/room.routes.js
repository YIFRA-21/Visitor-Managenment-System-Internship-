const { Router } = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const roomController = require('../controllers/room.controller');

const router = Router();

// GET /: lists all conference rooms
router.get('/', roomController.list);

// GET /:id/availability: gets bookings for a room
router.get('/:id/availability', roomController.getAvailability);

// POST /: registers a room (Admin Only)
router.post('/', authenticate, authorize('admin'), roomController.create);

module.exports = router;
