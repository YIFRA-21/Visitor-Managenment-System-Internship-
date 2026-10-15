// src/controllers/security/SecurityInvestigationController.js
const SecurityInvestigationService = require('../services/security-investigation.service');

async function getCases(req, res) {
  try {
    const data = await SecurityInvestigationService.getCases(req.securityScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function createCase(req, res) {
  try {
    const data = await SecurityInvestigationService.createCase(req.body, req.securityScope);
    res.status(201).json({ success: true, data, message: 'Investigation case opened' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  getCases,
  createCase
};
