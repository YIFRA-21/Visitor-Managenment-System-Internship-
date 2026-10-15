// src/controllers/admin/ops/SandboxController.js
const SandboxService = require('../services/ops-sandbox.service');

async function simulateEvent(req, res) {
  try {
    const userId = req.user?.id || 'admin';
    const data = await SandboxService.simulateNotificationEvent(req.body, userId);
    res.json({ success: true, data, message: 'Sandbox notification simulation completed successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getLogs(req, res) {
  try {
    const data = await SandboxService.getSandboxLogs();
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { simulateEvent, getLogs };
