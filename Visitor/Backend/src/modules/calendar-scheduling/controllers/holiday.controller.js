const holidayService = require('../services/holiday.service');

class HolidayController {
  async list(req, res, next) {
    try {
      const list = await holidayService.getHolidays(req.query);
      res.status(200).json(list);
    } catch (err) {
      next(err);
    }
  }

  async get(req, res, next) {
    try {
      const holiday = await holidayService.getHolidayById(req.params.id);
      res.status(200).json(holiday);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const userRole = req.user?.role || 'admin';
      const result = await holidayService.saveHoliday(req.body, userRole);
      res.status(201).json({
        success: true,
        message: 'Holiday event registered successfully.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const userRole = req.user?.role || 'admin';
      const payload = { ...req.body, id: req.params.id };
      const result = await holidayService.saveHoliday(payload, userRole);
      res.status(200).json({
        success: true,
        message: 'Holiday event updated successfully.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const userRole = req.user?.role || 'admin';
      const result = await holidayService.deleteHoliday(req.params.id, userRole);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new HolidayController();
