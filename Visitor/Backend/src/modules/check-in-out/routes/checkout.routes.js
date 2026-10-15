const { Router } = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const checkoutController = require('../controllers/checkout.controller');

const router = Router();

// GET /checkout/dashboard — real-time checkout stats
router.get('/dashboard', authenticate, authorize('receptionist', 'security_officer', 'admin', 'manager'), checkoutController.getDashboard);

// GET /checkout/pending — visitors currently inside awaiting checkout
router.get('/pending', authenticate, authorize('receptionist', 'security_officer', 'admin'), checkoutController.getPending);

// GET /checkout/overstay — overstay detection & monitoring list
router.get('/overstay', authenticate, authorize('receptionist', 'security_officer', 'admin', 'manager'), checkoutController.getOverstay);

// GET /checkout/evacuation — emergency evacuation roll call
router.get('/evacuation', authenticate, authorize('receptionist', 'security_officer', 'admin', 'manager'), checkoutController.getEvacuation);

// GET /checkout/history — paginated exit history
router.get('/history', authenticate, authorize('receptionist', 'security_officer', 'admin', 'manager'), checkoutController.getHistory);

// GET /checkout/analytics — exit analytics
router.get('/analytics', authenticate, authorize('receptionist', 'security_officer', 'admin', 'manager'), checkoutController.getAnalytics);

// POST /checkout/process — single visitor exit processing
router.post('/process', authenticate, authorize('receptionist', 'security_officer', 'admin'), checkoutController.processExit);

// POST /checkout/group — bulk group check-out
router.post('/group', authenticate, authorize('receptionist', 'admin'), checkoutController.processGroupExit);

module.exports = router;
