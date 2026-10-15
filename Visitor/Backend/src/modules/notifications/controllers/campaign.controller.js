// src/controllers/admin/CampaignController.js
// Handles Campaign Management (Holiday announcements, emergency broadcasts, policy notices, etc.)

async function createCampaign(req, res) {
  try {
    const { name, type, audienceSegment, schedule, content } = req.body;
    const campaign = {
      id: `camp_${Date.now()}`,
      name,
      type: type || 'general',
      audienceSegment,
      schedule,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
    res.status(201).json({ success: true, data: campaign, message: 'Campaign created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateCampaign(req, res) {
  try {
    const { id } = req.params;
    res.json({ success: true, data: { id, ...req.body, updatedAt: new Date().toISOString() }, message: 'Campaign updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getCampaign(req, res) {
  try {
    const { id } = req.params;
    res.json({ success: true, data: { id, name: 'Q3 Security Awareness Campaign', status: 'active', deliveredCount: 1420, openRatePct: 88, text: 'Campaign details' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function deleteCampaign(req, res) {
  try {
    const { id } = req.params;
    res.json({ success: true, message: `Campaign ${id} deleted` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getAnalytics(req, res) {
  try {
    const { id } = req.params;
    res.json({
      success: true,
      data: {
        campaignId: id,
        totalAudience: 2500,
        delivered: 2420,
        opened: 2100,
        clicked: 1350,
        failed: 80,
        deliveryRatePct: 96.8,
        openRatePct: 86.7
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  createCampaign,
  updateCampaign,
  getCampaign,
  deleteCampaign,
  getAnalytics
};
