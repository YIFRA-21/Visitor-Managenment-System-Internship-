const db = require('../../../config/db');

class VisitorDashboardRepository {
  /**
   * Helper to append organization/branch scoping filters
   */
  _buildScopeFilter(orgId, branchId, alias = 'v') {
    const conditions = [];
    const params = [];
    if (orgId) {
      conditions.push(`${alias}.organization_id = ?`);
      params.push(orgId);
    }
    if (branchId) {
      conditions.push(`${alias}.branch_id = ?`);
      params.push(branchId);
    }
    return {
      clause: conditions.length > 0 ? ` AND ${conditions.join(' AND ')}` : '',
      params
    };
  }

  // ─── 1. KPI Cards ──────────────────────────────────────────────────────────
  async getKpiCards(filters = {}) {
    const { organizationId, branchId, dateFrom, dateTo } = filters;
    const scope = this._buildScopeFilter(organizationId, branchId, 'v');

    let dateFilter = '';
    const dateParams = [];
    if (dateFrom && dateTo) {
      dateFilter = ` AND v.created_at BETWEEN ? AND ?`;
      dateParams.push(dateFrom, dateTo);
    }

    const sql = `
      SELECT
        COUNT(*) as totalVisitors,
        SUM(CASE WHEN (v.status = 'ACTIVE' OR v.status = 'APPROVED') AND (v.is_archived = 0 OR v.is_archived IS NULL) THEN 1 ELSE 0 END) as activeVisitors,
        SUM(CASE WHEN DATE(v.created_at) = CURRENT_DATE THEN 1 ELSE 0 END) as todayVisitors,
        SUM(CASE WHEN v.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as newVisitors,
        SUM(CASE WHEN v.id_verification_status = 'PENDING' OR v.registration_status = 'PENDING' THEN 1 ELSE 0 END) as pendingVerification,
        SUM(CASE WHEN v.id_verification_status = 'VERIFIED' OR v.registration_status = 'APPROVED' THEN 1 ELSE 0 END) as verifiedVisitors,
        SUM(CASE WHEN v.is_archived = 1 OR v.is_archived = TRUE THEN 1 ELSE 0 END) as archivedVisitors
      FROM visitors v
      WHERE (v.is_active = 1 OR v.is_active IS NULL) AND v.deleted_at IS NULL AND (v.status != 'DELETED' OR v.status IS NULL)
        ${scope.clause} ${dateFilter}
    `;

    const params = [...scope.params, ...dateParams];
    const rows = await db.query(sql, params).catch(() => [{}]);
    const stats = rows[0] || {};

    // Count real duplicate records
    const dupRows = await db.query(`
      SELECT COUNT(*) as duplicateCount
      FROM (
        SELECT v.email
        FROM visitors v
        WHERE (v.is_active = 1 OR v.is_active IS NULL) AND v.deleted_at IS NULL AND (v.status != 'DELETED' OR v.status IS NULL)
          AND v.email IS NOT NULL AND v.email != '' ${scope.clause}
        GROUP BY v.email
        HAVING COUNT(*) > 1
      ) dups
    `, scope.params).catch(() => [{ duplicateCount: 0 }]);

    const duplicateCount = parseInt(dupRows[0]?.duplicateCount || 0);

    return {
      totalVisitors: parseInt(stats.totalVisitors || 0),
      todayVisitors: parseInt(stats.todayVisitors || 0),
      activeVisitors: parseInt(stats.activeVisitors || 0),
      newVisitors: parseInt(stats.newVisitors || 0),
      pendingVerification: parseInt(stats.pendingVerification || 0),
      verifiedVisitors: parseInt(stats.verifiedVisitors || 0),
      archivedVisitors: parseInt(stats.archivedVisitors || 0),
      duplicateRecords: duplicateCount,
      lastUpdated: new Date().toISOString()
    };
  }

