const calendarService = require('../services/calendar.service');
const calendarRepository = require('../repositories/calendar.repository');

class CalendarController {
  async getPreview(req, res, next) {
    try {
      const organizationId = req.query?.organizationId || req.query?.org_id || 1;
      const branchId = req.query?.branchId || null;
      const year = req.query?.year;
      const month = req.query?.month;

      const data = await calendarService.getCombinedCalendar(
        organizationId,
        branchId || null,
        year ? Number(year) : new Date().getFullYear(),
        month ? Number(month) : new Date().getMonth() + 1
      );
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  async getSpecialDays(req, res, next) {
    try {
      const organizationId = req.query?.organizationId || req.query?.org_id || 1;
      const days = await calendarRepository.getSpecialWorkingDays(organizationId);
      res.status(200).json(days);
    } catch (err) {
      next(err);
    }
  }

  async createSpecialDay(req, res, next) {
    try {
      // Permission check is delegated or inline: System admin or Org admin
      const userRole = req.user?.role || 'admin';
      if (userRole === 'visitor' || userRole === 'receptionist') {
        return res.status(403).json({ error: 'Access Denied: Insufficient permissions.' });
      }
      const newDay = await calendarRepository.saveSpecialWorkingDay(req.body);
      res.status(201).json({
        success: true,
        message: 'Special working day registered.',
        data: newDay
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteSpecialDay(req, res, next) {
    try {
      const userRole = req.user?.role || 'admin';
      if (userRole === 'visitor' || userRole === 'receptionist') {
        return res.status(403).json({ error: 'Access Denied: Insufficient permissions.' });
      }
      await calendarRepository.deleteSpecialWorkingDay(req.params.id);
      res.status(200).json({ success: true, message: 'Special working day removed.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CalendarController();
