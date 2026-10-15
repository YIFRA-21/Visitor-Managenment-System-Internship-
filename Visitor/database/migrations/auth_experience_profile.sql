-- Migration: VMS Authentication and Profiles DDL

CREATE TABLE IF NOT EXISTS manager_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED UNIQUE NOT NULL,
    manager_number VARCHAR(50) NOT NULL UNIQUE,
    department_id BIGINT UNSIGNED NULL,
    position VARCHAR(100) NULL,
    office VARCHAR(150) NULL,
    phone VARCHAR(30) NULL,
    email VARCHAR(150) NULL,
    employee_reference VARCHAR(50) NULL,
    approval_authority_level INT DEFAULT 1,
    photo_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_mgr_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_mgr_dept FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS receptionist_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED UNIQUE NOT NULL,
    receptionist_number VARCHAR(50) NOT NULL UNIQUE,
    assigned_building VARCHAR(100) NULL,
    reception_desk VARCHAR(100) NULL,
    shift VARCHAR(50) NULL,
    working_hours VARCHAR(100) NULL,
    phone VARCHAR(30) NULL,
    email VARCHAR(150) NULL,
    photo_url VARCHAR(255) NULL,
    supervisor_user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rec_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_rec_supervisor FOREIGN KEY (supervisor_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS security_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED UNIQUE NOT NULL,
    security_number VARCHAR(50) NOT NULL UNIQUE,
    security_level VARCHAR(50) NULL,
    assigned_gate VARCHAR(100) NULL,
    assigned_building VARCHAR(100) NULL,
    shift VARCHAR(50) NULL,
    phone VARCHAR(30) NULL,
    email VARCHAR(150) NULL,
    photo_url VARCHAR(255) NULL,
    supervisor_user_id BIGINT UNSIGNED NULL,
    certification_number VARCHAR(100) NULL,
    badge_number VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sec_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_sec_supervisor FOREIGN KEY (supervisor_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS administrator_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED UNIQUE NOT NULL,
    admin_number VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100) NULL,
    phone VARCHAR(30) NULL,
    email VARCHAR(150) NULL,
    photo_url VARCHAR(255) NULL,
    position VARCHAR(100) NULL,
    system_access_level VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_adm_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS verification_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    verifier_user_id BIGINT UNSIGNED NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    rejection_reason TEXT NULL,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ver_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_ver_verifier FOREIGN KEY (verifier_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Mappings and indices for high performance searches
CREATE INDEX idx_users_user_code ON users(user_code);
CREATE INDEX idx_mgr_number ON manager_profiles(manager_number);
CREATE INDEX idx_rec_number ON receptionist_profiles(receptionist_number);
CREATE INDEX idx_sec_number ON security_profiles(security_number);
CREATE INDEX idx_adm_number ON administrator_profiles(admin_number);
