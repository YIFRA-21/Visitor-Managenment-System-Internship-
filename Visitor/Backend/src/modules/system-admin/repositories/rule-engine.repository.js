const BaseRepository = require('./base.repository');

class RuleEngineRepository extends BaseRepository {
  constructor() {
    super(null); // Will bind Sequelize models when initialized
    this._mockRules = [
      { id: 1, name: 'Visitor Check-In Alert', category: 'Check-In', module_name: 'CHECKIN', business_event: 'CHECKIN_COMPLETED', trigger_type: 'immediate', priority: 'high', status: 'active', created_by: 'Admin' },
      { id: 2, name: 'Appointment Approval Required', category: 'Approval Workflow', module_name: 'APPROVAL', business_event: 'APPT_REQUESTED', trigger_type: 'immediate', priority: 'medium', status: 'active', created_by: 'Admin' }
    ];
  }

  async getActiveRulesByEvent(eventName) {
    return this._mockRules.filter(r => r.business_event === eventName && r.status === 'active');
  }

  async getAllRules() {
    return this._mockRules;
  }

  async getRuleById(id) {
    return this._mockRules.find(r => r.id == id) || null;
  }

  async saveRule(data) {
    const newRule = { id: Date.now(), ...data, created_at: new Date().toISOString() };
    this._mockRules.push(newRule);
    return newRule;
  }

  async updateRuleStatus(id, status) {
    const rule = await this.getRuleById(id);
    if (rule) rule.status = status;
    return rule;
  }
}

module.exports = new RuleEngineRepository();
