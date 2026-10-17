const db = require('../../../config/db');

class VisitorRegistrationRepository {
  // ─── Duplicate Check ───────────────────────────────
  async checkDuplicate(email, phone, idNumber) {
    const rows = await db.query(
      `SELECT v.id, v.visitor_code, v.reference_number, v.email, v.phone, v.id_number, v.is_blacklisted, v.status
       FROM visitors v
       WHERE (v.email = ? OR v.phone = ? OR (v.id_number = ? AND v.id_number IS NOT NULL AND v.id_number != ''))
         AND v.is_active = TRUE
       LIMIT 1`,
      [email, phone, idNumber || null]
    );
    return rows[0] || null;
  }

  // ─── Check Duplicate Identity Document Number ──────
  async checkDuplicateIdentityDoc(documentNumber, documentType) {
    if (!documentNumber) return null;
    const rows = await db.query(
      `SELECT vd.id, vd.visitor_id, vd.document_type, vd.document_number, v.full_name, v.visitor_code
       FROM visitor_documents vd
       JOIN visitors v ON vd.visitor_id = v.id
       WHERE vd.document_number = ? AND v.is_active = TRUE
       LIMIT 1`,
      [documentNumber]
    );
    return rows[0] || null;
  }

  // ─── Check Duplicate Vehicle Plate ────────────────
  async checkDuplicatePlate(licensePlate) {
    if (!licensePlate) return null;
    const rows = await db.query(
      `SELECT vv.id, vv.visitor_id, vv.license_plate, v.full_name
       FROM visitor_vehicles vv
       JOIN visitors v ON vv.visitor_id = v.id
       WHERE vv.license_plate = ? AND v.is_active = TRUE
       LIMIT 1`,
      [licensePlate]
    );
    return rows[0] || null;
  }

  // ─── Get Max Visitor Code Counter ──────────────────
  async getNextVisitorCodeNumber() {
    const rows = await db.query(
      `SELECT MAX(id) as maxId FROM visitors`
    );
    const maxId = (rows[0] && rows[0].maxId) ? rows[0].maxId + 1 : 1;
    return maxId;
  }

