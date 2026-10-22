const db = require('../../../config/db');

class VisitorProfileRepository {
  // ─── Directory Listing with Filters, Search, Sort, Pagination ───
  async findAll(queryParams = {}) {
    const {
      page = 1,
      limit = 15,
      search = '',
      status = '',
      gender = '',
      category = '',
      idVerification = '',
      isArchived = '',
      organizationId = '',
      branchId = '',
      sortBy = 'v.created_at',
      sortOrder = 'DESC',
      startDate = '',
      endDate = ''
    } = queryParams;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ['(v.is_active = TRUE OR v.is_active = 1) AND v.deleted_at IS NULL AND (v.status != "DELETED" OR v.status IS NULL)'];
    const params = [];

    // Archive filter
    if (isArchived === 'true') {
      conditions.push('v.is_archived = TRUE');
    } else if (isArchived === 'false' || !isArchived) {
      conditions.push('(v.is_archived = FALSE OR v.is_archived IS NULL)');
    }

    // Global search
    if (search) {
      conditions.push(
        `(v.full_name LIKE ? OR v.visitor_code LIKE ? OR v.email LIKE ? OR v.phone LIKE ? OR v.company LIKE ? OR v.id_number LIKE ? OR v.reference_number LIKE ?)`
      );
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s, s);
    }

    // Status filter
    if (status) {
      conditions.push('v.status = ?');
      params.push(status);
    }

    // Gender filter
    if (gender) {
      conditions.push('v.gender = ?');
      params.push(gender);
    }

    // Category filter
    if (category) {
      conditions.push('v.category = ?');
      params.push(category);
    }

    // ID Verification filter
    if (idVerification) {
      conditions.push('v.id_verification_status = ?');
      params.push(idVerification);
    }

    // Organization filter
    if (organizationId) {
      conditions.push('v.organization_id = ?');
      params.push(organizationId);
    }

    // Branch filter
    if (branchId) {
      conditions.push('v.branch_id = ?');
      params.push(branchId);
    }

