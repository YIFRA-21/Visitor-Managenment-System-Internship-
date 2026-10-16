const roomService = require('../services/room.service');

class RoomController {
  async list(req, res, next) {
    try {
      const rooms = await roomService.listRooms();
      res.status(200).json(rooms);
    } catch (err) {
      next(err);
    }
  }

  async getAvailability(req, res, next) {
    try {
      const date = req.query.date || new Date().toISOString().split('T')[0];
      const availability = await roomService.getRoomAvailability(req.params.id, date);
      res.status(200).json(availability);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const room = await roomService.createRoom(req.body || {});
      res.status(201).json(room);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RoomController();
