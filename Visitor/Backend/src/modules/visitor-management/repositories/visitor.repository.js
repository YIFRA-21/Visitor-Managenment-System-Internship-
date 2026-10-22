const db = require('../../../config/db');

class VisitorRepository {
  // ─── Core CRUD ──────────────────────────────────
  async findById(id) {
    const rows = await db.query(
      `SELECT v.*, vt.type_name as visitorType, vc.company_name as companyName
       FROM visitors v
       LEFT JOIN visitor_types vt ON v.visitor_type_id = vt.id
       LEFT JOIN visitor_companies vc ON v.visitor_company_id = vc.id
       WHERE v.id = ? AND v.is_active = TRUE`,
      [id]
    );
    return rows[0] || null;
  }

  async findByUserId(userId) {
    const rows = await db.query(
      `SELECT v.*, vt.type_name as visitorType, vc.company_name as companyName
       FROM visitors v
       LEFT JOIN visitor_types vt ON v.visitor_type_id = vt.id
       LEFT JOIN visitor_companies vc ON v.visitor_company_id = vc.id
       WHERE v.user_id = ? AND v.is_active = TRUE`,
      [userId]
    );
    return rows[0] || null;
  }

  async findByEmail(email) {
    if (!email) return null;
    const clean = String(email).trim().toLowerCase();
    const rows = await db.query(
      `SELECT * FROM visitors 
       WHERE LOWER(email) = LOWER(?) 
         AND is_active = TRUE 
         AND deleted_at IS NULL 
         AND (status != 'DELETED' OR status IS NULL)`,
      [clean]
    );
    return rows[0] || null;
  }

  async checkDuplicate(email, phone, idNumber) {
    const rows = await db.query(
      `SELECT id, email, phone, id_number as idNumber, is_blacklisted as isBlacklisted 
       FROM visitors 
       WHERE (email = ? OR phone = ? OR (id_number = ? AND id_number IS NOT NULL)) 
         AND is_active = TRUE 
       LIMIT 1`,
      [email, phone, idNumber || null]
    );
    return rows[0] || null;
  }

  async create(visitorData, tx = null) {
    const dbClient = (tx && typeof tx.query === 'function') ? tx : db;
    const {
      organizationId = null,
      userId = null,
      visitorTypeId = null,
      visitorCompanyId = null,
      firstName = null,
      middleName = null,
      lastName = null,
      fullName,
      email,
      phone,
      gender = null,
      dateOfBirth = null,
      nationality = null,
      company = null,
      category = null,
      idType = null,
      idNumber = null,
      emergencyContactName = null,
      emergencyContactPhone = null,
      registrationStatus = 'PENDING',
    } = visitorData;

    const photoUrl = visitorData.photoUrl || visitorData.photo_url || visitorData.profile_photo || null;
    const referenceNum = visitorData.referenceNumber || visitorData.reference_number || null;

    // Calculate formatted visitor code prior to insert
    const maxRows = await dbClient.query('SELECT MAX(id) as maxId FROM visitors').catch(() => [{}]);
    const nextNum = ((maxRows && maxRows[0] && maxRows[0].maxId) ? maxRows[0].maxId : 0) + 1;
    const formattedCode = visitorData.visitorCode || `VISIT${String(nextNum).padStart(6, '0')}`;
    const formattedRefNum = referenceNum || `VMS-${new Date().getFullYear()}-${String(nextNum).padStart(6, '0')}`;

    // Determine initial status based on registrationStatus
    // PENDING registrations (from public signup) start INACTIVE and inactive until email is verified
    const isPending = registrationStatus === 'PENDING';
    const initialStatus = isPending ? 'INACTIVE' : 'ACTIVE';
    const initialIsActive = isPending ? 'FALSE' : 'TRUE';

    const result = await dbClient.query(
      `INSERT INTO visitors (
        visitor_code, visitor_id, reference_number, organization_id, user_id, visitor_type_id, visitor_company_id,
        first_name, middle_name, last_name, full_name, email, phone,
        gender, date_of_birth, nationality, company, category,
        photo_url, id_type, id_number, emergency_contact_name, emergency_contact_phone,
        status, registration_status, is_blacklisted, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, ${initialIsActive})`,
      [
        formattedCode,
        nextNum,
        formattedRefNum,
        organizationId,
        userId,
        visitorTypeId,
        visitorCompanyId,
        firstName,
        middleName,
        lastName,
        fullName,
        email,
        phone,
        gender,
        dateOfBirth,
        nationality,
        company,
        category,
        photoUrl,
        idType,
        idNumber,
        emergencyContactName,
        emergencyContactPhone,
        initialStatus,
        registrationStatus,
      ]
    );

    const visitorId = result.insertId;
    return visitorId;
  }

