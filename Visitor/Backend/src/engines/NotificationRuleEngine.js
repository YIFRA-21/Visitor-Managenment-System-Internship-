// src/engines/NotificationRuleEngine.js
// Configurable Notification Rule Engine matching published business events to delivery workflows

const mockRules = [
  {
    ruleId: 'rule_101',
    ruleName: 'Blacklist Watchlist Alert Rule',
    eventName: 'blacklist.detected',
    enabled: true,
    severity: 'critical',
    recipientRoles: ['security_officer', 'soc_officer', 'security_manager'],
    channels: ['in_app', 'socket_io', 'email', 'desktop'],
    emergencyBypassQuietHours: true,
    retryPolicy: { maxAttempts: 3, backoffSec: 5 }
  },
  {
    ruleId: 'rule_102',
    ruleName: 'Visitor Arrival Host Notification',
    eventName: 'visitor.arrived',
    enabled: true,
    severity: 'high',
    recipientRoles: ['host_employee', 'receptionist'],
    channels: ['in_app', 'socket_io', 'email', 'browser'],
    emergencyBypassQuietHours: false,
    retryPolicy: { maxAttempts: 2, backoffSec: 10 }
  },
  {
    ruleId: 'rule_103',
    ruleName: 'Emergency Lockdown Alert Rule',
    eventName: 'emergency.triggered',
    enabled: true,
    severity: 'critical',
    recipientRoles: ['security_officer', 'receptionist', 'admin', 'department_manager'],
    channels: ['in_app', 'socket_io', 'email', 'sms', 'desktop'],
    emergencyBypassQuietHours: true,
    retryPolicy: { maxAttempts: 5, backoffSec: 2 }
  }
];

class NotificationRuleEngine {
  async evaluateRules(eventInstance) {
    const matchingRules = mockRules.filter(
      r => r.enabled && (r.eventName === eventInstance.eventName || r.eventName === '*')
    );
    console.log(`[RULE ENGINE] Evaluated ${matchingRules.length} matching rule(s) for event ${eventInstance.eventName}`);
    return matchingRules;
  }

  async getRules() {
    return mockRules;
  }
}

module.exports = new NotificationRuleEngine();
