const db = require('../../../config/db');

class EmployeeRepository {
  async findAll({ search, department_id, branch_id, organization_id, employment_status, is_host_enabled, availability_status, role, all_roles = false, page = 1, limit = 10 } = {}) {
    let sql = `SELECT e.*, 
                      COALESCE(NULLIF(e.full_name, ''), u.full_name, CONCAT_WS(' ', e.first_name, e.last_name)) as full_name,
                      u.full_name as fullName, 
                      COALESCE(NULLIF(e.email, ''), u.email) as email,
                      u.email as userEmail, 
                      COALESCE(NULLIF(e.mobile_number, ''), u.phone) as mobile_number,
                      u.phone as userPhone,
                      u.role as user_role,
                      d.name as department_name, b.branch_name, r.name as default_room_name,
                      m.full_name as manager_name,
                      org.name as organization_name
               FROM employees e
               LEFT JOIN users u ON e.user_id = u.id
               LEFT JOIN departments d ON e.department_id = d.id
               LEFT JOIN organization_branches b ON e.branch_id = b.id
               LEFT JOIN rooms r ON e.default_room_id = r.id
               LEFT JOIN users m ON e.manager_id = m.id
               LEFT JOIN organizations org ON e.organization_id = org.id
               WHERE e.deleted_at IS NULL`;
    const params = [];

    // STRICT: Only return users with role 'employee' or 'staff'
    // Exclude 'admin', 'manager', 'department_manager', 'receptionist', 'security', 'security_officer', 'visitor'
    if (role && role !== 'ALL') {
      sql += ` AND LOWER(u.role) = ?`;
      params.push(role.toLowerCase());
    } else if (!all_roles) {
      sql += ` AND (LOWER(COALESCE(u.role, 'employee')) IN ('employee', 'staff'))
               AND LOWER(COALESCE(u.role, '')) NOT IN ('admin', 'manager', 'department_manager', 'receptionist', 'security', 'security_officer', 'visitor')
               AND (e.employee_number IS NULL OR (e.employee_number NOT LIKE 'ADM%' AND e.employee_number NOT LIKE 'MGR%' AND e.employee_number NOT LIKE 'REC%' AND e.employee_number NOT LIKE 'SEC%' AND e.employee_number NOT LIKE 'VIS%'))`;
    }

    if (organization_id) {
      sql += ` AND e.organization_id = ?`;
      params.push(organization_id);
    }

    if (department_id) {
      sql += ` AND e.department_id = ?`;
      params.push(department_id);
    }

    if (branch_id) {
      sql += ` AND e.branch_id = ?`;
      params.push(branch_id);
    }

    if (employment_status && employment_status !== 'ALL') {
      sql += ` AND e.employment_status = ?`;
      params.push(employment_status);
    }

    if (is_host_enabled !== undefined && is_host_enabled !== '') {
      sql += ` AND e.is_host_enabled = ?`;
      params.push(is_host_enabled === 'true' || is_host_enabled === true ? 1 : 0);
    }

    if (availability_status && availability_status !== 'ALL') {
      sql += ` AND e.availability_status = ?`;
      params.push(availability_status);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ` AND (e.employee_number LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ? OR e.full_name LIKE ? OR e.email LIKE ? OR e.mobile_number LIKE ? OR e.job_title LIKE ?)`;
      params.push(term, term, term, term, term, term, term);
    }

    sql += ` ORDER BY e.created_at DESC`;

    const allRows = await db.query(sql, params);
    const total = allRows.length;
    const offset = (Number(page) - 1) * Number(limit);
    const paginatedRows = allRows.slice(offset, offset + Number(limit));

    return {
      data: paginatedRows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  async findArchived({ page = 1, limit = 10 } = {}) {
    const sql = `SELECT e.*, d.name as department_name, b.branch_name, u.role as user_role
                 FROM employees e
                 LEFT JOIN users u ON e.user_id = u.id
                 LEFT JOIN departments d ON e.department_id = d.id
                 LEFT JOIN organization_branches b ON e.branch_id = b.id
                 WHERE e.archived_at IS NOT NULL AND e.deleted_at IS NULL
                   AND (LOWER(COALESCE(u.role, 'employee')) IN ('employee', 'staff'))
                   AND LOWER(COALESCE(u.role, '')) NOT IN ('admin', 'manager', 'department_manager', 'receptionist', 'security', 'security_officer', 'visitor')
                   AND (e.employee_number IS NULL OR (e.employee_number NOT LIKE 'ADM%' AND e.employee_number NOT LIKE 'MGR%' AND e.employee_number NOT LIKE 'REC%' AND e.employee_number NOT LIKE 'SEC%' AND e.employee_number NOT LIKE 'VIS%'))
                 ORDER BY e.archived_at DESC`;
    const rows = await db.query(sql, []);
    const total = rows.length;
    const offset = (Number(page) - 1) * Number(limit);
    return {
      data: rows.slice(offset, offset + Number(limit)),
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) || 1 }
    };
  }

