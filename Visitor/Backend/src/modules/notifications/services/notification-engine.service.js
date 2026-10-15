const RuleEngineRepository = require('../../system-admin/repositories/rule-engine.repository');
const WorkflowEngine = require('../../../engines/WorkflowEngine');
const EventEngine = require('../../../engines/EventEngine');
const RecipientEngine = require('../../../engines/RecipientEngine');
const ChannelEngine = require('../../../engines/ChannelEngine');
const QueueEngine = require('../../../engines/QueueEngine');
const AnalyticsEngine = require('../../../engines/AnalyticsEngine');
const AuditEngine = require('../../../engines/AuditEngine');

class NotificationEngineService {
  async processEvent(eventName, payload, req = null) {
    // Fetch active rules matching this event from Repository
    const activeRules = await RuleEngineRepository.getActiveRulesByEvent(eventName);

    // Execute complete workflow engine pipeline
    const result = await WorkflowEngine.processEvent(eventName, payload, activeRules);

    // Record audit event
    if (req) {
      AuditEngine.logEvent(req, 'EVENT_PROCESSED', { eventName, workflowId: result.workflowId });
    }

    return result;
  }

  async getEngineStatus() {
    const queueStats = QueueEngine.getStats();
    const rules = await RuleEngineRepository.getAllRules();
    return {
      status: 'operational',
      registeredEventsCount: EventEngine.getRegisteredEvents().length,
      totalRulesCount: rules.length,
      activeRulesCount: rules.filter(r => r.status === 'active').length,
      queueStats,
      timestamp: new Date().toISOString()
    };
  }

  async createRule(ruleData, req = null) {
    const rule = await RuleEngineRepository.saveRule(ruleData);
    if (req) {
      AuditEngine.logEvent(req, 'RULE_CREATED', { ruleId: rule.id, name: rule.name });
    }
    return rule;
  }

  async getAnalytics(logs = []) {
    return AnalyticsEngine.calculateMetrics(logs);
  }
}

module.exports = new NotificationEngineService();
