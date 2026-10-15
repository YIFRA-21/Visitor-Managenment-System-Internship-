const ModuleRulesService = require('../services/module-rules.service');

class ModuleRulesController {
  async getVisitorRules(req, res) {
    res.json({ success: true, data: ModuleRulesService.getVisitorRules() });
  }

  async getEmployeeRules(req, res) {
    res.json({ success: true, data: ModuleRulesService.getEmployeeRules() });
  }

  async getAppointmentRules(req, res) {
    res.json({ success: true, data: ModuleRulesService.getAppointmentRules() });
  }

  async getReceptionRules(req, res) {
    res.json({ success: true, data: ModuleRulesService.getReceptionRules() });
  }

  async getSecurityRules(req, res) {
    res.json({ success: true, data: ModuleRulesService.getSecurityRules() });
  }

  async getPassRules(req, res) {
    res.json({ success: true, data: ModuleRulesService.getPassRules() });
  }

  async getCheckinRules(req, res) {
    res.json({ success: true, data: ModuleRulesService.getCheckinRules() });
  }

  async getCheckoutRules(req, res) {
    res.json({ success: true, data: ModuleRulesService.getCheckoutRules() });
  }

  async getEmergencyRules(req, res) {
    res.json({ success: true, data: ModuleRulesService.getEmergencyRules() });
  }

  async getSystemRules(req, res) {
    res.json({ success: true, data: ModuleRulesService.getSystemRules() });
  }

  async runRuleTest(req, res) {
    try {
      const result = ModuleRulesService.runRuleTest(req.body);
      res.json({ success: true, data: result });
    } catch { res.status(500).json({ error: 'Rule test failed' }); }
  }

  async runSimulation(req, res) {
    try {
      const result = ModuleRulesService.runSimulation(req.body);
      res.json({ success: true, data: result });
    } catch { res.status(500).json({ error: 'Rule simulation failed' }); }
  }
}

module.exports = new ModuleRulesController();
