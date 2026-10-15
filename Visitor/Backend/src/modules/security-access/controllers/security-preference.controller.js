// src/controllers/security/SecurityPreferenceController.js
const SecurityPreferenceService = require('../services/security-preference.service');

async function getPreferences(req, res) {
  try {
    const data = await SecurityPreferenceService.getPreferences(req.securityScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function updatePreferences(req, res) {
  try {
    const data = await SecurityPreferenceService.updatePreferences(req.body, req.securityScope);
    res.json({ success: true, data, message: 'Security officer notification preferences updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  getPreferences,
  updatePreferences
};
