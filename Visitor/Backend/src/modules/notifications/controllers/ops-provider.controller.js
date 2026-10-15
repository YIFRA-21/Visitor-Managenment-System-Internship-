// src/controllers/admin/ops/ProviderController.js
const ProviderService = require('../services/ops-provider.service');
const ProviderFailoverService = require('../services/ops-provider-failover.service');

async function listProviders(req, res) {
  try {
    const data = await ProviderService.listProviders();
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function addProvider(req, res) {
  try {
    const userId = req.user?.id || 'admin';
    const data = await ProviderService.addProvider(req.body, userId);
    res.status(201).json({ success: true, data, message: 'Provider registered successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function toggleProvider(req, res) {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    const userId = req.user?.id || 'admin';
    const data = await ProviderService.toggleProvider(id, enabled, userId);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function testConnection(req, res) {
  try {
    const { id } = req.params;
    const data = await ProviderService.testProviderConnection(id);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getFailoverStatus(req, res) {
  try {
    const data = await ProviderFailoverService.getFailoverStatus();
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function triggerFailover(req, res) {
  try {
    const { channel, targetProviderId } = req.body;
    const userId = req.user?.id || 'admin';
    const data = await ProviderFailoverService.triggerManualFailover(channel, targetProviderId, userId);
    res.json({ success: true, data, message: `Manual failover triggered for ${channel}` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  listProviders,
  addProvider,
  toggleProvider,
  testConnection,
  getFailoverStatus,
  triggerFailover
};
