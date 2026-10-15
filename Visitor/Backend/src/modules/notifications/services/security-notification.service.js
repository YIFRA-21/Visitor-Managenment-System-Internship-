// src/services/security/SecurityNotificationService.js
// Core Security Notification Service handling security alert feed & manual dispatch

const SecurityNotificationRepository = require('../repositories/security-notification.repository');
const { auditLog } = require('../../../utils/audit');

class SecurityNotificationService {
  async getNotifications(scope, queryParams) {
    return await SecurityNotificationRepository.getNotifications(scope, queryParams);
  }

  async acknowledgeNotification(id, scope) {
    const notif = await SecurityNotificationRepository.acknowledgeNotification(id, scope);
    await auditLog({
      userId: scope.securityUserId,
      entity: 'security_notification',
      action: 'acknowledge_alert',
      details: { id }
    });
    return notif;
  }

  async escalateNotification(id, reason, scope) {
    const notif = await SecurityNotificationRepository.escalateNotification(id, scope, reason);
    await auditLog({
      userId: scope.securityUserId,
      entity: 'security_notification',
      action: 'escalate_alert',
      details: { id, reason }
    });
    return notif;
  }

  async sendManualDispatch(payload, scope) {
    const dispatchAlert = {
      id: `secnotif_dispatch_${Date.now()}`,
      category: payload.category || 'Security Manual Dispatch',
      title: payload.title,
      message: payload.message,
      targetRecipient: payload.targetRecipient || 'All Security Officers',
      severity: payload.severity || 'high',
      status: 'sent',
      buildingId: scope.buildingId,
      createdBy: scope.securityUserId,
      createdAt: new Date().toISOString()
    };

    await auditLog({
      userId: scope.securityUserId,
      entity: 'security_notification',
      action: 'send_manual_dispatch',
      details: { id: dispatchAlert.id, title: dispatchAlert.title, target: dispatchAlert.targetRecipient }
    });

    return dispatchAlert;
  }
}

module.exports = new SecurityNotificationService();
