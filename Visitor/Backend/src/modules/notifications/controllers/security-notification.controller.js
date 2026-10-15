// src/controllers/security/SecurityNotificationController.js
const SecurityNotificationService = require('../services/security-notification.service');

async function getNotifications(req, res) {
  try {
    const data = await SecurityNotificationService.getNotifications(req.securityScope, req.query);
    res.json({ success: true, ...data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function acknowledgeNotification(req, res) {
  try {
    const { id } = req.params;
    const data = await SecurityNotificationService.acknowledgeNotification(id, req.securityScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function escalateNotification(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const data = await SecurityNotificationService.escalateNotification(id, reason, req.securityScope);
    res.json({ success: true, data, message: 'Alert escalated to SOC Supervisor' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function sendManualDispatch(req, res) {
  try {
    const data = await SecurityNotificationService.sendManualDispatch(req.body, req.securityScope);
    res.status(201).json({ success: true, data, message: 'Manual security alert dispatched' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  getNotifications,
  acknowledgeNotification,
  escalateNotification,
  sendManualDispatch
};
