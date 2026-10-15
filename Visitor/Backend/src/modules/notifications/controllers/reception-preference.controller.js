// src/controllers/reception/ReceptionPreferenceController.js
const ReceptionPreferenceService = require('../services/reception-preference.service');

async function getPreferences(req, res) {
  try {
    const data = await ReceptionPreferenceService.getPreferences(req.receptionScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function updatePreferences(req, res) {
  try {
    const data = await ReceptionPreferenceService.updatePreferences(req.body, req.receptionScope);
    res.json({ success: true, data, message: 'Reception staff notification preferences updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  getPreferences,
  updatePreferences
};
