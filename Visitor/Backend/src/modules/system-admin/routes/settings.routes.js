const { Router } = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const ctrl = require('../controllers/settings.controller');

const router = Router();

// Scope helpers
const canRead = authorize('admin', 'manager', 'receptionist');
const canWrite = authorize('admin');

// Master configurations
router.get('/', authenticate, canRead, ctrl.getSettings);
router.get('/export', authenticate, canRead, ctrl.exportSettings);
router.post('/import', authenticate, canWrite, ctrl.importSettings);
router.get('/history', authenticate, canRead, ctrl.getHistory);
router.get('/validation', authenticate, canRead, ctrl.runValidation);

// Backups & Snapshots
router.get('/backups', authenticate, canRead, ctrl.listBackups);
router.post('/backups', authenticate, canWrite, ctrl.createBackup);
router.post('/restore', authenticate, canWrite, ctrl.restoreBackup);
router.delete('/backups/:id', authenticate, canWrite, ctrl.deleteBackup);

// Subcategory parameters
router.get('/:category', authenticate, canRead, ctrl.getCategory);
router.put('/:category', authenticate, canWrite, ctrl.updateCategory);

module.exports = router;