  async findById(id, includeDeleted = false) {
    const isNum = !isNaN(Number(id)) && Number(id) > 0;
    const numId = isNum ? Number(id) : null;
    const strId = String(id);
    const whereDeleted = includeDeleted ? '' : ' AND e.deleted_at IS NULL';
    const rows = await db.query(
      `SELECT e.*, 
              COALESCE(NULLIF(e.photo_url, ''), u.avatar_url, u.profile_photo) as photo_url,
              COALESCE(u.avatar_url, NULLIF(e.photo_url, ''), u.profile_photo) as avatar_url,
              COALESCE(NULLIF(e.full_name, ''), u.full_name, CONCAT_WS(' ', e.first_name, e.last_name)) as full_name,
              u.full_name as fullName, 
              COALESCE(NULLIF(e.email, ''), u.email) as email,
              u.email as userEmail, 
              COALESCE(NULLIF(e.mobile_number, ''), u.phone) as mobile_number,
              u.phone as userPhone,
              d.name as department_name, b.branch_name, r.name as default_room_name,
              m.full_name as manager_name, org.name as organization_name
       FROM employees e
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN organization_branches b ON e.branch_id = b.id
       LEFT JOIN rooms r ON e.default_room_id = r.id
       LEFT JOIN users m ON e.manager_id = m.id
       LEFT JOIN organizations org ON e.organization_id = org.id
       WHERE (e.id = ? OR e.employee_id = ? OR e.employee_number = ?)${whereDeleted}`,
      [numId, numId, strId]
    );
    return rows[0] || null;
  }

