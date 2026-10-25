const roomService = require('../services/room.service');

class RoomController {
  async list(req, res, next) {
    try {
      const {
        organization_id,
        branch_id,
        building_id,
        floor_id,
        department_id,
        room_type,
        status,
        is_bookable,
        is_restricted,
        min_capacity,
        search,
        page = 1,
        limit = 30
      } = req.query;

      const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

      const result = await roomService.listRooms({
        organizationId: organization_id,
        branchId: branch_id,
        buildingId: building_id,
        floorId: floor_id,
        departmentId: department_id,
        roomType: room_type,
        status,
        isBookable: is_bookable !== undefined ? (is_bookable === 'true' || is_bookable === '1' || is_bookable === true) : undefined,
        isRestricted: is_restricted !== undefined ? (is_restricted === 'true' || is_restricted === '1' || is_restricted === true) : undefined,
        minCapacity: min_capacity,
        search,
        limit: parseInt(limit, 10),
        offset
      });

      res.status(200).json({
        success: true,
        data: result.records,
        pagination: {
          total: result.total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(result.total / parseInt(limit, 10))
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async get(req, res, next) {
    try {
      const room = await roomService.getRoom(req.params.id);
      res.status(200).json({ success: true, data: room });
    } catch (err) {
      next(err);
    }
  }

  async getAvailability(req, res, next) {
    try {
      const date = req.query.date || new Date().toISOString().split('T')[0];
      const availability = await roomService.getRoomAvailability(req.params.id, date);
      res.status(200).json({ success: true, data: availability });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const userId = req.user?.id || req.user?.userId || null;
      const room = await roomService.createRoom(req.body || {}, userId);
      res.status(201).json({ success: true, message: 'Room created successfully', data: room });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const userId = req.user?.id || req.user?.userId || null;
      const room = await roomService.updateRoom(req.params.id, req.body || {}, userId);
      res.status(200).json({ success: true, message: 'Room updated successfully', data: room });
    } catch (err) {
      next(err);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const userId = req.user?.id || req.user?.userId || null;
      const { status } = req.body;
      const room = await roomService.changeStatus(req.params.id, status, userId);
      res.status(200).json({ success: true, message: `Room status updated to ${status}`, data: room });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const userId = req.user?.id || req.user?.userId || null;
      await roomService.deleteRoom(req.params.id, userId);
      res.status(200).json({ success: true, message: 'Room deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async reserve(req, res, next) {
    try {
      const userId = req.user?.id || req.user?.userId || null;
      const { appointment_id, start_time, end_time } = req.body;
      const reservation = await roomService.reserveRoom({
        appointmentId: appointment_id,
        roomId: req.params.id,
        startTime: start_time,
        endTime: end_time,
        userId
      });
      res.status(200).json({
        success: true,
        message: 'Room reserved successfully with double-booking prevention',
        data: reservation
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RoomController();
