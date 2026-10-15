// src/controllers/reception/ReceptionAnalyticsController.js
const ReceptionAnalyticsService = require('../services/reception-analytics.service');

async function getDashboardAnalytics(req, res) {
  try {
    const data = await ReceptionAnalyticsService.getDashboardAnalytics(req.receptionScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function exportReport(req, res) {
  try {
    const format = req.query.format || 'pdf';
    const data = await ReceptionAnalyticsService.generateReport(format, req.receptionScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  getDashboardAnalytics,
  exportReport
};
