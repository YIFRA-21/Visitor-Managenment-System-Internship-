const express = require('express');
const router = express.Router();
const WorkflowAutomationController = require('../controllers/workflow-automation.controller');
const ModuleRulesController = require('../../system-admin/controllers/module-rules.controller');
const { authenticateToken } = require('../../../middleware/auth');

router.use(authenticateToken);

// Part 5 §5.13 - 5.24 Workflow Automation Rules
router.get('/schedules', (req, res) => WorkflowAutomationController.getSchedules(req, res));
router.get('/escalations', (req, res) => WorkflowAutomationController.getEscalations(req, res));
router.get('/reminders', (req, res) => WorkflowAutomationController.getReminders(req, res));
router.get('/retries', (req, res) => WorkflowAutomationController.getRetries(req, res));
router.get('/approvals', (req, res) => WorkflowAutomationController.getApprovals(req, res));
router.get('/organization', (req, res) => WorkflowAutomationController.getOrgHierarchy(req, res));
router.get('/roles', (req, res) => WorkflowAutomationController.getRoleRules(req, res));
router.get('/user-groups', (req, res) => WorkflowAutomationController.getUserGroups(req, res));

// Part 5 §5.25 - 5.34 Module Specific Rules
router.get('/visitor', (req, res) => ModuleRulesController.getVisitorRules(req, res));
router.get('/employee', (req, res) => ModuleRulesController.getEmployeeRules(req, res));
router.get('/appointment', (req, res) => ModuleRulesController.getAppointmentRules(req, res));
router.get('/reception', (req, res) => ModuleRulesController.getReceptionRules(req, res));
router.get('/security', (req, res) => ModuleRulesController.getSecurityRules(req, res));
router.get('/visitor-pass', (req, res) => ModuleRulesController.getPassRules(req, res));
router.get('/checkin', (req, res) => ModuleRulesController.getCheckinRules(req, res));
router.get('/checkout', (req, res) => ModuleRulesController.getCheckoutRules(req, res));
router.get('/emergency', (req, res) => ModuleRulesController.getEmergencyRules(req, res));
router.get('/system', (req, res) => ModuleRulesController.getSystemRules(req, res));

// Part 5 §5.35 & §5.36 Testing & Simulation Console
router.post('/test', (req, res) => ModuleRulesController.runRuleTest(req, res));
router.post('/simulate', (req, res) => ModuleRulesController.runSimulation(req, res));

// Part 5 §5.37 - 5.50 Production Management & Monitoring
const ProductionRuleController = require('../../system-admin/controllers/production-rule.controller');
router.get('/versions', (req, res) => ProductionRuleController.getVersions(req, res));
router.post('/versions', (req, res) => ProductionRuleController.createVersion(req, res));
router.post('/rollback', (req, res) => ProductionRuleController.rollback(req, res));
router.post('/import', (req, res) => ProductionRuleController.importRules(req, res));
router.get('/export', (req, res) => ProductionRuleController.exportRules(req, res));
router.get('/audit', (req, res) => ProductionRuleController.getAuditHistory(req, res));
router.get('/analytics', (req, res) => ProductionRuleController.getAnalytics(req, res));
router.get('/performance', (req, res) => ProductionRuleController.getPerformance(req, res));
router.get('/dependencies', (req, res) => ProductionRuleController.getDependencies(req, res));
router.get('/conflicts', (req, res) => ProductionRuleController.getConflicts(req, res));
router.get('/executions', (req, res) => ProductionRuleController.getExecutionLogs(req, res));
router.get('/templates', (req, res) => ProductionRuleController.getTemplates(req, res));
router.post('/templates', (req, res) => ProductionRuleController.createTemplate(req, res));
router.post('/api-trigger', (req, res) => ProductionRuleController.apiTrigger(req, res));
router.post('/webhook', (req, res) => ProductionRuleController.webhook(req, res));
router.get('/jobs', (req, res) => ProductionRuleController.getJobs(req, res));
router.post('/publish', (req, res) => ProductionRuleController.publishRule(req, res));
router.post('/archive', (req, res) => ProductionRuleController.archiveRule(req, res));
router.get('/production-status', (req, res) => ProductionRuleController.getProductionStatus(req, res));

module.exports = router;
