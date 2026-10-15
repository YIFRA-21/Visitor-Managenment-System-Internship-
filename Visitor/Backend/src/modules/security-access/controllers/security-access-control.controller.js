// src/controllers/security/SecurityAccessControlController.js
const SecurityAccessControlNotificationService = require('../services/security-access-control-notification.service');

async function getAccessLogs(req, res) {
  try {
    const data = await SecurityAccessControlNotificationService.getAccessLogs(req.securityScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  getAccessLogs
};
