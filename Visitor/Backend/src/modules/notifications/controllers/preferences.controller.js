// src/controllers/admin/PreferencesController.js
async function updatePreferences(req, res) {
  try {
    const { userId } = req.params;
    res.json({ success: true, data: { userId, preferences: req.body }, message: 'User preferences updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}
async function getPreferences(req, res) {
  try {
    const { userId } = req.params;
    res.json({ success: true, data: { userId, email: true, sms: true, inApp: true, quietHours: { start: '22:00', end: '07:00' }, language: 'en', digestFrequency: 'daily' } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}
module.exports = { updatePreferences, getPreferences };