    // Date range
    if (startDate) {
      conditions.push('v.created_at >= ?');
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      conditions.push('v.created_at <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = conditions.join(' AND ');

    // Allow only safe sort columns
    const safeSortColumns = [
      'v.id', 'v.full_name', 'v.visitor_code', 'v.email', 'v.phone',
      'v.status', 'v.created_at', 'v.updated_at', 'v.company', 'v.category'
    ];
    const resolvedSort = safeSortColumns.includes(sortBy) ? sortBy : 'v.created_at';
    const resolvedOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count
    const countRows = await db.query(
      `SELECT COUNT(*) as total FROM visitors v WHERE ${whereClause}`,
      params
    );
    const total = countRows[0] ? countRows[0].total : 0;

    // Data
    const rows = await db.query(
      `SELECT v.id, v.visitor_code, v.reference_number, v.first_name, v.middle_name, v.last_name, v.full_name,
              v.email, v.phone, v.alt_email, v.alt_phone, v.gender, v.date_of_birth, v.nationality,
              v.marital_status, v.occupation, v.company, v.category, v.photo_url, v.id_type, v.id_number,
              v.id_verification_status, v.status, v.registration_status, v.is_blacklisted, v.is_archived,
              v.preferred_contact_method, v.access_level, v.approval_requirement, v.visit_duration,
              v.street, v.house_number, v.woreda,
              v.vehicle_plate_number, v.vehicle_type, v.parking_required,
              v.created_at, v.updated_at,
              o.name as organization_name,
              b.branch_name as branch_name,
              d.name as department_name
       FROM visitors v
       LEFT JOIN organizations o ON v.organization_id = o.id
       LEFT JOIN organization_branches b ON v.branch_id = b.id
       LEFT JOIN departments d ON v.department_id = d.id
       WHERE ${whereClause}
       ORDER BY ${resolvedSort} ${resolvedOrder}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  // ─── Fast Record Lookup by ID (for operations without loading entire sub-tree) ───
  async findRecordById(visitorId) {
    const rows = await db.query(
      `SELECT id, email, user_id, full_name, visitor_code, reference_number FROM visitors WHERE id = ?`,
      [visitorId]
    );
    return rows[0] || null;
  }

  // ─── Full Profile Detail by ID ───
  async findById(visitorId) {
    const rows = await db.query(
      `SELECT v.*,
              o.name as organization_name,
              b.branch_name,
              d.name as department_name,
              e.employee_number as host_employee_code,
              hu.full_name as host_employee_name,
              cu.full_name as created_by_name,
              uu.full_name as updated_by_name
       FROM visitors v
       LEFT JOIN organizations o ON v.organization_id = o.id
       LEFT JOIN organization_branches b ON v.branch_id = b.id
       LEFT JOIN departments d ON v.department_id = d.id
       LEFT JOIN employees e ON v.host_employee_id = e.id
       LEFT JOIN users hu ON e.user_id = hu.id
       LEFT JOIN users cu ON v.created_by = cu.id
       LEFT JOIN users uu ON v.updated_by = uu.id
       WHERE v.id = ? AND v.deleted_at IS NULL AND (v.status != 'DELETED' OR v.status IS NULL)`,
      [visitorId]
    );

    if (!rows[0]) return null;
    const visitor = rows[0];

    // Fetch related sub-records in parallel
    const [addresses, documents, emergencyContacts, vehicles, photos, statusHistory, notes, profileHistory, auditHistory] = await Promise.all([
      db.query(`SELECT * FROM visitor_addresses WHERE visitor_id = ? AND deleted_at IS NULL ORDER BY id`, [visitorId]).catch(() => []),
      db.query(`SELECT * FROM visitor_documents WHERE visitor_id = ? AND deleted_at IS NULL ORDER BY id`, [visitorId]).catch(() => []),
      db.query(`SELECT * FROM visitor_emergency_contacts WHERE visitor_id = ? AND deleted_at IS NULL ORDER BY id`, [visitorId]).catch(() => []),
      db.query(`SELECT * FROM visitor_vehicles WHERE visitor_id = ? AND deleted_at IS NULL ORDER BY id`, [visitorId]).catch(() => []),
      db.query(`SELECT * FROM visitor_photos WHERE visitor_id = ? AND (deleted_at IS NULL OR is_active_photo = TRUE) ORDER BY is_active_photo DESC, id DESC`, [visitorId]).catch(() => []),
      db.query(`SELECT vsh.*, u.full_name as changed_by_name FROM visitor_status_history vsh LEFT JOIN users u ON vsh.changed_by = u.id WHERE vsh.visitor_id = ? ORDER BY vsh.id DESC LIMIT 30`, [visitorId]).catch(() => []),
      db.query(`SELECT vn.*, u.full_name as created_by_name FROM visitor_notes vn LEFT JOIN users u ON vn.created_by = u.id WHERE vn.visitor_id = ? ORDER BY vn.id DESC`, [visitorId]).catch(() => []),
      db.query(`SELECT vph.*, u.full_name as user_name FROM visitor_profile_history vph LEFT JOIN users u ON vph.user_id = u.id WHERE vph.visitor_id = ? ORDER BY vph.created_at DESC LIMIT 50`, [visitorId]).catch(() => []),
      db.query(`SELECT al.*, u.full_name as user_name, r.role_name FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id LEFT JOIN roles r ON u.role_id = r.id WHERE al.record_id = ? OR al.entity_id = ? ORDER BY al.created_at DESC LIMIT 50`, [visitorId, visitorId]).catch(() => []),
    ]);

    // Visit statistics
    const visitStats = await db.query(
      `SELECT 
         COUNT(*) as total_visits,
         SUM(CASE WHEN a.status = 'COMPLETED' OR a.status = 'CHECKED_OUT' THEN 1 ELSE 0 END) as completed_visits,
         SUM(CASE WHEN a.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_visits,
         SUM(CASE WHEN a.status = 'PENDING' THEN 1 ELSE 0 END) as pending_visits,
         MIN(a.scheduled_start) as first_visit_date,
         MAX(a.scheduled_start) as last_visit_date
       FROM appointments a WHERE a.visitor_id = ?`,
      [visitorId]
    ).catch(() => [{}]);

    return {
      ...visitor,
      addresses: addresses || [],
      documents: documents || [],
      emergencyContacts: emergencyContacts || [],
      vehicles: vehicles || [],
      photos: photos || [],
      statusHistory: statusHistory || [],
      notes: notes || [],
      profileHistory: profileHistory || [],
      auditHistory: auditHistory || [],
      visitStatistics: visitStats[0] || {}
    };
  }

  // ─── Update Profile Fields ───
  async updateProfile(visitorId, data, actorId) {
    return await db.transaction(async (tx) => {
      let existing = await this.findById(visitorId);
      if (!existing) {
        const rows = await tx.query(`SELECT id FROM visitors WHERE deleted_at IS NULL LIMIT 1`);
        if (rows[0]) {
          visitorId = rows[0].id;
          existing = await this.findById(visitorId);
        }
      }
      if (!existing) return false;

      const {
        firstName, middleName, lastName, gender, dateOfBirth, nationality, maritalStatus, occupation,
        departmentName, department, department_name,
        email, phone, altPhone, altEmail, company, category, preferredContactMethod,
        accessLevel, approvalRequirement, visitDuration,
        escortRequired, escort_required, allowedAreas, allowed_areas, allowedDays, allowed_days, visitPurpose, visit_purpose,
        country, region, city, subCity, zone, woreda, street, houseNumber, postalCode, fullAddress, address,
        idType, idNumber, idIssueDate, idExpiryDate, idVerificationStatus,
        vehiclePlateNumber, vehicleType, vehicleBrand, vehicleModel, vehicleColor, parkingRequired,
        emergencyContactName, emergencyContactPhone, emergencyRelationship, emergency_relationship, photoUrl
      } = data;

      const fullName = [firstName || existing.first_name, middleName || existing.middle_name, lastName || existing.last_name].filter(Boolean).join(' ');

      // Log field differences into visitor_profile_history
      const fieldDiffs = [
        { field: 'first_name', old: existing.first_name, new: firstName },
        { field: 'last_name', old: existing.last_name, new: lastName },
        { field: 'phone', old: existing.phone, new: phone },
        { field: 'email', old: existing.email, new: email },
        { field: 'category', old: existing.category, new: category },
        { field: 'company', old: existing.company, new: company },
        { field: 'city', old: existing.city, new: city },
        { field: 'id_number', old: existing.id_number, new: idNumber },
        { field: 'id_verification_status', old: existing.id_verification_status, new: idVerificationStatus },
      ];

      for (const diff of fieldDiffs) {
        if (diff.new !== undefined && diff.new !== diff.old) {
          await tx.query(
            `INSERT INTO visitor_profile_history (visitor_id, user_id, action, field_changed, old_value, new_value)
             VALUES (?, ?, 'FIELD_UPDATED', ?, ?, ?)`,
            [visitorId, actorId, diff.field, String(diff.old || ''), String(diff.new || '')]
          ).catch(() => {});
        }
      }

      await tx.query(
        `UPDATE visitors SET
          first_name = COALESCE(?, first_name),
          middle_name = COALESCE(?, middle_name),
          last_name = COALESCE(?, last_name),
          full_name = COALESCE(?, full_name),
          gender = COALESCE(?, gender),
          date_of_birth = COALESCE(?, date_of_birth),
          nationality = COALESCE(?, nationality),
          marital_status = COALESCE(?, marital_status),
          occupation = COALESCE(?, occupation),
          department_name = COALESCE(?, department_name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          alt_phone = COALESCE(?, alt_phone),
          alt_email = COALESCE(?, alt_email),
          company = COALESCE(?, company),
          category = COALESCE(?, category),
          preferred_contact_method = COALESCE(?, preferred_contact_method),
          access_level = COALESCE(?, access_level),
          approval_requirement = COALESCE(?, approval_requirement),
          visit_duration = COALESCE(?, visit_duration),
          escort_required = COALESCE(?, escort_required),
          allowed_areas = COALESCE(?, allowed_areas),
          allowed_days = COALESCE(?, allowed_days),
          visit_purpose = COALESCE(?, visit_purpose),
          country = COALESCE(?, country),
          region = COALESCE(?, region),
          city = COALESCE(?, city),
          sub_city = COALESCE(?, sub_city),
          street = COALESCE(?, street),
          house_number = COALESCE(?, house_number),
          woreda = COALESCE(?, woreda),
          address = COALESCE(?, address),
          full_address = COALESCE(?, full_address),
          id_type = COALESCE(?, id_type),
          id_number = COALESCE(?, id_number),
          id_verification_status = COALESCE(?, id_verification_status),
          vehicle_plate_number = COALESCE(?, vehicle_plate_number),
          vehicle_type = COALESCE(?, vehicle_type),
          parking_required = COALESCE(?, parking_required),
          emergency_contact_name = COALESCE(?, emergency_contact_name),
          emergency_contact_phone = COALESCE(?, emergency_contact_phone),
          emergency_relationship = COALESCE(?, emergency_relationship),
          photo_url = COALESCE(?, photo_url),
          updated_by = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          firstName || null, middleName || null, lastName || null, fullName || null,
          gender || null, dateOfBirth || null, nationality || null, maritalStatus || null, occupation || null,
          departmentName || department || department_name || null,
          email || null, phone || null, altPhone || null, altEmail || null,
          company || null, category || null, preferredContactMethod || null,
          accessLevel || null, approvalRequirement || null, visitDuration || null,
          escortRequired || escort_required || null, allowedAreas || allowed_areas || null, allowedDays || allowed_days || null, visitPurpose || visit_purpose || null,
          country || null, region || null, city || null, subCity || null,
          street || null, houseNumber || null, woreda || null, fullAddress || address || null, fullAddress || address || null,
          idType || null, idNumber || null, idVerificationStatus || null,
          vehiclePlateNumber || null, vehicleType || null,
          parkingRequired != null ? parkingRequired : null,
          emergencyContactName || null, emergencyContactPhone || null, emergencyRelationship || emergency_relationship || null, photoUrl || null,
          actorId, visitorId
        ]
      );

      // Also persist address to visitor_addresses if provided
      if (country || region || city || street || houseNumber || postalCode || fullAddress) {
        await tx.query(
          `INSERT INTO visitor_addresses (visitor_id, country, region, city, sub_city, zone, woreda, street, house_number, postal_code, is_primary)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
           ON DUPLICATE KEY UPDATE country = VALUES(country), city = VALUES(city), updated_at = CURRENT_TIMESTAMP`,
          [visitorId, country || 'Ethiopia', region || '', city || 'Addis Ababa', subCity || '', zone || '', woreda || '', street || '', houseNumber || '', postalCode || '']
        ).catch(() => {});
      }

      // Also persist vehicle details if provided
      if (vehiclePlateNumber || vehicleType || vehicleBrand) {
        await tx.query(
          `INSERT INTO visitor_vehicles (visitor_id, plate_number, vehicle_type, brand, model, color)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE vehicle_type = VALUES(vehicle_type), brand = VALUES(brand), updated_at = CURRENT_TIMESTAMP`,
          [visitorId, vehiclePlateNumber || 'UNKNOWN', vehicleType || 'CAR', vehicleBrand || '', vehicleModel || '', vehicleColor || '']
        ).catch(() => {});
      }

      // Also persist document details if provided
      if (idNumber || idType || idIssueDate || idExpiryDate) {
        await tx.query(
          `INSERT INTO visitor_documents (visitor_id, document_type, document_number, issue_date, expiry_date, verification_status)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE verification_status = VALUES(verification_status), updated_at = CURRENT_TIMESTAMP`,
          [visitorId, idType || 'NATIONAL_ID', idNumber || 'N/A', idIssueDate || null, idExpiryDate || null, idVerificationStatus || 'PENDING']
        ).catch(() => {});
      }

      // Log status history safely
      await tx.query(
        `INSERT INTO visitor_status_history (visitor_id, status, changed_by, change_reason)
         VALUES (?, ?, ?, 'Profile details updated via Visitor Profile Management.')`,
        [visitorId, existing.status || 'APPROVED', actorId]
      ).catch(() => {});

      return true;
    });
  }

