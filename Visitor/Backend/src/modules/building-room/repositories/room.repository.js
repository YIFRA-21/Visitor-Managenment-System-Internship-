const db = require('../../../config/db');

class RoomRepository {
  async findAll() {
    const useMock = db.getUseMock();
    const tableName = useMock ? 'rooms' : 'meeting_rooms';
    
    // In SQL mode, we select the fields. The database table contains both legacy name/location columns.
    return db.query(`SELECT * FROM ${tableName} WHERE is_active = TRUE ORDER BY name`);
  }

  async findById(id) {
    const useMock = db.getUseMock();
    const tableName = useMock ? 'rooms' : 'meeting_rooms';
    
    const rows = await db.query(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  async create(roomData) {
    const { name, capacity = 10, location, facilityId = null } = roomData;
    const roomNumber = roomData.roomNumber || roomData.room_number || ('RM-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900));
    const useMock = db.getUseMock();

    if (useMock) {
      const result = await db.query(
        `INSERT INTO rooms (name, capacity, location) VALUES (?, ?, ?)`,
        [name, capacity, location]
      );
      return result.insertId;
    }

    // Check if room with this name already exists for idempotent create
    const existing = await db.query(
      `SELECT id FROM meeting_rooms WHERE (name = ? OR room_name = ?) AND deleted_at IS NULL LIMIT 1`,
      [name, name]
    );
    if (existing[0]) {
      return existing[0].id;
    }

    const result = await db.query(
      `INSERT INTO meeting_rooms (
        facility_id, room_number, room_name, name, capacity, location, status, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', TRUE)`,
      [facilityId, roomNumber, name, name, capacity, location]
    );

    const roomId = result.insertId;

    // Sync room_id alias
    await db.query(
      `UPDATE meeting_rooms SET room_id = ? WHERE id = ?`,
      [roomId, roomId]
    );

    return roomId;
  }
}

module.exports = new RoomRepository();
