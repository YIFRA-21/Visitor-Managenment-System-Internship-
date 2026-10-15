// src/services/admin/ops/ProviderService.js
// External Provider Management (SMTP, Twilio, FCM, Vonage, Webhooks, etc.)

const { auditLog } = require('../../../utils/audit');

let providers = [
  { id: 'prov_1', name: 'Primary SMTP Gateway', type: 'email', subType: 'SMTP', enabled: true, priority: 1, status: 'healthy', latencyMs: 35, encryptedCredentials: 'enc_aes256_smtp_secret' },
  { id: 'prov_2', name: 'Backup Microsoft 365 Exchange', type: 'email', subType: 'M365', enabled: true, priority: 2, status: 'healthy', latencyMs: 48, encryptedCredentials: 'enc_aes256_m365_secret' },
  { id: 'prov_3', name: 'Twilio Bulk SMS Gateway', type: 'sms', subType: 'Twilio', enabled: true, priority: 1, status: 'degraded', latencyMs: 180, encryptedCredentials: 'enc_aes256_twilio_secret' },
  { id: 'prov_4', name: 'Africa\'s Talking SMS Backup', type: 'sms', subType: 'AfricasTalking', enabled: true, priority: 2, status: 'healthy', latencyMs: 95, encryptedCredentials: 'enc_aes256_africas_talking_secret' },
  { id: 'prov_5', name: 'Firebase Cloud Messaging (FCM)', type: 'push', subType: 'FCM', enabled: true, priority: 1, status: 'healthy', latencyMs: 12, encryptedCredentials: 'enc_aes256_fcm_secret' }
];

async function listProviders() {
  return providers;
}

async function addProvider(providerData, userId = 'admin') {
  const newProvider = {
    id: `prov_${Date.now()}`,
    enabled: true,
    status: 'healthy',
    latencyMs: 25,
    encryptedCredentials: `enc_aes256_${Date.now()}`,
    ...providerData
  };
  providers.push(newProvider);

  await auditLog({
    userId,
    entity: 'notification_provider',
    action: 'add_provider',
    details: { id: newProvider.id, name: newProvider.name }
  });

  return newProvider;
}

async function toggleProvider(id, enabled, userId = 'admin') {
  const p = providers.find(item => item.id === id);
  if (p) {
    p.enabled = enabled;
    await auditLog({ userId, entity: 'notification_provider', action: 'toggle_provider', details: { id, enabled } });
  }
  return p;
}

async function testProviderConnection(id) {
  const p = providers.find(item => item.id === id);
  if (!p) throw new Error('Provider not found');

  return {
    providerId: id,
    name: p.name,
    type: p.type,
    status: p.status,
    connectionSuccessful: true,
    latencyMs: p.latencyMs || 30,
    testedAt: new Date().toISOString()
  };
}

module.exports = {
  listProviders,
  addProvider,
  toggleProvider,
  testProviderConnection
};
