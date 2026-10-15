const checkinService = require('../services/checkin.service');

class CheckinController {
  async checkin(req, res, next) {
    try {
      const { passCode, facilityId, badgeNumber, notes } = req.body;
      if (!passCode) {
        return res.status(400).json({ error: 'Visit pass code is required for check-in.' });
      }
      const checkinData = { facilityId, badgeNumber, notes };
      const result = await checkinService.processCheckin(passCode, checkinData, req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'Visitor checked in successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async checkout(req, res, next) {
    try {
      const { passCode, checkoutMethod, remarks } = req.body;
      if (!passCode) {
        return res.status(400).json({ error: 'Visit pass code is required for check-out.' });
      }
      const checkoutData = { checkoutMethod, remarks };
      const result = await checkinService.processCheckout(passCode, checkoutData, req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'Visitor checked out successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CheckinController();
