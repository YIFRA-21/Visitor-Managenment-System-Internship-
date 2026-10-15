// src/controllers/manager/ManagerApprovalController.js
const ApprovalNotificationService = require('../services/approval-notification.service');

async function getPendingApprovals(req, res) {
  try {
    const data = await ApprovalNotificationService.getPendingApprovals(req.managerScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function getApprovalDetails(req, res) {
  try {
    const { id } = req.params;
    const data = await ApprovalNotificationService.getApprovalDetails(id, req.managerScope);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function approveRequest(req, res) {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const data = await ApprovalNotificationService.approveRequest(id, comments, req.managerScope);
    res.json({ success: true, data, message: 'Request approved successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function rejectRequest(req, res) {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const data = await ApprovalNotificationService.rejectRequest(id, comments, req.managerScope);
    res.json({ success: true, data, message: 'Request rejected' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function returnForRevision(req, res) {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const data = await ApprovalNotificationService.returnForRevision(id, comments, req.managerScope);
    res.json({ success: true, data, message: 'Request returned for revision' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

async function forwardApproval(req, res) {
  try {
    const { id } = req.params;
    const { targetManagerId, comments } = req.body;
    const data = await ApprovalNotificationService.forwardApproval(id, targetManagerId, comments, req.managerScope);
    res.json({ success: true, data, message: `Approval forwarded to manager ID ${targetManagerId}` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}

module.exports = {
  getPendingApprovals,
  getApprovalDetails,
  approveRequest,
  rejectRequest,
  returnForRevision,
  forwardApproval
};
