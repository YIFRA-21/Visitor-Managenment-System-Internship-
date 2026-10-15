// src/controllers/reception/ReceptionQueueNotificationController.js
const ReceptionQueueNotificationService = require('../services/reception-queue-notification.service');

async function getQueueStatus(req, res) {
  try {
    const data = await ReceptionQueueNotificationService.getQueueStatus(req.receptionScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function reassignQueue(req, res) {
  try {
    const { ticketNo, targetDeskId } = req.body;
    const data = await ReceptionQueueNotificationService.reassignQueue(ticketNo, targetDeskId, req.receptionScope);
    res.json({ success: true, data, message: `Ticket ${ticketNo} reassigned` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  getQueueStatus,
  reassignQueue
};
