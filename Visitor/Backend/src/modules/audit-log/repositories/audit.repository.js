const db = require('../../../config/db');

class AuditRepository {
  async log(logData) {
    const {
      userId = null,
      actorId = null,
      action,
      module = 'AUTH',
      entity = null,
      recordId = null,
      oldValues = null,
      newValues = null,
      ipAddress = null,
      userAgent = null,
      browser = null,
      device = null,
      httpMethod = null,
      endpoint = null,
      status = 'SUCCESS',
      severity = 'LOW',
    } = logData;

    // Use either userId or actorId
    const activeActor = actorId || userId;
    const logId = Date.now() * 1000 + Math.floor(Math.random() * 1000);

    try {
      await db.query(
        `INSERT INTO audit_logs (
          id, user_id, actor_id, action, module, entity, table_name, record_id, entity_id,
          old_values, new_values, metadata_json, ip_address, user_agent, browser, device,
          http_method, endpoint, status, severity, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          logId,
          activeActor,
          activeActor,
          action,
          module,
          entity,
          entity, // table_name
          recordId,
          recordId, // entity_id
          oldValues ? (typeof oldValues === 'string' ? oldValues : JSON.stringify(oldValues)) : null,
          newValues ? (typeof newValues === 'string' ? newValues : JSON.stringify(newValues)) : null,
          newValues ? (typeof newValues === 'string' ? newValues : JSON.stringify(newValues)) : null, // metadata_json
          ipAddress,
          userAgent,
          browser,
          device,
          httpMethod,
          endpoint,
          status,
          severity,
        ]
      );
    } catch (err) {
      console.warn('[AuditRepository] Error recording audit log:', err.message);
    }
  }

  async logEvent(eventData) {
    return this.log({
      action: eventData.event_type || eventData.action,
      userId: eventData.user_id || eventData.userId,
      actorId: eventData.actor_id || eventData.actorId || eventData.user_id,
      entity: eventData.entity_type || eventData.entity,
      recordId: eventData.entity_id || eventData.recordId,
      module: eventData.module || 'RBAC',
      newValues: eventData.details,
      status: eventData.status || 'SUCCESS',
      severity: eventData.severity || 'LOW',
    });
  }

  async findPaginated(filters = {}) {
    const page = Math.max(1, parseInt(filters.page || 1, 10));
    const limit = Math.min(200, Math.max(1, parseInt(filters.limit || 25, 10)));
    const offset = (page - 1) * limit;

    let whereConditions = [];
    const params = [];

    // Filter by Process / Module
    if (filters.module && filters.module !== 'ALL') {
      whereConditions.push(`al.module = ?`);
      params.push(filters.module);
    }

    // Filter by Action
    if (filters.action && filters.action !== 'ALL') {
      whereConditions.push(`al.action = ?`);
      params.push(filters.action);
    }

    // Filter by Severity
    if (filters.severity && filters.severity !== 'ALL') {
      whereConditions.push(`al.severity = ?`);
      params.push(filters.severity.toUpperCase());
    }

    // Filter by Status
    if (filters.status && filters.status !== 'ALL') {
      whereConditions.push(`al.status = ?`);
      params.push(filters.status.toUpperCase());
    }

    // Filter by User / Actor ID
    if (filters.userId || filters.actorId) {
      const actId = parseInt(filters.userId || filters.actorId);
      whereConditions.push(`(al.actor_id = ? OR al.user_id = ?)`);
      params.push(actId, actId);
    }

    // Filter by Entity
    if (filters.entity && filters.entity !== 'ALL') {
      whereConditions.push(`(al.entity = ? OR al.table_name = ?)`);
      params.push(filters.entity, filters.entity);
    }

    // Filter by Date Range
    if (filters.startDate) {
      whereConditions.push(`al.created_at >= ?`);
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      whereConditions.push(`al.created_at <= ?`);
      params.push(filters.endDate);
    }

    // Text Search
    if (filters.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      whereConditions.push(`(
        al.action LIKE ? OR 
        al.module LIKE ? OR 
        al.entity LIKE ? OR 
        al.ip_address LIKE ? OR 
        u.full_name LIKE ? OR 
        u.email LIKE ? OR 
        u.username LIKE ?
      )`);
      params.push(term, term, term, term, term, term, term);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count Total
    const countSql = `
      SELECT COUNT(*) AS total
      FROM audit_logs al
      LEFT JOIN users u ON COALESCE(al.actor_id, al.user_id) = u.id
      ${whereClause}
    `;
    const [countRes] = await db.query(countSql, params);
    const total = countRes ? Number(countRes.total || 0) : 0;

    // Sorting Whitelist
    const validSortCols = {
      created_at: 'al.created_at',
      action: 'al.action',
      module: 'al.module',
      severity: 'al.severity',
      status: 'al.status',
    };
    const sortBy = validSortCols[filters.sortBy] || 'al.created_at';
    const sortOrder = (filters.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Data Fetch
    const dataSql = `
      SELECT 
        al.audit_id,
        COALESCE(al.id, al.audit_id) AS id,
        COALESCE(al.actor_id, al.user_id) AS actor_id,
        al.user_id,
        al.action,
        al.module,
        COALESCE(al.entity, al.table_name, 'System') AS entity,
        COALESCE(al.record_id, al.entity_id) AS record_id,
        al.old_values,
        al.new_values,
        al.metadata_json,
        al.ip_address,
        al.user_agent,
        al.browser,
        al.device,
        al.http_method,
        al.endpoint,
        COALESCE(al.status, 'SUCCESS') AS status,
        COALESCE(al.severity, 'LOW') AS severity,
        al.created_at,
        u.full_name AS actor_name,
        u.email AS actor_email,
        u.username AS actor_username,
        u.role AS actor_role,
        u.avatar_url AS actor_avatar
      FROM audit_logs al
      LEFT JOIN users u ON COALESCE(al.actor_id, al.user_id) = u.id
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...params, limit, offset];
    const rows = await db.query(dataSql, dataParams);

    // Format and parse JSON fields safely
    const formattedData = (rows || []).map((row) => {
      let parsedOld = null;
      let parsedNew = null;
      let parsedMeta = null;

      try {
        if (typeof row.old_values === 'string') parsedOld = JSON.parse(row.old_values);
        else parsedOld = row.old_values;
      } catch (_) { parsedOld = row.old_values; }

      try {
        if (typeof row.new_values === 'string') parsedNew = JSON.parse(row.new_values);
        else parsedNew = row.new_values;
      } catch (_) { parsedNew = row.new_values; }

      try {
        if (typeof row.metadata_json === 'string') parsedMeta = JSON.parse(row.metadata_json);
        else parsedMeta = row.metadata_json;
      } catch (_) { parsedMeta = row.metadata_json; }

      return {
        ...row,
        old_values: parsedOld,
        new_values: parsedNew,
        metadata_json: parsedMeta,
        actor_name: row.actor_name || (row.actor_id ? `User #${row.actor_id}` : 'System Engine'),
      };
    });

    return {
      data: formattedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findAll(filters = {}) {
    const res = await this.findPaginated({ ...filters, limit: filters.limit || 1000, page: 1 });
    return res.data;
  }

  async findById(id) {
    const sql = `
      SELECT 
        al.audit_id,
        COALESCE(al.id, al.audit_id) AS id,
        COALESCE(al.actor_id, al.user_id) AS actor_id,
        al.user_id,
        al.action,
        al.module,
        COALESCE(al.entity, al.table_name, 'System') AS entity,
        COALESCE(al.record_id, al.entity_id) AS record_id,
        al.old_values,
        al.new_values,
        al.metadata_json,
        al.ip_address,
        al.user_agent,
        al.browser,
        al.device,
        al.http_method,
        al.endpoint,
        COALESCE(al.status, 'SUCCESS') AS status,
        COALESCE(al.severity, 'LOW') AS severity,
        al.created_at,
        u.full_name AS actor_name,
        u.email AS actor_email,
        u.username AS actor_username,
        u.role AS actor_role,
        u.avatar_url AS actor_avatar
      FROM audit_logs al
      LEFT JOIN users u ON COALESCE(al.actor_id, al.user_id) = u.id
      WHERE (al.id = ? OR al.audit_id = ?)
      LIMIT 1
    `;
    const rows = await db.query(sql, [id, id]);
    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    let parsedOld = null;
    let parsedNew = null;
    let parsedMeta = null;

    try {
      if (typeof row.old_values === 'string') parsedOld = JSON.parse(row.old_values);
      else parsedOld = row.old_values;
    } catch (_) { parsedOld = row.old_values; }

    try {
      if (typeof row.new_values === 'string') parsedNew = JSON.parse(row.new_values);
      else parsedNew = row.new_values;
    } catch (_) { parsedNew = row.new_values; }

    try {
      if (typeof row.metadata_json === 'string') parsedMeta = JSON.parse(row.metadata_json);
      else parsedMeta = row.metadata_json;
    } catch (_) { parsedMeta = row.metadata_json; }

    return {
      ...row,
      old_values: parsedOld,
      new_values: parsedNew,
      metadata_json: parsedMeta,
      actor_name: row.actor_name || (row.actor_id ? `User #${row.actor_id}` : 'System Engine'),
    };
  }

  async getStatistics() {
    const [countsRow] = await db.query(`
      SELECT 
        COUNT(*) AS totalEvents,
        SUM(CASE WHEN created_at >= CURDATE() THEN 1 ELSE 0 END) AS eventsToday,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS eventsThisWeek,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS eventsThisMonth,
        SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) AS criticalEvents,
        SUM(CASE WHEN severity = 'HIGH' THEN 1 ELSE 0 END) AS highEvents,
        SUM(CASE WHEN severity = 'MEDIUM' THEN 1 ELSE 0 END) AS mediumEvents,
        SUM(CASE WHEN severity = 'LOW' OR severity IS NULL THEN 1 ELSE 0 END) AS lowEvents,
        SUM(CASE WHEN status = 'SUCCESS' OR status IS NULL THEN 1 ELSE 0 END) AS successEvents,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failedEvents,
        SUM(CASE WHEN status = 'UNAUTHORIZED' THEN 1 ELSE 0 END) AS unauthorizedEvents,
        SUM(CASE WHEN status = 'ERROR' THEN 1 ELSE 0 END) AS errorEvents,
        COUNT(DISTINCT COALESCE(actor_id, user_id)) AS distinctActors,
        COUNT(DISTINCT module) AS activeProcesses
      FROM audit_logs
    `);

    // Process/Module Breakdown
    const moduleRows = await db.query(`
      SELECT module, COUNT(*) AS count, MAX(created_at) AS last_active
      FROM audit_logs
      GROUP BY module
      ORDER BY count DESC
    `);

    // Top Actions
    const actionRows = await db.query(`
      SELECT action, module, COUNT(*) AS count
      FROM audit_logs
      GROUP BY action, module
      ORDER BY count DESC
      LIMIT 10
    `);

    // Daily volume (last 14 days)
    const dailyVolume = await db.query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS count
      FROM audit_logs
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    const stats = countsRow || {};
    const total = Number(stats.totalEvents || 0);
    const success = Number(stats.successEvents || 0);
    const successRate = total > 0 ? Number(((success / total) * 100).toFixed(1)) : 100;

    return {
      totalEvents: total,
      eventsToday: Number(stats.eventsToday || 0),
      eventsThisWeek: Number(stats.eventsThisWeek || 0),
      eventsThisMonth: Number(stats.eventsThisMonth || 0),
      criticalEvents: Number(stats.criticalEvents || 0),
      highEvents: Number(stats.highEvents || 0),
      mediumEvents: Number(stats.mediumEvents || 0),
      lowEvents: Number(stats.lowEvents || 0),
      successEvents: success,
      failedEvents: Number(stats.failedEvents || 0),
      unauthorizedEvents: Number(stats.unauthorizedEvents || 0),
      errorEvents: Number(stats.errorEvents || 0),
      distinctActors: Number(stats.distinctActors || 0),
      activeProcesses: Number(stats.activeProcesses || 0),
      successRate,
      moduleBreakdown: moduleRows || [],
      topActions: actionRows || [],
      dailyVolume: dailyVolume || [],
    };
  }

  async getDistinctProcesses() {
    const rows = await db.query(`
      SELECT 
        module AS id,
        module AS name,
        COUNT(*) AS count,
        COUNT(DISTINCT action) AS action_types_count,
        MAX(created_at) AS last_event_at,
        SUM(CASE WHEN severity IN ('HIGH', 'CRITICAL') THEN 1 ELSE 0 END) AS risk_count
      FROM audit_logs
      GROUP BY module
      ORDER BY count DESC
    `);
    return rows || [];
  }
}

module.exports = new AuditRepository();
