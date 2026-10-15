const roleController = require('./controllers/role.controller');
const roleService = require('./services/role.service');
const roleRepository = require('./repositories/role.repository');
const roleAssignmentRepository = require('./repositories/role-assignment.repository');
const roleRoutes = require('./routes/role.routes');

module.exports = {
  roleController,
  roleService,
  roleRepository,
  roleAssignmentRepository,
  roleRoutes,
};
