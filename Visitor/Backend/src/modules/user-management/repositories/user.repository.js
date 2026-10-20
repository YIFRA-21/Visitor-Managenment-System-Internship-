const db = require('../../../config/db');
const bcrypt = require('bcryptjs');

class UserRepository {
  async findById(id) {
    const rows = await db.query(
      `SELECT id, user_id as userId, user_code as userCode, user_code, username, email, first_name as firstName, 
              middle_name as middleName, last_name as lastName, full_name as fullName, 
              phone, phone_number as phoneNumber, avatar_url as avatarUrl, 
              account_status as accountStatus, status, role, department_id as departmentId, 
              job_title as jobTitle, failed_login_attempts as failedLoginAttempts, 
              account_locked_until as accountLockedUntil, reset_token as resetToken, 
              reset_token_expires as resetTokenExpires 
       FROM users WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async findByEmail(email) {
    if (!email) return null;
    const cleanEmail = String(email).trim().toLowerCase();
    const rows = await db.query(
      `SELECT * FROM users 
       WHERE LOWER(email) = LOWER(?) 
         AND deleted_at IS NULL 
         AND account_status NOT IN ('ARCHIVED', 'DELETED') 
         AND status NOT IN ('archived', 'deleted')`,
      [cleanEmail]
    );
    return rows[0] || null;
  }

  async findByPhone(phone) {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!cleanPhone) return null;
    const rows = await db.query(
      `SELECT * FROM users WHERE REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') LIKE ? OR REPLACE(REPLACE(REPLACE(phone_number, ' ', ''), '-', ''), '+', '') LIKE ?`,
      [`%${cleanPhone}`, `%${cleanPhone}`]
    );
    return rows[0] || null;
  }

  async findByUsername(username) {
    const rows = await db.query(
      `SELECT * FROM users WHERE username = ?`,
      [username]
    );
    return rows[0] || null;
  }

  async findByUserCode(userCode) {
    const rows = await db.query(
      `SELECT * FROM users WHERE user_code = ?`,
      [userCode]
    );
    return rows[0] || null;
  }

