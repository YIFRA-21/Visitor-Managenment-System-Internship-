// src/services/admin/ops/SchedulerService.js
// Notification Scheduler Console Service

const { auditLog } = require('../../../utils/audit');

let schedules = [
  { id: 'sch_101', name: 'Daily Visitor Digest', cron: '0 17 * * *', status: 'active', nextRun: '2026-08-06T17:00:00Z', channel: 'email', recipients: 'Department Managers' },
  { id: 'sch_102', name: 'Weekly Security Compliance Report', cron: '0 0 * * MON', status: 'active', nextRun: '2026-08-10T00:00:00Z', channel: 'email', recipients: 'Executive Security' },
  { id: 'sch_103', name: 'Monthly VIP Host Audit Reminder', cron: '0 9 1 * *', status: 'paused', nextRun: '2026-09-01T09:00:00Z', channel: 'in_app', recipients: 'Reception Supervisors' }
];

async function listSchedules() {
  return schedules;
}

async function toggleScheduleStatus(id, action, userId = 'admin') {
  const sch = schedules.find(s => s.id === id);
  if (sch) {
    if (action === 'pause') sch.status = 'paused';
    else if (action === 'resume') sch.status = 'active';
    else if (action === 'cancel') sch.status = 'cancelled';

    await auditLog({ userId, entity: 'notification_scheduler', action: `schedule_${action}`, details: { id } });
  }
  return sch;
}

async function rescheduleJob(id, newCron, userId = 'admin') {
  const sch = schedules.find(s => s.id === id);
  if (sch) {
    sch.cron = newCron;
    sch.nextRun = new Date(Date.now() + 86400000).toISOString();
    await auditLog({ userId, entity: 'notification_scheduler', action: 'reschedule_job', details: { id, newCron } });
  }
  return sch;
}

module.exports = {
  listSchedules,
  toggleScheduleStatus,
  rescheduleJob
};
