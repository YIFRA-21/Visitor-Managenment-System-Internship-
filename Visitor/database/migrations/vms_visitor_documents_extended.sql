-- =====================================================================================
-- Migration: Visitor Document Management Extended Schema (Module 4.7)
-- Supports OCR extraction, Document Categories, Statuses, Version Control,
-- Verification Checklists, Approval Workflows, Download Logs, and Audit Trails.
-- =====================================================================================

USE visitor_db;

-- 1. Document Categories Table
CREATE TABLE IF NOT EXISTS document_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_code VARCHAR(50) NOT NULL UNIQUE,
    category_name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Enterprise Document Categories';

-- Seed Document Categories if empty
INSERT IGNORE INTO document_categories (category_code, category_name, description, is_default) VALUES
('PASSPORT', 'Passport', 'International passport document', TRUE),
('NATIONAL_ID', 'National ID', 'National identification card', FALSE),
('DRIVING_LICENSE', 'Driving License', 'Driver license document', FALSE),
('EMPLOYEE_ID', 'Employee ID', 'Employee identification card', FALSE),
('VISA', 'Visa', 'Entry visa document', FALSE),
('INVITATION_LETTER', 'Invitation Letter', 'Official invitation letter', FALSE),
('SUPPORTING_DOC', 'Supporting Document', 'Supporting documentation', FALSE),
('MEDICAL_CLEARANCE', 'Medical Clearance', 'Medical clearance certificate', FALSE),
('NDA_AGREEMENT', 'NDA', 'Non-disclosure agreement', FALSE),
('WORK_PERMIT', 'Work Permit', 'Work authorization permit', FALSE),
('BIRTH_CERTIFICATE', 'Birth Certificate', 'Official birth certificate', FALSE),
('OTHER', 'Other', 'Other documents', FALSE);

-- 2. Document Statuses Table
CREATE TABLE IF NOT EXISTS document_statuses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    status_code VARCHAR(50) NOT NULL UNIQUE,
    status_name VARCHAR(100) NOT NULL,
    color_badge VARCHAR(30) DEFAULT 'primary',
    description TEXT NULL,
    is_system_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Enterprise Document Status Registry';

-- Seed Document Statuses if empty
INSERT IGNORE INTO document_statuses (status_code, status_name, color_badge, description, is_system_status) VALUES
('UPLOADED', 'Uploaded', 'primary', 'Document has been uploaded', TRUE),
('PENDING_REVIEW', 'Pending Review', 'warning', 'Document is pending review', TRUE),
('VERIFIED', 'Verified', 'success', 'Document has been verified', TRUE),
('REJECTED', 'Rejected', 'danger', 'Document has been rejected', TRUE),
('EXPIRED', 'Expired', 'secondary', 'Document has expired', TRUE),
('ARCHIVED', 'Archived', 'dark', 'Document has been archived', TRUE);

-- 3. Core visitor_documents Table (Ensure all columns exist)
CREATE TABLE IF NOT EXISTS visitor_documents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_code VARCHAR(50) NOT NULL UNIQUE,
    ref_number VARCHAR(100) NULL,
    visitor_id BIGINT UNSIGNED NULL,
    visitor_code VARCHAR(50) NULL,
    visitor_name VARCHAR(150) NULL,
    appointment_id BIGINT UNSIGNED NULL,
    document_name VARCHAR(255) NOT NULL,
    document_number VARCHAR(100) NULL,
    category_id BIGINT UNSIGNED NULL,
    category_name VARCHAR(100) NOT NULL DEFAULT 'Other',
    file_path LONGTEXT NOT NULL,
    document_url LONGTEXT NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    checksum_sha256 VARCHAR(64) NULL,
    issue_date DATE NULL,
    expiry_date DATE NULL,
    issuing_authority VARCHAR(150) NULL,
    issuing_country VARCHAR(100) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Uploaded',
    verification_status VARCHAR(50) NOT NULL DEFAULT 'Pending Review',
    approval_status VARCHAR(50) NOT NULL DEFAULT 'Pending Review',
    ocr_extracted_data JSON NULL,
    ocr_confidence DECIMAL(5,2) DEFAULT 0.00,
    keywords TEXT NULL,
    description TEXT NULL,
    remarks TEXT NULL,
    uploaded_by BIGINT UNSIGNED NULL,
    uploaded_by_name VARCHAR(150) NULL,
    version_number INT NOT NULL DEFAULT 1,
    is_archived BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Enterprise Visitor Documents Repository';

-- 4. Document Version Control History Table
CREATE TABLE IF NOT EXISTS document_version_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT UNSIGNED NOT NULL,
    version_number INT NOT NULL,
    file_path LONGTEXT NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    checksum_sha256 VARCHAR(64) NULL,
    changes_description TEXT NULL,
    uploaded_by BIGINT UNSIGNED NULL,
    uploaded_by_name VARCHAR(150) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_dvh_doc (document_id),
    INDEX idx_dvh_version (document_id, version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Document Revision & Version Control Logs';

-- 5. Visitor Document Verifications Table
CREATE TABLE IF NOT EXISTS visitor_document_verifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT UNSIGNED NOT NULL,
    visitor_id BIGINT UNSIGNED NULL,
    verification_status ENUM('VERIFIED', 'REJECTED', 'MANUAL_REVIEW', 'REQUEST_INFO') NOT NULL,
    verification_method VARCHAR(50) DEFAULT 'MANUAL',
    checklist_json JSON NULL,
    remarks TEXT NULL,
    verified_by BIGINT UNSIGNED NULL,
    verified_by_name VARCHAR(150) NULL,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vdv_doc (document_id),
    INDEX idx_vdv_visitor (visitor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Document Verification Audit Logs';

-- 6. Visitor Document Approvals Table
CREATE TABLE IF NOT EXISTS visitor_document_approvals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT UNSIGNED NOT NULL,
    stage VARCHAR(50) NOT NULL DEFAULT 'Review',
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    reviewer_id BIGINT UNSIGNED NULL,
    reviewer_name VARCHAR(150) NULL,
    comments TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vda_doc (document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Document Approval Workflow History';

-- 7. Visitor Document Download Logs Table
CREATE TABLE IF NOT EXISTS visitor_document_download_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT UNSIGNED NOT NULL,
    version_downloaded INT NOT NULL DEFAULT 1,
    download_option VARCHAR(50) NOT NULL DEFAULT 'LATEST',
    downloaded_by BIGINT UNSIGNED NULL,
    downloaded_by_name VARCHAR(150) NULL,
    ip_address VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vddl_doc (document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Document Download Access Audit Logs';

-- 8. Visitor Document Audit Logs Table
CREATE TABLE IF NOT EXISTS visitor_document_audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT UNSIGNED NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by BIGINT UNSIGNED NULL,
    performed_by_name VARCHAR(150) NULL,
    role VARCHAR(80) NULL,
    ip_address VARCHAR(50) NULL,
    device_info VARCHAR(255) NULL,
    details_json JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vdal_doc (document_id),
    INDEX idx_vdal_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Document Activity Audit Log Traces';
