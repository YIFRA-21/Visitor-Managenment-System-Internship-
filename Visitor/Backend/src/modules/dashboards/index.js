const dashboardController = require('./controllers/dashboard.controller');
const dashboardService = require('./services/dashboard.service');
const dashboardRepository = require('./repositories/dashboard.repository');
const dashboardRoutes = require('./routes/dashboard.routes');

module.exports = {
  dashboardController,
  dashboardService,
  dashboardRepository,
  dashboardRoutes,
};