  // ─── 2. Alerts Panel ────────────────────────────────────────────────────────
  async getAlerts(filters = {}) {
    const { organizationId } = filters;
    const orgParam = organizationId ? [organizationId] : [];
    const orgFilter = organizationId ? 'AND v.organization_id = ?' : '';

    const alerts = [];

    // Duplicate Visitors Alert
    const dupRows = await db.query(`
      SELECT email, COUNT(*) as cnt
      FROM visitors v
      WHERE v.is_active = TRUE ${orgFilter}
      GROUP BY email HAVING cnt > 1
      LIMIT 10
    `, orgParam);

    if (dupRows.length > 0) {
      alerts.push({
        id: 'alt-dup',
        type: 'DUPLICATE_VISITORS',
        title: 'Duplicate Visitor Profiles Detected',
        description: `${dupRows.length} group(s) of visitor records share duplicate email or contact numbers.`,
        severity: 'HIGH',
        count: dupRows.length,
        actionRequired: 'Review and merge duplicate profiles'
      });
    }

    // Missing Documents Alert
    const missingDocsRows = await db.query(`
      SELECT COUNT(DISTINCT v.id) as cnt
      FROM visitors v
      LEFT JOIN visitor_documents vd ON v.id = vd.visitor_id AND vd.deleted_at IS NULL
      WHERE v.is_active = TRUE AND vd.id IS NULL ${orgFilter}
    `, orgParam);

    const missingDocsCount = missingDocsRows[0]?.cnt || 0;
    if (missingDocsCount > 0) {
      alerts.push({
        id: 'alt-missing-doc',
        type: 'MISSING_DOCUMENTS',
        title: 'Visitors Missing Verification Documents',
        description: `${missingDocsCount} registered visitors do not have identity documents uploaded.`,
        severity: 'MEDIUM',
        count: missingDocsCount,
        actionRequired: 'Upload government-issued identification'
      });
    }

    // Expired IDs Alert
    const expiredDocsRows = await db.query(`
      SELECT COUNT(DISTINCT vd.id) as cnt
      FROM visitor_documents vd
      JOIN visitors v ON vd.visitor_id = v.id
      WHERE vd.deleted_at IS NULL AND vd.expiry_date < CURRENT_DATE ${orgFilter}
    `, orgParam);

    const expiredDocsCount = expiredDocsRows[0]?.cnt || 0;
    if (expiredDocsCount > 0) {
      alerts.push({
        id: 'alt-expired-doc',
        type: 'EXPIRED_IDS',
        title: 'Expired Identification Documents',
        description: `${expiredDocsCount} visitor document(s) have passed their expiration date.`,
        severity: 'HIGH',
        count: expiredDocsCount,
        actionRequired: 'Request updated identity credentials'
      });
    }

    // Incomplete Profiles Alert
    const incompleteRows = await db.query(`
      SELECT COUNT(*) as cnt
      FROM visitors v
      WHERE v.is_active = TRUE AND (v.photo_url IS NULL OR v.id_number IS NULL OR v.nationality IS NULL) ${orgFilter}
    `, orgParam);

    const incompleteCount = incompleteRows[0]?.cnt || 0;
    if (incompleteCount > 0) {
      alerts.push({
        id: 'alt-incomplete',
        type: 'INCOMPLETE_PROFILES',
        title: 'Incomplete Visitor Profiles',
        description: `${incompleteCount} profiles are missing photographs, ID numbers, or nationality.`,
        severity: 'LOW',
        count: incompleteCount,
        actionRequired: 'Complete profile information'
      });
    }

    // Registration Errors Alert
    const regErrorRows = await db.query(`
      SELECT COUNT(*) as cnt
      FROM visitors v
      WHERE v.registration_status = 'REJECTED' AND v.is_active = TRUE ${orgFilter}
    `, orgParam);

    const regErrorCount = regErrorRows[0]?.cnt || 0;
    if (regErrorCount > 0) {
      alerts.push({
        id: 'alt-reg-err',
        type: 'REGISTRATION_ERRORS',
        title: 'Rejected Registration Applications',
        description: `${regErrorCount} visitor registrations were rejected during security verification.`,
        severity: 'MEDIUM',
        count: regErrorCount,
        actionRequired: 'Audit rejected registration logs'
      });
    }

    return alerts;
  }

