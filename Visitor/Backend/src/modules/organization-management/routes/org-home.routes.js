const { Router } = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const controller = require('../controllers/org-home.controller');
const { auditLogger } = require('../../../middleware/auditLogger');

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', auditLogger('Accessed Organization Management Home'), controller.getHome);
router.get('/cards', auditLogger('Viewed dashboard cards'), controller.getCards);
router.get('/charts', auditLogger('Viewed dashboard charts'), controller.getCharts);
router.get('/statistics', auditLogger('Viewed statistics'), controller.getStatistics);
router.get('/activities', auditLogger('Viewed recent activities'), controller.getActivities);
router.get('/quick-actions', auditLogger('Viewed quick actions'), controller.getQuickActions);
router.get('/search', auditLogger('Searched organization information'), controller.search);

module.exports = router;