  async findByUserId(userId) {
    const rows = await db.query(
      `SELECT e.*, 
              COALESCE(NULLIF(e.photo_url, ''), u.avatar_url, u.profile_photo) as photo_url,
              COALESCE(u.avatar_url, NULLIF(e.photo_url, ''), u.profile_photo) as avatar_url,
              d.name as department_name, b.branch_name, r.name as default_room_name, m.full_name as manager_name
       FROM employees e
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN organization_branches b ON e.branch_id = b.id
       LEFT JOIN rooms r ON e.default_room_id = r.id
       LEFT JOIN users m ON e.manager_id = m.id
       WHERE e.user_id = ? AND e.deleted_at IS NULL LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  }

  async findByEmployeeNumber(employeeNumber, includeDeleted = false) {
    const sql = includeDeleted
      ? `SELECT * FROM employees WHERE employee_number = ? LIMIT 1`
      : `SELECT * FROM employees WHERE employee_number = ? AND deleted_at IS NULL LIMIT 1`;
    const rows = await db.query(sql, [employeeNumber]);
    return rows[0] || null;
  }

  async existsByEmployeeNumber(employeeNumber) {
    if (!employeeNumber) return false;
    const rows = await db.query(
      `SELECT id FROM employees WHERE employee_number = ? LIMIT 1`,
      [employeeNumber.trim()]
    );
    return Boolean(rows && rows.length > 0);
  }

  async generateNextEmployeeNumber(prefix = 'EMP') {
    const year = new Date().getFullYear();
    const fullPrefix = `${prefix}-${year}-`;

    const [empRows, userRows] = await Promise.all([
      db.query(`SELECT employee_number FROM employees WHERE employee_number LIKE ? OR employee_number LIKE ?`, [`${fullPrefix}%`, `%${fullPrefix}%`]).catch(() => []),
      db.query(`SELECT user_code FROM users WHERE user_code LIKE ? OR user_code LIKE ?`, [`${fullPrefix}%`, `%${fullPrefix}%`]).catch(() => [])
    ]);

    let maxSeq = 0;
    const regex = new RegExp(`^.*?${prefix}-${year}-(\\d+)$`, 'i');

    for (const r of (empRows || [])) {
      if (!r.employee_number) continue;
      const match = String(r.employee_number).match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }

    for (const r of (userRows || [])) {
      if (!r.user_code) continue;
      const match = String(r.user_code).match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }

    let nextNum = maxSeq + 1;
    while (true) {
      const candidate5 = `${fullPrefix}${String(nextNum).padStart(5, '0')}`;
      const candidate6 = `${fullPrefix}${String(nextNum).padStart(6, '0')}`;

      const [empMatch] = await db.query(
        `SELECT id FROM employees WHERE employee_number IN (?, ?) LIMIT 1`,
        [candidate5, candidate6]
      ).catch(() => []);

      const [userMatch] = await db.query(
        `SELECT id FROM users WHERE user_code IN (?, ?) LIMIT 1`,
        [candidate5, candidate6]
      ).catch(() => []);

      if (!empMatch && !userMatch) {
        return candidate6;
      }
      nextNum++;
    }
  }

  async findByEmail(email) {
    const rows = await db.query(
      `SELECT * FROM employees WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  }

  async create(data, dbClient = db) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const result = await dbClient.query(
      `INSERT INTO employees (
        user_id, employee_number, first_name, middle_name, last_name, full_name,
        gender, dob, nationality, marital_status, photo_url, email, mobile_number,
        office_phone, extension, employment_type, job_title, position, hire_date,
        employment_status, organization_id, branch_id, department_id, building_id,
        floor_number, office_number, manager_id, emergency_contact_name,
        emergency_contact_relation, emergency_contact_phone, is_host_enabled,
        max_visitors_per_day, max_concurrent_visitors, default_room_id,
        default_approval_role, availability_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id || null,
        data.employee_number,
        data.first_name,
        data.middle_name || '',
        data.last_name,
        `${data.first_name} ${data.last_name}`.trim(),
        data.gender || 'Male',
        data.dob || null,
        data.nationality || 'Ethiopian',
        data.marital_status || 'Single',
        data.photo_url || '',
        data.email,
        data.mobile_number || '',
        data.office_phone || '',
        data.extension || '',
        data.employment_type || 'Full-Time',
        data.job_title || 'Staff',
        data.position || 'Employee',
        data.hire_date || now.slice(0, 10),
        data.employment_status || 'Active',
        data.organization_id || 1,
        data.branch_id || 1,
        data.department_id || null,
        data.building_id || null,
        data.floor_number || '',
        data.office_number || '',
        data.manager_id || null,
        data.emergency_contact_name || '',
        data.emergency_contact_relation || '',
        data.emergency_contact_phone || '',
        data.is_host_enabled !== false ? 1 : 0,
        data.max_visitors_per_day || 10,
        data.max_concurrent_visitors || 3,
        data.default_room_id || null,
        data.default_approval_role || 'Host',
        data.availability_status || 'Available',
        now, now
      ]
    );

    const employeeId = result.insertId;
    await dbClient.query(`UPDATE employees SET employee_id = ? WHERE id = ?`, [employeeId, employeeId]);
    return employeeId;
  }

  async update(id, data) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await db.query(
      `UPDATE employees SET
        first_name = COALESCE(?, first_name),
        middle_name = COALESCE(?, middle_name),
        last_name = COALESCE(?, last_name),
        full_name = COALESCE(?, full_name),
        gender = COALESCE(?, gender),
        dob = COALESCE(?, dob),
        nationality = COALESCE(?, nationality),
        marital_status = COALESCE(?, marital_status),
        photo_url = COALESCE(?, photo_url),
        email = COALESCE(?, email),
        mobile_number = COALESCE(?, mobile_number),
        office_phone = COALESCE(?, office_phone),
        extension = COALESCE(?, extension),
        employment_type = COALESCE(?, employment_type),
        job_title = COALESCE(?, job_title),
        position = COALESCE(?, position),
        hire_date = COALESCE(?, hire_date),
        employment_status = COALESCE(?, employment_status),
        organization_id = COALESCE(?, organization_id),
        branch_id = COALESCE(?, branch_id),
        department_id = COALESCE(?, department_id),
        building_id = COALESCE(?, building_id),
        floor_number = COALESCE(?, floor_number),
        office_number = COALESCE(?, office_number),
        manager_id = COALESCE(?, manager_id),
        emergency_contact_name = COALESCE(?, emergency_contact_name),
        emergency_contact_relation = COALESCE(?, emergency_contact_relation),
        emergency_contact_phone = COALESCE(?, emergency_contact_phone),
        is_host_enabled = COALESCE(?, is_host_enabled),
        max_visitors_per_day = COALESCE(?, max_visitors_per_day),
        max_concurrent_visitors = COALESCE(?, max_concurrent_visitors),
        default_room_id = COALESCE(?, default_room_id),
        default_approval_role = COALESCE(?, default_approval_role),
        availability_status = COALESCE(?, availability_status),
        updated_at = ?
       WHERE (id = ? OR employee_id = ?) AND deleted_at IS NULL`,
      [
        data.first_name, data.middle_name, data.last_name,
        data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : null,
        data.gender, data.dob, data.nationality, data.marital_status,
        data.photo_url, data.email, data.mobile_number, data.office_phone, data.extension,
        data.employment_type, data.job_title, data.position, data.hire_date,
        data.employment_status, data.organization_id, data.branch_id, data.department_id,
        data.building_id, data.floor_number, data.office_number, data.manager_id,
        data.emergency_contact_name, data.emergency_contact_relation, data.emergency_contact_phone,
        data.is_host_enabled !== undefined ? (data.is_host_enabled ? 1 : 0) : null,
        data.max_visitors_per_day, data.max_concurrent_visitors, data.default_room_id,
        data.default_approval_role, data.availability_status,
        now, id, id
      ]
    );

    if (data.photo_url !== undefined) {
      await db.query(
        `UPDATE users SET avatar_url = ?, profile_photo = ? WHERE id = (SELECT user_id FROM employees WHERE (id = ? OR employee_id = ?) LIMIT 1)`,
        [data.photo_url, data.photo_url, id, id]
      ).catch(() => {});
    }

    return this.findById(id);
  }

  async updateAvailability(id, availability_status) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    return db.query(
      `UPDATE employees SET availability_status = ?, updated_at = ? WHERE (id = ? OR employee_id = ?) AND deleted_at IS NULL`,
      [availability_status, now, id, id]
    );
  }

  async updateHostSettings(id, settings) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    return db.query(
      `UPDATE employees SET
        is_host_enabled = ?,
        max_visitors_per_day = ?,
        max_concurrent_visitors = ?,
        default_room_id = ?,
        default_approval_role = ?,
        updated_at = ?
       WHERE (id = ? OR employee_id = ?) AND deleted_at IS NULL`,
      [
        settings.is_host_enabled ? 1 : 0,
        settings.max_visitors_per_day || 10,
        settings.max_concurrent_visitors || 3,
        settings.default_room_id || null,
        settings.default_approval_role || 'Host',
        now, id, id
      ]
    );
  }

  async updateStatus(id, employment_status) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    return db.query(
      `UPDATE employees SET employment_status = ?, updated_at = ? WHERE (id = ? OR employee_id = ?) AND deleted_at IS NULL`,
      [employment_status, now, id, id]
    );
  }

  async archive(id) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const isNum = !isNaN(Number(id)) && Number(id) > 0;
    const numId = isNum ? Number(id) : null;
    const strId = String(id);
    return db.query(
      `UPDATE employees SET archived_at = ?, employment_status = 'Inactive', is_host_enabled = 0, updated_at = ? WHERE (id = ? OR employee_id = ? OR employee_number = ?) AND deleted_at IS NULL`,
      [now, now, numId, numId, strId]
    );
  }

  async restore(id) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const isNum = !isNaN(Number(id)) && Number(id) > 0;
    const numId = isNum ? Number(id) : null;
    const strId = String(id);
    return db.query(
      `UPDATE employees SET archived_at = NULL, employment_status = 'Active', updated_at = ? WHERE (id = ? OR employee_id = ? OR employee_number = ?) AND deleted_at IS NULL`,
      [now, numId, numId, strId]
    );
  }

  async softDelete(id) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const isNum = !isNaN(Number(id)) && Number(id) > 0;
    const numId = isNum ? Number(id) : null;
    const strId = String(id);
    const ts = Date.now();
    try {
      if (db.mockDb && Array.isArray(db.mockDb.employees)) {
        const idx = db.mockDb.employees.findIndex(e => e.id == id || e.employee_id == id || e.employee_number == id);
        if (idx !== -1) {
          db.mockDb.employees[idx].deleted_at = now;
          db.mockDb.employees[idx].employment_status = 'Inactive';
          db.mockDb.employees[idx].is_host_enabled = false;
        }
      }
    } catch (_) {}

    // Find employee first to get user_id and email
    const rows = await db.query(
      `SELECT id, user_id, email FROM employees WHERE (id = ? OR employee_id = ? OR employee_number = ?)`,
      [numId, numId, strId]
    ).catch(() => []);
    const emp = rows && rows[0];

    if (emp) {
      if (emp.user_id && Number(emp.user_id) !== 1) {
        await db.query(
          `UPDATE users 
           SET email = CONCAT('deleted_${ts}_', email),
               username = CONCAT('deleted_${ts}_', username),
               user_code = CONCAT('DEL_', id, '_', UNIX_TIMESTAMP(), '_', user_code),
               deleted_at = CURRENT_TIMESTAMP,
               account_status = 'ARCHIVED',
               status = 'archived',
               is_active = 0
           WHERE id = ?`,
          [emp.user_id]
        ).catch(() => {});

        await db.query(
          `UPDATE manager_profiles 
           SET manager_number = CONCAT('DEL_', id, '_', UNIX_TIMESTAMP(), '_', manager_number)
           WHERE user_id = ?`,
          [emp.user_id]
        ).catch(() => {});

        await db.query(
          `UPDATE user_roles SET is_active = 0, deleted_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
          [emp.user_id]
        ).catch(() => {});
      }

