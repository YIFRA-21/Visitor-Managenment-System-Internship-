const { Router } = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');

const calendarController = require('../controllers/calendar.controller');
const workingScheduleController = require('../controllers/working-schedule.controller');
const holidayController = require('../controllers/holiday.controller');
const timeZoneController = require('../../system-admin/controllers/timezone.controller');
const validationController = require('../../system-admin/controllers/validation.controller');
const statisticsController = require('../../reporting-analytics/controllers/statistics.controller');

const router = Router();

// Allowed roles helper
const canRead = authorize('admin', 'manager', 'receptionist');
const canWrite = authorize('admin', 'manager');

// ── Calendar Dashboard & Stats ──
router.get('/dashboard', authenticate, canRead, (req, res, next) => {
  // Merged overview return
  statisticsController.getStats(req, res, next);
});
router.get('/statistics', authenticate, canRead, statisticsController.getStats);
router.get('/validation', authenticate, canRead, validationController.runAudit);
router.get('/preview', authenticate, canRead, calendarController.getPreview);

// ── Working Schedules ──
router.get('/schedules/org', authenticate, canRead, workingScheduleController.getOrgSchedule);
router.post('/schedules/org', authenticate, canWrite, workingScheduleController.saveOrgSchedule);

router.get('/schedules/branch', authenticate, canRead, workingScheduleController.getBranchSchedule);
router.post('/schedules/branch', authenticate, canWrite, workingScheduleController.saveBranchSchedule);
router.post('/schedules/branch/reset', authenticate, canWrite, workingScheduleController.resetBranchSchedule);

// Legacy search compatibility
router.get('/schedules', authenticate, canRead, workingScheduleController.getOrgSchedule);
router.post('/schedules', authenticate, canWrite, workingScheduleController.saveOrgSchedule);

// ── Holidays CRUD ──
router.get('/holidays', authenticate, canRead, holidayController.list);
router.post('/holidays', authenticate, canWrite, holidayController.create);
router.get('/holidays/:id', authenticate, canRead, holidayController.get);
router.put('/holidays/:id', authenticate, canWrite, holidayController.update);
router.delete('/holidays/:id', authenticate, canWrite, holidayController.delete);

// ── Special Working Days ──
router.get('/special-days', authenticate, canRead, calendarController.getSpecialDays);
router.post('/special-days', authenticate, canWrite, calendarController.createSpecialDay);
router.delete('/special-days/:id', authenticate, canWrite, calendarController.deleteSpecialDay);

// ── Time Zones ──
router.get('/timezones', authenticate, canRead, timeZoneController.get);
router.put('/timezones', authenticate, canWrite, timeZoneController.save);

module.exports = router;
