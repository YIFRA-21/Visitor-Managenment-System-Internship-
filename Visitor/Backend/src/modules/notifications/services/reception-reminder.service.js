// src/services/reception/ReceptionReminderService.js
// Automated Lead-Time Reminders for Reception Operations

const { auditLog } = require('../../../utils/audit');

const mockReceptionReminders = [
  {
    id: 'rrem_101',
    title: 'Host Response Lead-time Exceeded (>10m)',
    target: 'Host David Miller (Sarah Jenkins Waiting)',
    category: 'Host Pending',
    intervalMinutes: 5,
    status: 'active',
    deskId: 'desk_main_lobby_01'
  },
  {
    id: 'rrem_102',
    title: 'Visitor Pass Expiry Notification',
    target: 'Badge V-908 (Michael Brown)',
    category: 'Pass Expiry',
    intervalMinutes: 15,
    status: 'active',
    deskId: 'desk_main_lobby_01'
  }
];

class ReceptionReminderService {
  async getReminders(scope) {
    return mockReceptionReminders.filter(r => r.deskId === scope.deskId);
  }

  async triggerReminder(id, scope) {
    const rem = mockReceptionReminders.find(r => r.id === id);
    if (!rem) throw new Error('Reminder not found');

    await auditLog({
      userId: scope.receptionUserId,
      entity: 'reception_reminder',
      action: 'trigger_reminder',
      details: { id, title: rem.title }
    });

    return { ...rem, triggeredAt: new Date().toISOString() };
  }
}

module.exports = new ReceptionReminderService();
