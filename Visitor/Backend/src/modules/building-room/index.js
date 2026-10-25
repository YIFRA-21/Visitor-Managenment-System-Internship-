const buildingController = require('./controllers/building.controller');
const floorController = require('./controllers/floor.controller');
const roomController = require('./controllers/room.controller');
const workplaceController = require('./controllers/workplace.controller');

const buildingService = require('./services/building.service');
const floorService = require('./services/floor.service');
const roomService = require('./services/room.service');
const workplaceService = require('./services/workplace.service');

const buildingRepository = require('./repositories/building.repository');
const floorRepository = require('./repositories/floor.repository');
const roomRepository = require('./repositories/room.repository');

const buildingRoutes = require('./routes/building.routes');
const floorRoutes = require('./routes/floor.routes');
const roomRoutes = require('./routes/room.routes');
const workplaceRoutes = require('./routes/workplace.routes');

module.exports = {
  buildingController,
  floorController,
  roomController,
  workplaceController,
  buildingService,
  floorService,
  roomService,
  workplaceService,
  buildingRepository,
  floorRepository,
  roomRepository,
  buildingRoutes,
  floorRoutes,
  roomRoutes,
  workplaceRoutes
};
