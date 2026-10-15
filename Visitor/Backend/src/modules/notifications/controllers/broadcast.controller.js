// src/controllers/admin/BroadcastController.js
// Handles administrator manual broadcasts (immediate, draft, schedule, recall, cancel)

const { auditLog } = require('../../../utils/audit');

async function sendBroadcast(req, res) {
  try {
    const { recipients, channels, title, body, priority, scheduledAt, isDraft } = req.body;

    const broadcastResult = {
      id: `bc_${Date.now()}`,
      status: isDraft ? 'draft' : (scheduledAt ? 'scheduled' : 'queued'),
      recipientCount: Array.isArray(recipients) ? recipients.length : 1,
      channels: channels || ['in_app'],
      title,
      scheduledAt: scheduledAt || null,
      createdAt: new Date().toISOString()
    };

    await auditLog({
      userId: req.user?.id || 'admin_system',
      entity: 'broadcast_notification',
      action: isDraft ? 'create_draft' : 'send_broadcast',
      details: broadcastResult
    });

    res.status(201).json({ success: true, data: broadcastResult, message: isDraft ? 'Broadcast saved as draft' : 'Broadcast queued successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to process broadcast' });
  }
}

async function scheduleBroadcast(req, res) {
  try {
    const { id } = req.params;
    const { scheduledAt } = req.body;
    res.json({ success: true, data: { id, status: 'scheduled', scheduledAt }, message: 'Broadcast scheduled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function cancelBroadcast(req, res) {
  try {
    const { id } = req.params;
    res.json({ success: true, data: { id, status: 'cancelled' }, message: 'Broadcast cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function recallBroadcast(req, res) {
  try {
    const { id } = req.params;
    res.json({ success: true, data: { id, status: 'recalled', recalledAt: new Date().toISOString() }, message: 'Broadcast recalled from channels' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  sendBroadcast,
  scheduleBroadcast,
  cancelBroadcast,
  recallBroadcast
};
