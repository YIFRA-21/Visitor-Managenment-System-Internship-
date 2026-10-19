const db = require('../../../config/db');

class CheckinRepository {
  async getPassByCode(passCode) {
    const rows = await db.query(
      `SELECT vp.*, a.scheduled_start as scheduledStart, a.scheduled_end as scheduledEnd,
              v.full_name as visitorName, v.email as visitorEmail, v.phone as visitorPhone,
              u.full_name as hostName, a.department_id as departmentId, a.status as appointmentStatus
       FROM visitor_passes vp
       JOIN appointments a ON vp.appointment_id = a.id
       JOIN visitors v ON vp.visitor_id = v.id
       JOIN users u ON a.host_id = u.id
       WHERE (vp.pass_code = ? OR vp.qr_token = ?) AND vp.status = 'ACTIVE' AND vp.deleted_at IS NULL`,
      [passCode, passCode]
    );
    return rows[0] || null;
  }

  async getPassById(passId) {
    const rows = await db.query(
      `SELECT vp.*, a.scheduled_start as scheduledStart, a.scheduled_end as scheduledEnd,
              v.full_name as visitorName, v.email as visitorEmail, v.phone as visitorPhone,
              u.full_name as hostName, a.department_id as departmentId, a.status as appointmentStatus
       FROM visitor_passes vp
       JOIN appointments a ON vp.appointment_id = a.id
       JOIN visitors v ON vp.visitor_id = v.id
       JOIN users u ON a.host_id = u.id
       WHERE vp.id = ? AND vp.deleted_at IS NULL`,
      [passId]
    );
    return rows[0] || null;
  }

  async findActiveCheckinByPass(passId) {
    const rows = await db.query(
      `SELECT c.*, vp.pass_code as passCode, a.scheduled_start as scheduledStart
       FROM checkins c
       JOIN visitor_passes vp ON c.pass_id = vp.id
       JOIN appointments a ON c.appointment_id = a.id
       WHERE c.pass_id = ? AND c.checked_out_at IS NULL AND c.deleted_at IS NULL`,
      [passId]
    );
    return rows[0] || null;
  }

  async findActiveCheckinByAppointment(appointmentId) {
    const rows = await db.query(
      `SELECT c.*, a.scheduled_start as scheduledStart, a.scheduled_end as scheduledEnd
       FROM checkins c
       JOIN appointments a ON c.appointment_id = a.id
       WHERE c.appointment_id = ? AND c.checked_out_at IS NULL AND c.deleted_at IS NULL`,
      [appointmentId]
    );
    return rows[0] || null;
  }

