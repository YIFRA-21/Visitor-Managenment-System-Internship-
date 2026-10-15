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
    const { name, capacity, location, facilityId = null } = roomData;
    const useMock = db.getUseMock();

    if (useMock) {
      const result = await db.query(
        `INSERT INTO rooms (name, capacity, location) VALUES (?, ?, ?)`,
        [name, capacity, location]
      );
      return result.insertId;
    }

    const result = await db.query(
      `INSERT INTO meeting_rooms (
        facility_id, room_name, name, capacity, location, status, is_active
      ) VALUES (?, ?, ?, ?, ?, 'ACTIVE', TRUE)`,
      [facilityId, name, name, capacity, location]
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
