const db = require('../../../config/db');

class FloorRepository {
  async findAll({ buildingId, organizationId, branchId, status, search, limit = 100, offset = 0 } = {}) {
    let sql = `
      SELECT 
        f.id,
        f.floor_id,
        f.floor_code,
        f.floor_name,
        f.floor_number,
        f.description,
        f.is_active,
        f.created_at,
        f.updated_at,
        f.building_id,
        b.building_name,
        b.building_code,
        b.branch_id,
        b.organization_id,
        ob.branch_name,
        o.name AS organization_name,
        (SELECT COUNT(*) FROM meeting_rooms mr WHERE mr.floor_id = f.id AND mr.deleted_at IS NULL) AS total_rooms,
        (SELECT COUNT(*) FROM employees e WHERE e.floor_id = f.id AND e.deleted_at IS NULL) AS total_employees
      FROM floors f
      JOIN buildings b ON f.building_id = b.id
      LEFT JOIN organization_branches ob ON b.branch_id = ob.id
      LEFT JOIN organizations o ON (b.organization_id = o.id OR ob.organization_id = o.id)
      WHERE f.deleted_at IS NULL AND b.deleted_at IS NULL
    `;
    const params = [];

    if (buildingId) {
      sql += ` AND f.building_id = ?`;
      params.push(buildingId);
    }

    if (branchId) {
      sql += ` AND b.branch_id = ?`;
      params.push(branchId);
    }

    if (organizationId) {
      sql += ` AND (b.organization_id = ? OR ob.organization_id = ?)`;
      params.push(organizationId, organizationId);
    }

    if (status !== undefined && status !== null && status !== '' && status !== 'ALL') {
      const isActive = status === 'ACTIVE' || status === '1' || status === true;
      sql += ` AND f.is_active = ?`;
      params.push(isActive ? 1 : 0);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ` AND (f.floor_name LIKE ? OR f.floor_code LIKE ? OR b.building_name LIKE ?)`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY b.building_name ASC, f.floor_number ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const rows = await db.query(sql, params);

    // Count
    let countSql = `
      SELECT COUNT(*) AS total
      FROM floors f
      JOIN buildings b ON f.building_id = b.id
      LEFT JOIN organization_branches ob ON b.branch_id = ob.id
      WHERE f.deleted_at IS NULL AND b.deleted_at IS NULL
    `;
    const countParams = [];
    if (buildingId) {
      countSql += ` AND f.building_id = ?`;
      countParams.push(buildingId);
    }
    if (branchId) {
      countSql += ` AND b.branch_id = ?`;
      countParams.push(branchId);
    }
    if (organizationId) {
      countSql += ` AND (b.organization_id = ? OR ob.organization_id = ?)`;
      countParams.push(organizationId, organizationId);
    }
    if (status !== undefined && status !== null && status !== '' && status !== 'ALL') {
      const isActive = status === 'ACTIVE' || status === '1' || status === true;
      countSql += ` AND f.is_active = ?`;
      countParams.push(isActive ? 1 : 0);
    }
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      countSql += ` AND (f.floor_name LIKE ? OR f.floor_code LIKE ? OR b.building_name LIKE ?)`;
      countParams.push(term, term, term);
    }

    const countRes = await db.query(countSql, countParams);
    const total = countRes[0]?.total || 0;

    return { records: rows, total };
  }

  async findById(id) {
    const sql = `
      SELECT 
        f.id,
        f.floor_id,
        f.floor_code,
        f.floor_name,
        f.floor_number,
        f.description,
        f.is_active,
        f.created_at,
        f.updated_at,
        f.building_id,
        b.building_name,
        b.building_code,
        b.branch_id,
        b.organization_id,
        ob.branch_name,
        o.name AS organization_name,
        (SELECT COUNT(*) FROM meeting_rooms mr WHERE mr.floor_id = f.id AND mr.deleted_at IS NULL) AS total_rooms,
        (SELECT COUNT(*) FROM employees e WHERE e.floor_id = f.id AND e.deleted_at IS NULL) AS total_employees
      FROM floors f
      JOIN buildings b ON f.building_id = b.id
      LEFT JOIN organization_branches ob ON b.branch_id = ob.id
      LEFT JOIN organizations o ON (b.organization_id = o.id OR ob.organization_id = o.id)
      WHERE f.id = ? AND f.deleted_at IS NULL
    `;
    const rows = await db.query(sql, [id]);
    return rows[0] || null;
  }

  async findByBuildingAndNumber(buildingId, floorNumber, excludeId = null) {
    let sql = `SELECT * FROM floors WHERE building_id = ? AND floor_number = ? AND deleted_at IS NULL`;
    const params = [buildingId, floorNumber];
    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }
    const rows = await db.query(sql, params);
    return rows[0] || null;
  }

  async create(data) {
    const {
      building_id,
      floor_name,
      floor_number,
      floor_code = null,
      description = null,
      is_active = 1,
      created_by = null
    } = data;

    const computedCode = floor_code || (
      floor_number === 0 ? 'G' : floor_number < 0 ? `B${Math.abs(floor_number)}` : String(floor_number).padStart(2, '0')
    );

    const result = await db.query(
      `INSERT INTO floors (
        building_id, floor_name, floor_number, floor_code, description, is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        building_id,
        floor_name,
        floor_number,
        computedCode,
        description,
        is_active ? 1 : 0,
        created_by
      ]
    );

    const newId = result.insertId;
    await db.query(`UPDATE floors SET floor_id = ? WHERE id = ?`, [newId, newId]);
    return this.findById(newId);
  }

  async update(id, data) {
    const fields = [];
    const params = [];

    const allowed = [
      'building_id',
      'floor_name',
      'floor_number',
      'floor_code',
      'description',
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
    await db.query(`UPDATE floors SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async softDelete(id, deletedBy = null) {
    await db.query(
      `UPDATE floors SET deleted_at = CURRENT_TIMESTAMP, deleted_by = ?, is_active = 0 WHERE id = ?`,
      [deletedBy, id]
    );
    return true;
  }

  async checkActiveDependencies(floorId) {
    // Rooms on this floor
    const rooms = await db.query(
      `SELECT COUNT(*) as count FROM meeting_rooms WHERE floor_id = ? AND deleted_at IS NULL AND is_active = 1`,
      [floorId]
    );

    // Active employees on this floor
    const employees = await db.query(
      `SELECT COUNT(*) as count FROM employees WHERE floor_id = ? AND deleted_at IS NULL`,
      [floorId]
    );

    return {
      activeRooms: rooms[0]?.count || 0,
      activeEmployees: employees[0]?.count || 0
    };
  }
}

module.exports = new FloorRepository();
