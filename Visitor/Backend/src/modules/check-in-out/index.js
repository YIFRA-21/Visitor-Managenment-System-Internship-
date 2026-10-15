const checkinController = require('./controllers/checkin.controller');
const checkoutController = require('./controllers/checkout.controller');
const checkinService = require('./services/checkin.service');
const checkoutService = require('./services/checkout.service');
const checkinRepository = require('./repositories/checkin.repository');
const checkoutRepository = require('./repositories/checkout.repository');
const checkinRoutes = require('./routes/checkin.routes');
const checkoutRoutes = require('./routes/checkout.routes');

module.exports = {
  checkinController,
  checkoutController,
  checkinService,
  checkoutService,
  checkinRepository,
  checkoutRepository,
  checkinRoutes,
  checkoutRoutes,
};
