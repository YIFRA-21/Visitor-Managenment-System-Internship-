// src/controllers/admin/SubscriptionController.js
async function updateSubscription(req, res) {
  try {
    const { userId } = req.params;
    res.json({ success: true, data: { userId, subscriptions: req.body }, message: 'Subscription settings updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}
async function getSubscription(req, res) {
  try {
    const { userId } = req.params;
    res.json({ success: true, data: { userId, subscriptions: ['visitor', 'appointment', 'emergency', 'security', 'reports'] } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}
module.exports = { updateSubscription, getSubscription };
