const db = require('../config/db');

async function migrate() {
  console.log('--- Starting Non-Destructive Identity Verification Schema Migration ---');

  const queries = [
    // 1. Cases table
    `CREATE TABLE IF NOT EXISTS identity_verification_cases (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      case_number VARCHAR(64) NOT NULL UNIQUE,
      visitor_id BIGINT UNSIGNED NOT NULL,
      user_id BIGINT UNSIGNED NOT NULL,
      organization_id BIGINT UNSIGNED NULL,
      branch_id BIGINT UNSIGNED NULL,
      provider_name VARCHAR(50) NOT NULL DEFAULT 'MOCK_PROVIDER',
      provider_session_id VARCHAR(128) NULL,
      status ENUM(
        'PENDING',
        'PROVIDER_PROCESSING',
        'IN_REVIEW',
        'VERIFIED',
        'REJECTED',
        'RESUBMISSION_REQUIRED',
        'EXPIRED',
        'CANCELLED',
        'ERROR'
      ) NOT NULL DEFAULT 'PENDING',
      failure_reason TEXT NULL,
      policy_id BIGINT UNSIGNED NULL,
      started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_iv_visitor (visitor_id),
      INDEX idx_iv_user (user_id),
      INDEX idx_iv_status (status),
      INDEX idx_iv_provider_session (provider_session_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 2. Identity Documents table
    `CREATE TABLE IF NOT EXISTS identity_documents (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      case_id BIGINT UNSIGNED NOT NULL,
      visitor_id BIGINT UNSIGNED NOT NULL,
      document_type ENUM('PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE', 'RESIDENCE_PERMIT', 'OTHER') NOT NULL,
      issuing_country VARCHAR(100) NOT NULL DEFAULT 'Ethiopia',
      document_number_masked VARCHAR(64) NULL,
      front_file_path VARCHAR(255) NULL,
      back_file_path VARCHAR(255) NULL,
      file_hash_sha256 VARCHAR(64) NULL,
      ocr_extracted_json JSON NULL,
      authenticity_checks_json JSON NULL,
      is_valid TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_id_docs_case (case_id),
      INDEX idx_id_docs_visitor (visitor_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 3. Identity Verification Attempts table
    `CREATE TABLE IF NOT EXISTS identity_verification_attempts (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      case_id BIGINT UNSIGNED NOT NULL,
      attempt_number INT UNSIGNED NOT NULL DEFAULT 1,
      liveness_score DECIMAL(5,2) NULL,
      liveness_passed TINYINT(1) DEFAULT 0,
      face_match_score DECIMAL(5,2) NULL,
      face_match_confidence VARCHAR(50) NULL,
      face_match_passed TINYINT(1) DEFAULT 0,
      selfie_file_path VARCHAR(255) NULL,
      provider_raw_result_summary JSON NULL,
      ip_address VARCHAR(45) NULL,
      user_agent VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_id_attempts_case (case_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 4. Review Decisions table
    `CREATE TABLE IF NOT EXISTS identity_review_decisions (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      case_id BIGINT UNSIGNED NOT NULL,
      reviewer_user_id BIGINT UNSIGNED NOT NULL,
      decision ENUM('APPROVED', 'REJECTED', 'RESUBMISSION_REQUESTED') NOT NULL,
      review_notes TEXT NOT NULL,
      decision_reasons JSON NULL,
      decided_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_id_reviews_case (case_id),
      INDEX idx_id_reviews_reviewer (reviewer_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 5. Verification Policies table
    `CREATE TABLE IF NOT EXISTS identity_verification_policies (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      organization_id BIGINT UNSIGNED NOT NULL UNIQUE,
      is_verification_mandatory TINYINT(1) DEFAULT 0,
      gate_visitor_pass_issuance TINYINT(1) DEFAULT 0,
      require_liveness_check TINYINT(1) DEFAULT 1,
      require_face_match TINYINT(1) DEFAULT 1,
      min_face_match_confidence DECIMAL(5,2) DEFAULT 75.00,
      allow_manual_review_fallback TINYINT(1) DEFAULT 1,
      supported_doc_types JSON NULL,
      session_timeout_minutes INT DEFAULT 30,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_id_policy_org (organization_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 6. Provider Webhook Events Deduplication table
    `CREATE TABLE IF NOT EXISTS identity_provider_events (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      provider_name VARCHAR(50) NOT NULL,
      event_id VARCHAR(128) NOT NULL UNIQUE,
      event_type VARCHAR(100) NOT NULL,
      signature VARCHAR(255) NULL,
      payload_json JSON NOT NULL,
      status ENUM('RECEIVED', 'PROCESSED', 'FAILED', 'DUPLICATE') NOT NULL DEFAULT 'RECEIVED',
      processed_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_id_events_provider (provider_name),
      INDEX idx_id_events_event (event_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  ];

  for (let i = 0; i < queries.length; i++) {
    try {
      await db.query(queries[i]);
      console.log(`[OK] Table ${i + 1}/${queries.length} ensured.`);
    } catch (err) {
      console.error(`[ERROR] Migrating table ${i + 1}:`, err.message);
    }
  }

  // Ensure initial default verification policy exists for organization 1
  try {
    const existing = await db.query('SELECT id FROM identity_verification_policies WHERE organization_id = 1');
    if (!existing || existing.length === 0) {
      await db.query(
        `INSERT INTO identity_verification_policies 
         (organization_id, is_verification_mandatory, gate_visitor_pass_issuance, require_liveness_check, require_face_match, min_face_match_confidence, allow_manual_review_fallback, supported_doc_types)
         VALUES (1, 0, 0, 1, 1, 75.00, 1, ?)`,
        [JSON.stringify(['PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE'])]
      );
      console.log('[OK] Inserted default verification policy for organization 1.');
    }
  } catch (err) {
    console.warn('[WARN] Default policy check:', err.message);
  }

  console.log('--- Migration Completed Successfully ---');
  process.exit(0);
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
