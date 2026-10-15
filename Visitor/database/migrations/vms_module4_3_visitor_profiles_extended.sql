-- =====================================================================================
-- Migration: Module 4.3 – Visitor Profile Management (Extended)
-- Adds fields for address breakdown, category access rules, single active photo tracking,
-- categorized notes, and field-level profile change history.
-- =====================================================================================

USE visitor_db;

-- 1. Extend visitors table with additional profile fields
ALTER TABLE visitors
  ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(50) DEFAULT 'Mobile' COMMENT 'Preferred contact method: Mobile, Secondary Phone, Email',
  ADD COLUMN IF NOT EXISTS access_level VARCHAR(50) DEFAULT 'STANDARD' COMMENT 'Visitor access level rating: STANDARD, RESTRICTED, ESCORT_REQUIRED, VIP',
  ADD COLUMN IF NOT EXISTS approval_requirement VARCHAR(50) DEFAULT 'REQUIRED' COMMENT 'Approval requirement: REQUIRED, PRE_APPROVED, AUTOMATIC',
  ADD COLUMN IF NOT EXISTS visit_duration VARCHAR(50) DEFAULT '8 Hours' COMMENT 'Maximum authorized visit duration',
  ADD COLUMN IF NOT EXISTS street VARCHAR(150) NULL COMMENT 'Street address line',
  ADD COLUMN IF NOT EXISTS house_number VARCHAR(50) NULL COMMENT 'House or unit number',
  ADD COLUMN IF NOT EXISTS woreda VARCHAR(100) NULL COMMENT 'Woreda or district';

-- 2. Create visitor_profile_history table for field-level audit tracking
CREATE TABLE IF NOT EXISTS visitor_profile_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique history entry ID',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to the visitor record',
    user_id BIGINT UNSIGNED NULL COMMENT 'User who performed the change',
    action VARCHAR(100) NOT NULL COMMENT 'Action type (e.g. PROFILE_UPDATED, STATUS_CHANGED)',
    field_changed VARCHAR(100) NULL COMMENT 'Name of the field that changed',
    old_value TEXT NULL COMMENT 'Previous field value',
    new_value TEXT NULL COMMENT 'Updated field value',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp of change',
    CONSTRAINT fk_vph_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE,
    CONSTRAINT fk_vph_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Field-level profile change log for visitors';

-- 3. Extend visitor_photos with camera crop/rotation metadata
ALTER TABLE visitor_photos
  ADD COLUMN IF NOT EXISTS rotation INT DEFAULT 0 COMMENT 'Photo rotation angle in degrees',
  ADD COLUMN IF NOT EXISTS zoom DECIMAL(3,2) DEFAULT 1.00 COMMENT 'Photo zoom level scale';

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vph_visitor ON visitor_profile_history(visitor_id);
CREATE INDEX IF NOT EXISTS idx_vph_created_at ON visitor_profile_history(created_at);
