const { Router } = require('express');
const { authenticate } = require('../../../middleware/auth');
const employeePortalController = require('../controllers/employee-portal.controller');

const router = Router();

router.use(authenticate);

// Dashboard
router.get('/dashboard', employeePortalController.getDashboard);

// Visitor Requests & Approvals
router.get('/requests', employeePortalController.getVisitorRequests);
router.post('/requests/:id/action', employeePortalController.handleRequestAction);
router.get('/requests/:id/documents', employeePortalController.getVisitorDocuments);

// My Appointments — cross-role live join with visitor data
router.get('/my-appointments', employeePortalController.getMyAppointments);

// My Visitors — all guests who visited this host
router.get('/my-visitors', employeePortalController.getMyVisitors);
router.get('/my-visitors/:id', employeePortalController.getVisitorDetail);
router.get('/my-visitors/:id/documents', employeePortalController.getVisitorDocuments);
router.get('/visitors/:id/documents', employeePortalController.getVisitorDocuments);

// Meeting Management & Room Bookings
router.get('/rooms', employeePortalController.getRoomBookings);
router.post('/rooms/reserve', employeePortalController.reserveRoom);

// Support
router.get('/support/tickets', employeePortalController.getSupportTickets);
router.post('/support/tickets', employeePortalController.createSupportTicket);

module.exports = router;
