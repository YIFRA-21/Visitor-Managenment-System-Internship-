const pool = require('../../../config/db');

class VisitorCategoryRepository {
  async findAll(params = {}) {
    const {
      search,
      status,
      approval_required,
      access_level,
      is_archived = 'false',
      page = 1,
      limit = 10,
      sort_by = 'display_order',
      sort_order = 'ASC'
    } = params;

    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const queryParams = [];
    let whereConditions = ['vc.is_deleted = FALSE'];

    if (is_archived === 'true') {
      whereConditions.push('vc.is_archived = TRUE');
    } else if (is_archived === 'false') {
      whereConditions.push('vc.is_archived = FALSE');
    }

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      whereConditions.push('(vc.category_name LIKE ? OR vc.category_code LIKE ? OR vc.description LIKE ?)');
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== 'All' && status !== '') {
      whereConditions.push('vc.status = ?');
      queryParams.push(status);
    }

    if (approval_required !== undefined && approval_required !== '' && approval_required !== 'All') {
      const isReq = approval_required === 'true' || approval_required === '1' || approval_required === true;
      whereConditions.push('vc.approval_required = ?');
      queryParams.push(isReq ? 1 : 0);
    }

    if (access_level && access_level !== 'All' && access_level !== '') {
      whereConditions.push('vc.access_level = ?');
      queryParams.push(access_level);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Whitelist sort fields
    const validSortFields = {
      display_order: 'vc.display_order',
      category_name: 'vc.category_name',
      category_code: 'vc.category_code',
      status: 'vc.status',
      created_at: 'vc.created_at'
    };
    const sortField = validSortFields[sort_by] || 'vc.display_order';
    const orderDirection = sort_order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Count Total
    const countSql = `SELECT COUNT(*) AS total FROM visitor_categories vc ${whereClause}`;
    const countRows = await pool.query(countSql, queryParams);
    const total = (Array.isArray(countRows) && countRows[0]) ? (countRows[0].total || 0) : 0;

    // Fetch Rows with nested aggregates
    const dataSql = `
      SELECT 
        vc.*,
        (SELECT COUNT(*) FROM visitor_category_documents vcd WHERE vcd.category_id = vc.id) AS required_docs_count,
        (SELECT COUNT(*) FROM visitor_category_workflows vcw WHERE vcw.category_id = vc.id) AS workflow_steps_count,
        (SELECT COUNT(*) FROM visitor_category_access_levels vcal WHERE vcal.category_id = vc.id) AS access_locations_count
      FROM visitor_categories vc
      ${whereClause}
      ORDER BY ${sortField} ${orderDirection}
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...queryParams, parseInt(limit), parseInt(offset)];
    const rows = await pool.query(dataSql, dataParams);

    return {
      data: Array.isArray(rows) ? rows : [],
      pagination: {
        total: parseInt(total),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(parseInt(total) / parseInt(limit))
      }
    };
  }

  async getStats() {
    const rows = await pool.query(`
      SELECT 
        COUNT(CASE WHEN is_deleted = FALSE AND is_archived = FALSE THEN 1 END) AS totalCategories,
        COUNT(CASE WHEN is_deleted = FALSE AND is_archived = FALSE AND status = 'Active' THEN 1 END) AS activeCategories,
        COUNT(CASE WHEN is_deleted = FALSE AND is_archived = FALSE AND approval_required = TRUE THEN 1 END) AS approvalRequired,
        COUNT(CASE WHEN is_deleted = FALSE AND is_archived = FALSE AND allow_walkin_visitor = TRUE THEN 1 END) AS walkinAllowed,
        (SELECT COUNT(*) FROM visitor_category_documents vcd 
         JOIN visitor_categories vc ON vcd.category_id = vc.id 
         WHERE vc.is_deleted = FALSE AND vc.is_archived = FALSE AND vcd.is_mandatory = TRUE) AS totalRequiredDocs
      FROM visitor_categories
    `);

    const stats = (Array.isArray(rows) && rows[0]) ? rows[0] : {};
    return {
      totalCategories: parseInt(stats.totalCategories) || 0,
      activeCategories: parseInt(stats.activeCategories) || 0,
      approvalRequired: parseInt(stats.approvalRequired) || 0,
      walkinAllowed: parseInt(stats.walkinAllowed) || 0,
      totalRequiredDocs: parseInt(stats.totalRequiredDocs) || 0
    };
  }

  async findById(id) {
    const cats = await pool.query(
      `SELECT * FROM visitor_categories WHERE id = ? AND is_deleted = FALSE`, [id]
    );
    if (!cats || !Array.isArray(cats) || cats.length === 0) return null;

    const category = cats[0];

    const documents = await pool.query(
      `SELECT * FROM visitor_category_documents WHERE category_id = ? ORDER BY id ASC`, [id]
    );
    const workflows = await pool.query(
      `SELECT * FROM visitor_category_workflows WHERE category_id = ? ORDER BY step_order ASC`, [id]
    );
    const access_levels = await pool.query(
      `SELECT * FROM visitor_category_access_levels WHERE category_id = ? ORDER BY id ASC`, [id]
    );

    // Usage count (assigned visitors)
    let visitorCount = 0;
    try {
      const usage = await pool.query(
        `SELECT COUNT(*) as count FROM visitors WHERE category = ? OR visitor_type_id = ?`,
        [category.category_name, id]
      );
      visitorCount = (Array.isArray(usage) && usage[0]) ? (usage[0].count || 0) : 0;
    } catch (e) {
      visitorCount = 0;
    }

    return {
      ...category,
      documents: Array.isArray(documents) ? documents : [],
      workflows: Array.isArray(workflows) ? workflows : [],
      access_levels: Array.isArray(access_levels) ? access_levels : [],
      visitor_count: parseInt(visitorCount)
    };
  }

  async findByCode(code) {
    const cats = await pool.query(
      `SELECT * FROM visitor_categories WHERE category_code = ? AND is_deleted = FALSE AND is_archived = FALSE AND status = 'Active'`,
      [code]
    );
    if (!cats || !Array.isArray(cats) || cats.length === 0) return null;

    const category = cats[0];
    const documents = await pool.query(
      `SELECT * FROM visitor_category_documents WHERE category_id = ? ORDER BY id ASC`, [category.id]
    );
    const workflows = await pool.query(
      `SELECT * FROM visitor_category_workflows WHERE category_id = ? ORDER BY step_order ASC`, [category.id]
    );
    const access_levels = await pool.query(
      `SELECT * FROM visitor_category_access_levels WHERE category_id = ? ORDER BY id ASC`, [category.id]
    );

    return {
      ...category,
      documents: Array.isArray(documents) ? documents : [],
      workflows: Array.isArray(workflows) ? workflows : [],
      access_levels: Array.isArray(access_levels) ? access_levels : []
    };
  }

  async checkCodeExists(category_code, excludeId = null) {
    let sql = `SELECT id FROM visitor_categories WHERE category_code = ? AND is_deleted = FALSE`;
    const params = [category_code];
    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }
    const rows = await pool.query(sql, params);
    return Array.isArray(rows) && rows.length > 0;
  }

  async checkNameExists(category_name, excludeId = null) {
    let sql = `SELECT id FROM visitor_categories WHERE category_name = ? AND is_deleted = FALSE`;
    const params = [category_name];
    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }
    const rows = await pool.query(sql, params);
    return Array.isArray(rows) && rows.length > 0;
  }

  async create(data, creatorId = null) {
    const insertResult = await pool.query(
      `INSERT INTO visitor_categories (
        category_code, category_name, description, default_visit_duration, default_duration_minutes,
        max_visit_duration, max_duration_minutes, approval_required, allow_walkin_visitor, allow_repeat_visit,
        access_level, status, display_order, appointment_required, host_approval_required,
        department_approval_required, security_approval_required, visitor_pass_required,
        identity_verification_required, face_verification_required, document_verification_required,
        escort_required, vehicle_registration_required, emergency_contact_required, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.category_code,
        data.category_name,
        data.description || '',
        data.default_visit_duration || '2 Hours',
        data.default_duration_minutes || 120,
        data.max_visit_duration || '1 Day',
        data.max_duration_minutes || 1440,
        data.approval_required !== false,
        data.allow_walkin_visitor !== false,
        data.allow_repeat_visit !== false,
        data.access_level || 'Level 1 (General)',
        data.status || 'Active',
        data.display_order || 1,
        data.appointment_required !== false,
        data.host_approval_required !== false,
        data.department_approval_required === true,
        data.security_approval_required === true,
        data.visitor_pass_required !== false,
        data.identity_verification_required !== false,
        data.face_verification_required === true,
        data.document_verification_required !== false,
        data.escort_required === true,
        data.vehicle_registration_required === true,
        data.emergency_contact_required === true,
        creatorId
      ]
    );

