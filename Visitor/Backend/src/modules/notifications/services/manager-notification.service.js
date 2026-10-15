// src/services/manager/ManagerNotificationService.js
// Manager Notification Service with socket integration and scope protection

const ManagerNotificationRepository = require('../repositories/manager-notification.repository');
const { auditLog } = require('../../../utils/audit');

class ManagerNotificationService {
  async getNotifications(scope, queryParams) {
    return await ManagerNotificationRepository.getNotifications(scope, queryParams);
  }

  async markAsRead(id, scope) {
    const result = await ManagerNotificationRepository.markAsRead(id, scope);
    await auditLog({
      userId: scope.managerId,
      entity: 'manager_notification',
      action: 'mark_read',
      details: { id }
    });
    return result;
  }

  async markAllAsRead(scope) {
    await ManagerNotificationRepository.markAllAsRead(scope);
    await auditLog({
      userId: scope.managerId,
      entity: 'manager_notification',
      action: 'mark_all_read',
      details: { departmentId: scope.departmentId }
    });
    return { success: true, message: 'All department notifications marked as read' };
  }

  async togglePin(id, scope) {
    return await ManagerNotificationRepository.togglePin(id, scope);
  }

  async archiveNotification(id, scope) {
    return await ManagerNotificationRepository.archiveNotification(id, scope);
  }
}

module.exports = new ManagerNotificationService();
