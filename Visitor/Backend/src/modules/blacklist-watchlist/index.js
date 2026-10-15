const watchlistController = require('./controllers/watchlist.controller');
const watchlistService = require('./services/watchlist.service');
const watchlistRepository = require('./repositories/watchlist.repository');
const watchlistRoutes = require('./routes/watchlist.routes');

module.exports = {
  watchlistController,
  watchlistService,
  watchlistRepository,
  watchlistRoutes,
};
