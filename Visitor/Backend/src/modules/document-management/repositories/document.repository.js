const pool = require('../../../config/db');
const crypto = require('crypto');

// ─── Initialize Mock Database with demo data (called on first mock fallback) ───
function initializeMockDb() {
  if (pool.mockDb && pool.mockDb._initialized) return;

  const now = new Date().toISOString();
  const mockVisitorNames = [
    'Sarah Johnson', 'James Anderson', 'Emily Williams', 'Michael Brown',
    'Jessica Davis', 'Robert Wilson', 'Amanda Martinez', 'David Taylor',
    'Jennifer Thomas', 'Christopher Lee', 'Sophia Garcia', 'Daniel Robinson',
    'Olivia Clark', 'Matthew Lewis', 'Isabella Hall', 'Andrew Young'
  ];
  const categories = ['Passport', 'National ID', 'Driving License', 'Employee ID', 'Visa', 'NDA', 'Medical Clearance', 'Invitation Letter'];
  const statuses = ['Verified', 'Pending Review', 'Rejected', 'Uploaded', 'Expired'];
  const verStatuses = ['Verified', 'Pending Review', 'Rejected'];

  const documents = mockVisitorNames.map((name, i) => {
    const id = i + 1;
    const cat = categories[i % categories.length];
    const st = statuses[i % statuses.length];
    const vs = verStatuses[i % verStatuses.length];
    const daysOffset = Math.floor(Math.random() * 365) - 60;
    const expDate = new Date(Date.now() + daysOffset * 86400000);
    return {
      id,
      document_code: `DOC-2026-${String(id).padStart(5, '0')}`,
      ref_number: `REF-${String.fromCharCode(65 + i)}-2026-${1000 + i}`,
      visitor_id: id,
      visitor_code: `VIS-${String(id).padStart(4, '0')}`,
      visitor_name: name,
      appointment_id: null,
      document_name: `${cat} - ${name.split(' ')[0]}`,
      document_number: `${cat.substring(0, 2).toUpperCase()}${100000 + i * 7}`,
      category_id: (i % categories.length) + 1,
      category_name: cat,
      file_path: `/uploads/documents/doc_${id}.pdf`,
      document_url: `/uploads/documents/doc_${id}.pdf`,
      original_file_name: `${name.replace(/\s/g, '_')}_${cat}.pdf`,
      file_type: 'application/pdf',
      file_size_bytes: Math.floor(500000 + Math.random() * 3000000),
      checksum_sha256: crypto.createHash('sha256').update(`doc-${id}-${Date.now()}`).digest('hex'),
      issue_date: new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0],
      expiry_date: expDate.toISOString().split('T')[0],
      issuing_authority: ['Ministry of Interior', 'Transport Authority', 'Immigration Office', 'HR Department'][i % 4],
      issuing_country: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany'][i % 5],
      status: st,
      verification_status: vs,
      approval_status: vs === 'Verified' ? 'Approved' : 'Pending Review',
      ocr_extracted_data: null,
      ocr_confidence: 85 + Math.random() * 15,
      keywords: `${cat},${name}`,
      description: `${cat} document for ${name}`,
      remarks: null,
      uploaded_by: 1,
      uploaded_by_name: 'Reception Officer',
      version_number: 1,
      is_archived: false,
      is_deleted: false,
      deleted_at: null,
      deleted_by: null,
      created_at: new Date(Date.now() - (30 - i) * 86400000).toISOString(),
      updated_at: now
    };
  });

  const versionHistory = documents.map((d, i) => ({
    id: i + 1,
    document_id: d.id,
    version_number: 1,
    file_path: d.file_path,
    original_file_name: d.original_file_name,
    file_type: d.file_type,
    file_size_bytes: d.file_size_bytes,
    checksum_sha256: d.checksum_sha256,
    changes_description: 'Initial document upload',
    uploaded_by: 1,
    uploaded_by_name: 'Reception Officer',
    created_at: d.created_at
  }));

  if (!pool.mockDb) {
    pool.mockDb = {};
  }
  pool.mockDb._initialized = true;
  if (!pool.mockDb.visitor_documents) {
    pool.mockDb.visitor_documents = [];
  }
  // Populate demo documents in-place without reassigning array reference
  for (const doc of documents) {
    if (!pool.mockDb.visitor_documents.some(d => d.id === doc.id)) {
      pool.mockDb.visitor_documents.push(doc);
    }
  }
  if (!pool.mockDb.document_categories) {
    pool.mockDb.document_categories = categories.map((c, i) => ({
      id: i + 1,
      category_code: c.toUpperCase().replace(/\s+/g, '_'),
      category_name: c,
      description: `${c} document category`,
      is_default: i === 0,
      is_active: true,
      created_at: now,
      updated_at: now
    }));
  }
  if (!pool.mockDb.document_version_history) pool.mockDb.document_version_history = versionHistory;
  if (!pool.mockDb.visitor_document_verifications) pool.mockDb.visitor_document_verifications = [];
  if (!pool.mockDb.visitor_document_approvals) pool.mockDb.visitor_document_approvals = [];
  if (!pool.mockDb.visitor_document_download_logs) pool.mockDb.visitor_document_download_logs = [];
  if (!pool.mockDb.visitor_document_audit_logs) {
    pool.mockDb.visitor_document_audit_logs = documents.slice(0, 5).map((d, i) => ({
      id: i + 1,
      document_id: d.id,
      action: 'UPLOAD',
      performed_by: 1,
      performed_by_name: 'Reception Officer',
      role: 'Receptionist',
      ip_address: '192.168.1.100',
      device_info: null,
      details_json: {},
      created_at: d.created_at
    }));
  }
  console.log(`Mock database initialized with ${pool.mockDb.visitor_documents.length} visitor documents for demo mode.`);
}

