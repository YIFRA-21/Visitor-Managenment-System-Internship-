const express = require('express');
const router = express.Router();
const RuleEngineController = require('../../system-admin/controllers/rule-engine.controller');
const { authenticateToken } = require('../../../middleware/auth');

router.use(authenticateToken);

// Rule Engine Dashboard
router.get('/dashboard', (req, res) => RuleEngineController.getDashboard(req, res));

// Rule CRUD
router.get('/', (req, res) => RuleEngineController.getRules(req, res));
router.get('/categories', (req, res) => RuleEngineController.getCategories(req, res));
router.get('/operators', (req, res) => RuleEngineController.getOperators(req, res));
router.get('/actions', (req, res) => RuleEngineController.getActions(req, res));
router.get('/workflow-nodes', (req, res) => RuleEngineController.getWorkflowNodes(req, res));
router.get('/:id', (req, res) => RuleEngineController.getRuleById(req, res));
router.post('/', (req, res) => RuleEngineController.createRule(req, res));
router.put('/:id', (req, res) => RuleEngineController.updateRule(req, res));
router.delete('/:id', (req, res) => RuleEngineController.deleteRule(req, res));
router.patch('/:id/status', (req, res) => RuleEngineController.toggleStatus(req, res));

module.exports = router;
