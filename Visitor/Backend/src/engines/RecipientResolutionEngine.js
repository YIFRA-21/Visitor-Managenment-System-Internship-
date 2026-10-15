// src/engines/RecipientResolutionEngine.js
// Recipient Resolution Engine mapping rules and context to user accounts

class RecipientResolutionEngine {
  async resolveRecipients(rule, eventInstance) {
    const recipients = [];
    const context = eventInstance.context || {};

    // 1. Direct Target User ID in context
    if (context.targetUserId) {
      recipients.push({ userId: context.targetUserId, role: context.targetRole || 'user' });
    }

    // 2. Resolve Role-Based Groups
    if (rule.recipientRoles && Array.isArray(rule.recipientRoles)) {
      rule.recipientRoles.forEach(role => {
        recipients.push({
          roleGroup: role,
          buildingId: context.buildingId || 'bldg_hq',
          organizationId: context.organizationId || 1
        });
      });
    }

    return {
      resolvedCount: recipients.length,
      recipients
    };
  }
}

module.exports = new RecipientResolutionEngine();
