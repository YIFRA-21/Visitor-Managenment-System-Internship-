// src/services/admin/ops/ProviderFailoverService.js
// Provider Failover Management (Automatic failover, manual overrides, failback)

const { auditLog } = require('../../../utils/audit');

let failoverState = {
  autoFailoverEnabled: true,
  failureThresholdCount: 3,
  timeoutMs: 5000,
  activeRoutes: {
    email: { activeProviderId: 'prov_1', name: 'Primary SMTP Gateway', status: 'primary' },
    sms: { activeProviderId: 'prov_3', name: 'Twilio Bulk SMS Gateway', status: 'primary' },
    push: { activeProviderId: 'prov_5', name: 'Firebase Cloud Messaging (FCM)', status: 'primary' }
  },
  failoverHistory: [
    { timestamp: '2026-08-05T14:30:00Z', channel: 'sms', from: 'prov_3 (Twilio)', to: 'prov_4 (Africa\'s Talking)', reason: 'High Latency Timeout (>180ms)' },
    { timestamp: '2026-08-05T15:00:00Z', channel: 'sms', from: 'prov_4 (Africa\'s Talking)', to: 'prov_3 (Twilio)', reason: 'Automatic Failback Recovery' }
  ]
};

async function getFailoverStatus() {
  return failoverState;
}

async function triggerManualFailover(channel, targetProviderId, userId = 'admin') {
  const previousRoute = failoverState.activeRoutes[channel];
  failoverState.activeRoutes[channel] = {
    activeProviderId: targetProviderId,
    name: `Provider (${targetProviderId})`,
    status: 'manual_failover'
  };

  failoverState.failoverHistory.unshift({
    timestamp: new Date().toISOString(),
    channel,
    from: previousRoute ? previousRoute.activeProviderId : 'None',
    to: targetProviderId,
    reason: `Manual Failover triggered by ${userId}`
  });

  await auditLog({
    userId,
    entity: 'provider_failover',
    action: 'manual_failover',
    details: { channel, targetProviderId }
  });

  return failoverState;
}

module.exports = {
  getFailoverStatus,
  triggerManualFailover
};