  // ─── Update Profile ─────────────────────────────
  async updateProfile(visitorId, data) {
    const mappings = {
      firstName: 'first_name',
      first_name: 'first_name',
      middleName: 'middle_name',
      middle_name: 'middle_name',
      lastName: 'last_name',
      last_name: 'last_name',
      fullName: 'full_name',
      full_name: 'full_name',
      phone: 'phone',
      gender: 'gender',
      dateOfBirth: 'date_of_birth',
      date_of_birth: 'date_of_birth',
      nationality: 'nationality',
      occupation: 'occupation',
      company: 'company',
      organization: 'company',
      departmentName: 'department_name',
      department_name: 'department_name',
      department: 'department_name',
      photoUrl: 'photo_url',
      photo_url: 'photo_url',
      avatarUrl: 'photo_url',
      profile_photo: 'photo_url',
      idType: 'id_type',
      id_type: 'id_type',
      identity_type: 'id_type',
      idNumber: 'id_number',
      id_number: 'id_number',
      identity_number: 'id_number',
      idIssueDate: 'id_issue_date',
      id_issue_date: 'id_issue_date',
      idExpiryDate: 'id_expiry_date',
      id_expiry_date: 'id_expiry_date',
      address: 'address',
      street_address: 'address',
      streetAddress: 'address',
      street: 'street',
      houseNumber: 'house_number',
      house_number: 'house_number',
      subcity: 'sub_city',
      subCity: 'sub_city',
      sub_city: 'sub_city',
      woreda: 'woreda',
      region: 'region',
      stateProvince: 'region',
      state_province: 'region',
      city: 'city',
      country: 'country',
      postalCode: 'postal_code',
      postal_code: 'postal_code',
      fullAddress: 'full_address',
      full_address: 'full_address',
      category: 'category',
      accessLevel: 'access_level',
      access_level: 'access_level',
      approvalRequirement: 'approval_requirement',
      approval_requirement: 'approval_requirement',
      visitDuration: 'visit_duration',
      visit_duration: 'visit_duration',
      altPhone: 'alt_phone',
      alt_phone: 'alt_phone',
      alternativePhone: 'alt_phone',
      alternative_phone: 'alt_phone',
      secondary_phone: 'alt_phone',
      secondaryEmergencyPhone: 'alt_phone',
      preferredContactMethod: 'preferred_contact_method',
      preferred_contact_method: 'preferred_contact_method',
      preferredContact: 'preferred_contact_method',
      emergencyContactName: 'emergency_contact_name',
      emergency_contact_name: 'emergency_contact_name',
      emergencyName: 'emergency_contact_name',
      emergencyContactPhone: 'emergency_contact_phone',
      emergency_contact_phone: 'emergency_contact_phone',
      emergencyPhone: 'emergency_contact_phone',
      emergencyRelationship: 'emergency_relationship',
      emergency_relationship: 'emergency_relationship',
      emergencyRelation: 'emergency_relationship',
      escortRequired: 'escort_required',
      escort_required: 'escort_required',
      allowedAreas: 'allowed_areas',
      allowed_areas: 'allowed_areas',
      allowedDays: 'allowed_days',
      allowed_days: 'allowed_days',
      visitPurpose: 'visit_purpose',
      visit_purpose: 'visit_purpose'
    };

    const fields = [];
    const values = [];

    for (const [key, col] of Object.entries(mappings)) {
      if (data[key] !== undefined && !fields.some(f => f.startsWith(`${col} =`))) {
        fields.push(`${col} = ?`);
        values.push(data[key]);
      }
    }

    // Sync profile photo to users and visitor_histories
    const photoToUpdate = data.photoUrl || data.photo_url || data.avatarUrl || data.profile_photo;
    if (photoToUpdate) {
      try {
        const vRows = await db.query('SELECT user_id FROM visitors WHERE id = ?', [visitorId]);
        if (vRows[0]?.user_id) {
          await db.query('UPDATE users SET profile_photo = ?, avatar_url = ? WHERE id = ?', [
            photoToUpdate,
            photoToUpdate,
            vRows[0].user_id
          ]);
        }
        await db.query('UPDATE visitor_histories SET visitor_photo = ? WHERE visitor_id = ?', [
          photoToUpdate,
          visitorId
        ]);
      } catch (syncErr) {
        console.warn('Failed to sync profile photo to user account:', syncErr.message);
      }
    }

    if (fields.length === 0) return true;
    values.push(visitorId);

    const result = await db.query(
      `UPDATE visitors SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  // ─── Emergency Contacts ─────────────────────────
  async getEmergencyContacts(visitorId) {
    return db.query(
      `SELECT * FROM visitor_emergency_contacts WHERE visitor_id = ? AND is_active = TRUE ORDER BY id DESC`,
      [visitorId]
    ).catch(() => []);
  }

  async upsertEmergencyContact(visitorId, data) {
    const { name, phone, relationship, email } = data;
    // Also update the legacy fields on the visitors table
    await db.query(
      `UPDATE visitors SET emergency_contact_name = ?, emergency_contact_phone = ? WHERE id = ?`,
      [name, phone, visitorId]
    );

    // Check if one already exists
    const existing = await db.query(
      `SELECT id FROM visitor_emergency_contacts WHERE visitor_id = ? AND is_active = TRUE LIMIT 1`,
      [visitorId]
    );

    if (existing.length > 0) {
      await db.query(
        `UPDATE visitor_emergency_contacts 
         SET contact_name = ?, contact_phone = ?, relationship = ?, contact_email = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, phone, relationship || null, email || null, existing[0].id]
      );
      return existing[0].id;
    } else {
      const result = await db.query(
        `INSERT INTO visitor_emergency_contacts (visitor_id, contact_name, contact_phone, relationship, contact_email, is_primary, is_active)
         VALUES (?, ?, ?, ?, ?, TRUE, TRUE)`,
        [visitorId, name, phone, relationship || null, email || null]
      );
      return result.insertId;
    }
  }

  // ─── Documents ──────────────────────────────────
  async getDocuments(visitorId, appointmentId = null) {
    if (!visitorId && !appointmentId) return [];

    let whereClause = `(visitor_id = ? OR appointment_id IN (SELECT id FROM appointments WHERE visitor_id = ?))`;
    let queryParams = [visitorId, visitorId];
    if (appointmentId && visitorId) {
      whereClause = `(visitor_id = ? OR appointment_id = ? OR appointment_id IN (SELECT id FROM appointments WHERE visitor_id = ?))`;
      queryParams = [visitorId, appointmentId, visitorId];
    } else if (appointmentId && !visitorId) {
      whereClause = `(appointment_id = ?)`;
      queryParams = [appointmentId];
    }

    // 1. Fetch all documents for this visitor (never filter out past versions)
    const rawDocs = await db.query(
      `SELECT id,
              visitor_id,
              appointment_id,
              COALESCE(document_name, file_name, 'Document') as document_name,
              COALESCE(document_type, category_name, document_name, 'OTHER') as document_type,
              COALESCE(document_number, document_code, CONCAT('DOC-', id)) as document_number,
              COALESCE(file_url, document_url, file_path) as file_url,
              COALESCE(file_name, original_file_name, document_name) as file_name,
              COALESCE(NULLIF(mime_type, ''), NULLIF(file_type, ''),
                CASE
                  WHEN LOWER(COALESCE(file_name, original_file_name, file_url, '')) LIKE '%.png' THEN 'image/png'
                  WHEN LOWER(COALESCE(file_name, original_file_name, file_url, '')) LIKE '%.jpg' OR LOWER(COALESCE(file_name, original_file_name, file_url, '')) LIKE '%.jpeg' THEN 'image/jpeg'
                  WHEN LOWER(COALESCE(file_name, original_file_name, file_url, '')) LIKE '%.webp' THEN 'image/webp'
                  WHEN LOWER(COALESCE(file_name, original_file_name, file_url, '')) LIKE '%.gif' THEN 'image/gif'
                  WHEN LOWER(COALESCE(file_name, original_file_name, file_url, '')) LIKE '%.docx' THEN 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                  WHEN LOWER(COALESCE(file_name, original_file_name, file_url, '')) LIKE '%.doc' THEN 'application/msword'
                  WHEN LOWER(COALESCE(file_name, original_file_name, file_url, '')) LIKE '%.txt' THEN 'text/plain'
                  ELSE 'application/pdf'
                END
              ) as mime_type,
              COALESCE(status, 'Uploaded') as status,
              COALESCE(approval_status, 'PENDING') as approval_status,
              COALESCE(verification_status, status, 'PENDING') as verification_status,
              COALESCE(is_submitted, FALSE) as is_submitted,
              submitted_at,
              verified_by, verified_at, expiry_date, issue_date,
              COALESCE(version_number, 1) as version_number,
              COALESCE(is_active, TRUE) as is_active,
              ocr_extracted_data, ocr_confidence,
              created_at, updated_at
       FROM visitor_documents
       WHERE ${whereClause} AND (is_deleted = FALSE OR is_deleted IS NULL)
       ORDER BY created_at ASC`,
      queryParams
    ).catch(() => []);

    // 2. Fetch any identity verification sessions to ensure all uploaded scans & selfies are permanently included
    let verifications = [];
    if (visitorId) {
      verifications = await db.query(
        `SELECT * FROM visitor_identity_verifications 
         WHERE visitor_id = ? OR visitor_id IN (SELECT user_id FROM visitors WHERE id = ?) 
         ORDER BY created_at ASC`,
        [visitorId, visitorId]
      ).catch(() => []);
    }

    const existingKeys = new Set(rawDocs.map(d => `${(d.document_type || '').toUpperCase()}_${d.file_url || ''}`));
    const extraDocs = [];

    verifications.forEach((v, vIndex) => {
      const vDate = v.created_at || new Date().toISOString();
      const docTypeLabel = v.doc_type || 'National ID';
      let ocr = {};
      try {
        ocr = v.ocr_data_json ? (typeof v.ocr_data_json === 'string' ? JSON.parse(v.ocr_data_json) : v.ocr_data_json) : {};
      } catch (_) {}
      const docNum = ocr?.extractedData?.idNumber || `VER-${v.id || vIndex + 1}`;

      if (v.front_image_url && !existingKeys.has(`FRONT_${v.front_image_url}`)) {
        extraDocs.push({
          id: `ver-front-${v.id || vIndex}`,
          visitor_id: visitorId,
          appointment_id: appointmentId || null,
          document_name: `${docTypeLabel} Front Scan`,
          document_type: `${docTypeLabel} (Front Scan)`,
          document_number: docNum,
          file_url: v.front_image_url,
          file_name: `${docTypeLabel.replace(/\s+/g, '_')}_Front.jpg`,
          file_size: 1024 * 350,
          mime_type: 'image/jpeg',
          status: 'SUBMITTED',
          approval_status: 'APPROVED',
          verification_status: v.final_status || 'VERIFIED',
          is_submitted: true,
          submitted_at: vDate,
          verified_by: v.verified_by,
          verified_at: v.verified_at,
          expiry_date: null,
          version_number: 1,
          is_active: true,
          ocr_data: ocr?.extractedData || null,
          confidence_score: ocr?.confidenceScore || null,
          created_at: vDate,
          updated_at: vDate
        });
        existingKeys.add(`FRONT_${v.front_image_url}`);
      }

      if (v.back_image_url && !existingKeys.has(`BACK_${v.back_image_url}`)) {
        extraDocs.push({
          id: `ver-back-${v.id || vIndex}`,
          visitor_id: visitorId,
          appointment_id: appointmentId || null,
          document_name: `${docTypeLabel} Back Scan`,
          document_type: `${docTypeLabel} (Back Scan)`,
          document_number: docNum,
          file_url: v.back_image_url,
          file_name: `${docTypeLabel.replace(/\s+/g, '_')}_Back.jpg`,
          file_size: 1024 * 320,
          mime_type: 'image/jpeg',
          status: 'SUBMITTED',
          approval_status: 'APPROVED',
          verification_status: v.final_status || 'VERIFIED',
          is_submitted: true,
          submitted_at: vDate,
          verified_by: v.verified_by,
          verified_at: v.verified_at,
          expiry_date: null,
          version_number: 1,
          is_active: true,
          ocr_data: ocr?.extractedData || null,
          confidence_score: ocr?.confidenceScore || null,
          created_at: vDate,
          updated_at: vDate
        });
        existingKeys.add(`BACK_${v.back_image_url}`);
      }

      if (v.selfie_image_url && !existingKeys.has(`SELFIE_${v.selfie_image_url}`)) {
        extraDocs.push({
          id: `ver-selfie-${v.id || vIndex}`,
          visitor_id: visitorId,
          appointment_id: appointmentId || null,
          document_name: 'Identity Verification Selfie',
          document_type: 'Identity Verification Selfie',
          document_number: `SELFIE-${v.id || vIndex + 1}`,
          file_url: v.selfie_image_url,
          file_name: 'Live_Selfie_Verification.jpg',
          file_size: 1024 * 280,
          mime_type: 'image/jpeg',
          status: 'SUBMITTED',
          approval_status: 'APPROVED',
          verification_status: v.final_status || 'VERIFIED',
          is_submitted: true,
          submitted_at: vDate,
          verified_by: v.verified_by,
          verified_at: v.verified_at,
          expiry_date: null,
          version_number: 1,
          is_active: true,
          ocr_data: ocr?.extractedData || null,
          confidence_score: ocr?.confidenceScore || null,
          created_at: vDate,
          updated_at: vDate
        });
        existingKeys.add(`SELFIE_${v.selfie_image_url}`);
      }
    });

    const allCombined = [...rawDocs, ...extraDocs];

    // Compute version sequencing per document category/type:
    // When sorted by created_at ascending, 1st = v1, 2nd = v2, etc.
    const typeCounts = {};
    const typeLatest = {};

    allCombined.forEach(doc => {
      const typeKey = (doc.document_type || 'OTHER').toUpperCase().trim();
      typeCounts[typeKey] = (typeCounts[typeKey] || 0) + 1;
      const verNum = doc.version_number && Number(doc.version_number) > 1 ? Number(doc.version_number) : typeCounts[typeKey];
      doc.version_number = verNum;
      typeLatest[typeKey] = doc.id;
    });

    // Mark is_current and version_label
    allCombined.forEach(doc => {
      const typeKey = (doc.document_type || 'OTHER').toUpperCase().trim();
      doc.is_current = doc.id === typeLatest[typeKey];
      doc.version_label = `v${doc.version_number}${doc.is_current ? ' (Current)' : ' (Past Version)'}`;
    });

    // Return newest first so UI shows latest on top, but past versions are permanently available!
    return allCombined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  async createDocument(visitorId, docData) {
    const {
      documentType, documentNumber, fileUrl, fileName, fileSize, mimeType, expiryDate,
    } = docData;

    const docCode = `DOC-${Date.now()}`;
    const cleanDocNum = (documentNumber && String(documentNumber).trim()) ? String(documentNumber).trim() : `DOC-NUM-${Date.now().toString().slice(-6)}`;
    const cleanUrl = fileUrl || `/uploads/documents/doc-${Date.now()}.pdf`;
    const cleanName = fileName || 'document.pdf';
    const cleanSize = Number(fileSize) || 1024;
    const cleanMime = mimeType || (cleanName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
    const docType = documentType || 'OTHER';

    // Calculate next version number for this visitor and document type
    const [verRow] = await db.query(
      `SELECT COALESCE(MAX(version_number), 0) AS max_ver 
       FROM visitor_documents 
       WHERE visitor_id = ? AND (document_type = ? OR category_name = ?)`,
      [visitorId, docType, docType]
    ).catch(() => [{ max_ver: 0 }]);
    const nextVer = Number(verRow?.max_ver || 0) + 1;

    const result = await db.query(
      `INSERT INTO visitor_documents (
        visitor_id, document_code, ref_number, document_type, category_name, document_name,
        document_number, file_url, document_url, file_path, file_name, original_file_name,
        file_size, file_size_bytes, mime_type, file_type, expiry_date,
        verification_status, status, approval_status, version_number, is_active, is_deleted
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'Uploaded', 'PENDING', ?, TRUE, FALSE)`,
      [
        visitorId,
        docCode,
        `REF-${docCode}`,
        docType,
        docType,
        cleanName.replace(/\.[^/.]+$/, ''),
        cleanDocNum,
        cleanUrl,
        cleanUrl,
        cleanUrl,
        cleanName,
        cleanName,
        cleanSize,
        cleanSize,
        cleanMime,
        cleanMime,
        expiryDate || null,
        nextVer
      ]
    );
    return result.insertId || result.id || Date.now();
  }

  async deleteDocument(docId, visitorId, isStaffOrAdmin = false) {
    if (String(docId).startsWith('ver-front-') || String(docId).startsWith('ver-back-') || String(docId).startsWith('ver-selfie-')) {
      if (!isStaffOrAdmin) {
        const err = new Error('Cannot delete document: Identity verification scans are permanently archived and cannot be deleted.');
        err.statusCode = 403;
        throw err;
      }
      if (String(docId).startsWith('ver-front-')) {
        const vId = String(docId).replace('ver-front-', '');
        await db.query(`UPDATE visitor_identity_verifications SET front_image_url = NULL WHERE id = ? AND visitor_id = ?`, [vId, visitorId]).catch(() => {});
        return true;
      }
      if (String(docId).startsWith('ver-back-')) {
        const vId = String(docId).replace('ver-back-', '');
        await db.query(`UPDATE visitor_identity_verifications SET back_image_url = NULL WHERE id = ? AND visitor_id = ?`, [vId, visitorId]).catch(() => {});
        return true;
      }
      if (String(docId).startsWith('ver-selfie-')) {
        const vId = String(docId).replace('ver-selfie-', '');
        await db.query(`UPDATE visitor_identity_verifications SET selfie_image_url = NULL WHERE id = ? AND visitor_id = ?`, [vId, visitorId]).catch(() => {});
        return true;
      }
    }

    // Check if document has already been submitted to host employee
    const docRows = await db.query(
      `SELECT id, is_submitted, status FROM visitor_documents WHERE id = ? AND visitor_id = ?`,
      [docId, visitorId]
    ).catch(() => []);

    if (!docRows || docRows.length === 0) {
      return true;
    }

    const doc = docRows[0];
    const isSubmitted = Boolean(doc.is_submitted && doc.is_submitted !== '0' && doc.is_submitted !== 0);
    if (!isStaffOrAdmin && (isSubmitted || doc.status === 'SUBMITTED' || doc.status === 'VERIFIED' || doc.status === 'APPROVED')) {
      const err = new Error('Cannot delete document: This document has already been submitted to your host employee and is permanently stored in the compliance archive.');
      err.statusCode = 403;
      throw err;
    }

    const result = await db.query(
      `UPDATE visitor_documents SET is_deleted = TRUE, is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND visitor_id = ?`,
      [docId, visitorId]
    );
    return result.affectedRows > 0;
  }

  // ─── Submit All Documents to Host Employee ───────
  async submitDocumentsToHost(visitorId, appointmentId = null) {
    // 1. Mark all active documents for this visitor as submitted
    const updateResult = await db.query(
      `UPDATE visitor_documents 
       SET is_submitted = TRUE,
           submitted_at = COALESCE(submitted_at, CURRENT_TIMESTAMP),
           status = 'SUBMITTED',
           approval_status = 'Pending Review',
           verification_status = 'PENDING',
           updated_at = CURRENT_TIMESTAMP
       WHERE (visitor_id = ? ${appointmentId ? 'OR appointment_id = ?' : ''})
         AND (is_deleted = FALSE OR is_deleted IS NULL)`,
      appointmentId ? [visitorId, appointmentId] : [visitorId]
    );

    // 2. Also look for any associated pending or active appointment
    let appt = null;
    if (appointmentId) {
      const rows = await db.query(
        `SELECT id, host_id, host_employee_id, host_user_id, reference_code, appointment_number, status 
         FROM appointments WHERE id = ? AND (visitor_id = ? OR visitor_user_id = (SELECT user_id FROM visitors WHERE id = ?))`,
        [appointmentId, visitorId, visitorId]
      ).catch(() => []);
      if (rows && rows.length > 0) appt = rows[0];
    } 
    
    if (!appt) {
      const rows = await db.query(
        `SELECT id, host_id, host_employee_id, host_user_id, reference_code, appointment_number, status 
         FROM appointments 
         WHERE (visitor_id = ? OR visitor_user_id = (SELECT user_id FROM visitors WHERE id = ?))
           AND status NOT IN ('CANCELLED', 'REJECTED')
         ORDER BY scheduled_start DESC, created_at DESC LIMIT 1`,
        [visitorId, visitorId]
      ).catch(() => []);
      if (rows && rows.length > 0) appt = rows[0];
    }

    // Link unlinked documents to this appointment
    if (appt?.id) {
      await db.query(
        `UPDATE visitor_documents 
         SET appointment_id = ? 
         WHERE visitor_id = ? AND appointment_id IS NULL`,
        [appt.id, visitorId]
      ).catch(() => {});
    }

    // 3. Return full list of documents with updated status
    const documents = await this.getDocuments(visitorId, appt?.id);
    return {
      affectedDocuments: updateResult.affectedRows || 0,
      appointment: appt || null,
      documents
    };
  }

  async updateDocument(docId, visitorId, updateData) {
    const { documentType, documentNumber, expiryDate, fileUrl, fileName, fileSize, mimeType } = updateData;

    // If a new file is uploaded, preserve the old document row as a past version and create a new version row!
    if (fileUrl) {
      const [oldDoc] = await db.query(
        `SELECT * FROM visitor_documents WHERE id = ? AND visitor_id = ?`,
        [docId, visitorId]
      ).catch(() => []);

      const docType = documentType || (oldDoc ? oldDoc.document_type : 'OTHER');
      const docNum = documentNumber || (oldDoc ? oldDoc.document_number : `DOC-${Date.now()}`);

      return this.createDocument(visitorId, {
        documentType: docType,
        documentNumber: docNum,
        fileUrl,
        fileName: fileName || (oldDoc ? oldDoc.file_name : 'document.pdf'),
        fileSize: fileSize || (oldDoc ? oldDoc.file_size : 1024),
        mimeType: mimeType || (oldDoc ? oldDoc.mime_type : 'application/pdf'),
        expiryDate: expiryDate !== undefined ? expiryDate : (oldDoc ? oldDoc.expiry_date : null)
      });
    }

    // Otherwise, it's a metadata update (e.g. documentNumber or expiryDate)
    const fields = [];
    const values = [];

    if (documentType !== undefined) { fields.push('document_type = ?'); values.push(documentType); }
    if (documentNumber !== undefined) { fields.push('document_number = ?'); values.push(documentNumber || null); }
    if (expiryDate !== undefined) { fields.push('expiry_date = ?'); values.push(expiryDate || null); }

    if (fields.length === 0) return true;

    values.push(docId, visitorId);
    const result = await db.query(
      `UPDATE visitor_documents SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND visitor_id = ?`,
      values
    );
    return result.affectedRows > 0;
  }


  // ─── Visitor Passes ─────────────────────────────
  async getPasses(visitorId) {
    return db.query(
      `SELECT vp.*,
              COALESCE(vp.status, a.status, a.approval_status, 'PENDING') as status,
              a.status as appointment_status,
              a.approval_status as appointment_approval_status,
              a.expected_duration_minutes,
              c.checkin_time,
              vco.checkout_time,
              v.full_name as visitor_name, v.full_name as visitorName,
              v.email as visitor_email, v.phone as visitor_phone,
              COALESCE(v.photo_url, u_vis.profile_photo, u_vis.avatar_url) as photo_url,
              COALESCE(v.photo_url, u_vis.profile_photo, u_vis.avatar_url) as profile_photo,
              COALESCE(v.photo_url, u_vis.profile_photo, u_vis.avatar_url) as visitor_photo,
              v.visitor_code as visitor_code, v.visitor_code as visitorCode,
              COALESCE(v.reference_number, a.reference_code) as reference_number,
              v.category as visitor_category, v.company as visitor_company,
              a.reference_code, a.scheduled_start, a.scheduled_end,
              u.full_name as host_name, d.name as department_name, r.room_name,
              COALESCE(r.building, 'Main Building') as building_name
       FROM visitor_passes vp
       LEFT JOIN visitors v ON vp.visitor_id = v.id
       LEFT JOIN users u_vis ON v.user_id = u_vis.id
       LEFT JOIN appointments a ON vp.appointment_id = a.id
       LEFT JOIN (
          SELECT appointment_id, MAX(COALESCE(checked_in_at, entry_time)) as checkin_time, MAX(id) as max_id
          FROM checkins
          GROUP BY appointment_id
       ) c ON c.appointment_id = a.id
       LEFT JOIN visitor_checkouts vco ON vco.checkin_id = c.max_id
       LEFT JOIN users u ON a.host_id = u.id
       LEFT JOIN departments d ON a.department_id = d.id
       LEFT JOIN meeting_rooms r ON a.room_id = r.id
       WHERE vp.visitor_id = ?
       ORDER BY vp.created_at DESC`,
      [visitorId]
    );
  }

  async getPassById(passId, visitorId) {
    const rows = await db.query(
      `SELECT vp.*,
              COALESCE(vp.status, a.status, a.approval_status, 'PENDING') as status,
              a.status as appointment_status,
              a.approval_status as appointment_approval_status,
              a.expected_duration_minutes,
              c.checkin_time,
              vco.checkout_time,
              v.full_name as visitor_name, v.full_name as visitorName,
              v.email as visitor_email, v.phone as visitor_phone,
              COALESCE(v.photo_url, u_vis.profile_photo, u_vis.avatar_url) as photo_url,
              COALESCE(v.photo_url, u_vis.profile_photo, u_vis.avatar_url) as profile_photo,
              COALESCE(v.photo_url, u_vis.profile_photo, u_vis.avatar_url) as visitor_photo,
              v.visitor_code as visitor_code, v.visitor_code as visitorCode,
              COALESCE(v.reference_number, a.reference_code) as reference_number,
              v.category as visitor_category, v.company as visitor_company,
              a.reference_code, a.scheduled_start, a.scheduled_end,
              u.full_name as host_name, d.name as department_name, r.room_name,
              COALESCE(r.building, 'Main Building') as building_name
       FROM visitor_passes vp
       LEFT JOIN visitors v ON vp.visitor_id = v.id
       LEFT JOIN users u_vis ON v.user_id = u_vis.id
       LEFT JOIN appointments a ON vp.appointment_id = a.id
       LEFT JOIN (
          SELECT appointment_id, MAX(COALESCE(checked_in_at, entry_time)) as checkin_time, MAX(id) as max_id
          FROM checkins
          GROUP BY appointment_id
       ) c ON c.appointment_id = a.id
       LEFT JOIN visitor_checkouts vco ON vco.checkin_id = c.max_id
       LEFT JOIN users u ON a.host_id = u.id
       LEFT JOIN departments d ON a.department_id = d.id
       LEFT JOIN meeting_rooms r ON a.room_id = r.id
       WHERE vp.id = ? AND vp.visitor_id = ?`,
      [passId, visitorId]
    );
    return rows[0] || null;
  }

  // ─── Visit History ──────────────────────────────
  async findHistory(visitorId, filters = {}) {
    let apptSql = `SELECT a.id as appointmentId, a.reference_code as referenceCode,
                      a.scheduled_start as scheduledStart, a.scheduled_end as scheduledEnd,
                      a.appointment_status as appointmentStatus,
                      a.approval_status as approvalStatus,
                      a.status as status,
                      a.purpose,
                      a.expected_duration_minutes as expectedDurationMinutes,
                      u.full_name as hostName, d.name as departmentName,
                      r.room_name as roomName,
                      COALESCE(c.entry_time, c.checked_in_at) as entryTime, COALESCE(co.exit_time, co.checkout_time) as exitTime,
                      COALESCE(
                        TIMESTAMPDIFF(MINUTE, COALESCE(c.entry_time, c.checked_in_at), COALESCE(co.exit_time, co.checkout_time)),
                        a.expected_duration_minutes,
                        a.duration_minutes,
                        TIMESTAMPDIFF(MINUTE, a.scheduled_start, a.scheduled_end),
                        60
                      ) as durationMinutes,
                      v.full_name as visitor_name, v.email as visitor_email, v.phone as visitor_phone,
                      v.id_type as identity_type, v.id_number as identity_number,
                      COALESCE(v.photo_url, u_vis.profile_photo, u_vis.avatar_url) as photo_url,
                      COALESCE(v.photo_url, u_vis.profile_photo, u_vis.avatar_url) as photoUrl,
                      COALESCE(v.photo_url, u_vis.profile_photo, u_vis.avatar_url) as visitor_photo,
                      vt.type_name as visitor_category,
                      vc.company_name as visitor_company
               FROM appointments a
               LEFT JOIN visitors v ON a.visitor_id = v.id
               LEFT JOIN users u_vis ON v.user_id = u_vis.id
               LEFT JOIN visitor_types vt ON v.visitor_type_id = vt.id
               LEFT JOIN visitor_companies vc ON v.visitor_company_id = vc.id
               LEFT JOIN users u ON a.host_id = u.id
               LEFT JOIN departments d ON a.department_id = d.id
               LEFT JOIN meeting_rooms r ON a.room_id = r.id
               LEFT JOIN checkins c ON c.appointment_id = a.id
               LEFT JOIN visitor_checkouts co ON (co.appointment_id = a.id OR co.checkin_id = c.id)
               WHERE (a.visitor_id = ? OR a.visitor_user_id = ? OR v.user_id = ?) AND a.deleted_at IS NULL`;
    const apptRows = await db.query(apptSql, [visitorId, visitorId, visitorId]).catch(() => []);

    let vhSql = `SELECT vh.id, vh.history_code as historyCode, vh.reference_number as referenceNumber,
                        vh.visitor_name, vh.visitor_email, vh.visitor_phone, vh.visitor_company, vh.visitor_category,
                        vh.host_employee_name as hostName, vh.department_name as departmentName,
                        vh.appointment_number as appointmentNumber, vh.visit_purpose as purpose,
                        vh.checkin_time as entryTime, vh.checkout_time as exitTime,
                        vh.visit_duration_minutes as durationMinutes, vh.pass_number as passNumber,
                        vh.visit_status as status, vh.identity_type, vh.identity_number, vh.verification_status as verificationStatus,
                        vh.completed_date as scheduledStart,
                        COALESCE(vh.visitor_photo, v.photo_url, u.profile_photo, u.avatar_url) as photo_url,
                        COALESCE(vh.visitor_photo, v.photo_url, u.profile_photo, u.avatar_url) as photoUrl,
                        COALESCE(vh.visitor_photo, v.photo_url, u.profile_photo, u.avatar_url) as visitor_photo
                 FROM visitor_histories vh
                 LEFT JOIN visitors v ON vh.visitor_id = v.id
                 LEFT JOIN users u ON v.user_id = u.id
                 WHERE vh.visitor_id = ? AND (vh.is_deleted = FALSE OR vh.is_deleted IS NULL)`;
    let vhRows = [];
    try {
      vhRows = await db.query(vhSql, [visitorId]);
    } catch (e) {
      // Table visitor_histories may be empty or missing columns
    }

    let combined = [];

    // When an appointment request exists and history record exists, update the single history record
    if (apptRows.length > 0 && vhRows.length > 0) {
      const latestAppt = apptRows[apptRows.length - 1];

      // Calculate real visit duration from check-in & check-out if available, otherwise appointment requested duration
      let calcDuration = null;
      const tIn = vhRows[0].entryTime || latestAppt.entryTime || vhRows[0].checkin_time;
      const tOut = vhRows[0].exitTime || latestAppt.exitTime || vhRows[0].checkout_time;
      if (tIn && tOut && tIn !== '-' && tOut !== '-' && String(tIn).trim() !== String(tOut).trim()) {
        const d1 = new Date(tIn);
        const d2 = new Date(tOut);
        if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 >= d1) {
          calcDuration = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 60000));
        }
      }
      if (!calcDuration && tIn && (!tOut || tOut === '-')) {
        const d1 = new Date(tIn);
        if (!isNaN(d1.getTime())) {
          calcDuration = Math.max(1, Math.round((Date.now() - d1.getTime()) / 60000));
        }
      }
      if (!calcDuration) {
        calcDuration = latestAppt.expectedDurationMinutes || latestAppt.expected_duration_minutes;
        if (!calcDuration && latestAppt.scheduledStart && latestAppt.scheduledEnd) {
          const s1 = new Date(latestAppt.scheduledStart);
          const s2 = new Date(latestAppt.scheduledEnd);
          if (!isNaN(s1.getTime()) && !isNaN(s2.getTime()) && s2 >= s1) {
            calcDuration = Math.max(15, Math.round((s2.getTime() - s1.getTime()) / 60000));
          }
        }
        if (!calcDuration) calcDuration = latestAppt.durationMinutes || 60;
      }

      // Determine accurate synced status from appointment
      const rawApptStat = (latestAppt.appointmentStatus || latestAppt.approvalStatus || latestAppt.status || 'PENDING').toString().toUpperCase();
      let syncStatus = 'PENDING';
      if (rawApptStat.includes('CANCEL')) {
        syncStatus = 'CANCELLED';
      } else if (rawApptStat.includes('RESCHED')) {
        syncStatus = 'RESCHEDULED';
      } else if (rawApptStat.includes('REJECT') || rawApptStat.includes('DECLIN')) {
        syncStatus = 'REJECTED';
      } else if (rawApptStat.includes('CHECKED_OUT') || rawApptStat === 'COMPLETED' || (tOut && tOut !== '-')) {
        syncStatus = 'COMPLETED';
      } else if (rawApptStat.includes('CHECKED_IN') || (tIn && (!tOut || tOut === '-'))) {
        syncStatus = 'CHECKED_IN';
      } else if (rawApptStat.includes('APPROV') || rawApptStat.includes('CONFIRM')) {
        syncStatus = 'APPROVED';
      } else {
        syncStatus = 'PENDING';
      }

      try {
        await db.query(`
          UPDATE visitor_histories SET
            reference_number = ?,
            appointment_number = ?,
            host_employee_name = ?,
            department_name = ?,
            visit_purpose = ?,
            visit_duration_minutes = ?,
            visit_status = ?,
            completed_date = ?
          WHERE id = ?
        `, [
          latestAppt.referenceCode || vhRows[0].referenceNumber,
          latestAppt.referenceCode || vhRows[0].appointmentNumber,
          latestAppt.hostName || vhRows[0].hostName,
          latestAppt.departmentName || vhRows[0].departmentName,
          latestAppt.purpose || vhRows[0].purpose,
          calcDuration,
          syncStatus,
          latestAppt.scheduledStart || null,
          vhRows[0].id
        ]);

        vhRows[0].referenceNumber = latestAppt.referenceCode || vhRows[0].referenceNumber;
        vhRows[0].appointmentNumber = latestAppt.referenceCode || vhRows[0].appointmentNumber;
        vhRows[0].hostName = latestAppt.hostName || vhRows[0].hostName;
        vhRows[0].departmentName = latestAppt.departmentName || vhRows[0].departmentName;
        vhRows[0].purpose = latestAppt.purpose || vhRows[0].purpose;
        vhRows[0].durationMinutes = calcDuration;
        vhRows[0].status = syncStatus;
        vhRows[0].scheduledStart = latestAppt.scheduledStart || vhRows[0].scheduledStart;
        vhRows[0].photo_url = vhRows[0].photo_url || latestAppt.photo_url;
        vhRows[0].photoUrl = vhRows[0].photoUrl || latestAppt.photoUrl || vhRows[0].photo_url;
        vhRows[0].visitor_photo = vhRows[0].visitor_photo || latestAppt.visitor_photo || vhRows[0].photo_url;
      } catch (syncErr) {
        console.warn('Failed to sync appointment into visitor_histories:', syncErr.message);
      }

      // Return ONLY the single unified history record
      combined = [vhRows[0]];
    } else if (vhRows.length > 0) {
      combined = vhRows;
    } else if (apptRows.length > 0) {
      combined = apptRows;
    }

    // If 0 history records found, auto-generate initial registration history record for this visitor profile
    if (combined.length === 0 && visitorId) {
      try {
        const visitors = await db.query('SELECT * FROM visitors WHERE id = ?', [visitorId]);
        const visitor = visitors[0];
        if (visitor) {
          const nowStr = new Date().toISOString();
          const historyCode = `HIS-2026-${String(visitor.id).padStart(6, '0')}`;
          const refNum = `REF-${Math.random().toString(36).substring(2, 6).toUpperCase()}-2026-${Math.floor(1000 + Math.random() * 9000)}`;
          const visitorCode = visitor.visitor_id || visitor.visitor_code || `VISIT${String(visitor.id).padStart(6, '0')}`;

          // Direct push to mockDb for mock mode, SQL INSERT for real MySQL
          const historyRecord = {
            history_code: historyCode,
            organization_id: 1,
            visitor_id: visitor.id,
            reference_number: refNum,
            visitor_name: visitor.full_name || 'Visitor',
            visitor_email: visitor.email || '',
            visitor_phone: visitor.phone || '',
            visitor_company: visitor.company || '',
            visitor_category: visitor.category || 'Visitor',
            host_employee_name: visitor.host_employee_name || '—',
            department_name: visitor.department_name || '—',
            appointment_number: visitorCode,
            visit_purpose: visitor.visit_purpose || visitor.purpose_of_visit || 'Initial Visitor Registration',
            meeting_location: visitor.location || '—',
            checkin_time: nowStr,
            checkout_time: null,
            visit_duration_minutes: 0,
            pass_number: `VP-2026-${String(visitor.id).padStart(4, '0')}`,
            visit_status: 'Pending',
            identity_type: visitor.id_type || '—',
            identity_number: visitor.id_number || '—',
            verification_status: 'Pending Verification',
            completed_date: null,
            is_deleted: false,
            created_at: nowStr,
            updated_at: nowStr
          };

          // Try direct mockDb push for in-memory mock mode, SQL INSERT for real MySQL
          if (db.getUseMock && db.getUseMock()) {
            historyRecord.id = (db.mockDb.visitor_histories || []).length + 1;
            if (!db.mockDb.visitor_histories) db.mockDb.visitor_histories = [];
            db.mockDb.visitor_histories.push(historyRecord);
          } else {
            // Real MySQL INSERT
            const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
            await db.query(`
              INSERT INTO visitor_histories (
                history_code, organization_id, visitor_id, reference_number,
                visitor_name, visitor_email, visitor_phone, visitor_company, visitor_category,
                host_employee_name, department_name, appointment_number, visit_purpose,
                meeting_location, checkin_time, checkout_time, visit_duration_minutes,
                pass_number, visit_status, identity_type, identity_number, verification_status, completed_date
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              historyCode,
              1,
              visitor.id,
              refNum,
              visitor.full_name || 'Visitor',
              visitor.email || '',
              visitor.phone || '',
              visitor.company || '',
              visitor.category || 'Visitor',
              visitor.host_employee_name || '—',
              visitor.department_name || '—',
              visitorCode,
              visitor.visit_purpose || visitor.purpose_of_visit || 'Initial Visitor Registration',
              visitor.location || '—',
              nowStr,
              null,
              0,
              `VP-2026-${String(visitor.id).padStart(4, '0')}`,
              'Pending',
              visitor.id_type || '—',
              visitor.id_number || '—',
              'Pending Verification',
              null
            ]);
          }

          // Re-query to get the inserted record
          vhRows = await db.query(vhSql, [visitorId]);
          combined = vhRows;
        }
      } catch (autoErr) {
        console.error('Auto-creating registration history failed:', autoErr);
      }
    }

    return combined;
  }

  // ─── Dashboard Stats ───────────────────────────
  async getDashboardStats(visitorId) {
    const rows = await db.query(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN appointment_status IN ('REQUESTED') AND status = 'pending_approval' THEN 1 ELSE 0 END) as pending,
         SUM(CASE WHEN appointment_status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
         SUM(CASE WHEN appointment_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
         SUM(CASE WHEN is_cancelled = TRUE THEN 1 ELSE 0 END) as cancelled,
         SUM(CASE WHEN appointment_status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
         SUM(CASE WHEN appointment_status = 'CHECKED_IN' THEN 1 ELSE 0 END) as checkedIn,
         SUM(CASE WHEN scheduled_start > NOW() AND appointment_status IN ('APPROVED', 'REQUESTED') AND is_cancelled = FALSE THEN 1 ELSE 0 END) as upcoming
       FROM appointments
       WHERE visitor_id = ? AND deleted_at IS NULL`,
      [visitorId]
    );
    return rows[0] || {};
  }

  async getRecentActivity(visitorId, limit = 10) {
    return db.query(
      `SELECT a.id, a.reference_code, a.appointment_status as status, a.scheduled_start,
              u.full_name as host_name, d.name as department_name, a.updated_at
       FROM appointments a
       LEFT JOIN users u ON a.host_id = u.id
       LEFT JOIN departments d ON a.department_id = d.id
       WHERE a.visitor_id = ? AND a.deleted_at IS NULL
       ORDER BY a.updated_at DESC
       LIMIT ?`,
      [visitorId, limit]
    );
  }

  // ─── Feedback ───────────────────────────────────
  async submitFeedback(data) {
    const {
      visitorId, appointmentId, checkinId,
      receptionRating, securityRating, hostRating, overallRating,
      suggestions, complaints,
    } = data;

    const result = await db.query(
      `INSERT INTO checkout_feedbacks (
        visitor_id, checkin_id, overall_rating, reception_rating,
        security_rating, host_rating, comments, suggestions, complaints
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        visitorId,
        checkinId || null,
        overallRating || 0,
        receptionRating || 0,
        securityRating || 0,
        hostRating || 0,
        suggestions || null,
        suggestions || null,
        complaints || null,
      ]
    );
    return result.insertId;
  }

  async getFeedbackHistory(visitorId) {
    return db.query(
      `SELECT cf.*, a.reference_code, a.scheduled_start, u.full_name as host_name
       FROM checkout_feedbacks cf
       LEFT JOIN checkins c ON cf.checkin_id = c.id
       LEFT JOIN appointments a ON c.appointment_id = a.id
       LEFT JOIN users u ON a.host_id = u.id
       WHERE (cf.visitor_id = ? OR c.visitor_id = ?)
       ORDER BY cf.created_at DESC`,
      [visitorId, visitorId]
    );
  }

  // ─── Notifications ─────────────────────────────
  async getNotifications(userId, visitorEmail, filters = {}) {
    let sql = `SELECT * FROM notifications WHERE (user_id = ? OR visitor_email = ?) `;
    const params = [userId, visitorEmail];

    if (filters.type) {
      sql += ` AND type = ?`;
      params.push(filters.type);
    }

    sql += ` ORDER BY sent_at DESC, created_at DESC`;

    if (filters.limit) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(filters.limit), parseInt(filters.offset || 0));
    }

    return db.query(sql, params);
  }

  async markNotificationRead(notifId, userId) {
    return db.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
      [notifId, userId]
    );
  }

  async markAllNotificationsRead(userId, visitorEmail) {
    return db.query(
      `UPDATE notifications SET is_read = TRUE WHERE (user_id = ? OR visitor_email = ?) AND is_read = FALSE`,
      [userId, visitorEmail]
    );
  }

  // ─── Preferences/Settings ──────────────────────
  async getPreferences(visitorId) {
    const rows = await db.query(
      `SELECT * FROM visitor_preferences WHERE visitor_id = ? LIMIT 1`,
      [visitorId]
    );
    if (!rows || !rows[0]) {
      return {
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        preferred_language: 'en',
        notification_preference: 'EMAIL',
        parking_required: 0,
        wheelchair_assistance: 0,
      };
    }
    const row = rows[0];
    return {
      ...row,
      email_notifications: row.notification_preference === 'EMAIL',
      sms_notifications: row.notification_preference === 'SMS',
      push_notifications: row.notification_preference === 'IN_APP' || row.notification_preference === 'EMAIL',
    };
  }

  async upsertPreferences(visitorId, data) {
    const existing = await this.getPreferences(visitorId);
    let notifPref = data.notificationPreference || data.notification_preference;
    if (!notifPref) {
      if (data.emailNotifications !== undefined ? data.emailNotifications : data.email_notifications) {
        notifPref = 'EMAIL';
      } else if (data.smsNotifications !== undefined ? data.smsNotifications : data.sms_notifications) {
        notifPref = 'SMS';
      } else if (data.pushNotifications !== undefined ? data.pushNotifications : data.push_notifications) {
        notifPref = 'IN_APP';
      } else {
        notifPref = existing?.notification_preference || 'EMAIL';
      }
    }
    const lang = data.preferredLanguage || data.preferred_language || existing?.preferred_language || 'en';
    const parking = data.parkingRequired !== undefined ? (data.parkingRequired ? 1 : 0) : (existing?.parking_required || 0);
    const wheelchair = data.wheelchairAssistance !== undefined ? (data.wheelchairAssistance ? 1 : 0) : (existing?.wheelchair_assistance || 0);
    const meal = data.mealPreference || data.meal_preference || existing?.meal_preference || null;

    if (existing && existing.id) {
      await db.query(
        `UPDATE visitor_preferences SET 
         notification_preference = ?, preferred_language = ?, parking_required = ?,
         wheelchair_assistance = ?, meal_preference = ?, updated_at = CURRENT_TIMESTAMP
         WHERE visitor_id = ?`,
        [notifPref, lang, parking, wheelchair, meal, visitorId]
      );
    } else {
      await db.query(
        `INSERT INTO visitor_preferences (visitor_id, notification_preference, preferred_language, parking_required, wheelchair_assistance, meal_preference)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           notification_preference = VALUES(notification_preference),
           preferred_language = VALUES(preferred_language),
           parking_required = VALUES(parking_required),
           wheelchair_assistance = VALUES(wheelchair_assistance),
           meal_preference = VALUES(meal_preference),
           updated_at = CURRENT_TIMESTAMP`,
        [visitorId, notifPref, lang, parking, wheelchair, meal]
      );
    }
    return {
      visitorId,
      notification_preference: notifPref,
      preferred_language: lang,
      email_notifications: notifPref === 'EMAIL',
      sms_notifications: notifPref === 'SMS',
      push_notifications: notifPref === 'IN_APP' || notifPref === 'EMAIL',
      parking_required: parking,
      wheelchair_assistance: wheelchair,
      meal_preference: meal,
    };
  }

  // ─── Blacklist ──────────────────────────────────
  async isBlacklisted(visitorId) {
    const rows = await db.query(
      `SELECT is_blacklisted FROM visitors WHERE id = ?`,
      [visitorId]
    );
    return rows[0] ? Boolean(rows[0].is_blacklisted) : false;
  }

  async addToBlacklist(visitorId, reason, blockedBy) {
    return db.transaction(async (tx) => {
      await tx.execute(
        `UPDATE visitors SET is_blacklisted = TRUE, status = 'BLOCKED' WHERE id = ?`,
        [visitorId]
      );
      await tx.execute(
        `INSERT INTO visitor_blacklist (visitor_id, reason, blocked_by) VALUES (?, ?, ?)`,
        [visitorId, reason, blockedBy]
      );
    });
  }

  async findAll(filters = {}) {
    let sql = `SELECT v.*, vt.type_name as visitorType, vc.company_name as companyName 
               FROM visitors v
               LEFT JOIN visitor_types vt ON v.visitor_type_id = vt.id
               LEFT JOIN visitor_companies vc ON v.visitor_company_id = vc.id
               WHERE v.is_active = TRUE`;
    const params = [];

    if (filters.search) {
      const cleanSearch = String(filters.search).trim();
      const numSearch = parseInt(cleanSearch.replace(/^#/, ''), 10);
      const validNum = !isNaN(numSearch) ? numSearch : -1;
      const searchWildcard = `%${cleanSearch}%`;

      sql += ` AND (v.full_name LIKE ? OR v.email LIKE ? OR v.phone LIKE ? OR v.company LIKE ? OR v.visitor_code LIKE ? OR v.id_number LIKE ? OR v.id = ?)`;
      params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard, validNum);
    }

    if (filters.status) {
      sql += ` AND v.status = ?`;
      params.push(filters.status);
    }

    if (filters.isBlacklisted !== undefined) {
      sql += ` AND v.is_blacklisted = ?`;
      params.push(filters.isBlacklisted ? 1 : 0);
    }

    sql += ` ORDER BY v.created_at DESC`;

    if (filters.limit) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(filters.limit), parseInt(filters.offset || 0));
    }

    return db.query(sql, params);
  }
}

module.exports = new VisitorRepository();