  // ─── 3. Activity Timeline ───────────────────────────────────────────────────
  async getActivityTimeline(filters = {}, limit = 15) {
    const { organizationId } = filters;
    const scope = this._buildScopeFilter(organizationId, null, 'v');

    const sql = `
      SELECT
        'VISITOR_REGISTERED' as activityType,
        v.id as visitorId,
        v.full_name as visitorName,
        v.email,
        'New visitor profile registered' as description,
        v.created_at as timestamp
      FROM visitors v
      WHERE (v.is_active = 1 OR v.is_active IS NULL) AND v.deleted_at IS NULL AND (v.status != 'DELETED' OR v.status IS NULL) ${scope.clause}
      
      UNION ALL

      SELECT
        'PROFILE_UPDATED' as activityType,
        v.id as visitorId,
        v.full_name as visitorName,
        v.email,
        'Visitor profile updated' as description,
        v.updated_at as timestamp
      FROM visitors v
      WHERE (v.is_active = 1 OR v.is_active IS NULL) AND v.deleted_at IS NULL AND (v.status != 'DELETED' OR v.status IS NULL) AND v.updated_at > v.created_at ${scope.clause}

      UNION ALL

      SELECT
        'DOCUMENT_UPLOADED' as activityType,
        v.id as visitorId,
        v.full_name as visitorName,
        v.email,
        CONCAT('Uploaded ', vd.document_type, ' document') as description,
        vd.created_at as timestamp
      FROM visitor_documents vd
      JOIN visitors v ON vd.visitor_id = v.id
      WHERE vd.deleted_at IS NULL AND (v.is_active = 1 OR v.is_active IS NULL) AND v.deleted_at IS NULL AND (v.status != 'DELETED' OR v.status IS NULL) ${scope.clause}

      ORDER BY timestamp DESC
      LIMIT ?
    `;

    const params = [...scope.params, ...scope.params, ...scope.params, parseInt(limit)];
    return db.query(sql, params);
  }

  // ─── 4. Charts Data ────────────────────────────────────────────────────────
  async getChartsData(filters = {}) {
    const { organizationId } = filters;
    const scope = this._buildScopeFilter(organizationId, null, 'v');

    // 1. Registration Trend (Last 7 Days)
    const trendSql = `
      SELECT
        DATE_FORMAT(v.created_at, '%Y-%m-%d') as date,
        DATE_FORMAT(v.created_at, '%a') as dayName,
        COUNT(*) as count
      FROM visitors v
      WHERE v.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY) AND (v.is_active = 1 OR v.is_active IS NULL) AND v.deleted_at IS NULL AND (v.status != 'DELETED' OR v.status IS NULL) ${scope.clause}
      GROUP BY DATE_FORMAT(v.created_at, '%Y-%m-%d'), DATE_FORMAT(v.created_at, '%a')
      ORDER BY date ASC
    `;
    const trend = await db.query(trendSql, scope.params);

    // 2. Visitor Categories
    const categoriesSql = `
      SELECT
        COALESCE(vt.type_name, v.category, 'General Visitor') as categoryName,
        COUNT(*) as count
      FROM visitors v
      LEFT JOIN visitor_types vt ON v.visitor_type_id = vt.id
      WHERE (v.is_active = 1 OR v.is_active IS NULL) AND v.deleted_at IS NULL AND (v.status != 'DELETED' OR v.status IS NULL) ${scope.clause}
      GROUP BY categoryName
      ORDER BY count DESC
      LIMIT 6
    `;
    const categories = await db.query(categoriesSql, scope.params);

    // 3. Nationality Distribution
    const nationalitySql = `
      SELECT
        COALESCE(v.nationality, 'Unspecified') as nationality,
        COUNT(*) as count
      FROM visitors v
      WHERE (v.is_active = 1 OR v.is_active IS NULL) AND v.deleted_at IS NULL AND (v.status != 'DELETED' OR v.status IS NULL) ${scope.clause}
      GROUP BY COALESCE(v.nationality, 'Unspecified')
      ORDER BY count DESC
      LIMIT 6
    `;
    const nationality = await db.query(nationalitySql, scope.params);

    // 4. Monthly Registrations (Last 6 Months)
    const monthlySql = `
      SELECT
        DATE_FORMAT(v.created_at, '%b %Y') as monthName,
        COUNT(*) as count
      FROM visitors v
      WHERE v.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH) AND (v.is_active = 1 OR v.is_active IS NULL) AND v.deleted_at IS NULL AND (v.status != 'DELETED' OR v.status IS NULL) ${scope.clause}
      GROUP BY DATE_FORMAT(v.created_at, '%Y-%m'), DATE_FORMAT(v.created_at, '%b %Y')
      ORDER BY DATE_FORMAT(v.created_at, '%Y-%m') ASC
    `;
    const monthly = await db.query(monthlySql, scope.params);

    // 5. Verification Status
    const verificationSql = `
      SELECT
        v.registration_status as status,
        COUNT(*) as count
      FROM visitors v
      WHERE (v.is_active = 1 OR v.is_active IS NULL) AND v.deleted_at IS NULL AND (v.status != 'DELETED' OR v.status IS NULL) ${scope.clause}
      GROUP BY v.registration_status
    `;
    const verification = await db.query(verificationSql, scope.params);

    return {
      registrationTrend: trend,
      categoriesDistribution: categories,
      nationalityDistribution: nationality,
      monthlyRegistrations: monthly,
      verificationStatus: verification
    };
  }

