class SchedulingEngine {
  calculateSchedule(triggerType, options = {}) {
    const now = new Date();
    switch (triggerType) {
      case 'delayed':
        const delayMs = (options.delayMins || 5) * 60 * 1000;
        return { mode: 'delayed', executeAt: new Date(now.getTime() + delayMs).toISOString() };
      case 'scheduled':
        return { mode: 'scheduled', executeAt: options.scheduledTime || now.toISOString() };
      case 'recurring':
        return { mode: 'recurring', cronExpression: options.cron || '0 8 * * *' };
      case 'immediate':
      default:
        return { mode: 'immediate', executeAt: now.toISOString() };
    }
  }
}

module.exports = new SchedulingEngine();
