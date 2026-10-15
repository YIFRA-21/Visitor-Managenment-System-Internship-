const { Router } = require('express');
const { optionalAuth, authenticate, authorize } = require('../../../middleware/auth');
const controller = require('../controllers/feedback-support.controller');

const router = Router();

// ─── Feedback Endpoints ───────────────────────────────────────────────────────
// Submit feedback (accessible by all roles and optionally unauthenticated users)
router.post('/feedback', optionalAuth, (req, res, next) => controller.submitFeedback(req, res, next));

// List feedback with filters (accessible by authenticated users, with role-based filtering)
router.get('/feedback', optionalAuth, (req, res, next) => controller.listFeedbacks(req, res, next));

// Feedback aggregated metrics & KPIs
router.get('/feedback/stats', optionalAuth, (req, res, next) => controller.getFeedbackStats(req, res, next));

// Accept feedback (Admins / Managers)
router.post('/feedback/:id/accept', optionalAuth, (req, res, next) => controller.acceptFeedback(req, res, next));

// Update feedback status
router.patch('/feedback/:id/status', optionalAuth, (req, res, next) => controller.updateFeedbackStatus(req, res, next));

// ─── Support Ticket Endpoints ─────────────────────────────────────────────────
// Open support ticket (All roles)
router.post('/tickets', optionalAuth, (req, res, next) => controller.createTicket(req, res, next));

// List support tickets (All roles)
router.get('/tickets', optionalAuth, (req, res, next) => controller.listTickets(req, res, next));

// Ticket stats & KPIs
router.get('/tickets/stats', optionalAuth, (req, res, next) => controller.getTicketStats(req, res, next));

// Get ticket details and conversation thread
router.get('/tickets/:id', optionalAuth, (req, res, next) => controller.getTicket(req, res, next));

// Add reply message to ticket thread
router.post('/tickets/:id/messages', optionalAuth, (req, res, next) => controller.addTicketMessage(req, res, next));

// Update ticket status / assign technician / resolution notes
router.patch('/tickets/:id/status', optionalAuth, (req, res, next) => controller.updateTicketStatus(req, res, next));

module.exports = router;
