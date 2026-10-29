const employeeRepository = require('../repositories/employee.repository');
const userRepository = require('../../user-management/repositories/user.repository');
const environment = require('../../../config/environment');
const { generateTemporaryPassword } = require('../../../utils/passwordGenerator');
const emailService = require('../../notifications/services/email.service');
const bcrypt = require('bcryptjs');
const db = require('../../../config/db');

const VALID_USER_ROLES = ['admin', 'employee', 'staff', 'manager', 'receptionist', 'security_officer', 'visitor'];

// ─── Audit Logging Helper ────────────────────────────────────────────────────
async function recordAudit(action, entityId, actorId, actorName, details = {}) {
  try {
    const jsonDetails = JSON.stringify({ actor_name: actorName || 'System', ...details });
    await db.query(
      `INSERT INTO audit_logs (action, module, table_name, entity, record_id, actor_id, metadata_json, created_at)
       VALUES (?, 'EMPLOYEE_MANAGEMENT', 'employees', 'Employee', ?, ?, ?, NOW())`,
      [action, entityId, actorId || null, jsonDetails]
    );
  } catch (_) {
    // Audit log failures must not break the main operation
  }
}

function formatDateForDb(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function normalizeUserRole(rawRole) {
  const role = String(rawRole || 'employee').trim().toLowerCase();
  if (role === 'host' || role === 'staff') return 'employee';
  return VALID_USER_ROLES.includes(role) ? role : 'employee';
}

class EmployeeService {
  async listEmployees(filters) {
    return employeeRepository.findAll(filters);
  }

  async getEmployee(id, includeDeleted = false) {
    let employee = await employeeRepository.findById(id, includeDeleted);
    if (!employee) {
      employee = await employeeRepository.findById(id, true);
    }
    if (!employee) {
      const err = new Error(`Employee with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }
    return employee;
  }

  async getMyProfile(userId) {
    let employee = await employeeRepository.findByUserId(userId);
    if (!employee) {
      const [empRow] = await db.query(
        `SELECT id FROM employees WHERE user_id = ? LIMIT 1`,
        [userId]
      ).catch(() => []);
      if (empRow && empRow.id) {
        await db.query(
          `UPDATE employees SET deleted_at = NULL, archived_at = NULL, employment_status = 'Active' WHERE id = ?`,
          [empRow.id]
        );
        employee = await employeeRepository.findById(empRow.id);
      }
    }
    if (!employee) {
      const user = await userRepository.findById(userId);
      if (user) {
        const empNum = await employeeRepository.generateNextEmployeeNumber('EMP');
        await db.query(
          `INSERT INTO employees (user_id, employee_number, employee_code, first_name, last_name, full_name, email, employment_status, is_host_enabled, department_id, organization_id, branch_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', 1, 1, 1, 1)`,
          [user.id, empNum, empNum, user.firstName || 'Employee', user.lastName || 'Staff', user.fullName || 'Employee Staff', user.email]
        ).catch(() => {});
        employee = await employeeRepository.findByUserId(userId);
      }
    }
    if (!employee) {
      const err = new Error('No employee profile linked to this user account.');
      err.statusCode = 404;
      throw err;
    }
    return employee;
  }

  async onboardEmployee(data, actorId, actorName) {
    if (!data.first_name || !data.first_name.trim()) {
      data.first_name = 'Employee';
    }
    if (!data.last_name || !data.last_name.trim()) {
      data.last_name = 'Record';
    }

    // Validate Corporate Email
    if (!data.email || !data.email.trim()) {
      const err = new Error('Corporate email address is required.');
      err.statusCode = 400;
      throw err;
    }

    const cleanMail = data.email.trim().toLowerCase();
    const existingEmail = await employeeRepository.findByEmail(cleanMail);
    if (existingEmail) {
      const err = new Error(`Email address '${cleanMail}' is already registered to another employee.`);
      err.statusCode = 409;
      throw err;
    }

    const existingUser = await userRepository.findByEmail(cleanMail);
    if (existingUser) {
      const err = new Error(`Email address '${cleanMail}' is already registered to another user account.`);
      err.statusCode = 409;
      throw err;
    }

    // Free legacy deleted records with this email
    const db = require('../../../config/db');
    await db.query(
      `UPDATE employees 
       SET email = CONCAT('deleted_', id, '_', UNIX_TIMESTAMP(), '_', email)
       WHERE LOWER(email) = LOWER(?) AND (deleted_at IS NOT NULL OR employment_status = 'Inactive')`,
      [cleanMail]
    ).catch(() => {});
    await db.query(
      `UPDATE users 
       SET email = CONCAT('deleted_', id, '_', UNIX_TIMESTAMP(), '_', email),
           username = CONCAT('deleted_', id, '_', UNIX_TIMESTAMP(), '_', username)
       WHERE LOWER(email) = LOWER(?) AND (deleted_at IS NOT NULL OR account_status IN ('ARCHIVED', 'DELETED') OR status IN ('archived', 'deleted'))`,
      [cleanMail]
    ).catch(() => {});

    data.email = cleanMail;

    // Auto-generate employee number if not provided or if duplicate exists in DB
    if (!data.employee_number || !data.employee_number.trim()) {
      data.employee_number = await employeeRepository.generateNextEmployeeNumber('EMP');
    } else {
      const trimmedNum = data.employee_number.trim();
      const existingInEmp = await employeeRepository.existsByEmployeeNumber(trimmedNum);
      const [existingInUser] = await db.query(
        `SELECT id FROM users WHERE user_code = ? LIMIT 1`,
        [trimmedNum]
      ).catch(() => []);

      if (existingInEmp || existingInUser) {
        data.employee_number = await employeeRepository.generateNextEmployeeNumber('EMP');
      } else {
        data.employee_number = trimmedNum;
      }
    }

    const userRole = normalizeUserRole(data.role);
    const tempPassword = generateTemporaryPassword();
    const tempHash = await bcrypt.hash(tempPassword, 12);
    const tempCreatedAt = new Date();
    const tempExpiresAt = new Date(
      tempCreatedAt.getTime() + environment.TEMP_PASSWORD_EXPIRATION_HOURS * 60 * 60 * 1000
    );

    // Atomically create the linked user account AND the employee. If either fails,
    // the transaction rolls back so no partial account is left behind.
    const { employeeId, userId, userCode } = await db.transaction(async (conn) => {
      const newUserId = await userRepository.create(
        {
          username: data.email.split('@')[0],
          email: data.email.trim().toLowerCase(),
          passwordHash: tempHash,
          firstName: data.first_name,
          lastName: data.last_name,
          fullName: `${data.first_name} ${data.last_name}`.trim(),
          phone: data.mobile_number || data.phone || null,
          role: userRole,
          departmentId: data.department_id || null,
          jobTitle: data.job_title || 'Staff',
          firstLoginRequired: true,
          userCode: data.employee_number,
        },
        conn
      );

      const newEmployeeId = await employeeRepository.create(
        { ...data, user_id: newUserId },
        conn
      );

      const userRows = await conn.query(
        `SELECT user_code FROM users WHERE id = ?`,
        [newUserId]
      );
      const newUserCode = userRows && userRows[0] ? userRows[0].user_code : null;

      // Stamp temporary-credential lifecycle fields + employee linkage on the user account
      await conn.query(
        `UPDATE users SET
           employee_id = ?,
           organization_id = ?,
           branch_id = ?,
           temporary_password_created_at = ?,
           temporary_password_expires_at = ?
         WHERE id = ?`,
        [
          newEmployeeId,
          data.organization_id || null,
          data.branch_id || null,
          formatDateForDb(tempCreatedAt),
          formatDateForDb(tempExpiresAt),
          newUserId,
        ]
      );

      return { employeeId: newEmployeeId, userId: newUserId, userCode: newUserCode };
    });

    // Best-effort RBAC role assignment
    try {
      const roleLower = String(userRole || 'staff').trim().toLowerCase();
      let targetCode = 'EMPLOYEE';
      if (['admin', 'administrator'].includes(roleLower)) targetCode = 'ADMIN';
      else if (['employee', 'staff', 'host'].includes(roleLower)) targetCode = 'EMPLOYEE';
      else if (['receptionist'].includes(roleLower)) targetCode = 'RECEPTIONIST';
      else if (['security', 'security_officer'].includes(roleLower)) targetCode = 'SECURITY';
      else if (['visitor'].includes(roleLower)) targetCode = 'VISITOR';
      else if (['manager', 'department_manager'].includes(roleLower)) targetCode = 'MANAGER';

      const roleRows = await db.query(
        `SELECT id FROM roles WHERE (UPPER(role_code) = ? OR LOWER(role_code) = ? OR LOWER(role_name) = ? OR LOWER(name) = ?) AND deleted_at IS NULL LIMIT 1`,
        [targetCode, roleLower, roleLower, roleLower]
      );
      if (roleRows && roleRows[0]) {
        await db.query(
          `INSERT INTO user_roles (user_id, role_id, is_active, created_at, assigned_at) VALUES (?, ?, TRUE, CURRENT_TIMESTAMP, NOW())
           ON DUPLICATE KEY UPDATE is_active = 1, deleted_at = NULL, role_id = VALUES(role_id)`,
          [userId, roleRows[0].id]
        );
      }
    } catch (_) {}

    const employee = await employeeRepository.findById(employeeId);

    // Send the registration credentials email (best-effort; failures are recorded)
    let emailResult = null;
    let emailStatus = 'NOT_SENT';
    try {
      emailResult = await emailService.sendRegistrationCredentials({
        to: employee.email,
        fullName: employee.full_name,
        userCode,
        temporaryPassword: tempPassword,
        loginUrl: (process.env.CLIENT_URL || 'http://localhost:5173') + '/login',
      });
      emailStatus = emailResult && emailResult.deliveredToInbox ? 'SENT' : 'FAILED';
    } catch (emailErr) {
      emailResult = { status: 'error', error: emailErr.message };
      emailStatus = 'FAILED';
    }

    await recordAudit('EMPLOYEE_CREATED', employeeId, actorId, actorName, {
      employee_number: employee.employee_number,
      name: employee.full_name,
      email: employee.email,
    });
    await recordAudit('USER_ACCOUNT_CREATED', employeeId, actorId, actorName, {
      user_id: userId,
      user_code: userCode,
      role: userRole,
      first_login_required: true,
    });

    if (emailStatus === 'SENT') {
      await recordAudit('REGISTRATION_EMAIL_SENT', employeeId, actorId, actorName, {
        to: employee.email,
        user_code: userCode,
      });
    } else {
      const reason = (emailResult && emailResult.error) || (emailResult && emailResult.message) || 'Email dispatch unavailable';
      await recordAudit('REGISTRATION_EMAIL_FAILED', employeeId, actorId, actorName, {
        to: employee.email,
        reason,
      });
    }

    return {
      employee,
      registration: {
        userId,
        userCode,
        email: employee.email,
        emailStatus,
        emailDeliveredToInbox: emailResult ? !!emailResult.deliveredToInbox : false,
        etherealUrl: emailResult ? emailResult.etherealUrl : null,
        emailError: emailResult && emailResult.error ? emailResult.error : null,
        temporaryPasswordExpiresAt: formatDateForDb(tempExpiresAt),
      },
    };
  }

  /**
   * Re-issues a fresh temporary password for an employee's linked user account and
   * emails it to them. Used by admins when the initial registration email was missed
   * or the temporary password expired.
   */
  async resendRegistrationEmail(employeeId, actorId, actorName) {
    let employee = await this.getEmployee(employeeId, true).catch(() => null);
    if (!employee) {
      employee = await employeeRepository.findById(employeeId, true);
    }
    if (!employee) {
      const err = new Error(`Employee with ID ${employeeId} not found.`);
      err.statusCode = 404;
      throw err;
    }

    let cleanEmail = (employee.email || employee.userEmail || '').replace(/^deleted_\d+_/, '').trim();
    if (!cleanEmail) {
      cleanEmail = `emp_${employee.id || employeeId}@visitor.com`;
    }

    let linkedUser = null;
    if (employee.user_id) {
      linkedUser = await userRepository.findById(employee.user_id);
    }
    if (!linkedUser) {
      linkedUser = await userRepository.findByEmail(cleanEmail.toLowerCase());
    }
    if (!linkedUser) {
      const [u] = await db.query(
        `SELECT * FROM users WHERE id = ? OR LOWER(email) = LOWER(?) OR email LIKE ? LIMIT 1`,
        [employee.user_id || 0, cleanEmail, `%${cleanEmail}%`]
      );
      linkedUser = u || null;
    }

    if (!linkedUser) {
      const userCode = `USR-${Date.now().toString().slice(-6)}`;
      const fullName = employee.full_name || `${employee.first_name || 'Staff'} ${employee.last_name || 'Member'}`.trim();
      const insertResult = await db.query(
        `INSERT INTO users (user_code, username, email, full_name, role, department_id, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [userCode, cleanEmail.split('@')[0], cleanEmail, fullName, 'employee', employee.department_id || 1]
      );
      const newUserId = insertResult.insertId;
      await db.query(`UPDATE employees SET user_id = ? WHERE id = ?`, [newUserId, employee.id]);
      linkedUser = await userRepository.findById(newUserId);
    }

    if (linkedUser && (linkedUser.deleted_at || linkedUser.is_active === 0 || linkedUser.account_status === 'ARCHIVED')) {
      await db.query(
        `UPDATE users SET is_active = 1, deleted_at = NULL, account_status = 'ACTIVE', status = 'active', email = ? WHERE id = ?`,
        [cleanEmail, linkedUser.id]
      ).catch(() => {});
    }
    if (employee.deleted_at) {
      await db.query(
        `UPDATE employees SET deleted_at = NULL, archived_at = NULL, employment_status = 'Active', email = ? WHERE id = ?`,
        [cleanEmail, employee.id]
      ).catch(() => {});
    }

    const tempPassword = generateTemporaryPassword();
    const tempHash = await bcrypt.hash(tempPassword, 12);
    const tempCreatedAt = new Date();
    const tempExpiresAt = new Date(
      tempCreatedAt.getTime() + environment.TEMP_PASSWORD_EXPIRATION_HOURS * 60 * 60 * 1000
    );

    await db.transaction(async (conn) => {
      const firstLoginRequired = Number(linkedUser.id) === 1 ? 0 : 1;
      await conn.query(
        `UPDATE users SET
           password_hash = ?,
           first_login_required = ?,
           temporary_password_created_at = ?,
           temporary_password_expires_at = ?,
           failed_login_attempts = 0,
           account_locked_until = NULL,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          tempHash,
          firstLoginRequired,
          formatDateForDb(tempCreatedAt),
          formatDateForDb(tempExpiresAt),
          linkedUser.id,
        ]
      );
      if (Number(linkedUser.id) !== 1) {
        await conn.query(`DELETE FROM user_sessions WHERE user_id = ?`, [linkedUser.id]);
      }
    });

    const userCode = linkedUser.userCode || linkedUser.user_code || employee.employee_number || `EMP-${employee.id}`;
    if (!linkedUser.userCode && !linkedUser.user_code) {
      await db.query(`UPDATE users SET user_code = ? WHERE id = ?`, [userCode, linkedUser.id]).catch(() => {});
    }

    let emailResult = null;
    let emailStatus = 'NOT_SENT';
    try {
      emailResult = await emailService.sendRegistrationCredentials({
        to: linkedUser.email,
        fullName: linkedUser.fullName || linkedUser.full_name || employee.full_name,
        userCode: userCode,
        temporaryPassword: tempPassword,
        loginUrl: (process.env.CLIENT_URL || 'http://localhost:5173') + '/login',
      });
      emailStatus = emailResult && (emailResult.deliveredToInbox || emailResult.status === 'success') ? 'SENT' : 'FAILED';
    } catch (emailErr) {
      emailResult = { status: 'error', error: emailErr.message };
      emailStatus = 'FAILED';
    }

    await recordAudit('REGISTRATION_CREDENTIALS_RESENT', employeeId, actorId, actorName, {
      user_id: linkedUser.id,
      to: linkedUser.email,
      emailStatus,
    });

    if (emailStatus === 'SENT') {
      await recordAudit('REGISTRATION_EMAIL_SENT', employeeId, actorId, actorName, {
        to: linkedUser.email,
        user_code: linkedUser.userCode || linkedUser.user_code,
      });
    }

    return {
      success: true,
      message:
        emailStatus === 'SENT'
          ? 'Registration credentials have been sent to the employee email.'
          : 'Credentials regenerated but the email could not be delivered. Check the audit log.',
      registration: {
        userId: linkedUser.id,
        userCode: linkedUser.userCode || linkedUser.user_code,
        email: linkedUser.email,
        emailStatus,
        emailDeliveredToInbox: emailResult ? !!emailResult.deliveredToInbox : false,
        etherealUrl: emailResult ? emailResult.etherealUrl : null,
        emailError: emailResult && emailResult.error ? emailResult.error : null,
        temporaryPasswordExpiresAt: formatDateForDb(tempExpiresAt),
      },
    };
  }

  async updateEmployee(id, data, actorId, actorName) {
    await this.getEmployee(id);

    // Check email uniqueness if email is being changed
    if (data.email) {
      const existing = await employeeRepository.findByEmail(data.email.trim());
      if (existing && existing.id !== Number(id)) {
        const err = new Error(`Email '${data.email}' is already used by another employee.`);
        err.statusCode = 409;
        throw err;
      }
    }

    const updated = await employeeRepository.update(id, data);
    await recordAudit('EMPLOYEE_UPDATED', id, actorId, actorName, { updated_fields: Object.keys(data) });
    return updated;
  }

  async updateAvailability(id, availability_status, actorId, actorName) {
    await this.getEmployee(id);
    await employeeRepository.updateAvailability(id, availability_status);
    await recordAudit('AVAILABILITY_UPDATED', id, actorId, actorName, { availability_status });
    return { id, availability_status };
  }

  async updateHostSettings(id, hostSettings, actorId, actorName) {
    const emp = await this.getEmployee(id);
    if (hostSettings.is_host_enabled && emp.employment_status !== 'Active') {
      const err = new Error('Only active employees can be enabled as Hosts.');
      err.statusCode = 400;
      throw err;
    }
    await employeeRepository.updateHostSettings(id, hostSettings);
    const action = hostSettings.is_host_enabled ? 'HOST_ENABLED' : 'HOST_DISABLED';
    await recordAudit(action, id, actorId, actorName, { ...hostSettings });
    return this.getEmployee(id);
  }

  async updateStatus(id, employment_status, actorId, actorName, reason = '') {
    const emp = await this.getEmployee(id);
    await employeeRepository.updateStatus(id, employment_status);
    if (employment_status !== 'Active') {
      await employeeRepository.updateHostSettings(id, { ...emp, is_host_enabled: false });
    }
    const action = employment_status === 'Active' ? 'EMPLOYEE_ACTIVATED' : 'EMPLOYEE_DEACTIVATED';
    await recordAudit(action, id, actorId, actorName, { employment_status, reason });
    return { id, employment_status, reason };
  }

  async archiveEmployee(id, actorId, actorName) {
    const emp = await this.getEmployee(id);
    await employeeRepository.archive(id);
    if (emp && emp.user_id) {
      await db.query(`UPDATE user_roles SET is_active = 0, deleted_at = CURRENT_TIMESTAMP WHERE user_id = ?`, [emp.user_id]).catch(() => {});
    }
    await recordAudit('EMPLOYEE_ARCHIVED', id, actorId, actorName, {});
    return { success: true };
  }

  async restoreEmployee(id, actorId, actorName) {
    const rows = await db.query(
      `SELECT * FROM employees WHERE (id = ? OR employee_id = ?) LIMIT 1`,
      [id, id]
    );
    if (!rows[0]) {
      const err = new Error('Employee not found.');
      err.statusCode = 404;
      throw err;
    }
    await db.query(
      `UPDATE employees SET archived_at = NULL, deleted_at = NULL, employment_status = 'Active' WHERE id = ?`,
      [rows[0].id]
    );
    await employeeRepository.restore(id).catch(() => {});
    if (rows[0] && rows[0].user_id) {
      await db.query(`UPDATE user_roles SET is_active = 1, deleted_at = NULL WHERE user_id = ?`, [rows[0].user_id]).catch(() => {});
      await db.query(`UPDATE users SET account_status = 'ACTIVE', status = 'active', is_active = 1, deleted_at = NULL WHERE id = ?`, [rows[0].user_id]).catch(() => {});
    }
    await recordAudit('EMPLOYEE_RESTORED', id, actorId, actorName, {});
    return { success: true };
  }

  async deleteEmployee(id, actorId, actorName) {
    await this.getEmployee(id);
    await employeeRepository.softDelete(id);
    await recordAudit('EMPLOYEE_DELETED', id, actorId, actorName, {});
    return { success: true };
  }

  async getDashboardStats() {
    const [counts, byDept, byBranch, byStatus, byAvailability, newCount] = await Promise.all([
      employeeRepository.getOverallCounts(),
      employeeRepository.getStatsByDepartment(),
      employeeRepository.getStatsByBranch(),
      employeeRepository.getStatsByStatus(),
      employeeRepository.getStatsByAvailability(),
      employeeRepository.getNewEmployeesThisMonth()
    ]);

    return {
      totalEmployees: Number(counts.total) || 0,
      activeEmployees: Number(counts.active) || 0,
      inactiveEmployees: Number(counts.inactive) || 0,
      availableHosts: Number(counts.available_hosts) || 0,
      employeesOnLeave: Number(counts.on_leave) || 0,
      newEmployees: Number(newCount) || 0,
      totalDepartments: Number(counts.total_departments) || 0,
      totalBranches: Number(counts.total_branches) || 0,
      archivedEmployees: Number(counts.archived) || 0,
      charts: {
        byDepartment: byDept,
        byBranch: byBranch,
        byStatus: byStatus,
        byAvailability: byAvailability
      }
    };
  }

  async getEmployeeAppointmentHistory(id) {
    let employee = await this.getEmployee(id, true).catch(() => null);
    if (!employee) {
      employee = await employeeRepository.findById(id, true);
    }
    const hostId = employee?.id || id;
    const rows = await db.query(
      `SELECT a.id, a.reference_code, a.appointment_status, a.scheduled_start, a.scheduled_end,
              a.purpose, v.full_name as visitor_name, v.company, v.email as visitor_email,
              d.name as department_name, r.name as room_name
       FROM appointments a
       LEFT JOIN visitors v ON a.visitor_id = v.id
       LEFT JOIN departments d ON a.department_id = d.id
       LEFT JOIN rooms r ON a.room_id = r.id
       WHERE a.host_id = ? AND a.deleted_at IS NULL
       ORDER BY a.scheduled_start DESC
       LIMIT 50`,
      [hostId]
    );
    return rows || [];
  }

  async bulkImport(employeeList, actorId, actorName) {
    let successCount = 0;
    let errors = [];

    for (const emp of employeeList) {
      try {
        await this.onboardEmployee(emp, actorId, actorName);
        successCount++;
      } catch (e) {
        errors.push(`Failed for ${emp.first_name || ''} ${emp.last_name || ''}: ${e.message}`);
      }
    }

    return { successCount, totalCount: employeeList.length, errors };
  }

  async getAuditLogs(limit = 50, employeeId = null) {
    try {
      let sql = `SELECT al.*, e.full_name as employee_name, e.employee_number, u.full_name as actor_name
         FROM audit_logs al
         LEFT JOIN employees e ON COALESCE(al.record_id, al.entity_id) = e.id
         LEFT JOIN users u ON COALESCE(al.actor_id, al.user_id) = u.id
         WHERE (al.module = 'EMPLOYEE_MANAGEMENT' OR al.entity IN ('Employee', 'employees'))`;
      const params = [];
      if (employeeId) {
        sql += ` AND (al.record_id = ? OR al.entity_id = ? OR e.id = ?)`;
        params.push(employeeId, employeeId, employeeId);
      }
      sql += ` ORDER BY al.created_at DESC LIMIT ?`;
      params.push(Number(limit) || 50);

      const rows = await db.query(sql, params);
      return (rows || []).map(r => {
        try {
          if (typeof r.metadata_json === 'string') r.metadata_json = JSON.parse(r.metadata_json);
        } catch (_) {}
        try {
          if (typeof r.new_values === 'string') r.new_values = JSON.parse(r.new_values);
        } catch (_) {}
        try {
          if (typeof r.old_values === 'string') r.old_values = JSON.parse(r.old_values);
        } catch (_) {}
        return r;
      });
    } catch (_) {
      try {
        const rows = await db.query(
          `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?`,
          [Number(limit) || 50]
        );
        return rows || [];
      } catch (__) {
        return [];
      }
    }
  }

  async createEmployee(data, actorId, actorName) {
    return this.onboardEmployee(data, actorId, actorName);
  }
}

module.exports = new EmployeeService();
