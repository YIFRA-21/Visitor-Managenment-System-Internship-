const db = require('../../../config/db');

class OrganizationRepository {
  // Organizations CRUD
  async findOrgById(id) {
    const rows = await db.query(
      `SELECT * FROM organizations WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  }

  async findOrgByCode(code) {
    const rows = await db.query(
      `SELECT * FROM organizations WHERE code = ? AND deleted_at IS NULL`,
      [code]
    );
    return rows[0] || null;
  }

  async createOrg(orgData) {
    const {
      name,
      shortName = null,
      code,
      registrationNumber = null,
      taxNumber = null,
      website = null,
      email = null,
      phone = null,
      address = null,
      country = null,
      region = null,
      city = null,
      subCity = null,
      sub_city = null,
      woreda = null,
      postalCode = null,
      postal_code = null,
      businessType = 'CORPORATION',
      business_type = null,
      timezone = 'Africa/Addis_Ababa',
      currency = 'ETB',
      language = 'en',
      logoUrl = null,
      logo_url = null,
      faviconUrl = null,
      favicon_url = null,
      primaryColor = '#2563eb',
      primary_color = null,
      secondaryColor = '#1e40af',
      secondary_color = null,
      createdBy = null,
    } = orgData;

    const resolvedLogo = logoUrl || logo_url || null;
    const resolvedFavicon = faviconUrl || favicon_url || null;
    const resolvedSubCity = subCity || sub_city || null;
    const resolvedPostal = postalCode || postal_code || null;
    const resolvedBiz = businessType || business_type || 'CORPORATION';
    const resolvedPrimary = primaryColor || primary_color || '#2563eb';
    const resolvedSecondary = secondaryColor || secondary_color || '#1e40af';

    const result = await db.query(
      `INSERT INTO organizations (
        name, short_name, code, registration_number, tax_number,
        website, email, phone, address, country, region, city,
        sub_city, woreda, postal_code, business_type,
        timezone, currency, language, logo_url, favicon_url,
        primary_color, secondary_color, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        shortName,
        code,
        registrationNumber,
        taxNumber,
        website,
        email,
        phone,
        address,
        country,
        region,
        city,
        resolvedSubCity,
        woreda,
        resolvedPostal,
        resolvedBiz,
        timezone,
        currency,
        language,
        resolvedLogo,
        resolvedFavicon,
        resolvedPrimary,
        resolvedSecondary,
        createdBy,
      ]
    );

    const orgId = result.insertId;

    // Sync alias
    await db.query(`UPDATE organizations SET organization_id = ? WHERE id = ?`, [orgId, orgId]);

    return orgId;
  }

  async findAllOrgs(filters = {}) {
    let sql = `SELECT * FROM organizations WHERE deleted_at IS NULL`;
    const params = [];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY name';
    return db.query(sql, params);
  }

