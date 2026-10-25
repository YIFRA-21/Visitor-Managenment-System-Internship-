const roomRepository = require('../repositories/room.repository');
const buildingRepository = require('../repositories/building.repository');
const floorRepository = require('../repositories/floor.repository');
const db = require('../../../config/db');
const { AppError } = require('../../../middleware/errorHandler');

class RoomService {
  async listRooms(filters = {}) {
    return roomRepository.findAll(filters);
  }

  async getRoom(id) {
    const room = await roomRepository.findById(id);
    if (!room) {
      throw new AppError('Room not found', 404);
    }
    return room;
  }

  async createRoom(data, userId) {
    if (!data.room_name || !data.room_name.trim()) {
      throw new AppError('Room name is required', 400);
    }
    if (!data.room_number || !data.room_number.trim()) {
      throw new AppError('Room number/code is required', 400);
    }

    // Verify building and floor consistency if provided
    if (data.floor_id) {
      const floor = await floorRepository.findById(data.floor_id);
      if (!floor) {
        throw new AppError('Selected floor does not exist', 404);
      }
      if (data.building_id && Number(data.building_id) !== Number(floor.building_id)) {
        throw new AppError('Integrity constraint violation: The selected floor does not belong to the selected building', 400);
      }
      // Auto-set building_id from floor if not provided
      if (!data.building_id) {
        data.building_id = floor.building_id;
      }
    }

    if (data.building_id) {
      const building = await buildingRepository.findById(data.building_id);
      if (!building) {
        throw new AppError('Selected building does not exist', 404);
      }

      // Check duplicate room number within the same building
      const roomNum = data.room_number.trim();
      const existing = await roomRepository.findByRoomNumberAndBuilding(roomNum, data.building_id);
      if (existing) {
        throw new AppError(`Room number "${roomNum}" already exists in "${building.building_name}"`, 409);
      }
    }

    const roomType = data.room_type || 'MEETING_ROOM';
    // Normal offices are not bookable by external/general meetings by default
    const isBookable = data.is_bookable !== undefined 
      ? (data.is_bookable ? 1 : 0) 
      : (roomType === 'EMPLOYEE_OFFICE' ? 0 : 1);

    return roomRepository.create({
      ...data,
      room_name: data.room_name.trim(),
      room_number: data.room_number.trim(),
      room_type: roomType,
      capacity: data.capacity ? parseInt(data.capacity, 10) : 10,
      is_bookable: isBookable,
      created_by: userId
    });
  }

  async updateRoom(id, data, userId) {
    const current = await this.getRoom(id);

    if (data.floor_id) {
      const floor = await floorRepository.findById(data.floor_id);
      if (!floor) {
        throw new AppError('Selected floor does not exist', 404);
      }
      const bId = data.building_id || current.building_id;
      if (bId && Number(bId) !== Number(floor.building_id)) {
        throw new AppError('The selected floor does not belong to the specified building', 400);
      }
    }

    if (data.room_number) {
      const bId = data.building_id || current.building_id;
      if (bId) {
        const roomNum = data.room_number.trim();
        const duplicate = await roomRepository.findByRoomNumberAndBuilding(roomNum, bId, id);
        if (duplicate) {
          throw new AppError(`Room number "${roomNum}" already exists in this building`, 409);
        }
      }
      data.room_number = data.room_number.trim();
    }

    if (data.room_name) {
      data.room_name = data.room_name.trim();
    }

    return roomRepository.update(id, {
      ...data,
      updated_by: userId
    });
  }

