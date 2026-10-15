const visitorController = require('./controllers/visitor.controller');
const visitorProfileController = require('./controllers/visitor-profile.controller');
const visitorRegistrationController = require('./controllers/visitor-registration.controller');
const visitorDashboardController = require('./controllers/visitor-dashboard.controller');
const visitorPortalController = require('./controllers/visitor-portal.controller');
const visitorCategoryController = require('./controllers/visitor-category.controller');
const visitorService = require('./services/visitor.service');
const visitorProfileService = require('./services/visitor-profile.service');
const visitorRegistrationService = require('./services/visitor-registration.service');
const visitorDashboardService = require('./services/visitor-dashboard.service');
const visitorCategoryService = require('./services/visitor-category.service');
const visitorRepository = require('./repositories/visitor.repository');
const visitorProfileRepository = require('./repositories/visitor-profile.repository');
const visitorRegistrationRepository = require('./repositories/visitor-registration.repository');
const visitorDashboardRepository = require('./repositories/visitor-dashboard.repository');
const visitorCategoryRepository = require('./repositories/visitor-category.repository');
const visitorPortalRoutes = require('./routes/visitor-portal.routes');
const visitorProfilesRoutes = require('./routes/visitor-profiles.routes');
const visitorRegistrationRoutes = require('./routes/visitor-registration.routes');
const visitorDashboardRoutes = require('./routes/visitor-dashboard.routes');
const visitorCategoriesRoutes = require('./routes/visitor-categories.routes');

module.exports = {
  visitorController,
  visitorProfileController,
  visitorRegistrationController,
  visitorDashboardController,
  visitorPortalController,
  visitorCategoryController,
  visitorService,
  visitorProfileService,
  visitorRegistrationService,
  visitorDashboardService,
  visitorCategoryService,
  visitorRepository,
  visitorProfileRepository,
  visitorRegistrationRepository,
  visitorDashboardRepository,
  visitorCategoryRepository,
  visitorPortalRoutes,
  visitorProfilesRoutes,
  visitorRegistrationRoutes,
  visitorDashboardRoutes,
  visitorCategoriesRoutes,
};
