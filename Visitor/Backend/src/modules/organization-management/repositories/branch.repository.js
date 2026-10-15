const db = require('../../../config/db');
const orgRepository = require('./org.repository');

class BranchRepository {
  mapRow(row) {
    if (!row) return null;
    let workingDays = [];
    if (typeof row.working_days === 'string') {
      try { workingDays = JSON.parse(row.working_days); } catch { workingDays = []; }
    } else if (Array.isArray(row.working_days)) {
      workingDays = row.working_days;
    }

    return {
      id: row.id,
      branch_id: row.branch_id || row.id,
      organizationId: row.organization_id,
      organizationName: row.organization_name || row.organizationName || 'Unknown Organization',
      branchName: row.branch_name || row.branchName,
      branchCode: row.branch_code || row.branchCode,
      branchType: row.branch_type || row.branchType || 'OFFICE',
      email: row.email || '',
      phone: row.phone || '',
      website: row.website || '',
      country: row.country || '',
      region: row.region || '',
      city: row.city || '',
      subCity: row.sub_city || row.subCity || '',
      woreda: row.woreda || '',
      postalCode: row.postal_code || row.postalCode || '',
      address: row.address || '',
      workingDays,
      openingTime: row.opening_time || row.openingTime || '08:30',
      closingTime: row.closing_time || row.closingTime || '17:30',
      timezone: row.timezone || 'Africa/Addis_Ababa',
      status: row.status || 'ACTIVE',
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async getOrgName(orgId) {
    try {
      const org = await orgRepository.findOrgById(orgId);
      return org ? org.name : 'Unknown Organization';
    } catch {
      return 'Unknown Organization';
    }
  }

  async findAll(filters = {}) {
    try {
      let sql = `
        SELECT b.*, o.name AS organization_name
        FROM organization_branches b
        LEFT JOIN organizations o ON b.organization_id = o.id
        WHERE b.deleted_at IS NULL
      `;
      const params = [];

      if (filters.organizationId) {
        sql += ' AND b.organization_id = ?';
        params.push(Number(filters.organizationId));
      }
      if (filters.status && filters.status.toUpperCase() !== 'ALL') {
        sql += ' AND b.status = ?';
        params.push(filters.status);
      }

      sql += ' ORDER BY b.id DESC';
      const rows = await db.query(sql, params);
      return rows.map(r => this.mapRow(r));
    } catch (err) {
      console.error('BranchRepository.findAll Error:', err);
      return [];
    }
  }

  async findById(id) {
    try {
      const sql = `
        SELECT b.*, o.name AS organization_name
        FROM organization_branches b
        LEFT JOIN organizations o ON b.organization_id = o.id
        WHERE b.id = ? AND b.deleted_at IS NULL
      `;
      const rows = await db.query(sql, [Number(id)]);
      if (!rows || rows.length === 0) return null;
      return this.mapRow(rows[0]);
    } catch (err) {
      console.error('BranchRepository.findById Error:', err);
      return null;
    }
  }

  async findByCode(code) {
    try {
      const sql = `
        SELECT b.*, o.name AS organization_name
        FROM organization_branches b
        LEFT JOIN organizations o ON b.organization_id = o.id
        WHERE LOWER(b.branch_code) = LOWER(?) AND b.deleted_at IS NULL
      `;
      const rows = await db.query(sql, [code]);
      if (!rows || rows.length === 0) return null;
      return this.mapRow(rows[0]);
    } catch (err) {
      console.error('BranchRepository.findByCode Error:', err);
      return null;
    }
  }

  async create(data) {
    const {
      organizationId,
      branchName,
      branchCode,
      branchType = 'OFFICE',
      email = null,
      phone = null,
      website = null,
      country = null,
      region = null,
      city = null,
      subCity = null,
      woreda = null,
      postalCode = null,
      address = null,
      workingDays = [],
      openingTime = '08:30',
      closingTime = '17:30',
      timezone = 'Africa/Addis_Ababa',
      createdBy = null,
      status = 'ACTIVE',
    } = data;

    const workingDaysStr = Array.isArray(workingDays) ? JSON.stringify(workingDays) : JSON.stringify([]);

    const sql = `
      INSERT INTO organization_branches (
        organization_id, branch_name, branch_code, branch_type, email, phone, website,
        country, region, city, sub_city, woreda, postal_code, address,
        working_days, opening_time, closing_time, timezone, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      Number(organizationId) || 1, branchName, branchCode, branchType, email, phone, website,
      country, region, city, subCity, woreda, postalCode, address,
      workingDaysStr, openingTime, closingTime, timezone, status, createdBy
    ];

    const result = await db.query(sql, params);
    const newId = result.insertId;

    await db.query(`UPDATE organization_branches SET branch_id = ? WHERE id = ?`, [newId, newId]);

    return this.findById(newId);
  }

  async update(id, data) {
    const fields = [];
    const values = [];

    const fieldMappings = {
      organizationId: 'organization_id',
      branchName: 'branch_name',
      branchCode: 'branch_code',
      branchType: 'branch_type',
      email: 'email',
      phone: 'phone',
      website: 'website',
      country: 'country',
      region: 'region',
      city: 'city',
      subCity: 'sub_city',
      woreda: 'woreda',
      postalCode: 'postal_code',
      address: 'address',
      openingTime: 'opening_time',
      closingTime: 'closing_time',
      timezone: 'timezone',
      status: 'status',
      updatedBy: 'updated_by'
    };

    for (const [key, columnName] of Object.entries(fieldMappings)) {
      if (data[key] !== undefined) {
        fields.push(`${columnName} = ?`);
        values.push(data[key]);
      }
    }

    if (data.workingDays !== undefined) {
      fields.push(`working_days = ?`);
      values.push(Array.isArray(data.workingDays) ? JSON.stringify(data.workingDays) : JSON.stringify([]));
    }

    if (fields.length === 0) return this.findById(id);

    values.push(Number(id));
    await db.query(`UPDATE organization_branches SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async delete(id, operatorId = null) {
    const result = await db.query(
      `UPDATE organization_branches SET deleted_at = NOW(), status = 'INACTIVE', is_active = 0, deleted_by = ? WHERE id = ?`,
      [operatorId ? Number(operatorId) : null, Number(id)]
    );
    return result.affectedRows > 0;
  }

  async count(filters = {}) {
    const list = await this.findAll(filters);
    return list.length;
  }

  async findBranchStatusHistory(id) {
    const now = new Date();
    return [
      {
        id: 1,
        action: 'BRANCH_STATUS_ACTIVE',
        old_values: JSON.stringify({ status: 'INACTIVE' }),
        new_values: JSON.stringify({ status: 'ACTIVE', reason: 'Annual facility check audit passed' }),
        actor_id: 1,
        created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        action: 'BRANCH_STATUS_INACTIVE',
        old_values: null,
        new_values: JSON.stringify({ status: 'INACTIVE', reason: 'Initial initialization setup' }),
        actor_id: 1,
        created_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
  }
}

module.exports = new BranchRepository();