  async changeStatus(id, status, userId) {
    const valid = ['ACTIVE', 'MAINTENANCE', 'INACTIVE'];
    if (!valid.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${valid.join(', ')}`, 400);
    }

    if (status !== 'ACTIVE') {
      // Check upcoming bookings
      const upcoming = await db.query(
        `SELECT COUNT(*) as count FROM room_bookings
         WHERE room_id = ? 
           AND booking_status = 'CONFIRMED'
           AND booking_end >= NOW()
           AND deleted_at IS NULL`,
        [id]
      );
      if (upcoming[0]?.count > 0) {
        throw new AppError(
          `Cannot change room status to ${status}. There are ${upcoming[0].count} upcoming confirmed room bookings.`,
          400
        );
      }
    }

    return roomRepository.update(id, {
      status,
      is_active: status === 'ACTIVE' ? 1 : 0,
      updated_by: userId
    });
  }

  async deleteRoom(id, userId) {
    const room = await this.getRoom(id);

    // Check active bookings or assigned appointments
    const activeBookings = await db.query(
      `SELECT COUNT(*) as count FROM room_bookings
       WHERE room_id = ? 
         AND booking_status = 'CONFIRMED'
         AND booking_end >= NOW()
         AND deleted_at IS NULL`,
      [id]
    );

    if (activeBookings[0]?.count > 0) {
      throw new AppError(
        `Cannot delete room "${room.room_name}". There are ${activeBookings[0].count} upcoming bookings associated with it.`,
        400
      );
    }

    return roomRepository.softDelete(id, userId);
  }

  async getRoomAvailability(roomId, date) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const room = await this.getRoom(roomId);

    // Retrieve confirmed bookings from room_bookings
    const bookings = await db.query(
      `SELECT 
         rb.id AS booking_id,
         rb.booking_start,
         rb.booking_end,
         rb.booking_status,
         a.id AS appointment_id,
         a.appointment_number,
         a.purpose,
         u.name AS host_name
       FROM room_bookings rb
       JOIN appointments a ON rb.appointment_id = a.id
       LEFT JOIN users u ON a.host_id = u.id
       WHERE rb.room_id = ? 
         AND DATE(rb.booking_start) = DATE(?)
         AND rb.booking_status = 'CONFIRMED'
         AND rb.deleted_at IS NULL
         AND a.deleted_at IS NULL
       ORDER BY rb.booking_start ASC`,
      [roomId, targetDate]
    );

    return {
      room,
      date: targetDate,
      bookings
    };
  }

  /**
   * Atomic reservation of a room with concurrent double-booking validation
   */
  async reserveRoom({ appointmentId, roomId, startTime, endTime, userId }) {
    if (!roomId) throw new AppError('Room ID is required for reservation', 400);
    if (!appointmentId) throw new AppError('Appointment ID is required for reservation', 400);
    if (!startTime || !endTime) throw new AppError('Reservation start and end time are required', 400);

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      throw new AppError('Invalid reservation time window: end time must be after start time', 400);
    }

    const room = await this.getRoom(roomId);
    if (room.status !== 'ACTIVE') {
      throw new AppError(`Room "${room.room_name}" is currently ${room.status} and cannot be booked`, 400);
    }
    if (!room.is_bookable) {
      throw new AppError(`Room "${room.room_name}" is designated as non-bookable (${room.room_type})`, 400);
    }

    // Atomic double-booking check
    const conflicts = await roomRepository.checkDoubleBooking(roomId, startTime, endTime);
    if (conflicts && conflicts.length > 0) {
      const conflict = conflicts[0];
      throw new AppError(
        `Reservation conflict: Room "${room.room_name}" is already booked by ${conflict.host_name || 'another host'} for Appointment #${conflict.appointment_number} (${new Date(conflict.booking_start).toLocaleTimeString()} - ${new Date(conflict.booking_end).toLocaleTimeString()})`,
        409
      );
    }

    // Insert or update room_booking
    const bookingRes = await db.query(
      `INSERT INTO room_bookings (
        appointment_id, room_id, booking_start, booking_end, booking_status, created_by
      ) VALUES (?, ?, ?, ?, 'CONFIRMED', ?)`,
      [appointmentId, roomId, startTime, endTime, userId]
    );

    const bookingId = bookingRes.insertId;
    await db.query(`UPDATE room_bookings SET booking_id = ? WHERE id = ?`, [bookingId, bookingId]);

    // Update appointments table with the confirmed room
    await db.query(
      `UPDATE appointments SET room_id = ?, meeting_room_id = ?, updated_by = ? WHERE id = ?`,
      [roomId, roomId, userId, appointmentId]
    );

    return {
      bookingId,
      appointmentId,
      roomId,
      roomName: room.room_name,
      roomNumber: room.room_number,
      buildingName: room.building_name,
      floorName: room.floor_name,
      bookingStart: startTime,
      bookingEnd: endTime,
      status: 'CONFIRMED'
    };
  }
}

module.exports = new RoomService();
