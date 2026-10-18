const { Router } = require('express');
const { authenticate } = require('../../../middleware/auth');
const ReceptionController = require('../controllers/reception.controller');

const router = Router();

// 1. Dashboard
router.get('/dashboard', (req, res) => ReceptionController.getDashboard(req, res));

// 2. Visitor Arrival Management
router.get('/arrivals', (req, res) => ReceptionController.getArrivals(req, res));
router.post('/arrivals/:id/confirm', (req, res) => ReceptionController.confirmArrival(req, res));
router.post('/arrivals/:id/cancel', (req, res) => ReceptionController.cancelArrival(req, res));
router.delete('/arrivals/:id', (req, res) => ReceptionController.deleteArrival(req, res));

// 3. Appointment Verification & Biometric Face Match
router.post('/verify-appointment', (req, res) => ReceptionController.verifyAppointment(req, res));
router.post('/face-match', (req, res) => ReceptionController.matchFace(req, res));

// 4. Walk-in Visitor Management & History
router.post('/walk-ins', (req, res) => ReceptionController.registerWalkIn(req, res));
router.get('/walk-ins', (req, res) => ReceptionController.getWalkIns(req, res));
router.get('/walk-ins/:id', (req, res) => ReceptionController.getWalkInById(req, res));
router.put('/walk-ins/:id', (req, res) => ReceptionController.updateWalkIn(req, res));
router.delete('/walk-ins/:id', (req, res) => ReceptionController.deleteWalkIn(req, res));
router.post('/walk-ins/:id/send-temp-password', (req, res) => ReceptionController.sendTempPassword(req, res));
router.post('/walk-ins/:id/send-user-id', (req, res) => ReceptionController.sendUserId(req, res));

// 5. Visitor Queue Management
router.get('/queue', (req, res) => ReceptionController.getQueue(req, res));
router.put('/queue/:id', (req, res) => ReceptionController.updateQueueStatus(req, res));
router.delete('/queue/:id', (req, res) => ReceptionController.deleteQueue(req, res));

// 6. Visitor Pass Issuance, Verification & Real Arrivals Lookup
router.get('/visitors/lookup', (req, res) => ReceptionController.lookupVisitor(req, res));
router.get('/visitors/quick-list', (req, res) => ReceptionController.getQuickVisitors(req, res));
router.get('/passes/verify', (req, res) => ReceptionController.verifyPass(req, res));
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
router.get('/profile', authenticate, (req, res) => ReceptionController.getProfile(req, res));
router.put('/profile', authenticate, (req, res) => ReceptionController.updateProfile(req, res));

module.exports = router;
