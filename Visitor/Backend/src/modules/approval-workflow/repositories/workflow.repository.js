const db = require('../../../config/db');

class WorkflowRepository {
  // ── Workflows CRUD ──
  async findAll({ search, category_id, department_id, approval_mode, status, is_archived, page = 1, limit = 10 }) {
    let sql = `SELECT w.*, c.category_name, d.name as department_name, b.branch_name,
                      (SELECT COUNT(*) FROM approval_workflow_levels WHERE workflow_id = w.id AND deleted_at IS NULL) as levels_count,
                      (SELECT COUNT(*) FROM approval_workflow_rules WHERE workflow_id = w.id AND deleted_at IS NULL) as rules_count
               FROM approval_workflows w
               LEFT JOIN visitor_categories c ON w.category_id = c.id
               LEFT JOIN departments d ON w.department_id = d.id
               LEFT JOIN organization_branches b ON w.branch_id = b.id
               WHERE 1=1`;
    const params = [];

    if (is_archived === 'true' || is_archived === true) {
      sql += ` AND w.status = 'Archived'`;
    } else {
      sql += ` AND w.deleted_at IS NULL AND w.status != 'Archived'`;
    }

    if (status && status !== 'ALL') {
      sql += ` AND w.status = ?`;
      params.push(status);
    }

    if (approval_mode && approval_mode !== 'ALL') {
      sql += ` AND w.approval_mode = ?`;
      params.push(approval_mode);
    }

    if (category_id) {
      sql += ` AND w.category_id = ?`;
      params.push(category_id);
    }

    if (department_id) {
      sql += ` AND w.department_id = ?`;
      params.push(department_id);
    }

    if (search && search.trim()) {
      sql += ` AND (w.workflow_name LIKE ? OR w.workflow_code LIKE ? OR w.description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY w.priority ASC, w.created_at DESC`;

    const allRows = await db.query(sql, params);

    const total = allRows.length;
    const offset = (page - 1) * limit;
    const paginatedRows = allRows.slice(offset, offset + limit);

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

  async findById(id) {
    const rows = await db.query(
      `SELECT w.*, c.category_name, d.name as department_name, b.branch_name
       FROM approval_workflows w
       LEFT JOIN visitor_categories c ON w.category_id = c.id
       LEFT JOIN departments d ON w.department_id = d.id
       LEFT JOIN organization_branches b ON w.branch_id = b.id
       WHERE w.id = ? AND w.deleted_at IS NULL`,
      [id]
    );
    const workflow = rows[0] || null;
    if (!workflow) return null;

    // Load levels
    workflow.levels = await db.query(
      `SELECT l.*, u.full_name as approver_user_name, d.name as department_name
       FROM approval_workflow_levels l
       LEFT JOIN users u ON l.approver_user_id = u.id
       LEFT JOIN departments d ON l.department_id = d.id
       WHERE l.workflow_id = ? AND l.deleted_at IS NULL
       ORDER BY l.level_order ASC`,
      [id]
    );

    // Load rules
    workflow.rules = await db.query(
      `SELECT * FROM approval_workflow_rules
       WHERE workflow_id = ? AND deleted_at IS NULL
       ORDER BY priority ASC`,
      [id]
    );

    return workflow;
  }

  async findByCode(workflow_code) {
    const rows = await db.query(
      `SELECT * FROM approval_workflows WHERE workflow_code = ? AND deleted_at IS NULL LIMIT 1`,
      [workflow_code]
    );
    return rows[0] || null;
  }

  async create(data) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const wfName = data.workflow_name || data.name || 'Custom Workflow';
    const wfCode = data.workflow_code || `WF-${Date.now()}`;
    const result = await db.query(
      `INSERT INTO approval_workflows (
        name, workflow_name, workflow_code, description, workflow_type, category_id,
        department_id, branch_id, priority, approval_mode, status, version, is_default, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        wfName,
        wfName,
        wfCode,
        data.description || '',
        data.workflow_type || 'Custom',
        data.category_id || null,
        data.department_id || null,
        data.branch_id || null,
        data.priority || 1,
        data.approval_mode || 'Sequential',
        data.status || 'Active',
        data.version || 'v1.0',
        data.is_default ? 1 : 0,
        now, now
      ]
    );

    const workflowId = result.insertId;

    // Insert levels if provided
    if (Array.isArray(data.levels) && data.levels.length > 0) {
      for (let i = 0; i < data.levels.length; i++) {
        const lvl = data.levels[i];
        await this.addLevel(workflowId, { ...lvl, level_order: i + 1 });
      }
    }

    // Insert rules if provided
    if (Array.isArray(data.rules) && data.rules.length > 0) {
      for (let i = 0; i < data.rules.length; i++) {
        const rule = data.rules[i];
        await this.addRule(workflowId, { ...rule, priority: i + 1 });
      }
    }

    return workflowId;
  }

  async update(id, data) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await db.query(
      `UPDATE approval_workflows SET
        workflow_name = COALESCE(?, workflow_name),
        workflow_code = COALESCE(?, workflow_code),
        description = COALESCE(?, description),
        workflow_type = COALESCE(?, workflow_type),
        category_id = ?,
        department_id = ?,
        branch_id = ?,
        priority = COALESCE(?, priority),
        approval_mode = COALESCE(?, approval_mode),
        status = COALESCE(?, status),
        version = COALESCE(?, version),
        is_default = COALESCE(?, is_default),
        updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [
        data.workflow_name,
        data.workflow_code,
        data.description,
        data.workflow_type,
        data.category_id !== undefined ? data.category_id : null,
        data.department_id !== undefined ? data.department_id : null,
        data.branch_id !== undefined ? data.branch_id : null,
        data.priority,
        data.approval_mode,
        data.status,
        data.version,
        data.is_default !== undefined ? (data.is_default ? 1 : 0) : null,
        now, id
      ]
    );

    // Update levels if provided
    if (Array.isArray(data.levels)) {
      await db.query(`UPDATE approval_workflow_levels SET deleted_at = ? WHERE workflow_id = ?`, [now, id]);
      for (let i = 0; i < data.levels.length; i++) {
        const lvl = data.levels[i];
        await this.addLevel(id, { ...lvl, level_order: i + 1 });
      }
    }

    // Update rules if provided
    if (Array.isArray(data.rules)) {
      await db.query(`UPDATE approval_workflow_rules SET deleted_at = ? WHERE workflow_id = ?`, [now, id]);
      for (let i = 0; i < data.rules.length; i++) {
        const rule = data.rules[i];
        await this.addRule(id, { ...rule, priority: i + 1 });
      }
    }

    return this.findById(id);
  }

  async updateStatus(id, status) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    return db.query(
      `UPDATE approval_workflows SET status = ?, updated_at = ? WHERE id = ?`,
      [status, now, id]
    );
  }

