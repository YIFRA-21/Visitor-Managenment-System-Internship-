const db = require('../../../config/db');

class RoomRepository {
  async findAll({
    organizationId,
    branchId,
    buildingId,
    floorId,
    departmentId,
    roomType,
    status,
    isBookable,
    isRestricted,
    minCapacity,
    search,
    limit = 50,
    offset = 0
  } = {}) {
    let sql = `
      SELECT 
        mr.id,
        mr.room_id,
        mr.facility_id,
        mr.department_id,
        mr.building_id,
        mr.floor_id,
        mr.room_number,
        mr.room_name,
        mr.room_type,
        mr.capacity,
        mr.has_projector,
        mr.has_tv,
        mr.has_video_conference,
        mr.is_accessible,
        mr.is_bookable,
        mr.is_restricted,
        mr.status,
        mr.is_active,
        mr.created_at,
        mr.updated_at,
        mr.building AS legacy_building,
        mr.floor AS legacy_floor,
        b.building_name,
        b.building_code,
        b.branch_id,
        f.floor_name,
        f.floor_number,
        f.floor_code,
        ob.branch_name,
        ob.branch_code,
        o.id AS organization_id,
        o.name AS organization_name,
        d.department_name,
        d.department_code
      FROM meeting_rooms mr
      LEFT JOIN buildings b ON mr.building_id = b.id
      LEFT JOIN floors f ON mr.floor_id = f.id
      LEFT JOIN organization_branches ob ON b.branch_id = ob.id
      LEFT JOIN organizations o ON (b.organization_id = o.id OR ob.organization_id = o.id)
      LEFT JOIN departments d ON mr.department_id = d.id
      WHERE mr.deleted_at IS NULL
    `;
    const params = [];

    if (organizationId) {
      sql += ` AND (b.organization_id = ? OR ob.organization_id = ?)`;
      params.push(organizationId, organizationId);
    }

    if (branchId) {
      sql += ` AND b.branch_id = ?`;
      params.push(branchId);
    }

    if (buildingId) {
      sql += ` AND mr.building_id = ?`;
      params.push(buildingId);
    }

    if (floorId) {
      sql += ` AND mr.floor_id = ?`;
      params.push(floorId);
    }

    if (departmentId) {
      sql += ` AND mr.department_id = ?`;
      params.push(departmentId);
    }

    if (roomType && roomType !== 'ALL') {
      sql += ` AND mr.room_type = ?`;
      params.push(roomType);
    }

    if (status && status !== 'ALL') {
      sql += ` AND mr.status = ?`;
      params.push(status);
    }

    if (isBookable !== undefined && isBookable !== null && isBookable !== '') {
      sql += ` AND mr.is_bookable = ?`;
      params.push(isBookable ? 1 : 0);
    }

    if (isRestricted !== undefined && isRestricted !== null && isRestricted !== '') {
      sql += ` AND mr.is_restricted = ?`;
      params.push(isRestricted ? 1 : 0);
    }

    if (minCapacity) {
      sql += ` AND mr.capacity >= ?`;
      params.push(parseInt(minCapacity, 10));
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ` AND (mr.room_name LIKE ? OR mr.room_number LIKE ? OR b.building_name LIKE ? OR f.floor_name LIKE ?)`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY mr.room_name ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const rows = await db.query(sql, params);

    // Count
    let countSql = `
      SELECT COUNT(*) AS total
      FROM meeting_rooms mr
      LEFT JOIN buildings b ON mr.building_id = b.id
      LEFT JOIN organization_branches ob ON b.branch_id = ob.id
      WHERE mr.deleted_at IS NULL
    `;
    const countParams = [];

    if (organizationId) {
      countSql += ` AND (b.organization_id = ? OR ob.organization_id = ?)`;
      countParams.push(organizationId, organizationId);
    }
    if (branchId) {
      countSql += ` AND b.branch_id = ?`;
      countParams.push(branchId);
    }
    if (buildingId) {
      countSql += ` AND mr.building_id = ?`;
      countParams.push(buildingId);
    }
    if (floorId) {
      countSql += ` AND mr.floor_id = ?`;
      countParams.push(floorId);
    }
    if (departmentId) {
      countSql += ` AND mr.department_id = ?`;
      countParams.push(departmentId);
    }
    if (roomType && roomType !== 'ALL') {
      countSql += ` AND mr.room_type = ?`;
      countParams.push(roomType);
    }
    if (status && status !== 'ALL') {
      countSql += ` AND mr.status = ?`;
      countParams.push(status);
    }
    if (isBookable !== undefined && isBookable !== null && isBookable !== '') {
      countSql += ` AND mr.is_bookable = ?`;
      countParams.push(isBookable ? 1 : 0);
    }
    if (isRestricted !== undefined && isRestricted !== null && isRestricted !== '') {
      countSql += ` AND mr.is_restricted = ?`;
      countParams.push(isRestricted ? 1 : 0);
    }
    if (minCapacity) {
      countSql += ` AND mr.capacity >= ?`;
      countParams.push(parseInt(minCapacity, 10));
    }
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      countSql += ` AND (mr.room_name LIKE ? OR mr.room_number LIKE ? OR b.building_name LIKE ?)`;
      countParams.push(term, term, term);
    }

    const countRes = await db.query(countSql, countParams);
    const total = countRes[0]?.total || 0;

    return { records: rows, total };
  }

