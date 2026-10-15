const { Router } = require('express');
const ReceptionController = require('../controllers/reception.controller');

const router = Router();

// 1. Dashboard
router.get('/dashboard', (req, res) => ReceptionController.getDashboard(req, res));

// 2. Visitor Arrival Management
router.get('/arrivals', (req, res) => ReceptionController.getArrivals(req, res));
router.post('/arrivals/:id/confirm', (req, res) => ReceptionController.confirmArrival(req, res));
router.post('/arrivals/:id/cancel', (req, res) => ReceptionController.cancelArrival(req, res));

// 3. Appointment Verification & Biometric Face Match
router.post('/verify-appointment', (req, res) => ReceptionController.verifyAppointment(req, res));
router.post('/face-match', (req, res) => ReceptionController.matchFace(req, res));

// 4. Walk-in Visitor Management
router.post('/walk-ins', (req, res) => ReceptionController.registerWalkIn(req, res));

// 5. Visitor Queue Management
router.get('/queue', (req, res) => ReceptionController.getQueue(req, res));
router.put('/queue/:id', (req, res) => ReceptionController.updateQueueStatus(req, res));

// 6. Visitor Pass Issuance
router.post('/passes/generate', (req, res) => ReceptionController.generatePass(req, res));

// 7. Host Notification
router.post('/notifications/send', (req, res) => ReceptionController.sendHostNotification(req, res));

// 8. Waiting Area Management
router.get('/waiting-area', (req, res) => ReceptionController.getWaitingArea(req, res));

// 9. Reception Search & Directory
router.get('/search', (req, res) => ReceptionController.searchDirectory(req, res));

// 10. Reports
router.get('/reports', (req, res) => ReceptionController.getReports(req, res));

// 11. Activity Log
router.get('/activity-logs', (req, res) => ReceptionController.getActivityLogs(req, res));

// 12. Profile & Settings
router.get('/profile', (req, res) => ReceptionController.getProfile(req, res));
router.put('/profile', (req, res) => ReceptionController.updateProfile(req, res));

module.exports = router;