  async softDelete(id) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await db.query(`UPDATE approval_workflows SET deleted_at = ?, status = 'Inactive' WHERE id = ?`, [now, id]);
    await db.query(`UPDATE approval_workflow_levels SET deleted_at = ? WHERE workflow_id = ?`, [now, id]);
    await db.query(`UPDATE approval_workflow_rules SET deleted_at = ? WHERE workflow_id = ?`, [now, id]);
    return true;
  }

  // ── Approval Levels ──
  async addLevel(workflowId, data) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    return db.query(
      `INSERT INTO approval_workflow_levels (
        workflow_id, level_order, level_name, approver_role, approver_user_id,
        department_id, timeout_minutes, sla_minutes, escalation_target,
        notification_rule, comments_required, attachment_required, is_required, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        workflowId,
        data.level_order || 1,
        data.level_name || `Level ${data.level_order || 1}`,
        data.approver_role || 'Host',
        data.approver_user_id || null,
        data.department_id || null,
        data.timeout_minutes || 60,
        data.sla_minutes || 120,
        data.escalation_target || 'Manager',
        data.notification_rule || 'Email & Push',
        data.comments_required ? 1 : 0,
        data.attachment_required ? 1 : 0,
        data.is_required !== false ? 1 : 0,
        now, now
      ]
    );
  }

  // ── Conditional Rules ──
  async addRule(workflowId, data) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    return db.query(
      `INSERT INTO approval_workflow_rules (
        workflow_id, rule_name, field_name, operator, field_value,
        target_workflow_id, target_level_order, priority, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        workflowId,
        data.rule_name || 'Conditional Rule',
        data.field_name || 'visitor_category',
        data.operator || '=',
        data.field_value || '',
        data.target_workflow_id || null,
        data.target_level_order || null,
        data.priority || 1,
        data.is_active !== false ? 1 : 0,
        now, now
      ]
    );
  }

  // ── Delegations ──
  async findAllDelegations() {
    return db.query(
      `SELECT d.*, u1.full_name as delegator_name, u2.full_name as delegate_name
       FROM approval_delegations d
       LEFT JOIN users u1 ON d.delegator_id = u1.id
       LEFT JOIN users u2 ON d.delegate_id = u2.id
       WHERE d.deleted_at IS NULL
       ORDER BY d.created_at DESC`
    );
  }

  async createDelegation(data) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    return db.query(
      `INSERT INTO approval_delegations (
        delegator_id, delegate_id, start_date, end_date, reason, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.delegator_id,
        data.delegate_id,
        data.start_date,
        data.end_date,
        data.reason || '',
        data.status || 'Active',
        now, now
      ]
    );
  }

  // ── Versioning & Audit Logs ──
  async createVersion(workflowId, versionNumber, configJson, createdBy = 1) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    return db.query(
      `INSERT INTO approval_workflow_versions (workflow_id, version_number, configuration_json, created_by, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [workflowId, versionNumber, JSON.stringify(configJson), createdBy, now]
    );
  }

  async getVersions(workflowId) {
    return db.query(
      `SELECT v.*, u.full_name as created_by_name
       FROM approval_workflow_versions v
       LEFT JOIN users u ON v.created_by = u.id
       WHERE v.workflow_id = ?
       ORDER BY v.created_at DESC`,
      [workflowId]
    );
  }

  async logAudit(workflowId, action, details, performedBy = 1) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    return db.query(
      `INSERT INTO approval_workflow_audit_logs (workflow_id, action, details, performed_by, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [workflowId, action, JSON.stringify(details), performedBy, now]
    );
  }

  async getAuditLogs(workflowId) {
    return db.query(
      `SELECT a.*, u.full_name as performed_by_name
       FROM approval_workflow_audit_logs a
       LEFT JOIN users u ON a.performed_by = u.id
       WHERE a.workflow_id = ?
       ORDER BY a.created_at DESC`,
      [workflowId]
    );
  }
}

module.exports = new WorkflowRepository();
