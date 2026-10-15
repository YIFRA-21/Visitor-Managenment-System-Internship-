const securityController = require('./controllers/security.controller');
const securityService = require('./services/security.service');
const securityRepository = require('./repositories/security.repository');
const securityAccessLogRepository = require('./repositories/security-access-log.repository');
const securityIncidentRepository = require('./repositories/security-incident.repository');
const securityInvestigationRepository = require('./repositories/security-investigation.repository');
const securityRoutes = require('./routes/security.routes');

module.exports = {
  securityController,
  securityService,
  securityRepository,
  securityAccessLogRepository,
  securityIncidentRepository,
  securityInvestigationRepository,
  securityRoutes,
};
