// src/controllers/admin/ops/SchedulerController.js
const SchedulerService = require('../services/ops-scheduler.service');

async function listSchedules(req, res) {
  try {
    const data = await SchedulerService.listSchedules();
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function toggleScheduleStatus(req, res) {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const userId = req.user?.id || 'admin';
    const data = await SchedulerService.toggleScheduleStatus(id, action, userId);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function rescheduleJob(req, res) {
  try {
    const { id } = req.params;
    const { newCron } = req.body;
    const userId = req.user?.id || 'admin';
    const data = await SchedulerService.rescheduleJob(id, newCron, userId);
    res.json({ success: true, data, message: 'Job rescheduled successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { listSchedules, toggleScheduleStatus, rescheduleJob };