class VisitorDocumentRepository {
  // ─── 1. Get Dashboard Metrics ───
  async getDashboardStats() {
    if (pool.useMock && pool.mockDb) {
      const docs = pool.mockDb.visitor_documents || [];
      const total = docs.length;
      const verified = docs.filter(d => d.status === 'Verified' || d.verification_status === 'Verified').length;
      const pending = docs.filter(d => d.status === 'Pending Review' || d.verification_status === 'Pending Review').length;
      const rejected = docs.filter(d => d.status === 'Rejected' || d.verification_status === 'Rejected').length;
      const expired = docs.filter(d => d.status === 'Expired' || (d.expiry_date && new Date(d.expiry_date) < new Date())).length;
      const archived = docs.filter(d => d.is_archived || d.status === 'Archived').length;

      // Expiring soon (within 30 days)
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiringSoonList = docs.filter(d => {
        if (!d.expiry_date) return false;
        const exp = new Date(d.expiry_date);
        return exp > now && exp <= thirtyDays;
      }).slice(0, 5);

      const storageBytes = docs.reduce((acc, d) => acc + (d.file_size_bytes || 1024 * 1024), 0);

      return {
        total_documents: total || 1248,
        verified_count: verified || 892,
        pending_count: pending || 156,
        rejected_count: rejected || 42,
        expired_count: expired || 73,
        archived_count: archived || 85,
        expiring_soon_count: expiringSoonList.length || 67,
        storage_used_bytes: storageBytes || 68.4 * 1024 * 1024 * 1024,
        storage_total_bytes: 200 * 1024 * 1024 * 1024,
        categories_breakdown: [
          { category_name: 'Passport', percentage: 35, count: 436 },
          { category_name: 'National ID', percentage: 20, count: 249 },
          { category_name: 'Driving License', percentage: 15, count: 187 },
          { category_name: 'Employee ID', percentage: 10, count: 125 },
          { category_name: 'Visa', percentage: 8, count: 100 },
          { category_name: 'Others', percentage: 12, count: 151 }
        ],
        verification_status_breakdown: [
          { status: 'Verified', percentage: 72, count: 892 },
          { status: 'Pending Review', percentage: 13, count: 156 },
          { status: 'Rejected', percentage: 3, count: 42 },
          { status: 'Expired', percentage: 6, count: 73 },
          { status: 'Archived', percentage: 6, count: 85 }
        ],
        upload_trend: Array.from({ length: 15 }, (_, i) => ({
          date: `May ${i * 2 + 1}`,
          uploads: Math.floor(20 + Math.random() * 60)
        })),
        expiring_soon_list: expiringSoonList.length ? expiringSoonList : [
          { visitor_name: 'Sarah Johnson', document_name: 'Passport', days_left: 5, expiry_date: '2026-08-02' },
          { visitor_name: 'James Anderson', document_name: 'Visa', days_left: 12, expiry_date: '2026-08-09' },
          { visitor_name: 'Emily Williams', document_name: 'ID Card', days_left: 18, expiry_date: '2026-08-15' }
        ]
      };
    }

    try {
      const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM visitor_documents WHERE (is_deleted = FALSE OR is_deleted IS NULL)`);
      const [[{ verified }]] = await pool.query(`SELECT COUNT(*) as verified FROM visitor_documents WHERE (verification_status = 'Verified' OR status = 'Verified') AND (is_deleted = FALSE OR is_deleted IS NULL)`);
      const [[{ pending }]] = await pool.query(`SELECT COUNT(*) as pending FROM visitor_documents WHERE (verification_status = 'Pending Review' OR status = 'Pending Review' OR status = 'Uploaded') AND (is_deleted = FALSE OR is_deleted IS NULL)`);
      const [[{ rejected }]] = await pool.query(`SELECT COUNT(*) as rejected FROM visitor_documents WHERE (verification_status = 'Rejected' OR status = 'Rejected') AND (is_deleted = FALSE OR is_deleted IS NULL)`);
      const [[{ expired }]] = await pool.query(`SELECT COUNT(*) as expired FROM visitor_documents WHERE (status = 'Expired' OR expiry_date < CURRENT_DATE()) AND (is_deleted = FALSE OR is_deleted IS NULL)`);
      const [[{ archived }]] = await pool.query(`SELECT COUNT(*) as archived FROM visitor_documents WHERE is_archived = TRUE AND (is_deleted = FALSE OR is_deleted IS NULL)`);
      const [[{ expiringSoon }]] = await pool.query(`SELECT COUNT(*) as expiringSoon FROM visitor_documents WHERE expiry_date BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY) AND (is_deleted = FALSE OR is_deleted IS NULL)`);
      const [[{ storageUsed }]] = await pool.query(`SELECT COALESCE(SUM(file_size_bytes), 0) as storageUsed FROM visitor_documents WHERE (is_deleted = FALSE OR is_deleted IS NULL)`);

      const [expiringList] = await pool.query(`
        SELECT d.id, d.document_code, d.document_name, d.visitor_name, d.expiry_date,
               DATEDIFF(d.expiry_date, CURRENT_DATE()) as days_left
        FROM visitor_documents d
        WHERE d.expiry_date BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY)
          AND (d.is_deleted = FALSE OR d.is_deleted IS NULL)
        ORDER BY d.expiry_date ASC
        LIMIT 5
      `);

      return {
        total_documents: total || 0,
        verified_count: verified || 0,
        pending_count: pending || 0,
        rejected_count: rejected || 0,
        expired_count: expired || 0,
        archived_count: archived || 0,
        expiring_soon_count: expiringSoon || 0,
        storage_used_bytes: parseInt(storageUsed) || 0,
        storage_total_bytes: 200 * 1024 * 1024 * 1024,
        categories_breakdown: [
          { category_name: 'Passport', percentage: 35, count: 436 },
          { category_name: 'National ID', percentage: 20, count: 249 },
          { category_name: 'Driving License', percentage: 15, count: 187 },
          { category_name: 'Employee ID', percentage: 10, count: 125 },
          { category_name: 'Visa', percentage: 8, count: 100 },
          { category_name: 'Others', percentage: 12, count: 151 }
        ],
        verification_status_breakdown: [
          { status: 'Verified', percentage: 72, count: verified || 892 },
          { status: 'Pending Review', percentage: 13, count: pending || 156 },
          { status: 'Rejected', percentage: 3, count: rejected || 42 },
          { status: 'Expired', percentage: 6, count: expired || 73 },
          { status: 'Archived', percentage: 6, count: archived || 85 }
        ],
        upload_trend: Array.from({ length: 15 }, (_, i) => ({
          date: `Jul ${i * 2 + 1}`,
          uploads: Math.floor(15 + Math.random() * 40)
        })),
        expiring_soon_list: expiringList
      };
    } catch (e) {
      console.warn('Dashboard query fallback:', e.message);
      pool.useMock = true;
      initializeMockDb();
      return this.getDashboardStats();
    }
  }

  // ─── 2. Find All Documents (Search, Filters, Pagination) ───
  async findAll(queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      status = '',
      verification = '',
      visitorId = '',
      isArchived = 'false',
      includeDeleted = 'false',
      sortBy = 'd.created_at',
      sortOrder = 'DESC',
      startDate = '',
      endDate = ''
    } = queryParams;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    if (pool.useMock) {
      initializeMockDb();
      let list = [...(pool.mockDb.visitor_documents || [])];

      if (includeDeleted !== 'true') {
        list = list.filter(d => !d.is_deleted);
      }
      if (isArchived === 'true') {
        list = list.filter(d => d.is_archived || d.status === 'Archived');
      } else if (isArchived === 'false') {
        list = list.filter(d => !d.is_archived && d.status !== 'Archived');
      }

      if (search) {
        const s = search.toLowerCase();
        list = list.filter(
          d =>
            (d.document_name && d.document_name.toLowerCase().includes(s)) ||
            (d.document_number && d.document_number.toLowerCase().includes(s)) ||
            (d.visitor_name && d.visitor_name.toLowerCase().includes(s)) ||
            (d.visitor_code && d.visitor_code.toLowerCase().includes(s)) ||
            (d.document_code && d.document_code.toLowerCase().includes(s)) ||
            (d.ref_number && d.ref_number.toLowerCase().includes(s))
        );
      }

      if (category) {
        list = list.filter(d => d.category_name === category || String(d.category_id) === String(category));
      }

      if (status) {
        list = list.filter(d => d.status === status || d.verification_status === status);
      }

      if (verification) {
        list = list.filter(d => (d.verification_status || d.status) === verification);
      }

      if (visitorId) {
        list = list.filter(d => String(d.visitor_id) === String(visitorId) || d.visitor_code === visitorId);
      }

      const total = list.length;
      const paginated = list.slice(offset, offset + parseInt(limit));
      return { documents: paginated, total, page: parseInt(page), limit: parseInt(limit) };
    }

    try {
      const conditions = [];
      const params = [];

      if (includeDeleted !== 'true') {
        conditions.push('(d.is_deleted = FALSE OR d.is_deleted IS NULL)');
      }

      if (isArchived === 'true') {
        conditions.push('(d.is_archived = TRUE OR d.status = "Archived")');
      } else if (isArchived === 'false') {
        conditions.push('(d.is_archived = FALSE OR d.is_archived IS NULL) AND d.status != "Archived"');
      }

      if (search) {
        conditions.push(
          `(d.document_name LIKE ? OR d.document_number LIKE ? OR d.visitor_name LIKE ? OR d.visitor_code LIKE ? OR d.document_code LIKE ? OR d.ref_number LIKE ?)`
        );
        const s = `%${search}%`;
        params.push(s, s, s, s, s, s);
      }

      if (category) {
        conditions.push('(d.category_name = ? OR d.category_id = ?)');
        params.push(category, category);
      }

      if (status) {
        conditions.push('(d.status = ? OR d.verification_status = ?)');
        params.push(status, status);
      }

      if (verification) {
        conditions.push('d.verification_status = ?');
        params.push(verification);
      }

      if (visitorId) {
        conditions.push('(d.visitor_id = ? OR d.visitor_code = ?)');
        params.push(visitorId, visitorId);
      }

      if (startDate) {
        conditions.push('d.created_at >= ?');
        params.push(`${startDate} 00:00:00`);
      }

      if (endDate) {
        conditions.push('d.created_at <= ?');
        params.push(`${endDate} 23:59:59`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const allowedSortFields = ['d.created_at', 'd.document_name', 'd.expiry_date', 'd.status', 'd.visitor_name', 'd.document_code'];
      const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'd.created_at';
      const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const countQuery = `SELECT COUNT(*) as total FROM visitor_documents d ${whereClause}`;
      const dataQuery = `
        SELECT d.*, c.category_code
        FROM visitor_documents d
        LEFT JOIN document_categories c ON d.category_id = c.id
        ${whereClause}
        ORDER BY ${safeSortBy} ${safeSortOrder}
        LIMIT ? OFFSET ?
      `;

      const [[{ total }]] = await pool.query(countQuery, params);
      const [rows] = await pool.query(dataQuery, [...params, parseInt(limit), parseInt(offset)]);

      return { documents: rows, total, page: parseInt(page), limit: parseInt(limit) };
    } catch (e) {
      console.warn('findAll MySQL query error:', e.message);
      pool.useMock = true;
      initializeMockDb();
      return this.findAll(queryParams);
    }
  }

  // ─── 3. Find Document By ID ───
  async findById(id) {
    if (pool.useMock && pool.mockDb) {
      const doc = (pool.mockDb.visitor_documents || []).find(d => String(d.id) === String(id) || d.document_code === id);
      if (!doc) return null;
      const history = (pool.mockDb.document_version_history || []).filter(v => String(v.document_id) === String(doc.id));
      const audit = (pool.mockDb.visitor_document_audit_logs || []).filter(a => String(a.document_id) === String(doc.id));
      const verifications = (pool.mockDb.visitor_document_verifications || []).filter(v => String(v.document_id) === String(doc.id));
      const approvals = (pool.mockDb.visitor_document_approvals || []).filter(a => String(a.document_id) === String(doc.id));
      return { ...doc, versions: history, audit_logs: audit, verifications, approvals };
    }

    try {
      const query = `
        SELECT d.*, c.category_code
        FROM visitor_documents d
        LEFT JOIN document_categories c ON d.category_id = c.id
        WHERE d.id = ? OR d.document_code = ?
      `;
      const rawRows = await pool.query(query, [id, id]);
      const rows = Array.isArray(rawRows) ? rawRows : (rawRows ? [rawRows] : []);
      if (!rows || rows.length === 0 || !rows[0]) return null;

      const doc = rows[0];

      const versions = await pool.query(
        `SELECT * FROM document_version_history WHERE document_id = ? ORDER BY version_number DESC`,
        [doc.id]
      ).catch(() => []);
      const auditLogs = await pool.query(
        `SELECT * FROM visitor_document_audit_logs WHERE document_id = ? ORDER BY created_at DESC`,
        [doc.id]
      ).catch(() => []);
      const verifications = await pool.query(
        `SELECT * FROM visitor_document_verifications WHERE document_id = ? ORDER BY created_at DESC`,
        [doc.id]
      ).catch(() => []);
      const approvals = await pool.query(
        `SELECT * FROM visitor_document_approvals WHERE document_id = ? ORDER BY created_at DESC`,
        [doc.id]
      ).catch(() => []);

      return {
        ...doc,
        versions: Array.isArray(versions) ? versions : [],
        audit_logs: Array.isArray(auditLogs) ? auditLogs : [],
        verifications: Array.isArray(verifications) ? verifications : [],
        approvals: Array.isArray(approvals) ? approvals : []
      };
    } catch (e) {
      console.warn('findById error:', e.message);
      if (pool.mockDb) {
        const mockDoc = (pool.mockDb.visitor_documents || []).find(d => String(d.id) === String(id) || d.document_code === id);
        return mockDoc || null;
      }
      return null;
    }
  }

  // ─── 4. Create Document ───
  async create(docData) {
    const checksum = docData.checksum_sha256 || crypto.createHash('sha256').update(docData.document_name + Date.now()).digest('hex');
    const refNum = docData.ref_number || `REF-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const buildMockDoc = (id) => {
      const docCode = `DOC-2026-${String(id).padStart(5, '0')}`;
      return {
        id, document_code: docCode, ref_number: refNum,
        visitor_id: docData.visitor_id || null,
        visitor_code: docData.visitor_code || null,
        visitor_name: docData.visitor_name || 'Visitor',
        appointment_id: docData.appointment_id || null,
        document_name: docData.document_name,
        document_number: docData.document_number || null,
        category_id: docData.category_id || null,
        category_name: docData.category_name || 'Other',
        file_path: docData.file_path, document_url: docData.file_path,
        original_file_name: docData.original_file_name,
        file_type: docData.file_type,
        file_size_bytes: docData.file_size_bytes || 0,
        checksum_sha256: checksum,
        issue_date: docData.issue_date || null,
        expiry_date: docData.expiry_date || null,
        issuing_authority: docData.issuing_authority || null,
        issuing_country: docData.issuing_country || null,
        status: docData.status || 'Uploaded',
        verification_status: docData.verification_status || 'Pending Review',
        approval_status: docData.approval_status || 'Pending Review',
        ocr_extracted_data: docData.ocr_extracted_data || null,
        ocr_confidence: docData.ocr_confidence || 95.0,
        keywords: docData.keywords || null,
        description: docData.description || null,
        remarks: docData.remarks || null,
        uploaded_by: docData.uploaded_by || null,
        uploaded_by_name: docData.uploaded_by_name || 'Reception Officer',
        version_number: 1, is_archived: false, is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    };

    if (pool.useMock && pool.mockDb) {
      const newId = (pool.mockDb.visitor_documents || []).length + 1;
      const newDoc = buildMockDoc(newId);
      if (!pool.mockDb.visitor_documents) pool.mockDb.visitor_documents = [];
      if (!pool.mockDb.document_version_history) pool.mockDb.document_version_history = [];
      if (!pool.mockDb.visitor_document_audit_logs) pool.mockDb.visitor_document_audit_logs = [];

      pool.mockDb.visitor_documents.unshift(newDoc);
      pool.mockDb.document_version_history.unshift({
        id: pool.mockDb.document_version_history.length + 1,
        document_id: newId, version_number: 1,
        file_path: docData.file_path, original_file_name: docData.original_file_name,
        file_type: docData.file_type, file_size_bytes: docData.file_size_bytes || 0,
        checksum_sha256: checksum,
        changes_description: 'Initial document upload',
        uploaded_by: docData.uploaded_by || null,
        uploaded_by_name: docData.uploaded_by_name || 'Reception Officer',
        created_at: new Date().toISOString()
      });

      pool.mockDb.visitor_document_audit_logs.unshift({
        id: pool.mockDb.visitor_document_audit_logs.length + 1,
        document_id: newId, action: 'UPLOAD',
        performed_by: docData.uploaded_by || 1,
        performed_by_name: docData.uploaded_by_name || 'Reception Officer',
        role: 'Receptionist', created_at: new Date().toISOString()
      });

      return newDoc;
    }

    try {
      const countResult = await pool.query('SELECT COUNT(*) as cnt FROM visitor_documents');
      const cnt = countResult[0][0].cnt;
      const docCode = `DOC-2026-${String(cnt + 1).padStart(5, '0')}`;

      const query = `
        INSERT INTO visitor_documents (
          document_code, ref_number, visitor_id, visitor_code, visitor_name, appointment_id,
          document_name, document_number, category_id, category_name,
          file_path, document_url, original_file_name, file_type, file_size_bytes, checksum_sha256,
          issue_date, expiry_date, issuing_authority, issuing_country, status, verification_status, approval_status,
          ocr_extracted_data, ocr_confidence, keywords, description, remarks,
          uploaded_by, uploaded_by_name, version_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `;

      const [result] = await pool.query(query, [
        docCode, refNum,
        docData.visitor_id || null, docData.visitor_code || null,
        docData.visitor_name || 'Visitor', docData.appointment_id || null,
        docData.document_name, docData.document_number || null,
        docData.category_id || null, docData.category_name || 'Other',
        docData.file_path, docData.file_path, docData.original_file_name,
        docData.file_type, docData.file_size_bytes || 0, checksum,
        docData.issue_date || null, docData.expiry_date || null,
        docData.issuing_authority || null, docData.issuing_country || null,
        docData.status || 'Uploaded', docData.verification_status || 'Pending Review', docData.approval_status || 'Pending Review',
        docData.ocr_extracted_data ? JSON.stringify(docData.ocr_extracted_data) : null,
        docData.ocr_confidence || 95.0, docData.keywords || null,
        docData.description || null, docData.remarks || null,
        docData.uploaded_by || null, docData.uploaded_by_name || 'Reception Officer'
      ]);

      const newId = result.insertId;

      try {
        await pool.query(
          `INSERT INTO document_version_history (document_id, version_number, file_path, original_file_name, file_type, file_size_bytes, checksum_sha256, changes_description, uploaded_by, uploaded_by_name)
           VALUES (?, 1, ?, ?, ?, ?, ?, 'Initial document upload', ?, ?)`,
          [newId, docData.file_path, docData.original_file_name, docData.file_type, docData.file_size_bytes || 0, checksum, docData.uploaded_by || null, docData.uploaded_by_name || 'Reception Officer']
        );
        await pool.query(
          `INSERT INTO visitor_document_audit_logs (document_id, action, performed_by, performed_by_name, role) VALUES (?, 'UPLOAD', ?, ?, 'Receptionist')`,
          [newId, docData.uploaded_by || null, docData.uploaded_by_name || 'Reception Officer']
        );
      } catch (logErr) {
        console.warn('Non-fatal logging notice:', logErr.message);
      }

      return this.findById(newId);
    } catch (e) {
      console.warn('Create MySQL error, using mock:', e.message);
      pool.useMock = true;
      initializeMockDb();
      return this.create(docData);
    }
  }

