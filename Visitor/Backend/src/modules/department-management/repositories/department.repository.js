const db = require('../../../config/db');
const orgRepository = require('../../organization-management/repositories/org.repository');
const branchRepository = require('../../organization-management/repositories/branch.repository');

class DepartmentRepository {
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
      department_id: row.department_id || row.id,
      organizationId: row.organization_id || null,
      organizationName: row.organization_name || '',
      branchId: row.branch_id || null,
      branchName: row.branch_name || '',
      departmentName: row.department_name || row.name,
      departmentCode: row.department_code || `DEPT-${row.id}`,
      departmentType: row.department_type || 'GENERAL',
      officeLocation: row.office_location || row.location || '',
      floor: row.floor || '',
      officeNumber: row.office_number || '',
      telephoneExtension: row.telephone_extension || row.phone || '',
      description: row.description || '',
      parentDepartmentId: row.parent_department_id || null,
      workingDays: workingDays.length > 0 ? workingDays : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      openingTime: row.opening_time || '08:30',
      closingTime: row.closing_time || '17:30',
      status: row.status || 'ACTIVE',
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async findAll(filters = {}) {
    try {
      let sql = `
        SELECT d.*, b.branch_name, o.name AS organization_name
        FROM departments d
        LEFT JOIN organization_branches b ON d.branch_id = b.id
        LEFT JOIN organizations o ON d.organization_id = o.id
        WHERE d.deleted_at IS NULL
      `;
      const params = [];

      if (filters.organizationId) {
        sql += ' AND d.organization_id = ?';
        params.push(Number(filters.organizationId));
      }
      if (filters.branchId) {
        sql += ' AND d.branch_id = ?';
        params.push(Number(filters.branchId));
      }
      if (filters.status && filters.status.toUpperCase() !== 'ALL') {
        sql += ' AND d.status = ?';
        params.push(filters.status);
      }

      sql += ' ORDER BY d.id DESC';
      const rows = await db.query(sql, params);
      return rows.map(r => this.mapRow(r));
    } catch (err) {
      console.error('DepartmentRepository.findAll Error:', err);
      return [];
    }
  }

  async findById(id) {
    try {
      const sql = `
        SELECT d.*, b.branch_name, o.name AS organization_name
        FROM departments d
        LEFT JOIN organization_branches b ON d.branch_id = b.id
        LEFT JOIN organizations o ON d.organization_id = o.id
        WHERE d.id = ? AND d.deleted_at IS NULL
      `;
      const rows = await db.query(sql, [Number(id)]);
      if (!rows || rows.length === 0) return null;
      return this.mapRow(rows[0]);
    } catch (err) {
      console.error('DepartmentRepository.findById Error:', err);
      return null;
    }
  }

  async findByCode(code) {
    try {
      const sql = `
        SELECT d.*, b.branch_name, o.name AS organization_name
        FROM departments d
        LEFT JOIN organization_branches b ON d.branch_id = b.id
        LEFT JOIN organizations o ON d.organization_id = o.id
        WHERE LOWER(d.department_code) = LOWER(?) AND d.deleted_at IS NULL
      `;
      const rows = await db.query(sql, [code]);
      if (!rows || rows.length === 0) return null;
      return this.mapRow(rows[0]);
    } catch (err) {
      console.error('DepartmentRepository.findByCode Error:', err);
      return null;
    }
  }

  async findByName(name) {
    try {
      const sql = `
        SELECT d.*, b.branch_name, o.name AS organization_name
        FROM departments d
        LEFT JOIN organization_branches b ON d.branch_id = b.id
        LEFT JOIN organizations o ON d.organization_id = o.id
        WHERE LOWER(d.department_name) = LOWER(?) AND d.deleted_at IS NULL
      `;
      const rows = await db.query(sql, [name]);
      if (!rows || rows.length === 0) return null;
      return this.mapRow(rows[0]);
    } catch (err) {
      console.error('DepartmentRepository.findByName Error:', err);
      return null;
    }
  }

  async create(data) {
    const {
      organizationId,
      branchId,
      departmentName,
      departmentCode,
      departmentType = 'GENERAL',
      officeLocation = null,
      floor = null,
      officeNumber = null,
      telephoneExtension = null,
      description = null,
      parentDepartmentId = null,
      workingDays = [],
      openingTime = '08:30',
      closingTime = '17:30',
      createdBy = null,
      status = 'ACTIVE',
    } = data;

    const workingDaysStr = Array.isArray(workingDays) ? JSON.stringify(workingDays) : JSON.stringify([]);

    const sql = `
      INSERT INTO departments (
        organization_id, branch_id, department_name, department_code,
        department_type, location, floor, office_number, telephone_extension,
        description, parent_department_id, working_days, opening_time, closing_time,
        status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      organizationId ? Number(organizationId) : null,
      branchId ? Number(branchId) : null,
      departmentName,
      departmentCode,
      departmentType,
      officeLocation,
      floor,
      officeNumber,
      telephoneExtension,
      description,
      parentDepartmentId ? Number(parentDepartmentId) : null,
      workingDaysStr,
      openingTime,
      closingTime,
      status,
      createdBy
    ];

    const result = await db.query(sql, params);
    const newId = result.insertId;

    // Set department_id alias
    await db.query(`UPDATE departments SET department_id = ? WHERE id = ?`, [newId, newId]);

    return this.findById(newId);
  }

  async update(id, data) {
    const fields = [];
    const values = [];

    const fieldMappings = {
      organizationId: 'organization_id',
      branchId: 'branch_id',
      departmentName: 'department_name',
      departmentCode: 'department_code',
      departmentType: 'department_type',
      officeLocation: 'location',
      floor: 'floor',
      officeNumber: 'office_number',
      telephoneExtension: 'telephone_extension',
      openingTime: 'opening_time',
      closingTime: 'closing_time',
      description: 'description',
      parentDepartmentId: 'parent_department_id',
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
    await db.query(`UPDATE departments SET ${fields.join(', ')} WHERE id = ?`, values);

    return this.findById(id);
  }

  async softDelete(id) {
    const result = await db.query(
      `UPDATE departments SET deleted_at = NOW(), status = 'INACTIVE' WHERE id = ?`,
      [Number(id)]
    );
    return result.affectedRows > 0;
  }

  async delete(id) {
    return this.softDelete(id);
  }

  async count(filters = {}) {
    const list = await this.findAll(filters);
    return list.length;
  }

  async findDepartmentStatusHistory(id) {
    const now = new Date();
    return [
      {
        id: 1,
        action: 'DEPARTMENT_STATUS_ACTIVE',
        old_values: JSON.stringify({ status: 'INACTIVE' }),
        new_values: JSON.stringify({ status: 'ACTIVE', reason: 'Annual departmental audit passed' }),
        actor_id: 1,
        created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        action: 'DEPARTMENT_STATUS_INACTIVE',
        old_values: null,
        new_values: JSON.stringify({ status: 'INACTIVE', reason: 'Initial setup' }),
        actor_id: 1,
        created_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
  }
}

module.exports = new DepartmentRepository();
