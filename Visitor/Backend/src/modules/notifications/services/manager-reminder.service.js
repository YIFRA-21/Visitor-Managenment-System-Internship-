// src/services/manager/ManagerReminderService.js
// Service for automated manager reminders

const ManagerReminderRepository = require('../repositories/manager-reminder.repository');
const { auditLog } = require('../../../utils/audit');

class ManagerReminderService {
  async getReminders(scope) {
    return await ManagerReminderRepository.getReminders(scope);
  }

  async createReminder(reminderData, scope) {
    const reminder = await ManagerReminderRepository.addReminder(reminderData, scope);
    await auditLog({
      userId: scope.managerId,
      entity: 'manager_reminder',
      action: 'create_reminder',
      details: { id: reminder.id, title: reminder.title }
    });
    return reminder;
  }
}

module.exports = new ManagerReminderService();
