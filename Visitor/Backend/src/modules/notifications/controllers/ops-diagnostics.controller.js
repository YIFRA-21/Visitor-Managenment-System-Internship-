// src/controllers/admin/ops/DiagnosticsController.js
const DiagnosticsService = require('../services/ops-diagnostics.service');

async function runDiagnostics(req, res) {
  try {
    const userId = req.user?.id || 'admin';
    const data = await DiagnosticsService.runFullDiagnostics(userId);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { runDiagnostics };
