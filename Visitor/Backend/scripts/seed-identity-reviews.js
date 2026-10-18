const db = require('../src/config/db');

async function seedIdentityReviews() {
  console.log('Seeding real identity verification review cases...');

  // Ensure documents and attempts are populated
  const casesData = [
    {
      case_number: 'IV-CASE-20261018-001',
      visitor_id: 131,
      user_id: 1,
      provider_name: 'MOCK_FACIAL_BIOMETRICS',
      provider_session_id: 'SES-BIO-9921',
      status: 'IN_REVIEW',
      failure_reason: null,
      doc_type: 'NATIONAL_ID',
      country: 'Ethiopia',
      doc_masked: 'ID-2251*****',
      face_score: 0.96,
      live_score: 0.98,
      is_valid: 1,
      ocr: {
        fullName: 'Zebene Fantaye Gemechu',
        docNumber: 'ID-225135040',
        dob: '1992-06-14',
        expiry: '2029-06-14',
        issuingCountry: 'Ethiopia',
        authority: 'National ID Program'
      }
    },
    {
      case_number: 'IV-CASE-20261018-002',
      visitor_id: 152,
      user_id: 1,
      provider_name: 'HYPERSWIFT_OCR',
      provider_session_id: 'SES-BIO-8834',
      status: 'PENDING',
      failure_reason: null,
      doc_type: 'PASSPORT',
      country: 'Ethiopia',
      doc_masked: 'EP-9844*****',
      face_score: 0.89,
      live_score: 0.93,
      is_valid: 1,
      ocr: {
        fullName: 'Abebe Bikila',
        docNumber: 'EP-98441102',
        dob: '1988-11-20',
        expiry: '2028-11-20',
        issuingCountry: 'Ethiopia',
        authority: 'Immigration & Citizenship'
      }
    },
    {
      case_number: 'IV-CASE-20261018-003',
      visitor_id: 1,
      user_id: 1,
      provider_name: 'BIOPROTECT_SOC',
      provider_session_id: 'SES-BIO-7712',
      status: 'VERIFIED',
      failure_reason: null,
      doc_type: 'DRIVERS_LICENSE',
      country: 'Ethiopia',
      doc_masked: 'DL-5521*****',
      face_score: 0.99,
      live_score: 0.97,
      is_valid: 1,
      ocr: {
        fullName: 'UpdatedName Visitor',
        docNumber: 'DL-55219084',
        dob: '1990-03-12',
        expiry: '2030-03-12',
        issuingCountry: 'Ethiopia',
        authority: 'Federal Transport Authority'
      }
    },
    {
      case_number: 'IV-CASE-20261018-004',
      visitor_id: 148,
      user_id: 1,
      provider_name: 'BIOPROTECT_SOC',
      provider_session_id: 'SES-BIO-6641',
      status: 'REJECTED',
      failure_reason: 'Biometric face match confidence 42% below mandated threshold 80%',
      doc_type: 'PASSPORT',
      country: 'United States',
      doc_masked: 'US-8812*****',
      face_score: 0.42,
      live_score: 0.58,
      is_valid: 0,
      ocr: {
        fullName: 'Visitor Guest',
        docNumber: 'US-88129031',
        dob: '1995-08-05',
        expiry: '2031-08-05',
        issuingCountry: 'United States',
        authority: 'Department of State'
      }
    },
    {
      case_number: 'IV-CASE-20261018-005',
      visitor_id: 149,
      user_id: 1,
      provider_name: 'MOCK_FACIAL_BIOMETRICS',
      provider_session_id: 'SES-BIO-5532',
      status: 'RESUBMISSION_REQUIRED',
      failure_reason: 'Front document image edges cropped; MRZ unreadable',
      doc_type: 'NATIONAL_ID',
      country: 'Ethiopia',
      doc_masked: 'ID-7711*****',
      face_score: 0.74,
      live_score: 0.81,
      is_valid: 0,
      ocr: {
        fullName: 'Visitor Guest',
        docNumber: 'ID-77114402',
        dob: '1993-01-22',
        expiry: '2027-01-22',
        issuingCountry: 'Ethiopia',
        authority: 'National ID Program'
      }
    }
  ];

  for (const item of casesData) {
    // Check if case already exists
    const existing = await db.query('SELECT id FROM identity_verification_cases WHERE case_number = ?', [item.case_number]);
    let caseId;
    if (existing && existing.length > 0) {
      caseId = existing[0].id;
      await db.query(
        'UPDATE identity_verification_cases SET status = ?, failure_reason = ? WHERE id = ?',
        [item.status, item.failure_reason, caseId]
      );
    } else {
      const ins = await db.query(
        `INSERT INTO identity_verification_cases 
          (case_number, visitor_id, user_id, provider_name, provider_session_id, status, failure_reason, started_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [item.case_number, item.visitor_id, item.user_id, item.provider_name, item.provider_session_id, item.status, item.failure_reason]
      );
      caseId = ins.insertId;
    }

    // Insert Document
    const hasDoc = await db.query('SELECT id FROM identity_documents WHERE case_id = ?', [caseId]);
    if (!hasDoc || hasDoc.length === 0) {
      await db.query(
        `INSERT INTO identity_documents 
          (case_id, visitor_id, document_type, issuing_country, document_number_masked, ocr_extracted_json, is_valid, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [caseId, item.visitor_id, item.doc_type, item.country, item.doc_masked, JSON.stringify(item.ocr), item.is_valid]
      );
    }

    // Insert Attempt
    const hasAttempt = await db.query('SELECT id FROM identity_verification_attempts WHERE case_id = ?', [caseId]);
    if (!hasAttempt || hasAttempt.length === 0) {
      await db.query(
        `INSERT INTO identity_verification_attempts 
          (case_id, attempt_number, liveness_score, liveness_passed, face_match_score, face_match_confidence, face_match_passed, created_at)
         VALUES (?, 1, ?, ?, ?, ?, ?, NOW())`,
        [caseId, item.live_score, item.live_score >= 0.8 ? 1 : 0, item.face_score, item.face_score, item.face_score >= 0.8 ? 1 : 0]
      );
    }
  }

  console.log('Successfully seeded 5 diverse real identity verification review cases!');
  process.exit(0);
}

seedIdentityReviews().catch(err => {
  console.error(err);
  process.exit(1);
});
