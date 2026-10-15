const calendarController = require('./controllers/calendar.controller');
const calendarService = require('./services/calendar.service');
const calendarRepository = require('./repositories/calendar.repository');
const calendarRoutes = require('./routes/calendar.routes');

module.exports = {
  calendarController,
  calendarService,
  calendarRepository,
  calendarRoutes,
};