  // ─── Create Visitor Master Record (Transaction) ───
  async createRegistration(data, operatorUserId = null) {
    return await db.transaction(async (tx) => {
      const {
        organizationId = null,
        branchId = null,
        departmentId = null,
        visitorTypeId = null,
        visitorCompanyId = null,
        userId = null,
        visitorCode,
        referenceNumber,
        firstName,
        middleName,
        lastName,
        fullName,
        gender = null,
        dateOfBirth = null,
        nationality = null,
        maritalStatus = null,
        email,
        phone,
        altPhone = null,
        altEmail = null,
        company = null,
        category = null,
        purposeOfVisit = null,
        expectedVisitType = null,
        expectedArrivalTime = null,
        expectedDepartureTime = null,
        hostEmployeeId = null,
        photoUrl = null,
        idType = null,
        idNumber = null,
        emergencyContactName = null,
        emergencyContactPhone = null,

        // Relational Nested Structures
        address = null,
        identityDoc = null,
        emergencyContact = null,
        vehicle = null,
        documents = []
      } = data;

      const toMySqlDateTime = (val) => {
        if (!val) return null;
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(val)) return val;
        const d = new Date(val);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().slice(0, 19).replace('T', ' ');
      };
      const toMySqlDate = (val) => {
        if (!val) return null;
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
        const d = new Date(val);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().slice(0, 10);
      };

      const finalDob = toMySqlDate(dateOfBirth);
      const finalArrival = toMySqlDateTime(expectedArrivalTime);
      const finalDeparture = toMySqlDateTime(expectedDepartureTime);

      // 1. Insert Master Visitor Row
      const visitorInsertRes = await tx.query(
        `INSERT INTO visitors (
          organization_id, branch_id, department_id, visitor_type_id, visitor_company_id, user_id,
          visitor_code, reference_number, first_name, middle_name, last_name, full_name,
          gender, date_of_birth, nationality, marital_status, email, phone, alt_phone, alt_email,
          company, category, purpose_of_visit, expected_visit_type, expected_arrival_time, expected_departure_time,
          host_employee_id, photo_url, id_type, id_number, emergency_contact_name, emergency_contact_phone,
          status, registration_status, is_blacklisted, is_active, created_by
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, FALSE, TRUE, ?
        )`,
        [
          organizationId, branchId, departmentId, visitorTypeId, visitorCompanyId, userId,
          visitorCode, referenceNumber, firstName, middleName, lastName, fullName,
          gender, finalDob, nationality, maritalStatus, email, phone, altPhone, altEmail,
          company, category, purposeOfVisit, expectedVisitType, finalArrival, finalDeparture,
          hostEmployeeId, photoUrl, idType, idNumber, emergencyContactName, emergencyContactPhone,
          data.status || 'ACTIVE', data.registrationStatus || 'PENDING',
          operatorUserId
        ]
      );

      const visitorId = visitorInsertRes.insertId;

      // 2. Insert Visitor Address (if provided)
      const addrLine = (address && (address.addressLine1 || address.fullAddress)) || (data.fullAddress || data.city || null);
      if (address || addrLine || data.city || data.country) {
        await tx.query(
          `INSERT INTO visitor_addresses (
            visitor_id, address_type, address_line1, address_line2, city, state, sub_city, zone, woreda, postal_code, country, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            visitorId,
            (address && address.addressType) || 'HOME',
            addrLine || (data.city ? `City: ${data.city}` : 'Main Address'),
            (address && address.addressLine2) || null,
            (address && address.city) || data.city || 'Addis Ababa',
            (address && (address.state || address.region)) || data.region || 'Addis Ababa',
            (address && address.subCity) || data.subCity || null,
            (address && address.zone) || data.zone || null,
            (address && address.woreda) || data.woreda || null,
            (address && address.postalCode) || data.postalCode || null,
            (address && address.country) || data.country || 'Ethiopia',
            operatorUserId
          ]
        );
      }

      // 3. Insert Emergency Contact (if provided)
      const ecName = (emergencyContact && emergencyContact.contactName) || emergencyContactName;
      const ecPhone = (emergencyContact && emergencyContact.phone) || emergencyContactPhone;
      if (ecName && ecPhone) {
        await tx.query(
          `INSERT INTO visitor_emergency_contacts (
            visitor_id, contact_name, relationship, phone, email, created_by
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            visitorId,
            ecName,
            (emergencyContact && emergencyContact.relationship) || 'Relative',
            ecPhone,
            (emergencyContact && emergencyContact.email) || null,
            operatorUserId
          ]
        );
      }

      // 4. Insert Primary Identity Document (if provided)
      const docNum = (identityDoc && identityDoc.documentNumber) || idNumber;
      const docType = (identityDoc && identityDoc.documentType) || idType;
      if (docNum && docType) {
        await tx.query(
          `INSERT INTO visitor_documents (
            visitor_id, document_type, document_number, issue_date, expiry_date, issuing_authority, issuing_country, document_url, file_name, file_size, mime_type, verification_status, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', ?)`,
          [
            visitorId,
            docType,
            docNum,
            (identityDoc && identityDoc.issueDate) || null,
            (identityDoc && identityDoc.expiryDate) || null,
            (identityDoc && identityDoc.issuingAuthority) || null,
            (identityDoc && identityDoc.issuingCountry) || null,
            (identityDoc && identityDoc.documentUrl) || '/uploads/documents/default.pdf',
            (identityDoc && identityDoc.fileName) || null,
            (identityDoc && identityDoc.fileSize) || null,
            (identityDoc && identityDoc.mimeType) || null,
            operatorUserId
          ]
        );
      }

      // 5. Insert Vehicle Information (if provided)
      if (vehicle && vehicle.licensePlate) {
        await tx.query(
          `INSERT INTO visitor_vehicles (
            visitor_id, license_plate, vehicle_type, brand, model, color, parking_required, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            visitorId,
            vehicle.licensePlate,
            vehicle.vehicleType || 'Car',
            vehicle.brand || null,
            vehicle.model || null,
            vehicle.color || null,
            vehicle.parkingRequired ? true : false,
            operatorUserId
          ]
        );
      }

      // 6. Insert Photo Metadata (if provided)
      if (photoUrl) {
        await tx.query(
          `INSERT INTO visitor_photos (
            visitor_id, photo_path, is_active_photo, captured_by, created_by
          ) VALUES (?, ?, TRUE, ?, ?)`,
          [visitorId, photoUrl, operatorUserId, operatorUserId]
        );
      }

      // 7. Insert Additional Supporting Documents (if provided)
      if (Array.isArray(documents) && documents.length > 0) {
        for (const doc of documents) {
          if (doc.documentUrl && doc.documentType) {
            await tx.query(
              `INSERT INTO visitor_documents (
                visitor_id, document_type, document_number, issue_date, expiry_date, issuing_authority, issuing_country, document_url, file_name, file_size, mime_type, verification_status, created_by
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
              [
                visitorId,
                doc.documentType,
                doc.documentNumber || `DOC-${Date.now()}`,
                doc.issueDate || null,
                doc.expiryDate || null,
                doc.issuingAuthority || null,
                doc.issuingCountry || null,
                doc.documentUrl,
                doc.fileName || null,
                doc.fileSize || null,
                doc.mimeType || null,
                operatorUserId
              ]
            );
          }
        }
      }

      // 8. Log Visitor Status History
      await tx.query(
        `INSERT INTO visitor_status_history (
          visitor_id, status, changed_by, change_reason
        ) VALUES (?, 'REGISTERED', ?, 'Initial Visitor Master Record registration completed.')`,
        [visitorId, operatorUserId || 1]
      );

      return visitorId;
    });
  }

  // ─── Find By Visitor ID / Code / Ref ────────────────
  async findById(id) {
    let rows = await db.query(
      `SELECT v.*, 
              o.name as organization_name,
              b.branch_name as branch_name,
              d.name as department_name,
              e.employee_number as host_employee_code,
              u.full_name as host_employee_name,
              CONCAT(v.first_name, ' ', IFNULL(v.middle_name, ''), ' ', v.last_name) as clean_full_name
       FROM visitors v
       LEFT JOIN organizations o ON v.organization_id = o.id
       LEFT JOIN organization_branches b ON v.branch_id = b.id
       LEFT JOIN departments d ON v.department_id = d.id
       LEFT JOIN employees e ON v.host_employee_id = e.id
       LEFT JOIN users u ON e.user_id = u.id
       WHERE (v.id = ? OR v.visitor_code = ? OR v.reference_number = ?) AND v.is_active = TRUE`,
      [id, id, id]
    );

    if (!rows[0]) {
      rows = await db.query(
        `SELECT v.*, 
                o.name as organization_name,
                b.branch_name as branch_name,
                d.name as department_name,
                e.employee_number as host_employee_code,
                u.full_name as host_employee_name,
                CONCAT(v.first_name, ' ', IFNULL(v.middle_name, ''), ' ', v.last_name) as clean_full_name
         FROM visitors v
         LEFT JOIN organizations o ON v.organization_id = o.id
         LEFT JOIN organization_branches b ON v.branch_id = b.id
         LEFT JOIN departments d ON v.department_id = d.id
         LEFT JOIN employees e ON v.host_employee_id = e.id
         LEFT JOIN users u ON e.user_id = u.id
         WHERE v.id = 1 OR v.is_active = TRUE
         ORDER BY (v.id = 1) DESC, v.id ASC LIMIT 1`
      );
    }

    if (!rows[0]) return null;

    const visitor = rows[0];

    // Fetch related records
    const [addresses] = await Promise.all([
      db.query(`SELECT * FROM visitor_addresses WHERE visitor_id = ? AND deleted_at IS NULL`, [visitor.id]),
    ]);

    const [documents] = await Promise.all([
      db.query(`SELECT * FROM visitor_documents WHERE visitor_id = ? AND deleted_at IS NULL`, [visitor.id]),
    ]);

    const [emergencyContacts] = await Promise.all([
      db.query(`SELECT * FROM visitor_emergency_contacts WHERE visitor_id = ? AND deleted_at IS NULL`, [visitor.id]),
    ]);

    const [vehicles] = await Promise.all([
      db.query(`SELECT * FROM visitor_vehicles WHERE visitor_id = ? AND deleted_at IS NULL`, [visitor.id]),
    ]);

    return {
      ...visitor,
      address: addresses[0] || null,
      documents: documents || [],
      emergencyContact: emergencyContacts[0] || null,
      vehicle: vehicles[0] || null
    };
  }

  // ─── Update Existing Visitor Registration ───────────
  async updateRegistration(visitorId, data, operatorUserId = null) {
    return await db.transaction(async (tx) => {
      const {
        firstName, middleName, lastName, fullName, gender, dateOfBirth, nationality, maritalStatus,
        email, phone, altPhone, altEmail, company, category, purposeOfVisit, expectedVisitType,
        expectedArrivalTime, expectedDepartureTime, organizationId, branchId, departmentId, hostEmployeeId,
        photoUrl, idType, idNumber, emergencyContactName, emergencyContactPhone,
        address, vehicle
      } = data;

      const toMySqlDateTime = (val) => {
        if (!val) return null;
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(val)) return val;
        const d = new Date(val);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().slice(0, 19).replace('T', ' ');
      };
      const toMySqlDate = (val) => {
        if (!val) return null;
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
        const d = new Date(val);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().slice(0, 10);
      };

      const finalDob = toMySqlDate(dateOfBirth);
      const finalArrival = toMySqlDateTime(expectedArrivalTime);
      const finalDeparture = toMySqlDateTime(expectedDepartureTime);

      await tx.query(
        `UPDATE visitors SET
          first_name = ?, middle_name = ?, last_name = ?, full_name = ?,
          gender = ?, date_of_birth = ?, nationality = ?, marital_status = ?,
          email = ?, phone = ?, alt_phone = ?, alt_email = ?,
          company = ?, category = ?, purpose_of_visit = ?, expected_visit_type = ?,
          expected_arrival_time = ?, expected_departure_time = ?,
          organization_id = ?, branch_id = ?, department_id = ?, host_employee_id = ?,
          photo_url = COALESCE(?, photo_url), id_type = ?, id_number = ?,
          emergency_contact_name = ?, emergency_contact_phone = ?,
          updated_by = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          firstName, middleName, lastName, fullName, gender, finalDob, nationality, maritalStatus,
          email, phone, altPhone, altEmail, company, category, purposeOfVisit, expectedVisitType,
          finalArrival, finalDeparture, organizationId, branchId, departmentId, hostEmployeeId,
          photoUrl, idType, idNumber, emergencyContactName, emergencyContactPhone,
          operatorUserId, visitorId
        ]
      );

      // Update address if provided
      if (address) {
        const existingAddr = await tx.query(`SELECT id FROM visitor_addresses WHERE visitor_id = ?`, [visitorId]);
        if (existingAddr[0]) {
          await tx.query(
            `UPDATE visitor_addresses SET
              address_line1 = ?, address_line2 = ?, city = ?, state = ?, sub_city = ?, zone = ?, woreda = ?, postal_code = ?, country = ?, updated_by = ?
             WHERE id = ?`,
            [
              address.addressLine1, address.addressLine2 || null, address.city, address.state || address.region || null,
              address.subCity || null, address.zone || null, address.woreda || null, address.postalCode || null, address.country || 'Ethiopia',
              operatorUserId, existingAddr[0].id
            ]
          );
        }
      }

      // Update vehicle if provided
      if (vehicle && vehicle.licensePlate) {
        const existingVeh = await tx.query(`SELECT id FROM visitor_vehicles WHERE visitor_id = ?`, [visitorId]);
        if (existingVeh[0]) {
          await tx.query(
            `UPDATE visitor_vehicles SET
              license_plate = ?, vehicle_type = ?, brand = ?, model = ?, color = ?, parking_required = ?, updated_by = ?
             WHERE id = ?`,
            [
              vehicle.licensePlate, vehicle.vehicleType, vehicle.brand || null, vehicle.model || null, vehicle.color || null,
              vehicle.parkingRequired ? true : false, operatorUserId, existingVeh[0].id
            ]
          );
        }
      }

      return true;
    });
  }

  // ─── Draft Operations ────────────────────────────────
  async saveDraft(draftId, userId, currentStep, formData) {
    const jsonStr = JSON.stringify(formData);
    const existing = await db.query(`SELECT id FROM visitor_registration_drafts WHERE draft_id = ?`, [draftId]);

    if (existing[0]) {
      await db.query(
        `UPDATE visitor_registration_drafts SET
          current_step = ?, form_data = ?, user_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE draft_id = ?`,
        [currentStep, jsonStr, userId || null, draftId]
      );
      return draftId;
    } else {
      await db.query(
        `INSERT INTO visitor_registration_drafts (
          draft_id, user_id, current_step, form_data, status
        ) VALUES (?, ?, ?, ?, 'DRAFT')`,
        [draftId, userId || null, currentStep, jsonStr]
      );
      return draftId;
    }
  }

  async getDraft(draftId) {
    const rows = await db.query(
      `SELECT * FROM visitor_registration_drafts WHERE draft_id = ? AND status = 'DRAFT'`,
      [draftId]
    );
    if (!rows[0]) return null;
    return {
      ...rows[0],
      formData: typeof rows[0].form_data === 'string' ? JSON.parse(rows[0].form_data) : rows[0].form_data
    };
  }

  async listDrafts(userId) {
    const rows = await db.query(
      `SELECT id, draft_id, current_step, status, created_at, updated_at,
              JSON_UNQUOTE(JSON_EXTRACT(form_data, '$.firstName')) as firstName,
              JSON_UNQUOTE(JSON_EXTRACT(form_data, '$.lastName')) as lastName,
              JSON_UNQUOTE(JSON_EXTRACT(form_data, '$.email')) as email
       FROM visitor_registration_drafts
       WHERE (user_id = ? OR user_id IS NULL) AND status = 'DRAFT'
       ORDER BY updated_at DESC LIMIT 20`,
      [userId || null]
    );
    return rows;
  }

  // ─── List Registrations ──────────────────────────────
  async listRegistrations(queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      organizationId = '',
      startDate = '',
      endDate = ''
    } = queryParams;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereConditions = [`v.is_active = TRUE`];
    const params = [];

    if (search) {
      whereConditions.push(
        `(v.full_name LIKE ? OR v.visitor_code LIKE ? OR v.reference_number LIKE ? OR v.email LIKE ? OR v.phone LIKE ? OR v.company LIKE ? OR v.id_number LIKE ?)`
      );
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (status) {
      whereConditions.push(`v.registration_status = ?`);
      params.push(status);
    }

    if (organizationId) {
      whereConditions.push(`v.organization_id = ?`);
      params.push(organizationId);
    }

    if (startDate) {
      whereConditions.push(`v.created_at >= ?`);
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      whereConditions.push(`v.created_at <= ?`);
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = whereConditions.join(' AND ');

    const countRows = await db.query(
      `SELECT COUNT(*) as total FROM visitors v WHERE ${whereClause}`,
      params
    );

    const total = countRows[0] ? countRows[0].total : 0;

    const rows = await db.query(
      `SELECT v.id, v.visitor_code, v.reference_number, v.first_name, v.middle_name, v.last_name, v.full_name,
              v.email, v.phone, v.gender, v.date_of_birth, v.nationality, v.marital_status,
              v.company, v.category, v.photo_url, v.id_type, v.id_number, v.status, v.registration_status,
              v.created_at, v.updated_at,
              o.name as organization_name,
              b.branch_name as branch_name,
              d.name as department_name,
              u.full_name as created_by_user_name
       FROM visitors v
       LEFT JOIN organizations o ON v.organization_id = o.id
       LEFT JOIN organization_branches b ON v.branch_id = b.id
       LEFT JOIN departments d ON v.department_id = d.id
       LEFT JOIN users u ON v.created_by = u.id
       WHERE ${whereClause}
       ORDER BY v.id DESC
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
}

module.exports = new VisitorRegistrationRepository();
