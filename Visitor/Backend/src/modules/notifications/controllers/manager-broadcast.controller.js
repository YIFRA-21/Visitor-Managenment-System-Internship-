// src/controllers/manager/ManagerBroadcastController.js
const ManagerBroadcastService = require('../services/manager-broadcast.service');

async function getBroadcasts(req, res) {
  try {
    const data = await ManagerBroadcastService.getBroadcasts(req.managerScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function sendBroadcast(req, res) {
  try {
    const data = await ManagerBroadcastService.sendBroadcast(req.body, req.managerScope);
    res.status(201).json({ success: true, data, message: 'Department broadcast dispatched' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  getBroadcasts,
  sendBroadcast
};
