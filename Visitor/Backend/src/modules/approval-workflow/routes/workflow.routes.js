const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflow.controller');
const { authenticateToken } = require('../../../middleware/auth');

// Public / Authenticated Workflow Routes
router.get('/', authenticateToken, (req, res, next) => workflowController.getAllWorkflows(req, res, next));
router.get('/dashboard-stats', authenticateToken, (req, res, next) => workflowController.getDashboardStats(req, res, next));
router.get('/delegations', authenticateToken, (req, res, next) => workflowController.getDelegations(req, res, next));
router.post('/delegations', authenticateToken, (req, res, next) => workflowController.createDelegation(req, res, next));

router.post('/determine', authenticateToken, (req, res, next) => workflowController.determineWorkflow(req, res, next));
router.post('/simulate', authenticateToken, (req, res, next) => workflowController.simulateWorkflow(req, res, next));

router.get('/:id', authenticateToken, (req, res, next) => workflowController.getWorkflowById(req, res, next));
router.post('/', authenticateToken, (req, res, next) => workflowController.createWorkflow(req, res, next));
router.put('/:id', authenticateToken, (req, res, next) => workflowController.updateWorkflow(req, res, next));
router.post('/:id/clone', authenticateToken, (req, res, next) => workflowController.cloneWorkflow(req, res, next));
router.patch('/:id/status', authenticateToken, (req, res, next) => workflowController.setStatus(req, res, next));
router.delete('/:id', authenticateToken, (req, res, next) => workflowController.deleteWorkflow(req, res, next));

router.get('/:id/versions', authenticateToken, (req, res, next) => workflowController.getVersions(req, res, next));
router.get('/:id/audit-logs', authenticateToken, (req, res, next) => workflowController.getAuditLogs(req, res, next));

module.exports = router;
