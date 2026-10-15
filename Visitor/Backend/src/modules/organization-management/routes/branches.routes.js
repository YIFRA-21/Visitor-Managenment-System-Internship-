const { Router } = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const branchController = require('../controllers/branch.controller');
const branchSearchController = require('../controllers/branch-search.controller');
const branchStatusController = require('../controllers/branch-status.controller');
const branchStatisticsController = require('../controllers/branch-statistics.controller');

const router = Router();

// Standalone endpoint routers (Admin Only)
router.get('/statistics', authenticate, authorize('admin'), branchStatisticsController.getStatistics);
router.get('/search', authenticate, authorize('admin'), branchSearchController.search);
router.get('/check-code', authenticate, authorize('admin'), branchSearchController.checkCode);

// Master CRUD operations
router.get('/', authenticate, authorize('admin'), branchController.list);
router.post('/', authenticate, authorize('admin'), branchController.register);
router.get('/:id', authenticate, authorize('admin'), branchController.get);
router.put('/:id', authenticate, authorize('admin'), branchController.update);
router.delete('/:id', authenticate, authorize('admin'), branchController.delete);

// Status management
router.patch('/:id/status', authenticate, authorize('admin'), branchStatusController.changeStatus);
router.get('/:id/status/history', authenticate, authorize('admin'), branchStatusController.getHistory);

module.exports = router;