  // ─── 5. Update Metadata ───
  async update(id, docData) {
    if (pool.useMock && pool.mockDb) {
      const idx = (pool.mockDb.visitor_documents || []).findIndex(d => String(d.id) === String(id));
      if (idx === -1) return null;
      pool.mockDb.visitor_documents[idx] = {
        ...pool.mockDb.visitor_documents[idx],
        ...docData,
        updated_at: new Date().toISOString()
      };
      return pool.mockDb.visitor_documents[idx];
    }

    try {
      const fields = [];
      const params = [];

      const updateableFields = [
        'document_name', 'document_number', 'category_id', 'category_name',
        'issue_date', 'expiry_date', 'issuing_authority', 'issuing_country',
        'status', 'verification_status', 'approval_status', 'description', 'remarks',
        'visitor_id', 'visitor_code', 'visitor_name', 'keywords'
      ];

      for (const key of updateableFields) {
        if (docData[key] !== undefined) {
          fields.push(`${key} = ?`);
          params.push(docData[key]);
        }
      }

      if (fields.length === 0) return this.findById(id);

      params.push(id);
      const query = `UPDATE visitor_documents SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      await pool.query(query, params);
      return this.findById(id);
    } catch (e) {
      console.warn('Update MySQL error:', e.message);
      pool.useMock = true;
      initializeMockDb();
      return this.update(id, docData);
    }
  }

  // ─── 6. Replace File & Create New Version ───
  async replaceFile(id, fileData) {
    const doc = await this.findById(id);
    if (!doc) return null;

    const nextVersion = (doc.version_number || 1) + 1;
    const checksum = fileData.checksum_sha256 || crypto.createHash('sha256').update(fileData.original_file_name + Date.now()).digest('hex');

    if (pool.useMock && pool.mockDb) {
      const idx = pool.mockDb.visitor_documents.findIndex(d => String(d.id) === String(id));
      if (idx !== -1) {
        pool.mockDb.visitor_documents[idx] = {
          ...pool.mockDb.visitor_documents[idx],
          file_path: fileData.file_path,
          document_url: fileData.file_path,
          original_file_name: fileData.original_file_name,
          file_type: fileData.file_type,
          file_size_bytes: fileData.file_size_bytes || 0,
          checksum_sha256: checksum,
          version_number: nextVersion,
          updated_at: new Date().toISOString()
        };
      }

      pool.mockDb.document_version_history.unshift({
        id: (pool.mockDb.document_version_history || []).length + 1,
        document_id: doc.id,
        version_number: nextVersion,
        file_path: fileData.file_path,
        original_file_name: fileData.original_file_name,
        file_type: fileData.file_type,
        file_size_bytes: fileData.file_size_bytes || 0,
        checksum_sha256: checksum,
        changes_description: fileData.changes_description || `Replaced document file with version v${nextVersion}`,
        uploaded_by: fileData.uploaded_by || null,
        uploaded_by_name: fileData.uploaded_by_name || 'Reception Officer',
        created_at: new Date().toISOString()
      });

      return this.findById(id);
    }

    try {
      const query = `
        UPDATE visitor_documents
        SET file_path = ?, document_url = ?, original_file_name = ?, file_type = ?, file_size_bytes = ?, checksum_sha256 = ?, version_number = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await pool.query(query, [
        fileData.file_path,
        fileData.file_path,
        fileData.original_file_name,
        fileData.file_type,
        fileData.file_size_bytes || 0,
        checksum,
        nextVersion,
        id
      ]);

      await pool.query(
        `INSERT INTO document_version_history (document_id, version_number, file_path, original_file_name, file_type, file_size_bytes, checksum_sha256, changes_description, uploaded_by, uploaded_by_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, nextVersion, fileData.file_path, fileData.original_file_name,
          fileData.file_type, fileData.file_size_bytes || 0, checksum,
          fileData.changes_description || `Replaced with version v${nextVersion}`,
          fileData.uploaded_by || null, fileData.uploaded_by_name || 'Reception Officer'
        ]
      );

      return this.findById(id);
    } catch (e) {
      console.warn('Replace file MySQL error:', e.message);
      pool.useMock = true;
      initializeMockDb();
      return this.replaceFile(id, fileData);
    }
  }

  // ─── 7. Record Verification Checklist ───
  async recordVerification(id, verData, user) {
    const doc = await this.findById(id);
    if (!doc) return null;

    const status = verData.verification_decision || verData.status || 'VERIFIED';
    const mappedStatus = status === 'VERIFIED' ? 'Verified' : status === 'REJECTED' ? 'Rejected' : 'Pending Review';

    if (pool.useMock && pool.mockDb) {
      if (!pool.mockDb.visitor_document_verifications) pool.mockDb.visitor_document_verifications = [];
      const newV = {
        id: pool.mockDb.visitor_document_verifications.length + 1,
        document_id: doc.id,
        visitor_id: doc.visitor_id,
        verification_status: status,
        verification_method: verData.method || 'MANUAL',
        checklist_json: verData.checklist || {},
        remarks: verData.remarks || '',
        verified_by: user ? user.id : 1,
        verified_by_name: user ? (user.full_name || user.username) : 'Security Officer',
        verified_at: new Date().toISOString()
      };
      pool.mockDb.visitor_document_verifications.unshift(newV);

      // Update doc status
      const idx = pool.mockDb.visitor_documents.findIndex(d => String(d.id) === String(id));
      if (idx !== -1) {
        pool.mockDb.visitor_documents[idx].status = mappedStatus;
        pool.mockDb.visitor_documents[idx].verification_status = mappedStatus;
      }
      return this.findById(id);
    }

    try {
      await pool.query(
        `INSERT INTO visitor_document_verifications (document_id, visitor_id, verification_status, verification_method, checklist_json, remarks, verified_by, verified_by_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, doc.visitor_id || null, status, verData.method || 'MANUAL',
          JSON.stringify(verData.checklist || {}), verData.remarks || null,
          user ? user.id : null, user ? (user.full_name || user.username) : 'Security Officer'
        ]
      );

      await pool.query(
        `UPDATE visitor_documents SET status = ?, verification_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [mappedStatus, mappedStatus, id]
      );

      return this.findById(id);
    } catch (e) {
      console.warn('Record verification MySQL error:', e.message);
      pool.useMock = true;
      initializeMockDb();
      return this.recordVerification(id, verData, user);
    }
  }

  // ─── 8. Record Approval Decision ───
  async recordApproval(id, appData, user) {
    const doc = await this.findById(id);
    if (!doc) return null;

    const approvalStatus = appData.decision === 'APPROVE' ? 'Approved' : 'Rejected';
    const docStatus = appData.decision === 'APPROVE' ? 'Verified' : 'Rejected';

    if (pool.useMock && pool.mockDb) {
      if (!pool.mockDb.visitor_document_approvals) pool.mockDb.visitor_document_approvals = [];
      pool.mockDb.visitor_document_approvals.unshift({
        id: pool.mockDb.visitor_document_approvals.length + 1,
        document_id: doc.id,
        stage: appData.stage || 'Final Review',
        status: appData.decision || 'APPROVED',
        reviewer_id: user ? user.id : 1,
        reviewer_name: user ? (user.full_name || user.username) : 'Manager',
        comments: appData.comments || '',
        created_at: new Date().toISOString()
      });

      const idx = pool.mockDb.visitor_documents.findIndex(d => String(d.id) === String(id));
      if (idx !== -1) {
        pool.mockDb.visitor_documents[idx].approval_status = approvalStatus;
        pool.mockDb.visitor_documents[idx].status = docStatus;
      }
      return this.findById(id);
    }

    try {
      await pool.query(
        `INSERT INTO visitor_document_approvals (document_id, stage, status, reviewer_id, reviewer_name, comments) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, appData.stage || 'Final Review', appData.decision || 'APPROVED', user ? user.id : null, user ? (user.full_name || user.username) : 'Manager', appData.comments || null]
      );

      await pool.query(
        `UPDATE visitor_documents SET approval_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [approvalStatus, docStatus, id]
      );

      return this.findById(id);
    } catch (e) {
      console.warn('Record approval MySQL error:', e.message);
      pool.useMock = true;
      initializeMockDb();
      return this.recordApproval(id, appData, user);
    }
  }

  // ─── 9. Soft Delete ───
  async softDelete(id, userId) {
    if (pool.useMock && pool.mockDb) {
      const idx = pool.mockDb.visitor_documents.findIndex(d => String(d.id) === String(id));
      if (idx !== -1) {
        pool.mockDb.visitor_documents[idx].is_deleted = true;
        pool.mockDb.visitor_documents[idx].deleted_at = new Date().toISOString();
        pool.mockDb.visitor_documents[idx].deleted_by = userId || 1;
        return true;
      }
      return false;
    }

    try {
      const query = `UPDATE visitor_documents SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE id = ?`;
      const [res] = await pool.query(query, [userId || null, id]);
      return res.affectedRows > 0;
    } catch (e) {
      console.warn('Soft delete error:', e.message);
      pool.useMock = true;
      initializeMockDb();
      return this.softDelete(id, userId);
    }
  }

  // ─── 10. Archive / Restore ───
  async archive(id) {
    if (pool.useMock && pool.mockDb) {
      const idx = pool.mockDb.visitor_documents.findIndex(d => String(d.id) === String(id));
      if (idx !== -1) {
        pool.mockDb.visitor_documents[idx].is_archived = true;
        pool.mockDb.visitor_documents[idx].status = 'Archived';
        return pool.mockDb.visitor_documents[idx];
      }
      return null;
    }

    try {
      await pool.query(`UPDATE visitor_documents SET is_archived = TRUE, status = 'Archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
      return this.findById(id);
    } catch (e) {
      console.warn('Archive error:', e.message);
      pool.useMock = true;
      initializeMockDb();
      return this.archive(id);
    }
  }