      if (Number(emp.id) === 1) {
        return db.query(
          `UPDATE employees 
           SET deleted_at = ?,
               employment_status = 'Inactive',
               is_host_enabled = 0 
           WHERE id = ?`,
          [now, emp.id]
        );
      }

      return db.query(
        `UPDATE employees 
         SET deleted_at = ?,
             email = CONCAT('deleted_${ts}_', email),
             employee_number = CONCAT('DEL_', id, '_', UNIX_TIMESTAMP(), '_', employee_number),
             employment_status = 'Inactive',
             is_host_enabled = 0 
         WHERE id = ?`,
        [now, emp.id]
      );
    }

    if (numId === 1) {
      return db.query(
        `UPDATE employees 
         SET deleted_at = ?, 
             employment_status = 'Inactive', 
             is_host_enabled = 0 
         WHERE (id = 1 OR employee_id = 1)`,
        [now]
      );
    }

    return db.query(
      `UPDATE employees 
       SET deleted_at = ?, 
           email = CONCAT('deleted_${ts}_', email),
           employee_number = CONCAT('DEL_', id, '_', UNIX_TIMESTAMP(), '_', employee_number),
           employment_status = 'Inactive', 
           is_host_enabled = 0 
       WHERE (id = ? OR employee_id = ? OR employee_number = ?)`,
      [now, numId, numId, strId]
    );
  }

  async delete(id) {
    return this.softDelete(id);
  }

  // ── Statistics & Analytics ──────────────────────────────────────────────────

  async getStatsByDepartment() {
    return db.query(
      `SELECT d.name as label, COUNT(e.id) as value
       FROM employees e
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.deleted_at IS NULL AND e.archived_at IS NULL
         AND (LOWER(COALESCE(u.role, 'employee')) IN ('employee', 'staff'))
         AND LOWER(COALESCE(u.role, '')) NOT IN ('admin', 'manager', 'department_manager', 'receptionist', 'security', 'security_officer', 'visitor')
         AND (e.employee_number IS NULL OR (e.employee_number NOT LIKE 'ADM%' AND e.employee_number NOT LIKE 'MGR%' AND e.employee_number NOT LIKE 'REC%' AND e.employee_number NOT LIKE 'SEC%' AND e.employee_number NOT LIKE 'VIS%'))
       GROUP BY e.department_id, d.name
       ORDER BY value DESC`,
      []
    );
  }

  async getStatsByBranch() {
    return db.query(
      `SELECT b.branch_name as label, COUNT(e.id) as value
       FROM employees e
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN organization_branches b ON e.branch_id = b.id
       WHERE e.deleted_at IS NULL AND e.archived_at IS NULL
         AND (LOWER(COALESCE(u.role, 'employee')) IN ('employee', 'staff'))
         AND LOWER(COALESCE(u.role, '')) NOT IN ('admin', 'manager', 'department_manager', 'receptionist', 'security', 'security_officer', 'visitor')
         AND (e.employee_number IS NULL OR (e.employee_number NOT LIKE 'ADM%' AND e.employee_number NOT LIKE 'MGR%' AND e.employee_number NOT LIKE 'REC%' AND e.employee_number NOT LIKE 'SEC%' AND e.employee_number NOT LIKE 'VIS%'))
       GROUP BY e.branch_id, b.branch_name
       ORDER BY value DESC`,
      []
    );
  }

  async getStatsByStatus() {
    return db.query(
      `SELECT e.employment_status as label, COUNT(*) as value
       FROM employees e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.deleted_at IS NULL AND e.archived_at IS NULL
         AND (LOWER(COALESCE(u.role, 'employee')) IN ('employee', 'staff'))
         AND LOWER(COALESCE(u.role, '')) NOT IN ('admin', 'manager', 'department_manager', 'receptionist', 'security', 'security_officer', 'visitor')
         AND (e.employee_number IS NULL OR (e.employee_number NOT LIKE 'ADM%' AND e.employee_number NOT LIKE 'MGR%' AND e.employee_number NOT LIKE 'REC%' AND e.employee_number NOT LIKE 'SEC%' AND e.employee_number NOT LIKE 'VIS%'))
       GROUP BY e.employment_status`,
      []
    );
  }

  async getStatsByAvailability() {
    return db.query(
      `SELECT e.availability_status as label, COUNT(*) as value
       FROM employees e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.deleted_at IS NULL AND e.archived_at IS NULL AND e.employment_status = 'Active'
         AND (LOWER(COALESCE(u.role, 'employee')) IN ('employee', 'staff'))
         AND LOWER(COALESCE(u.role, '')) NOT IN ('admin', 'manager', 'department_manager', 'receptionist', 'security', 'security_officer', 'visitor')
         AND (e.employee_number IS NULL OR (e.employee_number NOT LIKE 'ADM%' AND e.employee_number NOT LIKE 'MGR%' AND e.employee_number NOT LIKE 'REC%' AND e.employee_number NOT LIKE 'SEC%' AND e.employee_number NOT LIKE 'VIS%'))
       GROUP BY e.availability_status`,
      []
    );
  }

  async getOverallCounts() {
    const rows = await db.query(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN (LOWER(e.employment_status) IN ('active', 'full_time', 'full-time', 'part_time') OR e.employment_status IS NULL) AND e.archived_at IS NULL THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN LOWER(e.employment_status) IN ('inactive','terminated') AND e.archived_at IS NULL THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN e.is_host_enabled = 1 AND (LOWER(e.availability_status) = 'available' OR e.availability_status IS NULL) AND (LOWER(e.employment_status) IN ('active', 'full_time', 'full-time', 'part_time') OR e.employment_status IS NULL) AND e.archived_at IS NULL THEN 1 ELSE 0 END) as available_hosts,
        SUM(CASE WHEN LOWER(e.availability_status) = 'on leave' AND e.archived_at IS NULL THEN 1 ELSE 0 END) as on_leave,
        SUM(CASE WHEN e.archived_at IS NOT NULL THEN 1 ELSE 0 END) as archived,
        COUNT(DISTINCT e.department_id) as total_departments,
        COUNT(DISTINCT e.branch_id) as total_branches
       FROM employees e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.deleted_at IS NULL
         AND (LOWER(COALESCE(u.role, 'employee')) IN ('employee', 'staff'))
         AND LOWER(COALESCE(u.role, '')) NOT IN ('admin', 'manager', 'department_manager', 'receptionist', 'security', 'security_officer', 'visitor')
         AND (e.employee_number IS NULL OR (e.employee_number NOT LIKE 'ADM%' AND e.employee_number NOT LIKE 'MGR%' AND e.employee_number NOT LIKE 'REC%' AND e.employee_number NOT LIKE 'SEC%' AND e.employee_number NOT LIKE 'VIS%'))`,
      []
    );
    return rows[0] || {};
  }

  async getNewEmployeesThisMonth() {
    const rows = await db.query(
      `SELECT COUNT(*) as count FROM employees e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE MONTH(e.created_at) = MONTH(CURDATE()) AND YEAR(e.created_at) = YEAR(CURDATE()) AND e.deleted_at IS NULL
         AND (LOWER(COALESCE(u.role, 'employee')) IN ('employee', 'staff'))
         AND LOWER(COALESCE(u.role, '')) NOT IN ('admin', 'manager', 'department_manager', 'receptionist', 'security', 'security_officer', 'visitor')
         AND (e.employee_number IS NULL OR (e.employee_number NOT LIKE 'ADM%' AND e.employee_number NOT LIKE 'MGR%' AND e.employee_number NOT LIKE 'REC%' AND e.employee_number NOT LIKE 'SEC%' AND e.employee_number NOT LIKE 'VIS%'))`,
      []
    );
    return (rows[0] || {}).count || 0;
  }

  async seedInitialEmployees() {
    try {
      const rows = await db.query(`SELECT COUNT(*) as count FROM employees`);
      if (rows[0] && Number(rows[0].count) > 0) return;

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const samples = [
        ['EMP-2026-0001', 'System', '', 'Admin', 'System Admin', 'Male', '1985-05-12', 'Ethiopian', 'Married', 'admin@visitor.com', '+251911000111', '+251111000111', '101', 'Full-Time', 'System Administrator', 'Lead Admin', '2020-01-15', 'Active', 1, 1, 1, 1, '5', '501', 'Helen Admin', 'Spouse', '+251911999888', 1, 20, 5, 'Host', 'Available', now, now],
        ['EMP-2026-0002', 'Sarah', 'M.', 'Johnson', 'Sarah Johnson', 'Female', '1990-08-22', 'American', 'Single', 'sarah.j@visitor.com', '+1-555-0101', '+1-555-0201', '201', 'Full-Time', 'Sales Director', 'Director', '2021-03-01', 'Active', 1, 1, 2, 1, '3', '304', 'Mark Johnson', 'Brother', '+1-555-9999', 1, 15, 4, 'Host', 'Available', now, now],
        ['EMP-2026-0003', 'Michael', 'K.', 'Chen', 'Michael Chen', 'Male', '1992-11-10', 'Canadian', 'Married', 'michael.c@visitor.com', '+1-555-0102', '+1-555-0202', '202', 'Full-Time', 'Account Manager', 'Senior Lead', '2022-06-15', 'Active', 1, 1, 2, 1, '3', '308', 'Grace Chen', 'Spouse', '+1-555-8888', 1, 10, 3, 'Host', 'In Meeting', now, now],
        ['EMP-2026-0004', 'Emily', 'A.', 'Davis', 'Emily Davis', 'Female', '1988-04-18', 'British', 'Married', 'emily.d@visitor.com', '+1-555-0103', '+1-555-0203', '301', 'Full-Time', 'Finance Manager', 'Department Head', '2019-11-01', 'Active', 1, 1, 3, 1, '4', '402', 'Oliver Davis', 'Spouse', '+1-555-7777', 1, 8, 2, 'Department Manager', 'On Leave', now, now],
        ['EMP-2026-0005', 'James', 'R.', 'Wilson', 'James Wilson', 'Male', '1991-09-05', 'Ethiopian', 'Single', 'james.w@visitor.com', '+1-555-0104', '+1-555-0204', '401', 'Full-Time', 'Operations Lead', 'Lead', '2021-08-20', 'Active', 1, 1, 4, 1, '2', '205', 'David Wilson', 'Father', '+1-555-6666', 1, 12, 3, 'Host', 'Available', now, now]
      ];

      for (const s of samples) {
        await db.query(
          `INSERT INTO employees (
            employee_number, first_name, middle_name, last_name, full_name,
            gender, dob, nationality, marital_status, email, mobile_number,
            office_phone, extension, employment_type, job_title, position,
            hire_date, employment_status, organization_id, branch_id,
            department_id, building_id, floor_number, office_number,
            emergency_contact_name, emergency_contact_relation,
            emergency_contact_phone, is_host_enabled, max_visitors_per_day,
            max_concurrent_visitors, default_approval_role, availability_status,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          s
        );
      }
      console.log('Seeded 5 initial employee records into MySQL database successfully.');
    } catch (err) {
      console.warn('Employee auto-seeding note:', err.message);
    }
  }
}

module.exports = new EmployeeRepository();