  async findById(id) {
    const sql = `
      SELECT 
        mr.id,
        mr.room_id,
        mr.facility_id,
        mr.department_id,
        mr.building_id,
        mr.floor_id,
        mr.room_number,
        mr.room_name,
        mr.room_type,
        mr.capacity,
        mr.has_projector,
        mr.has_tv,
        mr.has_video_conference,
        mr.is_accessible,
        mr.is_bookable,
        mr.is_restricted,
        mr.status,
        mr.is_active,
        mr.created_at,
        mr.updated_at,
        mr.building AS legacy_building,
        mr.floor AS legacy_floor,
        b.building_name,
        b.building_code,
        b.branch_id,
        b.organization_id,
        f.floor_name,
        f.floor_number,
        f.floor_code,
        ob.branch_name,
        ob.branch_code,
        o.id AS organization_id,
        o.name AS organization_name,
        d.department_name,
        d.department_code
      FROM meeting_rooms mr
      LEFT JOIN buildings b ON mr.building_id = b.id
      LEFT JOIN floors f ON mr.floor_id = f.id
      LEFT JOIN organization_branches ob ON b.branch_id = ob.id
      LEFT JOIN organizations o ON (b.organization_id = o.id OR ob.organization_id = o.id)
      LEFT JOIN departments d ON mr.department_id = d.id
      WHERE mr.id = ? AND mr.deleted_at IS NULL
    `;
    const rows = await db.query(sql, [id]);
    return rows[0] || null;
  }

