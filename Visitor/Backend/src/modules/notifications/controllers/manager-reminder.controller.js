// src/controllers/manager/ManagerReminderController.js
const ManagerReminderService = require('../services/manager-reminder.service');
const ManagerEscalationService = require('../services/manager-escalation.service');

async function getReminders(req, res) {
  try {
    const data = await ManagerReminderService.getReminders(req.managerScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function createReminder(req, res) {
  try {
    const data = await ManagerReminderService.createReminder(req.body, req.managerScope);
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getEscalations(req, res) {
  try {
    const data = await ManagerEscalationService.getEscalations(req.managerScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function resolveEscalation(req, res) {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;
    const data = await ManagerEscalationService.resolveEscalation(id, resolutionNotes, req.managerScope);
    res.json({ success: true, data, message: 'Escalation resolved' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  getReminders,
  createReminder,
  getEscalations,
  resolveEscalation
};
