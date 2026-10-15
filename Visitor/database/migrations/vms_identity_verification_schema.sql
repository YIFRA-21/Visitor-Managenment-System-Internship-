-- =====================================================================================
-- Migration: Enterprise Identity Verification System (Module 4.3 Extension)
-- Tables for Identity Verification Sessions, Quality Scores, OCR, Liveness, Face Matching,
-- Security Checks, Watchlist, and Audit History.
-- =====================================================================================

USE visitor_db;

-- 1. Create visitor_identity_verifications table
CREATE TABLE IF NOT EXISTS visitor_identity_verifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique verification log ID',
    verification_session_id VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique session reference key',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor profile',
    doc_type VARCHAR(50) NOT NULL COMMENT 'Document type: National ID, Passport, Driving License, Government ID, Employee ID',
    front_image_url TEXT NULL COMMENT 'URL or base64 of front document image',
    back_image_url TEXT NULL COMMENT 'URL or base64 of back document image',
    selfie_image_url TEXT NULL COMMENT 'URL or base64 of live selfie image',
    image_quality_json JSON NULL COMMENT 'Crop, blur, glare, rotation quality metrics',
    ocr_data_json JSON NULL COMMENT 'Extracted full_name, id_number, dob, gender, nationality, issue/expiry dates, country',
    liveness_challenges_json JSON NULL COMMENT 'Randomized visual challenge logs (Blink, Turn Left, Turn Right, Smile, etc.)',
    liveness_passed BOOLEAN DEFAULT FALSE COMMENT 'Whether visual liveness check passed',
    face_match_score DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Face match score percentage (0-100%)',
    face_match_confidence VARCHAR(50) NULL COMMENT 'Verified, High Confidence, Manual Review, Verification Failed',
    security_checks_json JSON NULL COMMENT 'Duplicate ID, duplicate visitor, document expiry, blacklist, watchlist, authenticity results',
    final_status ENUM('VERIFIED', 'REJECTED', 'MANUAL_REVIEW_REQUIRED', 'PENDING') DEFAULT 'PENDING' COMMENT 'Final verification verdict',
    rejection_reason TEXT NULL COMMENT 'Detailed reason if rejected or flagged',
    verified_by BIGINT UNSIGNED NULL COMMENT 'User who conducted or approved verification',
    verified_at TIMESTAMP NULL COMMENT 'Timestamp when verification was finalized',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    CONSTRAINT fk_viv_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE,
    CONSTRAINT fk_viv_user FOREIGN KEY (verified_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Enterprise identity verification session history';

-- 2. Create visitor_watchlist table
CREATE TABLE IF NOT EXISTS visitor_watchlist (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique watchlist entry ID',
    id_number VARCHAR(100) NULL COMMENT 'National ID or Passport number on watchlist',
    full_name VARCHAR(150) NULL COMMENT 'Subject full name',
    reason TEXT NULL COMMENT 'Security watch note reason',
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'HIGH' COMMENT 'Threat rating',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Enterprise security watchlist repository';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_viv_visitor ON visitor_identity_verifications(visitor_id);
CREATE INDEX IF NOT EXISTS idx_viv_status ON visitor_identity_verifications(final_status);
CREATE INDEX IF NOT EXISTS idx_vw_id_number ON visitor_watchlist(id_number);
