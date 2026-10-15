// src/controllers/manager/ManagerPreferenceController.js
const ManagerPreferenceService = require('../services/manager-preference.service');

async function getPreferences(req, res) {
  try {
    const data = await ManagerPreferenceService.getPreferences(req.managerScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function updatePreferences(req, res) {
  try {
    const data = await ManagerPreferenceService.updatePreferences(req.body, req.managerScope);
    res.json({ success: true, data, message: 'Manager notification preferences updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  getPreferences,
  updatePreferences
};
