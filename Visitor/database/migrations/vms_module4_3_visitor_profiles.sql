-- =====================================================================================
-- Migration: Module 4.3 – Visitor Profile Management
-- Extends the existing `visitors` table with additional enterprise fields
-- for address breakdown, vehicle details, identity verification, archive support, 
-- and internal notes without duplicating any existing columns or tables.
-- =====================================================================================

USE visitor_db;

-- 1. Add address breakdown columns (Ethiopian address structure)
ALTER TABLE visitors
  ADD COLUMN IF NOT EXISTS alt_phone VARCHAR(30) NULL COMMENT 'Alternative phone number',
  ADD COLUMN IF NOT EXISTS alt_email VARCHAR(150) NULL COMMENT 'Alternative email address',
  ADD COLUMN IF NOT EXISTS marital_status VARCHAR(30) NULL COMMENT 'Marital status: Single, Married, Divorced, Widowed',
  ADD COLUMN IF NOT EXISTS occupation VARCHAR(100) NULL COMMENT 'Visitor occupation or job title',
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Ethiopia' COMMENT 'Country of residence',
  ADD COLUMN IF NOT EXISTS region VARCHAR(100) NULL COMMENT 'Region or State',
  ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL COMMENT 'City name',
  ADD COLUMN IF NOT EXISTS zone VARCHAR(100) NULL COMMENT 'Zone (Ethiopian address subdivision)',
  ADD COLUMN IF NOT EXISTS sub_city VARCHAR(100) NULL COMMENT 'Sub-city or district',
  ADD COLUMN IF NOT EXISTS woreda VARCHAR(50) NULL COMMENT 'Woreda (local administrative area)',
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(30) NULL COMMENT 'Postal code',
  ADD COLUMN IF NOT EXISTS full_address TEXT NULL COMMENT 'Full formatted address string';

-- 2. Add identity document tracking columns
ALTER TABLE visitors
  ADD COLUMN IF NOT EXISTS id_issue_date DATE NULL COMMENT 'Identity document issue date',
  ADD COLUMN IF NOT EXISTS id_expiry_date DATE NULL COMMENT 'Identity document expiry date',
  ADD COLUMN IF NOT EXISTS id_verification_status ENUM('UNVERIFIED','PENDING','VERIFIED','REJECTED') DEFAULT 'UNVERIFIED' COMMENT 'Identity verification status';

-- 3. Add vehicle information columns
ALTER TABLE visitors
  ADD COLUMN IF NOT EXISTS vehicle_plate_number VARCHAR(50) NULL COMMENT 'Vehicle license plate number',
  ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50) NULL COMMENT 'Vehicle type: Car, Motorcycle, Van, Truck',
  ADD COLUMN IF NOT EXISTS vehicle_brand VARCHAR(50) NULL COMMENT 'Vehicle manufacturer brand',
  ADD COLUMN IF NOT EXISTS vehicle_model VARCHAR(50) NULL COMMENT 'Vehicle model name',
  ADD COLUMN IF NOT EXISTS vehicle_color VARCHAR(30) NULL COMMENT 'Vehicle color',
  ADD COLUMN IF NOT EXISTS parking_required BOOLEAN DEFAULT FALSE COMMENT 'Whether parking is required';

-- 4. Add archive & notes support columns
ALTER TABLE visitors
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE COMMENT 'Whether the record is archived',
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL COMMENT 'Timestamp when record was archived',
  ADD COLUMN IF NOT EXISTS archived_by BIGINT UNSIGNED NULL COMMENT 'User who archived the record',
  ADD COLUMN IF NOT EXISTS notes TEXT NULL COMMENT 'Internal notes and administrative remarks';

-- 5. Create visitor_notes table for multi-entry notes/remarks
CREATE TABLE IF NOT EXISTS visitor_notes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique note identifier',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to the visitor record',
    note_type ENUM('INTERNAL','ADMINISTRATIVE','CORRECTION','SYSTEM') DEFAULT 'INTERNAL' COMMENT 'Type of note',
    content TEXT NOT NULL COMMENT 'Note content body',
    created_by BIGINT UNSIGNED NULL COMMENT 'User who created the note',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Soft delete flag',
    CONSTRAINT fk_visitor_notes_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE,
    CONSTRAINT fk_visitor_notes_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Visitor profile notes and remarks';

-- 6. Performance indexes for Module 4.3
CREATE INDEX IF NOT EXISTS idx_visitors_is_archived ON visitors(is_archived);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);
CREATE INDEX IF NOT EXISTS idx_visitors_id_verification ON visitors(id_verification_status);
CREATE INDEX IF NOT EXISTS idx_visitors_full_name ON visitors(full_name);
CREATE INDEX IF NOT EXISTS idx_visitors_phone ON visitors(phone);
CREATE INDEX IF NOT EXISTS idx_visitors_email ON visitors(email);
CREATE INDEX IF NOT EXISTS idx_visitor_notes_visitor ON visitor_notes(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_notes_type ON visitor_notes(note_type);
