// Backend/src/routes/manager.js
const { Router } = require('express');
const { authenticate } = require('../../../middleware/auth');
const managerScope = require('../../../middleware/managerScope');
const departmentManagerController = require('../../department-management/controllers/department-manager.controller');

const router = Router();

// Health/Ping check
router.get('/ping', (req, res) => res.json({ message: 'Manager route active', status: 'OK' }));

// All manager endpoints require authentication and manager scope resolution
router.use(authenticate);
router.use(managerScope);

/**
 * 1. Overview & Live KPIs
 */
router.get('/overview', (req, res, next) => departmentManagerController.getOverview(req, res, next));

/**
 * 2. Department Employees & Host Status Toggle
 */
router.get('/employees', (req, res, next) => departmentManagerController.getEmployees(req, res, next));
router.patch('/employees/:employeeId/host-status', (req, res, next) => departmentManagerController.updateHostStatus(req, res, next));

/**
 * 3. Host Availability & Schedules
 */
router.get('/host-availability', (req, res, next) => departmentManagerController.getHostAvailability(req, res, next));

/**
 * 4. Visitor Requests & Workflows
 */
router.get('/visitor-requests', (req, res, next) => departmentManagerController.getVisitorRequests(req, res, next));
router.get('/visitor-requests/:id', (req, res, next) => departmentManagerController.getRequestDetails(req, res, next));
router.get('/alternative-hosts', (req, res, next) => departmentManagerController.getAlternativeHosts(req, res, next));
router.post('/visitor-requests/:id/reassign', (req, res, next) => departmentManagerController.reassignHost(req, res, next));
router.post('/visitor-requests/:id/assign-host', (req, res, next) => departmentManagerController.assignHostAndRoute(req, res, next));
router.post('/visitor-requests/:id/approve', (req, res, next) => departmentManagerController.approveRequest(req, res, next));
router.post('/visitor-requests/:id/reject', (req, res, next) => departmentManagerController.rejectRequest(req, res, next));

/**
 * 5. Department Appointments & Calendar
 */
router.get('/appointments', (req, res, next) => departmentManagerController.getAppointments(req, res, next));
router.get('/appointments/:id', (req, res, next) => departmentManagerController.getAppointmentDetails(req, res, next));

/**
 * 6. Department Visitors
 */
router.get('/visitors', (req, res, next) => departmentManagerController.getDepartmentVisitors(req, res, next));

/**
 * 7. Reports & Analytics
 */
router.get('/reports', (req, res, next) => departmentManagerController.getReports(req, res, next));
router.get('/export', (req, res, next) => departmentManagerController.exportData(req, res, next));

/**
 * 8. Department Audit Logs
 */
router.get('/audit-logs', (req, res, next) => departmentManagerController.getAuditLogs(req, res, next));

/**
 * 9. Manager Profile & Settings
 */
router.get('/profile', (req, res, next) => departmentManagerController.getProfile(req, res, next));
router.put('/profile', (req, res, next) => departmentManagerController.updateProfile(req, res, next));

/**
 * 10. Department Meeting Rooms & Spaces
 */
router.get('/rooms', (req, res, next) => departmentManagerController.getRooms(req, res, next));
router.post('/rooms/book', (req, res, next) => departmentManagerController.bookRoom(req, res, next));

/**
 * 11. Department Hosting Policies & Rules
 */
router.get('/policies', (req, res, next) => departmentManagerController.getPolicies(req, res, next));
router.put('/policies', (req, res, next) => departmentManagerController.updatePolicies(req, res, next));

/**
 * 12. Emergency Evacuation Roll Call
 */
router.get('/evacuation', (req, res, next) => departmentManagerController.getEvacuationRoster(req, res, next));

/**
 * 13. Security & Restricted Zones
 */
router.get('/security-zones', (req, res, next) => departmentManagerController.getSecurityZones(req, res, next));

module.exports = router;
