// src/repositories/ManagerReminderRepository.js
// Repository for Manager Automated Reminders & Escalations

const mockReminders = [
  {
    id: 'rem_301',
    title: 'Pending After-Hours Approval Overdue SLA',
    target: 'After-Hours Access Request #appr_9021',
    category: 'Approval Deadline',
    triggerIntervalMinutes: 30,
    nextTriggerAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
    status: 'active',
    departmentId: 12
  },
  {
    id: 'rem_302',
    title: 'VIP Visitor Arrival Lead Notice',
    target: 'Ambassador Elena Rostova (Tomorrow 10:00 AM)',
    category: 'Visitor Arrival',
    triggerIntervalMinutes: 60,
    nextTriggerAt: new Date(Date.now() + 1000 * 60 * 120).toISOString(),
    status: 'active',
    departmentId: 12
  },
  {
    id: 'rem_303',
    title: 'Visitor Pass Expiry Notification',
    target: 'Badge V-908 (Michael Brown)',
    category: 'Visitor Pass Expiry',
    triggerIntervalMinutes: 15,
    nextTriggerAt: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
    status: 'active',
    departmentId: 12
  }
];

class ManagerReminderRepository {
  async getReminders(scope) {
    return mockReminders.filter(r => r.departmentId === scope.departmentId);
  }

  async addReminder(data, scope) {
    const newRem = {
      id: `rem_${Date.now()}`,
      status: 'active',
      departmentId: scope.departmentId,
      ...data
    };
    mockReminders.push(newRem);
    return newRem;
  }
}

module.exports = new ManagerReminderRepository();
