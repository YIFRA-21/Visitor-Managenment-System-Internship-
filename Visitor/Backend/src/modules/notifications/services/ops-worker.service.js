// src/services/admin/ops/WorkerService.js
// Worker Pool & Queue Consumer Management (Redis / BullMQ / RabbitMQ ready)

const { auditLog } = require('../../../utils/audit');

let workers = [
  { id: 'worker_1', name: 'RabbitMQ Consumer #1 (High Priority)', status: 'active', assignedQueue: 'q_high_priority', currentJob: 'job_8841 (SMS Emergency)', processedCount: 1450, failedCount: 2, cpuUsagePct: 4.2 },
  { id: 'worker_2', name: 'RabbitMQ Consumer #2 (Normal Priority)', status: 'active', assignedQueue: 'q_normal_priority', currentJob: 'job_8842 (Email Checkin)', processedCount: 12400, failedCount: 12, cpuUsagePct: 11.5 },
  { id: 'worker_3', name: 'RabbitMQ Consumer #3 (Retry & DLQ)', status: 'idle', assignedQueue: 'q_retry_dlq', currentJob: null, processedCount: 380, failedCount: 0, cpuUsagePct: 0.8 }
];

async function getWorkers() {
  return workers;
}

async function restartWorker(workerId, userId = 'admin') {
  const w = workers.find(item => item.id === workerId);
  if (w) {
    w.status = 'restarting';
    setTimeout(() => { w.status = 'active'; }, 1000);

    await auditLog({ userId, entity: 'notification_worker', action: 'restart_worker', details: { workerId } });
  }
  return w;
}

module.exports = {
  getWorkers,
  restartWorker
};
