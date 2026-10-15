const { Router } = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const controller = require('../controllers/visitor-dashboard.controller');

const router = Router();

// Module 4.1 Access Control: Authorized for System Administrator, Org Admin, Receptionist, Security Officer, Staff, Manager
router.use(authenticate);
router.use(authorize('admin', 'org_admin', 'receptionist', 'security_officer', 'security', 'staff', 'manager'));

// REST API Endpoints as specified in Module 4.1
router.get('/', (req, res, next) => controller.getDashboard(req, res, next));
router.get('/cards', (req, res, next) => controller.getCards(req, res, next));
router.get('/charts', (req, res, next) => controller.getCharts(req, res, next));
router.get('/recent', (req, res, next) => controller.getRecent(req, res, next));
router.get('/alerts', (req, res, next) => controller.getAlerts(req, res, next));
router.get('/tasks', (req, res, next) => controller.getTasks(req, res, next));
router.get('/search', (req, res, next) => controller.search(req, res, next));
router.get('/statistics', (req, res, next) => controller.getStatistics(req, res, next));

module.exports = router;
