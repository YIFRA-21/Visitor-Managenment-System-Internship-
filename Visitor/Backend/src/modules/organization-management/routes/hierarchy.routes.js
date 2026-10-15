const { Router } = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const hierarchyController = require('../controllers/hierarchy.controller');
const hierarchyAssignmentController = require('../controllers/hierarchy-assignment.controller');
const hierarchyValidationController = require('../controllers/hierarchy-validation.controller');
const hierarchySearchController = require('../controllers/hierarchy-search.controller');
const hierarchyStatisticsController = require('../controllers/hierarchy-statistics.controller');

const router = Router();

// Public / Authenticated read routes
router.get('/', hierarchyController.getTree);
router.get('/tree', hierarchyController.getTree);
router.get('/search', hierarchySearchController.search);
router.get('/validate', hierarchyValidationController.validate);
router.get('/statistics', hierarchyStatisticsController.getStatistics);
router.get('/:id', hierarchyController.getNode);

// Admin / Write assignment routes
router.post('/assign', authenticate, authorize('admin'), hierarchyAssignmentController.assign);
router.put('/assign/:id', authenticate, authorize('admin'), hierarchyAssignmentController.updateAssign);

module.exports = router;
