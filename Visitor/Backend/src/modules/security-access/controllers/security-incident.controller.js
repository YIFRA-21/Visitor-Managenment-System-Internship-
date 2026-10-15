// src/controllers/security/SecurityIncidentController.js
const SecurityIncidentNotificationService = require('../services/security-incident-notification.service');

async function getIncidents(req, res) {
  try {
    const data = await SecurityIncidentNotificationService.getIncidents(req.securityScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function triggerEmergencyIncident(req, res) {
  try {
    const data = await SecurityIncidentNotificationService.triggerEmergencyIncident(req.body, req.securityScope);
    res.status(201).json({ success: true, data, message: 'Emergency incident triggered successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  getIncidents,
  triggerEmergencyIncident
};
