// src/controllers/platform/PlatformNotificationController.js
const PlatformNotificationService = require('../services/platform-notification.service');

async function publishEvent(req, res) {
  try {
    const { eventName, payload, context } = req.body;
    const data = await PlatformNotificationService.publishAndProcessEvent(eventName, payload, context || req.platformScope);
    res.status(201).json({ success: true, data, message: `Event ${eventName} published and processed` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getNotifications(req, res) {
  try {
    const data = await PlatformNotificationService.getNotifications(req.platformScope, req.query);
    res.json({ success: true, ...data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const data = await PlatformNotificationService.markAsRead(id);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getEventCatalog(req, res) {
  try {
    const data = await PlatformNotificationService.getEventCatalog();
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getRules(req, res) {
  try {
    const data = await PlatformNotificationService.getRules();
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getProviderHealth(req, res) {
  try {
    const data = await PlatformNotificationService.getProviderHealth();
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getAnalytics(req, res) {
  try {
    const data = await PlatformNotificationService.getAnalytics(req.platformScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function exportReport(req, res) {
  try {
    const format = req.query.format || 'pdf';
    const data = await PlatformNotificationService.generateReport(format, req.platformScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  publishEvent,
  getNotifications,
  markAsRead,
  getEventCatalog,
  getRules,
  getProviderHealth,
  getAnalytics,
  exportReport
};
