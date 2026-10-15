// src/services/reception/ReceptionNotificationService.js
// Reception Notification Service handling inbox, manual dispatches, and socket events

const ReceptionNotificationRepository = require('../repositories/reception-notification.repository');
const { auditLog } = require('../../../utils/audit');

class ReceptionNotificationService {
  async getNotifications(scope, queryParams) {
    return await ReceptionNotificationRepository.getNotifications(scope, queryParams);
  }

  async markAsRead(id, scope) {
    const notif = await ReceptionNotificationRepository.markAsRead(id, scope);
    await auditLog({
      userId: scope.receptionUserId,
      entity: 'reception_notification',
      action: 'mark_read',
      details: { id }
    });
    return notif;
  }

  async markAllAsRead(scope) {
    await ReceptionNotificationRepository.markAllAsRead(scope);
    await auditLog({
      userId: scope.receptionUserId,
      entity: 'reception_notification',
      action: 'mark_all_read',
      details: { deskId: scope.deskId }
    });
    return { success: true, message: 'All reception notifications marked as read' };
  }

  async sendManualNotification(payload, scope) {
    const manualAlert = {
      id: `rnotif_man_${Date.now()}`,
      category: payload.category || 'Manual Alert',
      title: payload.title,
      message: payload.message,
      targetRecipient: payload.targetRecipient || 'Host Employee',
      channels: payload.channels || ['in_app', 'email'],
      status: 'sent',
      deskId: scope.deskId,
      createdBy: scope.receptionUserId,
      createdAt: new Date().toISOString()
    };

    await auditLog({
      userId: scope.receptionUserId,
      entity: 'reception_notification',
      action: 'send_manual_notification',
      details: { id: manualAlert.id, title: manualAlert.title, target: manualAlert.targetRecipient }
    });

    return manualAlert;
  }
}

module.exports = new ReceptionNotificationService();
