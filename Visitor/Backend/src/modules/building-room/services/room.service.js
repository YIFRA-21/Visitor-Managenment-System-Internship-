const roomRepository = require('../repositories/room.repository');
const db = require('../../../config/db');
const { AppError } = require('../../../middleware/errorHandler');

class RoomService {
  async listRooms() {
    return roomRepository.findAll();
  }

  async getRoomAvailability(roomId, date) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const room = await roomRepository.findById(roomId);
    if (!room) {
      return [];
    }

    // Query appointments booked in this room for the specified date
    return db.query(
      `SELECT scheduled_start, scheduled_end FROM appointments
       WHERE room_id = ? AND DATE(scheduled_start) = DATE(?)
         AND appointment_status NOT IN ('REJECTED', 'CANCELLED')
         AND deleted_at IS NULL`,
      [roomId, targetDate]
    );
  }

  async createRoom(roomData = {}) {
    const name = roomData.name || roomData.roomName || roomData.room_name || ('Conference Room ' + Math.floor(100 + Math.random() * 900));
    const capacity = roomData.capacity ? parseInt(roomData.capacity, 10) : 10;
    const location = roomData.location || roomData.building || 'Main HQ Building, Floor 2';
    const facilityId = roomData.facilityId || roomData.facility_id || null;

    const roomId = await roomRepository.create({ name, capacity, location, facilityId });
    return roomRepository.findById(roomId);
  }
}

module.exports = new RoomService();
