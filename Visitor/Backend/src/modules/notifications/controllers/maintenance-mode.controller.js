// src/controllers/admin/MaintenanceModeController.js
async function updateMaintenanceMode(req, res) {
  try {
    const { enabled, channels, bypassEmergency } = req.body;
    res.json({
      success: true,
      data: { enabled: !!enabled, channels: channels || [], bypassEmergency: bypassEmergency !== false },
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}
async function getMaintenanceStatus(req, res) {
  try {
    res.json({
      success: true,
      data: { enabled: false, channels: [], bypassEmergency: true }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}
module.exports = { updateMaintenanceMode, getMaintenanceStatus };
