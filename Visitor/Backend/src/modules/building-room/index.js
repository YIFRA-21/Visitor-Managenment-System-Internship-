const roomController = require('./controllers/room.controller');
const roomService = require('./services/room.service');
const roomRepository = require('./repositories/room.repository');
const roomRoutes = require('./routes/room.routes');

module.exports = {
  roomController,
  roomService,
  roomRepository,
  roomRoutes,
};