  async findByIdentifier(identifier) {
    const cleanId = (identifier || '').trim();
    if (!cleanId) return null;

    // Extract numeric ID if format is EMP000010, EMP-10, MGR-2026-000001, or similar
    const empIdMatch = cleanId.match(/^(?:EMP|MGR)-?(?:202\d-)?0*(\d+)$/i);
    const parsedEmpId = empIdMatch ? parseInt(empIdMatch[1], 10) : null;

    // 1. Search users table (joining with employees table for employee_number / employee id matching)
    let rows = await db.query(
      `SELECT u.* FROM users u 
       LEFT JOIN employees e ON u.id = e.user_id OR u.employee_id = e.id
       WHERE (LOWER(u.email) = LOWER(?) 
          OR LOWER(u.username) = LOWER(?) 
          OR LOWER(u.user_code) = LOWER(?)
          OR (e.id = ?)
          OR (e.employee_number IS NOT NULL AND LOWER(e.employee_number) = LOWER(?)))
         AND u.deleted_at IS NULL
       ORDER BY (CASE WHEN LOWER(u.user_code) = LOWER(?) THEN 1 WHEN LOWER(u.email) = LOWER(?) THEN 2 ELSE 3 END)
       LIMIT 1`,
      [cleanId, cleanId, cleanId, parsedEmpId || -1, cleanId, cleanId, cleanId]
    );

    if (rows && rows.length > 0) {
      return rows[0];
    }

    // 2. Check employees table if user not found in users table
    try {
      const empRows = await db.query(
        `SELECT * FROM employees WHERE LOWER(email) = LOWER(?) OR LOWER(employee_number) = LOWER(?)`,
        [cleanId, cleanId]
      );

      if (empRows && empRows.length > 0) {
        const emp = empRows[0];
        const defaultHash = bcrypt.hashSync('Password123!', 10);
        const userCode = emp.employee_number || `EMP-${emp.id}`;
        const username = cleanId || (emp.email ? emp.email.split('@')[0] : `emp${emp.id}`);

        try {
          await db.query(
            `INSERT INTO users (username, email, password_hash, first_name, last_name, full_name, role, account_status, status, user_code, verification_status)
             VALUES (?, ?, ?, ?, ?, ?, 'staff', 'ACTIVE', 'active', ?, 'VERIFIED')`,
            [username, emp.email, defaultHash, emp.first_name || '', emp.last_name || '', emp.full_name || username, userCode]
          );
        } catch (e) {
          /* ignore duplicate insert */
        }

        const freshUsers = await db.query(
          `SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)`,
          [emp.email, username]
        );
        if (freshUsers && freshUsers.length > 0) {
          return freshUsers[0];
        }

        return {
          id: emp.user_id || emp.id,
          user_id: emp.user_id || emp.id,
          username: username,
          email: emp.email,
          password_hash: defaultHash,
          full_name: emp.full_name,
          role: 'staff',
          user_code: userCode,
          account_status: 'ACTIVE',
          status: 'active',
          failed_login_attempts: 0
        };
      }
    } catch (err) {}

    // 3. Check mockDb directly in fallback mode
    if (db.mockDb) {
      if (db.mockDb.users) {
        const foundUser = db.mockDb.users.find(u =>
          u.email?.toLowerCase() === cleanId.toLowerCase() ||
          u.username?.toLowerCase() === cleanId.toLowerCase() ||
          u.user_code?.toLowerCase() === cleanId.toLowerCase() ||
          (u.email && u.email.toLowerCase().startsWith(cleanId.toLowerCase())) ||
          (u.username && u.username.toLowerCase().startsWith(cleanId.toLowerCase()))
        );
        if (foundUser) return foundUser;
      }
      if (db.mockDb.employees) {
        const foundEmp = db.mockDb.employees.find(e =>
          e.email?.toLowerCase() === cleanId.toLowerCase() ||
          e.employee_number?.toLowerCase() === cleanId.toLowerCase() ||
          (e.email && e.email.toLowerCase().startsWith(cleanId.toLowerCase()))
        );
        if (foundEmp) {
          const defaultHash = bcrypt.hashSync('Password123!', 10);
          const autoUser = {
            id: foundEmp.id,
            user_id: foundEmp.id,
            username: cleanId || (foundEmp.email ? foundEmp.email.split('@')[0] : `emp${foundEmp.id}`),
            email: foundEmp.email,
            password_hash: defaultHash,
            full_name: foundEmp.full_name,
            role: 'staff',
            user_code: foundEmp.employee_number,
            account_status: 'ACTIVE',
            status: 'active',
            failed_login_attempts: 0
          };
          if (db.mockDb.users) db.mockDb.users.push(autoUser);
          return autoUser;
        }
      }
    }

    return null;
  }


  async generateUserCode(roleName) {
    const rolePrefixes = {
      admin: 'ADM',
      administrator: 'ADM',
      visitor: 'VIS',
      staff: 'EMP',
      employee: 'EMP',
      'employee/host': 'EMP',
      manager: 'MGR',
      'department manager': 'MGR',
      department_manager: 'MGR',
      receptionist: 'REC',
      security_officer: 'SEC',
      security: 'SEC'
    };

    const prefix = rolePrefixes[(roleName || '').toLowerCase()] || 'USR';
    const year = new Date().getFullYear();
    const fullPrefix = `${prefix}-${year}-`;

    const regex = new RegExp(`^.*?${prefix}-${year}-(\\d+)$`, 'i');
    let maxSeq = 0;

    const [userRows, empRows, mgrRows] = await Promise.all([
      db.query(`SELECT user_code FROM users WHERE user_code LIKE ? OR user_code LIKE ?`, [`${fullPrefix}%`, `%${fullPrefix}%`]).catch(() => []),
      db.query(`SELECT employee_number FROM employees WHERE employee_number LIKE ? OR employee_number LIKE ?`, [`${fullPrefix}%`, `%${fullPrefix}%`]).catch(() => []),
      db.query(`SELECT manager_number FROM manager_profiles WHERE manager_number LIKE ? OR manager_number LIKE ?`, [`${fullPrefix}%`, `%${fullPrefix}%`]).catch(() => [])
    ]);

    for (const r of (userRows || [])) {
      if (!r.user_code) continue;
      const m = String(r.user_code).match(regex);
      if (m && m[1]) {
        const val = parseInt(m[1], 10);
        if (!isNaN(val) && val > maxSeq) maxSeq = val;
      }
    }

    for (const r of (empRows || [])) {
      if (!r.employee_number) continue;
      const m = String(r.employee_number).match(regex);
      if (m && m[1]) {
        const val = parseInt(m[1], 10);
        if (!isNaN(val) && val > maxSeq) maxSeq = val;
      }
    }

    for (const r of (mgrRows || [])) {
      if (!r.manager_number) continue;
      const m = String(r.manager_number).match(regex);
      if (m && m[1]) {
        const val = parseInt(m[1], 10);
        if (!isNaN(val) && val > maxSeq) maxSeq = val;
      }
    }

    let nextNum = maxSeq + 1;
    while (true) {
      const candidate5 = `${fullPrefix}${String(nextNum).padStart(5, '0')}`;
      const candidate6 = `${fullPrefix}${String(nextNum).padStart(6, '0')}`;
      const candidate = candidate6;

      const [uMatch] = await db.query(`SELECT id FROM users WHERE user_code IN (?, ?) LIMIT 1`, [candidate, candidate5]).catch(() => []);
      const [eMatch] = await db.query(`SELECT id FROM employees WHERE employee_number IN (?, ?) LIMIT 1`, [candidate, candidate5]).catch(() => []);
      const [mMatch] = await db.query(`SELECT id FROM manager_profiles WHERE manager_number IN (?, ?) LIMIT 1`, [candidate, candidate5]).catch(() => []);

      if (!uMatch && !eMatch && !mMatch) {
        return candidate;
      }
      nextNum++;
    }
  }

