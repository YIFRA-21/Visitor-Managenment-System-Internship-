const db = require('../../../config/db');

class VisitorHistoryRepository {
  async getAll(params = {}) {
    const {
      search,
      startDate,
      endDate,
      departmentId,
      branchId,
      visitorCategory,
      visitStatus,
      page = 1,
      limit = 10,
      sortBy = 'completed_date',
      sortOrder = 'DESC'
    } = params;

    let whereClauses = ['vh.is_deleted = FALSE'];
    let queryParams = [];

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereClauses.push(
        `(vh.history_code LIKE ? OR vh.reference_number LIKE ? OR vh.visitor_name LIKE ? OR vh.appointment_number LIKE ? OR vh.host_employee_name LIKE ? OR vh.identity_number LIKE ?)`
      );
      queryParams.push(term, term, term, term, term, term);
    }

    if (startDate) {
      whereClauses.push('DATE(vh.completed_date) >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereClauses.push('DATE(vh.completed_date) <= ?');
      queryParams.push(endDate);
    }

    if (departmentId) {
      whereClauses.push('vh.department_id = ?');
      queryParams.push(departmentId);
    }

    if (branchId) {
      whereClauses.push('vh.branch_id = ?');
      queryParams.push(branchId);
    }

    if (visitorCategory) {
      whereClauses.push('vh.visitor_category = ?');
      queryParams.push(visitorCategory);
    }

    if (visitStatus) {
      whereClauses.push('vh.visit_status = ?');
      queryParams.push(visitStatus);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count Total
    const countSql = `SELECT COUNT(*) as total FROM visitor_histories vh ${whereString}`;
    const countRows = await db.query(countSql, queryParams);
    const total = countRows[0]?.total || 0;

    // Sorting columns whitelist
    const allowedSortCols = [
      'id', 'history_code', 'visitor_name', 'visitor_category',
      'appointment_number', 'checkin_time', 'checkout_time',
      'visit_duration_minutes', 'completed_date', 'created_at'
    ];
    const safeSort = allowedSortCols.includes(sortBy) ? sortBy : 'completed_date';
    const safeOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const dataSql = `
      SELECT vh.*,
             COALESCE(vh.visitor_photo, v.photo_url, u.profile_photo) as visitor_photo,
             COALESCE(vh.visitor_photo, v.photo_url, u.profile_photo) as photo_url,
             COALESCE(vh.visitor_photo, v.photo_url, u.profile_photo) as profile_photo,
             COALESCE(vh.visitor_name, v.full_name, u.full_name) as visitor_name,
             COALESCE(vh.visitor_name, v.full_name, u.full_name) as visitorName,
             COALESCE(vh.visitor_email, v.email, u.email) as visitor_email,
             COALESCE(vh.visitor_phone, v.phone, u.phone) as visitor_phone,
             COALESCE(vh.reference_number, v.reference_number, v.visitor_code) as reference_number,
             COALESCE(v.visitor_code, vh.history_code) as visitor_code
      FROM visitor_histories vh
      LEFT JOIN visitors v ON vh.visitor_id = v.id OR (vh.visitor_email = v.email AND v.email IS NOT NULL AND v.email != '')
      LEFT JOIN users u ON v.user_id = u.id OR vh.visitor_email = u.email
      ${whereString}
      ORDER BY vh.${safeSort} ${safeOrder}
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...queryParams, parseInt(limit), offset];
    const rows = await db.query(dataSql, dataParams);

    return {
      data: rows || [],
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)) || 1
      }
    };
  }

  async getStats() {
    const totalRows = await db.query(`
      SELECT 
        COUNT(*) as totalCompleted,
        SUM(CASE WHEN DATE(completed_date) = CURRENT_DATE THEN 1 ELSE 0 END) as visitsToday,
        SUM(CASE WHEN MONTH(completed_date) = MONTH(CURRENT_DATE) AND YEAR(completed_date) = YEAR(CURRENT_DATE) THEN 1 ELSE 0 END) as visitsThisMonth,
        ROUND(AVG(NULLIF(visit_duration_minutes, 0)), 0) as avgDurationMinutes,
        ROUND((SUM(CASE WHEN verification_status = 'Verified' OR verification_status = 'COMPLETED' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as verifiedPercentage
      FROM visitor_histories
      WHERE is_deleted = FALSE
    `);

    // Count repeat visitors (visitors with > 1 completed visits)
    const repeatRows = await db.query(`
      SELECT COUNT(DISTINCT visitor_id) as repeatVisitorsCount
      FROM visitor_histories
      WHERE is_deleted = FALSE AND visitor_id IS NOT NULL
      GROUP BY visitor_id
      HAVING COUNT(id) > 1
    `);

    const stats = totalRows[0] || {};
    return {
      totalCompleted: stats.totalCompleted || 0,
      visitsToday: stats.visitsToday || 0,
      visitsThisMonth: stats.visitsThisMonth || 0,
      avgDurationMinutes: stats.avgDurationMinutes || 0,
      verifiedPercentage: stats.verifiedPercentage || 100,
      repeatVisitorsCount: repeatRows.length || 0
    };
  }

  async getById(id) {
    const rows = await db.query(
      `SELECT vh.*,
              COALESCE(vh.visitor_photo, v.photo_url, u.profile_photo) as visitor_photo,
              COALESCE(vh.visitor_photo, v.photo_url, u.profile_photo) as photo_url,
              COALESCE(vh.visitor_photo, v.photo_url, u.profile_photo) as profile_photo,
              COALESCE(vh.visitor_name, v.full_name, u.full_name) as visitor_name,
              COALESCE(vh.visitor_name, v.full_name, u.full_name) as visitorName,
              COALESCE(vh.visitor_email, v.email, u.email) as visitor_email,
              COALESCE(vh.visitor_phone, v.phone, u.phone) as visitor_phone,
              COALESCE(vh.reference_number, v.reference_number, v.visitor_code) as reference_number,
              COALESCE(v.visitor_code, vh.history_code) as visitor_code
       FROM visitor_histories vh
       LEFT JOIN visitors v ON vh.visitor_id = v.id OR (vh.visitor_email = v.email AND v.email IS NOT NULL AND v.email != '')
       LEFT JOIN users u ON v.user_id = u.id OR vh.visitor_email = u.email
       WHERE vh.id = ? AND vh.is_deleted = FALSE`,
      [id]
    );
    if (!rows || rows.length === 0) return null;

    const history = rows[0];

    // Fetch documents if visitor_id or appointment_id is available
    if (history.visitor_id || history.appointment_id) {
      const docs = await db.query(
        `SELECT id, document_name, document_type, document_number, file_path, document_url, status, created_at
         FROM visitor_documents
         WHERE (visitor_id = ? OR appointment_id = ?) AND is_deleted = FALSE`,
        [history.visitor_id || 0, history.appointment_id || 0]
      );
      history.documents = docs || [];
    } else {
      history.documents = [];
    }

    return history;
  }

  async getByCode(historyCode) {
    const rows = await db.query(
      `SELECT vh.*,
              COALESCE(vh.visitor_photo, v.photo_url, u.profile_photo) as visitor_photo,
              COALESCE(vh.visitor_photo, v.photo_url, u.profile_photo) as photo_url,
              COALESCE(vh.visitor_photo, v.photo_url, u.profile_photo) as profile_photo,
              COALESCE(vh.visitor_name, v.full_name, u.full_name) as visitor_name,
              COALESCE(vh.visitor_name, v.full_name, u.full_name) as visitorName,
              COALESCE(vh.visitor_email, v.email, u.email) as visitor_email,
              COALESCE(vh.visitor_phone, v.phone, u.phone) as visitor_phone,
              COALESCE(vh.reference_number, v.reference_number, v.visitor_code) as reference_number,
              COALESCE(v.visitor_code, vh.history_code) as visitor_code
       FROM visitor_histories vh
       LEFT JOIN visitors v ON vh.visitor_id = v.id OR (vh.visitor_email = v.email AND v.email IS NOT NULL AND v.email != '')
       LEFT JOIN users u ON v.user_id = u.id OR vh.visitor_email = u.email
       WHERE vh.history_code = ? AND vh.is_deleted = FALSE`,
      [historyCode]
    );
    if (!rows || rows.length === 0) return null;
    return rows[0];
  }

  async createFromCheckout(checkoutId) {
    // Query full snapshot data joining visitor_checkouts, checkins, visitors, appointments, users, visitor_passes
    const sql = `
      SELECT 
        vco.id as checkout_id,
        vco.checkin_id,
        vco.visitor_id,
        vco.appointment_id,
        vco.checkout_time,
        vco.total_visit_duration as visit_duration_minutes,
        c.checked_in_at as checkin_time,
        c.organization_id,
        c.badge_number,
        v.id as v_visitor_id,
        v.full_name as visitor_name,
        v.email as visitor_email,
        v.phone as visitor_phone,
        v.company as visitor_company,
        v.category as visitor_category,
        v.photo_url as visitor_photo,
        v.reference_number,
        v.id_type as identity_type,
        v.id_number as identity_number,
        v.id_verification_status as verification_status,
        a.appointment_number,
        a.purpose as visit_purpose,
        NULL as meeting_location,
        a.scheduled_start as appointment_date,
        a.host_id,
        a.department_id,
        u.full_name as host_employee_name,
        d.name as department_name,
        b.id as branch_id,
        b.branch_name,
        vp.id as pass_id,
        vp.pass_code as pass_number
      FROM visitor_checkouts vco
      LEFT JOIN checkins c ON vco.checkin_id = c.id
      LEFT JOIN visitors v ON vco.visitor_id = v.id
      LEFT JOIN appointments a ON vco.appointment_id = a.id
      LEFT JOIN users u ON a.host_id = u.id
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN branches b ON d.branch_id = b.id
      LEFT JOIN visitor_passes vp ON c.pass_id = vp.id
      WHERE vco.id = ? OR vco.checkout_id = ?
      LIMIT 1
    `;

    const rows = await db.query(sql, [checkoutId, checkoutId]);
    if (!rows || rows.length === 0) return null;

    const data = rows[0];
    const checkoutTimeVal = data.checkout_time || new Date();
    const durationMinutesVal = data.visit_duration_minutes || 30;

    // Check if an initial or pending history record exists for this visitor or appointment
    let existingPending = null;
    try {
      if (data.appointment_id) {
        const match = await db.query(
          `SELECT id FROM visitor_histories WHERE appointment_id = ? AND (visit_status = 'Pending' OR checkout_time IS NULL) LIMIT 1`,
          [data.appointment_id]
        );
        if (match && match.length > 0) existingPending = match[0];
      }
      if (!existingPending && data.visitor_id) {
        const match = await db.query(
          `SELECT id FROM visitor_histories WHERE visitor_id = ? AND (visit_status = 'Pending' OR checkout_time IS NULL) ORDER BY id DESC LIMIT 1`,
          [data.visitor_id]
        );
        if (match && match.length > 0) existingPending = match[0];
      }
    } catch (findErr) {
      console.warn('Error checking existing pending history:', findErr);
    }

    if (existingPending) {
      const updateSql = `
        UPDATE visitor_histories SET
          checkout_id = ?,
          checkin_id = COALESCE(?, checkin_id),
          appointment_id = COALESCE(?, appointment_id),
          pass_id = COALESCE(?, pass_id),
          checkin_time = COALESCE(?, checkin_time),
          checkout_time = ?,
          visit_duration_minutes = ?,
          visit_status = 'Completed',
          completed_date = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      await db.query(updateSql, [
        data.checkout_id,
        data.checkin_id,
        data.appointment_id,
        data.pass_id,
        data.checkin_time,
        checkoutTimeVal,
        durationMinutesVal,
        checkoutTimeVal,
        existingPending.id
      ]);
      return existingPending.id;
    }

    const historyCode = `HIS-${new Date().getFullYear()}-${String(data.checkout_id || Math.floor(Math.random() * 10000)).padStart(6, '0')}`;

    const insertSql = `
      INSERT INTO visitor_histories (
        history_code, organization_id, visitor_id, appointment_id, pass_id, checkin_id, checkout_id,
        reference_number, visitor_photo, visitor_name, visitor_email, visitor_phone, visitor_company, visitor_category,
        host_employee_id, host_employee_name, department_id, department_name, branch_id, branch_name,
        appointment_number, visit_purpose, meeting_location, appointment_date,
        checkin_time, checkout_time, visit_duration_minutes, pass_number, visit_status,
        identity_type, identity_number, verification_status, completed_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Completed', ?, ?, ?, ?)
    `;

    const insertParams = [
      historyCode,
      data.organization_id || 1,
      data.visitor_id,
      data.appointment_id,
      data.pass_id,
      data.checkin_id,
      data.checkout_id,
      data.reference_number || `REF-${data.visitor_id || '001'}`,
      data.visitor_photo,
      data.visitor_name || 'Visitor',
      data.visitor_email,
      data.visitor_phone,
      data.visitor_company || 'N/A',
      data.visitor_category || 'General Visitor',
      data.host_id,
      data.host_employee_name || 'N/A',
      data.department_id,
      data.department_name || 'General',
      data.branch_id,
      data.branch_name || 'Main Branch',
      data.appointment_number || `APT-${data.appointment_id || '001'}`,
      data.visit_purpose || 'General Visit',
      data.meeting_location || 'Main Reception',
      data.appointment_date ? new Date(data.appointment_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      data.checkin_time,
      checkoutTimeVal,
      durationMinutesVal,
      data.pass_number || `PASS-${data.visitor_id || '001'}`,
      data.identity_type || 'ID Card',
      data.identity_number || 'N/A',
      data.verification_status || 'Verified',
      checkoutTimeVal
    ];

    const result = await db.query(insertSql, insertParams);
    return result.insertId;
  }

  async syncPastCheckouts() {
    try {
      const unindexed = await db.query(`
        SELECT vco.id as checkout_id
        FROM visitor_checkouts vco
        LEFT JOIN visitor_histories vh ON vco.id = vh.checkout_id OR vco.checkin_id = vh.checkin_id
        WHERE vh.id IS NULL AND vco.checkout_time IS NOT NULL
        LIMIT 50
      `);

      for (const item of unindexed || []) {
        try {
          await this.createFromCheckout(item.checkout_id);
        } catch (e) {
          // continue silently
        }
      }
    } catch (err) {
      console.error('Error syncing past checkouts into visitor_histories:', err.message);
    }
  }

  async updateMetadata(id, updateData) {
    const {
      visitor_name,
      visitor_company,
      visitor_category,
      host_employee_name,
      department_name,
      visit_purpose,
      visit_status,
      remarks
    } = updateData;

    const result = await db.query(
      `UPDATE visitor_histories
       SET 
        visitor_name = COALESCE(?, visitor_name),
        visitor_company = COALESCE(?, visitor_company),
        visitor_category = COALESCE(?, visitor_category),
        host_employee_name = COALESCE(?, host_employee_name),
        department_name = COALESCE(?, department_name),
        visit_purpose = COALESCE(?, visit_purpose),
        visit_status = COALESCE(?, visit_status),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND is_deleted = FALSE`,
      [
        visitor_name,
        visitor_company,
        visitor_category,
        host_employee_name,
        department_name,
        visit_purpose,
        visit_status,
        id
      ]
    );

    return result.affectedRows > 0;
  }

  async softDelete(id) {
    const result = await db.query(
      `UPDATE visitor_histories SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  async seedSampleHistoryData() {
    // Disabled to prevent unlinked generic sample history records
    return;
  }
}

module.exports = new VisitorHistoryRepository();
