const appointmentController = require('./controllers/appointment.controller');
const appointmentService = require('./services/appointment.service');
const appointmentRepository = require('./repositories/appointment.repository');
const appointmentRoutes = require('./routes/appointment.routes');

module.exports = {
  appointmentController,
  appointmentService,
  appointmentRepository,
  appointmentRoutes,
};
