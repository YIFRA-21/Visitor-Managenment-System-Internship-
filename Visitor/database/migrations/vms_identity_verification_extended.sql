-- =====================================================================================
-- Migration: Enterprise Identity Verification Extension (Module 4.3.6)
-- Adds fields for country selection, verification method, mobile QR session sync,
-- overall risk score, and document portrait image storage.
-- =====================================================================================

USE visitor_db;

-- 1. Extend visitor_identity_verifications table
ALTER TABLE visitor_identity_verifications
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Ethiopia' COMMENT 'Selected document issuing country',
  ADD COLUMN IF NOT EXISTS verification_method VARCHAR(50) DEFAULT 'CURRENT_DEVICE' COMMENT 'CURRENT_DEVICE or MOBILE_DEVICE',
  ADD COLUMN IF NOT EXISTS mobile_session_token VARCHAR(100) NULL COMMENT 'Secure token for mobile QR handoff session',
  ADD COLUMN IF NOT EXISTS mobile_session_status ENUM('WAITING', 'CONNECTED', 'UPLOADING', 'COMPLETED', 'EXPIRED') DEFAULT 'WAITING' COMMENT 'Mobile QR session status',
  ADD COLUMN IF NOT EXISTS mobile_expires_at TIMESTAMP NULL COMMENT 'Mobile session expiration timestamp',
  ADD COLUMN IF NOT EXISTS risk_score DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Security risk assessment score percentage',
  ADD COLUMN IF NOT EXISTS document_portrait_url TEXT NULL COMMENT 'Extracted document photo portrait URL or base64';

-- 2. Indexes for mobile session sync & risk filtering
CREATE INDEX IF NOT EXISTS idx_viv_mobile_token ON visitor_identity_verifications(mobile_session_token);
CREATE INDEX IF NOT EXISTS idx_viv_country ON visitor_identity_verifications(country);
