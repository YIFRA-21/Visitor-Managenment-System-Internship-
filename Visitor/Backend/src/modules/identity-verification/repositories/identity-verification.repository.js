const db = require('../../../config/db');

/**
 * IdentityVerificationRepository
 * Data access layer using parameterized SQL queries and database transactions.
 */
class IdentityVerificationRepository {
  // ── Cases ──

  async createCase(caseData) {
    const sql = `
      INSERT INTO identity_verification_cases (
        case_number, visitor_id, user_id, organization_id, branch_id,
        provider_name, provider_session_id, status, policy_id, started_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const params = [
      caseData.caseNumber,
      caseData.visitorId,
      caseData.userId,
      caseData.organizationId || null,
      caseData.branchId || null,
      caseData.providerName || 'MOCK_PROVIDER',
      caseData.providerSessionId || null,
      caseData.status || 'PENDING',
      caseData.policyId || null,
    ];
    const result = await db.query(sql, params);
    return result.insertId;
  }

  async getCaseById(caseId) {
    const sql = `
      SELECT c.*, v.full_name as visitor_name, v.email as visitor_email, v.phone as visitor_phone,
             v.visitor_code, u.username as user_username
      FROM identity_verification_cases c
      JOIN visitors v ON c.visitor_id = v.id
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `;
    const rows = await db.query(sql, [caseId]);
    return rows && rows[0] ? rows[0] : null;
  }

  async getCaseByNumber(caseNumber) {
    const sql = `
      SELECT c.*, v.full_name as visitor_name, v.email as visitor_email
      FROM identity_verification_cases c
      JOIN visitors v ON c.visitor_id = v.id
      WHERE c.case_number = ?
    `;
    const rows = await db.query(sql, [caseNumber]);
    return rows && rows[0] ? rows[0] : null;
  }

  async getLatestCaseForVisitor(visitorId) {
    const sql = `
      SELECT * FROM identity_verification_cases
      WHERE visitor_id = ?
      ORDER BY id DESC
      LIMIT 1
    `;
    const rows = await db.query(sql, [visitorId]);
    return rows && rows[0] ? rows[0] : null;
  }

  async getCaseByProviderSession(providerSessionId) {
    const sql = `
      SELECT * FROM identity_verification_cases
      WHERE provider_session_id = ?
      LIMIT 1
    `;
    const rows = await db.query(sql, [providerSessionId]);
    return rows && rows[0] ? rows[0] : null;
  }

  async updateCaseStatus(caseId, status, failureReason = null) {
    const isTerminal = ['VERIFIED', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(status);
    const sql = `
      UPDATE identity_verification_cases
      SET status = ?,
          failure_reason = ?,
          completed_at = ${isTerminal ? 'NOW()' : 'completed_at'},
          updated_at = NOW()
      WHERE id = ?
    `;
    return db.query(sql, [status, failureReason, caseId]);
  }

  async updateCaseProviderSession(caseId, providerSessionId, providerName) {
    const sql = `
      UPDATE identity_verification_cases
      SET provider_session_id = ?,
          provider_name = ?,
          status = 'PROVIDER_PROCESSING',
          updated_at = NOW()
      WHERE id = ?
    `;
    return db.query(sql, [providerSessionId, providerName, caseId]);
  }

  // ── Documents ──

  async saveIdentityDocument(docData) {
    const sql = `
      INSERT INTO identity_documents (
        case_id, visitor_id, document_type, issuing_country,
        document_number_masked, front_file_path, back_file_path,
        file_hash_sha256, ocr_extracted_json, authenticity_checks_json, is_valid
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      docData.caseId,
      docData.visitorId,
      docData.documentType,
      docData.issuingCountry || 'Ethiopia',
      docData.documentNumberMasked || null,
      docData.frontFilePath || null,
      docData.backFilePath || null,
      docData.fileHashSha256 || null,
      docData.ocrExtractedJson ? JSON.stringify(docData.ocrExtractedJson) : null,
      docData.authenticityChecksJson ? JSON.stringify(docData.authenticityChecksJson) : null,
      docData.isValid ? 1 : 0,
    ];
    const result = await db.query(sql, params);
    return result.insertId;
  }

  async getDocumentsByCaseId(caseId) {
    const sql = `SELECT * FROM identity_documents WHERE case_id = ?`;
    return db.query(sql, [caseId]);
  }

  // ── Attempts ──

