// src/controllers/admin/ops/WorkerController.js
const WorkerService = require('../services/ops-worker.service');

async function getWorkers(req, res) {
  try {
    const data = await WorkerService.getWorkers();
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function restartWorker(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'admin';
    const data = await WorkerService.restartWorker(id, userId);
    res.json({ success: true, data, message: `Restart signal sent to worker ${id}` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { getWorkers, restartWorker };
