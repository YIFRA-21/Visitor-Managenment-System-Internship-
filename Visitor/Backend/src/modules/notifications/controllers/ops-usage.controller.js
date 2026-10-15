// src/controllers/admin/ops/UsageController.js
const UsageAnalyticsService = require('../services/ops-usage-analytics.service');

async function getUsageMetrics(req, res) {
  try {
    const data = await UsageAnalyticsService.getUsageMetrics();
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { getUsageMetrics };
