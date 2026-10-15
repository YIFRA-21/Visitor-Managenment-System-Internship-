const systemController = require('./controllers/system.controller');
const settingsController = require('./controllers/settings.controller');
const systemService = require('./services/system.service');
const settingsService = require('./services/settings.service');
const settingsRepository = require('./repositories/settings.repository');
const systemRoutes = require('./routes/system.routes');
const settingsRoutes = require('./routes/settings.routes');

module.exports = {
  systemController,
  settingsController,
  systemService,
  settingsService,
  settingsRepository,
  systemRoutes,
  settingsRoutes,
};
