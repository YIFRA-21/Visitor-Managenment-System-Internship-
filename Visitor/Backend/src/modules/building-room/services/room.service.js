const roomRepository = require('../repositories/room.repository');
const db = require('../../../config/db');
const { AppError } = require('../../../middleware/errorHandler');

class RoomService {
  async listRooms() {
    return roomRepository.findAll();
  }

  async getRoomAvailability(roomId, date) {
    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw new AppError('Room not found', 404);
    }

    // Query appointments booked in this room for the specified date
    return db.query(
      `SELECT scheduled_start, scheduled_end FROM appointments
       WHERE room_id = ? AND DATE(scheduled_start) = DATE(?)
         AND appointment_status NOT IN ('REJECTED', 'CANCELLED')
         AND deleted_at IS NULL`,
      [roomId, date]
    );
  }

  async createRoom(roomData) {
    const { name, capacity } = roomData;
    if (!name || !capacity) {
      throw new AppError('Room name and capacity are required.', 400);
    }
    const roomId = await roomRepository.create(roomData);
    return roomRepository.findById(roomId);
  }
}

module.exports = new RoomService();
