const employeeController = require('./controllers/employee.controller');
const employeePortalController = require('./controllers/employee-portal.controller');
const employeeService = require('./services/employee.service');
const employeeRepository = require('./repositories/employee.repository');
const employeeRoutes = require('./routes/employee.routes');
const employeePortalRoutes = require('./routes/employee-portal.routes');

module.exports = {
  employeeController,
  employeePortalController,
  employeeService,
  employeeRepository,
  employeeRoutes,
  employeePortalRoutes,
};
