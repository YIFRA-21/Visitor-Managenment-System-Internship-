const db = require('../../../config/db');

class NotificationRuleEngineService {
  /**
   * Evaluate IF-THEN rules for a business event key and payload
   */
  async evaluateRules(eventKey, payload = {}) {
    try {
      // 1. Fetch matching active rule from DB if present
      const rules = await db.query(
        `SELECT * FROM notification_rules WHERE event_key = ? AND is_active = TRUE LIMIT 1`,
        [eventKey]
      );

      let rule = Array.isArray(rules) && rules[0] ? rules[0] : null;

      // 2. Default Rule Configuration Matrix Fallback
      let priority = payload.priority || (rule ? rule.priority : this.inferDefaultPriority(eventKey));
      let category = payload.category || this.inferDefaultCategory(eventKey);
      let channels = payload.channels || ['in_app'];

      if (priority === 'urgent' || priority === 'high') {
        channels = ['in_app', 'email', 'sms'];
      } else if (category === 'Reception' || category === 'Appointments') {
        channels = ['in_app', 'email'];
      }

      // Escalation Policy metadata
      let escalation = {
        enabled: priority === 'urgent' || priority === 'high',
        timeout_minutes: priority === 'urgent' ? 10 : 30,
        fallback_role: priority === 'urgent' ? 'security' : 'manager'
      };

      if (rule && rule.escalation_json) {
        try {
          const parsed = typeof rule.escalation_json === 'string' ? JSON.parse(rule.escalation_json) : rule.escalation_json;
          escalation = { ...escalation, ...parsed };
        } catch (e) {}
      }

      return {
        ruleId: rule ? rule.id : null,
        ruleCode: rule ? rule.rule_code : `AUTO-${eventKey}`,
        priority,
        category,
        channels,
        escalation
      };

    } catch (err) {
      console.error('Error evaluating notification rules:', err);
      return {
        ruleId: null,
        ruleCode: `AUTO-${eventKey}`,
        priority: payload.priority || 'medium',
        category: 'General',
        channels: ['in_app'],
        escalation: { enabled: false }
      };
    }
  }

  inferDefaultPriority(eventKey) {
    if (eventKey.includes('SECURITY') || eventKey.includes('LOCKDOWN') || eventKey.includes('FAILED_ATTEMPTS') || eventKey.includes('BLACKLIST')) {
      return 'urgent';
    }
    if (eventKey.includes('APPROV') || eventKey.includes('ARRIV') || eventKey.includes('CANCEL')) {
      return 'high';
    }
    if (eventKey.includes('REMINDER') || eventKey.includes('REQUEST')) {
      return 'medium';
    }
    return 'low';
  }

  inferDefaultCategory(eventKey) {
    if (eventKey.startsWith('AUTH_')) return 'Authentication';
    if (eventKey.startsWith('VISITOR_')) return 'Visitor Management';
    if (eventKey.startsWith('IDENTITY_')) return 'Identity Verification';
    if (eventKey.startsWith('APPT_')) return 'Appointments';
    if (eventKey.startsWith('APPROVAL_')) return 'Approval Workflow';
    if (eventKey.startsWith('RECEPTION_')) return 'Reception';
    if (eventKey.startsWith('CHECKIN_') || eventKey.startsWith('SECURITY_')) return 'Security';
    if (eventKey.startsWith('PASS_')) return 'Visitor Pass';
    if (eventKey.startsWith('MEETING_')) return 'Meetings';
    if (eventKey.startsWith('SUPPORT_')) return 'Help Desk';
    return 'System';
  }
}

module.exports = new NotificationRuleEngineService();
