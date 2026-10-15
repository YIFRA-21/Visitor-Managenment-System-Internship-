// src/controllers/security/SecurityAnalyticsController.js
const SecurityAnalyticsService = require('../services/security-analytics.service');

async function getDashboardAnalytics(req, res) {
  try {
    const data = await SecurityAnalyticsService.getDashboardAnalytics(req.securityScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function exportReport(req, res) {
  try {
    const format = req.query.format || 'pdf';
    const data = await SecurityAnalyticsService.generateReport(format, req.securityScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  getDashboardAnalytics,
  exportReport
};