  async recordAttempt(attemptData) {
    const sql = `
      INSERT INTO identity_verification_attempts (
        case_id, attempt_number, liveness_score, liveness_passed,
        face_match_score, face_match_confidence, face_match_passed,
        selfie_file_path, provider_raw_result_summary, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      attemptData.caseId,
      attemptData.attemptNumber || 1,
      attemptData.livenessScore || null,
      attemptData.livenessPassed ? 1 : 0,
      attemptData.faceMatchScore || null,
      attemptData.faceMatchConfidence || null,
      attemptData.faceMatchPassed ? 1 : 0,
      attemptData.selfieFilePath || null,
      attemptData.providerRawSummary ? JSON.stringify(attemptData.providerRawSummary) : null,
      attemptData.ipAddress || null,
      attemptData.userAgent || null,
    ];
    const result = await db.query(sql, params);
    return result.insertId;
  }

  async getAttemptsByCaseId(caseId) {
    const sql = `SELECT * FROM identity_verification_attempts WHERE case_id = ? ORDER BY attempt_number ASC`;
    return db.query(sql, [caseId]);
  }

  // ── Review Decisions ──

  async recordReviewDecision(decisionData) {
    const sql = `
      INSERT INTO identity_review_decisions (
        case_id, reviewer_user_id, decision, review_notes, decision_reasons, decided_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;
    const params = [
      decisionData.caseId,
      decisionData.reviewerUserId,
      decisionData.decision,
      decisionData.reviewNotes,
      decisionData.decisionReasons ? JSON.stringify(decisionData.decisionReasons) : null,
    ];
    const result = await db.query(sql, params);
    return result.insertId;
  }

  async getReviewDecisionsByCaseId(caseId) {
    const sql = `
      SELECT rd.*, u.full_name as reviewer_name, u.email as reviewer_email
      FROM identity_review_decisions rd
      JOIN users u ON rd.reviewer_user_id = u.id
      WHERE rd.case_id = ?
      ORDER BY rd.decided_at DESC
    `;
    return db.query(sql, [caseId]);
  }

  // ── Reviewer Queue ──

  async getReviewerQueue(filters = {}) {
    let sql = `
      SELECT c.*, v.full_name as visitor_name, v.email as visitor_email, v.visitor_code,
             d.document_type, d.issuing_country, a.face_match_score, a.liveness_score
      FROM identity_verification_cases c
      JOIN visitors v ON c.visitor_id = v.id
      LEFT JOIN identity_documents d ON d.case_id = c.id
      LEFT JOIN identity_verification_attempts a ON a.case_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status && filters.status !== 'ALL') {
      sql += ` AND c.status = ?`;
      params.push(filters.status);
    } else {
      sql += ` AND c.status IN ('IN_REVIEW', 'PROVIDER_PROCESSING', 'PENDING')`;
    }

    if (filters.search) {
      sql += ` AND (v.full_name LIKE ? OR v.email LIKE ? OR c.case_number LIKE ?)`;
      const q = `%${filters.search}%`;
      params.push(q, q, q);
    }

    sql += ` ORDER BY c.id DESC LIMIT 50`;
    return db.query(sql, params);
  }

  // ── Policy ──

  async getPolicyByOrganization(organizationId) {
    const sql = `SELECT * FROM identity_verification_policies WHERE organization_id = ? LIMIT 1`;
    const rows = await db.query(sql, [organizationId || 1]);
    return rows && rows[0] ? rows[0] : null;
  }

  async upsertPolicy(policyData) {
    const sql = `
      INSERT INTO identity_verification_policies (
        organization_id, is_verification_mandatory, gate_visitor_pass_issuance,
        require_liveness_check, require_face_match, min_face_match_confidence,
        allow_manual_review_fallback, supported_doc_types, session_timeout_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        is_verification_mandatory = VALUES(is_verification_mandatory),
        gate_visitor_pass_issuance = VALUES(gate_visitor_pass_issuance),
        require_liveness_check = VALUES(require_liveness_check),
        require_face_match = VALUES(require_face_match),
        min_face_match_confidence = VALUES(min_face_match_confidence),
        allow_manual_review_fallback = VALUES(allow_manual_review_fallback),
        supported_doc_types = VALUES(supported_doc_types),
        session_timeout_minutes = VALUES(session_timeout_minutes),
        updated_at = NOW()
    `;
    const params = [
      policyData.organizationId,
      policyData.isVerificationMandatory ? 1 : 0,
      policyData.gateVisitorPassIssuance ? 1 : 0,
      policyData.requireLivenessCheck ? 1 : 0,
      policyData.requireFaceMatch ? 1 : 0,
      policyData.minFaceMatchConfidence || 75.0,
      policyData.allowManualReviewFallback ? 1 : 0,
      policyData.supportedDocTypes ? JSON.stringify(policyData.supportedDocTypes) : null,
      policyData.sessionTimeoutMinutes || 30,
    ];
    return db.query(sql, params);
  }

  // ── Webhook Deduplication ──

  async recordProviderEvent(providerName, eventId, eventType, signature, payload) {
    const sql = `
      INSERT INTO identity_provider_events (
        provider_name, event_id, event_type, signature, payload_json, status, processed_at
      ) VALUES (?, ?, ?, ?, ?, 'RECEIVED', NOW())
    `;
    const params = [
      providerName,
      eventId,
      eventType,
      signature || null,
      JSON.stringify(payload),
    ];
    try {
      const res = await db.query(sql, params);
      return { isDuplicate: false, eventDbId: res.insertId };
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return { isDuplicate: true };
      }
      throw err;
    }
  }

  async markEventProcessed(eventDbId, status) {
    const sql = `UPDATE identity_provider_events SET status = ? WHERE id = ?`;
    return db.query(sql, [status, eventDbId]);
  }

  // ── Sync with Core Visitors Table ──

  async syncVisitorVerificationStatus(visitorId, status) {
    const sql = `
      UPDATE visitors
      SET id_verification_status = ?,
          updated_at = NOW()
      WHERE id = ?
    `;
    return db.query(sql, [status, visitorId]);
  }
}

module.exports = new IdentityVerificationRepository();