  async createPass(passData) {
    const {
      organizationId = 1,
      visitorId,
      appointmentId,
      passTypeId = null,
      passCode,
      qrToken,
      expiresAt,
      issuedBy,
    } = passData;

    // Check if pass_types row exists or use null
    let validPassTypeId = null;
    if (passTypeId) {
      const typeCheck = await db.query('SELECT id FROM pass_types WHERE id = ?', [passTypeId]).catch(() => []);
      if (typeCheck[0]) validPassTypeId = passTypeId;
    }

    if (appointmentId) {
      const existing = await db.query('SELECT id FROM visitor_passes WHERE appointment_id = ? LIMIT 1', [appointmentId]).catch(() => []);
      if (existing && existing[0]) {
        await db.query(
          `UPDATE visitor_passes SET pass_code = ?, qr_token = ?, status = 'ACTIVE', expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [passCode, qrToken, expiresAt, existing[0].id]
        ).catch(() => {});
        return existing[0].id;
      }
    }

    try {
      const result = await db.query(
        `INSERT INTO visitor_passes (
          organization_id, visitor_id, appointment_id, pass_type_id, pass_code,
          qr_token, status, is_printed, issued_by, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', FALSE, ?, ?)`,
        [organizationId, visitorId, appointmentId, validPassTypeId, passCode, qrToken, issuedBy, expiresAt]
      );
      return result.insertId;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY' && appointmentId) {
        const existing = await db.query('SELECT id FROM visitor_passes WHERE appointment_id = ? LIMIT 1', [appointmentId]).catch(() => []);
        if (existing && existing[0]) return existing[0].id;
      }
      throw err;
    }
  }

  async createCheckin(checkinData) {
    const {
      organizationId = 1,
      visitorId,
      facilityId = null,
      appointmentId,
      passId = null,
      receptionistId,
      checkedInAt,
      badgeNumber = null,
      isWalkIn = false,
      notes = null,
    } = checkinData;

    return db.transaction(async (tx) => {
      // Check if facility exists or set null
      let validFacilityId = null;
      if (facilityId) {
        const facCheck = await tx.execute('SELECT id FROM facilities WHERE id = ?', [facilityId]).catch(() => []);
        if (facCheck && facCheck[0]) validFacilityId = facilityId;
      }

      // 1. Create checkins record
      const checkinResult = await tx.execute(
        `INSERT INTO checkins (
          organization_id, visitor_id, facility_id, appointment_id, pass_id,
          receptionist_id, checked_in_at, badge_number, is_walk_in, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          organizationId,
          visitorId,
          validFacilityId,
          appointmentId,
          passId,
          receptionistId,
          checkedInAt,
          badgeNumber,
          isWalkIn,
          notes,
        ]
      );
      const checkinId = checkinResult.insertId;

      // 2. Update appointments status to 'CHECKED_IN'
      await tx.execute(
        `UPDATE appointments 
         SET appointment_status = 'CHECKED_IN', status = 'checked_in', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [appointmentId]
      );

      // 3. Create visitor_checkins entry (to keep compatibility with the secondary table)
      try {
        const bRow = await tx.execute('SELECT id FROM buildings LIMIT 1').catch(() => []);
        const bId = bRow && bRow[0] ? bRow[0].id : null;
        const fRow = bId ? await tx.execute('SELECT id FROM floors WHERE building_id = ? LIMIT 1', [bId]).catch(() => []) : [];
        const fId = fRow && fRow[0] ? fRow[0].id : null;

        await tx.execute(
          `INSERT INTO visitor_checkins (
            organization_id, visitor_id, appointment_id, building_id, floor_id, checkin_time, expected_checkout_time, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
          [organizationId, visitorId, appointmentId, bId, fId, checkedInAt, checkedInAt]
        );
      } catch (e) {
        console.error('[CheckinRepository] visitor_checkins insert error:', e.message);
      }

      return checkinId;
    });
  }

  async createCheckout(checkoutData) {
    const {
      checkinId,
      visitorId,
      appointmentId,
      hostId,
      receptionistId,
      checkoutTime,
      checkoutMethod = 'MANUAL',
      totalVisitDuration, // in minutes
      remarks = null,
    } = checkoutData;

    return db.transaction(async (tx) => {
      // 1. Update checkins status (set checked_out_at)
      await tx.execute(
        `UPDATE checkins 
         SET checked_out_at = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [checkoutTime, checkinId]
      );

      // 2. Resolve target visitor_checkins ID for fk_vco_checkin constraint
      let targetVCheckinId = null;
      // Try 1: find by appointment_id
      if (appointmentId) {
        const vcRow = await tx.execute(`SELECT id FROM visitor_checkins WHERE appointment_id = ? ORDER BY id DESC LIMIT 1`, [appointmentId]).catch(() => []);
        if (vcRow && vcRow[0]) {
          targetVCheckinId = vcRow[0].id;
        }
      }
      // Try 2: find any active visitor_checkins for this visitor
      if (!targetVCheckinId && visitorId) {
        const vcRow2 = await tx.execute(`SELECT id FROM visitor_checkins WHERE visitor_id = ? ORDER BY id DESC LIMIT 1`, [visitorId]).catch(() => []);
        if (vcRow2 && vcRow2[0]) {
          targetVCheckinId = vcRow2[0].id;
        }
      }
      // Try 3: create a new visitor_checkins record
      if (!targetVCheckinId) {
        try {
          const bRow = await tx.execute('SELECT id FROM buildings LIMIT 1').catch(() => []);
          const bId = bRow && bRow[0] ? bRow[0].id : null;
          const fRow = bId ? await tx.execute('SELECT id FROM floors WHERE building_id = ? LIMIT 1', [bId]).catch(() => []) : [];
          const fId = fRow && fRow[0] ? fRow[0].id : null;

          const insVc = await tx.execute(
            `INSERT INTO visitor_checkins (organization_id, visitor_id, appointment_id, building_id, floor_id, checkin_time, expected_checkout_time, status) VALUES (1, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
            [visitorId, appointmentId, bId, fId, checkoutTime, checkoutTime]
          );
          targetVCheckinId = insVc.insertId;
        } catch (e) {
          console.error('[CheckinRepository] fallback visitor_checkins insert error:', e.message);
        }
      }

      // Create visitor_checkouts entry (wrap in try/catch so main flow survives legacy table issues)
      let checkoutId = null;
      try {
        const checkoutResult = await tx.execute(
          `INSERT INTO visitor_checkouts (
            checkin_id, visitor_id, appointment_id, host_id, receptionist_id,
            checkout_time, checkout_method, checkout_status, total_visit_duration, remarks, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, TRUE)`,
          [
            targetVCheckinId,
            visitorId,
            appointmentId,
            hostId,
            receptionistId,
            checkoutTime,
            checkoutMethod,
            totalVisitDuration,
            remarks,
          ]
        );
        checkoutId = checkoutResult.insertId;

        // Sync checkout_id alias
        await tx.execute(
          `UPDATE visitor_checkouts SET checkout_id = ? WHERE id = ?`,
          [checkoutId, checkoutId]
        );
      } catch (e) {
        console.error('[CheckinRepository] visitor_checkouts insert error:', e.message);
        // Generate a synthetic checkout ID so the rest of the flow can proceed
        checkoutId = checkinId;
      }

      // 3. Update appointments status to 'CHECKED_OUT' / 'COMPLETED'
      if (appointmentId) {
        await tx.execute(
          `UPDATE appointments 
           SET appointment_status = 'CHECKED_OUT', status = 'checked_out', is_completed = TRUE, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [appointmentId]
        );
        try {
          await tx.execute(
            `UPDATE visitor_histories 
             SET visit_status = 'Completed', checkout_time = ?, visit_duration_minutes = ?
             WHERE appointment_id = ?`,
            [checkoutTime, totalVisitDuration, appointmentId]
          );
        } catch (e) {}
      }

      // 4. Set pass status to CHECKED_OUT / EXPIRED
      await tx.execute(
        `UPDATE visitor_passes vp
         JOIN checkins c ON c.pass_id = vp.id
         SET vp.status = 'CHECKED_OUT', vp.updated_at = CURRENT_TIMESTAMP
         WHERE c.id = ?`,
        [checkinId]
      );

      // 5. Update visitor_checkins legacy status to COMPLETED
      try {
        await tx.execute(
          `UPDATE visitor_checkins 
           SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
           WHERE appointment_id = ?`,
          [appointmentId]
        );
      } catch (e) {}

      // Auto-trigger creation of permanent Visitor History record
      try {
        const visitorHistoryRepository = require('../../visitor-history/repositories/visitor-history.repository');
        setImmediate(() => {
          visitorHistoryRepository.createFromCheckout(checkoutId).catch(err => console.error('Auto history snapshot error:', err));
        });
      } catch (e) {}

      return checkoutId;
    });
  }

  // ── NEW Module 10 Methods ────────────────────────────────────────────────

  async getDashboardStats(orgId, date) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const [cStats] = await db.query(
      `SELECT
        COUNT(*) AS totalCheckins,
        COUNT(CASE WHEN DATE(c.checked_in_at) = DATE(?) THEN 1 END) AS totalToday,
        COUNT(CASE WHEN c.checked_out_at IS NULL THEN 1 END) AS currentlyInside,
        COUNT(CASE WHEN c.checked_out_at IS NOT NULL THEN 1 END) AS totalCheckouts,
        COUNT(CASE WHEN c.checked_out_at IS NOT NULL AND DATE(c.checked_out_at) = DATE(?) THEN 1 END) AS checkedOutToday,
        COUNT(CASE WHEN c.is_walk_in = TRUE AND DATE(c.checked_in_at) = DATE(?) THEN 1 END) AS walkInsToday,
        AVG(CASE WHEN c.checked_out_at IS NOT NULL
              THEN TIMESTAMPDIFF(MINUTE, c.checked_in_at, c.checked_out_at) END) AS avgDurationAllTime,
        AVG(CASE WHEN c.checked_out_at IS NOT NULL AND DATE(c.checked_in_at) = DATE(?)
              THEN TIMESTAMPDIFF(MINUTE, c.checked_in_at, c.checked_out_at) END) AS avgDurationToday
       FROM checkins c
       JOIN visitors v ON c.visitor_id = v.id
       WHERE c.deleted_at IS NULL AND v.full_name IS NOT NULL AND TRIM(v.full_name) != ''`,
      [targetDate, targetDate, targetDate]
    ).catch(() => [{}]);

    const [vcStats] = await db.query(
      `SELECT
        COUNT(*) AS totalVc,
        COUNT(CASE WHEN vc.status = 'ACTIVE' THEN 1 END) AS activeInside
       FROM visitor_checkins vc
       JOIN visitors v ON vc.visitor_id = v.id
       WHERE vc.deleted_at IS NULL AND vc.is_active = 1 AND v.full_name IS NOT NULL AND TRIM(v.full_name) != ''`
    ).catch(() => [{}]);

    const [vcoStats] = await db.query(
      `SELECT
        COUNT(*) AS totalCheckouts,
        COUNT(CASE WHEN DATE(vco.checkout_time) = DATE(?) THEN 1 END) AS checkedOutToday,
        AVG(vco.total_visit_duration) AS avgDuration
       FROM visitor_checkouts vco
       JOIN visitors v ON vco.visitor_id = v.id
       WHERE vco.is_active = TRUE AND vco.deleted_at IS NULL AND v.full_name IS NOT NULL AND TRIM(v.full_name) != ''`,
      [targetDate]
    ).catch(() => [{}]);

    const totalCheckins = Math.max(Number(cStats?.totalCheckins || 0), Number(vcStats?.totalVc || 0));
    const totalCheckouts = Math.max(Number(cStats?.totalCheckouts || 0), Number(vcoStats?.totalCheckouts || 0));
    const currentlyInside = Math.max(Number(cStats?.currentlyInside || 0), Number(vcStats?.activeInside || 0));
    const avgVisitDuration = Math.round(Number(vcoStats?.avgDuration || cStats?.avgDurationToday || cStats?.avgDurationAllTime || 0));

    const pendingRows = await db.query(
      `SELECT COUNT(*) as pendingCount
       FROM appointments a
       WHERE DATE(a.scheduled_start) = DATE(?)
         AND a.appointment_status = 'APPROVED'
         AND NOT EXISTS (SELECT 1 FROM checkins c WHERE c.appointment_id = a.id AND c.deleted_at IS NULL)
         AND a.deleted_at IS NULL`,
      [targetDate]
    ).catch(() => []);

    const hourlyRows = await db.query(
      `SELECT HOUR(c.checked_in_at) AS hour, COUNT(*) AS count
       FROM checkins c
       WHERE DATE(c.checked_in_at) = DATE(?) AND c.deleted_at IS NULL
       GROUP BY HOUR(c.checked_in_at)
       ORDER BY hour ASC`,
      [targetDate]
    ).catch(() => []);

    const typeRows = await db.query(
      `SELECT
        CASE WHEN c.is_walk_in = TRUE THEN 'Walk-In' ELSE 'Pre-Registered' END AS type,
        COUNT(*) AS count
       FROM checkins c
       WHERE DATE(c.checked_in_at) = DATE(?) AND c.deleted_at IS NULL
       GROUP BY c.is_walk_in`,
      [targetDate]
    ).catch(() => []);

    return {
      totalCheckins,
      totalToday: Number(cStats?.totalToday || 0),
      totalCheckouts,
      checkedOutToday: Number(vcoStats?.checkedOutToday || cStats?.checkedOutToday || 0),
      currentlyInside,
      walkInsToday: Number(cStats?.walkInsToday || 0),
      avgVisitDuration,
      pendingCount: pendingRows[0]?.pendingCount || 0,
      hourlyDistribution: hourlyRows,
      byType: typeRows,
    };
  }

  async getPendingCheckins(date) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return db.query(
      `SELECT a.id AS appointmentId, a.reference_code AS referenceCode,
              a.scheduled_start AS scheduledStart, a.scheduled_end AS scheduledEnd,
              a.purpose, a.appointment_status AS status,
              v.id AS visitorId, v.full_name AS visitorName, v.email AS visitorEmail,
              v.phone AS visitorPhone, v.company AS visitorCompany,
              u.full_name AS hostName, d.department_name AS department,
              vp.pass_code AS passCode, vp.qr_token AS qrToken
       FROM appointments a
       JOIN visitors v ON a.visitor_id = v.id
       JOIN users u ON a.host_id = u.id
       JOIN departments d ON a.department_id = d.id
       LEFT JOIN visitor_passes vp ON vp.appointment_id = a.id AND vp.status = 'ACTIVE' AND vp.deleted_at IS NULL
       WHERE DATE(a.scheduled_start) = DATE(?)
         AND a.appointment_status = 'APPROVED'
         AND NOT EXISTS (SELECT 1 FROM checkins c WHERE c.appointment_id = a.id AND c.deleted_at IS NULL)
         AND a.deleted_at IS NULL
       ORDER BY a.scheduled_start ASC`,
      [targetDate]
    );
  }

  async getCheckinHistory(filters = {}, pagination = {}) {
    const { dateFrom, dateTo, status, isWalkIn, visitorName, search } = filters;
    const page = Math.max(1, parseInt(pagination.page) || 1);
    const limit = Math.min(100, parseInt(pagination.limit) || 20);
    const offset = (page - 1) * limit;

    const conditions = ['c.deleted_at IS NULL', 'v.id IS NOT NULL', 'v.full_name IS NOT NULL', "TRIM(v.full_name) != ''"];
    const params = [];

    if (dateFrom) { conditions.push('DATE(c.checked_in_at) >= DATE(?)'); params.push(dateFrom); }
    if (dateTo)   { conditions.push('DATE(c.checked_in_at) <= DATE(?)'); params.push(dateTo); }
    if (status === 'active')    { conditions.push('c.checked_out_at IS NULL'); }
    if (status === 'completed') { conditions.push('c.checked_out_at IS NOT NULL'); }
    if (isWalkIn !== undefined) { conditions.push('c.is_walk_in = ?'); params.push(isWalkIn ? 1 : 0); }
    if (visitorName) { conditions.push('v.full_name LIKE ?'); params.push(`%${visitorName}%`); }
    if (search) {
      conditions.push('(v.full_name LIKE ? OR a.reference_code LIKE ? OR c.badge_number LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.join(' AND ');

    const countRows = await db.query(
      `SELECT COUNT(*) AS total
       FROM checkins c
       JOIN visitors v ON c.visitor_id = v.id
       LEFT JOIN appointments a ON c.appointment_id = a.id
       WHERE ${whereClause}`,
      params
    );

    const rows = await db.query(
      `SELECT c.id, c.checked_in_at AS checkedInAt, c.checked_out_at AS checkedOutAt,
              c.badge_number AS badgeNumber, c.is_walk_in AS isWalkIn, c.notes,
              TIMESTAMPDIFF(MINUTE, c.checked_in_at, IFNULL(c.checked_out_at, NOW())) AS durationMinutes,
              v.id AS visitorId, v.full_name AS visitorName, v.email AS visitorEmail,
              v.phone AS visitorPhone, v.company AS visitorCompany, v.photo_url AS photoUrl,
              a.id AS appointmentId, a.reference_code AS referenceCode,
              a.scheduled_start AS scheduledStart, a.purpose,
              u.full_name AS hostName, d.department_name AS department,
              r.full_name AS receptionistName
       FROM checkins c
       JOIN visitors v ON c.visitor_id = v.id
       LEFT JOIN appointments a ON c.appointment_id = a.id
       LEFT JOIN users u ON a.host_id = u.id
       LEFT JOIN departments d ON a.department_id = d.id
       LEFT JOIN users r ON c.receptionist_id = r.id
       WHERE ${whereClause}
       ORDER BY c.checked_in_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      data: rows,
      pagination: { page, limit, total: countRows[0]?.total || 0, pages: Math.ceil((countRows[0]?.total || 0) / limit) },
    };
  }

  async getAnalytics(dateFrom, dateTo) {
    const from = dateFrom || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const to = dateTo || new Date().toISOString().split('T')[0];

    const daily = await db.query(
      `SELECT DATE(c.checked_in_at) AS date,
              COUNT(*) AS total,
              SUM(CASE WHEN c.is_walk_in = TRUE THEN 1 ELSE 0 END) AS walkIns,
              SUM(CASE WHEN c.checked_out_at IS NOT NULL THEN 1 ELSE 0 END) AS completed,
              AVG(CASE WHEN c.checked_out_at IS NOT NULL
                    THEN TIMESTAMPDIFF(MINUTE, c.checked_in_at, c.checked_out_at) END) AS avgDuration
       FROM checkins c
       WHERE DATE(c.checked_in_at) BETWEEN DATE(?) AND DATE(?) AND c.deleted_at IS NULL
       GROUP BY DATE(c.checked_in_at)
       ORDER BY date ASC`,
      [from, to]
    );

    const hourly = await db.query(
      `SELECT HOUR(c.checked_in_at) AS hour, COUNT(*) AS count
       FROM checkins c
       WHERE DATE(c.checked_in_at) BETWEEN DATE(?) AND DATE(?) AND c.deleted_at IS NULL
       GROUP BY HOUR(c.checked_in_at)
       ORDER BY hour ASC`,
      [from, to]
    );

    const summary = await db.query(
      `SELECT
        COUNT(*) AS totalCheckins,
        SUM(CASE WHEN c.is_walk_in = TRUE THEN 1 ELSE 0 END) AS totalWalkIns,
        SUM(CASE WHEN c.checked_out_at IS NOT NULL THEN 1 ELSE 0 END) AS totalCompleted,
        AVG(CASE WHEN c.checked_out_at IS NOT NULL
              THEN TIMESTAMPDIFF(MINUTE, c.checked_in_at, c.checked_out_at) END) AS avgDuration
       FROM checkins c
       WHERE DATE(c.checked_in_at) BETWEEN DATE(?) AND DATE(?) AND c.deleted_at IS NULL`,
      [from, to]
    );

    return { daily, hourly, summary: summary[0], dateFrom: from, dateTo: to };
  }

  async registerWalkIn(visitorData, receptionistId) {
    const {
      fullName, email, phone, company, purpose,
      hostId, departmentId, organizationId = 1, badgeNumber = null,
    } = visitorData;

    return db.transaction(async (tx) => {
      // 1. Upsert visitor
      let visitorId;
      if (email) {
        const existing = await tx.execute('SELECT id FROM visitors WHERE email = ? AND deleted_at IS NULL LIMIT 1', [email]);
        if (existing[0]) {
          visitorId = existing[0].id;
          await tx.execute(
            `UPDATE visitors SET full_name = ?, phone = ?, company = ?, updated_at = NOW() WHERE id = ?`,
            [fullName, phone || null, company || null, visitorId]
          );
        }
      }
      if (!visitorId) {
        const vRes = await tx.execute(
          `INSERT INTO visitors (organization_id, full_name, email, phone, company, visitor_type, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'WALK_IN', 'active', NOW(), NOW())`,
          [organizationId, fullName, email || null, phone || null, company || null]
        );
        visitorId = vRes.insertId;
      }

      // 2. Create appointment
      const now = new Date();
      const endTime = new Date(now.getTime() + 60 * 60000);
      const apptNum = `APT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const refCode = `WLK-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const apptRes = await tx.execute(
        `INSERT INTO appointments (organization_id, visitor_id, host_id, department_id, purpose,
          appointment_number, reference_code, appointment_type_id, visit_purpose_id, expected_duration_minutes,
          appointment_status, status, approval_status, scheduled_start, scheduled_end, is_walk_in, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 60, 'APPROVED', 'approved', 'APPROVED', ?, ?, TRUE, NOW(), NOW())`,
        [organizationId, visitorId, hostId || 1, departmentId || 1, purpose || 'Walk-In Visit',
          apptNum, refCode,
          now.toISOString().slice(0, 19).replace('T', ' '),
          endTime.toISOString().slice(0, 19).replace('T', ' ')]
      );
      const appointmentId = apptRes.insertId;

      // 4. Create checkin
      const checkedInAt = now.toISOString().slice(0, 19).replace('T', ' ');
      const ciRes = await tx.execute(
        `INSERT INTO checkins (organization_id, visitor_id, appointment_id, receptionist_id,
          checked_in_at, badge_number, is_walk_in, notes)
         VALUES (?, ?, ?, ?, ?, ?, TRUE, ?)`,
        [organizationId, visitorId, appointmentId, receptionistId, checkedInAt, badgeNumber, `Walk-in: ${purpose || 'General visit'}`]
      );

      // 5. Legacy visitor_checkins
      await tx.execute(
        `INSERT INTO visitor_checkins (organization_id, visitor_id, appointment_id, receptionist_id, checked_in_at, status)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
        [organizationId, visitorId, appointmentId, receptionistId, checkedInAt]
      ).catch(() => {});

      return {
        checkinId: ciRes.insertId,
        visitorId,
        appointmentId,
        referenceCode: refCode,
        visitorName: fullName,
        checkedInAt,
      };
    });
  }

  async searchVisitors(q, limit = 20) {
    if (!q || q.length < 1) return [];
    const cleanQ = String(q).trim().replace(/^#/, '');
    const numId = parseInt(cleanQ, 10);
    const validNum = !isNaN(numId) ? numId : -1;
    const term = `%${cleanQ}%`;

    return db.query(
      `SELECT v.id, v.full_name AS fullName, v.email, v.phone, v.company, v.photo_url AS photoUrl,
              v.visitor_code AS visitorCode, v.id_number AS idNumber,
              MAX(a.scheduled_start) AS lastVisit, COUNT(DISTINCT a.id) AS totalVisits,
              MAX(a.reference_code) AS latestReferenceCode,
              MAX(a.appointment_number) AS latestAppointmentNumber,
              MAX(a.appointment_status) AS latestStatus,
              MAX(a.id) AS latestAppointmentId,
              MAX(CASE WHEN c.checked_out_at IS NULL AND c.deleted_at IS NULL THEN c.id ELSE NULL END) AS activeCheckinId,
              MAX(CASE WHEN c.checked_out_at IS NULL AND c.deleted_at IS NULL THEN c.badge_number ELSE NULL END) AS activeBadgeNumber,
              MAX(CASE WHEN c.checked_out_at IS NULL AND c.deleted_at IS NULL THEN 1 ELSE 0 END) AS isCurrentlyInside
       FROM visitors v
       LEFT JOIN appointments a ON a.visitor_id = v.id AND a.deleted_at IS NULL
       LEFT JOIN checkins c ON c.visitor_id = v.id AND c.deleted_at IS NULL
       WHERE v.deleted_at IS NULL
         AND (
           v.full_name LIKE ? 
           OR v.email LIKE ? 
           OR v.phone LIKE ? 
           OR v.company LIKE ?
           OR v.id_number LIKE ?
           OR v.visitor_code LIKE ?
           OR v.id = ?
           OR a.reference_code LIKE ?
           OR a.appointment_number LIKE ?
           OR c.badge_number LIKE ?
         )
       GROUP BY v.id
       ORDER BY isCurrentlyInside DESC, lastVisit DESC
       LIMIT ?`,
      [term, term, term, term, term, term, validNum, term, term, term, limit]
    );
  }
}

module.exports = new CheckinRepository();
