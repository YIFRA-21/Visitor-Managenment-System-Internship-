const db = require('../../../config/db');

class HolidayRepository {
  async findAll(filters = {}) {
    let sql = `SELECT * FROM holidays WHERE 1=1`;
    const params = [];

    if (filters.organizationId) {
      sql += ` AND organization_id = ?`;
      params.push(filters.organizationId);
    }
    if (filters.branchId) {
      sql += ` AND (branch_id IS NULL OR branch_id = ?)`;
      params.push(filters.branchId);
    }
    if (filters.type) {
      sql += ` AND UPPER(type) = ?`;
      params.push(filters.type.toUpperCase());
    }
    if (filters.status) {
      sql += ` AND UPPER(status) = ?`;
      params.push(filters.status.toUpperCase());
    }

    sql += ` ORDER BY date ASC`;

    const rows = await db.query(sql, params);
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      date: r.date,
      appliesTo: r.applies_to,
      organizationId: r.organization_id,
      branchId: r.branch_id,
      status: r.status,
      created_at: r.created_at
    }));
  }

  async findById(id) {
    const rows = await db.query(`SELECT * FROM holidays WHERE id = ? LIMIT 1`, [id]);
    if (rows && rows.length > 0) {
      const r = rows[0];
      return {
        id: r.id,
        name: r.name,
        type: r.type,
        date: r.date,
        appliesTo: r.applies_to,
        organizationId: r.organization_id,
        branchId: r.branch_id,
        status: r.status
      };
    }
    return null;
  }

  async findByDate(date, orgId, branchId = null) {
    let sql = `SELECT * FROM holidays WHERE date = ? AND organization_id = ?`;
    const params = [date, orgId];

    if (branchId) {
      sql += ` AND (branch_id IS NULL OR branch_id = ?)`;
      params.push(branchId);
    }

    const rows = await db.query(sql, params);
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      date: r.date,
      appliesTo: r.applies_to,
      organizationId: r.organization_id,
      branchId: r.branch_id,
      status: r.status
    }));
  }

  async save(holidayData) {
    if (holidayData.id) {
      await db.query(
        `UPDATE holidays SET name = ?, type = ?, date = ?, applies_to = ?, status = ? WHERE id = ?`,
        [holidayData.name, holidayData.type, holidayData.date, holidayData.appliesTo || 'ALL', holidayData.status || 'ACTIVE', holidayData.id]
      );
      return holidayData;
    }
    const res = await db.query(
      `INSERT INTO holidays (name, type, date, applies_to, organization_id, branch_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [holidayData.name, holidayData.type, holidayData.date, holidayData.appliesTo || 'ALL', holidayData.organizationId || 1, holidayData.branchId || null, holidayData.status || 'ACTIVE']
    );
    return { id: res.insertId || 1, status: 'ACTIVE', ...holidayData };
  }

  async delete(id) {
    await db.query(`DELETE FROM holidays WHERE id = ?`, [id]);
    return true;
  }
}

module.exports = new HolidayRepository();