  // ─── 5. Recent Visitors Table ──────────────────────────────────────────────
  async getRecentVisitors(filters = {}) {
    const { organizationId, branchId, category, status, search, limit = 10, offset = 0 } = filters;
    const scope = this._buildScopeFilter(organizationId, branchId, 'v');

    let sql = `
      SELECT
        v.id,
        v.visitor_id as visitorId,
        v.full_name as visitorName,
        v.first_name as firstName,
        v.last_name as lastName,
        v.email,
        v.phone,
        COALESCE(MAX(vt.type_name), v.category, 'General Visitor') as category,
        MAX(o.name) as organizationName,
        MAX(ob.branch_name) as branchName,
        MAX(d.name) as departmentName,
        v.created_at as registrationDate,
        v.registration_status as verificationStatus,
        v.status as visitorStatus,
        v.photo_url as photoUrl,
        v.id_type as idType,
        v.id_number as idNumber,
        v.nationality
      FROM visitors v
      LEFT JOIN visitor_types vt ON v.visitor_type_id = vt.id
      LEFT JOIN organizations o ON v.organization_id = o.id
      LEFT JOIN organization_branches ob ON v.organization_id = ob.organization_id
      LEFT JOIN (
        SELECT visitor_id, MAX(department_id) as department_id FROM appointments GROUP BY visitor_id
      ) latest_app ON latest_app.visitor_id = v.id
      LEFT JOIN departments d ON latest_app.department_id = d.id
      WHERE (v.is_active = 1 OR v.is_active IS NULL) AND v.deleted_at IS NULL AND (v.status != 'DELETED' OR v.status IS NULL) ${scope.clause}
    `;

    const params = [...scope.params];

    if (category) {
      sql += ` AND (v.category = ? OR vt.type_name = ?)`;
      params.push(category, category);
    }

    if (status) {
      sql += ` AND v.status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (v.full_name LIKE ? OR v.email LIKE ? OR v.phone LIKE ? OR v.id_number LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    sql += ` GROUP BY v.id ORDER BY v.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    return db.query(sql, params);
  }

  // ─── 6. Pending Tasks ─────────────────────────────────────────────────────
  async getPendingTasks(filters = {}) {
    const { organizationId } = filters;
    const scope = this._buildScopeFilter(organizationId, null, 'v');

    // Awaiting Verification
    const awaitingVerif = await db.query(`
      SELECT COUNT(*) as cnt FROM visitors v WHERE v.registration_status = 'PENDING' AND v.is_active = TRUE ${scope.clause}
    `, scope.params);

    // Duplicate Visitors
    const dups = await db.query(`
      SELECT COUNT(*) as cnt FROM (
        SELECT email FROM visitors v WHERE v.is_active = TRUE ${scope.clause} GROUP BY email HAVING COUNT(*) > 1
      ) t
    `, scope.params);

    // Missing Photos
    const missingPhotos = await db.query(`
      SELECT COUNT(*) as cnt FROM visitors v WHERE (v.photo_url IS NULL OR v.photo_url = '') AND v.is_active = TRUE ${scope.clause}
    `, scope.params);

    // Missing Documents
    const missingDocs = await db.query(`
      SELECT COUNT(DISTINCT v.id) as cnt
      FROM visitors v
      LEFT JOIN visitor_documents vd ON v.id = vd.visitor_id AND vd.deleted_at IS NULL
      WHERE vd.id IS NULL AND v.is_active = TRUE ${scope.clause}
    `, scope.params);

    // Pending Approvals (Appointments)
    const pendingAppr = await db.query(`
      SELECT COUNT(*) as cnt FROM appointments a WHERE a.appointment_status = 'REQUESTED' AND a.deleted_at IS NULL
    `);

    return [
      {
        id: 'task-1',
        title: 'Visitors Awaiting Verification',
        category: 'Identity Verification',
        count: awaitingVerif[0]?.cnt || 0,
        priority: 'HIGH',
        route: '?view=verification'
      },
      {
        id: 'task-2',
        title: 'Duplicate Visitor Profiles',
        category: 'Data Integrity',
        count: dups[0]?.cnt || 0,
        priority: 'MEDIUM',
        route: '?view=visitor_profiles'
      },
      {
        id: 'task-3',
        title: 'Visitors Missing Photo',
        category: 'Profile Completion',
        count: missingPhotos[0]?.cnt || 0,
        priority: 'LOW',
        route: '?view=photos'
      },
      {
        id: 'task-4',
        title: 'Visitors Missing ID Documents',
        category: 'Compliance',
        count: missingDocs[0]?.cnt || 0,
        priority: 'HIGH',
        route: '?view=visitor_documents'
      },
      {
        id: 'task-5',
        title: 'Pending Appointment Approvals',
        category: 'Approvals',
        count: pendingAppr[0]?.cnt || 0,
        priority: 'MEDIUM',
        route: '?view=requests'
      }
    ];
  }

  // ─── 7. Quick Search ──────────────────────────────────────────────────────
  async quickSearch(queryStr, filters = {}) {
    if (!queryStr || queryStr.trim().length === 0) return [];
    const { organizationId } = filters;
    const scope = this._buildScopeFilter(organizationId, null, 'v');

    const searchWildcard = `%${queryStr.trim()}%`;
    const sql = `
      SELECT
        v.id,
        v.visitor_id as visitorId,
        v.full_name as visitorName,
        v.email,
        v.phone,
        v.id_type as idType,
        v.id_number as idNumber,
        v.nationality,
        COALESCE(MAX(vt.type_name), v.category, 'General Visitor') as category,
        v.registration_status as verificationStatus,
        v.status as visitorStatus,
        MAX(a.reference_code) as latestAppointmentRef
      FROM visitors v
      LEFT JOIN visitor_types vt ON v.visitor_type_id = vt.id
      LEFT JOIN appointments a ON a.visitor_id = v.id
      WHERE v.is_active = TRUE ${scope.clause}
        AND (
          v.id = ?
          OR v.full_name LIKE ?
          OR v.email LIKE ?
          OR v.phone LIKE ?
          OR v.id_number LIKE ?
          OR a.reference_code LIKE ?
        )
      GROUP BY v.id
      LIMIT 15
    `;

    const numericId = parseInt(queryStr.trim()) || 0;
    const params = [
      ...scope.params,
      numericId,
      searchWildcard,
      searchWildcard,
      searchWildcard,
      searchWildcard,
      searchWildcard
    ];

    return db.query(sql, params);
  }

  // ─── 8. Comprehensive Statistics ──────────────────────────────────────────
  async getDetailedStatistics(filters = {}) {
    const kpi = await this.getKpiCards(filters);
    const charts = await this.getChartsData(filters);
    const alerts = await this.getAlerts(filters);
    return {
      kpi,
      charts,
      alertsCount: alerts.length
    };
  }
}

module.exports = new VisitorDashboardRepository();
