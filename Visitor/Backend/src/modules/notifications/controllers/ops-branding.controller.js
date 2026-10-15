// src/controllers/admin/ops/BrandingController.js
const BrandingService = require('../services/ops-branding.service');

async function getBranding(req, res) {
  try {
    const data = await BrandingService.getBranding();
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function updateBranding(req, res) {
  try {
    const userId = req.user?.id || 'admin';
    const data = await BrandingService.updateBranding(req.body, userId);
    res.json({ success: true, data, message: 'Branding updated successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function renderTemplatePreview(req, res) {
  try {
    const { templateHtml, variables } = req.body;
    const data = await BrandingService.renderTemplatePreview(templateHtml, variables);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = { getBranding, updateBranding, renderTemplatePreview };
