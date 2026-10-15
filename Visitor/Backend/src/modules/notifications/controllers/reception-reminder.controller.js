// src/controllers/reception/ReceptionReminderController.js
const ReceptionReminderService = require('../services/reception-reminder.service');

async function getReminders(req, res) {
  try {
    const data = await ReceptionReminderService.getReminders(req.receptionScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function triggerReminder(req, res) {
  try {
    const { id } = req.params;
    const data = await ReceptionReminderService.triggerReminder(id, req.receptionScope);
    res.json({ success: true, data, message: 'Reminder triggered' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  getReminders,
  triggerReminder
};
