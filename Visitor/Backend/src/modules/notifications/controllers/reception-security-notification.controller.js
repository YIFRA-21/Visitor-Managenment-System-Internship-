// src/controllers/reception/ReceptionSecurityNotificationController.js
const ReceptionSecurityNotificationService = require('../services/reception-security-notification.service');

async function getSecurityAlerts(req, res) {
  try {
    const data = await ReceptionSecurityNotificationService.getSecurityAlerts(req.receptionScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function triggerEmergencyAlert(req, res) {
  try {
    const { alertType } = req.body;
    const data = await ReceptionSecurityNotificationService.triggerEmergencyAlert(alertType, req.receptionScope);
    res.status(201).json({ success: true, data, message: 'Emergency alert dispatched to building security' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  getSecurityAlerts,
  triggerEmergencyAlert
};
