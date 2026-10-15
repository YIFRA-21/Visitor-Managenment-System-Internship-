// src/controllers/admin/SearchController.js
async function search(req, res) {
  try {
    const { keyword, status, channel, priority, startDate, endDate } = req.query;
    res.json({
      success: true,
      data: [
        { id: 'notif_901', title: 'Visitor Arrived', recipient: 'Employee #42', channel: 'in_app', priority: 'high', status: 'delivered', createdAt: '2026-08-06T09:00:00Z' },
        { id: 'notif_902', title: 'VIP Alert', recipient: 'Security Desk', channel: 'sms', priority: 'urgent', status: 'read', createdAt: '2026-08-06T09:15:00Z' }
      ],
      total: 2,
      filtersApplied: { keyword, status, channel, priority }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}
module.exports = { search };
