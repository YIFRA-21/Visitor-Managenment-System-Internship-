const WorkflowAutomationService = require('../services/workflow-automation.service');

class WorkflowAutomationController {
  // GET /api/rules/schedules
  async getSchedules(req, res) {
    try {
      const data = await WorkflowAutomationService.getSchedulingRules();
      res.json({ success: true, data });
    } catch { res.status(500).json({ error: 'Failed to fetch schedules' }); }
  }

  // GET /api/rules/escalations
  async getEscalations(req, res) {
    try {
      const data = await WorkflowAutomationService.getEscalations();
      res.json({ success: true, data });
    } catch { res.status(500).json({ error: 'Failed to fetch escalations' }); }
  }

  // GET /api/rules/reminders
  async getReminders(req, res) {
    try {
      const data = await WorkflowAutomationService.getReminders();
      res.json({ success: true, data });
    } catch { res.status(500).json({ error: 'Failed to fetch reminders' }); }
  }

  // GET /api/rules/retries
  async getRetries(req, res) {
    try {
      const data = await WorkflowAutomationService.getRetries();
      res.json({ success: true, data });
    } catch { res.status(500).json({ error: 'Failed to fetch retries' }); }
  }

  // GET /api/rules/approvals
  async getApprovals(req, res) {
    try {
      const data = await WorkflowAutomationService.getApprovals();
      res.json({ success: true, data });
    } catch { res.status(500).json({ error: 'Failed to fetch approvals' }); }
  }

  // GET /api/rules/organization
  async getOrgHierarchy(req, res) {
    try {
      const data = await WorkflowAutomationService.getOrgHierarchyRules();
      res.json({ success: true, data });
    } catch { res.status(500).json({ error: 'Failed to fetch org hierarchy rules' }); }
  }

  // GET /api/rules/roles
  async getRoleRules(req, res) {
    try {
      const data = await WorkflowAutomationService.getRoleRules();
      res.json({ success: true, data });
    } catch { res.status(500).json({ error: 'Failed to fetch role rules' }); }
  }

  // GET /api/rules/user-groups
  async getUserGroups(req, res) {
    try {
      const data = await WorkflowAutomationService.getUserGroups();
      res.json({ success: true, data });
    } catch { res.status(500).json({ error: 'Failed to fetch user groups' }); }
  }
}

module.exports = new WorkflowAutomationController();