  async findByRoomNumberAndBuilding(roomNumber, buildingId, excludeId = null) {
    let sql = `SELECT * FROM meeting_rooms WHERE room_number = ? AND building_id = ? AND deleted_at IS NULL`;
    const params = [roomNumber, buildingId];
    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }
    const rows = await db.query(sql, params);
    return rows[0] || null;
  }

  async create(roomData) {
    const {
      building_id = null,
      floor_id = null,
      department_id = null,
      facility_id = null,
      room_number,
      room_name,
      room_type = 'MEETING_ROOM',
      capacity = 10,
      has_projector = 0,
      has_tv = 0,
      has_video_conference = 0,
      is_accessible = 1,
      is_bookable = 1,
      is_restricted = 0,
      status = 'ACTIVE',
      created_by = null
    } = roomData;

    // Fetch building and floor names for backwards compatibility
    let buildingText = '';
    let floorText = '';
    if (building_id) {
      const bRows = await db.query('SELECT building_name FROM buildings WHERE id = ?', [building_id]);
      buildingText = bRows[0]?.building_name || '';
    }
    if (floor_id) {
      const fRows = await db.query('SELECT floor_name, floor_number FROM floors WHERE id = ?', [floor_id]);
      floorText = fRows[0]?.floor_name || String(fRows[0]?.floor_number || '');
    }

    const result = await db.query(
      `INSERT INTO meeting_rooms (
        building_id, floor_id, department_id, facility_id,
        room_number, room_name, name, room_type, capacity,
        building, floor, location,
        has_projector, has_tv, has_video_conference,
        is_accessible, is_bookable, is_restricted,
        status, is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        building_id,
        floor_id,
        department_id,
        facility_id,
        room_number,
        room_name,
        room_name, // sync legacy name
        room_type,
        capacity,
        buildingText,
        floorText,
        buildingText ? `${buildingText}, ${floorText}` : 'Headquarters',
        has_projector ? 1 : 0,
        has_tv ? 1 : 0,
        has_video_conference ? 1 : 0,
        is_accessible ? 1 : 0,
        is_bookable ? 1 : 0,
        is_restricted ? 1 : 0,
        status,
        status === 'ACTIVE' ? 1 : 0,
        created_by
      ]
    );

    const newId = result.insertId;
    await db.query(`UPDATE meeting_rooms SET room_id = ? WHERE id = ?`, [newId, newId]);
    return this.findById(newId);
  }

  async update(id, data) {
    const fields = [];
    const params = [];

    const allowed = [
      'building_id',
      'floor_id',
      'department_id',
      'facility_id',
      'room_number',
      'room_name',
      'room_type',
      'capacity',
      'has_projector',
      'has_tv',
      'has_video_conference',
      'is_accessible',
      'is_bookable',
      'is_restricted',
      'status',
      'is_active',
      'updated_by'
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }

    if (data.room_name !== undefined) {
      fields.push(`name = ?`);
      params.push(data.room_name);
    }

    if (data.building_id !== undefined || data.floor_id !== undefined) {
      const current = await this.findById(id);
      const bId = data.building_id !== undefined ? data.building_id : current?.building_id;
      const fId = data.floor_id !== undefined ? data.floor_id : current?.floor_id;

      if (bId) {
        const bRows = await db.query('SELECT building_name FROM buildings WHERE id = ?', [bId]);
        fields.push(`building = ?`);
        params.push(bRows[0]?.building_name || '');
      }
      if (fId) {
        const fRows = await db.query('SELECT floor_name FROM floors WHERE id = ?', [fId]);
        fields.push(`floor = ?`);
        params.push(fRows[0]?.floor_name || '');
      }
    }

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    await db.query(`UPDATE meeting_rooms SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async softDelete(id, deletedBy = null) {
    await db.query(
      `UPDATE meeting_rooms SET deleted_at = CURRENT_TIMESTAMP, deleted_by = ?, is_active = 0, status = 'INACTIVE' WHERE id = ?`,
      [deletedBy, id]
    );
    return true;
  }

  async checkDoubleBooking(roomId, startTime, endTime, excludeBookingId = null) {
    let sql = `
      SELECT rb.*, a.appointment_number, a.purpose, u.name AS host_name
      FROM room_bookings rb
      JOIN appointments a ON rb.appointment_id = a.id
      LEFT JOIN users u ON a.host_id = u.id
      WHERE rb.room_id = ?
        AND rb.booking_status = 'CONFIRMED'
        AND rb.deleted_at IS NULL
        AND a.deleted_at IS NULL
        AND (
          (rb.booking_start < ? AND rb.booking_end > ?)
        )
    `;
    const params = [roomId, endTime, startTime];

    if (excludeBookingId) {
      sql += ` AND rb.id != ?`;
      params.push(excludeBookingId);
    }

    const conflicts = await db.query(sql, params);
    return conflicts;
  }
}

module.exports = new RoomRepository();
