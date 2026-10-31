const { Router } = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const branchController = require('../controllers/branch.controller');
const branchSearchController = require('../controllers/branch-search.controller');
const branchStatusController = require('../controllers/branch-status.controller');
const branchStatisticsController = require('../controllers/branch-statistics.controller');

const router = Router();

// ── Public endpoint for visitor bookings / cascading dropdowns (No Auth) ──
router.get('/public', async (req, res, next) => {
  try {
    const branchService = require('../services/branch.service');
    const orgId = req.query.organizationId || req.query.organization_id;
    const status = req.query.status || 'ACTIVE';
    const filters = {};
    if (orgId) filters.organizationId = Number(orgId);
    if (status && status.toUpperCase() !== 'ALL') filters.status = status;
    const branches = await branchService.listBranches(filters);
    const list = Array.isArray(branches) ? branches : (branches.data || []);
    res.json({ data: list });
  } catch (err) {
    next(err);
  }
});

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
