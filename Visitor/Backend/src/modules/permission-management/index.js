const permissionController = require('./controllers/permission.controller');
const permissionRepository = require('./repositories/permission.repository');
const permissionRoutes = require('./routes/permission.routes');

module.exports = {
  permissionController,
  permissionRepository,
  permissionRoutes,
};