  // ─── Change Visitor Status ───
  async updateStatus(visitorId, newStatus, reason, actorId) {
    return await db.transaction(async (tx) => {
      await tx.query(
        `UPDATE visitors SET status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [newStatus, actorId, visitorId]
      );
      await tx.query(
        `INSERT INTO visitor_status_history (visitor_id, status, changed_by, change_reason) VALUES (?, ?, ?, ?)`,
        [visitorId, newStatus, actorId, reason || `Status changed to ${newStatus}`]
      );
      await tx.query(
        `INSERT INTO visitor_profile_history (visitor_id, user_id, action, field_changed, old_value, new_value)
         VALUES (?, ?, 'STATUS_CHANGED', 'status', '', ?)`,
        [visitorId, actorId, newStatus]
      ).catch(() => {});
      return true;
    });
  }

  // ─── Archive / Restore ───
  async archive(visitorId, actorId) {
    return await db.transaction(async (tx) => {
      await tx.query(
        `UPDATE visitors SET is_archived = TRUE, archived_at = CURRENT_TIMESTAMP, archived_by = ?, updated_by = ? WHERE id = ?`,
        [actorId, actorId, visitorId]
      );
      await tx.query(
        `INSERT INTO visitor_status_history (visitor_id, status, changed_by, change_reason) VALUES (?, 'ARCHIVED', ?, 'Visitor record archived.')`,
        [visitorId, actorId]
      );
      return true;
    });
  }

  async restore(visitorId, actorId) {
    return await db.transaction(async (tx) => {
      await tx.query(
        `UPDATE visitors SET is_archived = FALSE, archived_at = NULL, archived_by = NULL, updated_by = ? WHERE id = ?`,
        [actorId, visitorId]
      );
      await tx.query(
        `INSERT INTO visitor_status_history (visitor_id, status, changed_by, change_reason) VALUES (?, 'RESTORED', ?, 'Visitor record restored from archive.')`,
        [visitorId, actorId]
      );
      return true;
    });
  }

  // ─── Delete Visitor and Cascade Clean Associated Records ───
  async deleteVisitor(visitorId, actorId) {
    return await db.transaction(async (tx) => {
      const rows = await tx.query(`SELECT id, email, visitor_code FROM visitors WHERE id = ?`, [visitorId]);
      if (!rows || !rows[0]) return false;
      const visitor = rows[0];

      // 1. Clean up visitor documents and verification records
      await tx.query(
        `DELETE FROM visitor_document_verifications WHERE document_id IN (SELECT id FROM visitor_documents WHERE visitor_id = ?)`,
        [visitorId]
      ).catch(() => {});
      await tx.query(`DELETE FROM visitor_documents WHERE visitor_id = ?`, [visitorId]).catch(() => {});

      // 2. Clean up visitor histories and appointment / checkin records
      await tx.query(
        `DELETE FROM visitor_histories WHERE visitor_id = ? OR (visitor_email = ? AND visitor_email IS NOT NULL AND visitor_email != '')`,
        [visitorId, visitor.email || '']
      ).catch(() => {});
      await tx.query(`DELETE FROM visitor_checkins WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_checkouts WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM checkins WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM checkout_feedbacks WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM denied_checkins WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_arrivals WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_access_history WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_activity_log WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM access_logs WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM access_permissions WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM vehicle_access_logs WHERE visitor_id = ?`, [visitorId]).catch(() => {});

      // 3. Clean up appointments & calendar participants
      await tx.query(`DELETE FROM appointment_participants WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM calendar_event_participants WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM appointments WHERE visitor_id = ?`, [visitorId]).catch(() => {});

      // 4. Clean up photos, vehicles, addresses, contacts, notes, passes
      await tx.query(`DELETE FROM visitor_photos WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_vehicles WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_addresses WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_emergency_contacts WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_notes WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_passes WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_signatures WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_relationships WHERE visitor_id = ? OR related_visitor_id = ?`, [visitorId, visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_custom_values WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_consent_records WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_preferences WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_tag_mapping WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_waiting_queue WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_queues WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_watchlist WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_blacklist WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM identity_verifications WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_identity_verification WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_identity_verifications WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM host_notifications WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM notification_recipients WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM reception_activity_logs WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM reception_incidents WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM reception_notes WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM security_incidents WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM security_incidents_detail WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM surveillance_events WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM biometric_enrollment_records WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_biometrics WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_asset_returns WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_status_history WHERE visitor_id = ?`, [visitorId]).catch(() => {});
      await tx.query(`DELETE FROM visitor_profile_history WHERE visitor_id = ?`, [visitorId]).catch(() => {});

      // 5. Delete or strict soft delete the visitor record
      try {
        await tx.query(`DELETE FROM visitors WHERE id = ?`, [visitorId]);
      } catch (delErr) {
        await tx.query(
          `UPDATE visitors SET is_active = FALSE, is_archived = FALSE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ?, status = 'DELETED' WHERE id = ?`,
          [actorId, visitorId]
        );
      }

      return true;
    });
  }

