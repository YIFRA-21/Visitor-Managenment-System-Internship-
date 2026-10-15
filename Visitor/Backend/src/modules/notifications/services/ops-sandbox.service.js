// src/services/admin/ops/SandboxService.js
// Isolated Notification Sandbox Testing Environment

const { auditLog } = require('../../../utils/audit');

let sandboxLog = [];

async function simulateNotificationEvent(eventPayload, userId = 'admin') {
  const simulationResult = {
    simulationId: `sim_${Date.now()}`,
    timestamp: new Date().toISOString(),
    sandboxMode: true,
    realWorldDispatched: false, // Guaranteed non-dispatch
    targetEvent: eventPayload.eventType || 'VISITOR_CHECKIN_COMPLETED',
    simulatedRule: 'Rule #12 – Standard Check-in Alert',
    channelActions: [
      { channel: 'in_app', status: 'simulated_success', latencyMs: 2, payloadPreview: 'Visitor John Doe arrived' },
      { channel: 'email', status: 'simulated_success', latencyMs: 42, payloadPreview: 'HTML template compiled with {{name}}' },
      { channel: 'sms', status: 'simulated_success', latencyMs: 110, payloadPreview: 'SMS text compiled with signature' }
    ],
    evaluatedConditions: {
      isVip: eventPayload.isVip || false,
      departmentMatch: true,
      quietHoursActive: false
    }
  };

  sandboxLog.unshift(simulationResult);

  await auditLog({
    userId,
    entity: 'notification_sandbox',
    action: 'simulate_event',
    details: { simulationId: simulationResult.simulationId, eventType: eventPayload.eventType }
  });

  return simulationResult;
}

async function getSandboxLogs() {
  return sandboxLog;
}

module.exports = {
  simulateNotificationEvent,
  getSandboxLogs
};
