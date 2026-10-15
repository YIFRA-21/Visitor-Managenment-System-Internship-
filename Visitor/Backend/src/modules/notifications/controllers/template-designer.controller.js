// src/controllers/admin/TemplateDesignerController.js
async function createTemplate(req, res) {
  try {
    const template = { id: `tmpl_${Date.now()}`, ...req.body, version: 1, createdAt: new Date().toISOString() };
    res.status(201).json({ success: true, data: template, message: 'Template created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}
async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    res.json({ success: true, data: { id, ...req.body, updatedAt: new Date().toISOString() }, message: 'Template updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}
async function getTemplate(req, res) {
  try {
    const { id } = req.params;
    res.json({ success: true, data: { id, title: 'VIP Arrival Notice', body: 'Dear {{visitorName}}, welcome to {{companyName}}.', variables: ['visitorName', 'companyName'], version: 2 } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}
async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;
    res.json({ success: true, message: `Template ${id} deleted` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}
async function getHistory(req, res) {
  try {
    const { id } = req.params;
    res.json({ success: true, data: [{ version: 1, title: 'Old Notice', updatedAt: '2026-07-01' }, { version: 2, title: 'VIP Arrival Notice', updatedAt: '2026-08-01' }] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}
module.exports = { createTemplate, updateTemplate, getTemplate, deleteTemplate, getHistory };
