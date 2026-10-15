const userController = require('./controllers/user.controller');
const userService = require('./services/user.service');
const userRepository = require('./repositories/user.repository');
const userRoutes = require('./routes/user.routes');

module.exports = {
  userController,
  userService,
  userRepository,
  userRoutes,
};