  async create(userData, dbClient = db) {
    const {
      username,
      email,
      passwordHash,
      firstName = null,
      middleName = null,
      lastName = null,
      fullName,
      phone = null,
      role = 'visitor',
      departmentId = null,
      jobTitle = null,
      firstLoginRequired = false,
      employeeId = null,
      userCode: providedUserCode = null
    } = userData;

    const userCode = providedUserCode || await this.generateUserCode(role);

    const result = await dbClient.query(
      `INSERT INTO users (
        username, email, password_hash, first_name, middle_name, last_name, 
        full_name, phone, phone_number, role, department_id, job_title, 
        account_status, status, email_verified, phone_verified, failed_login_attempts,
        user_code, first_login_required, verification_status, employee_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 'active', FALSE, FALSE, 0, ?, ?, 'VERIFIED', ?)`,
      [
        username || email.split('@')[0] + Math.floor(Math.random() * 1000),
        email,
        passwordHash,
        firstName,
        middleName,
        lastName,
        fullName,
        phone,
        phone,
        role,
        departmentId,
        jobTitle,
        userCode,
        firstLoginRequired ? 1 : 0,
        employeeId
      ]
    );

    return result.insertId;
  }

  async update(id, updateData) {
    const fields = [];
    const values = [];

    const mappings = {
      role: 'role',
      status: 'status',
      accountStatus: 'account_status',
      departmentId: 'department_id',
      jobTitle: 'job_title',
      fullName: 'full_name',
      firstName: 'first_name',
      lastName: 'last_name',
      phone: 'phone',
      avatarUrl: 'avatar_url',
      resetToken: 'reset_token',
      resetTokenExpires: 'reset_token_expires',
      failedLoginAttempts: 'failed_login_attempts',
      accountLockedUntil: 'account_locked_until',
      passwordHash: 'password_hash',
      userCode: 'user_code',
      verificationStatus: 'verification_status',
      emailVerified: 'email_verified',
      firstLoginRequired: 'first_login_required',
    };

    for (const [key, columnName] of Object.entries(mappings)) {
      if (updateData[key] !== undefined) {
        fields.push(`${columnName} = ?`);
        values.push(updateData[key]);
      }
    }

    if (fields.length === 0) return false;

    values.push(id);
    const result = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  async incrementFailedAttempts(email) {
    return db.query(
      `UPDATE users 
       SET failed_login_attempts = failed_login_attempts + 1 
       WHERE email = ?`,
      [email]
    );
  }

  async lockAccount(email, unlockTime) {
    return db.query(
      `UPDATE users 
       SET account_status = 'LOCKED', 
           status = 'locked', 
           account_locked_until = ? 
       WHERE email = ?`,
      [unlockTime, email]
    );
  }

  async resetFailedAttempts(email) {
    return db.query(
      `UPDATE users 
       SET failed_login_attempts = 0, 
           account_status = 'ACTIVE', 
           status = 'active', 
           account_locked_until = NULL 
       WHERE email = ?`,
      [email]
    );
  }

  async findByPhone(phone) {
    if (!phone) return null;
    const rows = await db.query(
      `SELECT * FROM users WHERE phone = ? OR phone_number = ?`,
      [phone, phone]
    );
    return rows[0] || null;
  }

  async saveSavedSearch(userId, searchName, filtersJson) {
    const result = await db.query(
      `INSERT INTO saved_user_searches (user_id, search_name, filters_json) VALUES (?, ?, ?)`,
      [userId, searchName, JSON.stringify(filtersJson)]
    );
    return result.insertId;
  }

  async getSavedSearches(userId) {
    return db.query(
      `SELECT id, search_name as searchName, filters_json as filtersJson, created_at as createdAt
       FROM saved_user_searches
       WHERE user_id = ?
       ORDER BY id DESC`,
      [userId]
    );
  }

  async deleteSavedSearch(id, userId) {
    const result = await db.query(
      `DELETE FROM saved_user_searches WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  async bulkUpdateStatus(userIds, statusUpper, reason, operatorId) {
    if (!Array.isArray(userIds) || userIds.length === 0) return 0;
    const placeholders = userIds.map(() => '?').join(',');
    const params = [statusUpper, statusUpper.toLowerCase(), operatorId, reason, ...userIds];
    const result = await db.query(
      `UPDATE users
       SET account_status = ?, status = ?, suspended_by = ?, suspended_at = CURRENT_TIMESTAMP, suspension_reason = ?
       WHERE id IN (${placeholders})`,
      params
    );
    return result.affectedRows || 0;
  }

  async archiveUser(userId, operatorId = 1) {
    const rows = await db.query(`SELECT id, email, username, user_code FROM users WHERE id = ?`, [userId]);
    const u = rows && rows[0];
    const ts = Date.now();
    if (u) {
      const origEmail = (u.email || '').replace(/^deleted_\d+_/, '');
      const freedEmail = `deleted_${ts}_${origEmail}`.slice(0, 100);
      const cleanUsername = (u.username || `user_${userId}`).replace(/^deleted_\d+_/, '');
      const freedUsername = `deleted_${ts}_${cleanUsername}`.slice(0, 100);
      const cleanUserCode = (u.user_code || `USR-${userId}`).replace(/^DEL_\d+_\d+_/, '');
      const freedUserCode = `DEL_${userId}_${Math.floor(ts / 1000)}_${cleanUserCode}`.slice(0, 50);

      try {
        await db.query(
          `UPDATE users
           SET account_status = 'ARCHIVED',
               status = 'archived',
               is_active = 0,
               email = ?,
               username = ?,
               user_code = ?,
               deleted_at = CURRENT_TIMESTAMP,
               archived_at = CURRENT_TIMESTAMP,
               archived_by = ?
           WHERE id = ?`,
          [freedEmail, freedUsername, freedUserCode, operatorId, userId]
        );
      } catch (err) {
        await db.query(
          `UPDATE users
           SET account_status = 'ARCHIVED',
               status = 'archived',
               is_active = 0,
               deleted_at = CURRENT_TIMESTAMP,
               archived_at = CURRENT_TIMESTAMP,
               archived_by = ?
           WHERE id = ?`,
          [operatorId, userId]
        ).catch(() => {});
      }

      // Free email and employee_number from employees table if linked
      await db.query(
        `UPDATE employees
         SET email = CONCAT('deleted_${ts}_', email),
             employment_status = 'Inactive',
             is_host_enabled = 0,
             deleted_at = CURRENT_TIMESTAMP
         WHERE user_id = ? OR LOWER(email) = LOWER(?) OR LOWER(email) = LOWER(?)`,
        [userId, u.email, origEmail]
      ).catch(() => {});

      // Free manager_number from manager_profiles table if linked
      await db.query(
        `UPDATE manager_profiles
         SET status = 'INACTIVE'
         WHERE user_id = ?`,
        [userId]
      ).catch(() => {});

      // Free email from visitors table if linked
      await db.query(
        `UPDATE visitors
         SET email = CONCAT('deleted_${ts}_', email),
             is_active = FALSE,
             deleted_at = CURRENT_TIMESTAMP,
             status = 'DELETED'
         WHERE user_id = ? OR LOWER(email) = LOWER(?) OR LOWER(email) = LOWER(?)`,
        [userId, u.email, origEmail]
      ).catch(() => {});
    } else {
      await db.query(
        `UPDATE users
         SET account_status = 'ARCHIVED', status = 'archived', deleted_at = CURRENT_TIMESTAMP, archived_at = CURRENT_TIMESTAMP, archived_by = ?
         WHERE id = ?`,
        [operatorId, userId]
      ).catch(() => {});
    }
    await db.query(`UPDATE user_roles SET is_active = 0, deleted_at = CURRENT_TIMESTAMP WHERE user_id = ?`, [userId]).catch(() => {});
    await db.query(`UPDATE user_sessions SET is_active = 0 WHERE user_id = ?`, [userId]).catch(() => {});
    return true;
  }

  async deleteUser(userId, operatorId = 1) {
    if (!userId || userId === 1) return false;

    const safeExec = async (query, params = []) => {
      try {
        await db.query(query, params);
      } catch (e) {}
    };

    // 1. Parallel cleanup of all child records & foreign-key references
    await Promise.allSettled([
      safeExec(`DELETE FROM user_sessions WHERE user_id = ?`, [userId]),
      safeExec(`DELETE FROM user_tokens WHERE user_id = ?`, [userId]),
      safeExec(`DELETE FROM user_roles WHERE user_id = ?`, [userId]),
      safeExec(`DELETE FROM user_permissions WHERE user_id = ?`, [userId]),
      safeExec(`DELETE FROM user_activity_logs WHERE user_id = ?`, [userId]),
      safeExec(`DELETE FROM user_login_history WHERE user_id = ?`, [userId]),
      safeExec(`DELETE FROM notifications WHERE user_id = ?`, [userId]),
      safeExec(`DELETE FROM notification_recipients WHERE user_id = ?`, [userId]),
      safeExec(`DELETE FROM user_security_settings WHERE user_id = ?`, [userId]),
      safeExec(`DELETE FROM user_preferences WHERE user_id = ?`, [userId]),
      safeExec(`UPDATE employees SET user_id = NULL WHERE user_id = ?`, [userId]),
      safeExec(`UPDATE visitors SET user_id = NULL WHERE user_id = ?`, [userId]),
      safeExec(`UPDATE manager_profiles SET user_id = NULL WHERE user_id = ?`, [userId]),
    ]);

    // 2. Perform direct permanent deletion from users table
    try {
      const result = await db.query(`DELETE FROM users WHERE id = ?`, [userId]);
      return result?.affectedRows > 0;
    } catch (delErr) {
      // If hard delete still hits an unforeseen constraint, archive the user
      return this.archiveUser(userId, operatorId);
    }
  }

  async restoreUser(userId, operatorId) {
    const result = await db.query(
      `UPDATE users
       SET account_status = 'ACTIVE', status = 'active', deleted_at = NULL, archived_at = NULL, archived_by = NULL
       WHERE id = ?`,
      [userId]
    );
    await db.query(`UPDATE user_roles SET is_active = 1, deleted_at = NULL WHERE user_id = ?`, [userId]).catch(() => {});
    return result.affectedRows > 0;
  }

  async update(id, data) {
    if (!data || Object.keys(data).length === 0) return true;
    const allowedFields = ['full_name', 'phone', 'phone_number', 'status', 'account_status', 'role', 'department_id', 'job_title', 'is_active'];
    const updates = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        updates.push(`${snakeKey} = ?`);
        values.push(val);
      }
    }
    if (updates.length === 0) return true;
    values.push(id);
    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return true;
  }

  async findAll() {
    return db.query(
      `SELECT id, full_name as fullName, email, phone, role, 
              department_id as departmentId, job_title as jobTitle, 
              status, account_status as accountStatus, created_at as createdAt 
       FROM users`
    );
  }
}

module.exports = new UserRepository();
