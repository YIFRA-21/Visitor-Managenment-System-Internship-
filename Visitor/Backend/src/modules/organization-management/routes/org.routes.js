const { Router } = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const orgController = require('../controllers/org.controller');
const orgSettingsController = require('../controllers/org-settings.controller');
const orgStatisticsController = require('../controllers/org-statistics.controller');
const orgSearchController = require('../controllers/org-search.controller');
const orgStatusController = require('../controllers/org-status.controller');
const { validateOrganization, validateBranch, validateStatusChange, validateSearch } = require('../../../middleware/OrganizationValidationMiddleware');

const router = Router();

// ── Search & Code Check (must be before /:id routes to prevent conflicts) ──
router.get('/search', authenticate, authorize('admin'), validateSearch, orgSearchController.search);
router.get('/check-code', authenticate, authorize('admin'), orgSearchController.checkCode);

// ── Master Organization CRUD ──
router.get('/public', orgController.list);
router.get('/public-branding', orgController.getPublicBranding);
router.get('/', authenticate, authorize('admin'), orgController.list);
router.post('/', authenticate, authorize('admin'), validateOrganization, orgController.register);
router.get('/:id', authenticate, authorize('admin'), orgController.get);
router.put('/:id', authenticate, authorize('admin'), validateOrganization, orgController.update);
router.delete('/:id', authenticate, authorize('admin'), orgController.archive);
router.patch('/:id/restore', authenticate, authorize('admin'), orgController.restore);
router.patch('/:id/activate', authenticate, authorize('admin'), orgController.activate);
router.patch('/:id/deactivate', authenticate, authorize('admin'), orgController.deactivate);

// ── Dedicated Status Management (Admin Only) ──
router.get('/:id/status', authenticate, authorize('admin'), orgStatusController.getCurrentStatus);
router.patch('/:id/status', authenticate, authorize('admin'), validateStatusChange, orgStatusController.changeStatus);
router.get('/:id/status/history', authenticate, authorize('admin'), orgStatusController.getHistory);

// ── Organization Settings & Customization (Admin Only) ──
router.get('/:id/settings', authenticate, authorize('admin'), orgSettingsController.get);
router.put('/:id/settings', authenticate, authorize('admin'), orgSettingsController.update);
router.put('/:id/branding', authenticate, authorize('admin'), orgSettingsController.updateBranding);

// ── Organization Statistics/Dashboard analytics (Admin Only) ──
router.get('/:id/statistics', authenticate, authorize('admin'), orgStatisticsController.getSummary);

// ── Organization Branches / Campus Sites ──
router.get('/:orgId/branches/public', async (req, res, next) => {
  try {
    const branches = await orgController.listBranchesPublic
      ? orgController.listBranchesPublic(req, res, next)
      : (() => {
          const orgService = require('../services/org.service');
          return orgService.getBranches(req.params.orgId).then(b => res.json(b));
        })();
  } catch (err) {
    next(err);
  }
});
router.get('/:orgId/branches', authenticate, orgController.listBranches);
router.post('/branches', authenticate, authorize('admin'), validateBranch, orgController.createBranch);
router.put('/branches/:id', authenticate, authorize('admin'), validateBranch, orgController.updateBranch);
router.delete('/branches/:id', authenticate, authorize('admin'), orgController.deleteBranch);

// ── Campus Buildings ──
router.get('/branches/:branchId/buildings', authenticate, orgController.listBuildings);
router.post('/buildings', authenticate, authorize('admin'), orgController.createBuilding);

module.exports = router;
