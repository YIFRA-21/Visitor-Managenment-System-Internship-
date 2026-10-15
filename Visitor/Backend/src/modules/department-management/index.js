const departmentController = require('./controllers/department.controller');
const departmentSearchController = require('./controllers/department-search.controller');
const departmentStatusController = require('./controllers/department-status.controller');
const departmentService = require('./services/department.service');
const departmentSearchService = require('./services/department-search.service');
const departmentStatusService = require('./services/department-status.service');
const departmentValidationService = require('./services/department-validation.service');
const departmentRepository = require('./repositories/department.repository');
const departmentRoutes = require('./routes/department.routes');

module.exports = {
  departmentController,
  departmentSearchController,
  departmentStatusController,
  departmentService,
  departmentSearchService,
  departmentStatusService,
  departmentValidationService,
  departmentRepository,
  departmentRoutes,
};
