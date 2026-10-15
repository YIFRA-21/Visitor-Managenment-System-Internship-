// src/controllers/manager/ManagerAnalyticsController.js
const ManagerAnalyticsService = require('../services/manager-analytics.service');

async function getDashboardAnalytics(req, res) {
  try {
    const data = await ManagerAnalyticsService.getDashboardAnalytics(req.managerScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function exportReport(req, res) {
  try {
    const format = req.query.format || 'pdf';
    const data = await ManagerAnalyticsService.generateReport(format, req.managerScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  getDashboardAnalytics,
  exportReport
};
