// src/controllers/admin/ops/BackupController.js
const BackupService = require('../services/ops-backup.service');

async function createBackup(req, res) {
  try {
    const userId = req.user?.id || 'admin';
    const data = await BackupService.createBackup(userId);
    res.status(201).json({ success: true, data, message: 'Configuration backup created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function listBackups(req, res) {
  try {
    const data = await BackupService.listBackups();
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function restoreBackup(req, res) {
  try {
    const { backupId } = req.params;
    const userId = req.user?.id || 'admin';
    const data = await BackupService.restoreBackup(backupId, userId);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { createBackup, listBackups, restoreBackup };
