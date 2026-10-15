class ReminderEngine {
  createReminder(event, timeOffsetHours = 24) {
    return {
      reminderId: `REM-${Date.now()}`,
      event,
      timeOffsetHours,
      status: 'scheduled',
      scheduledFor: new Date(Date.now() + timeOffsetHours * 3600 * 1000).toISOString()
    };
  }
}

module.exports = new ReminderEngine();
