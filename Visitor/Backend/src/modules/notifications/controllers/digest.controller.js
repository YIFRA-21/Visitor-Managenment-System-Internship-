// src/controllers/admin/DigestController.js
async function scheduleDigest(req, res) {
  try {
    const { userId } = req.params;
    res.json({ success: true, data: { userId, frequency: req.body.frequency || 'daily', time: req.body.time || '17:00' }, message: 'Digest schedule set' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}
async function getDigestSchedule(req, res) {
  try {
    const { userId } = req.params;
    res.json({ success: true, data: { userId, frequency: 'daily', nextRun: '2026-08-06T17:00:00Z' } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}
module.exports = { scheduleDigest, getDigestSchedule };