    const categoryId = insertResult.insertId;

    // Insert Documents
    if (Array.isArray(data.documents) && data.documents.length > 0) {
      for (const doc of data.documents) {
        await pool.query(
          `INSERT INTO visitor_category_documents (category_id, document_type, is_mandatory, description) VALUES (?, ?, ?, ?)`,
          [categoryId, doc.document_type, doc.is_mandatory !== false, doc.description || '']
        );
      }
    }

    // Insert Workflows
    if (Array.isArray(data.workflows) && data.workflows.length > 0) {
      for (let idx = 0; idx < data.workflows.length; idx++) {
        const wf = data.workflows[idx];
        await pool.query(
          `INSERT INTO visitor_category_workflows (category_id, step_order, step_name, approver_role, is_auto_approved) VALUES (?, ?, ?, ?, ?)`,
          [categoryId, wf.step_order || (idx + 1), wf.step_name, wf.approver_role, wf.is_auto_approved === true]
        );
      }
    }

    // Insert Access Levels
    if (Array.isArray(data.access_levels) && data.access_levels.length > 0) {
      for (const acc of data.access_levels) {
        await pool.query(
          `INSERT INTO visitor_category_access_levels (category_id, location_name, is_granted) VALUES (?, ?, ?)`,
          [categoryId, acc.location_name, acc.is_granted !== false]
        );
      }
    }