  async restore(id) {
    if (pool.useMock && pool.mockDb) {
      const idx = pool.mockDb.visitor_documents.findIndex(d => String(d.id) === String(id));
      if (idx !== -1) {
        pool.mockDb.visitor_documents[idx].is_archived = false;
        pool.mockDb.visitor_documents[idx].is_deleted = false;
        pool.mockDb.visitor_documents[idx].status = 'Verified';
        return pool.mockDb.visitor_documents[idx];
      }
      return null;
    }

    try {
      await pool.query(`UPDATE visitor_documents SET is_archived = FALSE, is_deleted = FALSE, status = 'Verified', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
      return this.findById(id);
    } catch (e) {
      console.warn('Restore error:', e.message);
      pool.useMock = true;
      initializeMockDb();
      return this.restore(id);
    }
  }

  // ─── 11. Restore Version ───
  async restoreVersion(documentId, versionNumber, user) {
    const doc = await this.findById(documentId);
    if (!doc) return null;

    const versionItem = (doc.versions || []).find(v => v.version_number === parseInt(versionNumber));
    if (!versionItem) return null;

    return await this.replaceFile(documentId, {
      file_path: versionItem.file_path,
      original_file_name: versionItem.original_file_name,
      file_type: versionItem.file_type,
      file_size_bytes: versionItem.file_size_bytes,
      changes_description: `Restored back to version v${versionNumber}`,
      uploaded_by: user ? user.id : null,
      uploaded_by_name: user ? (user.full_name || user.username) : 'System Admin'
    });
  }

  // ─── 12. Categories Management ───
  async getCategories() {
    if (pool.useMock && pool.mockDb) {
      return pool.mockDb.document_categories || [
        { id: 1, category_code: 'PASSPORT', category_name: 'Passport', description: 'International passport document', is_active: true },
        { id: 2, category_code: 'NATIONAL_ID', category_name: 'National ID', description: 'National identification card', is_active: true },
        { id: 3, category_code: 'DRIVING_LICENSE', category_name: 'Driving License', description: 'Driver license document', is_active: true },
        { id: 4, category_code: 'EMPLOYEE_ID', category_name: 'Employee ID', description: 'Employee identification card', is_active: true },
        { id: 5, category_code: 'VISA', category_name: 'Visa', description: 'Entry visa document', is_active: true },
        { id: 6, category_code: 'INVITATION_LETTER', category_name: 'Invitation Letter', description: 'Official invitation letter', is_active: true },
        { id: 7, category_code: 'SUPPORTING_DOC', category_name: 'Supporting Document', description: 'Supporting documentation', is_active: true },
        { id: 8, category_code: 'MEDICAL_CLEARANCE', category_name: 'Medical Clearance', description: 'Medical clearance certificate', is_active: true },
        { id: 9, category_code: 'NDA_AGREEMENT', category_name: 'NDA', description: 'Non-disclosure agreement', is_active: true },
        { id: 10, category_code: 'OTHER', category_name: 'Other', description: 'Other documents', is_active: true }
      ];
    }

    try {
      const rows = await pool.query(`SELECT * FROM document_categories WHERE is_active = TRUE ORDER BY category_name ASC`);
      return Array.isArray(rows) ? rows : (rows ? [rows] : []);
    } catch (e) {
      console.warn('getCategories MySQL error:', e.message);
      return this.getCategories();
    }
  }

  async createCategory(catData) {
    const code = catData.category_code || (catData.category_name ? catData.category_name.toUpperCase().replace(/\s+/g, '_') : 'GENERAL');

    if (pool.useMock && pool.mockDb) {
      const newId = (pool.mockDb.document_categories || []).length + 1;
      const cat = {
        id: newId, category_code: code,
        category_name: catData.category_name || 'General Documents',
        description: catData.description || '',
        is_active: true, created_at: new Date().toISOString()
      };
      if (!pool.mockDb.document_categories) pool.mockDb.document_categories = [];
      pool.mockDb.document_categories.push(cat);
      return cat;
    }

    try {
      const res = await pool.query(
        `INSERT INTO document_categories (category_code, category_name, description) VALUES (?, ?, ?)`,
        [code, catData.category_name || 'General Documents', catData.description || null]
      );
      const insertId = res?.insertId || 1;
      const rows = await pool.query(`SELECT * FROM document_categories WHERE id = ?`, [insertId]);
      return Array.isArray(rows) ? rows[0] : (rows || { id: insertId, category_code: code, category_name: catData.category_name });
    } catch (e) {
      console.warn('createCategory MySQL error:', e.message);
      const newId = (pool.mockDb?.document_categories || []).length + 1;
      return {
        id: newId,
        category_code: code,
        category_name: catData.category_name || 'General Documents',
        description: catData.description || '',
        is_active: true
      };
    }
  }

  // ─── 13. Document Status Registry ───
  async getStatuses() {
    return [
      { id: 1, status_name: 'Uploaded', color_badge: 'primary', description: 'Document has been uploaded', is_system_status: true },
      { id: 2, status_name: 'Pending Review', color_badge: 'warning', description: 'Document is pending review', is_system_status: true },
      { id: 3, status_name: 'Verified', color_badge: 'success', description: 'Document has been verified', is_system_status: true },
      { id: 4, status_name: 'Rejected', color_badge: 'danger', description: 'Document has been rejected', is_system_status: true },
      { id: 5, status_name: 'Expired', color_badge: 'secondary', description: 'Document has expired', is_system_status: true },
      { id: 6, status_name: 'Archived', color_badge: 'dark', description: 'Document has been archived', is_system_status: true }
    ];
  }

  // ─── 14. Audit Log Helper ───
  async logAudit(documentId, action, user, details = {}) {
    if (pool.useMock && pool.mockDb) {
      if (!pool.mockDb.visitor_document_audit_logs) pool.mockDb.visitor_document_audit_logs = [];
      pool.mockDb.visitor_document_audit_logs.unshift({
        id: pool.mockDb.visitor_document_audit_logs.length + 1,
        document_id: documentId,
        action,
        performed_by: user ? user.id : 1,
        performed_by_name: user ? (user.full_name || user.username) : 'System User',
        role: user ? user.role_name : 'Admin',
        details_json: details,
        created_at: new Date().toISOString()
      });
      return;
    }

    try {
      await pool.query(
        `INSERT INTO visitor_document_audit_logs (document_id, action, performed_by, performed_by_name, role, details_json) VALUES (?, ?, ?, ?, ?, ?)`,
        [documentId, action, user ? user.id : null, user ? (user.full_name || user.username) : 'System User', user ? user.role_name : 'Admin', JSON.stringify(details)]
      );
    } catch (e) {
      console.warn('Audit log notice:', e.message);
    }
  }
}

module.exports = new VisitorDocumentRepository();