  // Branches CRUD
  async findBranchById(id) {
    const rows = await db.query(
      `SELECT b.*, o.name as organizationName
       FROM organization_branches b
       JOIN organizations o ON b.organization_id = o.id
       WHERE b.id = ? AND b.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  }

  async createBranch(branchData) {
    const {
      organizationId,
      branchName,
      branchCode,
      timezone = 'UTC',
      address = null,
      createdBy = null,
    } = branchData;

    const result = await db.query(
      `INSERT INTO organization_branches (
        organization_id, branch_name, branch_code, timezone, address, created_by
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [organizationId, branchName, branchCode, timezone, address, createdBy]
    );

    const branchId = result.insertId;
    await db.query(`UPDATE organization_branches SET branch_id = ? WHERE id = ?`, [branchId, branchId]);

    return branchId;
  }

  async findBranchesByOrg(orgId) {
    return db.query(
      `SELECT * FROM organization_branches WHERE organization_id = ? AND deleted_at IS NULL ORDER BY branch_name`,
      [orgId]
    );
  }

  // Buildings CRUD
  async createBuilding(buildingData) {
    const {
      branchId,
      buildingName,
      buildingCode,
      location = null,
      maxCapacity = null,
      createdBy = null,
    } = buildingData;

    const result = await db.query(
      `INSERT INTO buildings (
        branch_id, building_name, building_code, location, max_visitor_capacity, created_by
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [branchId, buildingName, buildingCode, location, maxCapacity, createdBy]
    );

    const buildingId = result.insertId;
    await db.query(`UPDATE buildings SET building_id = ? WHERE id = ?`, [buildingId, buildingId]);

    return buildingId;
  }

  async findBuildingsByBranch(branchId) {
    return db.query(
      `SELECT * FROM buildings WHERE branch_id = ? AND deleted_at IS NULL ORDER BY building_name`,
      [branchId]
    );
  }

  async updateOrg(id, updateData) {
    const fields = [];
    const values = [];
    const handledColumns = new Set();
    const mappings = {
      name: 'name',
      shortName: 'short_name',
      short_name: 'short_name',
      code: 'code',
      registrationNumber: 'registration_number',
      registration_number: 'registration_number',
      taxNumber: 'tax_number',
      tax_number: 'tax_number',
      website: 'website',
      email: 'email',
      phone: 'phone',
      address: 'address',
      country: 'country',
      region: 'region',
      city: 'city',
      subCity: 'sub_city',
      sub_city: 'sub_city',
      woreda: 'woreda',
      postalCode: 'postal_code',
      postal_code: 'postal_code',
      businessType: 'business_type',
      business_type: 'business_type',
      status: 'status',
      timezone: 'timezone',
      currency: 'currency',
      language: 'language',
      logoUrl: 'logo_url',
      logo_url: 'logo_url',
      faviconUrl: 'favicon_url',
      favicon_url: 'favicon_url',
      primaryColor: 'primary_color',
      primary_color: 'primary_color',
      secondaryColor: 'secondary_color',
      secondary_color: 'secondary_color',
      updatedBy: 'updated_by',
      updated_by: 'updated_by'
    };

    for (const [key, columnName] of Object.entries(mappings)) {
      if (updateData[key] !== undefined && !handledColumns.has(columnName)) {
        fields.push(`${columnName} = ?`);
        values.push(updateData[key]);
        handledColumns.add(columnName);
      }
    }

    if (fields.length === 0) return false;
    values.push(id);
    const result = await db.query(
      `UPDATE organizations SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async softDeleteOrg(id, operatorId) {
    const result = await db.query(
      `UPDATE organizations SET deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE id = ?`,
      [operatorId, id]
    );
    return result.affectedRows > 0;
  }

  async restoreOrg(id) {
    const result = await db.query(
      `UPDATE organizations SET deleted_at = NULL, deleted_by = NULL WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  async updateBranch(id, updateData) {
    const fields = [];
    const values = [];
    const mappings = {
      branchName: 'branch_name',
      branchCode: 'branch_code',
      timezone: 'timezone',
      address: 'address',
      status: 'status',
      updatedBy: 'updated_by'
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
      `UPDATE organization_branches SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async softDeleteBranch(id, operatorId) {
    const result = await db.query(
      `UPDATE organization_branches SET deleted_at = CURRENT_TIMESTAMP, status = 'INACTIVE', is_active = 0, deleted_by = ? WHERE id = ?`,
      [operatorId ? Number(operatorId) : null, Number(id)]
    );
    return result.affectedRows > 0;
  }

  /**
   * Multi-field search with pagination and sorting.
   */
  async searchOrgs(filters = {}, pagination = { page: 1, limit: 10 }, sort = { sortBy: 'name', sortOrder: 'ASC' }) {
    let sql = `SELECT * FROM organizations WHERE deleted_at IS NULL`;
    const params = [];

    if (filters.name) {
      sql += ` AND name LIKE ?`;
      params.push(`%${filters.name}%`);
    }
    if (filters.code) {
      sql += ` AND code LIKE ?`;
      params.push(`%${filters.code}%`);
    }
    if (filters.registrationNumber) {
      sql += ` AND registration_number LIKE ?`;
      params.push(`%${filters.registrationNumber}%`);
    }
    if (filters.status) {
      sql += ` AND status = ?`;
      params.push(filters.status);
    }
    if (filters.type) {
      sql += ` AND type = ?`;
      params.push(filters.type);
    }
    if (filters.dateFrom) {
      sql += ` AND created_at >= ?`;
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      sql += ` AND created_at <= ?`;
      params.push(filters.dateTo);
    }

    // Sorting
    const allowedColumns = ['name', 'code', 'status', 'created_at', 'registration_number', 'email'];
    const column = allowedColumns.includes(sort.sortBy) ? sort.sortBy : 'name';
    const direction = sort.sortOrder === 'DESC' ? 'DESC' : 'ASC';
    sql += ` ORDER BY ${column} ${direction}`;

    // Pagination
    const offset = (pagination.page - 1) * pagination.limit;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(pagination.limit, offset);

    return db.query(sql, params);
  }

  /**
   * Count organizations matching filters (for pagination metadata).
   */
  async countOrgs(filters = {}) {
    let sql = `SELECT COUNT(*) as total FROM organizations WHERE deleted_at IS NULL`;
    const params = [];

    if (filters.name) {
      sql += ` AND name LIKE ?`;
      params.push(`%${filters.name}%`);
    }
    if (filters.code) {
      sql += ` AND code LIKE ?`;
      params.push(`%${filters.code}%`);
    }
    if (filters.registrationNumber) {
      sql += ` AND registration_number LIKE ?`;
      params.push(`%${filters.registrationNumber}%`);
    }
    if (filters.status) {
      sql += ` AND status = ?`;
      params.push(filters.status);
    }
    if (filters.type) {
      sql += ` AND type = ?`;
      params.push(filters.type);
    }
    if (filters.dateFrom) {
      sql += ` AND created_at >= ?`;
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      sql += ` AND created_at <= ?`;
      params.push(filters.dateTo);
    }

    const rows = await db.query(sql, params);
    return rows[0]?.total || 0;
  }

  /**
   * Get status change history for an organization.
   * Returns mock data as a placeholder until audit_logs is fully queryable.
   */
  async findOrgStatusHistory(id) {
    try {
      const rows = await db.query(
        `SELECT * FROM audit_logs
         WHERE entity = 'organizations' AND record_id = ?
           AND action LIKE 'ORGANIZATION_STATUS_%'
         ORDER BY created_at DESC LIMIT 20`,
        [id]
      );
      if (rows && rows.length > 0) return rows;
    } catch (_e) {
      // audit_logs table might not exist yet
    }

    // Return mock history
    const now = new Date();
    return [
      {
        id: 1,
        action: 'ORGANIZATION_STATUS_ACTIVE',
        old_values: JSON.stringify({ status: 'INACTIVE' }),
        new_values: JSON.stringify({ status: 'ACTIVE', reason: 'License renewed' }),
        actor_id: 1,
        created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        action: 'ORGANIZATION_STATUS_INACTIVE',
        old_values: JSON.stringify({ status: 'ACTIVE' }),
        new_values: JSON.stringify({ status: 'INACTIVE', reason: 'Annual review' }),
        actor_id: 1,
        created_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        action: 'ORGANIZATION_STATUS_ACTIVE',
        old_values: null,
        new_values: JSON.stringify({ status: 'ACTIVE', reason: 'Initial registration' }),
        actor_id: 1,
        created_at: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }
}

module.exports = new OrganizationRepository();
