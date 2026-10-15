const visitorHistoryController = require('./controllers/visitor-history.controller');
const visitorHistoryService = require('./services/visitor-history.service');
const visitorHistoryRepository = require('./repositories/visitor-history.repository');
const visitorHistoryRoutes = require('./routes/visitor-history.routes');

module.exports = {
  visitorHistoryController,
  visitorHistoryService,
  visitorHistoryRepository,
  visitorHistoryRoutes,
};
