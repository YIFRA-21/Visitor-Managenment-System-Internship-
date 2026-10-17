const db = require('../../../config/db');

class AppointmentRepository {
  async findById(id) {
    const rows = await db.query(
      `SELECT a.*,
              v.full_name as visitorName, v.full_name as visitor_name,
              v.email as visitorEmail, v.email as visitor_email,
              v.phone as visitorPhone, v.phone as visitor_phone,
              v.photo_url as photo_url, v.photo_url as profile_photo, v.photo_url as visitorPhoto, v.photo_url as visitor_photo,
              v.visitor_code as visitorCode, v.visitor_code as visitor_code,
              v.visitor_id as visitorIdCode, v.reference_number as visitorReferenceNumber,
              v.company as visitorCompany, v.category as visitorCategory,
              v.id_type as idType, v.id_number as idNumber,
              v.gender, v.date_of_birth as dateOfBirth, v.nationality,
              u.full_name as hostName, u.email as hostEmail, r.room_name as roomName
       FROM appointments a
       LEFT JOIN visitors v ON a.visitor_id = v.id
       LEFT JOIN users u ON a.host_id = u.id
       LEFT JOIN meeting_rooms r ON a.room_id = r.id
       WHERE a.id = ? AND a.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  }

  async findByReferenceCode(referenceCode) {
    const cleanRef = String(referenceCode || '').trim().replace(/^#/, '');
    const numId = parseInt(cleanRef, 10);
    const validNum = !isNaN(numId) ? numId : -1;

    const rows = await db.query(
      `SELECT a.*,
              v.full_name as visitorName, v.full_name as visitor_name,
              v.email as visitorEmail, v.email as visitor_email,
              v.phone as visitorPhone, v.phone as visitor_phone,
              v.photo_url as photo_url, v.photo_url as profile_photo, v.photo_url as visitorPhoto, v.photo_url as visitor_photo,
              v.visitor_code as visitorCode, v.visitor_code as visitor_code,
              v.visitor_id as visitorIdCode, v.reference_number as visitorReferenceNumber,
              v.company as visitorCompany, v.category as visitorCategory,
              v.id_type as idType, v.id_number as idNumber,
              v.gender, v.date_of_birth as dateOfBirth, v.nationality,
              u.full_name as hostName, r.room_name as roomName
       FROM appointments a
       LEFT JOIN visitors v ON a.visitor_id = v.id
       LEFT JOIN users u ON a.host_id = u.id
       LEFT JOIN meeting_rooms r ON a.room_id = r.id
       WHERE (
         a.reference_code = ? 
         OR a.appointment_number = ? 
         OR a.qr_token = ?
         OR a.id = ?
         OR v.id = ?
         OR v.visitor_code = ?
         OR v.email = ?
         OR v.phone = ?
         OR v.id_number = ?
       ) AND a.deleted_at IS NULL
       ORDER BY a.id DESC`,
      [cleanRef, cleanRef, cleanRef, validNum, validNum, cleanRef, cleanRef, cleanRef, cleanRef]
    );
    return rows[0] || null;
  }

  async findConflicting(hostId, roomId, start, end, excludeId = null) {
    let sql = `SELECT id FROM appointments 
               WHERE deleted_at IS NULL 
                 AND appointment_status IN ('APPROVED', 'CHECKED_IN')
                 AND ((host_id = ?) OR (room_id = ? AND room_id IS NOT NULL))
                 AND (scheduled_start < ? AND scheduled_end > ?)`;
    const params = [hostId, roomId, end, start];

    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }

    return db.query(sql, params);
  }

  async create(appointmentData, tx = null) {
    const queryExec = (sql, params) => (tx ? tx.query(sql, params) : db.query(sql, params));

    const {
      organizationId = 1,
      facilityId = null,
      branchId = null,
      visitorId,
      visitorUserId = null,
      hostId,
      hostUserId = null,
      hostEmployeeId,
      departmentId,
      appointmentTypeId = 1,
      visitPurposeId = 1,
      roomId = null,
      scheduledStart,
      scheduledEnd,
      expectedDurationMinutes = 60,
      priority = 'MEDIUM',
      remarks = null,
      purpose = null,
      referenceCode,
      approvalDeadline = null,
    } = appointmentData;

    const appointmentNumber = referenceCode;
    const finalHostUserId = hostUserId || hostId;
    const finalHostEmpId = hostEmployeeId || hostId;
    const finalBranchId = branchId || null;

    let finalFacilityId = null;
    if (facilityId) {
      const facRows = await queryExec('SELECT id FROM facilities WHERE id = ?', [facilityId]).catch(() => []);
      if (facRows[0]) finalFacilityId = facilityId;
    }

    const toMySqlDateTime = (dateVal, fallback = null) => {
      if (!dateVal) return fallback;
      if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateVal)) {
        return dateVal;
      }
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return fallback;
      return d.toISOString().slice(0, 19).replace('T', ' ');
    };

    const finalStart = toMySqlDateTime(scheduledStart, new Date().toISOString().slice(0, 19).replace('T', ' '));
    const finalEnd = toMySqlDateTime(scheduledEnd, new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' '));
    const finalDeadline = toMySqlDateTime(approvalDeadline, null);

    const result = await queryExec(
      `INSERT INTO appointments (
        appointment_number, organization_id, facility_id, branch_id, visitor_id, visitor_user_id,
        host_id, host_user_id, host_employee_id,
        department_id, appointment_type_id, visit_purpose_id, room_id,
        scheduled_start, scheduled_end, expected_duration_minutes, priority,
        approval_status, appointment_status, remarks, purpose, reference_code,
        approval_deadline, status, current_approval_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'REQUESTED', ?, ?, ?, ?, 'PENDING', 1)`,
      [
        appointmentNumber,
        organizationId,
        finalFacilityId,
        finalBranchId,
        visitorId,
        visitorUserId,
        finalHostUserId,
        finalHostUserId,
        finalHostEmpId,
        departmentId,
        appointmentTypeId,
        visitPurposeId,
        roomId,
        finalStart,
        finalEnd,
        expectedDurationMinutes,
        priority,
        remarks,
        purpose,
        referenceCode,
        finalDeadline,
      ]
    );

    const appointmentId = result.insertId;

    await queryExec(
      `UPDATE appointments SET appointment_id = ? WHERE id = ?`,
      [appointmentId, appointmentId]
    );

    return appointmentId;
  }

  async update(id, updateData) {
    const fields = [];
    const values = [];

    const mappings = {
      facilityId: 'facility_id',
      roomId: 'room_id',
      scheduledStart: 'scheduled_start',
      scheduledEnd: 'scheduled_end',
      expectedDurationMinutes: 'expected_duration_minutes',
      priority: 'priority',
      approvalStatus: 'approval_status',
      appointmentStatus: 'appointment_status',
      remarks: 'remarks',
      purpose: 'purpose',
      status: 'status',
      currentApprovalLevel: 'current_approval_level',
      cancellationReason: 'cancellation_reason',
      isCancelled: 'is_cancelled',
      isCompleted: 'is_completed',
      similarityScore: 'similarity_score',
      verificationStatus: 'verification_status',
      verifiedAt: 'verified_at',
    };

    for (const [key, columnName] of Object.entries(mappings)) {
      if (updateData[key] !== undefined) {
        fields.push(`${columnName} = ?`);
        let val = updateData[key];
        if (['scheduledStart', 'scheduledEnd', 'verifiedAt'].includes(key) && val) {
          if (typeof val === 'string' && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(val)) {
            const d = new Date(val);
            if (!isNaN(d.getTime())) val = d.toISOString().slice(0, 19).replace('T', ' ');
          }
        }
        values.push(val);
      }
    }

    if (fields.length === 0) return false;

    values.push(id);
    const result = await db.query(
      `UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  async findAll(filters = {}) {
    let sql = `SELECT a.*,
              v.full_name as visitorName, v.full_name as visitor_name,
              v.email as visitorEmail, v.email as visitor_email,
              v.phone as visitorPhone, v.phone as visitor_phone,
              v.photo_url as photo_url, v.photo_url as profile_photo, v.photo_url as visitorPhoto, v.photo_url as visitor_photo,
              v.visitor_code as visitorCode, v.visitor_code as visitor_code,
              v.visitor_id as visitorIdCode, v.reference_number as visitorReferenceNumber,
              v.company as visitorCompany, v.category as visitorCategory,
              v.id_type as idType, v.id_number as idNumber,
              u.full_name as hostName, r.room_name as roomName
       FROM appointments a
       LEFT JOIN visitors v ON a.visitor_id = v.id
       LEFT JOIN users u ON a.host_id = u.id
       LEFT JOIN meeting_rooms r ON a.room_id = r.id
       WHERE a.deleted_at IS NULL`;
    const params = [];

    if (filters.hostId) {
      sql += ` AND a.host_id = ?`;
      params.push(filters.hostId);
    }

    if (filters.visitorId) {
      const email = filters.visitorEmail || filters.userEmail || '';
      sql += ` AND (a.visitor_id = ? OR a.visitor_user_id = ? OR v.user_id = ? ${email ? 'OR v.email = ?' : ''})`;
      params.push(filters.visitorId, filters.visitorId, filters.visitorId);
      if (email) params.push(email);
    }

    if (filters.status) {
      sql += ` AND a.appointment_status = ?`;
      params.push(filters.status);
    }

    if (filters.search) {
      sql += ` AND (v.full_name LIKE ? OR a.reference_code LIKE ? OR u.full_name LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    if (filters.date) {
      sql += ` AND DATE(a.scheduled_start) = DATE(?)`;
      params.push(filters.date);
    }

    sql += ` ORDER BY a.scheduled_start DESC`;

    if (filters.limit) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(filters.limit, 10), parseInt(filters.offset || 0, 10));
    }

    return db.query(sql, params);
  }

  async findForCalendar(start, end, filters = {}) {
    let sql = `SELECT a.*, v.full_name as visitorName, u.full_name as hostName, r.room_name as roomName
               FROM appointments a
               LEFT JOIN visitors v ON a.visitor_id = v.id
               LEFT JOIN users u ON a.host_id = u.id
               LEFT JOIN meeting_rooms r ON a.room_id = r.id
               WHERE a.deleted_at IS NULL
                 AND a.scheduled_start >= ? AND a.scheduled_start <= ?`;
    const params = [start, end];

    if (filters.hostId) {
      sql += ` AND a.host_id = ?`;
      params.push(filters.hostId);
    }
    if (filters.roomId) {
      sql += ` AND a.room_id = ?`;
      params.push(filters.roomId);
    }

    sql += ` ORDER BY a.scheduled_start ASC`;
    return db.query(sql, params);
  }

  async getDashboardStats() {
    const todayStr = new Date().toISOString().split('T')[0];
    const all = await db.query(`SELECT appointment_status, approval_status, scheduled_start FROM appointments WHERE deleted_at IS NULL`);
    
    let total = all.length;
    let today = 0;
    let upcoming = 0;
    let pending = 0;
    let approved = 0;
    let completed = 0;
    let cancelled = 0;
    let noShow = 0;
    let rescheduled = 0;

    for (const appt of all) {
      const apptDate = appt.scheduled_start ? appt.scheduled_start.split('T')[0] : '';
      if (apptDate === todayStr) today++;
      if (apptDate > todayStr) upcoming++;

      const st = (appt.appointment_status || appt.approval_status || '').toUpperCase();
      if (st === 'REQUESTED' || st === 'PENDING') pending++;
      else if (st === 'APPROVED' || st === 'CONFIRMED') approved++;
      else if (st === 'COMPLETED' || st === 'CHECKED_OUT') completed++;
      else if (st === 'CANCELLED' || st === 'REJECTED') cancelled++;
      else if (st === 'NO_SHOW' || st === 'EXPIRED') noShow++;
      else if (st === 'RESCHEDULED') rescheduled++;
    }

    return {
      total,
      today,
      upcoming,
      pending,
      approved,
      completed,
      cancelled,
      noShow,
      rescheduled
    };
  }

  async softDelete(id, userId) {
    const result = await db.query(
      `UPDATE appointments SET deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE id = ?`,
      [userId || null, id]
    );
    return result.affectedRows > 0;
  }

  async restore(id, userId) {
    const result = await db.query(
      `UPDATE appointments SET deleted_at = NULL, updated_by = ? WHERE id = ?`,
      [userId || null, id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = new AppointmentRepository();
