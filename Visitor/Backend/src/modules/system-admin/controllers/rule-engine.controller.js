const RuleEngineService = require('../services/rule-engine.service');

class RuleEngineController {
  // GET /api/notification-rules/dashboard
  async getDashboard(req, res) {
    try {
      const kpis = await RuleEngineService.getDashboardKpis();
      const categories = RuleEngineService.getCategories();
      const events = RuleEngineService.getBusinessEvents();
      res.json({ success: true, data: { kpis, categories, events } });
    } catch (err) {
      res.status(500).json({ error: 'Failed to load rule engine dashboard' });
    }
  }

  // GET /api/notification-rules
  async getRules(req, res) {
    try {
      const rules = await RuleEngineService.getRules();
      res.json({ success: true, data: rules });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch rules' });
    }
  }

  // GET /api/notification-rules/:id
  async getRuleById(req, res) {
    try {
      const rule = await RuleEngineService.getRuleById(req.params.id);
      res.json({ success: true, data: rule });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch rule' });
    }
  }

  // POST /api/notification-rules
  async createRule(req, res) {
    try {
      const userId = req.user?.id || req.user?.userId;
      const result = await RuleEngineService.createRule(req.body, userId);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create rule' });
    }
  }

  // PUT /api/notification-rules/:id
  async updateRule(req, res) {
    try {
      const result = await RuleEngineService.updateRule(req.params.id, req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update rule' });
    }
  }

  // DELETE /api/notification-rules/:id
  async deleteRule(req, res) {
    try {
      const result = await RuleEngineService.deleteRule(req.params.id);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete rule' });
    }
  }

  // PATCH /api/notification-rules/:id/status
  async toggleStatus(req, res) {
    try {
      const result = await RuleEngineService.toggleRuleStatus(req.params.id, req.body.status);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ error: 'Failed to toggle rule status' });
    }
  }

  // GET /api/business-events
  async getBusinessEvents(req, res) {
    res.json({ success: true, data: RuleEngineService.getBusinessEvents() });
  }

  // GET /api/notification-rules/categories
  async getCategories(req, res) {
    res.json({ success: true, data: RuleEngineService.getCategories() });
  }

  // GET /api/notification-rules/operators
  async getOperators(req, res) {
    res.json({ success: true, data: RuleEngineService.getConditionOperators() });
  }

  // GET /api/notification-rules/actions
  async getActions(req, res) {
    res.json({ success: true, data: RuleEngineService.getAvailableActions() });
  }

  // GET /api/notification-rules/workflow-nodes
  async getWorkflowNodes(req, res) {
    res.json({ success: true, data: RuleEngineService.getWorkflowNodeTypes() });
  }
}

module.exports = new RuleEngineController();