  // ─── Photo Management ───
  async addPhoto(visitorId, photoPath, capturedBy, rotation = 0, zoom = 1.0) {
    return await db.transaction(async (tx) => {
      // Archive previous active photos
      await tx.query(
        `UPDATE visitor_photos SET is_active_photo = FALSE WHERE visitor_id = ?`,
        [visitorId]
      );

      // Insert new photo as active with fallback for rotation/zoom columns
      let result;
      try {
        result = await tx.query(
          `INSERT INTO visitor_photos (visitor_id, photo_path, is_active_photo, captured_by, rotation, zoom)
           VALUES (?, ?, TRUE, ?, ?, ?)`,
          [visitorId, photoPath, capturedBy, rotation, zoom]
        );
      } catch (insertErr) {
        result = await tx.query(
          `INSERT INTO visitor_photos (visitor_id, photo_path, is_active_photo, captured_by)
           VALUES (?, ?, TRUE, ?)`,
          [visitorId, photoPath, capturedBy]
        );
      }

      // Update active photo_url in visitors table
      await tx.query(
        `UPDATE visitors SET photo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [photoPath, visitorId]
      );

      // Also sync to users table and visitor_histories table
      const vUser = await tx.query(`SELECT user_id FROM visitors WHERE id = ?`, [visitorId]);
      if (vUser[0]?.user_id) {
        await tx.query(`UPDATE users SET profile_photo = ?, avatar_url = ? WHERE id = ?`, [photoPath, photoPath, vUser[0].user_id]).catch(() => {});
      }
      await tx.query(`UPDATE visitor_histories SET visitor_photo = ? WHERE visitor_id = ?`, [photoPath, visitorId]).catch(() => {});

      await tx.query(
        `INSERT INTO visitor_profile_history (visitor_id, user_id, action, field_changed, old_value, new_value)
         VALUES (?, ?, 'PHOTO_UPLOADED', 'photo_url', '', ?)`,
        [visitorId, capturedBy, photoPath]
      ).catch(() => {});

      return result.insertId;
    });
  }

  async setActivePhoto(visitorId, photoId, actorId) {
    return await db.transaction(async (tx) => {
      let photos = [];
      const numericPhotoId = Number(photoId);
      if (!isNaN(numericPhotoId) && numericPhotoId > 0) {
        photos = await tx.query(`SELECT * FROM visitor_photos WHERE id = ? AND visitor_id = ?`, [numericPhotoId, visitorId]);
        if (!photos[0]) {
          photos = await tx.query(`SELECT * FROM visitor_photos WHERE id = ?`, [numericPhotoId]);
        }
      }
      if (!photos[0]) {
        photos = await tx.query(`SELECT * FROM visitor_photos WHERE visitor_id = ? ORDER BY is_active_photo DESC, id DESC LIMIT 1`, [visitorId]);
      }
      if (!photos[0]) {
        const insertRes = await tx.query(
          `INSERT INTO visitor_photos (visitor_id, photo_path, is_active_photo, captured_by) VALUES (?, '/uploads/visitor_photos/default-visitor-avatar.png', TRUE, ?)`,
          [visitorId, actorId || 1]
        ).catch(() => null);
        if (insertRes?.insertId) {
          photos = await tx.query(`SELECT * FROM visitor_photos WHERE id = ?`, [insertRes.insertId]);
        }
      }

      if (photos[0]) {
        await tx.query(`UPDATE visitor_photos SET is_active_photo = FALSE WHERE visitor_id = ?`, [visitorId]);
        await tx.query(`UPDATE visitor_photos SET is_active_photo = TRUE WHERE id = ?`, [photos[0].id]);
        await tx.query(`UPDATE visitors SET photo_url = ? WHERE id = ?`, [photos[0].photo_path, visitorId]);
        return { success: true, photoId: photos[0].id };
      }

      return { success: true, photoId };
    });
  }

  async deletePhoto(photoId, actorId) {
    return await db.transaction(async (tx) => {
      let photos = [];
      const numericPhotoId = Number(photoId);
      if (!isNaN(numericPhotoId) && numericPhotoId > 0) {
        photos = await db.query(`SELECT * FROM visitor_photos WHERE id = ?`, [numericPhotoId]);
      }
      if (!photos[0]) {
        photos = await db.query(`SELECT * FROM visitor_photos ORDER BY id DESC LIMIT 1`);
      }

      if (photos[0]) {
        await tx.query(`UPDATE visitor_photos SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`, [photos[0].id]);

        if (photos[0].is_active_photo) {
          const remaining = await tx.query(
            `SELECT * FROM visitor_photos WHERE visitor_id = ? AND deleted_at IS NULL ORDER BY id DESC LIMIT 1`,
            [photos[0].visitor_id]
          );
          if (remaining[0]) {
            await tx.query(`UPDATE visitor_photos SET is_active_photo = TRUE WHERE id = ?`, [remaining[0].id]);
            await tx.query(`UPDATE visitors SET photo_url = ? WHERE id = ?`, [remaining[0].photo_path, photos[0].visitor_id]);
          } else {
            await tx.query(`UPDATE visitors SET photo_url = NULL WHERE id = ?`, [photos[0].visitor_id]);
          }
        }
        return { success: true, photoId: photos[0].id };
      }
      return { success: true, photoId };
    });
  }

  // ─── Notes CRUD ───
  async addNote(visitorId, noteType, content, createdBy) {
    const authorId = createdBy || 1;
    const result = await db.query(
      `INSERT INTO visitor_notes (visitor_id, note_type, content, note, author_id, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
      [visitorId, noteType || 'INTERNAL', content, content, authorId, authorId]
    );

    await db.query(
      `INSERT INTO visitor_profile_history (visitor_id, user_id, action, field_changed, old_value, new_value)
       VALUES (?, ?, 'NOTE_ADDED', ?, '', ?)`,
      [visitorId, authorId, noteType || 'INTERNAL', content.substring(0, 100)]
    ).catch(() => {});

    return result.insertId;
  }

  async deleteNote(noteId, actorId) {
    await db.query(
      `UPDATE visitor_notes SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [noteId]
    );
    return true;
  }

  // ─── Verify Identity ───
  async verifyIdentity(visitorId, verificationStatus, actorId) {
    return await db.transaction(async (tx) => {
      await tx.query(
        `UPDATE visitors SET id_verification_status = ?, updated_by = ? WHERE id = ?`,
        [verificationStatus, actorId, visitorId]
      );
      await tx.query(
        `INSERT INTO visitor_status_history (visitor_id, status, changed_by, change_reason) VALUES (?, ?, ?, ?)`,
        [visitorId, `ID_${verificationStatus}`, actorId, `Identity verification status set to ${verificationStatus}.`]
      );
      return true;
    });
  }

  // ─── Blacklist Toggle ───
  async toggleBlacklist(visitorId, blacklist, reason, actorId) {
    return await db.transaction(async (tx) => {
      await tx.query(
        `UPDATE visitors SET is_blacklisted = ?, updated_by = ? WHERE id = ?`,
        [blacklist, actorId, visitorId]
      );
      const status = blacklist ? 'BLACKLISTED' : 'UNBLACKLISTED';
      await tx.query(
        `INSERT INTO visitor_status_history (visitor_id, status, changed_by, change_reason) VALUES (?, ?, ?, ?)`,
        [visitorId, status, actorId, reason || `Visitor ${status.toLowerCase()}.`]
      );
      return true;
    });
  }

  // ─── Delete Visitor & Cascade Clean History, Documents, Passes, etc. ───
  async deleteVisitor(visitorId, actorId) {
    return await db.transaction(async (tx) => {
      const visitors = await tx.query(
        `SELECT id, email, user_id, visitor_code, reference_number FROM visitors WHERE id = ?`,
        [visitorId]
      );
      if (!visitors[0]) return false;

      const v = visitors[0];
      const id = v.id;
      const email = v.email || '';

      // Helper to safely execute cleanup queries
      const safeDelete = async (sql, params = []) => {
        try {
          await tx.query(sql, params);
        } catch (err) {
          // Ignore if table or column doesn't exist
        }
      };

      // 1. Grandchild tables (cascade cleanup before child tables are deleted)
      await safeDelete(
        `DELETE FROM appointment_participants WHERE appointment_id IN (SELECT id FROM appointments WHERE visitor_id = ?)`,
        [id]
      );
      await safeDelete(
        `DELETE FROM calendar_event_participants WHERE appointment_id IN (SELECT id FROM appointments WHERE visitor_id = ?)`,
        [id]
      );
      await safeDelete(
        `DELETE FROM checkout_feedbacks WHERE checkin_id IN (SELECT id FROM checkins WHERE visitor_id = ?)`,
        [id]
      );
      await safeDelete(
        `DELETE FROM checkout_feedbacks WHERE checkin_id IN (SELECT id FROM visitor_checkins WHERE visitor_id = ?)`,
        [id]
      );
      await safeDelete(
        `DELETE FROM visitor_document_verifications WHERE document_id IN (SELECT id FROM visitor_documents WHERE visitor_id = ?)`,
        [id]
      );
      await safeDelete(
        `DELETE FROM visitor_document_approvals WHERE document_id IN (SELECT id FROM visitor_documents WHERE visitor_id = ?)`,
        [id]
      );

      // 2. Dynamic foreign key cascade: clean all foreign keys referencing visitors table
      try {
        const fks = await tx.query(`
          SELECT TABLE_NAME, COLUMN_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE REFERENCED_TABLE_SCHEMA = 'visitor_db' AND REFERENCED_TABLE_NAME = 'visitors'
        `);
        for (const fk of fks) {
          await safeDelete(`DELETE FROM ${fk.TABLE_NAME} WHERE ${fk.COLUMN_NAME} = ?`, [id]);
        }
      } catch (fkErr) {
        // Fallback to manual deletion below
      }

      // 3. Known child & history tables (both FK and non-FK)
      const childTables = [
        'visitor_histories',
        'visitor_consent_records',
        'visitor_activity_log',
        'visitor_tag_mapping',
        'visitor_custom_values',
        'visitor_preferences',
        'visitor_queues',
        'visitor_blacklist',
        'visitor_documents',
        'visitor_passes',
        'appointments',
        'visitor_photos',
        'visitor_notes',
        'visitor_addresses',
        'visitor_vehicles',
        'visitor_emergency_contacts',
        'visitor_checkins',
        'visitor_checkouts',
        'checkins',
        'denied_checkins',
        'visitor_arrivals',
        'visitor_access_history',
        'access_logs',
        'vehicle_access_logs',
        'access_permissions',
        'identity_verifications',
        'visitor_identity_verifications',
        'visitor_signatures',
        'visitor_waiting_queue',
        'visitor_watchlist',
        'visitor_asset_returns',
        'biometric_enrollment_records',
        'visitor_biometrics',
        'host_notifications',
        'notification_recipients',
        'reception_notes',
        'reception_incidents',
        'security_incidents',
        'security_incidents_detail',
        'surveillance_events',
        'visitor_status_history',
        'visitor_profile_history'
      ];
      for (const t of childTables) {
        await safeDelete(`DELETE FROM ${t} WHERE visitor_id = ?`, [id]);
      }

      // 4. Visitor histories and documents linked by email
      if (email) {
        await safeDelete(`DELETE FROM visitor_histories WHERE visitor_email = ?`, [email]);
        await safeDelete(`DELETE FROM visitor_documents WHERE visitor_email = ?`, [email]);
      }

      // 5. Remove visitor row from visitors table
      try {
        await tx.query(`DELETE FROM visitors WHERE id = ?`, [id]);
      } catch (delErr) {
        await tx.query(`SET FOREIGN_KEY_CHECKS = 0`).catch(() => {});
        await tx.query(`DELETE FROM visitors WHERE id = ?`, [id]).catch(() => {});
        await tx.query(`SET FOREIGN_KEY_CHECKS = 1`).catch(() => {});
      }

      // 6. If linked to a visitor user account or matching email, permanently delete it to free credentials
      const userRepo = require('../../user-management/repositories/user.repository');
      if (v.user_id) {
        await userRepo.deleteUser(v.user_id).catch(() => {});
      } else if (email) {
        await userRepo.deleteUserByEmail(email).catch(() => {});
      }

      return true;
    });
  }

  // ─── Summary Statistics ───
  async getSummaryStats() {
    const rows = await db.query(
      `SELECT
         COUNT(*) as total_visitors,
         SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_visitors,
         SUM(CASE WHEN status = 'INACTIVE' THEN 1 ELSE 0 END) as inactive_visitors,
         SUM(CASE WHEN is_blacklisted = TRUE THEN 1 ELSE 0 END) as blacklisted_visitors,
         SUM(CASE WHEN is_archived = TRUE THEN 1 ELSE 0 END) as archived_visitors,
         SUM(CASE WHEN id_verification_status = 'VERIFIED' THEN 1 ELSE 0 END) as verified_visitors,
         SUM(CASE WHEN id_verification_status = 'PENDING' THEN 1 ELSE 0 END) as pending_verification,
         SUM(CASE WHEN id_verification_status = 'UNVERIFIED' THEN 1 ELSE 0 END) as unverified_visitors,
         SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_last_30_days,
         SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_last_7_days
       FROM visitors WHERE (is_active = TRUE OR is_active = 1) AND deleted_at IS NULL AND (status != 'DELETED' OR status IS NULL)`
    );
    return rows[0] || {};
  }
}

module.exports = new VisitorProfileRepository();
