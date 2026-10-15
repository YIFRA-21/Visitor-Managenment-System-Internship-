// src/controllers/admin/ops/NotificationSettingsController.js
const NotificationSettingsService = require('../services/ops-notification-settings.service');

async function getSettings(req, res) {
  try {
    const data = await NotificationSettingsService.getSettings();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateSettings(req, res) {
  try {
    const userId = req.user?.id || 'admin';
    const data = await NotificationSettingsService.updateSettings(req.body, userId);
    res.json({ success: true, data, message: 'Notification settings updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function testConnection(req, res) {
  try {
    const { type } = req.body;
    const data = await NotificationSettingsService.testConnection(type);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getSettings, updateSettings, testConnection };