    return this.findById(categoryId);
  }

  async update(id, data, updaterId = null) {
    const existing = await this.findById(id);
    if (!existing) {
      const err = new Error('Category not found.');
      err.statusCode = 404;
      throw err;
    }

    await pool.query(
      `UPDATE visitor_categories SET
        category_code = ?,
        category_name = ?,
        description = ?,
        default_visit_duration = ?,
        default_duration_minutes = ?,
        max_visit_duration = ?,
        max_duration_minutes = ?,
        approval_required = ?,
        allow_walkin_visitor = ?,
        allow_repeat_visit = ?,
        access_level = ?,
        status = ?,
        display_order = ?,
        appointment_required = ?,
        host_approval_required = ?,
        department_approval_required = ?,
        security_approval_required = ?,
        visitor_pass_required = ?,
        identity_verification_required = ?,
        face_verification_required = ?,
        document_verification_required = ?,
        escort_required = ?,
        vehicle_registration_required = ?,
        emergency_contact_required = ?,
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_deleted = FALSE`,
      [
        data.category_code,
        data.category_name,
        data.description || '',
        data.default_visit_duration || '2 Hours',
        data.default_duration_minutes || 120,
        data.max_visit_duration || '1 Day',
        data.max_duration_minutes || 1440,
        data.approval_required !== false,
        data.allow_walkin_visitor !== false,
        data.allow_repeat_visit !== false,
        data.access_level || 'Level 1 (General)',
        data.status || 'Active',
        data.display_order || 1,
        data.appointment_required !== false,
        data.host_approval_required !== false,
        data.department_approval_required === true,
        data.security_approval_required === true,
        data.visitor_pass_required !== false,
        data.identity_verification_required !== false,
        data.face_verification_required === true,
        data.document_verification_required !== false,
        data.escort_required === true,
        data.vehicle_registration_required === true,
        data.emergency_contact_required === true,
        updaterId,
        id
      ]
    );

    // Re-populate Documents if provided
    if (Array.isArray(data.documents)) {
      await pool.query(`DELETE FROM visitor_category_documents WHERE category_id = ?`, [id]);
      for (const doc of data.documents) {
        await pool.query(
          `INSERT INTO visitor_category_documents (category_id, document_type, is_mandatory, description) VALUES (?, ?, ?, ?)`,
          [id, doc.document_type, doc.is_mandatory !== false, doc.description || '']
        );
      }
    }

    // Re-populate Workflows if provided
    if (Array.isArray(data.workflows)) {
      await pool.query(`DELETE FROM visitor_category_workflows WHERE category_id = ?`, [id]);
      for (let idx = 0; idx < data.workflows.length; idx++) {
        const wf = data.workflows[idx];
        await pool.query(
          `INSERT INTO visitor_category_workflows (category_id, step_order, step_name, approver_role, is_auto_approved) VALUES (?, ?, ?, ?, ?)`,
          [id, wf.step_order || (idx + 1), wf.step_name, wf.approver_role, wf.is_auto_approved === true]
        );
      }
    }

    // Re-populate Access Levels if provided
    if (Array.isArray(data.access_levels)) {
      await pool.query(`DELETE FROM visitor_category_access_levels WHERE category_id = ?`, [id]);
      for (const acc of data.access_levels) {
        await pool.query(
          `INSERT INTO visitor_category_access_levels (category_id, location_name, is_granted) VALUES (?, ?, ?)`,
          [id, acc.location_name, acc.is_granted !== false]
        );
      }
    }

    return this.findById(id);
  }

  async archive(id, userId = null) {
    await pool.query(
      `UPDATE visitor_categories SET status = 'Archived', is_archived = TRUE, updated_by = ? WHERE id = ? AND is_deleted = FALSE`,
      [userId, id]
    );
    return this.findById(id);
  }

  async restore(id, userId = null) {
    await pool.query(
      `UPDATE visitor_categories SET status = 'Active', is_archived = FALSE, updated_by = ? WHERE id = ? AND is_deleted = FALSE`,
      [userId, id]
    );
    return this.findById(id);
  }

  async softDelete(id, userId = null) {
    // Check if category assigned to visitors
    const categoryRows = await pool.query(
      `SELECT category_name FROM visitor_categories WHERE id = ?`, [id]
    );
    if (!categoryRows || !Array.isArray(categoryRows) || categoryRows.length === 0) {
      throw new Error('Category not found');
    }
    const catName = categoryRows[0].category_name;

    let visitorUsageCount = 0;
    try {
      const usage = await pool.query(
        `SELECT COUNT(*) as count FROM visitors WHERE (category = ? OR visitor_type_id = ?) AND deleted_at IS NULL`,
        [catName, id]
      );
      visitorUsageCount = (Array.isArray(usage) && usage[0]) ? (usage[0].count || 0) : 0;
    } catch (e) {
      visitorUsageCount = 0;
    }

    if (parseInt(visitorUsageCount) > 0) {
      const err = new Error('Categories assigned to visitors cannot be permanently deleted.');
      err.statusCode = 400;
      throw err;
    }

    await pool.query(
      `UPDATE visitor_categories SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE id = ?`,
      [userId, id]
    );

    return true;
  }
}

module.exports = new VisitorCategoryRepository();
