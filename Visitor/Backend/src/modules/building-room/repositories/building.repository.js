const db = require('../../../config/db');

class BuildingRepository {
  async findAll({ organizationId, branchId, status, search, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT 
        b.id,
        b.building_id,
        b.building_code,
        b.building_name,
        b.location,
        b.description,
        b.max_visitor_capacity,
        b.is_active,
        b.created_at,
        b.updated_at,
        b.branch_id,
        b.organization_id,
        ob.branch_name,
        ob.branch_code,
        o.name AS organization_name,
        o.code AS organization_code,
        (SELECT COUNT(*) FROM floors f WHERE f.building_id = b.id AND f.deleted_at IS NULL) AS total_floors,
        (SELECT COUNT(*) FROM meeting_rooms mr WHERE mr.building_id = b.id AND mr.deleted_at IS NULL) AS total_rooms,
        (SELECT COUNT(*) FROM employees e WHERE e.building_id = b.id AND e.deleted_at IS NULL) AS total_employees
      FROM buildings b
      LEFT JOIN organization_branches ob ON b.branch_id = ob.id
      LEFT JOIN organizations o ON (b.organization_id = o.id OR ob.organization_id = o.id)
      WHERE b.deleted_at IS NULL
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

    if (status !== undefined && status !== null && status !== '' && status !== 'ALL') {
      const isActive = status === 'ACTIVE' || status === '1' || status === true;
      sql += ` AND b.is_active = ?`;
      params.push(isActive ? 1 : 0);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ` AND (b.building_name LIKE ? OR b.building_code LIKE ? OR b.location LIKE ?)`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY b.building_name ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const rows = await db.query(sql, params);

    // Count query
    let countSql = `
      SELECT COUNT(*) AS total
      FROM buildings b
      LEFT JOIN organization_branches ob ON b.branch_id = ob.id
      WHERE b.deleted_at IS NULL
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
    if (status !== undefined && status !== null && status !== '' && status !== 'ALL') {
      const isActive = status === 'ACTIVE' || status === '1' || status === true;
      countSql += ` AND b.is_active = ?`;
      countParams.push(isActive ? 1 : 0);
    }
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      countSql += ` AND (b.building_name LIKE ? OR b.building_code LIKE ? OR b.location LIKE ?)`;
      countParams.push(term, term, term);
    }

    const countRes = await db.query(countSql, countParams);
    const total = countRes[0]?.total || 0;

    return { records: rows, total };
  }

  async findById(id) {
    const sql = `
      SELECT 
        b.id,
        b.building_id,
        b.building_code,
        b.building_name,
        b.location,
        b.description,
        b.max_visitor_capacity,
        b.is_active,
        b.created_at,
        b.updated_at,
        b.branch_id,
        b.organization_id,
        ob.branch_name,
        ob.branch_code,
        o.name AS organization_name,
        o.code AS organization_code,
        (SELECT COUNT(*) FROM floors f WHERE f.building_id = b.id AND f.deleted_at IS NULL) AS total_floors,
        (SELECT COUNT(*) FROM meeting_rooms mr WHERE mr.building_id = b.id AND mr.deleted_at IS NULL) AS total_rooms,
        (SELECT COUNT(*) FROM employees e WHERE e.building_id = b.id AND e.deleted_at IS NULL) AS total_employees
      FROM buildings b
      LEFT JOIN organization_branches ob ON b.branch_id = ob.id
      LEFT JOIN organizations o ON (b.organization_id = o.id OR ob.organization_id = o.id)
      WHERE b.id = ? AND b.deleted_at IS NULL
    `;
    const rows = await db.query(sql, [id]);
    return rows[0] || null;
  }

  async findByCode(buildingCode, excludeId = null) {
    let sql = `SELECT * FROM buildings WHERE building_code = ? AND deleted_at IS NULL`;
    const params = [buildingCode];
    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }
    const rows = await db.query(sql, params);
    return rows[0] || null;
  }

  async create(data) {
    const {
      branch_id,
      organization_id,
      building_name,
      building_code,
      location = null,
      description = null,
      max_visitor_capacity = null,
      is_active = 1,
      created_by = null
    } = data;

    const result = await db.query(
      `INSERT INTO buildings (
        branch_id, organization_id, building_name, building_code,
        location, description, max_visitor_capacity, is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        branch_id,
        organization_id,
        building_name,
        building_code,
        location,
        description,
        max_visitor_capacity,
        is_active ? 1 : 0,
        created_by
      ]
    );

    const newId = result.insertId;
    await db.query(`UPDATE buildings SET building_id = ? WHERE id = ?`, [newId, newId]);
    return this.findById(newId);
  }

  async update(id, data) {
    const fields = [];
    const params = [];

    const allowed = [
      'branch_id',
      'organization_id',
      'building_name',
      'building_code',
      'location',
      'description',
      'max_visitor_capacity',
      'is_active',
      'updated_by'
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    await db.query(`UPDATE buildings SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async softDelete(id, deletedBy = null) {
    await db.query(
      `UPDATE buildings SET deleted_at = CURRENT_TIMESTAMP, deleted_by = ?, is_active = 0 WHERE id = ?`,
      [deletedBy, id]
    );
    return true;
  }

  async checkActiveDependencies(buildingId) {
    // Check floors
    const floors = await db.query(
      `SELECT COUNT(*) as count FROM floors WHERE building_id = ? AND deleted_at IS NULL AND is_active = 1`,
      [buildingId]
    );

    // Check active appointments scheduled in rooms belonging to this building
    const appointments = await db.query(
      `SELECT COUNT(*) as count FROM appointments a
       JOIN meeting_rooms mr ON a.room_id = mr.id
       WHERE mr.building_id = ? 
         AND a.appointment_status IN ('REQUESTED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS')
         AND a.scheduled_end >= NOW()
         AND a.deleted_at IS NULL`,
      [buildingId]
    );

    // Check active employees assigned to this building
    const employees = await db.query(
      `SELECT COUNT(*) as count FROM employees WHERE building_id = ? AND deleted_at IS NULL`,
      [buildingId]
    );

    return {
      activeFloors: floors[0]?.count || 0,
      activeAppointments: appointments[0]?.count || 0,
      activeEmployees: employees[0]?.count || 0
    };
  }

  async getUtilization(buildingId) {
    const building = await this.findById(buildingId);
    if (!building) return null;

    // Rooms breakdown
    const rooms = await db.query(
      `SELECT room_type, COUNT(*) as count, SUM(capacity) as total_capacity
       FROM meeting_rooms 
       WHERE building_id = ? AND deleted_at IS NULL
       GROUP BY room_type`,
      [buildingId]
    );

    // Today's appointments count
    const todayAppointments = await db.query(
      `SELECT COUNT(*) as total_today,
              SUM(CASE WHEN a.appointment_status = 'CHECKED_IN' THEN 1 ELSE 0 END) as checked_in_now
       FROM appointments a
       JOIN meeting_rooms mr ON a.room_id = mr.id
       WHERE mr.building_id = ? 
         AND DATE(a.scheduled_start) = CURDATE()
         AND a.deleted_at IS NULL`,
      [buildingId]
    );

    return {
      building,
      roomsSummary: rooms,
      todaysVisits: todayAppointments[0]?.total_today || 0,
      currentOccupancy: todayAppointments[0]?.checked_in_now || 0,
      maxVisitorCapacity: building.max_visitor_capacity || 0
    };
  }
}

module.exports = new BuildingRepository();
