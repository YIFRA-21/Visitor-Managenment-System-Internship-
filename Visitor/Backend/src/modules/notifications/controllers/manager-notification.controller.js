// src/controllers/manager/ManagerNotificationController.js
const ManagerNotificationService = require('../services/manager-notification.service');

async function getNotifications(req, res) {
  try {
    const data = await ManagerNotificationService.getNotifications(req.managerScope, req.query);
    res.json({ success: true, ...data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const data = await ManagerNotificationService.markAsRead(id, req.managerScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function markAllAsRead(req, res) {
  try {
    const data = await ManagerNotificationService.markAllAsRead(req.managerScope);
    res.json({ success: true, ...data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function togglePin(req, res) {
  try {
    const { id } = req.params;
    const data = await ManagerNotificationService.togglePin(id, req.managerScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function archiveNotification(req, res) {
  try {
    const { id } = req.params;
    const data = await ManagerNotificationService.archiveNotification(id, req.managerScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  togglePin,
  archiveNotification
};
