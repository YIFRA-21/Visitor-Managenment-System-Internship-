const db = require('../../../config/db');
const NotificationRuleEngineService = require('./notification-rule-engine.service');
const RecipientResolverService = require('./recipient-resolver.service');
const QueueManagerService = require('../../check-in-out/services/queue-manager.service');

class AutomaticNotificationEngine {
  /**
   * Main Engine Entry Point: Process Domain Business Event
   */
  async dispatchDomainEvent(eventKey, payload = {}) {
    try {
      console.log(`[AutomaticNotificationEngine] Processing domain event: ${eventKey}`);

      // 1. Evaluate Rule Matrix
      const ruleResult = await NotificationRuleEngineService.evaluateRules(eventKey, payload);

      // 2. Resolve Target Recipients
      const recipients = await RecipientResolverService.resolveRecipients(eventKey, payload);

      if (recipients.length === 0) {
        console.log(`[AutomaticNotificationEngine] Event ${eventKey} resolved 0 recipients. System fallback admin alert.`);
      }

      // 3. Render Title, Message & Action URL
      const title = payload.title || this.renderDefaultTitle(eventKey, payload);
      const message = payload.message || this.renderDefaultMessage(eventKey, payload);
      const refNo = payload.reference_number || payload.ref_no || `NTF-${Date.now().toString(36).toUpperCase()}`;
      const actionUrl = payload.action_url || this.resolveActionUrl(eventKey);

      const dispatchedResults = [];

      // 4. Dispatch for each resolved recipient via NotificationService
      const NotificationService = require('./notification.service');

      for (const recipient of recipients) {
        const userId = recipient.id || null;
        const visitorEmail = recipient.email || payload.visitor_email || null;

        const res = await NotificationService.dispatchBusinessNotification(
          eventKey,
          userId,
          {
            ...payload,
            title,
            message,
            priority: ruleResult.priority,
            category: ruleResult.category,
            channel: ruleResult.channels[0] || 'in_app',
            action_url: actionUrl,
            reference_number: refNo,
            record_id: payload.record_id || null,
            phone: recipient.phone || payload.phone || null
          },
          visitorEmail
        );

        dispatchedResults.push(res);
      }

      return {
        success: true,
        eventKey,
        refNo,
        ruleCode: ruleResult.ruleCode,
        recipientsCount: recipients.length,
        dispatchedResults
      };

    } catch (err) {
      console.error(`[AutomaticNotificationEngine] Error dispatching event ${eventKey}:`, err);
      throw err;
    }
  }

  renderDefaultTitle(eventKey, payload) {
    if (payload.title) return payload.title;
    const cleanKey = eventKey.replace(/_/g, ' ').toLowerCase();
    return cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1);
  }

  renderDefaultMessage(eventKey, payload) {
    if (payload.message) return payload.message;
    if (eventKey === 'VISITOR_ARRIVED') {
      return `${payload.visitor_name || 'Guest Visitor'} has arrived at Lobby Reception.`;
    }
    if (eventKey === 'APPT_APPROVED') {
      return `Appointment #${payload.reference_code || payload.ref_no || ''} has been approved by host.`;
    }
    if (eventKey === 'SECURITY_BLACKLIST_MATCH') {
      return `CRITICAL: Security Watchlist / Blacklist match detected for visitor ${payload.visitor_name || ''}.`;
    }
    return `Notification alert triggered for event: ${eventKey}`;
  }

  resolveActionUrl(eventKey) {
    if (eventKey.startsWith('VISITOR_') || eventKey.startsWith('RECEPTION_')) return '/employee/visitors';
    if (eventKey.startsWith('APPT_') || eventKey.startsWith('APPROVAL_')) return '/employee/requests';
    if (eventKey.startsWith('SECURITY_') || eventKey.startsWith('CHECKIN_')) return '/employee/appointments';
    if (eventKey.startsWith('MEETING_')) return '/employee/calendar';
    return '/employee/dashboard';
  }
}

module.exports = new AutomaticNotificationEngine();
