const { Router } = require('express');
const controller = require('../controllers/watchlist.controller');
const { authenticate, authorize } = require('../../../middleware/auth');

const router = Router();

router.use(authenticate);

// REST API Endpoints for Blacklist & Watchlist Verification

// GET / — Directory search & filter
router.get('/', authorize('security_officer', 'admin', 'receptionist'), controller.getDirectory);

// GET /:id — View record details
router.get('/:id', authorize('security_officer', 'admin', 'receptionist'), controller.getRecordDetails);

// POST / — Add new Blacklist/Watchlist record
router.post('/', authorize('security_officer', 'admin'), controller.createRecord);

// PUT /:id — Edit existing record
router.put('/:id', authorize('security_officer', 'admin'), controller.updateRecord);

// POST /verify — Automatic visitor screening & verification check
router.post('/verify', authorize('security_officer', 'admin', 'receptionist'), controller.verifyVisitor);

// PATCH /:id/status — Activate / Deactivate / Status update
router.patch('/:id/status', authorize('security_officer', 'admin'), controller.updateStatus);

// POST /:id/clearance — Review & Clearance (Approve / Reject Clearance)
router.post('/:id/clearance', authorize('security_officer', 'admin'), controller.reviewClearance);

// PATCH /:id/archive — Archive record (Soft Delete)
router.patch('/:id/archive', authorize('security_officer', 'admin'), controller.archiveRecord);

// PATCH /:id/restore — Restore archived record
router.patch('/:id/restore', authorize('security_officer', 'admin'), controller.restoreRecord);

module.exports = router;
