const workflowController = require('./controllers/workflow.controller');
const workflowAutomationController = require('./controllers/workflow-automation.controller');
const workflowService = require('./services/workflow.service');
const approvalService = require('./services/approval.service');
const workflowAutomationService = require('./services/workflow-automation.service');
const workflowRepository = require('./repositories/workflow.repository');
const approvalRepository = require('./repositories/approval.repository');
const workflowRoutes = require('./routes/workflow.routes');
const workflowRulesRoutes = require('./routes/workflow-rules.routes');

module.exports = {
  workflowController,
  workflowAutomationController,
  workflowService,
  approvalService,
  workflowAutomationService,
  workflowRepository,
  approvalRepository,
  workflowRoutes,
  workflowRulesRoutes,
};
