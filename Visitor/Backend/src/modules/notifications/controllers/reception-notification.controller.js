// src/controllers/reception/ReceptionNotificationController.js
const ReceptionNotificationService = require('../services/reception-notification.service');

async function getNotifications(req, res) {
  try {
    const data = await ReceptionNotificationService.getNotifications(req.receptionScope, req.query);
    res.json({ success: true, ...data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const data = await ReceptionNotificationService.markAsRead(id, req.receptionScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function markAllAsRead(req, res) {
  try {
    const data = await ReceptionNotificationService.markAllAsRead(req.receptionScope);
    res.json({ success: true, ...data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function sendManualNotification(req, res) {
  try {
    const data = await ReceptionNotificationService.sendManualNotification(req.body, req.receptionScope);
    res.status(201).json({ success: true, data, message: 'Manual alert sent successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  sendManualNotification
};
