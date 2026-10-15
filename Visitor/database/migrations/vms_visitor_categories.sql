-- =====================================================================================
-- MODULE 4.4: VISITOR CATEGORY MANAGEMENT MIGRATION
-- Database: visitor_db
-- =====================================================================================

USE visitor_db;

-- 1. Main Visitor Categories Table
CREATE TABLE IF NOT EXISTS visitor_categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_code VARCHAR(50) NOT NULL UNIQUE,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  default_visit_duration VARCHAR(50) NOT NULL DEFAULT '2 Hours',
  default_duration_minutes INT NOT NULL DEFAULT 120,
  max_visit_duration VARCHAR(50) NOT NULL DEFAULT '1 Day',
  max_duration_minutes INT NOT NULL DEFAULT 1440,
  approval_required BOOLEAN NOT NULL DEFAULT TRUE,
  allow_walkin_visitor BOOLEAN NOT NULL DEFAULT TRUE,
  allow_repeat_visit BOOLEAN NOT NULL DEFAULT TRUE,
  access_level VARCHAR(100) NOT NULL DEFAULT 'Level 1 (General)',
  status ENUM('Active', 'Inactive', 'Archived') NOT NULL DEFAULT 'Active',
  display_order INT NOT NULL DEFAULT 1,
  
  -- Rules & Security Requirements (4.4.5)
  appointment_required BOOLEAN NOT NULL DEFAULT TRUE,
  host_approval_required BOOLEAN NOT NULL DEFAULT TRUE,
  department_approval_required BOOLEAN NOT NULL DEFAULT FALSE,
  security_approval_required BOOLEAN NOT NULL DEFAULT FALSE,
  visitor_pass_required BOOLEAN NOT NULL DEFAULT TRUE,
  identity_verification_required BOOLEAN NOT NULL DEFAULT TRUE,
  face_verification_required BOOLEAN NOT NULL DEFAULT FALSE,
  document_verification_required BOOLEAN NOT NULL DEFAULT TRUE,
  escort_required BOOLEAN NOT NULL DEFAULT FALSE,
  vehicle_registration_required BOOLEAN NOT NULL DEFAULT FALSE,
  emergency_contact_required BOOLEAN NOT NULL DEFAULT FALSE,

  -- Soft Delete & Archival Flags
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  deleted_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vc_status (status),
  INDEX idx_vc_code (category_code),
  INDEX idx_vc_archived_deleted (is_archived, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Visitor Category Master Configuration';

-- 2. Category Required Documents Configuration (4.4.6)
CREATE TABLE IF NOT EXISTS visitor_category_documents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vcd_category FOREIGN KEY (category_id) REFERENCES visitor_categories(id) ON DELETE CASCADE,
  INDEX idx_vcd_cat (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Required Documents Configuration per Category';

-- 3. Category Approval Workflow Configuration (4.4.7)
CREATE TABLE IF NOT EXISTS visitor_category_workflows (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NOT NULL,
  step_order INT NOT NULL,
  step_name VARCHAR(100) NOT NULL,
  approver_role VARCHAR(100) NOT NULL,
  is_auto_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vcw_category FOREIGN KEY (category_id) REFERENCES visitor_categories(id) ON DELETE CASCADE,
  INDEX idx_vcw_cat (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Approval Workflow Steps per Category';

-- 4. Category Access Level Configuration (4.4.8)
CREATE TABLE IF NOT EXISTS visitor_category_access_levels (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NOT NULL,
  location_name VARCHAR(100) NOT NULL,
  is_granted BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vcal_category FOREIGN KEY (category_id) REFERENCES visitor_categories(id) ON DELETE CASCADE,
  INDEX idx_vcal_cat (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Access Level Locations per Category';
