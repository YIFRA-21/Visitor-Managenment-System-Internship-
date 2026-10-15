const authController = require('./controllers/auth.controller');
const authService = require('./services/auth.service');
const authRoutes = require('./routes/auth.routes');

module.exports = {
  authController,
  authService,
  authRoutes,
};
