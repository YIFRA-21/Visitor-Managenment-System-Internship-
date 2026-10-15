-- DDL Migrations for RBAC, Responsibilities, Permissions, and Resource Routing

USE visitor_db;

-- 1. Update users table with required new fields
ALTER TABLE users 
ADD COLUMN user_code VARCHAR(50) UNIQUE NULL AFTER user_id,
ADD COLUMN verification_status VARCHAR(30) DEFAULT 'UNVERIFIED' AFTER account_status,
ADD COLUMN first_login_required BOOLEAN DEFAULT FALSE AFTER verification_status;

-- 2. Create responsibilities table
CREATE TABLE IF NOT EXISTS responsibilities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    responsibility_id BIGINT UNSIGNED NULL UNIQUE,
    responsibility_code VARCHAR(50) NOT NULL UNIQUE,
    responsibility_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create role_responsibilities table
CREATE TABLE IF NOT EXISTS role_responsibilities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    responsibility_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_role_resp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_role_resp_resp FOREIGN KEY (responsibility_id) REFERENCES responsibilities(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_role_responsibility UNIQUE (role_id, responsibility_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create responsibility_permissions table
CREATE TABLE IF NOT EXISTS responsibility_permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    responsibility_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resp_perm_resp FOREIGN KEY (responsibility_id) REFERENCES responsibilities(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_resp_perm_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_responsibility_permission UNIQUE (responsibility_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create resources table for protected frontend paths
CREATE TABLE IF NOT EXISTS resources (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    resource_id BIGINT UNSIGNED NULL UNIQUE,
    resource_name VARCHAR(100) NOT NULL,
    route_url VARCHAR(255) NOT NULL UNIQUE,
    react_component VARCHAR(100) NOT NULL,
    menu_name VARCHAR(100) NOT NULL,
    menu_group VARCHAR(100) NULL,
    icon VARCHAR(50) NULL,
    display_order INT DEFAULT 0,
    parent_resource_id BIGINT UNSIGNED NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_resource_parent FOREIGN KEY (parent_resource_id) REFERENCES resources(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Create permission_resources table to bind permissions to UI pages
CREATE TABLE IF NOT EXISTS permission_resources (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    permission_id BIGINT UNSIGNED NOT NULL,
    resource_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_perm_res_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_perm_res_res FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_permission_resource UNIQUE (permission_id, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
