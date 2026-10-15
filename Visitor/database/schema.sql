DROP DATABASE IF EXISTS visitor_db;

CREATE DATABASE visitor_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE visitor_db;

-- Disable FK checks during schema creation to avoid ordering issues
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================================
-- 1. ROLE & PERMISSION MANAGEMENT (RBAC MODULE)
-- =====================================================================================

CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique identifier for the role',
    role_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    role_name VARCHAR(80) NOT NULL COMMENT 'Enterprise name of the role',
    name VARCHAR(80) GENERATED ALWAYS AS (role_name) STORED UNIQUE COMMENT 'System name of the role (backwards compatible)',
    role_code VARCHAR(40) NOT NULL COMMENT 'Unique role code representation',
    description TEXT COMMENT 'Detailed explanation of the role responsibilities',
    is_system_role BOOLEAN DEFAULT FALSE COMMENT 'Indicates if it is a protected system role',
    status ENUM('ACTIVE','INACTIVE','SUSPENDED','ARCHIVED') DEFAULT 'ACTIVE' COMMENT 'Operational status',
    scope_type ENUM('SYSTEM', 'ORGANIZATION', 'BRANCH', 'DEPARTMENT', 'BUILDING') DEFAULT 'SYSTEM' COMMENT 'Target operational scope of the role',
    role_type ENUM('SYSTEM', 'CUSTOM', 'TEMPLATE') DEFAULT 'CUSTOM' COMMENT 'Role categorization',
    priority INT DEFAULT 10 COMMENT 'Role evaluation priority weight',
    is_assignment_allowed BOOLEAN DEFAULT TRUE COMMENT 'Whether users can be assigned to this role',
    is_temporary_allowed BOOLEAN DEFAULT TRUE COMMENT 'Whether temporary timed assignments are allowed',
    is_multiple_allowed BOOLEAN DEFAULT TRUE COMMENT 'Whether user can hold this with other roles',
    requires_approval BOOLEAN DEFAULT FALSE COMMENT 'Whether role assignment requires authorization approval',
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'LOW' COMMENT 'Security risk designation',
    version INT DEFAULT 1 COMMENT 'Current version number of the role configuration',
    organization_id BIGINT UNSIGNED NULL COMMENT 'FK for Organization scoped roles',
    branch_id BIGINT UNSIGNED NULL COMMENT 'FK for Branch scoped roles',
    department_id BIGINT UNSIGNED NULL COMMENT 'FK for Department scoped roles',
    building_id BIGINT UNSIGNED NULL COMMENT 'FK for Building scoped roles',
    parent_role_id BIGINT UNSIGNED NULL COMMENT 'Direct parent role link',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_roles_name UNIQUE (role_name),
    CONSTRAINT uq_roles_code UNIQUE (role_code),
    CONSTRAINT fk_roles_parent FOREIGN KEY (parent_role_id) REFERENCES roles(id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Stores user system roles for Role-Based Access Control';

CREATE TABLE role_hierarchy (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique link identifier',
    parent_role_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to parent role',
    child_role_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to child role',
    path VARCHAR(255) COMMENT 'Materialized hierarchy tree path',
    level INT COMMENT 'Hierarchy level scale',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    CONSTRAINT fk_parent_role FOREIGN KEY (parent_role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_child_role FOREIGN KEY (child_role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT uq_role_relation UNIQUE (parent_role_id, child_role_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Manages role hierarchy and inheritance';

CREATE TABLE permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique identifier for the permission',
    permission_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    permission_name VARCHAR(100) NOT NULL COMMENT 'Enterprise permission name',
    name VARCHAR(100) GENERATED ALWAYS AS (permission_name) STORED UNIQUE COMMENT 'System name (backwards compatible)',
    permission_code VARCHAR(80) NOT NULL COMMENT 'Granular unique permission key',
    module VARCHAR(60) NOT NULL COMMENT 'Source module identifier (e.g. AUTH, VISIT)',
    description TEXT COMMENT 'Explanation of what action this permission authorizes',
    is_system_permission BOOLEAN DEFAULT FALSE COMMENT 'Indicates if it is a protected permission',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT 'Active configuration status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_permissions_name UNIQUE (permission_name),
    CONSTRAINT uq_permissions_code UNIQUE (permission_code)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Registry of all granular action permissions';

CREATE TABLE role_permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Junction identifier',
    role_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to the role',
    permission_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to the permission',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Mapping timestamp',
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Junction table linking roles and permissions (Many-to-Many)';

CREATE TABLE role_conflicts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Conflict rule ID',
    role_id_1 BIGINT UNSIGNED NOT NULL COMMENT 'First role ID in conflict pair',
    role_id_2 BIGINT UNSIGNED NOT NULL COMMENT 'Second role ID in conflict pair',
    conflict_code VARCHAR(80) NOT NULL UNIQUE COMMENT 'Unique conflict identifier code',
    conflict_name VARCHAR(150) NOT NULL COMMENT 'Descriptive conflict title',
    description TEXT NULL COMMENT 'Detailed explanation of why roles cannot coexist',
    severity ENUM('HIGH', 'CRITICAL') DEFAULT 'CRITICAL' COMMENT 'Risk level of conflict violation',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether conflict enforcement is active',
    created_by BIGINT UNSIGNED NULL COMMENT 'Admin who created rule',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    CONSTRAINT uq_role_pair UNIQUE (role_id_1, role_id_2),
    CONSTRAINT fk_rc_role1 FOREIGN KEY (role_id_1) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rc_role2 FOREIGN KEY (role_id_2) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Defines incompatible role pairs (Role Conflict Rules)';

CREATE TABLE sod_rules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'SoD rule ID',
    rule_code VARCHAR(80) NOT NULL UNIQUE COMMENT 'Unique rule code',
    rule_name VARCHAR(150) NOT NULL COMMENT 'Rule name',
    description TEXT NULL COMMENT 'Description of Segregation of Duties policy',
    permission_id_1 BIGINT UNSIGNED NOT NULL COMMENT 'First conflicting permission ID',
    permission_id_2 BIGINT UNSIGNED NOT NULL COMMENT 'Second conflicting permission ID',
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'HIGH' COMMENT 'Violation risk level',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether SoD policy is enabled',
    created_by BIGINT UNSIGNED NULL COMMENT 'Rule creator user ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    CONSTRAINT uq_sod_perm_pair UNIQUE (permission_id_1, permission_id_2),
    CONSTRAINT fk_sod_perm1 FOREIGN KEY (permission_id_1) REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_sod_perm2 FOREIGN KEY (permission_id_2) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Segregation of Duties (SoD) permission conflict policies';

CREATE TABLE role_versions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Version snapshot ID',
    role_id BIGINT UNSIGNED NOT NULL COMMENT 'Target role ID',
    version_number INT NOT NULL COMMENT 'Snapshot version index',
    role_name VARCHAR(80) NOT NULL COMMENT 'Role name at version snapshot',
    role_code VARCHAR(40) NOT NULL COMMENT 'Role code at version snapshot',
    scope_type VARCHAR(50) DEFAULT 'SYSTEM' COMMENT 'Role scope at version',
    description TEXT NULL COMMENT 'Description text snapshot',
    permissions_snapshot_json JSON NULL COMMENT 'JSON array of permission IDs & codes snapshot',
    created_by BIGINT UNSIGNED NULL COMMENT 'User ID who modified role',
    change_reason TEXT NULL COMMENT 'Reason for version creation',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Snapshot timestamp',
    INDEX idx_rv_role_ver (role_id, version_number),
    CONSTRAINT fk_rv_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Role modification snapshot version history';

CREATE TABLE role_templates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Template ID',
    template_code VARCHAR(80) NOT NULL UNIQUE COMMENT 'Unique template code key',
    template_name VARCHAR(100) NOT NULL COMMENT 'Human readable template title',
    category VARCHAR(50) DEFAULT 'General' COMMENT 'Role domain category',
    description TEXT NULL COMMENT 'Template explanation and purpose',
    scope_type VARCHAR(50) DEFAULT 'ORGANIZATION' COMMENT 'Recommended scope',
    default_permissions_json JSON NULL COMMENT 'JSON array of permission codes included in template',
    risk_level VARCHAR(20) DEFAULT 'LOW' COMMENT 'Template risk assessment',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Pre-configured enterprise role templates catalog';

-- =====================================================================================
-- 2. ENTERPRISE INFRASTRUCTURE & MULTI-FACILITY MODULE
-- =====================================================================================

CREATE TABLE facilities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique facility identifier',
    facility_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    name VARCHAR(100) NOT NULL COMMENT 'Corporate site name',
    code VARCHAR(20) NOT NULL COMMENT 'Short identifier code',
    address VARCHAR(255) NOT NULL COMMENT 'Physical location address',
    timezone VARCHAR(50) DEFAULT 'UTC' COMMENT 'Local facility timezone',
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') DEFAULT 'ACTIVE' COMMENT 'Status of the facility',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_facilities_name UNIQUE (name),
    CONSTRAINT uq_facilities_code UNIQUE (code)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Enterprise physical facility sites';

CREATE TABLE departments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique department identifier',
    department_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    facility_id BIGINT UNSIGNED NULL COMMENT 'Reference to facility site',
    department_code VARCHAR(20) NOT NULL COMMENT 'Unique alphanumeric business key identifying the department',
    department_name VARCHAR(100) NOT NULL COMMENT 'Unique official name of the department',
    name VARCHAR(100) GENERATED ALWAYS AS (department_name) STORED UNIQUE COMMENT 'Backwards compatible department name',
    description TEXT NULL COMMENT 'Detailed scope and functional responsibilities',
    parent_department_id BIGINT UNSIGNED NULL COMMENT 'Self-referencing foreign key for organizational tree scaling',
    manager_user_id BIGINT UNSIGNED NULL COMMENT 'Foreign key to users table mapping the department head',
    manager_id BIGINT UNSIGNED NULL COMMENT 'Backwards compatible manager relation (synchronized)',
    email VARCHAR(150) NULL COMMENT 'Shared corporate inbox address for the department',
    phone VARCHAR(30) NULL COMMENT 'Direct phone number or internal extension',
    location VARCHAR(150) NULL COMMENT 'Physical location workspace coordinate within building',
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Operational status indicators',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Department registration date',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last operational change',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_department_code UNIQUE (department_code),
    CONSTRAINT uq_department_name UNIQUE (department_name),
    CONSTRAINT chk_department_email CHECK (email LIKE '%@%.%'),
    CONSTRAINT chk_department_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT fk_dept_facility FOREIGN KEY (facility_id) REFERENCES facilities (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Enterprise organizational departments';

CREATE TABLE job_titles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique job title identifier',
    job_title_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    title_code VARCHAR(20) NOT NULL COMMENT 'Unique job position code',
    title_name VARCHAR(100) NOT NULL COMMENT 'Unique job position name',
    description TEXT NULL COMMENT 'Summary of job profile and responsibilities',
    hierarchy_level INT NOT NULL DEFAULT 1 COMMENT 'Defines reporting rank priority (e.g. 1 for CEO, 2 for Manager)',
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Active configuration status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_title_code UNIQUE (title_code),
    CONSTRAINT uq_title_name UNIQUE (title_name),
    CONSTRAINT chk_job_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT chk_job_hierarchy CHECK (hierarchy_level > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Stores organization job positions and titles';

-- =====================================================================================
-- 3. USER MANAGEMENT & SECURITY (CREDENTIALS, 2FA, LOCKOUT & SESSIONS)
-- =====================================================================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique user identifier',
    user_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    username VARCHAR(50) NOT NULL COMMENT 'Unique user login handle',
    email VARCHAR(150) NOT NULL COMMENT 'Email address used for login',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Secure bcrypt hash of the user password',
    first_name VARCHAR(100) NULL COMMENT 'Legal first name',
    middle_name VARCHAR(100) NULL COMMENT 'Legal middle name',
    last_name VARCHAR(100) NULL COMMENT 'Legal last name',
    full_name VARCHAR(150) NULL COMMENT 'Full concatenated name (backwards compatible)',
    phone VARCHAR(30) NULL COMMENT 'Contact number (backwards compatible)',
    phone_number VARCHAR(20) NULL COMMENT 'Primary phone number',
    profile_photo VARCHAR(255) NULL COMMENT 'URL/Path to user profile photo',
    avatar_url VARCHAR(255) NULL COMMENT 'URL/Path to user avatar image (backwards compatible)',
    gender ENUM('MALE','FEMALE','OTHER') NULL COMMENT 'Gender identification',
    date_of_birth DATE NULL COMMENT 'Date of birth',
    account_status ENUM('PENDING','ACTIVE','INACTIVE','LOCKED','SUSPENDED') NOT NULL DEFAULT 'PENDING' COMMENT 'Security state status',
    status ENUM('active','inactive','locked') DEFAULT 'active' COMMENT 'Backwards compatible user status',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Email verification status',
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Phone verification status',
    failed_login_attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Counter for login failures',
    last_login_at DATETIME NULL COMMENT 'Time of last success login',
    password_changed_at DATETIME NULL COMMENT 'Timestamp of last password change',
    account_locked_until DATETIME NULL COMMENT 'Lock threshold expiry time',
    last_password_reset_at DATETIME NULL COMMENT 'Timestamp of last password reset',
    reset_token VARCHAR(255) NULL COMMENT 'Token for password resetting (backwards compatible)',
    reset_token_expires DATETIME NULL COMMENT 'Expiration datetime for password reset token (backwards compatible)',
    role VARCHAR(50) NULL COMMENT 'Single role cache (backwards compatible)',
    department_id BIGINT UNSIGNED NULL COMMENT 'Department relation',
    role_id BIGINT UNSIGNED NULL COMMENT 'User role identifier (backwards compatible)',
    job_title_id BIGINT UNSIGNED NULL COMMENT 'Job title relation (backwards compatible)',
    job_title VARCHAR(100) NULL COMMENT 'Job classification',
    employee_id BIGINT UNSIGNED NULL COMMENT 'Linked employee record (employees.id)',
    availability_json JSON NULL COMMENT 'Weekly schedule matrix',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT fk_users_dept FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Core table for application users and credentials';

CREATE TABLE user_roles (
    user_role_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    organization_id BIGINT UNSIGNED NULL COMMENT 'Scope: Organization ID',
    branch_id BIGINT UNSIGNED NULL COMMENT 'Scope: Branch ID',
    department_id BIGINT UNSIGNED NULL COMMENT 'Scope: Department ID',
    building_id BIGINT UNSIGNED NULL COMMENT 'Scope: Building ID',
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    start_date DATETIME NULL COMMENT 'Start datetime for temporary/scheduled assignment',
    end_date DATETIME NULL COMMENT 'End datetime for temporary/scheduled assignment',
    expires_at DATETIME NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    assignment_status ENUM('ACTIVE', 'PENDING_APPROVAL', 'EXPIRED', 'REVOKED') DEFAULT 'ACTIVE' COMMENT 'Status of assignment',
    assignment_reason TEXT NULL COMMENT 'Business justification for assignment',
    approval_status ENUM('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED') DEFAULT 'NOT_REQUIRED' COMMENT 'Approval workflow status',
    approved_by BIGINT UNSIGNED NULL COMMENT 'User ID who approved assignment',
    approved_at DATETIME NULL COMMENT 'Timestamp of assignment approval',
    assigned_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_user_role UNIQUE (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_user_roles_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_user_roles_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_user_roles_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Junction mapping users to security roles (Many-to-Many)';

CREATE TABLE employees (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique record identifier',
    employee_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    user_id BIGINT UNSIGNED NOT NULL UNIQUE COMMENT 'Links to core user record (One-to-One)',
    employee_number VARCHAR(50) NOT NULL UNIQUE COMMENT 'Official unique company employee number',
    employee_code VARCHAR(50) GENERATED ALWAYS AS (employee_number) STORED UNIQUE COMMENT 'Backwards compatible employee identifier',
    facility_id BIGINT UNSIGNED NULL COMMENT 'Primary office facility site',
    department_id BIGINT UNSIGNED NULL COMMENT 'Assigned department',
    job_title_id BIGINT UNSIGNED NULL COMMENT 'Reference to job title',
    manager_employee_id BIGINT UNSIGNED NULL COMMENT 'Reference to immediate supervisor employee record',
    manager_id BIGINT UNSIGNED NULL COMMENT 'Backwards compatible reference to immediate supervisor user',
    hire_date DATE NULL COMMENT 'Date of employment onboarding',
    employment_status ENUM('full_time','part_time','contractor','intern') DEFAULT 'full_time' COMMENT 'Employment terms status',
    office_location VARCHAR(150) COMMENT 'Physical office desk, floor, or room address',
    office_phone VARCHAR(30) COMMENT 'Direct office phone number',
    extension VARCHAR(10) COMMENT 'Lobby/desk telephone extension number',
    badge_number VARCHAR(50) COMMENT 'Assigned physical building entry badge key number',
    work_shift VARCHAR(50) COMMENT 'Assigned operational work shift designation',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Profile creation date',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Profile last modification date',
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT chk_emp_status CHECK (employment_status IN ('full_time','part_time','contractor','intern')),
    CONSTRAINT fk_emp_facility FOREIGN KEY (facility_id) REFERENCES facilities (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_emp_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_emp_dept FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_emp_job_title FOREIGN KEY (job_title_id) REFERENCES job_titles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_emp_manager FOREIGN KEY (manager_employee_id) REFERENCES employees(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Captures enterprise metadata for internal corporate staff';

CREATE TABLE password_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique identifier for password history record',
    password_history_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to the user',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Previously used password bcrypt hash',
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Password creation timestamp',
    change_reason VARCHAR(150) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_pw_history_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Stores historical passwords to enforce security policies against reuse';

CREATE TABLE failed_login_attempts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique entry identifier',
    email VARCHAR(150) NOT NULL COMMENT 'Email address that attempted login',
    ip_address VARCHAR(45) NOT NULL COMMENT 'IP address of the device making the attempt',
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp of the failure',
    CONSTRAINT idx_failed_email_time UNIQUE (email, attempted_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Logs failed login attempts for rate limiting';

CREATE TABLE user_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique session identifier',
    session_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to the logged-in user',
    session_token VARCHAR(255) NOT NULL UNIQUE COMMENT 'Unique identifier token for the session',
    refresh_token VARCHAR(255) NULL COMMENT 'JWT refresh token value',
    remember_token VARCHAR(255) NULL UNIQUE COMMENT 'Long-lived remember me cookie token',
    ip_address VARCHAR(45) COMMENT 'IP address used during login/session registration',
    user_agent TEXT COMMENT 'Browser and OS user agent string',
    login_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity_at DATETIME NULL,
    logout_at DATETIME NULL,
    expires_at DATETIME NOT NULL COMMENT 'Expiration timestamp for the session',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if this session is valid and active',
    device_type VARCHAR(50) COMMENT 'Inferred device type (Desktop, Mobile, Tablet)',
    location VARCHAR(150) COMMENT 'Geographical location trace',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Tracks active user authentication sessions and devices';

CREATE TABLE refresh_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique token identifier',
    refresh_token_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to the user',
    token VARCHAR(500) NOT NULL COMMENT 'JWT refresh token payload',
    is_revoked BOOLEAN GENERATED ALWAYS AS (CASE WHEN revoked_at IS NOT NULL OR is_active = FALSE THEN TRUE ELSE FALSE END) STORED COMMENT 'Revocation indicator',
    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL COMMENT 'Token expiration timestamp',
    revoked_at DATETIME NULL COMMENT 'Time token was invalidated',
    replaced_by_token VARCHAR(255) NULL COMMENT 'Token replacing this token',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    device_type VARCHAR(50) NULL,
    device_fingerprint VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Manages revokable JSON Web Token (JWT) refresh flows';

CREATE TABLE two_factor_auth (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique 2FA registration identifier',
    user_id BIGINT UNSIGNED NOT NULL UNIQUE COMMENT 'One-to-one mapping to the user',
    secret_key VARCHAR(100) NOT NULL COMMENT 'TOTP secret key',
    is_enabled BOOLEAN DEFAULT FALSE COMMENT 'Indicates if 2FA is active for this account',
    backup_codes JSON NOT NULL COMMENT 'JSON array of encrypted recovery codes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Registration timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Status change timestamp',
    CONSTRAINT fk_tfa_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Enforces multi-factor authentication (MFA/2FA) details per user';

-- =====================================================================================
-- 4. CALENDAR, ROOM & SCHEDULING
-- =====================================================================================

CREATE TABLE meeting_rooms (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique room identifier',
    room_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    facility_id BIGINT UNSIGNED NULL COMMENT 'Reference to facility site',
    room_number VARCHAR(50) NULL UNIQUE COMMENT 'Alphanumeric room number key',
    room_name VARCHAR(100) NULL COMMENT 'Display name of the room',
    building VARCHAR(100) NULL COMMENT 'Building identifier',
    floor VARCHAR(50) NULL COMMENT 'Floor identifier',
    capacity INT UNSIGNED NOT NULL DEFAULT 10 COMMENT 'Maximum seating capacity',
    has_projector BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indicates if equipped with projector',
    has_tv BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indicates if equipped with tv screen',
    has_video_conference BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indicates if equipped with VC hardware',
    status ENUM('ACTIVE', 'MAINTENANCE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Room operational status',
    is_accessible BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates wheelchair accessibility',
    
    -- Legacy fields
    name VARCHAR(100) NULL COMMENT 'Clean room code or name',
    location VARCHAR(150) NULL COMMENT 'Floor and wing location within the building',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Indicates if the room is available for meetings',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_meeting_rooms_facility FOREIGN KEY (facility_id) REFERENCES facilities (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_meeting_rooms_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_meeting_rooms_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_meeting_rooms_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_room_capacity CHECK (capacity > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Internal corporate conference and meeting rooms';

CREATE TABLE employee_schedule (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique schedule slot identifier',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to the staff user',
    day_of_week ENUM('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL COMMENT 'Workday',
    start_time TIME NOT NULL COMMENT 'Duty/Availability start time',
    end_time TIME NOT NULL COMMENT 'Duty/Availability end time',
    is_available BOOLEAN DEFAULT TRUE COMMENT 'Whether the employee is active for hosting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation date',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Schedule update timestamp',
    CONSTRAINT fk_schedule_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT idx_user_day UNIQUE (user_id, day_of_week)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Daily operational schedules/availability for hosting staff';

-- =====================================================================================
-- 4A. ORGANIZATION REGISTRY (moved before Visitor Management for FK dependency order)
-- =====================================================================================

CREATE TABLE organizations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique record ID',
    organization_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    name VARCHAR(150) NOT NULL COMMENT 'Official organization name',
    short_name VARCHAR(50) NULL COMMENT 'Short brand or acronym name',
    code VARCHAR(20) NOT NULL UNIQUE COMMENT 'Short unique alphanumeric identifier code',
    registration_number VARCHAR(100) NULL COMMENT 'Government legal registration number',
    tax_number VARCHAR(100) NULL COMMENT 'Federal tax or VAT ID number',
    website VARCHAR(255) NULL COMMENT 'Official corporate website address',
    email VARCHAR(150) NULL COMMENT 'General corporate inquiry email address',
    phone VARCHAR(30) NULL COMMENT 'Primary corporate switchboard phone number',
    address VARCHAR(255) NULL COMMENT 'Physical corporate headquarters location address',
    country VARCHAR(100) NULL COMMENT 'HQ country name location',
    region VARCHAR(100) NULL COMMENT 'HQ state, province or region classification',
    city VARCHAR(100) NULL COMMENT 'HQ city classification location',
    timezone VARCHAR(50) DEFAULT 'UTC' COMMENT 'Default operations timezone reference',
    currency VARCHAR(10) DEFAULT 'USD' COMMENT 'Default bookkeeping currency code',
    language VARCHAR(10) DEFAULT 'en' COMMENT 'Default portal fallback language selection',
    logo_url VARCHAR(255) NULL COMMENT 'Path to corporate header asset image file location',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT 'Active registry status flag',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if organization is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Company master organization entity details registry';

-- =====================================================================================
-- 5. VISITOR MANAGEMENT (PROFILE, DOCUMENTS, LEGAL COMPLIANCE)
-- =====================================================================================

CREATE TABLE visitor_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique identifier for the visitor type',
    visitor_type_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    type_name VARCHAR(80) NOT NULL COMMENT 'Visitor category name',
    description TEXT NULL COMMENT 'Detailed explanation of the type permissions',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_visitor_types_name UNIQUE (type_name),
    CONSTRAINT fk_vt_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vt_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vt_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Registry of visitor types/categories';

CREATE TABLE visitor_companies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique identifier for the company',
    visitor_company_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    company_name VARCHAR(150) NOT NULL COMMENT 'Enterprise/Corporate name of the company',
    contact_email VARCHAR(150) NULL COMMENT 'Primary email contact for the company',
    contact_phone VARCHAR(30) NULL COMMENT 'Primary telephone number of the company',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_visitor_companies_name UNIQUE (company_name),
    CONSTRAINT fk_vc_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vc_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vc_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Organizations and companies associated with visitors';

CREATE TABLE visitors (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique visitor profile identifier',
    visitor_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    organization_id BIGINT UNSIGNED NULL COMMENT 'FK to organizations — multi-tenant data isolation',
    user_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Links to login credentials if visitor registers an account',
    visitor_type_id BIGINT UNSIGNED NULL COMMENT 'Reference to visitor type',
    visitor_company_id BIGINT UNSIGNED NULL COMMENT 'Reference to visitor company',
    first_name VARCHAR(100) NULL COMMENT 'Legal first name',
    middle_name VARCHAR(100) NULL COMMENT 'Legal middle name',
    last_name VARCHAR(100) NULL COMMENT 'Legal last name',
    full_name VARCHAR(150) NULL COMMENT 'Full concatenated name (backwards compatible)',
    email VARCHAR(150) NOT NULL COMMENT 'Email address used for profile tracking and notifications',
    phone VARCHAR(30) NOT NULL COMMENT 'Primary telephone contact number',
    gender ENUM('MALE','FEMALE','OTHER') NULL COMMENT 'Gender identification',
    date_of_birth DATE NULL COMMENT 'Date of birth',
    nationality VARCHAR(100) NULL COMMENT 'Country of citizenship',
    company VARCHAR(150) NULL COMMENT 'Company name text (backwards compatible cache)',
    category VARCHAR(80) NULL COMMENT 'Category text (backwards compatible cache)',
    status ENUM('ACTIVE','INACTIVE','BLOCKED') DEFAULT 'ACTIVE' COMMENT 'Visitor lifecycle status',
    photo_url VARCHAR(255) NULL COMMENT 'Path to active profile photograph',
    id_type VARCHAR(100) NULL COMMENT 'Identification document type (backwards compatible cache)',
    id_number VARCHAR(100) NULL COMMENT 'Identification document number (backwards compatible cache)',
    emergency_contact_name VARCHAR(150) NULL COMMENT 'Name of emergency contact person',
    emergency_contact_phone VARCHAR(30) NULL COMMENT 'Phone number of emergency contact',
    is_blacklisted BOOLEAN DEFAULT FALSE COMMENT 'Quick lookup blacklist flag (backwards compatible)',
    registration_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING' COMMENT 'Registration flow stage',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Operational record activation status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Visitor registration date',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last profile change',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_visitors_email UNIQUE (email),
    CONSTRAINT fk_visitor_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_visitor_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_visitor_type FOREIGN KEY (visitor_type_id) REFERENCES visitor_types (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_visitor_company FOREIGN KEY (visitor_company_id) REFERENCES visitor_companies (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_visitor_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_visitor_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_visitor_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Stores external visitor profiles with multi-tenant org isolation';

CREATE TABLE visitor_documents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique document identifier',
    visitor_document_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor',
    document_type VARCHAR(50) NOT NULL COMMENT 'Document type (e.g. Passport, Drivers License)',
    document_number VARCHAR(100) NOT NULL COMMENT 'Serial/identification number of the document',
    issue_date DATE NULL COMMENT 'Date when document was issued',
    expiry_date DATE NULL COMMENT 'Date when document expires',
    issuing_authority VARCHAR(150) NULL COMMENT 'Agency or government that issued the document',
    document_url VARCHAR(500) NOT NULL COMMENT 'Path to securely uploaded document photo/scan',
    verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING' COMMENT 'Document authenticity status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_doc_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_doc_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_doc_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_doc_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Stores digitized identity documents for security records';

CREATE TABLE visitor_photos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique photo identifier',
    visitor_photo_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor profile',
    photo_path VARCHAR(500) NOT NULL COMMENT 'File path/URL of the captured photograph',
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when photograph was captured/uploaded',
    is_active_photo BOOLEAN DEFAULT TRUE COMMENT 'Indicates if this is the primary identification photo',
    captured_by BIGINT UNSIGNED NULL COMMENT 'Internal staff user who captured or approved the photo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_photo_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_photo_captured_by FOREIGN KEY (captured_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_vp_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vp_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vp_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Stores logs of physical/webcam visitor facial check photos';

CREATE TABLE visitor_addresses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique address identifier',
    visitor_address_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor profile',
    address_type ENUM('HOME', 'OFFICE', 'TEMPORARY') DEFAULT 'HOME' COMMENT 'Type of location address',
    address_line1 VARCHAR(255) NOT NULL COMMENT 'Primary street/house address detail',
    address_line2 VARCHAR(255) NULL COMMENT 'Secondary suite/building address detail',
    city VARCHAR(100) NOT NULL COMMENT 'City name',
    state VARCHAR(100) NULL COMMENT 'State or region name',
    postal_code VARCHAR(20) NULL COMMENT 'ZIP or postal coordinate code',
    country VARCHAR(100) NOT NULL COMMENT 'Country name',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_address_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_va_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_va_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_va_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Stores physical contact address details for visitors';

CREATE TABLE visitor_emergency_contacts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique contact identifier',
    emergency_contact_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor profile',
    contact_name VARCHAR(150) NOT NULL COMMENT 'Full name of emergency contact person',
    relationship VARCHAR(100) NOT NULL COMMENT 'Relationship to visitor (e.g. Spouse, Employer)',
    phone VARCHAR(30) NOT NULL COMMENT 'Primary emergency contact telephone number',
    email VARCHAR(150) NULL COMMENT 'Optional emergency contact email address',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_emergency_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vec_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vec_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vec_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Visitor emergency contact information repository';

CREATE TABLE visitor_identity_verification (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique verification log identifier',
    verification_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor',
    visitor_document_id BIGINT UNSIGNED NULL COMMENT 'Reference to checked document, if applicable',
    verification_method ENUM('MANUAL', 'OCR', 'FACE_VERIFICATION', 'PASSPORT_SCANNER', 'NATIONAL_ID_SCANNER') NOT NULL COMMENT 'Method used to verify identity',
    verification_result ENUM('PASSED', 'FAILED', 'SUSPICIOUS') NOT NULL COMMENT 'Outcome of verification check',
    confidence_score DECIMAL(5, 2) NULL COMMENT 'Calculated similarity index or OCR matching score',
    verified_by BIGINT UNSIGNED NULL COMMENT 'Internal officer who performed or reviewed check',
    verification_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Verification timestamp',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_id_verification_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_id_verification_doc FOREIGN KEY (visitor_document_id) REFERENCES visitor_documents (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_id_verification_verifier FOREIGN KEY (verified_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_viv_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_viv_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_viv_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Identity validation log tracking biometric and document checks';

CREATE TABLE visitor_biometrics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique biometric record identifier',
    biometric_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor profile',
    biometric_type ENUM('FACE_TEMPLATE', 'FINGERPRINT_TEMPLATE', 'IRIS_TEMPLATE') NOT NULL COMMENT 'Biometric scan technology source',
    template_data_encrypted TEXT NOT NULL COMMENT 'Securely encrypted template hashing representation (strictly never raw image)',
    algorithm_version VARCHAR(50) NOT NULL COMMENT 'Biometric scanner model firmware version tracking',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_biometrics_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vb_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vb_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vb_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Stores encrypted physical biometrics signatures';

CREATE TABLE visitor_blacklist (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique blacklist registry identifier',
    blacklist_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to banned visitor',
    visitor_company_id BIGINT UNSIGNED NULL COMMENT 'Reference to company if all members are blocked',
    reason TEXT NOT NULL COMMENT 'Explicit security incident or administrative lockout cause description',
    blocked_by BIGINT UNSIGNED NOT NULL COMMENT 'Security or admin user logging the block',
    blocked_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Block activation timestamp',
    expiry_date DATETIME NULL COMMENT 'Optional block expiration threshold (null indicates permanent ban)',
    status ENUM('ACTIVE', 'REVOKED', 'EXPIRED') DEFAULT 'ACTIVE' COMMENT 'Active blacklist status indicators',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_blacklist_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_blacklist_company FOREIGN KEY (visitor_company_id) REFERENCES visitor_companies (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_blacklist_blocked_by FOREIGN KEY (blocked_by) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_vbl_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vbl_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vbl_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Deny-list registry for securing facilities against blacklisted visitors';

CREATE TABLE visitor_watchlist (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique watchlist identifier',
    watchlist_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to monitored visitor profile',
    watchlist_category ENUM('VIP', 'MEDIA', 'GOVERNMENT', 'LEGAL_INVESTIGATION', 'SENSITIVE_CONTRACTOR') NULL COMMENT 'Reason category for flagging',
    severity ENUM('low','medium','high','critical') DEFAULT 'medium' COMMENT 'Severity tier of the watchlist entry',
    reason TEXT NOT NULL COMMENT 'Detailed context for watchlist flag',
    added_by BIGINT UNSIGNED NOT NULL COMMENT 'User responsible for tracking addition',
    expires_at DATETIME NULL COMMENT 'Expiration datetime threshold',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_watchlist_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_watchlist_added_by FOREIGN KEY (added_by) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_vw_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vw_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vw_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Monitored visitor profiles requiring front-desk notifications or safety escorts';

CREATE TABLE visitor_preferences (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique preference index identifier',
    preference_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor profile',
    preferred_language VARCHAR(50) DEFAULT 'en' COMMENT 'ISO language code identifier',
    parking_required BOOLEAN DEFAULT FALSE COMMENT 'Indicates if facility vehicle parking space is needed',
    wheelchair_assistance BOOLEAN DEFAULT FALSE COMMENT 'Indicates accessibility accommodations are required',
    meal_preference VARCHAR(100) NULL COMMENT 'Dietary restriction notes for corporate catering',
    notification_preference ENUM('EMAIL', 'SMS', 'WHATSAPP', 'IN_APP', 'NONE') DEFAULT 'EMAIL' COMMENT 'Selected notifications channel',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_preferences_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vp_pref_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vp_pref_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vp_pref_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Stores accommodations and accessibility settings for returning guests';

CREATE TABLE visitor_tags (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique tag database key',
    tag_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    tag_name VARCHAR(80) NOT NULL COMMENT 'Label designation name (e.g. Supplier, Escort)',
    description TEXT NULL COMMENT 'Tag classification scope details',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_visitor_tags_name UNIQUE (tag_name),
    CONSTRAINT fk_tags_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_tags_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_tags_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Catalog of administrative categorizations and tags';

CREATE TABLE visitor_tag_mapping (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Junction map ID',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor',
    tag_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to tag',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Assignment timestamp',
    assigned_by BIGINT UNSIGNED NULL COMMENT 'User who assigned the tag',
    CONSTRAINT fk_tag_map_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_tag_map_tag FOREIGN KEY (tag_id) REFERENCES visitor_tags (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_tag_map_assigned_by FOREIGN KEY (assigned_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT uq_visitor_tag UNIQUE (visitor_id, tag_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Many-to-Many junction table linking visitors to tags';

CREATE TABLE visitor_notes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique notes log identifier',
    note_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor',
    note TEXT NOT NULL COMMENT 'Detailed note content text log',
    note_type VARCHAR(50) DEFAULT 'GENERAL' COMMENT 'Categorization type (e.g. Incident, Preference)',
    visibility ENUM('PUBLIC', 'PRIVATE', 'SECURITY_ONLY', 'MANAGEMENT_ONLY') DEFAULT 'PUBLIC' COMMENT 'RBAC visibility constraint rating',
    author_id BIGINT UNSIGNED NOT NULL COMMENT 'Internal user author identifier',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_notes_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notes_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_notes_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_notes_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_notes_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Unlimited textual notes associated with visitors';

CREATE TABLE visitor_status_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique status transaction history key',
    status_history_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor profile',
    status ENUM('REGISTERED', 'PENDING_APPROVAL', 'APPROVED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'BLACKLISTED') NOT NULL COMMENT 'Historical status state indicator',
    changed_by BIGINT UNSIGNED NOT NULL COMMENT 'User record changing the state',
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'State transition timestamp',
    change_reason TEXT NULL COMMENT 'Context explanations for status update',
    CONSTRAINT fk_sh_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sh_changed_by FOREIGN KEY (changed_by) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Immutable status history ledger tracking visitor lifecycle stages';

CREATE TABLE visitor_activity_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique activity audit log key',
    activity_log_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor profile',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Internal actor user executing action',
    action VARCHAR(100) NOT NULL COMMENT 'Specific event descriptor (e.g. PROFILE_UPDATE, BIO_SCAN)',
    module VARCHAR(100) NOT NULL DEFAULT 'VISITOR' COMMENT 'Referenced business engine location',
    description TEXT NOT NULL COMMENT 'Verbose audit description details',
    ip_address VARCHAR(45) NULL COMMENT 'IP used during log execution',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    CONSTRAINT fk_al_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_al_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Detailed security audit trail tracking admin/user changes to visitor profiles';

CREATE TABLE visitor_custom_fields (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique custom field metadata key',
    custom_field_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    field_name VARCHAR(100) NOT NULL COMMENT 'Developer key name (e.g. vehicle_plate, laptop_serial)',
    field_type ENUM('TEXT', 'NUMBER', 'BOOLEAN', 'DATE') DEFAULT 'TEXT' COMMENT 'Input data type validator',
    is_required BOOLEAN DEFAULT FALSE COMMENT 'Mandatory field input indicator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_visitor_custom_fields_name UNIQUE (field_name),
    CONSTRAINT fk_cf_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_cf_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_cf_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Schema extension registry for dynamic organizational fields';

CREATE TABLE visitor_custom_values (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique field-value database identifier',
    custom_value_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor',
    custom_field_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to mapped custom field metadata',
    field_value TEXT NOT NULL COMMENT 'Assigned string or serialized value representation',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_val_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_val_field FOREIGN KEY (custom_field_id) REFERENCES visitor_custom_fields (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cv_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_cv_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_cv_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT uq_visitor_field UNIQUE (visitor_id, custom_field_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Dynamic values corresponding to custom fields for specific visitors';

CREATE TABLE visitor_relationships (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique relationship linking database key',
    relationship_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Primary visitor identifier',
    related_visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Secondary/target associated visitor identifier',
    relationship_type ENUM('PARENT', 'CHILD', 'COLLEAGUE', 'DRIVER', 'ASSISTANT', 'INTERPRETER', 'SECURITY_ESCORT') NOT NULL COMMENT 'Relational connection category',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp for soft deletion',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_rel_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rel_related FOREIGN KEY (related_visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vr_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vr_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vr_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT uq_visitor_relationship UNIQUE (visitor_id, related_visitor_id, relationship_type)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Links relationships between different concurrent visitors';

CREATE TABLE agreements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique agreement identifier',
    agreement_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    title VARCHAR(150) NOT NULL COMMENT 'Agreement title (e.g., NDA, Code of Conduct)',
    content TEXT NOT NULL COMMENT 'Full text of the legal terms',
    version VARCHAR(20) NOT NULL COMMENT 'Document version tracking',
    is_required BOOLEAN DEFAULT TRUE COMMENT 'Indicates if agreement signature is mandatory',
    status ENUM('ACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE' COMMENT 'Agreement lifecycle status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Legal policies and NDAs for visitor signatures';

CREATE TABLE visitor_signatures (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Signature transaction ID',
    signature_id BIGINT UNSIGNED NULL UNIQUE,
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Visitor signing agreement',
    agreement_id BIGINT UNSIGNED NOT NULL COMMENT 'Agreement structure signed',
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Signing timestamp',
    ip_address VARCHAR(45) NULL COMMENT 'IP used during sign-off',
    signature_image_url VARCHAR(500) NULL COMMENT 'Optional path to signature input draw',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_vs_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vs_agreement FOREIGN KEY (agreement_id) REFERENCES agreements (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Captures visitor signatures for NDA compliance audit';

-- =====================================================================================
-- 6. APPOINTMENT SYSTEM (REQUESTS, APPROVALS, WORKFLOWS)
-- =====================================================================================

-- Table 1: appointment_types
CREATE TABLE appointment_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique identifier for the appointment type',
    appointment_type_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique type lookup code',
    name VARCHAR(100) NOT NULL COMMENT 'Display name of the appointment type',
    description TEXT NULL COMMENT 'Detailed definition of the appointment type',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if the type is available for booking',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_appointment_types_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_types_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_types_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Classifies standard categories of appointments';

-- Table 2: visit_purposes
CREATE TABLE visit_purposes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique identifier for the visit purpose',
    visit_purpose_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique purpose lookup code',
    name VARCHAR(100) NOT NULL COMMENT 'Display name of the visit purpose',
    description TEXT NULL COMMENT 'Detailed definition of the purpose',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if the purpose is available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_visit_purposes_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_visit_purposes_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_visit_purposes_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Pre-configured business reasons for visit requests';

-- Table 3: approval_workflows
-- Table 3: approval_workflows
CREATE TABLE approval_workflows (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique identifier for the workflow',
    workflow_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    name VARCHAR(100) NOT NULL COMMENT 'Display name of the workflow configuration',
    description TEXT NULL COMMENT 'Summary of the workflow chain logic',
    department_id BIGINT UNSIGNED NULL COMMENT 'Department context',
    levels INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Number of approval levels required',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if this configuration is active',
    escalation_timeout_minutes INT UNSIGNED NOT NULL DEFAULT 60 COMMENT 'Timeout before escalation is triggered',
    auto_approval_enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if auto-approval rule is enabled',
    auto_rejection_enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if auto-rejection rule is enabled',
    
    -- Module 6 versioning fields
    version_major INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Major version number',
    version_minor INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Minor version number',
    is_latest BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Flags latest active version',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_approval_workflows_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_approval_workflows_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_approval_workflows_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_approval_workflows_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_workflow_levels CHECK (levels > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Defines department-level visitor approval workflow logic';

-- Table 3b: approval_steps (Preserved & extended from legacy schema)
CREATE TABLE approval_steps (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    workflow_id BIGINT UNSIGNED NOT NULL,
    level INT UNSIGNED NOT NULL,
    approver_role_id BIGINT UNSIGNED NULL,
    approver_role VARCHAR(50) NULL COMMENT 'Target role name representation',
    approver_id BIGINT UNSIGNED NULL,
    
    -- Module 6 step configuration fields
    step_name VARCHAR(100) NULL COMMENT 'Display name of step',
    sequence_number INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Evaluation order number',
    logic_operator ENUM('AND', 'OR', 'NONE') NOT NULL DEFAULT 'NONE' COMMENT 'Parallel evaluation logic',
    approval_type ENUM('ROLE', 'USER', 'ANY_OF_ROLE', 'ALL_OF_ROLE') NOT NULL DEFAULT 'USER' COMMENT 'Routing type constraint',
    sla_minutes INT UNSIGNED NULL COMMENT 'SLA time constraint in minutes',
    action_type ENUM('APPROVE', 'REJECT', 'ESCALATE', 'ROUTE') NOT NULL DEFAULT 'APPROVE' COMMENT 'Default routing action',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Flags if step is evaluated',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_approval_steps_workflow FOREIGN KEY (workflow_id) REFERENCES approval_workflows (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_approval_steps_role FOREIGN KEY (approver_role_id) REFERENCES roles (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_approval_steps_user FOREIGN KEY (approver_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_approval_steps_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_approval_steps_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_approval_steps_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT idx_workflow_level UNIQUE (workflow_id, level)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Configures specific approval step criteria';

-- Table 5: appointments (Merged definitions for 100% backward compatibility)
CREATE TABLE appointments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique appointment identifier',
    appointment_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    appointment_number VARCHAR(50) NOT NULL UNIQUE COMMENT 'Enterprise alphanumeric tracking code',
    organization_id BIGINT UNSIGNED NULL COMMENT 'FK to organizations — multi-tenant data isolation',
    facility_id BIGINT UNSIGNED NULL COMMENT 'Reference to facility site',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor profile',
    host_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to employee host',
    department_id BIGINT UNSIGNED NOT NULL COMMENT 'Department hosting the meeting',
    appointment_type_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to category of appointment',
    visit_purpose_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to pre-configured reason of visit',
    room_id BIGINT UNSIGNED NULL COMMENT 'Allocated meeting room',
    scheduled_start DATETIME NOT NULL COMMENT 'Proposed start datetime',
    scheduled_end DATETIME NOT NULL COMMENT 'Proposed end datetime',
    expected_duration_minutes INT UNSIGNED NOT NULL COMMENT 'Stated duration of stay in minutes',
    priority ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM' COMMENT 'Criticality of appointment',
    approval_status ENUM('PENDING', 'APPROVED', 'REJECTED', 'ESC_PENDING') NOT NULL DEFAULT 'PENDING' COMMENT 'Current approval validation state',
    appointment_status ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED') NOT NULL DEFAULT 'REQUESTED' COMMENT 'Operational status',
    security_level ENUM('NORMAL', 'RESTRICTED', 'HIGH_SECURITY') NOT NULL DEFAULT 'NORMAL' COMMENT 'Security classification',
    visitor_count INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Total group size of visitors',
    remarks TEXT NULL COMMENT 'Additional instructions or host remarks',
    is_cancelled BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags cancelled appointments',
    is_completed BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags finished visits',
    
    -- Legacy Backward-Compatibility fields
    purpose TEXT NULL COMMENT 'Stated business goal for the visit',
    category ENUM('meeting','interview','audit','delivery','maintenance','vip_visit') DEFAULT 'meeting' COMMENT 'Nature of the appointment',
    duration_minutes INT UNSIGNED DEFAULT 60 COMMENT 'Calculated duration in minutes',
    status ENUM('draft','pending_approval','approved','rescheduled','rejected','checked_in','checked_out','cancelled','no_show') DEFAULT 'pending_approval',
    cancellation_reason VARCHAR(255) COMMENT 'Reason if visitor/host cancels',
    approval_deadline DATETIME COMMENT 'Cutoff date-time before which appointment must be approved',
    reference_code VARCHAR(50) NULL UNIQUE COMMENT 'Short alphanumeric tracking code',
    current_approval_level INT UNSIGNED DEFAULT 1 COMMENT 'Current stage in approval chain',
    special_instructions TEXT COMMENT 'Specific requests or directives',
    verification_status ENUM('unverified','verified','manual_review','failed') DEFAULT 'unverified',
    similarity_score DECIMAL(5, 2) NULL COMMENT 'Result score from facial check',
    verified_at TIMESTAMP NULL COMMENT 'Time facial scan was verified',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_appointments_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_appointments_facility FOREIGN KEY (facility_id) REFERENCES facilities (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_appointments_visitor FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_host FOREIGN KEY (host_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_type FOREIGN KEY (appointment_type_id) REFERENCES appointment_types(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_purpose FOREIGN KEY (visit_purpose_id) REFERENCES visit_purposes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_room FOREIGN KEY (room_id) REFERENCES meeting_rooms(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointments_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointments_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointments_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_app_times CHECK (scheduled_end > scheduled_start),
    CONSTRAINT chk_app_duration CHECK (expected_duration_minutes > 0),
    CONSTRAINT chk_app_visitor_count CHECK (visitor_count > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Visitor scheduling registrations and details';

-- Table 6: appointment_approvals
-- Table 6: appointment_approvals
CREATE TABLE appointment_approvals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique approval validation record',
    approval_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    appointment_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to appointment',
    approver_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to verifying employee',
    approval_level INT UNSIGNED NOT NULL COMMENT 'Approval workflow rank level',
    decision ENUM('PENDING', 'APPROVED', 'REJECTED', 'DELEGATED', 'ESCALATED', 'BYPASSED') NOT NULL DEFAULT 'PENDING' COMMENT 'Approval level result',
    decided_at DATETIME NULL COMMENT 'Time decision was logged',
    comments TEXT NULL COMMENT 'Approver comment logs',
    is_delegated BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags delegated approvals',
    delegated_to_id BIGINT UNSIGNED NULL COMMENT 'Reference to delegated employee',
    duration_seconds INT UNSIGNED NULL COMMENT 'Validation turnaround speed tracking',
    
    -- Module 6 workflow tracking fields
    step_id BIGINT UNSIGNED NULL COMMENT 'Reference to specific step configuration',
    sla_due_at DATETIME NULL COMMENT 'Deadline before SLA escalation is triggered',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_appointment_approvals_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_appointment_approvals_approver FOREIGN KEY (approver_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_appointment_approvals_delegated FOREIGN KEY (delegated_to_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_approvals_step FOREIGN KEY (step_id) REFERENCES approval_steps(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_approvals_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_approvals_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_approvals_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_approval_level CHECK (approval_level > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Decision pipeline record tracking per appointment';

-- Table 7: appointment_status_history
CREATE TABLE appointment_status_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique history record identifier',
    history_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    appointment_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to appointment',
    old_status ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED') NULL COMMENT 'Previous status state',
    new_status ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED') NOT NULL COMMENT 'Current status state',
    change_reason TEXT NULL COMMENT 'Explanation of change',
    changed_by BIGINT UNSIGNED NOT NULL COMMENT 'Reference to editor user',
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Audit timestamp',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_appointment_status_history_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_appointment_status_history_changer FOREIGN KEY (changed_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_appointment_status_history_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_status_history_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_status_history_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Audit history tracking of operational status changes';

-- Table 8: appointment_reschedule_history
CREATE TABLE appointment_reschedule_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique reschedule history record',
    reschedule_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    appointment_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to appointment',
    old_start_date DATETIME NOT NULL COMMENT 'Previous planned start time',
    new_start_date DATETIME NOT NULL COMMENT 'New planned start time',
    old_end_date DATETIME NOT NULL COMMENT 'Previous planned end time',
    new_end_date DATETIME NOT NULL COMMENT 'New planned end time',
    reason TEXT NULL COMMENT 'Stated rescheduling reason',
    changed_by BIGINT UNSIGNED NOT NULL COMMENT 'Employee rescheduling request initiator',
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_appointment_reschedule_history_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_appointment_reschedule_history_changer FOREIGN KEY (changed_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_appointment_reschedule_history_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_reschedule_history_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_reschedule_history_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Audit logs documenting timeline modifications';

-- Table 9: appointment_cancellations
CREATE TABLE appointment_cancellations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique cancellation record',
    cancellation_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    appointment_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to appointment',
    cancelled_by BIGINT UNSIGNED NOT NULL COMMENT 'Initiating user user ID',
    cancellation_reason TEXT NULL COMMENT 'Detailed explanation',
    refund_required BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags billing action items',
    notification_sent BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Confirms visitor notification dispatch',
    cancelled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_appointment_cancellations_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_appointment_cancellations_changer FOREIGN KEY (cancelled_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_appointment_cancellations_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_cancellations_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_cancellations_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Cancellation records of deactivated meetings';

-- Table 10: room_bookings
CREATE TABLE room_bookings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique booking reservation ID',
    booking_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    appointment_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to appointment',
    room_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to meeting room',
    booking_start DATETIME NOT NULL COMMENT 'Reservation start time',
    booking_end DATETIME NOT NULL COMMENT 'Reservation end time',
    booking_status ENUM('CONFIRMED', 'CANCELLED', 'CONFLICTED') NOT NULL DEFAULT 'CONFIRMED' COMMENT 'Scheduling status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_room_bookings_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_room_bookings_room FOREIGN KEY (room_id) REFERENCES meeting_rooms(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_room_bookings_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_room_bookings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_room_bookings_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_rb_times CHECK (booking_end > booking_start)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Protects meeting rooms against double bookings';

-- Table 11: recurring_appointments
CREATE TABLE recurring_appointments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique recurrence configuration record',
    recurrence_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    appointment_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to parent appointment template',
    recurrence_pattern ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM') NOT NULL COMMENT 'Recurrence period scale',
    recurrence_interval INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Frequency frequency factor (every N times)',
    recurrence_end_date DATE NULL COMMENT 'Expiration limit date for recurrences',
    recurrence_rules TEXT NULL COMMENT 'JSON rules mapping configuration',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_recurring_appointments_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_recurring_appointments_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_recurring_appointments_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_recurring_appointments_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_rca_interval CHECK (recurrence_interval > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Configuration registry for recurring visits patterns';

-- Table 12: calendar_events
-- Table 12: calendar_events (Unified local scheduling & sync connector)
CREATE TABLE calendar_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique event identifier',
    event_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    appointment_id BIGINT UNSIGNED NULL COMMENT 'Reference to appointment (optional)',
    title VARCHAR(255) NULL COMMENT 'Event summary title',
    description TEXT NULL COMMENT 'Event details',
    event_type ENUM('APPOINTMENT', 'MEETING', 'VISITOR_ARRIVAL', 'TRAINING', 'MAINTENANCE', 'HOLIDAY', 'SECURITY_SHIFT') NOT NULL DEFAULT 'MEETING' COMMENT 'Event classification type',
    start_datetime DATETIME NULL COMMENT 'Event start time',
    end_datetime DATETIME NULL COMMENT 'Event end time',
    all_day BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags all-day general event',
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC' COMMENT 'Time zone identifier',
    status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'TENTATIVE') NOT NULL DEFAULT 'CONFIRMED' COMMENT 'Event status tracking',
    priority ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM' COMMENT 'Event priority level',
    color VARCHAR(7) NULL DEFAULT '#3b82f6' COMMENT 'Display hexadecimal color representation',
    visibility ENUM('PUBLIC', 'PRIVATE', 'CONFIDENTIAL') NOT NULL DEFAULT 'PUBLIC' COMMENT 'Event visibility restrictions',
    
    -- Synchronization fields
    provider ENUM('GOOGLE', 'OUTLOOK', 'INTERNAL') NOT NULL DEFAULT 'INTERNAL' COMMENT 'Calendar provider source identifier',
    external_event_id VARCHAR(255) NULL COMMENT 'Calendar system ID link key',
    sync_status ENUM('SUCCESS', 'FAILED', 'OUT_OF_SYNC') NOT NULL DEFAULT 'SUCCESS' COMMENT 'Latest sync state',
    last_sync_at DATETIME NULL COMMENT 'Time synchronization executed',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_calendar_events_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_calendar_events_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_calendar_events_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_calendar_events_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Keeps external enterprise calendars fully synchronized';

-- Table 13: appointment_participants
CREATE TABLE appointment_participants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique participant junction row',
    participant_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    appointment_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to appointment',
    participant_type ENUM('VISITOR', 'HOST', 'EMPLOYEE', 'INTERPRETER', 'SECURITY_OFFICER', 'ASSISTANT', 'OBSERVER') NOT NULL COMMENT 'Role of participant',
    user_id BIGINT UNSIGNED NULL COMMENT 'Reference to internal user account (if employee)',
    visitor_id BIGINT UNSIGNED NULL COMMENT 'Reference to external visitor profile (if visitor)',
    name VARCHAR(150) NOT NULL COMMENT 'Display name of participant',
    email VARCHAR(150) NULL COMMENT 'Email contact information',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_appointment_participants_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_appointment_participants_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_participants_visitor FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_participants_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_participants_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_participants_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Lists all internal/external meeting participants';

-- Table 14: appointment_documents (Merged backward compatibility properties)
CREATE TABLE appointment_documents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique document registry row',
    document_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    appointment_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to appointment',
    document_name VARCHAR(255) NOT NULL COMMENT 'Clean name of the uploaded document file',
    document_type ENUM('INVITATION_LETTER', 'PURCHASE_ORDER', 'QUOTATION', 'GOVERNMENT_LETTER', 'APPROVAL_LETTER', 'AGENDA', 'IDENTITY_DOCUMENT', 'CONTRACT', 'OTHER') NOT NULL COMMENT 'Document category classification',
    file_url VARCHAR(500) NOT NULL COMMENT 'Secure file storage location path',
    file_size_bytes BIGINT UNSIGNED NULL COMMENT 'Document file size details',
    upload_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' COMMENT 'Document availability state',
    
    -- Legacy Backward-Compatibility fields
    file_name VARCHAR(255) NULL COMMENT 'Base name of the uploaded file',
    doc_type VARCHAR(50) NULL COMMENT 'Document categorization',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Upload timestamp',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_appointment_documents_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_appointment_documents_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_documents_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_documents_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Metadata registry for appointment documents and contracts';

-- Table 15: appointment_notes
CREATE TABLE appointment_notes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique note comment identifier',
    note_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    appointment_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to appointment',
    note_type ENUM('INTERNAL', 'PUBLIC', 'CONFIDENTIAL') NOT NULL DEFAULT 'INTERNAL' COMMENT 'Visibility restriction categorization',
    note_text TEXT NOT NULL COMMENT 'Note text log',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags pinned notes displayed on top',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_appointment_notes_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_appointment_notes_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_notes_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_notes_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Memo logs, directions, and remarks for appointments';

-- Table 16: appointment_notifications
CREATE TABLE appointment_notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique notification record',
    notification_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    appointment_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to appointment context',
    channel ENUM('EMAIL', 'SMS', 'PUSH', 'WHATSAPP') NOT NULL COMMENT 'Operational channel type',
    recipient VARCHAR(150) NOT NULL COMMENT 'Target address details (email or phone)',
    subject VARCHAR(255) NULL COMMENT 'Notification title (if email)',
    message_body TEXT NOT NULL COMMENT 'Content logs',
    status ENUM('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED') NOT NULL DEFAULT 'QUEUED' COMMENT 'Delivery dispatch status',
    retry_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of retry dispatches',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_appointment_notifications_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_appointment_notifications_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_notifications_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_notifications_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Audit tracking of dispatched visitor notifications';

-- Table 17: appointment_checklists
CREATE TABLE appointment_checklists (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique checklist item',
    checklist_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    appointment_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to appointment',
    task_name VARCHAR(100) NOT NULL COMMENT 'Checklist task name description',
    is_completed BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags completed items',
    completed_by BIGINT UNSIGNED NULL COMMENT 'Reference to verifying employee',
    completed_at DATETIME NULL COMMENT 'Audit log timestamp',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_appointment_checklists_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_appointment_checklists_user FOREIGN KEY (completed_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_checklists_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_checklists_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_checklists_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Audit checklists validation status before/during check-in';

-- Table 18: parking_reservations
CREATE TABLE parking_reservations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique parking reservation row',
    reservation_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    appointment_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to appointment',
    vehicle_plate VARCHAR(30) NOT NULL COMMENT 'Registration plate number of vehicle',
    vehicle_type VARCHAR(50) NULL COMMENT 'Vehicle descriptions (e.g. Sedan, SUV)',
    parking_slot VARCHAR(50) NOT NULL COMMENT 'Allocated parking code identifier',
    expected_arrival DATETIME NOT NULL COMMENT 'Proposed reservation start',
    expected_departure DATETIME NOT NULL COMMENT 'Proposed reservation end',
    status ENUM('RESERVED', 'OCCUPIED', 'RELEASED', 'CANCELLED') NOT NULL DEFAULT 'RESERVED' COMMENT 'Booking status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_parking_reservations_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_parking_reservations_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_parking_reservations_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_parking_reservations_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_parking_times CHECK (expected_departure > expected_arrival)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Visitor parking reservations data';

-- Table 19: escort_assignments
CREATE TABLE escort_assignments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique escort assignment row',
    escort_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    appointment_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to appointment context',
    escort_user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to internal host/escort user',
    security_officer_id BIGINT UNSIGNED NULL COMMENT 'Reference to security companion (if high risk)',
    assigned_at DATETIME NOT NULL COMMENT 'Timestamps of escort initialization',
    completed_at DATETIME NULL COMMENT 'Timestamps of escort completion',
    status ENUM('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ASSIGNED' COMMENT 'Escort assignment state',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_escort_assignments_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_escort_assignments_user FOREIGN KEY (escort_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_escort_assignments_sec FOREIGN KEY (security_officer_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_escort_assignments_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_escort_assignments_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_escort_assignments_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Mandatory escort logs mapping visitors to security hosts';

-- Table 20: appointment_activity_logs
CREATE TABLE appointment_activity_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique log identifier',
    log_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    appointment_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to appointment',
    action VARCHAR(100) NOT NULL COMMENT 'Action tag logged',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Initiator user account ID',
    action_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Audit timestamp',
    ip_address VARCHAR(45) NULL COMMENT 'IP context of initiator',
    device_info VARCHAR(255) NULL COMMENT 'Agent metadata context of device',
    description TEXT NULL COMMENT 'Detailed breakdown log description',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_appointment_activity_logs_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_appointment_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_appointment_activity_logs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_activity_logs_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_appointment_activity_logs_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Enterprise activity trails logging actions on appointments';

-- Table 1: approval_conditions
CREATE TABLE approval_conditions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique condition identifier',
    workflow_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to target approval workflow',
    field_name VARCHAR(100) NOT NULL COMMENT 'Target evaluation column of appointments table',
    operator VARCHAR(20) NOT NULL COMMENT 'Comparison operator (e.g. =, >, <, IN, BETWEEN)',
    field_value VARCHAR(255) NOT NULL COMMENT 'Value used for routing comparison',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if the condition is evaluated',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_approval_conditions_workflow FOREIGN KEY (workflow_id) REFERENCES approval_workflows (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_approval_conditions_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_approval_conditions_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_approval_conditions_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Conditional routing configuration for selecting workflows';

-- Table 2: approval_delegations
CREATE TABLE approval_delegations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique delegation identifier',
    delegator_id BIGINT UNSIGNED NOT NULL COMMENT 'Approver user ID assigning the authorization',
    delegate_id BIGINT UNSIGNED NOT NULL COMMENT 'Backup user ID receiving the authorization',
    start_date DATETIME NOT NULL COMMENT 'Activation date-time',
    end_date DATETIME NOT NULL COMMENT 'Deactivation date-time',
    reason TEXT NULL COMMENT 'Stated business reason of delegation',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if the delegation is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_approval_delegations_delegator FOREIGN KEY (delegator_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_approval_delegations_delegate FOREIGN KEY (delegate_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_approval_delegations_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_approval_delegations_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_approval_delegations_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_delegation_dates CHECK (end_date > start_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Manages temporary workflow authorization delegation rules';

-- Table 3: approval_comments
CREATE TABLE approval_comments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique comment identifier',
    appointment_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to appointment target',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'User author ID',
    comment_text TEXT NOT NULL COMMENT 'Stated feedback text',
    parent_comment_id BIGINT UNSIGNED NULL COMMENT 'Self-referencing field for reply threads',
    attachment_url VARCHAR(500) NULL COMMENT 'Optional path link to verification file upload',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_approval_comments_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_approval_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_approval_comments_parent FOREIGN KEY (parent_comment_id) REFERENCES approval_comments(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_approval_comments_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_approval_comments_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_approval_comments_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Discussion memos and rejection feedback logs';

-- Table 4: approval_history
CREATE TABLE approval_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique audit trail identifier',
    appointment_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to appointment target',
    workflow_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to workflow definition',
    step_id BIGINT UNSIGNED NULL COMMENT 'Reference to workflow step',
    approver_id BIGINT UNSIGNED NOT NULL COMMENT 'User ID who performed the action',
    action ENUM('SUBMIT', 'APPROVE', 'REJECT', 'DELEGATE', 'ESCALATE', 'RESUBMIT') NOT NULL COMMENT 'Logged step decision',
    comment TEXT NULL COMMENT 'Comment copy at decision time',
    action_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Log timestamp',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_approval_history_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_approval_history_workflow FOREIGN KEY (workflow_id) REFERENCES approval_workflows(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_approval_history_step FOREIGN KEY (step_id) REFERENCES approval_steps(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_approval_history_approver FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_approval_history_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_approval_history_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_approval_history_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Immutable decision audit trail of appointment workflow stages';

-- Table 5: approval_escalations
CREATE TABLE approval_escalations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique escalation log ID',
    appointment_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to appointment target',
    approval_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to the active approval level record',
    step_id BIGINT UNSIGNED NULL COMMENT 'Reference to workflow step definition',
    original_approver_id BIGINT UNSIGNED NOT NULL COMMENT 'Target user ID who missed the deadline',
    escalated_to_id BIGINT UNSIGNED NOT NULL COMMENT 'Backup manager user ID who received the task',
    escalation_reason TEXT NULL COMMENT 'Audit text detailing SLA timeout context',
    status ENUM('PENDING', 'RESOLVED', 'CANCELLED') NOT NULL DEFAULT 'PENDING' COMMENT 'Current escalation action state',
    escalated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'SLA trigger dispatch time',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_approval_escalations_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_approval_escalations_approval FOREIGN KEY (approval_id) REFERENCES appointment_approvals(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_approval_escalations_step FOREIGN KEY (step_id) REFERENCES approval_steps(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_approval_escalations_original FOREIGN KEY (original_approver_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_approval_escalations_escalated FOREIGN KEY (escalated_to_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_approval_escalations_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_approval_escalations_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_approval_escalations_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'SLA escalation path and validation records';

-- Table 6: approval_notifications
CREATE TABLE approval_notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique notify record ID',
    appointment_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to appointment target',
    recipient_id BIGINT UNSIGNED NOT NULL COMMENT 'Target employee user ID',
    notification_type ENUM('PENDING_ACTION', 'REACTION', 'REMINDER', 'ESCALATION_NOTICE') NOT NULL COMMENT 'Notification context definition',
    channel ENUM('EMAIL', 'SMS', 'PUSH', 'IN_APP') NOT NULL DEFAULT 'IN_APP' COMMENT 'Transmission system selector',
    sent_at DATETIME NULL COMMENT 'Time transmission succeeded',
    status ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING' COMMENT 'Transmission progress indicator',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_approval_notifications_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_approval_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_approval_notifications_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_approval_notifications_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_approval_notifications_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'System reminders and delivery logging for workflows';

-- Table 7: approval_audit_logs
CREATE TABLE approval_audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique audit row ID',
    user_id BIGINT UNSIGNED NULL COMMENT 'Initiator user account ID',
    action VARCHAR(100) NOT NULL COMMENT 'System event type (e.g. CONFIG_CHANGED)',
    ip_address VARCHAR(45) NULL COMMENT 'Source network IP context',
    user_agent VARCHAR(255) NULL COMMENT 'Browser/App agent context',
    description TEXT NULL COMMENT 'Detailed breakdown of rule changes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Log time',
    
    CONSTRAINT fk_approval_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Workflow engine security configuration activity trail';

-- Table 1: calendar_event_participants
CREATE TABLE calendar_event_participants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique participant junction identifier',
    event_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to parent calendar event',
    user_id BIGINT UNSIGNED NULL COMMENT 'Reference to internal user (if employee/host/security)',
    visitor_id BIGINT UNSIGNED NULL COMMENT 'Reference to external visitor (if visitor)',
    role_type ENUM('HOST', 'VISITOR', 'SECURITY', 'RECEPTIONIST', 'ORGANIZER', 'ATTENDEE') NOT NULL DEFAULT 'ATTENDEE' COMMENT 'Participant function role context',
    rsvp_status ENUM('ACCEPTED', 'DECLINED', 'TENTATIVE', 'PENDING') NOT NULL DEFAULT 'PENDING' COMMENT 'RSVP feedback status state',
    response_time DATETIME NULL COMMENT 'Audit log timestamp when response was registered',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_event_participants_event FOREIGN KEY (event_id) REFERENCES calendar_events (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_event_participants_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_event_participants_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_event_participants_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_event_participants_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_event_participants_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Event attendee response mapping tracking records';

-- Table 2: calendar_resources
CREATE TABLE calendar_resources (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique resource catalog identifier',
    resource_type ENUM('MEETING_ROOM', 'VEHICLE', 'LAPTOP', 'PROJECTOR', 'CONFERENCE_HALL', 'PARKING_SLOT', 'RECEPTION_DESK', 'OTHER') NOT NULL COMMENT 'Resource type categorization',
    resource_name VARCHAR(150) NOT NULL COMMENT 'Clean name descriptor',
    resource_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique inventory asset tag identifier',
    capacity INT UNSIGNED NULL COMMENT 'Maximum seating capacity (if hall or room)',
    location VARCHAR(255) NULL COMMENT 'Physical location of resource',
    availability_status ENUM('AVAILABLE', 'BOOKED', 'MAINTENANCE', 'RETIRED') NOT NULL DEFAULT 'AVAILABLE' COMMENT 'Current operational status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if the resource is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_calendar_resources_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_calendar_resources_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_calendar_resources_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bookable assets inventory for visits and scheduling';

-- Table 3: resource_bookings
CREATE TABLE resource_bookings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique resource booking transaction identifier',
    resource_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to target bookable resource',
    appointment_id BIGINT UNSIGNED NULL COMMENT 'Reference to appointment context (if visit-related)',
    event_id BIGINT UNSIGNED NULL COMMENT 'Reference to general event context (if non-visit related)',
    booking_start DATETIME NOT NULL COMMENT 'Reservation timeline start',
    booking_end DATETIME NOT NULL COMMENT 'Reservation timeline end',
    booking_reason TEXT NULL COMMENT 'Stated business usage reason',
    approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING' COMMENT 'Resource reservation authorization status',
    conflict_status ENUM('NO_CONFLICT', 'CONFLICT') NOT NULL DEFAULT 'NO_CONFLICT' COMMENT 'Overlapping collision validation status',
    resource_owner_id BIGINT UNSIGNED NULL COMMENT 'Employee user ID hosting resource ownership',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_resource_bookings_res FOREIGN KEY (resource_id) REFERENCES calendar_resources (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_resource_bookings_app FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_resource_bookings_event FOREIGN KEY (event_id) REFERENCES calendar_events (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_resource_bookings_owner FOREIGN KEY (resource_owner_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_resource_bookings_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_resource_bookings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_resource_bookings_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_rb_booking_times CHECK (booking_end > booking_start)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Protects physical assets against double bookings';

-- Table 4: employee_working_hours
CREATE TABLE employee_working_hours (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique working hour configuration',
    employee_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to target staff profile',
    weekday ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL COMMENT 'Workday',
    start_time TIME NOT NULL COMMENT 'Shift duty start',
    end_time TIME NOT NULL COMMENT 'Shift duty end',
    break_start TIME NULL COMMENT 'Break timeline start',
    break_end TIME NULL COMMENT 'Break timeline end',
    max_appointments INT UNSIGNED NULL COMMENT 'Threshold limit of appointments per shift',
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC' COMMENT 'Shift timezone rules',
    effective_start_date DATE NOT NULL COMMENT 'Config starting validation range',
    effective_end_date DATE NULL COMMENT 'Config ending validation range (optional)',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if working hours config is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_employee_working_hours_emp FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_employee_working_hours_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_employee_working_hours_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_employee_working_hours_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_ewh_working_times CHECK (end_time > start_time),
    CONSTRAINT chk_ewh_break_times CHECK (break_end IS NULL OR break_start IS NULL OR break_end > break_start)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Staff weekly schedules and availability parameters';

-- Table 5: employee_time_off
CREATE TABLE employee_time_off (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique leave record ID',
    employee_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to target staff profile',
    time_off_type ENUM('VACATION', 'LEAVE', 'SICK_LEAVE', 'TRAINING', 'BUSINESS_TRAVEL', 'EMERGENCY_LEAVE', 'OTHER') NOT NULL DEFAULT 'VACATION' COMMENT 'Type of leave selection',
    start_datetime DATETIME NOT NULL COMMENT 'Leave start datetime',
    end_datetime DATETIME NOT NULL COMMENT 'Leave end datetime',
    reason TEXT NULL COMMENT 'Stated absence justification text',
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING' COMMENT 'Authorization status state',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_employee_time_off_emp FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_employee_time_off_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_employee_time_off_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_employee_time_off_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_eto_times CHECK (end_datetime > start_datetime)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Tracks approved leaves that block scheduling slots';

-- Table 6: organization_holidays
CREATE TABLE organization_holidays (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique holiday configuration ID',
    name VARCHAR(150) NOT NULL COMMENT 'Display name of holiday event',
    holiday_date DATE NOT NULL COMMENT 'Calendar date',
    holiday_type ENUM('NATIONAL', 'REGIONAL', 'COMPANY', 'DEPARTMENT') NOT NULL DEFAULT 'NATIONAL' COMMENT 'Scope of holiday rules',
    department_id BIGINT UNSIGNED NULL COMMENT 'Department context (if department holiday)',
    facility_id BIGINT UNSIGNED NULL COMMENT 'Facility location context (if regional holiday)',
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if holiday occurs annually',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_org_holidays_dept FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_org_holidays_facility FOREIGN KEY (facility_id) REFERENCES facilities (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_org_holidays_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_org_holidays_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_org_holidays_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'National, location, and departmental holiday closures';

-- Table 7: calendar_time_slots
CREATE TABLE calendar_time_slots (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique generated time slot identifier',
    slot_start DATETIME NOT NULL COMMENT 'Proposed booking slot start time',
    slot_end DATETIME NOT NULL COMMENT 'Proposed booking slot end time',
    slot_duration_minutes INT UNSIGNED NOT NULL DEFAULT 30 COMMENT 'Interval width of slot',
    availability_status ENUM('FREE', 'HELD', 'BOOKED') NOT NULL DEFAULT 'FREE' COMMENT 'Current reservation state',
    capacity INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Maximum parallel capacity slot limits',
    
    -- Option contexts
    resource_id BIGINT UNSIGNED NULL COMMENT 'Reference to bookable resource (if slot is resource)',
    employee_id BIGINT UNSIGNED NULL COMMENT 'Reference to employee calendar context',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_time_slots_res FOREIGN KEY (resource_id) REFERENCES calendar_resources (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_time_slots_emp FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_time_slots_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_time_slots_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_time_slots_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_ts_times CHECK (slot_end > slot_start),
    CONSTRAINT chk_ts_duration CHECK (slot_duration_minutes > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Pre-generated booking slots for fast frontend lookup';

-- Table 8: schedule_conflicts
CREATE TABLE schedule_conflicts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique scheduling conflict log',
    conflict_type ENUM('DOUBLE_BOOKING', 'OUTSIDE_WORKING_HOURS', 'HOLIDAY', 'EMPLOYEE_LEAVE', 'ROOM_OCCUPIED', 'RESOURCE_OCCUPIED', 'SECURITY_CONFLICT') NOT NULL COMMENT 'Collision category explanation',
    severity ENUM('WARNING', 'BLOCKING') NOT NULL DEFAULT 'BLOCKING' COMMENT 'Intervention severity indicator',
    resolution_status ENUM('UNRESOLVED', 'RESOLVED', 'BYPASSED') NOT NULL DEFAULT 'UNRESOLVED' COMMENT 'Handling progress tracking status',
    description TEXT NULL COMMENT 'Audit text details explaining context',
    
    -- Target contexts
    first_event_id BIGINT UNSIGNED NULL COMMENT 'Reference to original overlapping event',
    second_event_id BIGINT UNSIGNED NULL COMMENT 'Reference to secondary conflicting event',
    resource_booking_id BIGINT UNSIGNED NULL COMMENT 'Reference to resource booking collision',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_schedule_conflicts_first FOREIGN KEY (first_event_id) REFERENCES calendar_events (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_schedule_conflicts_second FOREIGN KEY (second_event_id) REFERENCES calendar_events (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_schedule_conflicts_rb FOREIGN KEY (resource_booking_id) REFERENCES resource_bookings (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_schedule_conflicts_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_schedule_conflicts_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_schedule_conflicts_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Tracks scheduling exceptions for dashboard verification';

-- Table 9: recurring_schedules
CREATE TABLE recurring_schedules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique recurrence configuration log',
    event_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to parent model template',
    recurrence_pattern ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM') NOT NULL COMMENT 'Frequency scale selector',
    recurrence_interval INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Interval multiplier factor',
    start_date DATE NOT NULL COMMENT 'Config activation date',
    end_date DATE NULL COMMENT 'Config expiration date',
    occurrence_count INT UNSIGNED NULL COMMENT 'Target number of events to generate',
    recurrence_rules TEXT NULL COMMENT 'JSON/RRULE string configuration metadata',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_recurring_schedules_event FOREIGN KEY (event_id) REFERENCES calendar_events (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_recurring_schedules_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_recurring_schedules_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_recurring_schedules_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_rcs_interval CHECK (recurrence_interval > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Pattern templates for generating sequential event series';

-- Table 10: calendar_reminders
CREATE TABLE calendar_reminders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique reminder job identifier',
    event_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to target calendar event',
    recipient_id BIGINT UNSIGNED NOT NULL COMMENT 'Target employee user ID',
    channel ENUM('EMAIL', 'SMS', 'PUSH', 'WHATSAPP', 'IN_APP') NOT NULL DEFAULT 'IN_APP' COMMENT 'Delivery dispatch channel selector',
    reminder_time_minutes_before INT UNSIGNED NOT NULL DEFAULT 30 COMMENT 'SLA delta minutes threshold before event starts',
    status ENUM('QUEUED', 'SENT', 'FAILED') NOT NULL DEFAULT 'QUEUED' COMMENT 'Job progress status indicator',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_calendar_reminders_event FOREIGN KEY (event_id) REFERENCES calendar_events (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_calendar_reminders_user FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_calendar_reminders_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_calendar_reminders_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_calendar_reminders_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'SLA automated reminder jobs for meeting participants';

-- Table 11: calendar_permissions
CREATE TABLE calendar_permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique sharing rule identifier',
    target_calendar_owner_id BIGINT UNSIGNED NOT NULL COMMENT 'User ID hosting the source calendar',
    user_id BIGINT UNSIGNED NULL COMMENT 'Grant target internal employee user ID (optional)',
    role_id BIGINT UNSIGNED NULL COMMENT 'Grant target role context (optional)',
    department_id BIGINT UNSIGNED NULL COMMENT 'Grant target department context (optional)',
    permission_level ENUM('OWNER', 'EDITOR', 'VIEWER', 'SCHEDULER', 'ADMINISTRATOR') NOT NULL DEFAULT 'VIEWER' COMMENT 'Authorized permission access level',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_calendar_permissions_owner FOREIGN KEY (target_calendar_owner_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_calendar_permissions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_calendar_permissions_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_calendar_permissions_dept FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_calendar_permissions_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_calendar_permissions_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_calendar_permissions_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Granular calendar sharing configuration rules';

-- Table 12: calendar_sync_accounts
CREATE TABLE calendar_sync_accounts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique sync integration catalog',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Owner internal employee user ID',
    provider ENUM('GOOGLE', 'OUTLOOK', 'EXCHANGE', 'APPLE', 'ZOOM', 'TEAMS') NOT NULL DEFAULT 'GOOGLE' COMMENT 'External API vendor provider type',
    oauth_access_token TEXT NOT NULL COMMENT 'Active OAuth Access key',
    oauth_refresh_token TEXT NOT NULL COMMENT 'Renew OAuth Refresh key',
    sync_status ENUM('ACTIVE', 'SUSPENDED', 'FAILED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Active sync account status state',
    last_sync_at DATETIME NULL COMMENT 'Time synchronization task completed',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_sync_accounts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sync_accounts_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_sync_accounts_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_sync_accounts_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'OAuth credentials for third-party calendar synchronizations';

-- Table 13: calendar_sync_logs
CREATE TABLE calendar_sync_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique sync log history identifier',
    sync_account_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to integration account',
    success BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Flags synchronization results',
    records_synced INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total synced rows count',
    error_message TEXT NULL COMMENT 'Failure description context logs',
    duration_ms INT UNSIGNED NULL COMMENT 'Total job turnaround duration',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Audit timestamp log',
    CONSTRAINT fk_sync_logs_acc FOREIGN KEY (sync_account_id) REFERENCES calendar_sync_accounts (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Audit histories tracking sync batch operations';

-- =====================================================================================
-- 7. VISITOR PASS & LOBBY CHECK-IN MANAGEMENT
-- =====================================================================================

-- =====================================================================================
-- PASS TYPES LOOKUP (Phase 1 Critical Fix — Missing lookup table)
-- =====================================================================================
CREATE TABLE pass_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique pass type identifier',
    pass_type_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external reference',
    type_code VARCHAR(50) NOT NULL COMMENT 'Machine-readable code (e.g., DAY_PASS, VIP_PASS)',
    type_name VARCHAR(100) NOT NULL COMMENT 'Human-readable pass type name',
    type_description TEXT NULL COMMENT 'Description of pass type and usage',
    validity_duration_hours INT UNSIGNED NOT NULL DEFAULT 8 COMMENT 'Default validity duration in hours',
    max_extensions INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Maximum number of allowed extensions',
    requires_escort BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether this pass type requires escort',
    access_level ENUM('GENERAL','RESTRICTED','HIGH_SECURITY','VIP','TEMPORARY','CONTRACTOR') NOT NULL DEFAULT 'GENERAL' COMMENT 'Access level granted by this pass type',
    badge_color VARCHAR(20) NULL COMMENT 'Badge color code for visual identification',
    badge_template VARCHAR(100) NULL COMMENT 'Badge design template identifier',
    organization_id BIGINT UNSIGNED NULL COMMENT 'FK to organizations (NULL = system-wide)',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_pt_uid UNIQUE (pass_type_uid),
    CONSTRAINT uq_pt_code UNIQUE (type_code),
    CONSTRAINT fk_pt_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_pt_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_pt_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_pt_deleted FOREIGN KEY (deleted_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Lookup table for visitor pass categories with access levels and badge templates';

-- =====================================================================================
-- VISITOR CONSENT RECORDS (Phase 1 Critical Fix — GDPR Compliance)
-- =====================================================================================
-- IMMUTABLE: Consent records are append-only for legal compliance.
-- =====================================================================================
CREATE TABLE visitor_consent_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique consent record identifier',
    consent_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external reference',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to visitors — the data subject',
    organization_id BIGINT UNSIGNED NULL COMMENT 'FK to organizations — consenting organization',
    consent_type ENUM('DATA_PROCESSING','PHOTO_CAPTURE','BIOMETRIC_COLLECTION','NDA_AGREEMENT','HEALTH_SCREENING','MARKETING','THIRD_PARTY_SHARING','DATA_RETENTION','TERMS_OF_SERVICE','PRIVACY_POLICY') NOT NULL COMMENT 'Type of consent granted',
    consent_version VARCHAR(20) NOT NULL DEFAULT '1.0' COMMENT 'Version of consent document agreed to',
    consent_text TEXT NOT NULL COMMENT 'Full consent text presented to visitor',
    consent_given BOOLEAN NOT NULL COMMENT 'Whether consent was granted (true) or declined (false)',
    consent_method ENUM('DIGITAL_SIGNATURE','CHECKBOX','VERBAL','WRITTEN','KIOSK','MOBILE_APP') NOT NULL DEFAULT 'CHECKBOX' COMMENT 'How consent was collected',
    ip_address VARCHAR(45) NULL COMMENT 'IP address at time of consent',
    device_type VARCHAR(50) NULL COMMENT 'Device used for consent',
    signature_data TEXT NULL COMMENT 'Digital signature data (base64 or URL)',
    document_url VARCHAR(500) NULL COMMENT 'URL to signed consent document',
    consented_at DATETIME NOT NULL COMMENT 'Exact time consent was given/declined',
    expires_at DATETIME NULL COMMENT 'Consent expiration date (NULL = indefinite)',
    revoked_at DATETIME NULL COMMENT 'Time consent was revoked (NULL = not revoked)',
    revocation_reason TEXT NULL COMMENT 'Reason for revocation',
    compliance_framework ENUM('GDPR','HIPAA','CCPA','LGPD','POPIA','GENERAL') NOT NULL DEFAULT 'GENERAL' COMMENT 'Applicable compliance framework',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_vcr_uid UNIQUE (consent_uid),
    CONSTRAINT fk_vcr_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_vcr_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_vcr_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Immutable GDPR/HIPAA consent tracking per visitor per visit — append-only for legal compliance';

CREATE INDEX idx_pt_code ON pass_types (type_code);
CREATE INDEX idx_pt_access ON pass_types (access_level);
CREATE INDEX idx_pt_org ON pass_types (organization_id);
CREATE INDEX idx_vcr_visitor ON visitor_consent_records (visitor_id);
CREATE INDEX idx_vcr_org ON visitor_consent_records (organization_id);
CREATE INDEX idx_vcr_type ON visitor_consent_records (consent_type);
CREATE INDEX idx_vcr_framework ON visitor_consent_records (compliance_framework);
CREATE INDEX idx_vcr_consented ON visitor_consent_records (consented_at);
CREATE INDEX idx_vcr_visitor_type ON visitor_consent_records (visitor_id, consent_type);

CREATE TABLE visitor_passes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT UNSIGNED NULL COMMENT 'FK to organizations — multi-tenant data isolation',
    visitor_id BIGINT UNSIGNED NULL COMMENT 'FK to visitors — direct visitor reference for fast queries',
    appointment_id BIGINT UNSIGNED NOT NULL UNIQUE,
    pass_type_id BIGINT UNSIGNED NULL COMMENT 'FK to pass_types lookup',
    pass_code VARCHAR(50) NOT NULL UNIQUE,
    qr_token VARCHAR(64) NOT NULL UNIQUE,
    barcode_data VARCHAR(100),
    status ENUM('ACTIVE','EXPIRED','REVOKED','SUSPENDED') DEFAULT 'ACTIVE',
    is_printed BOOLEAN DEFAULT FALSE,
    issued_by BIGINT UNSIGNED NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_pass_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_pass_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_pass_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pass_type FOREIGN KEY (pass_type_id) REFERENCES pass_types (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_pass_issuer FOREIGN KEY (issued_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Visitor access passes with multi-tenant isolation and pass type classification';

CREATE TABLE checkins (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT UNSIGNED NULL COMMENT 'FK to organizations — multi-tenant data isolation',
    visitor_id BIGINT UNSIGNED NULL COMMENT 'FK to visitors — direct visitor reference for fast queries',
    facility_id BIGINT UNSIGNED NULL COMMENT 'Reference to facility site checked in',
    appointment_id BIGINT UNSIGNED NOT NULL,
    pass_id BIGINT UNSIGNED NULL,
    receptionist_id BIGINT UNSIGNED NOT NULL,
    checked_in_at DATETIME NOT NULL,
    checked_out_at DATETIME NULL,
    badge_number VARCHAR(50),
    is_badge_returned BOOLEAN DEFAULT FALSE,
    is_walk_in BOOLEAN DEFAULT FALSE,
    arrival_status ENUM('ON_TIME','LATE','EARLY','NO_SHOW') DEFAULT 'ON_TIME',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_ci_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ci_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ci_facility FOREIGN KEY (facility_id) REFERENCES facilities (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ci_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ci_pass FOREIGN KEY (pass_id) REFERENCES visitor_passes (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ci_receptionist FOREIGN KEY (receptionist_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Check-in transactions with multi-tenant org isolation';

-- =====================================================================================
-- 8. SECURITY & WATCHLIST MANAGEMENT
-- =====================================================================================

CREATE TABLE security_alerts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    severity ENUM('low','medium','high','critical') DEFAULT 'medium',
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by BIGINT UNSIGNED NULL,
    resolved_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sa_resolver FOREIGN KEY (resolved_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Real-time security alerts';

CREATE TABLE security_incidents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    incident_date DATETIME NOT NULL,
    reporter_id BIGINT UNSIGNED NOT NULL,
    visitor_id BIGINT UNSIGNED NULL,
    appointment_id BIGINT UNSIGNED NULL,
    action_taken TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_si_reporter FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_si_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_si_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Formal records of security incident violations';

CREATE TABLE incident_attachments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    incident_id BIGINT UNSIGNED NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ia_incident FOREIGN KEY (incident_id) REFERENCES security_incidents (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Document logs for incident verification';

-- =====================================================================================
-- 9. NOTIFICATIONS & COMMUNICATION CHANNELS
-- =====================================================================================

CREATE TABLE notification_templates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    channel ENUM('email','sms','in_app','push') DEFAULT 'in_app',
    subject_template VARCHAR(200),
    body_template TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Templates dictionary for system messages';

CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    visitor_email VARCHAR(150) NULL,
    template_id BIGINT UNSIGNED NULL,
    type VARCHAR(50) NOT NULL,
    channel ENUM('email','sms','in_app','push') DEFAULT 'in_app',
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('sent','delivered','failed','read') DEFAULT 'sent',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notif_template FOREIGN KEY (template_id) REFERENCES notification_templates (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Dispatched notification transaction logs';

-- =====================================================================================
-- 10. AUDIT & SYSTEM SETTINGS CONFIGURATIONS
-- =====================================================================================

CREATE TABLE system_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_group VARCHAR(50) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_settings_user FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Configurable parameter store';

CREATE TABLE verification_attempts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    attempts INT UNSIGNED DEFAULT 0,
    locked_until DATETIME NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Lobby verify attempt limits';

-- =====================================================================================
-- 11. ADVANCED SECURITY AUDITING, THREAT DETECTION & MULTI-FACTOR ENGINE
-- =====================================================================================

CREATE TABLE login_history (
    login_history_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    logout_time DATETIME NULL,
    login_status ENUM('SUCCESS','FAILED','LOCKED','INVALID_PASSWORD','UNKNOWN_USER') NOT NULL,
    failure_reason VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    device_type VARCHAR(50) NULL,
    location VARCHAR(150) NULL,
    session_token VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_login_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Logs historical login security attempts';

CREATE TABLE ip_blocklist (
    block_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    reason VARCHAR(255) NULL,
    failed_attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    max_attempts SMALLINT UNSIGNED NOT NULL DEFAULT 5,
    block_type ENUM('AUTO','MANUAL','SYSTEM') NOT NULL DEFAULT 'AUTO',
    is_blocked BOOLEAN NOT NULL DEFAULT TRUE,
    blocked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    unblock_at DATETIME NULL,
    last_attempt_at DATETIME NULL,
    country VARCHAR(100) NULL,
    device_info VARCHAR(255) NULL,
    status ENUM('ACTIVE','UNBLOCKED','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_ip_blocklist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT uq_ip_address UNIQUE (ip_address)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'IP Address blocklist registry';

CREATE TABLE password_resets (
    reset_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    reset_token VARCHAR(255) NOT NULL,
    reset_code VARCHAR(20) NULL,
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    request_ip VARCHAR(45) NULL,
    user_agent TEXT NULL,
    status ENUM('PENDING','USED','EXPIRED','INVALID') NOT NULL DEFAULT 'PENDING',
    attempt_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    max_attempts SMALLINT UNSIGNED NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_reset_token UNIQUE (reset_token),
    CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Logs forgot password reset requests';

-- [DEPRECATED] Use alm_audit_logs (Module 16) as the canonical audit trail.
-- This table is retained for backwards compatibility with existing API endpoints.
CREATE TABLE audit_logs (
    audit_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Backwards compatible log ID',
    user_id BIGINT UNSIGNED NULL,
    actor_id BIGINT UNSIGNED NULL COMMENT 'Backwards compatible actor ID (synchronized)',
    action VARCHAR(100) NOT NULL COMMENT 'Audited transaction action',
    module VARCHAR(80) NOT NULL COMMENT 'System module location',
    entity VARCHAR(80) NULL COMMENT 'Backwards compatible entity tracker',
    table_name VARCHAR(80) NULL COMMENT 'Target relational table (synchronized)',
    record_id BIGINT UNSIGNED NULL,
    entity_id BIGINT UNSIGNED NULL COMMENT 'Backwards compatible record identifier (synchronized)',
    old_values JSON NULL,
    new_values JSON NULL,
    metadata_json JSON NULL COMMENT 'Backwards compatible audit changes metadata (synchronized)',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    browser VARCHAR(100) NULL COMMENT 'Backwards compatible browser metadata',
    device VARCHAR(100) NULL COMMENT 'Backwards compatible device metadata',
    http_method VARCHAR(10) NULL,
    endpoint VARCHAR(255) NULL,
    status ENUM('SUCCESS','FAILED','UNAUTHORIZED','ERROR') NOT NULL DEFAULT 'SUCCESS',
    severity ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_audit_logs_actor_legacy FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Advanced multi-tenant security logs';

CREATE TABLE login_anomalies (
    anomaly_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    ip_address VARCHAR(45) NULL,
    device_fingerprint VARCHAR(255) NULL,
    anomaly_type ENUM('NEW_DEVICE','NEW_LOCATION','MULTIPLE_FAILED_LOGINS','RAPID_LOGIN_ATTEMPT','SUSPICIOUS_IP','PASSWORD_SPRAYING','BRUTE_FORCE','TOKEN_REUSE') NOT NULL,
    risk_score TINYINT UNSIGNED NOT NULL DEFAULT 0,
    severity ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW',
    description TEXT NULL,
    detected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at DATETIME NULL,
    resolution_action VARCHAR(255) NULL,
    related_session_id BIGINT UNSIGNED NULL,
    related_login_id BIGINT UNSIGNED NULL,
    country VARCHAR(100) NULL,
    location VARCHAR(150) NULL,
    device_type VARCHAR(50) NULL,
    status ENUM('ACTIVE','IGNORED','RESOLVED','FALSE_POSITIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_login_anomalies_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Identifies suspicious security access behaviors';

CREATE TABLE authentication_settings (
    setting_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL,
    setting_value VARCHAR(255) NOT NULL,
    data_type ENUM('STRING','INTEGER','BOOLEAN','JSON') NOT NULL DEFAULT 'STRING',
    description VARCHAR(255) NULL,
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_auth_setting_key UNIQUE (setting_key),
    CONSTRAINT fk_auth_settings_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_auth_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Stores security specific policy variables';

CREATE TABLE user_otp (
    otp_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    otp_type ENUM('LOGIN','PASSWORD_RESET','EMAIL_VERIFY','PHONE_VERIFY') NOT NULL,
    delivery_method ENUM('EMAIL','SMS','AUTH_APP') NOT NULL,
    destination VARCHAR(150) NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    max_attempts SMALLINT UNSIGNED NOT NULL DEFAULT 5,
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    verified_at DATETIME NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    status ENUM('ACTIVE','VERIFIED','EXPIRED','FAILED','REVOKED') NOT NULL DEFAULT 'ACTIVE',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_user_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Verifies active authentication OTP triggers';

CREATE TABLE trusted_devices (
    device_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(150) NULL,
    device_type ENUM('DESKTOP','MOBILE','TABLET','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    os VARCHAR(100) NULL,
    browser VARCHAR(100) NULL,
    ip_address VARCHAR(45) NULL,
    mac_address VARCHAR(50) NULL,
    location VARCHAR(150) NULL,
    country VARCHAR(100) NULL,
    trust_level TINYINT UNSIGNED NOT NULL DEFAULT 0,
    is_trusted BOOLEAN NOT NULL DEFAULT FALSE,
    first_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at DATETIME NULL,
    trust_verified_at DATETIME NULL,
    trust_method ENUM('OTP','MANUAL','BEHAVIORAL','ADMIN_APPROVAL') NULL,
    status ENUM('ACTIVE','SUSPICIOUS','BLOCKED','REMOVED') NOT NULL DEFAULT 'ACTIVE',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_trusted_devices_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_device_fingerprint UNIQUE (device_fingerprint, user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Registry of recognized user login devices';

CREATE TABLE policy_engine (
    policy_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    policy_key VARCHAR(100) NOT NULL,
    policy_value VARCHAR(255) NOT NULL,
    data_type ENUM('STRING','INTEGER','BOOLEAN','JSON') NOT NULL DEFAULT 'STRING',
    description VARCHAR(255) NULL,
    category ENUM('AUTHENTICATION', 'SESSION', 'PASSWORD', 'DEVICE', 'RISK','MFA' ) NOT NULL DEFAULT 'AUTHENTICATION',
    priority_level TINYINT UNSIGNED NOT NULL DEFAULT 1,
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from DATETIME NULL,
    effective_to DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_policy_key UNIQUE (policy_key),
    CONSTRAINT fk_policy_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_policy_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Stores behavioral policy rules for threat control';

CREATE TABLE risk_profile (
    risk_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    risk_score TINYINT UNSIGNED NOT NULL DEFAULT 0,
    risk_level ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW',
    risk_factors JSON NULL,
    last_calculated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    next_recalculation_at DATETIME NULL,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    block_reason VARCHAR(255) NULL,
    model_version VARCHAR(50) NULL,
    status ENUM('ACTIVE','UNDER_REVIEW','BLOCKED','CLEARED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_risk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_risk_user UNIQUE (user_id),
    CONSTRAINT fk_risk_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_risk_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Security threat profiles mapping individual users';

CREATE TABLE authentication_events (
    event_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    event_type ENUM('LOGIN_SUCCESS','LOGIN_FAILED','LOGOUT','OTP_SENT','OTP_VERIFIED','OTP_FAILED','SESSION_CREATED','SESSION_EXPIRED','SESSION_REVOKED','DEVICE_TRUSTED','DEVICE_REJECTED','IP_BLOCKED','PASSWORD_CHANGED','PASSWORD_RESET','RISK_TRIGGERED') NOT NULL,
    event_status ENUM('SUCCESS','FAILED','PENDING','WARNING') NOT NULL DEFAULT 'SUCCESS',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    device_fingerprint VARCHAR(255) NULL,
    session_id BIGINT UNSIGNED NULL,
    risk_score TINYINT UNSIGNED NULL,
    metadata JSON NULL,
    geo_location VARCHAR(150) NULL,
    country VARCHAR(100) NULL,
    severity ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auth_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Audits granular authentication triggers';

CREATE TABLE security_questions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique question identifier',
    question_id BIGINT UNSIGNED NULL UNIQUE,
    question_text VARCHAR(255) NOT NULL COMMENT 'Detailed security challenge question',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_question_text UNIQUE (question_text)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Directory of security fallback questions';

CREATE TABLE user_security_answers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    answer_id BIGINT UNSIGNED NULL UNIQUE,
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Answering user',
    question_id BIGINT UNSIGNED NOT NULL COMMENT 'Referenced challenge question',
    answer_hash VARCHAR(255) NOT NULL COMMENT 'Secure encrypted response string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_usa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_usa_question FOREIGN KEY (question_id) REFERENCES security_questions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_user_question UNIQUE (user_id, question_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'User submitted answers for security recovery questions';

CREATE TABLE user_oauth_identities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    identity_id BIGINT UNSIGNED NULL UNIQUE,
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Local user account link',
    provider VARCHAR(50) NOT NULL COMMENT 'OAuth service provider name (Google, Microsoft)',
    provider_uid VARCHAR(255) NOT NULL COMMENT 'Unique external provider profile identifier',
    metadata JSON NULL COMMENT 'Access credentials and scope values',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_uoi_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_provider_uid UNIQUE (provider, provider_uid)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Third-party federated social sign-on credentials';

-- =====================================================================================
-- 3A. MODULE 3: ORGANIZATION MANAGEMENT TABLES (organizations table moved to section 4A)
-- =====================================================================================

-- Table 2: organization_branches
CREATE TABLE organization_branches (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique branch record ID',
    branch_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    organization_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to parent master corporate organization context',
    branch_name VARCHAR(150) NOT NULL COMMENT 'Site or regional branch name descriptor',
    branch_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Short unique alphanumeric identifier code',
    timezone VARCHAR(50) DEFAULT 'UTC' COMMENT 'Active local branch timezone rules',
    address VARCHAR(255) NULL COMMENT 'Physical local branch building address',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT 'Active registry status flag',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if branch is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_branch_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Corporate branches or campuses across facility sites';

-- Table 3: business_units
CREATE TABLE business_units (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique unit record ID',
    unit_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    organization_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to parent corporate organization context',
    unit_name VARCHAR(150) NOT NULL COMMENT 'Business unit division description name',
    unit_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Short unique alphanumeric code',
    description TEXT NULL COMMENT 'Division operational scope detail note text',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if business unit is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_bu_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Business divisions or vertical sectors context';

-- Table 4: teams
CREATE TABLE teams (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique team record ID',
    team_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    department_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to parent department assignment',
    team_name VARCHAR(150) NOT NULL COMMENT 'Clean team descriptor name',
    team_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Short unique alphanumeric code',
    description TEXT NULL COMMENT 'Team scope or function details',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if team is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_team_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Granular workteams mapping under corporate departments';

-- Table 5: job_positions
CREATE TABLE job_positions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique position record ID',
    position_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    position_title VARCHAR(150) NOT NULL COMMENT 'Official designation name title',
    position_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Short unique alphanumeric code',
    grade_level VARCHAR(20) NULL COMMENT 'Corporate rank grading identifier level',
    description TEXT NULL COMMENT 'Responsibilities details narrative',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if job position is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Catalog of official enterprise roles and grades';

-- Table 6: employee_hierarchy
CREATE TABLE employee_hierarchy (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique hierarchy record ID',
    employee_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to reporting employee staff profile record',
    supervisor_employee_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to direct manager staff profile record',
    hierarchy_type ENUM('SUPERVISOR', 'MANAGER', 'MENTOR') NOT NULL DEFAULT 'SUPERVISOR' COMMENT 'Hierarchy relationship context classification',
    start_date DATE NOT NULL COMMENT 'Assignment start date rules',
    end_date DATE NULL COMMENT 'Assignment end date rules',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if assignment status is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_hier_emp FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_hier_super FOREIGN KEY (supervisor_employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Historical reporting line relationships mappings';

-- Table 6A: buildings
CREATE TABLE buildings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique building ID',
    building_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    branch_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to organization branch Site',
    building_name VARCHAR(150) NOT NULL COMMENT 'Physical name description',
    building_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique alphanumeric identifier code',
    location VARCHAR(255) NULL COMMENT 'Address or coordinates',
    max_visitor_capacity INT UNSIGNED NULL COMMENT 'Maximum concurrent visitors allowed in building (NULL = unlimited)',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if building is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_building_branch FOREIGN KEY (branch_id) REFERENCES organization_branches(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Physical buildings catalog within branch campuses';

-- Table 6B: floors
CREATE TABLE floors (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique floor ID',
    floor_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    building_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to hosting building location',
    floor_name VARCHAR(150) NOT NULL COMMENT 'Clean floor display name label',
    floor_number INT NOT NULL COMMENT 'Numeric floor levels indicators',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if floor is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_floor_building FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Floor levels registries mapped inside buildings';

-- Table 7: offices
CREATE TABLE offices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique office database record ID',
    office_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    office_number VARCHAR(50) NOT NULL UNIQUE COMMENT 'Official building room or suite number label',
    office_name VARCHAR(150) NOT NULL COMMENT 'Office display identifier name description',
    office_type ENUM('CUBICLE', 'CABIN', 'CONFERENCE', 'OPEN_SPACE', 'LAB') NOT NULL DEFAULT 'CUBICLE' COMMENT 'Physical layout classification type',
    capacity INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Maximum seated occupancy limit',
    floor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to physical floor placement',
    department_id BIGINT UNSIGNED NULL COMMENT 'Reference to department holding leasing allocation rights',
    qr_code_token VARCHAR(64) NULL UNIQUE COMMENT 'Token used for generating sign-in desk display QR codes',
    status ENUM('ACTIVE', 'INACTIVE', 'RESERVED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Active registry status flag',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if office is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_office_floor FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_office_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Desks, cabins and workspace layout capacity registries';

-- Table 8: work_schedules
CREATE TABLE work_schedules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique schedule registry ID',
    schedule_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    shift_name VARCHAR(150) NOT NULL COMMENT 'Clean shift identifier name description',
    working_days SET('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN') NOT NULL COMMENT 'Configured set of active workdays',
    start_time TIME NOT NULL COMMENT 'Shift standard beginning time',
    end_time TIME NOT NULL COMMENT 'Shift standard closing time',
    break_time_minutes INT UNSIGNED NOT NULL DEFAULT 60 COMMENT 'Lunch break length allocation',
    grace_period_minutes INT UNSIGNED NOT NULL DEFAULT 15 COMMENT 'Grace allowance threshold in minutes for late check-in',
    is_night_shift BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if work shift spans past midnight bounds',
    is_flexible BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if schedule utilizes flex hours metrics',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if schedule configuration is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Enterprise employee work shift patterns configuration';

-- Table 9: enterprise_holidays
CREATE TABLE enterprise_holidays (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique holiday calendar record ID',
    holiday_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    name VARCHAR(150) NOT NULL COMMENT 'Display identifier title name description',
    holiday_date DATE NOT NULL COMMENT 'Calendar holiday closure date',
    holiday_type ENUM('NATIONAL', 'REGIONAL', 'COMPANY', 'DEPARTMENT') NOT NULL DEFAULT 'NATIONAL' COMMENT 'Authorized holiday scope rules classification',
    branch_id BIGINT UNSIGNED NULL COMMENT 'Reference to branch location scope rules',
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if holiday occurs annually',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if holiday config is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_holiday_branch FOREIGN KEY (branch_id) REFERENCES organization_branches(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Enterprise holiday calendar closures catalog';

-- Table 10: organization_assets
CREATE TABLE organization_assets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique catalog asset record ID',
    asset_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    branch_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to hosting local branch registry',
    employee_id BIGINT UNSIGNED NULL COMMENT 'Reference to assigned custodian employee user record',
    asset_name VARCHAR(150) NOT NULL COMMENT 'Asset item title description details',
    asset_code VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique system asset inventory barcode key code',
    asset_type ENUM('LAPTOP', 'VEHICLE', 'PROJECTOR', 'FURNITURE', 'DEVICE', 'OTHER') NOT NULL DEFAULT 'LAPTOP' COMMENT 'Equipment asset categorization',
    serial_number VARCHAR(100) NULL COMMENT 'Factory hardware unique serial number ID key',
    status ENUM('ASSIGNED', 'STOCK', 'MAINTENANCE', 'RETIRED') NOT NULL DEFAULT 'STOCK' COMMENT 'Active allocation inventory status flag',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if asset record is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_asset_branch FOREIGN KEY (branch_id) REFERENCES organization_branches(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_asset_emp FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Hardware and equipment inventory asset catalog';

-- Table 11: access_zones
CREATE TABLE access_zones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique access zone record ID',
    zone_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    building_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to containing building placement location',
    zone_name VARCHAR(150) NOT NULL COMMENT 'Zone safety perimeter clearance descriptor',
    security_level INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Security clearance rank metric (1=Basic access, 5=Executive only)',
    description TEXT NULL COMMENT 'Classification boundary notes details',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if access zone is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_zone_bldg FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Perimeters mapping for entry authorization clearance';

-- Table 12: cost_centers
CREATE TABLE cost_centers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique cost center record ID',
    cost_center_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    department_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to owning budget department category',
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Budget billing key code identifier',
    name VARCHAR(150) NOT NULL COMMENT 'Clean cost center description name',
    budget_limit DECIMAL(15,2) NULL COMMENT 'Fiscal budget allocation limits constraint metrics',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if cost center budget is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_cc_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Cost center accounting allocations by department';

-- Table 13: emergency_contacts
CREATE TABLE emergency_contacts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique database contact record ID',
    employee_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to parent employee staff profile record',
    contact_name VARCHAR(150) NOT NULL COMMENT 'Display name of emergency contact person',
    relationship VARCHAR(100) NOT NULL COMMENT 'Spouse, sibling, parent or relative indicator',
    phone_number VARCHAR(30) NOT NULL COMMENT 'Primary contact telephone number',
    alternate_phone_number VARCHAR(30) NULL COMMENT 'Secondary fallback phone contact',
    email VARCHAR(150) NULL COMMENT 'Email contact information',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if contact record is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_emg_emp FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Staff emergency safety contacts catalog';

-- Table 14: organization_settings
CREATE TABLE organization_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique setting record ID',
    setting_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    organization_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to parent company organization setup key',
    setting_key VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique identifier policy configuration key name',
    setting_value TEXT NOT NULL COMMENT 'Value settings configuration payload data',
    description TEXT NULL COMMENT 'Usage rationale explaining setting details',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if setting is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_setting_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Global policy rules configurations catalog';

-- Table 15: organization_documents
CREATE TABLE organization_documents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique catalog document record ID',
    document_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    organization_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to owning organization context',
    document_title VARCHAR(150) NOT NULL COMMENT 'Clean title descriptor header',
    document_type ENUM('POLICY', 'NDA', 'GUIDELINE', 'SAFETY', 'SITE_MAP') NOT NULL DEFAULT 'POLICY' COMMENT 'Document type classification classification',
    file_url VARCHAR(255) NOT NULL COMMENT 'Storage path location URL containing document file asset',
    version VARCHAR(20) DEFAULT '1.0' COMMENT 'Audit tracking document revision version index',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if document is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_doc_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Policies, safety templates and visitor NDAs records';

-- =====================================================================================
-- 3B. MODULE 8: RECEPTION MANAGEMENT TABLES
-- =====================================================================================

-- Table 1: reception_desks
CREATE TABLE reception_desks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique reception desk ID',
    desk_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    desk_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique alphanumeric identifier code',
    desk_name VARCHAR(150) NOT NULL COMMENT 'Clean desk description name',
    building_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to corporate building location',
    floor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to floor level',
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') DEFAULT 'ACTIVE' COMMENT 'Active registry status flag',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if desk is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_desk_building FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_desk_floor FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Physical lobby reception counters catalog';

-- Table 2: receptionist_assignments
CREATE TABLE receptionist_assignments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique assignment ID',
    assignment_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to receptionist staff user record',
    desk_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to active reception desk counter',
    shift_start TIME NOT NULL COMMENT 'Start of standard receptionist shift',
    shift_end TIME NOT NULL COMMENT 'End of standard receptionist shift',
    start_date DATE NOT NULL COMMENT 'Assignment start date rules',
    end_date DATE NULL COMMENT 'Assignment expiration date rules (optional)',
    is_current BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Flags active shift assignment status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if assignment config is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_assign_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_assign_desk FOREIGN KEY (desk_id) REFERENCES reception_desks(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Schedules mapping receptionist staff to lobby desks';

-- Table 3: visitor_arrivals
CREATE TABLE visitor_arrivals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique arrival record ID',
    arrival_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor profiles database record',
    appointment_id BIGINT UNSIGNED NULL COMMENT 'Reference to active pre-scheduled appointment context',
    receptionist_user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to receptionist user profile checking in guest',
    desk_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to desk handling registration check-in',
    arrival_status ENUM('ARRIVED', 'PROCESSING', 'CHECKED_IN', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'ARRIVED' COMMENT 'State of processing checkpoint flow',
    arrival_method ENUM('WALK_IN', 'APPOINTMENT', 'VIP', 'RECURRING') NOT NULL DEFAULT 'APPOINTMENT' COMMENT 'Source classification method',
    arrival_timestamp DATETIME NOT NULL COMMENT 'Timestamp when guest physically presented at lobby desk',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if arrival record is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_arrival_visitor FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_arrival_app FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_arrival_receptionist FOREIGN KEY (receptionist_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_arrival_desk FOREIGN KEY (desk_id) REFERENCES reception_desks(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Lobby desk check-in transactions logging guest arrivals';

-- Table 4: identity_verifications
CREATE TABLE identity_verifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique verification record ID',
    verification_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor profile validation target',
    verification_type ENUM('PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE', 'VISA', 'OTHER') NOT NULL COMMENT 'Identity check classification type',
    ocr_result_json JSON NULL COMMENT 'OCR text scanner result metadata',
    is_manual BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if check was hand-inspected without OCR assist',
    verification_officer_user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to verifying staff user account',
    status ENUM('PENDING', 'VERIFIED', 'FAILED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING' COMMENT 'Validation results classification',
    verification_timestamp DATETIME NOT NULL COMMENT 'Audit timestamp rules',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if verification record is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_verify_visitor FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_verify_officer FOREIGN KEY (verification_officer_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Security compliance logs tracking identity validation';

-- Table 5: waiting_areas
CREATE TABLE waiting_areas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique waiting room site ID',
    waiting_area_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    name VARCHAR(150) NOT NULL COMMENT 'Physical lounge description name label',
    capacity INT UNSIGNED NOT NULL DEFAULT 20 COMMENT 'Maximum seated occupancy limit',
    current_occupancy INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Live count monitor tracking currently checked-in guests',
    building_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to physical building location',
    floor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to physical floor level',
    status ENUM('ACTIVE', 'FULL', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT 'Lounge capacity status metrics',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if waiting area is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_wait_building FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_wait_floor FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Physical lobby lounges catalog for arrival buffering';

-- Table 6: visitor_waiting_queue
CREATE TABLE visitor_waiting_queue (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique queue number ID',
    queue_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    queue_number VARCHAR(50) NOT NULL COMMENT 'Format daily prefix tag, e.g. Q-0705-001',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor waiting profile',
    waiting_area_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to designated lounge buffer',
    status ENUM('WAITING', 'CALLED', 'SERVED', 'ABSENT') NOT NULL DEFAULT 'WAITING' COMMENT 'Visitor queue status state',
    priority ENUM('STANDARD', 'HIGH', 'VIP', 'EXPRESS') NOT NULL DEFAULT 'STANDARD' COMMENT 'Priority rules scale context',
    waiting_start_time DATETIME NOT NULL COMMENT 'Time guest entered queue state',
    called_time DATETIME NULL COMMENT 'Time guest was directed to host meeting rooms',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if queue record is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_queue_visitor FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_queue_area FOREIGN KEY (waiting_area_id) REFERENCES waiting_areas(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Active queue sequencing metrics tracking visitor wait times';

-- Table 7: host_notifications
CREATE TABLE host_notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique notification transaction ID',
    notification_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    host_user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to employee host record',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor profiles mapping',
    delivery_channel ENUM('EMAIL', 'SMS', 'PUSH', 'SYSTEM') NOT NULL DEFAULT 'SYSTEM' COMMENT 'Delivery transmission channel selector',
    delivery_status ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ') NOT NULL DEFAULT 'PENDING' COMMENT 'Job progress status indicator',
    notification_timestamp DATETIME NOT NULL COMMENT 'Time alert was sent',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if notification record is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_notif_host FOREIGN KEY (host_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notif_visitor FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Alerts dispatched to hosts upon guest lobby arrival';

-- Table 8: reception_actions
CREATE TABLE reception_actions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique log history ID',
    action_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    action_type VARCHAR(100) NOT NULL COMMENT 'Lobby transaction context code (e.g. PASS_PRINT)',
    description TEXT NULL COMMENT 'Audit text details explaining transaction context',
    performed_by_user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to receptionist executing action',
    action_timestamp DATETIME NOT NULL COMMENT 'Transaction timestamp rules',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if action record is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_act_user FOREIGN KEY (performed_by_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Timeline logs capturing receptionist lobby operations';

-- Table 9: reception_notes
CREATE TABLE reception_notes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique database note ID',
    note_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor target',
    receptionist_user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to receptionist staff authoring note',
    note_text TEXT NOT NULL COMMENT 'Remarks text block narrative details',
    is_confidential BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags private remarks hidden from check-in terminals',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if note is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_note_visitor FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_note_receptionist FOREIGN KEY (receptionist_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Administrative comments and check-in warnings logs';

-- Table 10: reception_incidents
CREATE TABLE reception_incidents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique incident report ID',
    incident_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NULL COMMENT 'Reference to suspect visitor profile (optional)',
    incident_type ENUM('FAKE_DOCUMENT', 'AGGRESSIVE_VISITOR', 'MEDICAL_EMERGENCY', 'SUSPICIOUS_BEHAVIOR', 'OTHER') NOT NULL COMMENT 'Security categorization codes',
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'LOW' COMMENT 'Level classification ranking',
    description TEXT NOT NULL COMMENT 'Security logs detailed narrative',
    resolution TEXT NULL COMMENT 'Steps taken to resolve security issue',
    reported_by_user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to reporting receptionist user profile',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if incident record is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_inc_visitor FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_inc_reporter FOREIGN KEY (reported_by_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Perimeter alerts and lobby threat incident reports';

-- Table 11: reception_statistics
CREATE TABLE reception_statistics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique statistics record ID',
    summary_date DATE NOT NULL UNIQUE COMMENT 'Clean rollup date',
    visitor_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total lobby arrivals rolled up',
    walk_in_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Walk-in counts metrics',
    appointment_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Pre-scheduled appointment check-in counts',
    avg_waiting_time_seconds INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Lobby delay wait metrics in seconds',
    avg_processing_time_seconds INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Receptions processing time metrics in seconds',
    rejected_visitor_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Security watchlist checks rejected counts',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if stats record is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Summary KPIs rolled up for lobby dashboards';

-- =====================================================================================
-- 3C. MODULE 10: CHECK-IN MANAGEMENT TABLES
-- =====================================================================================

-- Table 1: checkin_gates
CREATE TABLE checkin_gates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique gate database record ID',
    gate_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    gate_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique alphanumeric identifier code',
    gate_name VARCHAR(150) NOT NULL COMMENT 'Clean gate description name',
    building_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to physical building location',
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') DEFAULT 'ACTIVE' COMMENT 'Active registry status flag',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if gate is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_gate_building FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Physical security entrance and exit gates catalog';

-- Table 2: visitor_checkins
CREATE TABLE visitor_checkins (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique check-in transaction ID',
    checkin_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor profiles database record',
    appointment_id BIGINT UNSIGNED NULL COMMENT 'Reference to active pre-scheduled appointment context',
    visitor_pass_id BIGINT UNSIGNED NULL COMMENT 'Reference to printed/dispatched visitor pass credentials',
    reception_arrival_id BIGINT UNSIGNED NULL COMMENT 'Reference to lobby receptionist arrival record',
    receptionist_user_id BIGINT UNSIGNED NULL COMMENT 'Reference to receptionist user profile executing check-in',
    security_officer_user_id BIGINT UNSIGNED NULL COMMENT 'Reference to security officer user checking in guest',
    organization_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to master corporate organization context',
    building_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to corporate building site checked in',
    floor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to physical floor level checked in',
    gate_id BIGINT UNSIGNED NULL COMMENT 'Reference to physical entrance gate',
    checkin_method ENUM('QR_CODE', 'BARCODE', 'RFID', 'NFC', 'FACE_RECOGNITION', 'FINGERPRINT', 'OTP', 'MANUAL') NOT NULL DEFAULT 'MANUAL' COMMENT 'Primary physical entry method verification',
    checkin_source ENUM('SELF_SERVICE_KIOSK', 'MOBILE_APP', 'RECEPTION_DESK', 'SECURITY_GATE', 'API_INTEGRATION') NOT NULL DEFAULT 'RECEPTION_DESK' COMMENT 'Checkin origin platform source',
    status ENUM('ACTIVE', 'COMPLETED', 'CANCELLED', 'DENIED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Live checkout tracking state',
    arrival_time DATETIME NULL COMMENT 'Timestamp when guest physically presented at lobby desk',
    checkin_time DATETIME NOT NULL COMMENT 'Timestamp when security approved active checkin entry',
    expected_checkout_time DATETIME NOT NULL COMMENT 'Timestamp when access window originally scheduled to end',
    actual_checkout_time DATETIME NULL COMMENT 'Audit log checkout timestamp',
    remarks TEXT NULL COMMENT 'Lobby notes regarding check-in details',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if check-in record is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_vc_visitor FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vc_appt FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_vc_pass FOREIGN KEY (visitor_pass_id) REFERENCES visitor_passes(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_vc_arrival FOREIGN KEY (reception_arrival_id) REFERENCES visitor_arrivals(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_vc_receptionist FOREIGN KEY (receptionist_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_vc_security FOREIGN KEY (security_officer_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_vc_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vc_building FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vc_floor FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vc_gate FOREIGN KEY (gate_id) REFERENCES checkin_gates(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Main transactional catalog tracking active visitor entries';

-- Table 3: checkin_verifications
CREATE TABLE checkin_verifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique checkin verification ID',
    verification_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    checkin_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor checkins database transaction record',
    verification_type ENUM('IDENTITY', 'APPOINTMENT', 'PASS', 'HOST', 'APPROVAL', 'QR_CODE', 'BARCODE', 'OTP', 'FACE_RECOGNITION', 'FINGERPRINT', 'MANUAL', 'SECURITY_APPROVAL') NOT NULL COMMENT 'Specific verification type performed',
    verifier_user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to verifier staff user account',
    verification_time DATETIME NOT NULL COMMENT 'Verification execution timestamp',
    result ENUM('PASSED', 'FAILED', 'REJECTED', 'PENDING') NOT NULL DEFAULT 'PASSED' COMMENT 'Verification result flag',
    remarks TEXT NULL COMMENT 'Verification details or failure reason logs',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if verification config is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_cv_checkin FOREIGN KEY (checkin_id) REFERENCES visitor_checkins(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cv_verifier FOREIGN KEY (verifier_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Verification checkpoint tracking during lobby check-in flows';

-- Table 4: checkin_security_screenings
CREATE TABLE checkin_security_screenings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique security screening ID',
    screening_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    checkin_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor checkins transaction',
    screening_method ENUM('METAL_DETECTOR', 'BAG_INSPECTION', 'EXPLOSIVE_DETECTION', 'WEAPON_DETECTION', 'MANUAL_SEARCH', 'DRUG_DETECTION', 'QUESTIONNAIRE') NOT NULL COMMENT 'Screening inspection protocol',
    screening_result ENUM('PASSED', 'FLAGGED', 'FAILED') NOT NULL DEFAULT 'PASSED' COMMENT 'Visual inspection result code',
    security_officer_user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to screening safety officer user account',
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'LOW' COMMENT 'Computed checkin risk tier indicator',
    prohibited_items_found TEXT NULL COMMENT 'Description list of confiscated safety hazards',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if screening config is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_css_checkin FOREIGN KEY (checkin_id) REFERENCES visitor_checkins(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_css_officer FOREIGN KEY (security_officer_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Lobby checkpoint safety inspections catalog';

-- Table 5: checkin_access_grants
CREATE TABLE checkin_access_grants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique access grant ID',
    grant_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    checkin_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor checkins transaction',
    access_level_code VARCHAR(50) NOT NULL COMMENT 'Granular alphanumeric security authorization code',
    zone_id BIGINT UNSIGNED NULL COMMENT 'Reference to access perimeter zone context',
    building_id BIGINT UNSIGNED NULL COMMENT 'Reference to physical building context',
    floor_id BIGINT UNSIGNED NULL COMMENT 'Reference to physical floor context',
    room_id BIGINT UNSIGNED NULL COMMENT 'Reference to office or conference room destination (generic link)',
    department_id BIGINT UNSIGNED NULL COMMENT 'Reference to department host sector (optional)',
    grant_time DATETIME NOT NULL COMMENT 'Authorization window start timestamp rules',
    expiry_time DATETIME NOT NULL COMMENT 'Authorization window end timestamp rules',
    granted_by_user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to authorizing security officer user account',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if access grant is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_cag_checkin FOREIGN KEY (checkin_id) REFERENCES visitor_checkins(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cag_zone FOREIGN KEY (zone_id) REFERENCES access_zones(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_cag_building FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_cag_floor FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_cag_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_cag_granter FOREIGN KEY (granted_by_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Temporary physical access credentials granted to active checkins';

-- Table 6: checkin_gate_logs
CREATE TABLE checkin_gate_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique gate scanner transaction ID',
    log_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    gate_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to scanned checkin gates counter',
    checkin_id BIGINT UNSIGNED NULL COMMENT 'Reference to visitor checkins (optional in case of unauthorized scan attempts)',
    scan_method ENUM('QR_SCAN', 'BARCODE_SCAN', 'RFID_SCAN', 'NFC_SCAN', 'FACE_SCAN', 'FINGERPRINT_SCAN') NOT NULL COMMENT 'Physical scanner scan technique',
    scan_data VARCHAR(255) NULL COMMENT 'Alphanumeric token string captured by physical reader',
    scan_result ENUM('GRANTED', 'DENIED', 'ERROR') NOT NULL DEFAULT 'GRANTED' COMMENT 'Scan result status flag',
    gate_status ENUM('OPEN', 'CLOSED', 'LOCKED', 'FAULTY') NOT NULL DEFAULT 'OPEN' COMMENT 'Physical gate locking indicator state',
    scanned_at DATETIME NOT NULL COMMENT 'Scan execution timestamp rules',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if gate scan record is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_cgl_gate FOREIGN KEY (gate_id) REFERENCES checkin_gates(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cgl_checkin FOREIGN KEY (checkin_id) REFERENCES visitor_checkins(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Scanner transaction histories tracking gate scans';

-- Table 7: visitor_belongings
CREATE TABLE visitor_belongings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique belonging ID',
    belonging_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    checkin_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor checkins transaction',
    item_type ENUM('LAPTOP', 'PHONE', 'CAMERA', 'USB', 'BAG', 'HELMET', 'EQUIPMENT', 'PACKAGE', 'OTHER') NOT NULL COMMENT 'Lobby storage classification item type',
    description VARCHAR(255) NOT NULL COMMENT 'Visual desc label detailing stored assets',
    serial_number VARCHAR(100) NULL COMMENT 'Stored equipment hardware serial string (e.g. laptop MAC address)',
    storage_locker_number VARCHAR(50) NULL COMMENT 'Physical lobby locker vault assign coordinate',
    is_return_required BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Flag mapping check-out return mandates',
    returned_status ENUM('RETAINED', 'RETURNED', 'CONFISCATED') NOT NULL DEFAULT 'RETAINED' COMMENT 'Locker item dispatch status monitor',
    returned_at DATETIME NULL COMMENT 'Item checkout dispatch timestamp',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if belonging record is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_vb_checkin FOREIGN KEY (checkin_id) REFERENCES visitor_checkins(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Custody logs tracking checked visitor properties';

-- Table 8: checkin_notifications
CREATE TABLE checkin_notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique notifier log ID',
    notification_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    checkin_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor checkins transaction',
    notification_type ENUM('HOST', 'RECEPTION', 'SECURITY') NOT NULL COMMENT 'Dispatch category classification code',
    delivery_channel ENUM('EMAIL', 'SMS', 'PUSH', 'SYSTEM', 'WHATSAPP') NOT NULL COMMENT 'Transmission carrier channel',
    delivery_status ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ') NOT NULL DEFAULT 'PENDING' COMMENT 'Job progress status indicator',
    notification_timestamp DATETIME NOT NULL COMMENT 'Job dispatch execution timestamp',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if alert log is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_cn_checkin FOREIGN KEY (checkin_id) REFERENCES visitor_checkins(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Deliverability alerts catalog dispatched upon lobby arrival';

-- Table 9: visitor_access_sessions
CREATE TABLE visitor_access_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique visitor movement tracking ID',
    session_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    checkin_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor checkins transaction',
    session_start DATETIME NOT NULL COMMENT 'Session start rules',
    session_end DATETIME NULL COMMENT 'Session checkout rules',
    current_location VARCHAR(150) NULL COMMENT 'Last reported scan sector details (e.g. Server Room A entrance)',
    current_zone_id BIGINT UNSIGNED NULL COMMENT 'Reference to access perimeter zone context',
    current_floor_id BIGINT UNSIGNED NULL COMMENT 'Reference to physical floor context',
    current_building_id BIGINT UNSIGNED NULL COMMENT 'Reference to physical building context',
    status ENUM('ACTIVE', 'IDLE', 'COMPLETED', 'TIMEOUT') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Visitor movement tracking status state',
    idle_time_minutes INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Visual track metrics tracing physical delay gaps',
    last_activity_time DATETIME NOT NULL COMMENT 'Last movement scanned timestamp rules',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if session record is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_vas_checkin FOREIGN KEY (checkin_id) REFERENCES visitor_checkins(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vas_zone FOREIGN KEY (current_zone_id) REFERENCES access_zones(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_vas_floor FOREIGN KEY (current_floor_id) REFERENCES floors(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_vas_building FOREIGN KEY (current_building_id) REFERENCES buildings(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Logs monitoring live visitor locations and session timeouts';

-- Table 10: checkin_documents
CREATE TABLE checkin_documents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique document ID',
    document_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    checkin_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor checkins transaction',
    document_type ENUM('PASSPORT', 'NATIONAL_ID', 'DRIVING_LICENSE', 'VISA', 'INVITATION_LETTER', 'COMPANY_ID', 'BUSINESS_LICENSE', 'HEALTH_CERTIFICATE', 'VACCINATION_CERTIFICATE') NOT NULL COMMENT 'Identity check classification type',
    file_url VARCHAR(500) NOT NULL COMMENT 'Secure storage path location to checkin document file',
    verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING' COMMENT 'Document authenticity status flag',
    expiry_date DATE NULL COMMENT 'Document expiration date rules',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if checkin document record is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_cd_checkin FOREIGN KEY (checkin_id) REFERENCES visitor_checkins(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Digitized document catalogs uploaded during lobby checkins';

-- Table 11: checkin_incidents
CREATE TABLE checkin_incidents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique incident report ID',
    incident_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    checkin_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor checkins transaction',
    incident_type ENUM('FAKE_DOCUMENT', 'EXPIRED_PASS', 'UNAUTHORIZED_VISITOR', 'AGGRESSIVE_VISITOR', 'WEAPON_FOUND', 'MEDICAL_EMERGENCY', 'SECURITY_ALERT', 'POLICY_VIOLATION', 'SUSPICIOUS_BEHAVIOR') NOT NULL COMMENT 'Security categorization codes',
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'LOW' COMMENT 'Level classification ranking',
    description TEXT NOT NULL COMMENT 'Incident logs detailed narrative',
    action_taken TEXT NULL COMMENT 'Incident resolution action details',
    resolved_by_user_id BIGINT UNSIGNED NULL COMMENT 'Reference to resolving safety officer user account',
    resolution_time DATETIME NULL COMMENT 'Resolution timestamp rules',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if incident record is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_ci_checkin_ref FOREIGN KEY (checkin_id) REFERENCES visitor_checkins(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ci_resolver_ref FOREIGN KEY (resolved_by_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Threat incident reports logged during check-in processing';

-- Table 12: biometric_checkins
CREATE TABLE biometric_checkins (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique biometric checkin ID',
    biometric_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    checkin_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor checkins transaction',
    biometric_type ENUM('FINGERPRINT', 'FACE_RECOGNITION', 'PALM_RECOGNITION', 'IRIS_RECOGNITION', 'VOICE_RECOGNITION') NOT NULL COMMENT 'Identity check classification type',
    template_data BLOB NOT NULL COMMENT 'Stored biometric metadata vector',
    confidence_score DECIMAL(5,2) NOT NULL COMMENT 'Identity verification confidence score percentages (e.g. 98.50%)',
    verification_result ENUM('PASSED', 'FAILED') NOT NULL DEFAULT 'PASSED' COMMENT 'Verification results status flag',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if biometric record is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_bc_checkin FOREIGN KEY (checkin_id) REFERENCES visitor_checkins(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Facial recognition scans and biometric checkpoints logs';

-- Table 13: checkin_audit_trail
CREATE TABLE checkin_audit_trail (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique checkin audit history ID',
    audit_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    checkin_id BIGINT UNSIGNED NULL COMMENT 'Reference to visitor checkins transaction (optional)',
    action VARCHAR(100) NOT NULL COMMENT 'Checkin transaction audit action code (e.g. PASS_VALIDATED)',
    description TEXT NULL COMMENT 'Visual text narrative detailing checkin event transaction',
    performed_by_user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to staff user executing action',
    timestamp DATETIME NOT NULL COMMENT 'Checkin audit timestamp rules',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if audit log record is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_cat_checkin FOREIGN KEY (checkin_id) REFERENCES visitor_checkins(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_cat_user FOREIGN KEY (performed_by_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Lobby checkin transaction audit trail timeline logs';

-- Table 14: denied_checkins
CREATE TABLE denied_checkins (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique denied entry record ID',
    denied_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to denied visitor profiles database record',
    appointment_id BIGINT UNSIGNED NULL COMMENT 'Reference to appointments (optional)',
    reason ENUM('EXPIRED_PASS', 'FAKE_ID', 'NO_APPOINTMENT', 'HOST_REJECTED', 'SECURITY_REJECTED', 'VISITOR_BLACKLISTED', 'OUTSIDE_VISITING_HOURS', 'DUPLICATE_CHECKIN', 'SUSPICIOUS_ACTIVITY') NOT NULL COMMENT 'Checkin denial reasons',
    denied_by_user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to denying safety officer user account',
    recommendation TEXT NULL COMMENT 'Security recommendation guidelines',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if denied record is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_dc_visitor FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_dc_appt FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_dc_officer FOREIGN KEY (denied_by_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Security logs tracking check-in rejections and perimeter controls';

-- Table 15: emergency_checkins
CREATE TABLE emergency_checkins (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique emergency checkin ID',
    emergency_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    checkin_id BIGINT UNSIGNED NULL COMMENT 'Reference to visitor checkins transaction (optional)',
    visitor_type ENUM('POLICE', 'FIRE_DEPARTMENT', 'AMBULANCE', 'GOVERNMENT_OFFICIALS', 'EMERGENCY_CONTRACTOR', 'MEDICAL_TEAM', 'VIP_EMERGENCY') NOT NULL COMMENT 'Emergency classification categorization',
    priority ENUM('MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'HIGH' COMMENT 'Emergency priority indicator tier',
    approval_reference VARCHAR(100) NULL COMMENT 'Verbal or manual bypass authorization reference code',
    emergency_contact VARCHAR(150) NULL COMMENT 'Contact name or department label',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if emergency record is active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_ec_checkin FOREIGN KEY (checkin_id) REFERENCES visitor_checkins(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Clearance override logs for emergency vehicle perimeter bypass';

-- =====================================================================================
-- 12. CIRCULAR RELATIONSHIPS & SELF-REFERENTIAL FOREIGN KEYS (ALTER STAGE)
-- =====================================================================================

ALTER TABLE users
ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_users_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_users_job_title_id FOREIGN KEY (job_title_id) REFERENCES job_titles(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE roles
ADD CONSTRAINT fk_roles_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_roles_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_roles_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE permissions
ADD CONSTRAINT fk_permissions_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_permissions_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_permissions_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE facilities
ADD CONSTRAINT fk_facilities_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_facilities_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_facilities_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE departments
ADD CONSTRAINT fk_dept_manager FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT fk_dept_manager_legacy FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT fk_dept_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_dept_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_dept_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_dept_parent FOREIGN KEY (parent_department_id) REFERENCES departments(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE job_titles
ADD CONSTRAINT fk_job_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_job_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_job_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE employees
ADD CONSTRAINT fk_emp_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_emp_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_emp_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE meeting_rooms
ADD CONSTRAINT fk_rooms_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_rooms_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_rooms_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE visitors
ADD CONSTRAINT fk_visitors_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_visitors_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_visitors_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE appointments
ADD CONSTRAINT fk_app_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_app_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_app_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE agreements
ADD CONSTRAINT fk_agreements_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_agreements_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_agreements_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Module 3 Organization Management Schema Linkages
ALTER TABLE facilities
ADD COLUMN branch_id BIGINT UNSIGNED NULL COMMENT 'Reference to corporate organization branch context',
ADD CONSTRAINT fk_facilities_branch FOREIGN KEY (branch_id) REFERENCES organization_branches(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE departments
ADD COLUMN business_unit_id BIGINT UNSIGNED NULL COMMENT 'Reference to corporate business unit division context',
ADD CONSTRAINT fk_departments_bu FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE employees
ADD COLUMN organization_id BIGINT UNSIGNED NULL COMMENT 'Reference to master corporate organization context',
ADD COLUMN branch_id BIGINT UNSIGNED NULL COMMENT 'Reference to corporate organization branch context',
ADD COLUMN business_unit_id BIGINT UNSIGNED NULL COMMENT 'Reference to corporate business unit division context',
ADD COLUMN team_id BIGINT UNSIGNED NULL COMMENT 'Reference to corporate department workteam context',
ADD COLUMN position_id BIGINT UNSIGNED NULL COMMENT 'Reference to corporate job position grade context',
ADD COLUMN office_id BIGINT UNSIGNED NULL COMMENT 'Reference to physical corporate office desk assignment context',
ADD CONSTRAINT fk_employees_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_employees_branch FOREIGN KEY (branch_id) REFERENCES organization_branches(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_employees_bu FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_employees_team FOREIGN KEY (team_id) REFERENCES teams(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_employees_pos FOREIGN KEY (position_id) REFERENCES job_positions(id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_employees_office FOREIGN KEY (office_id) REFERENCES offices(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Module 8 Reception Management Schema Linkages
ALTER TABLE visitor_documents
MODIFY COLUMN verification_status ENUM('PENDING', 'VERIFIED', 'FAILED', 'REJECTED', 'EXPIRED') DEFAULT 'PENDING' COMMENT 'Document authenticity status';

-- =====================================================================================
-- 13. DATA INDEXES DESIGN FOR HIGH-FREQUENCY QUERIES
-- =====================================================================================

-- RBAC Mappings
CREATE INDEX idx_roles_status ON roles(status);
CREATE INDEX idx_roles_role_code ON roles(role_code);
CREATE INDEX idx_roles_created_at ON roles(created_at);

CREATE INDEX idx_permissions_module ON permissions(module);
CREATE INDEX idx_permissions_status ON permissions(status);
CREATE INDEX idx_permissions_code ON permissions(permission_code);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX idx_role_permissions_lookup ON role_permissions(role_id, permission_id);

CREATE INDEX idx_user_roles_user_role ON user_roles(user_id, role_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_is_active ON user_roles(is_active);
CREATE INDEX idx_user_roles_assigned_at ON user_roles(assigned_at);
CREATE INDEX idx_user_roles_expires_at ON user_roles(expires_at);

-- User Profile Lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(account_status);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login ON users(last_login_at);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_dept ON users (department_id);

CREATE INDEX idx_dept_parent_id ON departments(parent_department_id);
CREATE INDEX idx_dept_manager_id ON departments(manager_user_id);
CREATE INDEX idx_dept_status_deleted ON departments(status, deleted_at, id);

CREATE INDEX idx_job_status_deleted ON job_titles(status, deleted_at, id);

CREATE INDEX idx_emp_user ON employees (user_id);
CREATE INDEX idx_emp_dept ON employees (department_id);
CREATE INDEX idx_emp_job_title ON employees (job_title_id);
CREATE INDEX idx_emp_manager ON employees (manager_employee_id);
CREATE INDEX idx_emp_facility ON employees (facility_id);
CREATE INDEX idx_emp_status_deleted ON employees (employment_status, deleted_at, id);

CREATE INDEX idx_schedule_user ON employee_schedule (user_id);

CREATE INDEX idx_failed_login_email ON failed_login_attempts (email);

-- Visitor & Compliance Lookups
CREATE INDEX idx_visitors_user ON visitors (user_id);
CREATE INDEX idx_visitors_email ON visitors (email);
CREATE INDEX idx_visitor_docs_visitor ON visitor_documents (visitor_id);

CREATE INDEX idx_vs_visitor ON visitor_signatures(visitor_id);
CREATE INDEX idx_vs_agreement ON visitor_signatures(agreement_id);

-- Operational Schedule Lookups
-- Operational Schedule Lookups (Module 4 & Legacy)
CREATE INDEX idx_appointments_visitor ON appointments (visitor_id);
CREATE INDEX idx_appointments_host ON appointments (host_id);
CREATE INDEX idx_appointments_dept ON appointments (department_id);
CREATE INDEX idx_appointments_room ON appointments (room_id);
CREATE INDEX idx_appointments_status ON appointments (appointment_status, approval_status);
CREATE INDEX idx_appointments_status_compat ON appointments (status);
CREATE INDEX idx_appointments_sched ON appointments (scheduled_start, scheduled_end);
CREATE INDEX idx_appointments_facility ON appointments (facility_id);

CREATE INDEX idx_app_docs_appt ON appointment_documents (appointment_id);
CREATE INDEX idx_arh_appt ON appointment_reschedule_history (appointment_id);

CREATE INDEX idx_steps_workflow ON approval_steps (workflow_id);
CREATE INDEX idx_steps_role ON approval_steps (approver_role_id);
CREATE INDEX idx_steps_user ON approval_steps (approver_id);
CREATE INDEX idx_approvals_appt ON appointment_approvals (appointment_id);
CREATE INDEX idx_apv_appointment_level ON appointment_approvals (appointment_id, approval_level);

-- Module 4 Scheduling & Workflow Indexes
CREATE INDEX idx_rb_room_time ON room_bookings (room_id, booking_start, booking_end);
CREATE INDEX idx_cle_sync ON calendar_events (provider, sync_status, last_sync_at);
CREATE INDEX idx_prt_lookup ON appointment_participants (appointment_id, participant_type);
CREATE INDEX idx_ntf_status ON appointment_notifications (status, retry_count);
CREATE INDEX idx_pkr_plate ON parking_reservations (vehicle_plate, status);

-- Module 6 Approval Workflow Management Indexes
CREATE INDEX idx_apc_workflow ON approval_conditions (workflow_id, is_active);
CREATE INDEX idx_apc_field ON approval_conditions (field_name);
CREATE INDEX idx_apd_delegator ON approval_delegations (delegator_id, is_active, start_date, end_date);
CREATE INDEX idx_apd_delegate ON approval_delegations (delegate_id, is_active);
CREATE INDEX idx_apc_app_user ON approval_comments (appointment_id, user_id);
CREATE INDEX idx_aph_app_wf ON approval_history (appointment_id, workflow_id, step_id);
CREATE INDEX idx_ape_app_status ON approval_escalations (appointment_id, status);
CREATE INDEX idx_ape_original_escalated ON approval_escalations (original_approver_id, escalated_to_id);
CREATE INDEX idx_apn_recipient_status ON approval_notifications (recipient_id, status);
CREATE INDEX idx_apn_created_at ON approval_notifications (created_at);
CREATE INDEX idx_aal_user_action ON approval_audit_logs (user_id, action);

-- Module 7 Calendar & Scheduling Indexes
CREATE INDEX idx_cep_event_role ON calendar_event_participants (event_id, role_type);
CREATE INDEX idx_cep_user_visitor ON calendar_event_participants (user_id, visitor_id);
CREATE INDEX idx_crs_code_type ON calendar_resources (resource_code, resource_type);
CREATE INDEX idx_rcb_res_times ON resource_bookings (resource_id, booking_start, booking_end);
CREATE INDEX idx_ewh_emp_day ON employee_working_hours (employee_id, weekday);
CREATE INDEX idx_eto_emp_times ON employee_time_off (employee_id, start_datetime, end_datetime);
CREATE INDEX idx_ogh_date_type ON organization_holidays (holiday_date, holiday_type);
CREATE INDEX idx_cts_start_end ON calendar_time_slots (slot_start, slot_end);
CREATE INDEX idx_cts_res_emp ON calendar_time_slots (resource_id, employee_id);
CREATE INDEX idx_scc_event_booking ON schedule_conflicts (first_event_id, second_event_id, resource_booking_id);
CREATE INDEX idx_rcs_event_dates ON recurring_schedules (event_id, start_date, end_date);
CREATE INDEX idx_crm_event_recipient ON calendar_reminders (event_id, recipient_id, status);
CREATE INDEX idx_cps_owner_target ON calendar_permissions (target_calendar_owner_id, user_id, role_id, department_id);
CREATE INDEX idx_csa_user_provider ON calendar_sync_accounts (user_id, provider, sync_status);
CREATE INDEX idx_csl_account ON calendar_sync_logs (sync_account_id, success);

-- Module 3 Organization Management Indexes
CREATE INDEX idx_org_code_status ON organizations (code, status);
CREATE INDEX idx_ob_org_code ON organization_branches (organization_id, branch_code);
CREATE INDEX idx_bu_org_code ON business_units (organization_id, unit_code);
CREATE INDEX idx_team_dept_code ON teams (department_id, team_code);
CREATE INDEX idx_jp_code_level ON job_positions (position_code, grade_level);
CREATE INDEX idx_eh_emp_super ON employee_hierarchy (employee_id, supervisor_employee_id);
CREATE INDEX idx_bldg_branch ON buildings (branch_id, building_code);
CREATE INDEX idx_floor_bldg ON floors (building_id, floor_number);
CREATE INDEX idx_office_floor_dept ON offices (floor_id, department_id, status);
CREATE INDEX idx_ws_name_shift ON work_schedules (shift_name);
CREATE INDEX idx_hld_date_branch ON enterprise_holidays (holiday_date, branch_id);
CREATE INDEX idx_oa_branch_type ON organization_assets (branch_id, asset_type, status);
CREATE INDEX idx_az_bldg_level ON access_zones (building_id, security_level);
CREATE INDEX idx_cc_dept_code ON cost_centers (department_id, code);
CREATE INDEX idx_ec_emp ON emergency_contacts (employee_id);
CREATE INDEX idx_os_org_key ON organization_settings (organization_id, setting_key);
CREATE INDEX idx_od_org_type ON organization_documents (organization_id, document_type);

-- Module 8 Reception Management Indexes
CREATE INDEX idx_rd_building_floor ON reception_desks (building_id, floor_id);
CREATE INDEX idx_ra_user_desk ON receptionist_assignments (user_id, desk_id, is_current);
CREATE INDEX idx_va_visitor_app ON visitor_arrivals (visitor_id, appointment_id, arrival_status);
CREATE INDEX idx_va_desk_receptionist ON visitor_arrivals (desk_id, receptionist_user_id);
CREATE INDEX idx_idv_visitor_status ON identity_verifications (visitor_id, status);
CREATE INDEX idx_wa_building_floor ON waiting_areas (building_id, floor_id);
CREATE INDEX idx_vwq_number_status ON visitor_waiting_queue (queue_number, status, priority);
CREATE INDEX idx_hn_host_visitor ON host_notifications (host_user_id, visitor_id, delivery_status);
CREATE INDEX idx_rac_user_type ON reception_actions (performed_by_user_id, action_type);
CREATE INDEX idx_rn_visitor_receptionist ON reception_notes (visitor_id, receptionist_user_id, is_confidential);
CREATE INDEX idx_ri_visitor_type ON reception_incidents (visitor_id, incident_type, severity);
CREATE INDEX idx_rs_summary_date ON reception_statistics (summary_date);

-- Module 10 Check-In Management Indexes
CREATE INDEX idx_cg_building ON checkin_gates (building_id);
CREATE INDEX idx_vc_visitor_appt_pass ON visitor_checkins (visitor_id, appointment_id, visitor_pass_id);
CREATE INDEX idx_vc_arrival_gate ON visitor_checkins (reception_arrival_id, gate_id);
CREATE INDEX idx_vc_receptionist_security ON visitor_checkins (receptionist_user_id, security_officer_user_id);
CREATE INDEX idx_vc_org_building_floor ON visitor_checkins (organization_id, building_id, floor_id);
CREATE INDEX idx_vc_status_times ON visitor_checkins (status, checkin_time, actual_checkout_time);
CREATE INDEX idx_cv_checkin_type_result ON checkin_verifications (checkin_id, verification_type, result);
CREATE INDEX idx_css_checkin_result ON checkin_security_screenings (checkin_id, screening_result, risk_level);
CREATE INDEX idx_cag_checkin_level ON checkin_access_grants (checkin_id, access_level_code);
CREATE INDEX idx_cag_zone_building_floor ON checkin_access_grants (zone_id, building_id, floor_id);
CREATE INDEX idx_cgl_gate_checkin ON checkin_gate_logs (gate_id, checkin_id, scan_result);
CREATE INDEX idx_vb_checkin_type_status ON visitor_belongings (checkin_id, item_type, returned_status);
CREATE INDEX idx_cn_checkin_channel_status ON checkin_notifications (checkin_id, delivery_channel, delivery_status);
CREATE INDEX idx_vas_checkin_status ON visitor_access_sessions (checkin_id, status);
CREATE INDEX idx_vas_location_zone ON visitor_access_sessions (current_location, current_zone_id);
CREATE INDEX idx_cd_checkin_type_status ON checkin_documents (checkin_id, document_type, verification_status);
CREATE INDEX idx_ci_checkin_type_severity ON checkin_incidents (checkin_id, incident_type, severity);
CREATE INDEX idx_bc_checkin_type_result ON biometric_checkins (checkin_id, biometric_type, verification_result);
CREATE INDEX idx_cat_checkin_action ON checkin_audit_trail (checkin_id, action);
CREATE INDEX idx_dc_visitor_appt ON denied_checkins (visitor_id, appointment_id, reason);
CREATE INDEX idx_ec_checkin_type ON emergency_checkins (checkin_id, visitor_type, priority);

-- Lobby Transaction Mappings
CREATE INDEX idx_passes_appt ON visitor_passes (appointment_id);
CREATE INDEX idx_checkins_appt ON checkins (appointment_id);
CREATE INDEX idx_checkins_pass ON checkins (pass_id);
CREATE INDEX idx_checkins_receptionist ON checkins (receptionist_id);
CREATE INDEX idx_checkins_times ON checkins (checked_in_at, checked_out_at);
CREATE INDEX idx_checkins_facility ON checkins (facility_id);

-- Incident Control Lookups
CREATE INDEX idx_watchlist_visitor ON visitor_watchlist (visitor_id);
CREATE INDEX idx_incidents_reporter ON security_incidents (reporter_id);
CREATE INDEX idx_incidents_visitor ON security_incidents (visitor_id);
CREATE INDEX idx_incidents_appt ON security_incidents (appointment_id);

-- Message & Settings Lookups
CREATE INDEX idx_notif_user_status ON notifications (user_id, status);
CREATE INDEX idx_notif_visitor ON notifications (visitor_email);
CREATE INDEX idx_audit_actor ON audit_logs (user_id);
CREATE INDEX idx_audit_created ON audit_logs (created_at);

-- Threat & Session Lookups
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_is_active ON user_sessions(is_active);
CREATE INDEX idx_sessions_login_at ON user_sessions(login_at);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_sessions_last_activity ON user_sessions(last_activity_at);

CREATE INDEX idx_ip_block_ip ON ip_blocklist(ip_address);
CREATE INDEX idx_ip_block_status ON ip_blocklist(status);
CREATE INDEX idx_ip_block_is_blocked ON ip_blocklist(is_blocked);
CREATE INDEX idx_ip_block_unblock_at ON ip_blocklist(unblock_at);
CREATE INDEX idx_ip_block_failed_attempts ON ip_blocklist(failed_attempts);
CREATE INDEX idx_ip_block_blocked_at ON ip_blocklist(blocked_at);

CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_token ON password_resets(reset_token);
CREATE INDEX idx_password_resets_status ON password_resets(status);
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);
CREATE INDEX idx_password_resets_requested_at ON password_resets(requested_at);
CREATE INDEX idx_password_resets_is_active ON password_resets(is_active);

CREATE INDEX idx_password_history_user_id ON password_history(user_id);
CREATE INDEX idx_password_history_changed_at ON password_history(changed_at);
CREATE INDEX idx_password_history_is_active ON password_history(is_active);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_is_active ON refresh_tokens(is_active);
CREATE INDEX idx_refresh_tokens_issued_at ON refresh_tokens(issued_at);
CREATE INDEX idx_refresh_tokens_revoked_at ON refresh_tokens(revoked_at);

CREATE INDEX idx_login_anomalies_user ON login_anomalies(user_id);
CREATE INDEX idx_login_anomalies_type ON login_anomalies(anomaly_type);
CREATE INDEX idx_login_anomalies_risk_score ON login_anomalies(risk_score);
CREATE INDEX idx_login_anomalies_severity ON login_anomalies(severity);
CREATE INDEX idx_login_anomalies_status ON login_anomalies(status);
CREATE INDEX idx_login_anomalies_detected_at ON login_anomalies(detected_at);
CREATE INDEX idx_login_anomalies_ip ON login_anomalies(ip_address);
CREATE INDEX idx_login_anomalies_device ON login_anomalies(device_fingerprint);

CREATE INDEX idx_auth_settings_key ON authentication_settings(setting_key);
CREATE INDEX idx_auth_settings_active ON authentication_settings(is_active);
CREATE INDEX idx_auth_settings_system ON authentication_settings(is_system);

CREATE INDEX idx_user_otp_user_id ON user_otp(user_id);
CREATE INDEX idx_user_otp_code ON user_otp(otp_code);
CREATE INDEX idx_user_otp_type ON user_otp(otp_type);
CREATE INDEX idx_user_otp_status ON user_otp(status);
CREATE INDEX idx_user_otp_expires_at ON user_otp(expires_at);
CREATE INDEX idx_user_otp_requested_at ON user_otp(requested_at);
CREATE INDEX idx_user_otp_active ON user_otp(is_active);

CREATE INDEX idx_trusted_devices_user ON trusted_devices(user_id);
CREATE INDEX idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);
CREATE INDEX idx_trusted_devices_status ON trusted_devices(status);
CREATE INDEX idx_trusted_devices_trust_level ON trusted_devices(trust_level);
CREATE INDEX idx_trusted_devices_last_seen ON trusted_devices(last_seen_at);
CREATE INDEX idx_trusted_devices_is_trusted ON trusted_devices(is_trusted);

CREATE INDEX idx_policy_key ON policy_engine(policy_key);
CREATE INDEX idx_policy_category ON policy_engine(category);
CREATE INDEX idx_policy_active ON policy_engine(is_active);
CREATE INDEX idx_policy_priority ON policy_engine(priority_level);

CREATE INDEX idx_risk_user ON risk_profile(user_id);
CREATE INDEX idx_risk_score ON risk_profile(risk_score);
CREATE INDEX idx_risk_level ON risk_profile(risk_level);
CREATE INDEX idx_risk_status ON risk_profile(status);
CREATE INDEX idx_risk_blocked ON risk_profile(is_blocked);

-- =====================================================================================
-- 14. COMPATIBILITY SYNCHRONIZATION TRIGGERS
-- =====================================================================================

DELIMITER //

-- Departments Sync Triggers
CREATE TRIGGER trg_departments_manager_insert
BEFORE INSERT ON departments
FOR EACH ROW
BEGIN
    IF NEW.manager_id IS NULL AND NEW.manager_user_id IS NOT NULL THEN
        SET NEW.manager_id = NEW.manager_user_id;
    ELSEIF NEW.manager_user_id IS NULL AND NEW.manager_id IS NOT NULL THEN
        SET NEW.manager_user_id = NEW.manager_id;
    END IF;
END;
//

CREATE TRIGGER trg_departments_manager_update
BEFORE UPDATE ON departments
FOR EACH ROW
BEGIN
    IF NOT (NEW.manager_user_id <=> OLD.manager_user_id) THEN
        SET NEW.manager_id = NEW.manager_user_id;
    ELSEIF NOT (NEW.manager_id <=> OLD.manager_id) THEN
        SET NEW.manager_user_id = NEW.manager_id;
    END IF;
END;
//

-- Audit Logs Sync Trigger
CREATE TRIGGER trg_audit_logs_sync
BEFORE INSERT ON audit_logs
FOR EACH ROW
BEGIN
    -- Sync actor_id and user_id
    IF NEW.actor_id IS NULL AND NEW.user_id IS NOT NULL THEN
        SET NEW.actor_id = NEW.user_id;
    ELSEIF NEW.user_id IS NULL AND NEW.actor_id IS NOT NULL THEN
        SET NEW.user_id = NEW.actor_id;
    END IF;

    -- Sync table_name and entity
    IF NEW.table_name IS NULL AND NEW.entity IS NOT NULL THEN
        SET NEW.table_name = NEW.entity;
    ELSEIF NEW.entity IS NULL AND NEW.table_name IS NOT NULL THEN
        SET NEW.entity = NEW.table_name;
    END IF;

    -- Sync entity_id and record_id
    IF NEW.entity_id IS NULL AND NEW.record_id IS NOT NULL THEN
        SET NEW.entity_id = NEW.record_id;
    ELSEIF NEW.record_id IS NULL AND NEW.entity_id IS NOT NULL THEN
        SET NEW.record_id = NEW.entity_id;
    END IF;

    -- Sync metadata_json and new_values
    IF NEW.metadata_json IS NULL AND NEW.new_values IS NOT NULL THEN
        SET NEW.metadata_json = NEW.new_values;
    ELSEIF NEW.new_values IS NULL AND NEW.metadata_json IS NOT NULL THEN
        SET NEW.new_values = NEW.metadata_json;
    END IF;
END;
//

CREATE TRIGGER trg_users_before_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    -- Sync user_id alias
    IF NEW.user_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.user_id = NEW.id;
        ELSE
            SET NEW.user_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users');
        END IF;
    END IF;

    -- Sync full_name <-> first_name/last_name
    IF (NEW.full_name IS NULL OR NEW.full_name = '') AND (NEW.first_name IS NOT NULL AND NEW.first_name != '') THEN
        SET NEW.full_name = TRIM(CONCAT(NEW.first_name, ' ', COALESCE(NEW.middle_name, ''), ' ', NEW.last_name));
    ELSEIF (NEW.full_name IS NOT NULL AND NEW.full_name != '') AND (NEW.first_name IS NULL OR NEW.first_name = '') THEN
        SET NEW.first_name = SUBSTRING_INDEX(NEW.full_name, ' ', 1);
        SET NEW.last_name = SUBSTRING(NEW.full_name, LENGTH(SUBSTRING_INDEX(NEW.full_name, ' ', 1)) + 2);
    END IF;

    -- Sync phone <-> phone_number
    IF NEW.phone IS NOT NULL AND NEW.phone_number IS NULL THEN
        SET NEW.phone_number = NEW.phone;
    ELSEIF NEW.phone_number IS NOT NULL AND NEW.phone IS NULL THEN
        SET NEW.phone = NEW.phone_number;
    END IF;

    -- Sync avatar_url <-> profile_photo
    IF NEW.avatar_url IS NOT NULL AND NEW.profile_photo IS NULL THEN
        SET NEW.profile_photo = NEW.avatar_url;
    ELSEIF NEW.profile_photo IS NOT NULL AND NEW.avatar_url IS NULL THEN
        SET NEW.avatar_url = NEW.profile_photo;
    END IF;

    -- Sync status <-> account_status
    IF NEW.status IS NOT NULL AND (NEW.account_status = 'PENDING' OR NEW.account_status IS NULL) THEN
        SET NEW.account_status = CASE 
            WHEN NEW.status = 'active' THEN 'ACTIVE'
            WHEN NEW.status = 'locked' THEN 'LOCKED'
            ELSE 'INACTIVE'
        END;
    ELSEIF NEW.account_status IS NOT NULL THEN
        SET NEW.status = CASE 
            WHEN NEW.account_status = 'ACTIVE' THEN 'active'
            WHEN NEW.account_status = 'LOCKED' THEN 'locked'
            ELSE 'inactive'
        END;
    END IF;
    
    -- Sync role <-> role_id
    IF NEW.role_id IS NOT NULL AND (NEW.role IS NULL OR NEW.role = '') THEN
        SET NEW.role = CASE 
            WHEN NEW.role_id = 1 THEN 'admin'
            WHEN NEW.role_id = 2 THEN 'staff'
            WHEN NEW.role_id = 3 THEN 'receptionist'
            WHEN NEW.role_id = 4 THEN 'security_officer'
            WHEN NEW.role_id = 5 THEN 'visitor'
            WHEN NEW.role_id = 6 THEN 'manager'
        END;
    END IF;
    
    -- Sync job_title <-> job_title_id
    IF NEW.job_title_id IS NOT NULL AND (NEW.job_title IS NULL OR NEW.job_title = '') THEN
        SET NEW.job_title = (SELECT title_name FROM job_titles WHERE id = NEW.job_title_id);
    END IF;
    
    -- Default username if null
    IF NEW.username IS NULL OR NEW.username = '' THEN
        SET NEW.username = SUBSTRING_INDEX(NEW.email, '@', 1);
    END IF;
END;
//

CREATE TRIGGER trg_users_before_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    -- Sync user_id alias
    IF NEW.id <> OLD.id THEN
        SET NEW.user_id = NEW.id;
    END IF;

    -- Sync full_name <-> first_name/last_name
    IF NEW.full_name <> OLD.full_name OR (NEW.full_name IS NOT NULL AND OLD.full_name IS NULL) THEN
        SET NEW.first_name = SUBSTRING_INDEX(NEW.full_name, ' ', 1);
        SET NEW.last_name = SUBSTRING(NEW.full_name, LENGTH(SUBSTRING_INDEX(NEW.full_name, ' ', 1)) + 2);
    ELSEIF NEW.first_name <> OLD.first_name OR NEW.last_name <> OLD.last_name OR (NEW.first_name IS NOT NULL AND OLD.first_name IS NULL) OR (NEW.last_name IS NOT NULL AND OLD.last_name IS NULL) THEN
        SET NEW.full_name = TRIM(CONCAT(NEW.first_name, ' ', COALESCE(NEW.middle_name, ''), ' ', NEW.last_name));
    END IF;

    -- Sync phone <-> phone_number
    IF NEW.phone <> OLD.phone OR (NEW.phone IS NOT NULL AND OLD.phone IS NULL) THEN
        SET NEW.phone_number = NEW.phone;
    ELSEIF NEW.phone_number <> OLD.phone_number OR (NEW.phone_number IS NOT NULL AND OLD.phone_number IS NULL) THEN
        SET NEW.phone = NEW.phone_number;
    END IF;

    -- Sync avatar_url <-> profile_photo
    IF NEW.avatar_url <> OLD.avatar_url OR (NEW.avatar_url IS NOT NULL AND OLD.avatar_url IS NULL) THEN
        SET NEW.profile_photo = NEW.avatar_url;
    ELSEIF NEW.profile_photo <> OLD.profile_photo OR (NEW.profile_photo IS NOT NULL AND OLD.profile_photo IS NULL) THEN
        SET NEW.avatar_url = NEW.profile_photo;
    END IF;

    -- Sync status <-> account_status
    IF NEW.status <> OLD.status OR (NEW.status IS NOT NULL AND OLD.status IS NULL) THEN
        SET NEW.account_status = CASE 
            WHEN NEW.status = 'active' THEN 'ACTIVE'
            WHEN NEW.status = 'locked' THEN 'LOCKED'
            ELSE 'INACTIVE'
        END;
    ELSEIF NEW.account_status <> OLD.account_status OR (NEW.account_status IS NOT NULL AND OLD.account_status IS NULL) THEN
        SET NEW.status = CASE 
            WHEN NEW.account_status = 'ACTIVE' THEN 'active'
            WHEN NEW.account_status = 'LOCKED' THEN 'locked'
            ELSE 'inactive'
        END;
    END IF;

    -- Sync role <-> role_id
    IF NEW.role_id <> OLD.role_id OR (NEW.role_id IS NOT NULL AND OLD.role_id IS NULL) THEN
        SET NEW.role = CASE 
            WHEN NEW.role_id = 1 THEN 'admin'
            WHEN NEW.role_id = 2 THEN 'staff'
            WHEN NEW.role_id = 3 THEN 'receptionist'
            WHEN NEW.role_id = 4 THEN 'security_officer'
            WHEN NEW.role_id = 5 THEN 'visitor'
            WHEN NEW.role_id = 6 THEN 'manager'
        END;
    END IF;

    -- Sync job_title <-> job_title_id
    IF NEW.job_title_id <> OLD.job_title_id OR (NEW.job_title_id IS NOT NULL AND OLD.job_title_id IS NULL) THEN
        SET NEW.job_title = (SELECT title_name FROM job_titles WHERE id = NEW.job_title_id);
    END IF;
END;
//

CREATE TRIGGER trg_employees_before_insert
BEFORE INSERT ON employees
FOR EACH ROW
BEGIN
    -- Sync employee_id alias
    IF NEW.employee_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.employee_id = NEW.id;
        ELSE
            SET NEW.employee_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'employees');
        END IF;
    END IF;

    IF NEW.manager_employee_id IS NOT NULL AND NEW.manager_id IS NULL THEN
        SET NEW.manager_id = (SELECT user_id FROM employees WHERE id = NEW.manager_employee_id);
    ELSEIF NEW.manager_id IS NOT NULL AND NEW.manager_employee_id IS NULL THEN
        SET NEW.manager_employee_id = (SELECT id FROM employees WHERE user_id = NEW.manager_id);
    END IF;
END;
//

CREATE TRIGGER trg_employees_before_update
BEFORE UPDATE ON employees
FOR EACH ROW
BEGIN
    -- Sync employee_id alias
    IF NEW.id <> OLD.id THEN
        SET NEW.employee_id = NEW.id;
    END IF;

    IF NEW.manager_employee_id <> OLD.manager_employee_id OR (NEW.manager_employee_id IS NOT NULL AND OLD.manager_employee_id IS NULL) THEN
        SET NEW.manager_id = (SELECT user_id FROM employees WHERE id = NEW.manager_employee_id);
    ELSEIF NEW.manager_id <> OLD.manager_id OR (NEW.manager_id IS NOT NULL AND OLD.manager_id IS NULL) THEN
        SET NEW.manager_employee_id = (SELECT id FROM employees WHERE user_id = NEW.manager_id);
    END IF;
END;
//

CREATE TRIGGER trg_roles_before_insert
BEFORE INSERT ON roles
FOR EACH ROW
BEGIN
    IF NEW.role_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.role_id = NEW.id;
        ELSE
            SET NEW.role_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'roles');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_roles_before_update
BEFORE UPDATE ON roles
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.role_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_permissions_before_insert
BEFORE INSERT ON permissions
FOR EACH ROW
BEGIN
    IF NEW.permission_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.permission_id = NEW.id;
        ELSE
            SET NEW.permission_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'permissions');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_permissions_before_update
BEFORE UPDATE ON permissions
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.permission_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_facilities_before_insert
BEFORE INSERT ON facilities
FOR EACH ROW
BEGIN
    IF NEW.facility_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.facility_id = NEW.id;
        ELSE
            SET NEW.facility_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'facilities');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_facilities_before_update
BEFORE UPDATE ON facilities
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.facility_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_departments_before_insert
BEFORE INSERT ON departments
FOR EACH ROW
BEGIN
    IF NEW.department_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.department_id = NEW.id;
        ELSE
            SET NEW.department_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'departments');
        END IF;
    END IF;

    -- Self-referencing check
    IF NEW.parent_department_id IS NOT NULL THEN
        IF NEW.parent_department_id = NEW.department_id THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'chk_department_parent_self: parent_department_id cannot equal department_id';
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_departments_before_update
BEFORE UPDATE ON departments
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.department_id = NEW.id;
    END IF;

    -- Self-referencing check
    IF NEW.parent_department_id IS NOT NULL THEN
        IF NEW.parent_department_id = NEW.id THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'chk_department_parent_self: parent_department_id cannot equal id';
        ELSEIF NEW.parent_department_id = NEW.department_id THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'chk_department_parent_self: parent_department_id cannot equal department_id';
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_job_titles_before_insert
BEFORE INSERT ON job_titles
FOR EACH ROW
BEGIN
    IF NEW.job_title_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.job_title_id = NEW.id;
        ELSE
            SET NEW.job_title_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'job_titles');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_job_titles_before_update
BEFORE UPDATE ON job_titles
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.job_title_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_password_history_before_insert
BEFORE INSERT ON password_history
FOR EACH ROW
BEGIN
    IF NEW.password_history_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.password_history_id = NEW.id;
        ELSE
            SET NEW.password_history_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'password_history');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_password_history_before_update
BEFORE UPDATE ON password_history
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.password_history_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_user_sessions_before_insert
BEFORE INSERT ON user_sessions
FOR EACH ROW
BEGIN
    IF NEW.session_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.session_id = NEW.id;
        ELSE
            SET NEW.session_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'user_sessions');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_user_sessions_before_update
BEFORE UPDATE ON user_sessions
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.session_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_refresh_tokens_before_insert
BEFORE INSERT ON refresh_tokens
FOR EACH ROW
BEGIN
    IF NEW.refresh_token_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.refresh_token_id = NEW.id;
        ELSE
            SET NEW.refresh_token_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'refresh_tokens');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_refresh_tokens_before_update
BEFORE UPDATE ON refresh_tokens
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.refresh_token_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_agreements_before_insert
BEFORE INSERT ON agreements
FOR EACH ROW
BEGIN
    IF NEW.agreement_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.agreement_id = NEW.id;
        ELSE
            SET NEW.agreement_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'agreements');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_agreements_before_update
BEFORE UPDATE ON agreements
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.agreement_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_signatures_before_insert
BEFORE INSERT ON visitor_signatures
FOR EACH ROW
BEGIN
    IF NEW.signature_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.signature_id = NEW.id;
        ELSE
            SET NEW.signature_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_signatures');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_signatures_before_update
BEFORE UPDATE ON visitor_signatures
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.signature_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_audit_logs_before_insert
BEFORE INSERT ON audit_logs
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL THEN
        IF NEW.audit_id IS NOT NULL AND NEW.audit_id > 0 THEN
            SET NEW.id = NEW.audit_id;
        ELSE
            SET NEW.id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'audit_logs');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_audit_logs_before_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
BEGIN
    IF NEW.audit_id <> OLD.audit_id THEN
        SET NEW.id = NEW.audit_id;
    END IF;
END;
//

CREATE TRIGGER trg_security_questions_before_insert
BEFORE INSERT ON security_questions
FOR EACH ROW
BEGIN
    IF NEW.question_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.question_id = NEW.id;
        ELSE
            SET NEW.question_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'security_questions');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_security_questions_before_update
BEFORE UPDATE ON security_questions
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.question_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_user_security_answers_before_insert
BEFORE INSERT ON user_security_answers
FOR EACH ROW
BEGIN
    IF NEW.answer_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.answer_id = NEW.id;
        ELSE
            SET NEW.answer_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'user_security_answers');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_user_security_answers_before_update
BEFORE UPDATE ON user_security_answers
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.answer_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_user_oauth_identities_before_insert
BEFORE INSERT ON user_oauth_identities
FOR EACH ROW
BEGIN
    IF NEW.identity_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.identity_id = NEW.id;
        ELSE
            SET NEW.identity_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'user_oauth_identities');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_user_oauth_identities_before_update
BEFORE UPDATE ON user_oauth_identities
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.identity_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_types_before_insert
BEFORE INSERT ON visitor_types
FOR EACH ROW
BEGIN
    IF NEW.visitor_type_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.visitor_type_id = NEW.id;
        ELSE
            SET NEW.visitor_type_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_types');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_types_before_update
BEFORE UPDATE ON visitor_types
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.visitor_type_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_companies_before_insert
BEFORE INSERT ON visitor_companies
FOR EACH ROW
BEGIN
    IF NEW.visitor_company_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.visitor_company_id = NEW.id;
        ELSE
            SET NEW.visitor_company_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_companies');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_companies_before_update
BEFORE UPDATE ON visitor_companies
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.visitor_company_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitors_before_insert
BEFORE INSERT ON visitors
FOR EACH ROW
BEGIN
    -- Sync full_name split logic
    IF (NEW.full_name IS NULL OR NEW.full_name = '') AND (NEW.first_name IS NOT NULL AND NEW.first_name != '') THEN
        SET NEW.full_name = TRIM(CONCAT(NEW.first_name, ' ', COALESCE(NEW.middle_name, ''), ' ', NEW.last_name));
    ELSEIF (NEW.full_name IS NOT NULL AND NEW.full_name != '') AND (NEW.first_name IS NULL OR NEW.first_name = '') THEN
        SET NEW.first_name = SUBSTRING_INDEX(NEW.full_name, ' ', 1);
        SET NEW.last_name = SUBSTRING(NEW.full_name, LENGTH(SUBSTRING_INDEX(NEW.full_name, ' ', 1)) + 2);
    END IF;

    -- Sync company -> visitor_companies auto-link
    IF NEW.company IS NOT NULL AND NEW.company != '' AND NEW.visitor_company_id IS NULL THEN
        SET NEW.visitor_company_id = (SELECT id FROM visitor_companies WHERE company_name = NEW.company LIMIT 1);
    END IF;

    -- Sync category -> visitor_types auto-link
    IF NEW.category IS NOT NULL AND NEW.category != '' AND NEW.visitor_type_id IS NULL THEN
        SET NEW.visitor_type_id = (SELECT id FROM visitor_types WHERE type_name = NEW.category LIMIT 1);
    END IF;

    -- Sync visitor_id alias
    IF NEW.visitor_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.visitor_id = NEW.id;
        ELSE
            SET NEW.visitor_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitors');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitors_before_update
BEFORE UPDATE ON visitors
FOR EACH ROW
BEGIN
    -- Sync full_name update logic
    IF NEW.full_name <> OLD.full_name OR (NEW.full_name IS NOT NULL AND OLD.full_name IS NULL) THEN
        SET NEW.first_name = SUBSTRING_INDEX(NEW.full_name, ' ', 1);
        SET NEW.last_name = SUBSTRING(NEW.full_name, LENGTH(SUBSTRING_INDEX(NEW.full_name, ' ', 1)) + 2);
    ELSEIF NEW.first_name <> OLD.first_name OR NEW.last_name <> OLD.last_name OR (NEW.first_name IS NOT NULL AND OLD.first_name IS NULL) OR (NEW.last_name IS NOT NULL AND OLD.last_name IS NULL) THEN
        SET NEW.full_name = TRIM(CONCAT(NEW.first_name, ' ', COALESCE(NEW.middle_name, ''), ' ', NEW.last_name));
    END IF;

    -- Sync company change
    IF NEW.company <> OLD.company OR (NEW.company IS NOT NULL AND OLD.company IS NULL) THEN
        SET NEW.visitor_company_id = (SELECT id FROM visitor_companies WHERE company_name = NEW.company LIMIT 1);
    END IF;

    -- Sync category change
    IF NEW.category <> OLD.category OR (NEW.category IS NOT NULL AND OLD.category IS NULL) THEN
        SET NEW.visitor_type_id = (SELECT id FROM visitor_types WHERE type_name = NEW.category LIMIT 1);
    END IF;

    -- Sync visitor_id alias
    IF NEW.id <> OLD.id THEN
        SET NEW.visitor_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_documents_before_insert
BEFORE INSERT ON visitor_documents
FOR EACH ROW
BEGIN
    IF NEW.visitor_document_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.visitor_document_id = NEW.id;
        ELSE
            SET NEW.visitor_document_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_documents');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_documents_before_update
BEFORE UPDATE ON visitor_documents
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.visitor_document_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_photos_before_insert
BEFORE INSERT ON visitor_photos
FOR EACH ROW
BEGIN
    IF NEW.visitor_photo_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.visitor_photo_id = NEW.id;
        ELSE
            SET NEW.visitor_photo_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_photos');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_photos_before_update
BEFORE UPDATE ON visitor_photos
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.visitor_photo_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_addresses_before_insert
BEFORE INSERT ON visitor_addresses
FOR EACH ROW
BEGIN
    IF NEW.visitor_address_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.visitor_address_id = NEW.id;
        ELSE
            SET NEW.visitor_address_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_addresses');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_addresses_before_update
BEFORE UPDATE ON visitor_addresses
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.visitor_address_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_emergency_contacts_before_insert
BEFORE INSERT ON visitor_emergency_contacts
FOR EACH ROW
BEGIN
    IF NEW.emergency_contact_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.emergency_contact_id = NEW.id;
        ELSE
            SET NEW.emergency_contact_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_emergency_contacts');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_emergency_contacts_before_update
BEFORE UPDATE ON visitor_emergency_contacts
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.emergency_contact_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_identity_verification_before_insert
BEFORE INSERT ON visitor_identity_verification
FOR EACH ROW
BEGIN
    IF NEW.verification_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.verification_id = NEW.id;
        ELSE
            SET NEW.verification_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_identity_verification');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_identity_verification_before_update
BEFORE UPDATE ON visitor_identity_verification
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.verification_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_biometrics_before_insert
BEFORE INSERT ON visitor_biometrics
FOR EACH ROW
BEGIN
    IF NEW.biometric_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.biometric_id = NEW.id;
        ELSE
            SET NEW.biometric_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_biometrics');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_biometrics_before_update
BEFORE UPDATE ON visitor_biometrics
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.biometric_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_blacklist_before_insert
BEFORE INSERT ON visitor_blacklist
FOR EACH ROW
BEGIN
    IF NEW.blacklist_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.blacklist_id = NEW.id;
        ELSE
            SET NEW.blacklist_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_blacklist');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_blacklist_before_update
BEFORE UPDATE ON visitor_blacklist
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.blacklist_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_watchlist_before_insert
BEFORE INSERT ON visitor_watchlist
FOR EACH ROW
BEGIN
    IF NEW.watchlist_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.watchlist_id = NEW.id;
        ELSE
            SET NEW.watchlist_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_watchlist');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_watchlist_before_update
BEFORE UPDATE ON visitor_watchlist
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.watchlist_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_preferences_before_insert
BEFORE INSERT ON visitor_preferences
FOR EACH ROW
BEGIN
    IF NEW.preference_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.preference_id = NEW.id;
        ELSE
            SET NEW.preference_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_preferences');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_preferences_before_update
BEFORE UPDATE ON visitor_preferences
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.preference_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_tags_before_insert
BEFORE INSERT ON visitor_tags
FOR EACH ROW
BEGIN
    IF NEW.tag_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.tag_id = NEW.id;
        ELSE
            SET NEW.tag_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_tags');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_tags_before_update
BEFORE UPDATE ON visitor_tags
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.tag_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_notes_before_insert
BEFORE INSERT ON visitor_notes
FOR EACH ROW
BEGIN
    IF NEW.note_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.note_id = NEW.id;
        ELSE
            SET NEW.note_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_notes');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_notes_before_update
BEFORE UPDATE ON visitor_notes
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.note_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_status_history_before_insert
BEFORE INSERT ON visitor_status_history
FOR EACH ROW
BEGIN
    IF NEW.status_history_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.status_history_id = NEW.id;
        ELSE
            SET NEW.status_history_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_status_history');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_status_history_before_update
BEFORE UPDATE ON visitor_status_history
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.status_history_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_activity_log_before_insert
BEFORE INSERT ON visitor_activity_log
FOR EACH ROW
BEGIN
    IF NEW.activity_log_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.activity_log_id = NEW.id;
        ELSE
            SET NEW.activity_log_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_activity_log');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_activity_log_before_update
BEFORE UPDATE ON visitor_activity_log
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.activity_log_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_custom_fields_before_insert
BEFORE INSERT ON visitor_custom_fields
FOR EACH ROW
BEGIN
    IF NEW.custom_field_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.custom_field_id = NEW.id;
        ELSE
            SET NEW.custom_field_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_custom_fields');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_custom_fields_before_update
BEFORE UPDATE ON visitor_custom_fields
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.custom_field_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_custom_values_before_insert
BEFORE INSERT ON visitor_custom_values
FOR EACH ROW
BEGIN
    IF NEW.custom_value_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.custom_value_id = NEW.id;
        ELSE
            SET NEW.custom_value_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_custom_values');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_custom_values_before_update
BEFORE UPDATE ON visitor_custom_values
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.custom_value_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_relationships_before_insert
BEFORE INSERT ON visitor_relationships
FOR EACH ROW
BEGIN
    IF NEW.relationship_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.relationship_id = NEW.id;
        ELSE
            SET NEW.relationship_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_relationships');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_relationships_before_update
BEFORE UPDATE ON visitor_relationships
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.relationship_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_appointment_types_before_insert
BEFORE INSERT ON appointment_types
FOR EACH ROW
BEGIN
    IF NEW.appointment_type_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.appointment_type_id = NEW.id;
        ELSE
            IF @last_assigned_appt_type IS NULL OR @last_assigned_appt_type < (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'appointment_types') THEN
                SET @last_assigned_appt_type = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'appointment_types');
            ELSE
                SET @last_assigned_appt_type = @last_assigned_appt_type + 1;
            END IF;
            SET NEW.appointment_type_id = @last_assigned_appt_type;
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_appointment_types_before_update
BEFORE UPDATE ON appointment_types
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.appointment_type_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visit_purposes_before_insert
BEFORE INSERT ON visit_purposes
FOR EACH ROW
BEGIN
    IF NEW.visit_purpose_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.visit_purpose_id = NEW.id;
        ELSE
            IF @last_assigned_visit_purpose IS NULL OR @last_assigned_visit_purpose < (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visit_purposes') THEN
                SET @last_assigned_visit_purpose = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visit_purposes');
            ELSE
                SET @last_assigned_visit_purpose = @last_assigned_visit_purpose + 1;
            END IF;
            SET NEW.visit_purpose_id = @last_assigned_visit_purpose;
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visit_purposes_before_update
BEFORE UPDATE ON visit_purposes
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.visit_purpose_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_approval_workflows_before_insert
BEFORE INSERT ON approval_workflows
FOR EACH ROW
BEGIN
    IF NEW.workflow_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.workflow_id = NEW.id;
        ELSE
            IF @last_assigned_workflow IS NULL OR @last_assigned_workflow < (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'approval_workflows') THEN
                SET @last_assigned_workflow = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'approval_workflows');
            ELSE
                SET @last_assigned_workflow = @last_assigned_workflow + 1;
            END IF;
            SET NEW.workflow_id = @last_assigned_workflow;
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_approval_workflows_before_update
BEFORE UPDATE ON approval_workflows
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.workflow_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_meeting_rooms_before_insert
BEFORE INSERT ON meeting_rooms
FOR EACH ROW
BEGIN
    -- Sync legacy and new columns
    IF NEW.name IS NULL AND NEW.room_name IS NOT NULL THEN
        SET NEW.name = NEW.room_name;
    END IF;
    IF NEW.room_name IS NULL AND NEW.name IS NOT NULL THEN
        SET NEW.room_name = NEW.name;
    END IF;
    IF NEW.room_number IS NULL AND NEW.name IS NOT NULL THEN
        SET NEW.room_number = NEW.name;
    END IF;
    IF NEW.building IS NULL AND NEW.location IS NOT NULL THEN
        SET NEW.building = NEW.location;
    END IF;
    IF NEW.floor IS NULL THEN
        SET NEW.floor = '1';
    END IF;

    IF NEW.room_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.room_id = NEW.id;
        ELSE
            IF @last_assigned_room IS NULL OR @last_assigned_room < (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'meeting_rooms') THEN
                SET @last_assigned_room = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'meeting_rooms');
            ELSE
                SET @last_assigned_room = @last_assigned_room + 1;
            END IF;
            SET NEW.room_id = @last_assigned_room;
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_meeting_rooms_before_update
BEFORE UPDATE ON meeting_rooms
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.room_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_appointments_before_insert
BEFORE INSERT ON appointments
FOR EACH ROW
BEGIN
    IF NEW.appointment_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.appointment_id = NEW.id;
        ELSE
            IF @last_assigned_appt IS NULL OR @last_assigned_appt < (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'appointments') THEN
                SET @last_assigned_appt = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'appointments');
            ELSE
                SET @last_assigned_appt = @last_assigned_appt + 1;
            END IF;
            SET NEW.appointment_id = @last_assigned_appt;
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_appointments_before_update
BEFORE UPDATE ON appointments
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.appointment_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_appointment_approvals_before_insert
BEFORE INSERT ON appointment_approvals
FOR EACH ROW
BEGIN
    IF NEW.approval_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.approval_id = NEW.id;
        ELSE
            IF @last_assigned_approval IS NULL OR @last_assigned_approval < (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'appointment_approvals') THEN
                SET @last_assigned_approval = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'appointment_approvals');
            ELSE
                SET @last_assigned_approval = @last_assigned_approval + 1;
            END IF;
            SET NEW.approval_id = @last_assigned_approval;
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_appointment_approvals_before_update
BEFORE UPDATE ON appointment_approvals
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.approval_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_appointment_status_history_before_insert
BEFORE INSERT ON appointment_status_history
FOR EACH ROW
BEGIN
    IF NEW.history_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.history_id = NEW.id;
        ELSE
            IF @last_assigned_ash IS NULL OR @last_assigned_ash < (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'appointment_status_history') THEN
                SET @last_assigned_ash = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'appointment_status_history');
            ELSE
                SET @last_assigned_ash = @last_assigned_ash + 1;
            END IF;
            SET NEW.history_id = @last_assigned_ash;
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_appointment_status_history_before_update
BEFORE UPDATE ON appointment_status_history
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.history_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_appointment_reschedule_history_before_insert
BEFORE INSERT ON appointment_reschedule_history
FOR EACH ROW
BEGIN
    IF NEW.reschedule_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.reschedule_id = NEW.id;
        ELSE
            IF @last_assigned_arh IS NULL OR @last_assigned_arh < (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'appointment_reschedule_history') THEN
                SET @last_assigned_arh = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'appointment_reschedule_history');
            ELSE
                SET @last_assigned_arh = @last_assigned_arh + 1;
            END IF;
            SET NEW.reschedule_id = @last_assigned_arh;
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_appointment_reschedule_history_before_update
BEFORE UPDATE ON appointment_reschedule_history
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.reschedule_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_appointment_cancellations_before_insert
BEFORE INSERT ON appointment_cancellations
FOR EACH ROW
BEGIN
    IF NEW.cancellation_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.cancellation_id = NEW.id;
        ELSE
            IF @last_assigned_cnc IS NULL OR @last_assigned_cnc < (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'appointment_cancellations') THEN
                SET @last_assigned_cnc = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'appointment_cancellations');
            ELSE
                SET @last_assigned_cnc = @last_assigned_cnc + 1;
            END IF;
            SET NEW.cancellation_id = @last_assigned_cnc;
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_appointment_cancellations_before_update
BEFORE UPDATE ON appointment_cancellations
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.cancellation_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_room_bookings_before_insert
BEFORE INSERT ON room_bookings
FOR EACH ROW
BEGIN
    IF NEW.booking_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.booking_id = NEW.id;
        ELSE
            IF @last_assigned_rb IS NULL OR @last_assigned_rb < (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'room_bookings') THEN
                SET @last_assigned_rb = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'room_bookings');
            ELSE
                SET @last_assigned_rb = @last_assigned_rb + 1;
            END IF;
            SET NEW.booking_id = @last_assigned_rb;
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_room_bookings_before_update
BEFORE UPDATE ON room_bookings
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.booking_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_calendar_events_before_insert
BEFORE INSERT ON calendar_events
FOR EACH ROW
BEGIN
    IF NEW.event_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.event_id = NEW.id;
        ELSE
            IF @last_assigned_event IS NULL OR @last_assigned_event < (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'calendar_events') THEN
                SET @last_assigned_event = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'calendar_events');
            ELSE
                SET @last_assigned_event = @last_assigned_event + 1;
            END IF;
            SET NEW.event_id = @last_assigned_event;
        END IF;
    END IF;

    -- Sync legacy fields from appointments if not explicitly provided
    IF NEW.title IS NULL AND NEW.appointment_id IS NOT NULL THEN
        SET NEW.title = (SELECT CONCAT('Appointment ', reference_code) FROM appointments WHERE id = NEW.appointment_id);
    END IF;
    IF NEW.start_datetime IS NULL AND NEW.appointment_id IS NOT NULL THEN
        SET NEW.start_datetime = (SELECT scheduled_start FROM appointments WHERE id = NEW.appointment_id);
    END IF;
    IF NEW.end_datetime IS NULL AND NEW.appointment_id IS NOT NULL THEN
        SET NEW.end_datetime = (SELECT scheduled_end FROM appointments WHERE id = NEW.appointment_id);
    END IF;
    
    -- Fallbacks
    IF NEW.title IS NULL THEN
        SET NEW.title = 'Calendar Event';
    END IF;
    IF NEW.start_datetime IS NULL THEN
        SET NEW.start_datetime = CURRENT_TIMESTAMP;
    END IF;
    IF NEW.end_datetime IS NULL THEN
        SET NEW.end_datetime = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 HOUR);
    END IF;
END;
//

CREATE TRIGGER trg_calendar_events_before_update
BEFORE UPDATE ON calendar_events
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.event_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_approval_conditions_before_insert
BEFORE INSERT ON approval_conditions
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_approval_delegations_before_insert
BEFORE INSERT ON approval_delegations
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_approval_comments_before_insert
BEFORE INSERT ON approval_comments
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_approval_history_before_insert
BEFORE INSERT ON approval_history
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_approval_escalations_before_insert
BEFORE INSERT ON approval_escalations
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_approval_notifications_before_insert
BEFORE INSERT ON approval_notifications
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_calendar_event_participants_before_insert
BEFORE INSERT ON calendar_event_participants
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_calendar_resources_before_insert
BEFORE INSERT ON calendar_resources
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_resource_bookings_before_insert
BEFORE INSERT ON resource_bookings
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_employee_working_hours_before_insert
BEFORE INSERT ON employee_working_hours
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_employee_time_off_before_insert
BEFORE INSERT ON employee_time_off
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_organization_holidays_before_insert
BEFORE INSERT ON organization_holidays
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_calendar_time_slots_before_insert
BEFORE INSERT ON calendar_time_slots
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_schedule_conflicts_before_insert
BEFORE INSERT ON schedule_conflicts
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_recurring_schedules_before_insert
BEFORE INSERT ON recurring_schedules
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_calendar_reminders_before_insert
BEFORE INSERT ON calendar_reminders
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_calendar_permissions_before_insert
BEFORE INSERT ON calendar_permissions
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_calendar_sync_accounts_before_insert
BEFORE INSERT ON calendar_sync_accounts
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_calendar_sync_logs_before_insert
BEFORE INSERT ON calendar_sync_logs
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_organizations_before_insert
BEFORE INSERT ON organizations
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_organization_branches_before_insert
BEFORE INSERT ON organization_branches
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_business_units_before_insert
BEFORE INSERT ON business_units
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_teams_before_insert
BEFORE INSERT ON teams
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_job_positions_before_insert
BEFORE INSERT ON job_positions
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_employee_hierarchy_before_insert
BEFORE INSERT ON employee_hierarchy
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_buildings_before_insert
BEFORE INSERT ON buildings
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_floors_before_insert
BEFORE INSERT ON floors
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_offices_before_insert
BEFORE INSERT ON offices
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_work_schedules_before_insert
BEFORE INSERT ON work_schedules
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_enterprise_holidays_before_insert
BEFORE INSERT ON enterprise_holidays
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_organization_assets_before_insert
BEFORE INSERT ON organization_assets
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_access_zones_before_insert
BEFORE INSERT ON access_zones
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_cost_centers_before_insert
BEFORE INSERT ON cost_centers
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_emergency_contacts_before_insert
BEFORE INSERT ON emergency_contacts
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_organization_settings_before_insert
BEFORE INSERT ON organization_settings
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_organization_documents_before_insert
BEFORE INSERT ON organization_documents
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_reception_desks_before_insert
BEFORE INSERT ON reception_desks
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_receptionist_assignments_before_insert
BEFORE INSERT ON receptionist_assignments
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_arrivals_before_insert
BEFORE INSERT ON visitor_arrivals
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_identity_verifications_before_insert
BEFORE INSERT ON identity_verifications
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_waiting_areas_before_insert
BEFORE INSERT ON waiting_areas
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_waiting_queue_before_insert
BEFORE INSERT ON visitor_waiting_queue
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_host_notifications_before_insert
BEFORE INSERT ON host_notifications
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_reception_actions_before_insert
BEFORE INSERT ON reception_actions
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_reception_notes_before_insert
BEFORE INSERT ON reception_notes
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_reception_incidents_before_insert
BEFORE INSERT ON reception_incidents
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_reception_statistics_before_insert
BEFORE INSERT ON reception_statistics
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_checkin_gates_before_insert
BEFORE INSERT ON checkin_gates
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_checkins_before_insert
BEFORE INSERT ON visitor_checkins
FOR EACH ROW
BEGIN
    DECLARE active_count INT;
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
    
    -- Business constraint: A visitor can only have one active check-in at a time.
    IF NEW.status = 'ACTIVE' AND NEW.actual_checkout_time IS NULL THEN
        SELECT COUNT(*) INTO active_count
        FROM visitor_checkins
        WHERE visitor_id = NEW.visitor_id AND status = 'ACTIVE' AND actual_checkout_time IS NULL;
        
        IF active_count > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'chk_active_checkin_limit: visitor already has an active check-in session';
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_checkin_verifications_before_insert
BEFORE INSERT ON checkin_verifications
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_checkin_security_screenings_before_insert
BEFORE INSERT ON checkin_security_screenings
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_checkin_access_grants_before_insert
BEFORE INSERT ON checkin_access_grants
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_checkin_gate_logs_before_insert
BEFORE INSERT ON checkin_gate_logs
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_belongings_before_insert
BEFORE INSERT ON visitor_belongings
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_checkin_notifications_before_insert
BEFORE INSERT ON checkin_notifications
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_access_sessions_before_insert
BEFORE INSERT ON visitor_access_sessions
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_checkin_documents_before_insert
BEFORE INSERT ON checkin_documents
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_checkin_incidents_before_insert
BEFORE INSERT ON checkin_incidents
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_biometric_checkins_before_insert
BEFORE INSERT ON biometric_checkins
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_checkin_audit_trail_before_insert
BEFORE INSERT ON checkin_audit_trail
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_denied_checkins_before_insert
BEFORE INSERT ON denied_checkins
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_emergency_checkins_before_insert
BEFORE INSERT ON emergency_checkins
FOR EACH ROW
BEGIN
    IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
        SET NEW.id = NEW.id;
    END IF;
END;
//

DELIMITER ;

-- =====================================================================================
-- 15. MODULE 11: CHECK-OUT MANAGEMENT SCHEMA
-- =====================================================================================

-- Table 1: visitor_checkouts
CREATE TABLE visitor_checkouts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique check-out transaction ID',
    checkout_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    checkin_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to active visitor checkin record',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor profile',
    appointment_id BIGINT UNSIGNED NULL COMMENT 'Reference to pre-scheduled appointment context',
    host_id BIGINT UNSIGNED NULL COMMENT 'Reference to host employee user',
    receptionist_id BIGINT UNSIGNED NULL COMMENT 'Reference to receptionist user profile executing checkout',
    security_officer_id BIGINT UNSIGNED NULL COMMENT 'Reference to security officer user executing checkout',
    checkout_time DATETIME NOT NULL COMMENT 'Physical checkout departure timestamp',
    checkout_method ENUM('QR_CODE', 'BARCODE', 'RFID', 'NFC', 'FACE_RECOGNITION', 'FINGERPRINT', 'OTP', 'MANUAL', 'AUTO', 'EMERGENCY') NOT NULL DEFAULT 'MANUAL' COMMENT 'Primary physical exit verification method',
    checkout_status ENUM('COMPLETED', 'PENDING_VERIFICATION', 'REJECTED', 'EXCEPTION') NOT NULL DEFAULT 'COMPLETED' COMMENT 'Operational check-out transaction state',
    expected_checkout_time DATETIME NULL COMMENT 'Original expected departure cutoff time from checkin',
    actual_checkout_time DATETIME NULL COMMENT 'Audit log checkout timestamp',
    visit_completion_status ENUM('NORMAL', 'EARLY', 'LATE', 'AUTO', 'MANUAL', 'EMERGENCY', 'VIP') NOT NULL DEFAULT 'NORMAL' COMMENT 'Visit timing classification status',
    total_visit_duration INT UNSIGNED NULL COMMENT 'Total duration of stay in minutes',
    remarks TEXT NULL COMMENT 'Exit remarks and departure notes',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if checkout record is active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Main transactional catalog tracking visitor departure events';

-- Table 2: visitor_asset_returns
CREATE TABLE visitor_asset_returns (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique record identifier',
    asset_return_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    checkout_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to parent checkout transaction',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor profile',
    asset_id BIGINT UNSIGNED NOT NULL COMMENT 'Unique identifier of the company asset (RFID, card, key, etc)',
    asset_name VARCHAR(100) NOT NULL COMMENT 'Name of corporate asset returned (e.g. Visitor badge, Access card, Laptop)',
    issued_time DATETIME NOT NULL COMMENT 'Timestamp when asset was originally issued',
    returned_time DATETIME NULL COMMENT 'Timestamp when asset was returned',
    asset_condition ENUM('EXCELLENT', 'GOOD', 'DAMAGED', 'LOST') NOT NULL DEFAULT 'GOOD' COMMENT 'Physical condition of returned asset',
    return_status ENUM('RETURNED', 'PENDING', 'LOST', 'DAMAGED') NOT NULL DEFAULT 'RETURNED' COMMENT 'Current return status',
    verified_by BIGINT UNSIGNED NULL COMMENT 'Reference to employee verifying the return',
    remarks TEXT NULL COMMENT 'Specific observations or loss/damage remarks',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Active configuration status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Tracks company assets returned by visitors before departure';

-- Table 3: visitor_pass_returns
CREATE TABLE visitor_pass_returns (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique record identifier',
    pass_return_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    checkout_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to parent checkout transaction',
    visitor_pass_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to printed/dispatched visitor pass credentials',
    return_time DATETIME NOT NULL COMMENT 'Timestamp when pass was returned',
    returned_by BIGINT UNSIGNED NULL COMMENT 'Reference to user who received the pass',
    pass_condition ENUM('EXCELLENT', 'GOOD', 'DAMAGED', 'LOST') NOT NULL DEFAULT 'GOOD' COMMENT 'Physical condition of returned pass',
    pass_status ENUM('RETURNED', 'PENDING', 'LOST', 'DAMAGED') NOT NULL DEFAULT 'RETURNED' COMMENT 'Current return status',
    deactivation_status ENUM('DEACTIVATED', 'FAILED', 'PENDING') NOT NULL DEFAULT 'DEACTIVATED' COMMENT 'Status of pass deactivation check',
    remarks TEXT NULL COMMENT 'Exit pass return notes',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Active configuration status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Record of visitor pass return and credential deactivation';

-- Table 4: checkout_verifications
CREATE TABLE checkout_verifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique verification identifier',
    verification_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    checkout_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to parent checkout transaction',
    verification_type ENUM('IDENTITY', 'PASS', 'ASSET', 'SECURITY_CLEARANCE', 'HOST_APPROVAL', 'RESTRICTED_ITEMS') NOT NULL COMMENT 'Pre-departure checkpoint classification',
    verification_status ENUM('PASSED', 'FAILED', 'PENDING', 'BYPASSED') NOT NULL DEFAULT 'PENDING' COMMENT 'Current verification validation status',
    verified_by BIGINT UNSIGNED NULL COMMENT 'Reference to officer who verified',
    verification_time DATETIME NOT NULL COMMENT 'Timestamp when verification was executed',
    verification_result TEXT NULL COMMENT 'Result details or gate response code',
    security_notes TEXT NULL COMMENT 'Confidential security remarks',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Active configuration status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Lobby exit checkpoint clearances and host verifications';

-- Table 5: visit_durations
CREATE TABLE visit_durations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique record identifier',
    visit_duration_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    checkout_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to checkout transaction',
    checkin_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to original checkin transaction',
    checkin_time DATETIME NOT NULL COMMENT 'Checkin timestamp',
    checkout_time DATETIME NOT NULL COMMENT 'Checkout timestamp',
    total_minutes INT UNSIGNED NOT NULL COMMENT 'Calculated minutes of stay',
    total_hours DECIMAL(6, 2) NOT NULL COMMENT 'Calculated hours of stay',
    is_overtime BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Overtime flag based on expected checkout',
    duration_category ENUM('SHORT_STAY', 'STANDARD_STAY', 'LONG_STAY', 'OVERTIME') NOT NULL DEFAULT 'STANDARD_STAY' COMMENT 'Duration classification category',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Active configuration status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Analytical database mapping duration metrics per visitor session';

-- Table 6: checkout_exceptions
CREATE TABLE checkout_exceptions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique exception record identifier',
    exception_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    checkout_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to checkout transaction',
    exception_type ENUM('LOST_PASS', 'MISSING_ASSET', 'DAMAGED_ASSET', 'EMERGENCY_EXIT', 'SECURITY_ISSUE', 'LEFT_WITHOUT_CHECKOUT', 'MEDICAL_EMERGENCY', 'POLICY_VIOLATION') NOT NULL COMMENT 'Type of checkout anomaly',
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM' COMMENT 'Urgency level tier',
    description TEXT NOT NULL COMMENT 'Incident situation description',
    resolution_status ENUM('UNRESOLVED', 'UNDER_INVESTIGATION', 'RESOLVED', 'BYPASSED') NOT NULL DEFAULT 'UNRESOLVED' COMMENT 'Resolution workflow state',
    resolved_by BIGINT UNSIGNED NULL COMMENT 'Reference to resolver staff user',
    resolved_at DATETIME NULL COMMENT 'Timestamp when anomaly resolved',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Active configuration status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Incident log tracking abnormal departure exceptions';

-- Table 7: checkout_feedbacks
CREATE TABLE checkout_feedbacks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique feedback record identifier',
    feedback_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    checkout_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to checkout transaction',
    rating TINYINT UNSIGNED NOT NULL COMMENT 'Overall satisfaction rating (1-5 scale)',
    comments TEXT NULL COMMENT 'Visitor textual review remarks',
    reception_rating TINYINT UNSIGNED NULL COMMENT 'Reception service evaluation (1-5 scale)',
    host_rating TINYINT UNSIGNED NULL COMMENT 'Host evaluation (1-5 scale)',
    overall_rating TINYINT UNSIGNED NULL COMMENT 'Overall visit rating (1-5 scale)',
    submitted_at DATETIME NOT NULL COMMENT 'Feedback submission timestamp',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Active configuration status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT chk_cf_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_cf_reception CHECK (reception_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_cf_host CHECK (host_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_cf_overall CHECK (overall_rating BETWEEN 1 AND 5)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Post-checkout visitor satisfaction reviews';

-- FOREIGN KEY CONSTRAINTS
ALTER TABLE visitor_checkouts
ADD CONSTRAINT fk_vco_checkin FOREIGN KEY (checkin_id) REFERENCES visitor_checkins (id) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT fk_vco_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT fk_vco_appt FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT fk_vco_host FOREIGN KEY (host_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT fk_vco_receptionist FOREIGN KEY (receptionist_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT fk_vco_security FOREIGN KEY (security_officer_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT fk_vco_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_vco_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_vco_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE visitor_asset_returns
ADD CONSTRAINT fk_var_checkout FOREIGN KEY (checkout_id) REFERENCES visitor_checkouts (id) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT fk_var_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT fk_var_verifier FOREIGN KEY (verified_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT fk_var_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_var_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_var_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE visitor_pass_returns
ADD CONSTRAINT fk_vpr_checkout FOREIGN KEY (checkout_id) REFERENCES visitor_checkouts (id) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT fk_vpr_pass FOREIGN KEY (visitor_pass_id) REFERENCES visitor_passes (id) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT fk_vpr_returned_by FOREIGN KEY (returned_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT fk_vpr_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_vpr_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_vpr_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE checkout_verifications
ADD CONSTRAINT fk_cov_checkout FOREIGN KEY (checkout_id) REFERENCES visitor_checkouts (id) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT fk_cov_verified_by FOREIGN KEY (verified_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT fk_cov_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_cov_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_cov_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE visit_durations
ADD CONSTRAINT fk_vsd_checkout FOREIGN KEY (checkout_id) REFERENCES visitor_checkouts (id) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT fk_vsd_checkin FOREIGN KEY (checkin_id) REFERENCES visitor_checkins (id) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT fk_vsd_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_vsd_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_vsd_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE checkout_exceptions
ADD CONSTRAINT fk_coe_checkout FOREIGN KEY (checkout_id) REFERENCES visitor_checkouts (id) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT fk_coe_resolved_by FOREIGN KEY (resolved_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT fk_coe_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_coe_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_coe_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE checkout_feedbacks
ADD CONSTRAINT fk_cof_checkout FOREIGN KEY (checkout_id) REFERENCES visitor_checkouts (id) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT fk_cof_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_cof_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
ADD CONSTRAINT fk_cof_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL;


-- INDEXES
CREATE INDEX idx_vco_checkin ON visitor_checkouts (checkin_id);
CREATE INDEX idx_vco_visitor ON visitor_checkouts (visitor_id);
CREATE INDEX idx_vco_appt ON visitor_checkouts (appointment_id);
CREATE INDEX idx_vco_host ON visitor_checkouts (host_id);
CREATE INDEX idx_vco_status ON visitor_checkouts (checkout_status);
CREATE INDEX idx_vco_time ON visitor_checkouts (checkout_time);
CREATE INDEX idx_vco_created_at ON visitor_checkouts (created_at);

CREATE INDEX idx_var_checkout ON visitor_asset_returns (checkout_id);
CREATE INDEX idx_var_visitor ON visitor_asset_returns (visitor_id);
CREATE INDEX idx_var_asset ON visitor_asset_returns (asset_id);
CREATE INDEX idx_var_status ON visitor_asset_returns (return_status);

CREATE INDEX idx_vpr_checkout ON visitor_pass_returns (checkout_id);
CREATE INDEX idx_vpr_pass ON visitor_pass_returns (visitor_pass_id);
CREATE INDEX idx_vpr_status ON visitor_pass_returns (pass_status);

CREATE INDEX idx_cv_checkout ON checkout_verifications (checkout_id);
CREATE INDEX idx_cv_status ON checkout_verifications (verification_status);

CREATE INDEX idx_vd_checkout ON visit_durations (checkout_id);
CREATE INDEX idx_vd_checkin ON visit_durations (checkin_id);

CREATE INDEX idx_ce_checkout ON checkout_exceptions (checkout_id);
CREATE INDEX idx_ce_type ON checkout_exceptions (exception_type);
CREATE INDEX idx_ce_severity ON checkout_exceptions (severity);

CREATE INDEX idx_cf_checkout ON checkout_feedbacks (checkout_id);

-- =====================================================================================
-- MODULE 12: SECURITY & ACCESS CONTROL
-- =====================================================================================

-- =====================================================================================
-- 12.1 SECURITY ACCESS ZONES (Hierarchical Protected Security Areas)
-- =====================================================================================
CREATE TABLE security_access_zones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique security zone identifier',
    security_zone_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    zone_code VARCHAR(50) NOT NULL COMMENT 'Unique alphanumeric zone identifier code',
    zone_name VARCHAR(150) NOT NULL COMMENT 'Security zone display name',
    parent_zone_id BIGINT UNSIGNED NULL COMMENT 'Self-referencing parent zone for hierarchy',
    building_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to building containing this zone',
    floor_id BIGINT UNSIGNED NULL COMMENT 'Reference to floor level within building',
    security_level INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Clearance rank (1=Public, 2=General, 3=Restricted, 4=Confidential, 5=Top Secret)',
    is_restricted BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if zone requires additional authorization beyond standard clearance',
    visitor_allowed BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if external visitors are permitted in this zone',
    max_occupancy INT UNSIGNED NULL COMMENT 'Maximum simultaneous occupancy limit for the zone',
    current_occupancy INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Real-time live occupancy counter',
    description TEXT NULL COMMENT 'Detailed zone purpose and access policy notes',
    status ENUM('ACTIVE', 'INACTIVE', 'LOCKDOWN', 'MAINTENANCE') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Zone operational status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for zone record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_saz_code UNIQUE (zone_code),
    CONSTRAINT uq_saz_name UNIQUE (zone_name),
    CONSTRAINT chk_saz_security_level CHECK (security_level BETWEEN 1 AND 5),
    CONSTRAINT chk_saz_occupancy CHECK (current_occupancy >= 0),
    CONSTRAINT fk_saz_building FOREIGN KEY (building_id) REFERENCES buildings (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_saz_floor FOREIGN KEY (floor_id) REFERENCES floors (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_saz_parent FOREIGN KEY (parent_zone_id) REFERENCES security_access_zones (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_saz_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_saz_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_saz_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Hierarchical security zones with clearance levels and occupancy tracking';

-- =====================================================================================
-- 12.2 ACCESS POINTS (Physical Entry/Exit Points)
-- =====================================================================================
CREATE TABLE access_points (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique access point identifier',
    access_point_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    point_code VARCHAR(50) NOT NULL COMMENT 'Unique alphanumeric access point code',
    point_name VARCHAR(150) NOT NULL COMMENT 'Human-readable access point display name',
    point_type ENUM('DOOR', 'GATE', 'ELEVATOR', 'TURNSTILE', 'SMART_LOCK', 'BARRIER', 'EMERGENCY_EXIT') NOT NULL DEFAULT 'DOOR' COMMENT 'Physical type classification of the entry point',
    direction ENUM('ENTRY', 'EXIT', 'BIDIRECTIONAL') NOT NULL DEFAULT 'BIDIRECTIONAL' COMMENT 'Traffic flow direction of the access point',
    reader_type ENUM('QR_SCANNER', 'RFID_READER', 'NFC_READER', 'FINGERPRINT', 'FACE_RECOGNITION', 'BARCODE', 'KEYPAD', 'SMART_CARD', 'MANUAL', 'MULTI_FACTOR') NOT NULL DEFAULT 'QR_SCANNER' COMMENT 'Primary credential reader technology installed',
    building_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to building containing this access point',
    floor_id BIGINT UNSIGNED NULL COMMENT 'Reference to floor level of the access point',
    zone_id BIGINT UNSIGNED NULL COMMENT 'Reference to security zone this point guards',
    gps_latitude DECIMAL(10, 8) NULL COMMENT 'GPS latitude coordinate of the access point',
    gps_longitude DECIMAL(11, 8) NULL COMMENT 'GPS longitude coordinate of the access point',
    security_level INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Minimum clearance level required (1-5)',
    device_connection_status ENUM('ONLINE', 'OFFLINE', 'ERROR', 'MAINTENANCE') NOT NULL DEFAULT 'OFFLINE' COMMENT 'Real-time hardware connection state',
    is_emergency_exit BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if this point serves as emergency evacuation route',
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'LOCKDOWN') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Operational status of the access point',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for access point record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_acpt_code UNIQUE (point_code),
    CONSTRAINT chk_acpt_security CHECK (security_level BETWEEN 1 AND 5),
    CONSTRAINT fk_acpt_building FOREIGN KEY (building_id) REFERENCES buildings (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_acpt_floor FOREIGN KEY (floor_id) REFERENCES floors (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_acpt_zone FOREIGN KEY (zone_id) REFERENCES security_access_zones (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_acpt_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_acpt_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_acpt_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Physical entry and exit points with reader hardware and security clearance';

-- =====================================================================================
-- 12.3 SECURITY DEVICES (Hardware Device Management)
-- =====================================================================================
CREATE TABLE security_devices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique device identifier',
    security_device_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    device_code VARCHAR(50) NOT NULL COMMENT 'Unique alphanumeric device inventory code',
    device_name VARCHAR(150) NOT NULL COMMENT 'Human-readable device display name',
    device_type ENUM('QR_SCANNER', 'RFID_READER', 'NFC_READER', 'FINGERPRINT_SCANNER', 'FACE_RECOGNITION', 'CAMERA', 'BARRIER_GATE', 'TURNSTILE', 'SMART_LOCK', 'DOOR_CONTROLLER', 'INTERCOM', 'ALARM_PANEL') NOT NULL COMMENT 'Hardware device category classification',
    serial_number VARCHAR(100) NULL UNIQUE COMMENT 'Factory manufacturer serial number',
    firmware_version VARCHAR(50) NULL COMMENT 'Current installed firmware version string',
    mac_address VARCHAR(17) NULL COMMENT 'Hardware MAC address (XX:XX:XX:XX:XX:XX format)',
    ip_address VARCHAR(45) NULL COMMENT 'Network IPv4 or IPv6 address assignment',
    building_id BIGINT UNSIGNED NULL COMMENT 'Reference to building where device is installed',
    floor_id BIGINT UNSIGNED NULL COMMENT 'Reference to floor where device is installed',
    zone_id BIGINT UNSIGNED NULL COMMENT 'Reference to security zone the device monitors',
    access_point_id BIGINT UNSIGNED NULL COMMENT 'Reference to access point the device is attached to',
    installation_date DATE NULL COMMENT 'Date device was installed and commissioned',
    last_maintenance_date DATE NULL COMMENT 'Date of most recent maintenance service',
    next_maintenance_date DATE NULL COMMENT 'Scheduled next maintenance service date',
    health_status ENUM('HEALTHY', 'WARNING', 'CRITICAL', 'OFFLINE', 'DECOMMISSIONED') NOT NULL DEFAULT 'HEALTHY' COMMENT 'Real-time device health monitoring status',
    last_heartbeat_at DATETIME NULL COMMENT 'Timestamp of last health check ping from device',
    configuration_json JSON NULL COMMENT 'Device-specific configuration parameters',
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DECOMMISSIONED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Device operational lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for device record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_sdev_code UNIQUE (device_code),
    CONSTRAINT fk_sdev_building FOREIGN KEY (building_id) REFERENCES buildings (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sdev_floor FOREIGN KEY (floor_id) REFERENCES floors (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sdev_zone FOREIGN KEY (zone_id) REFERENCES security_access_zones (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sdev_access_point FOREIGN KEY (access_point_id) REFERENCES access_points (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sdev_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_sdev_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_sdev_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Security hardware device inventory with health monitoring and maintenance tracking';

-- =====================================================================================
-- 12.4 ACCESS PERMISSIONS (Zone Access Authorization Rules)
-- =====================================================================================
CREATE TABLE access_permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique permission rule identifier',
    access_permission_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    permission_type ENUM('VISITOR', 'EMPLOYEE', 'CONTRACTOR', 'DEPARTMENT', 'ROLE') NOT NULL COMMENT 'Subject type this permission applies to',
    visitor_id BIGINT UNSIGNED NULL COMMENT 'Reference to specific visitor granted access',
    employee_id BIGINT UNSIGNED NULL COMMENT 'Reference to specific employee granted access',
    role_id BIGINT UNSIGNED NULL COMMENT 'Reference to role granted blanket access',
    department_id BIGINT UNSIGNED NULL COMMENT 'Reference to department granted blanket access',
    zone_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to security zone being authorized',
    access_level ENUM('READ_ONLY', 'STANDARD', 'ELEVATED', 'FULL', 'EMERGENCY') NOT NULL DEFAULT 'STANDARD' COMMENT 'Granularity of access privileges within the zone',
    valid_from DATETIME NOT NULL COMMENT 'Start of access window validity period',
    valid_to DATETIME NULL COMMENT 'End of access window validity (NULL = permanent)',
    schedule_json JSON NULL COMMENT 'Weekly time-slot schedule restrictions (e.g. Mon-Fri 09:00-17:00)',
    approval_status ENUM('PENDING', 'APPROVED', 'REJECTED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'PENDING' COMMENT 'Authorization workflow approval state',
    approved_by BIGINT UNSIGNED NULL COMMENT 'Reference to user who approved this permission',
    approved_at DATETIME NULL COMMENT 'Timestamp when permission was approved',
    is_temporary BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if this is a time-limited temporary access grant',
    is_vip BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags VIP access with expedited clearance',
    is_emergency BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags emergency override access (bypasses normal schedule)',
    reason TEXT NULL COMMENT 'Justification or business reason for access grant',
    status ENUM('ACTIVE', 'INACTIVE', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Current permission lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for permission record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    /*
    CONSTRAINT chk_aperm_subject CHECK (
        (permission_type = 'VISITOR' AND visitor_id IS NOT NULL) OR
        (permission_type = 'EMPLOYEE' AND employee_id IS NOT NULL) OR
        (permission_type = 'CONTRACTOR' AND employee_id IS NOT NULL) OR
        (permission_type = 'DEPARTMENT' AND department_id IS NOT NULL) OR
        (permission_type = 'ROLE' AND role_id IS NOT NULL)
    ),
    */
    CONSTRAINT chk_aperm_dates CHECK (valid_to IS NULL OR valid_to > valid_from),
    CONSTRAINT fk_aperm_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_aperm_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_aperm_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_aperm_department FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_aperm_zone FOREIGN KEY (zone_id) REFERENCES security_access_zones (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_aperm_approved_by FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_aperm_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_aperm_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_aperm_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Zone access authorization rules for visitors, employees, roles, and departments';

-- =====================================================================================
-- 12.5 BIOMETRIC ENROLLMENT RECORDS (Encrypted Biometric Templates)
-- =====================================================================================
CREATE TABLE biometric_enrollment_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique biometric enrollment identifier',
    enrollment_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    subject_type ENUM('VISITOR', 'EMPLOYEE') NOT NULL COMMENT 'Subject category for the biometric enrollment',
    visitor_id BIGINT UNSIGNED NULL COMMENT 'Reference to visitor if subject is a visitor',
    employee_id BIGINT UNSIGNED NULL COMMENT 'Reference to employee if subject is an employee',
    biometric_type ENUM('FACE', 'FINGERPRINT', 'PALM', 'VOICE', 'IRIS') NOT NULL COMMENT 'Biometric modality type captured',
    template_hash TEXT NOT NULL COMMENT 'Encrypted biometric template hash (NEVER raw biometric image data)',
    encryption_method VARCHAR(50) NOT NULL DEFAULT 'AES-256-GCM' COMMENT 'Encryption algorithm used for template protection',
    algorithm_version VARCHAR(50) NOT NULL COMMENT 'Biometric matching algorithm and firmware version',
    enrollment_date DATETIME NOT NULL COMMENT 'Date and time of biometric enrollment capture',
    enrollment_device_id BIGINT UNSIGNED NULL COMMENT 'Reference to device used for enrollment capture',
    quality_score DECIMAL(5,2) NULL COMMENT 'Biometric sample quality score (0.00-100.00)',
    expiry_date DATE NULL COMMENT 'Optional expiration date for template validity',
    status ENUM('ACTIVE', 'INACTIVE', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Enrollment lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for enrollment record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    /*
    CONSTRAINT chk_ber_subject CHECK (
        (subject_type = 'VISITOR' AND visitor_id IS NOT NULL) OR
        (subject_type = 'EMPLOYEE' AND employee_id IS NOT NULL)
    ),
    */
    CONSTRAINT chk_ber_quality CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100)),
    CONSTRAINT fk_ber_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ber_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ber_device FOREIGN KEY (enrollment_device_id) REFERENCES security_devices (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ber_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ber_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ber_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Encrypted biometric enrollment templates for identity verification (never raw images)';

-- =====================================================================================
-- 12.6 EMERGENCY LOCKDOWNS (Facility Emergency Events)
-- =====================================================================================
CREATE TABLE emergency_lockdowns (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique lockdown event identifier',
    lockdown_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    lockdown_code VARCHAR(50) NOT NULL COMMENT 'Unique alphanumeric lockdown event code',
    lockdown_type ENUM('FIRE', 'EARTHQUAKE', 'INTRUDER', 'BOMB_THREAT', 'MEDICAL_EMERGENCY', 'CYBER_ATTACK', 'SECURITY_BREACH', 'DRILL', 'OTHER') NOT NULL COMMENT 'Emergency event classification',
    trigger_source ENUM('MANUAL', 'AUTOMATIC', 'SENSOR', 'PANIC_BUTTON', 'SYSTEM') NOT NULL DEFAULT 'MANUAL' COMMENT 'Source mechanism that initiated the lockdown',
    lockdown_scope ENUM('FULL_FACILITY', 'BUILDING', 'FLOOR', 'ZONE') NOT NULL DEFAULT 'BUILDING' COMMENT 'Physical scope of the lockdown perimeter',
    building_id BIGINT UNSIGNED NULL COMMENT 'Reference to affected building (NULL if full facility)',
    floor_id BIGINT UNSIGNED NULL COMMENT 'Reference to affected floor (if floor-level lockdown)',
    zone_id BIGINT UNSIGNED NULL COMMENT 'Reference to affected zone (if zone-level lockdown)',
    start_time DATETIME NOT NULL COMMENT 'Timestamp when lockdown was activated',
    end_time DATETIME NULL COMMENT 'Timestamp when lockdown was released (NULL if still active)',
    reason TEXT NOT NULL COMMENT 'Detailed description of the emergency situation',
    initiated_by BIGINT UNSIGNED NOT NULL COMMENT 'Reference to user who activated the lockdown',
    released_by BIGINT UNSIGNED NULL COMMENT 'Reference to user who deactivated the lockdown',
    affected_persons_count INT UNSIGNED NULL COMMENT 'Estimated number of persons affected by the lockdown',
    evacuation_required BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indicates if evacuation procedures were activated',
    status ENUM('ACTIVE', 'RELEASED', 'CANCELLED', 'DRILL_COMPLETED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Current lockdown lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for lockdown record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_elk_code UNIQUE (lockdown_code),
    CONSTRAINT fk_elk_building FOREIGN KEY (building_id) REFERENCES buildings (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_elk_floor FOREIGN KEY (floor_id) REFERENCES floors (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_elk_zone FOREIGN KEY (zone_id) REFERENCES security_access_zones (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_elk_initiated_by FOREIGN KEY (initiated_by) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_elk_released_by FOREIGN KEY (released_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_elk_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_elk_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_elk_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Emergency lockdown events with scope, trigger source, and release tracking';

-- =====================================================================================
-- 12.7 SECURITY INCIDENTS DETAIL (Comprehensive Security Event Records)
-- =====================================================================================
CREATE TABLE security_incidents_detail (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique incident detail identifier',
    incident_detail_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    incident_code VARCHAR(50) NOT NULL COMMENT 'Unique alphanumeric incident tracking code',
    incident_type ENUM(
        'UNAUTHORIZED_ACCESS', 'TAILGATING', 'DOOR_FORCED_OPEN', 'MULTIPLE_DENIED_ACCESS',
        'SUSPICIOUS_MOVEMENT', 'INVALID_VISITOR_PASS', 'FAKE_QR', 'EMERGENCY_EVENT',
        'INTRUSION', 'POLICY_VIOLATION', 'STOLEN_BADGE', 'LOST_PASS',
        'VANDALISM', 'ASSAULT', 'TRESPASSING', 'OTHER'
    ) NOT NULL COMMENT 'Classification category of the security event',
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM' COMMENT 'Impact severity rating of the incident',
    title VARCHAR(200) NOT NULL COMMENT 'Brief summary headline of the incident',
    description TEXT NOT NULL COMMENT 'Full detailed narrative of the security event',
    resolution_notes TEXT NULL COMMENT 'Actions taken and outcome of incident resolution',
    visitor_id BIGINT UNSIGNED NULL COMMENT 'Reference to visitor involved in the incident',
    employee_id BIGINT UNSIGNED NULL COMMENT 'Reference to employee involved in the incident',
    access_point_id BIGINT UNSIGNED NULL COMMENT 'Reference to access point where incident occurred',
    zone_id BIGINT UNSIGNED NULL COMMENT 'Reference to security zone where incident occurred',
    appointment_id BIGINT UNSIGNED NULL COMMENT 'Reference to related appointment if applicable',
    checkin_id BIGINT UNSIGNED NULL COMMENT 'Reference to related check-in record if applicable',
    reporter_user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to user who reported the incident',
    assigned_officer_id BIGINT UNSIGNED NULL COMMENT 'Reference to security officer assigned to investigate',
    resolved_by_user_id BIGINT UNSIGNED NULL COMMENT 'Reference to user who resolved the incident',
    incident_time DATETIME NOT NULL COMMENT 'Timestamp when the incident occurred',
    resolved_at DATETIME NULL COMMENT 'Timestamp when the incident was resolved',
    evidence_urls JSON NULL COMMENT 'JSON array of evidence file URLs (photos, video clips)',
    status ENUM('OPEN', 'INVESTIGATING', 'RESOLVED', 'ESCALATED', 'CLOSED') NOT NULL DEFAULT 'OPEN' COMMENT 'Incident investigation lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for incident record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_sid_code UNIQUE (incident_code),
    CONSTRAINT fk_sid_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sid_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sid_access_point FOREIGN KEY (access_point_id) REFERENCES access_points (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sid_zone FOREIGN KEY (zone_id) REFERENCES security_access_zones (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sid_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sid_checkin FOREIGN KEY (checkin_id) REFERENCES visitor_checkins (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sid_reporter FOREIGN KEY (reporter_user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_sid_officer FOREIGN KEY (assigned_officer_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sid_resolved_by FOREIGN KEY (resolved_by_user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sid_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_sid_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_sid_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Comprehensive security incident records with severity, resolution, and officer assignment';

-- =====================================================================================
-- 12.8 ACCESS LOGS (Every Access Attempt Audit Trail)
-- =====================================================================================
CREATE TABLE access_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique access log entry identifier',
    access_log_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NULL COMMENT 'Reference to visitor attempting access',
    employee_id BIGINT UNSIGNED NULL COMMENT 'Reference to employee attempting access',
    access_point_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to physical entry/exit point used',
    zone_id BIGINT UNSIGNED NULL COMMENT 'Reference to security zone being accessed',
    device_id BIGINT UNSIGNED NULL COMMENT 'Reference to security device that processed the attempt',
    pass_id BIGINT UNSIGNED NULL COMMENT 'Reference to visitor pass credential used',
    checkin_id BIGINT UNSIGNED NULL COMMENT 'Reference to active check-in session',
    access_method ENUM('QR', 'RFID', 'NFC', 'FACE_RECOGNITION', 'FINGERPRINT', 'BARCODE', 'MANUAL', 'IRIS', 'PALM', 'SMART_CARD', 'OTP', 'MULTI_FACTOR') NOT NULL COMMENT 'Authentication method used for access attempt',
    credential_reference VARCHAR(255) NULL COMMENT 'Token, badge number, or credential identifier used',
    access_result ENUM(
        'GRANTED', 'DENIED', 'EXPIRED_PASS', 'INVALID_QR', 'INVALID_RFID',
        'UNAUTHORIZED_AREA', 'OUTSIDE_SCHEDULE', 'BLACKLISTED', 'LOCKDOWN',
        'BIOMETRIC_MISMATCH', 'DEVICE_ERROR', 'TAILGATING_DETECTED'
    ) NOT NULL COMMENT 'Outcome result of the access attempt',
    access_time DATETIME NOT NULL COMMENT 'Timestamp of the access attempt',
    deny_reason TEXT NULL COMMENT 'Detailed explanation if access was denied',
    ip_address VARCHAR(45) NULL COMMENT 'IP address of the requesting device or terminal',
    user_agent VARCHAR(255) NULL COMMENT 'Client device user agent string if applicable',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for log record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_alog_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alog_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alog_access_point FOREIGN KEY (access_point_id) REFERENCES access_points (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_alog_zone FOREIGN KEY (zone_id) REFERENCES security_access_zones (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alog_device FOREIGN KEY (device_id) REFERENCES security_devices (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alog_pass FOREIGN KEY (pass_id) REFERENCES visitor_passes (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alog_checkin FOREIGN KEY (checkin_id) REFERENCES visitor_checkins (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alog_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_alog_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_alog_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Comprehensive audit trail of every access attempt with result and credentials';

-- =====================================================================================
-- 12.9 VEHICLE ACCESS LOGS (Vehicle Entry/Exit Tracking)
-- =====================================================================================
CREATE TABLE vehicle_access_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique vehicle access log identifier',
    vehicle_log_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    vehicle_type ENUM('CAR', 'MOTORCYCLE', 'TRUCK', 'VAN', 'BUS', 'AMBULANCE', 'EMERGENCY', 'BICYCLE', 'OTHER') NOT NULL DEFAULT 'CAR' COMMENT 'Vehicle category classification',
    license_plate VARCHAR(20) NOT NULL COMMENT 'Vehicle license plate number',
    vehicle_color VARCHAR(50) NULL COMMENT 'Vehicle exterior color description',
    vehicle_make VARCHAR(80) NULL COMMENT 'Vehicle manufacturer brand name',
    vehicle_model VARCHAR(80) NULL COMMENT 'Vehicle model designation',
    driver_name VARCHAR(150) NULL COMMENT 'Full name of the vehicle driver',
    driver_type ENUM('VISITOR', 'EMPLOYEE', 'CONTRACTOR', 'EMERGENCY', 'DELIVERY', 'OTHER') NOT NULL DEFAULT 'VISITOR' COMMENT 'Classification of the vehicle driver',
    visitor_id BIGINT UNSIGNED NULL COMMENT 'Reference to visitor if driver is a visitor',
    employee_id BIGINT UNSIGNED NULL COMMENT 'Reference to employee if driver is an employee',
    appointment_id BIGINT UNSIGNED NULL COMMENT 'Reference to associated appointment',
    entry_gate_id BIGINT UNSIGNED NULL COMMENT 'Reference to access point used for entry',
    exit_gate_id BIGINT UNSIGNED NULL COMMENT 'Reference to access point used for exit',
    entry_time DATETIME NOT NULL COMMENT 'Timestamp of vehicle entry',
    exit_time DATETIME NULL COMMENT 'Timestamp of vehicle exit (NULL if still on premises)',
    parking_area VARCHAR(100) NULL COMMENT 'Designated parking area or lot name',
    parking_spot VARCHAR(20) NULL COMMENT 'Specific parking spot number or bay',
    security_check_result ENUM('PASSED', 'FLAGGED', 'FAILED', 'NOT_CHECKED') NOT NULL DEFAULT 'PASSED' COMMENT 'Security inspection result for the vehicle',
    security_officer_id BIGINT UNSIGNED NULL COMMENT 'Reference to officer who conducted vehicle inspection',
    lpr_confidence_score DECIMAL(5,2) NULL COMMENT 'License plate recognition AI confidence (0.00-100.00)',
    lpr_image_url VARCHAR(500) NULL COMMENT 'URL to captured license plate image',
    remarks TEXT NULL COMMENT 'Additional notes about the vehicle access event',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for vehicle log record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT chk_valog_lpr CHECK (lpr_confidence_score IS NULL OR (lpr_confidence_score >= 0 AND lpr_confidence_score <= 100)),
    CONSTRAINT fk_valog_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_valog_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_valog_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_valog_entry_gate FOREIGN KEY (entry_gate_id) REFERENCES access_points (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_valog_exit_gate FOREIGN KEY (exit_gate_id) REFERENCES access_points (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_valog_officer FOREIGN KEY (security_officer_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_valog_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_valog_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_valog_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Vehicle entry/exit tracking with license plate recognition and parking management';

-- =====================================================================================
-- 12.10 SURVEILLANCE EVENTS (AI-Powered Surveillance Records)
-- =====================================================================================
CREATE TABLE surveillance_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique surveillance event identifier',
    surveillance_event_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    event_type ENUM(
        'MOTION_DETECTION', 'FACE_RECOGNITION', 'UNKNOWN_PERSON', 'OBJECT_DETECTION',
        'CROWD_DETECTION', 'RESTRICTED_ENTRY', 'SUSPICIOUS_BEHAVIOR', 'CAMERA_OFFLINE',
        'LOITERING', 'PERIMETER_BREACH'
    ) NOT NULL COMMENT 'AI-detected event classification type',
    camera_device_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to camera security device that detected the event',
    zone_id BIGINT UNSIGNED NULL COMMENT 'Reference to security zone where event was detected',
    event_time DATETIME NOT NULL COMMENT 'Timestamp when the event was detected',
    confidence_score DECIMAL(5,2) NULL COMMENT 'AI model confidence score for detection (0.00-100.00)',
    ai_model_version VARCHAR(50) NULL COMMENT 'Version of the AI model that generated the detection',
    ai_result_json JSON NULL COMMENT 'Structured JSON payload of AI detection results and metadata',
    image_url VARCHAR(500) NULL COMMENT 'URL to captured event snapshot image',
    video_url VARCHAR(500) NULL COMMENT 'URL to event video clip recording',
    visitor_id BIGINT UNSIGNED NULL COMMENT 'Reference to identified visitor if face was matched',
    employee_id BIGINT UNSIGNED NULL COMMENT 'Reference to identified employee if face was matched',
    incident_id BIGINT UNSIGNED NULL COMMENT 'Reference to security incident if event triggered one',
    severity ENUM('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'INFO' COMMENT 'Event severity classification',
    reviewed_by BIGINT UNSIGNED NULL COMMENT 'Reference to security user who reviewed this event',
    reviewed_at DATETIME NULL COMMENT 'Timestamp when event was reviewed by security staff',
    status ENUM('NEW', 'REVIEWED', 'INVESTIGATING', 'RESOLVED', 'FALSE_ALARM', 'ARCHIVED') NOT NULL DEFAULT 'NEW' COMMENT 'Event review lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for event record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT chk_sve_confidence CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100)),
    CONSTRAINT fk_sve_camera FOREIGN KEY (camera_device_id) REFERENCES security_devices (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sve_zone FOREIGN KEY (zone_id) REFERENCES security_access_zones (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sve_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sve_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sve_incident FOREIGN KEY (incident_id) REFERENCES security_incidents_detail (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sve_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sve_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_sve_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_sve_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'AI-powered surveillance event detections from CCTV and camera systems';

-- =====================================================================================
-- 12.11 SECURITY PATROLS (Guard Patrol Management & GPS Tracking)
-- =====================================================================================
CREATE TABLE security_patrols (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique patrol record identifier',
    patrol_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    patrol_code VARCHAR(50) NOT NULL COMMENT 'Unique alphanumeric patrol assignment code',
    guard_user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to security guard user assigned to the patrol',
    patrol_route_name VARCHAR(150) NOT NULL COMMENT 'Name of the predefined patrol route',
    building_id BIGINT UNSIGNED NULL COMMENT 'Reference to building being patrolled',
    zone_id BIGINT UNSIGNED NULL COMMENT 'Reference to primary security zone being patrolled',
    scheduled_start DATETIME NOT NULL COMMENT 'Planned patrol start time',
    scheduled_end DATETIME NOT NULL COMMENT 'Planned patrol end time',
    actual_start DATETIME NULL COMMENT 'Actual patrol start time (NULL if not yet started)',
    actual_end DATETIME NULL COMMENT 'Actual patrol end time (NULL if still in progress)',
    checkpoints_json JSON NULL COMMENT 'JSON array of patrol checkpoint definitions with expected times',
    checkpoints_completed INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of checkpoints completed during patrol',
    total_checkpoints INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total number of checkpoints on the route',
    gps_track_json JSON NULL COMMENT 'JSON array of GPS coordinates and timestamps for mobile tracking',
    patrol_status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED' COMMENT 'Current patrol lifecycle status',
    notes TEXT NULL COMMENT 'Guard observations and notes during patrol',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for patrol record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_spt_code UNIQUE (patrol_code),
    CONSTRAINT chk_spt_schedule CHECK (scheduled_end > scheduled_start),
    CONSTRAINT chk_spt_checkpoints CHECK (checkpoints_completed <= total_checkpoints),
    CONSTRAINT fk_spt_guard FOREIGN KEY (guard_user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_spt_building FOREIGN KEY (building_id) REFERENCES buildings (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_spt_zone FOREIGN KEY (zone_id) REFERENCES security_access_zones (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_spt_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_spt_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_spt_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Security guard patrol assignments with checkpoint and GPS tracking';

-- =====================================================================================
-- 12.12 VISITOR ACCESS HISTORY (Summarized Access Analytics)
-- =====================================================================================
CREATE TABLE visitor_access_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique access history summary identifier',
    access_history_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor profile being summarized',
    total_visits INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Cumulative total number of completed visits',
    total_entries INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Cumulative total access entry events',
    total_exits INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Cumulative total access exit events',
    successful_access_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Count of successful (granted) access attempts',
    failed_access_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Count of failed (denied) access attempts',
    restricted_area_attempts INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Count of access attempts to restricted zones',
    last_access_time DATETIME NULL COMMENT 'Timestamp of most recent access event',
    last_access_point VARCHAR(150) NULL COMMENT 'Name of the last access point used',
    first_visit_date DATE NULL COMMENT 'Date of the visitor first recorded visit',
    average_visit_duration_minutes INT UNSIGNED NULL COMMENT 'Average visit duration in minutes across all visits',
    risk_score DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Computed security risk score (0.00=safe, 100.00=critical)',
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'LOW' COMMENT 'Computed risk classification tier',
    notes TEXT NULL COMMENT 'Security analyst notes on visitor access patterns',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for history record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_vah_visitor UNIQUE (visitor_id),
    CONSTRAINT chk_vah_risk CHECK (risk_score >= 0 AND risk_score <= 100),
    CONSTRAINT fk_vah_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vah_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vah_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_vah_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Summarized visitor access analytics with risk scoring and visit history';


-- =====================================================================================
-- MODULE 12: PERFORMANCE INDEXES
-- =====================================================================================

-- security_access_zones indexes
CREATE INDEX idx_saz_building ON security_access_zones (building_id);
CREATE INDEX idx_saz_floor ON security_access_zones (floor_id);
CREATE INDEX idx_saz_parent ON security_access_zones (parent_zone_id);
CREATE INDEX idx_saz_security_level ON security_access_zones (security_level);
CREATE INDEX idx_saz_status ON security_access_zones (status);
CREATE INDEX idx_saz_created_at ON security_access_zones (created_at);

-- access_points indexes
CREATE INDEX idx_acpt_building ON access_points (building_id);
CREATE INDEX idx_acpt_floor ON access_points (floor_id);
CREATE INDEX idx_acpt_zone ON access_points (zone_id);
CREATE INDEX idx_acpt_type ON access_points (point_type);
CREATE INDEX idx_acpt_status ON access_points (status);
CREATE INDEX idx_acpt_security_level ON access_points (security_level);
CREATE INDEX idx_acpt_created_at ON access_points (created_at);

-- security_devices indexes
CREATE INDEX idx_sdev_building ON security_devices (building_id);
CREATE INDEX idx_sdev_floor ON security_devices (floor_id);
CREATE INDEX idx_sdev_zone ON security_devices (zone_id);
CREATE INDEX idx_sdev_access_point ON security_devices (access_point_id);
CREATE INDEX idx_sdev_type ON security_devices (device_type);
CREATE INDEX idx_sdev_health ON security_devices (health_status);
CREATE INDEX idx_sdev_status ON security_devices (status);
CREATE INDEX idx_sdev_created_at ON security_devices (created_at);

-- access_permissions indexes
CREATE INDEX idx_aperm_visitor ON access_permissions (visitor_id);
CREATE INDEX idx_aperm_employee ON access_permissions (employee_id);
CREATE INDEX idx_aperm_role ON access_permissions (role_id);
CREATE INDEX idx_aperm_department ON access_permissions (department_id);
CREATE INDEX idx_aperm_zone ON access_permissions (zone_id);
CREATE INDEX idx_aperm_type ON access_permissions (permission_type);
CREATE INDEX idx_aperm_approval ON access_permissions (approval_status);
CREATE INDEX idx_aperm_status ON access_permissions (status);
CREATE INDEX idx_aperm_valid_from ON access_permissions (valid_from);
CREATE INDEX idx_aperm_valid_to ON access_permissions (valid_to);
CREATE INDEX idx_aperm_created_at ON access_permissions (created_at);
CREATE INDEX idx_aperm_zone_type ON access_permissions (zone_id, permission_type);
CREATE INDEX idx_aperm_visitor_zone ON access_permissions (visitor_id, zone_id, status);

-- biometric_enrollment_records indexes
CREATE INDEX idx_ber_visitor ON biometric_enrollment_records (visitor_id);
CREATE INDEX idx_ber_employee ON biometric_enrollment_records (employee_id);
CREATE INDEX idx_ber_type ON biometric_enrollment_records (biometric_type);
CREATE INDEX idx_ber_device ON biometric_enrollment_records (enrollment_device_id);
CREATE INDEX idx_ber_status ON biometric_enrollment_records (status);
CREATE INDEX idx_ber_created_at ON biometric_enrollment_records (created_at);
CREATE INDEX idx_ber_subject_type ON biometric_enrollment_records (subject_type, biometric_type);

-- emergency_lockdowns indexes
CREATE INDEX idx_elk_building ON emergency_lockdowns (building_id);
CREATE INDEX idx_elk_floor ON emergency_lockdowns (floor_id);
CREATE INDEX idx_elk_zone ON emergency_lockdowns (zone_id);
CREATE INDEX idx_elk_type ON emergency_lockdowns (lockdown_type);
CREATE INDEX idx_elk_status ON emergency_lockdowns (status);
CREATE INDEX idx_elk_start ON emergency_lockdowns (start_time);
CREATE INDEX idx_elk_initiated ON emergency_lockdowns (initiated_by);
CREATE INDEX idx_elk_created_at ON emergency_lockdowns (created_at);
CREATE INDEX idx_elk_active_status ON emergency_lockdowns (status, start_time);

-- security_incidents_detail indexes
CREATE INDEX idx_sid_visitor ON security_incidents_detail (visitor_id);
CREATE INDEX idx_sid_employee ON security_incidents_detail (employee_id);
CREATE INDEX idx_sid_access_point ON security_incidents_detail (access_point_id);
CREATE INDEX idx_sid_zone ON security_incidents_detail (zone_id);
CREATE INDEX idx_sid_appointment ON security_incidents_detail (appointment_id);
CREATE INDEX idx_sid_checkin ON security_incidents_detail (checkin_id);
CREATE INDEX idx_sid_reporter ON security_incidents_detail (reporter_user_id);
CREATE INDEX idx_sid_officer ON security_incidents_detail (assigned_officer_id);
CREATE INDEX idx_sid_type ON security_incidents_detail (incident_type);
CREATE INDEX idx_sid_severity ON security_incidents_detail (severity);
CREATE INDEX idx_sid_status ON security_incidents_detail (status);
CREATE INDEX idx_sid_time ON security_incidents_detail (incident_time);
CREATE INDEX idx_sid_created_at ON security_incidents_detail (created_at);
CREATE INDEX idx_sid_severity_status ON security_incidents_detail (severity, status);

-- access_logs indexes
CREATE INDEX idx_alog_visitor ON access_logs (visitor_id);
CREATE INDEX idx_alog_employee ON access_logs (employee_id);
CREATE INDEX idx_alog_access_point ON access_logs (access_point_id);
CREATE INDEX idx_alog_zone ON access_logs (zone_id);
CREATE INDEX idx_alog_device ON access_logs (device_id);
CREATE INDEX idx_alog_pass ON access_logs (pass_id);
CREATE INDEX idx_alog_checkin ON access_logs (checkin_id);
CREATE INDEX idx_alog_method ON access_logs (access_method);
CREATE INDEX idx_alog_result ON access_logs (access_result);
CREATE INDEX idx_alog_time ON access_logs (access_time);
CREATE INDEX idx_alog_created_at ON access_logs (created_at);
CREATE INDEX idx_alog_visitor_time ON access_logs (visitor_id, access_time);
CREATE INDEX idx_alog_point_time ON access_logs (access_point_id, access_time);
CREATE INDEX idx_alog_result_time ON access_logs (access_result, access_time);

-- vehicle_access_logs indexes
CREATE INDEX idx_val_visitor ON vehicle_access_logs (visitor_id);
CREATE INDEX idx_val_employee ON vehicle_access_logs (employee_id);
CREATE INDEX idx_val_appointment ON vehicle_access_logs (appointment_id);
CREATE INDEX idx_val_entry_gate ON vehicle_access_logs (entry_gate_id);
CREATE INDEX idx_val_exit_gate ON vehicle_access_logs (exit_gate_id);
CREATE INDEX idx_val_officer ON vehicle_access_logs (security_officer_id);
CREATE INDEX idx_val_plate ON vehicle_access_logs (license_plate);
CREATE INDEX idx_val_entry_time ON vehicle_access_logs (entry_time);
CREATE INDEX idx_val_exit_time ON vehicle_access_logs (exit_time);
CREATE INDEX idx_val_driver_type ON vehicle_access_logs (driver_type);
CREATE INDEX idx_val_security_check ON vehicle_access_logs (security_check_result);
CREATE INDEX idx_val_created_at ON vehicle_access_logs (created_at);
CREATE INDEX idx_val_plate_entry ON vehicle_access_logs (license_plate, entry_time);

-- surveillance_events indexes
CREATE INDEX idx_sve_camera ON surveillance_events (camera_device_id);
CREATE INDEX idx_sve_zone ON surveillance_events (zone_id);
CREATE INDEX idx_sve_visitor ON surveillance_events (visitor_id);
CREATE INDEX idx_sve_employee ON surveillance_events (employee_id);
CREATE INDEX idx_sve_incident ON surveillance_events (incident_id);
CREATE INDEX idx_sve_type ON surveillance_events (event_type);
CREATE INDEX idx_sve_severity ON surveillance_events (severity);
CREATE INDEX idx_sve_status ON surveillance_events (status);
CREATE INDEX idx_sve_time ON surveillance_events (event_time);
CREATE INDEX idx_sve_reviewed ON surveillance_events (reviewed_by);
CREATE INDEX idx_sve_created_at ON surveillance_events (created_at);
CREATE INDEX idx_sve_type_severity ON surveillance_events (event_type, severity);

-- security_patrols indexes
CREATE INDEX idx_spt_guard ON security_patrols (guard_user_id);
CREATE INDEX idx_spt_building ON security_patrols (building_id);
CREATE INDEX idx_spt_zone ON security_patrols (zone_id);
CREATE INDEX idx_spt_status ON security_patrols (patrol_status);
CREATE INDEX idx_spt_scheduled_start ON security_patrols (scheduled_start);
CREATE INDEX idx_spt_scheduled_end ON security_patrols (scheduled_end);
CREATE INDEX idx_spt_created_at ON security_patrols (created_at);
CREATE INDEX idx_spt_guard_status ON security_patrols (guard_user_id, patrol_status);

-- visitor_access_history indexes
CREATE INDEX idx_vah_visitor ON visitor_access_history (visitor_id);
CREATE INDEX idx_vah_risk_level ON visitor_access_history (risk_level);
CREATE INDEX idx_vah_risk_score ON visitor_access_history (risk_score);
CREATE INDEX idx_vah_last_access ON visitor_access_history (last_access_time);
CREATE INDEX idx_vah_created_at ON visitor_access_history (created_at);


-- =====================================================================================
-- MODULE 13: NOTIFICATION MANAGEMENT SYSTEM
-- =====================================================================================

-- =====================================================================================
-- 13.1 NOTIFICATION CHANNELS (Delivery Channel Registry)
-- =====================================================================================
CREATE TABLE notification_channels (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique channel identifier',
    channel_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    channel_code VARCHAR(30) NOT NULL COMMENT 'Unique channel identifier code',
    channel_name VARCHAR(100) NOT NULL COMMENT 'Human-readable channel display name',
    channel_type ENUM('EMAIL', 'SMS', 'PUSH', 'IN_APP', 'WHATSAPP', 'SLACK', 'TEAMS', 'WEBHOOK') NOT NULL COMMENT 'Delivery transport classification',
    provider_name VARCHAR(100) NULL COMMENT 'Third-party service provider name (e.g., SendGrid, Twilio, FCM)',
    provider_config_json JSON NULL COMMENT 'Encrypted provider API keys, endpoints, and configuration',
    rate_limit_per_minute INT UNSIGNED NULL COMMENT 'Maximum messages per minute for this channel',
    rate_limit_per_hour INT UNSIGNED NULL COMMENT 'Maximum messages per hour for this channel',
    is_default BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if this is the default channel for its type',
    priority_order INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Delivery preference order (lower = higher priority)',
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DEPRECATED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Channel operational status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for channel record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_ntch_code UNIQUE (channel_code),
    CONSTRAINT uq_ntch_name UNIQUE (channel_name),
    CONSTRAINT fk_ntch_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntch_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntch_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Delivery channel registry with provider configuration and rate limiting';

-- =====================================================================================
-- 13.2 NOTIFICATION TEMPLATE LIBRARY (Reusable Message Templates)
-- =====================================================================================
CREATE TABLE notification_template_library (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique template library identifier',
    template_lib_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    template_code VARCHAR(80) NOT NULL COMMENT 'Unique template key code (e.g., VISITOR_CHECKIN, APPOINTMENT_APPROVED)',
    template_name VARCHAR(200) NOT NULL COMMENT 'Human-readable template display name',
    category ENUM('VISITOR', 'APPOINTMENT', 'CHECKIN', 'CHECKOUT', 'SECURITY', 'AUTHENTICATION', 'APPROVAL', 'SYSTEM', 'CAMPAIGN', 'EMERGENCY', 'MAINTENANCE') NOT NULL COMMENT 'Module category this template belongs to',
    channel_type ENUM('EMAIL', 'SMS', 'PUSH', 'IN_APP', 'WHATSAPP', 'SLACK', 'TEAMS', 'WEBHOOK') NOT NULL DEFAULT 'EMAIL' COMMENT 'Target delivery channel for this template variant',
    subject_template VARCHAR(500) NULL COMMENT 'Message subject line with {{placeholder}} support',
    body_template TEXT NOT NULL COMMENT 'Message body content with {{placeholder}} support (HTML for email)',
    body_plain_text TEXT NULL COMMENT 'Plain text fallback body for non-HTML channels',
    placeholders_json JSON NULL COMMENT 'JSON array of supported placeholder keys (e.g., ["visitor_name", "appointment_time"])',
    default_priority ENUM('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY') NOT NULL DEFAULT 'MEDIUM' COMMENT 'Default priority when using this template',
    language VARCHAR(10) NOT NULL DEFAULT 'en' COMMENT 'ISO 639-1 language code for the template',
    version INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Template version number for change tracking',
    is_system_template BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if this is a system-managed template (non-editable)',
    status ENUM('ACTIVE', 'DRAFT', 'ARCHIVED', 'DEPRECATED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Template lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for template record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_ntlib_code_channel_lang UNIQUE (template_code, channel_type, language),
    CONSTRAINT fk_ntlib_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntlib_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntlib_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Reusable notification templates with placeholder support and multi-language versioning';

-- =====================================================================================
-- 13.3 NOTIFICATION EVENTS (System Event Trigger Registry)
-- =====================================================================================
CREATE TABLE notification_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique event trigger identifier',
    event_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    event_code VARCHAR(100) NOT NULL COMMENT 'Unique event trigger code (e.g., VISITOR_ARRIVED, PASS_EXPIRED)',
    event_name VARCHAR(200) NOT NULL COMMENT 'Human-readable event description',
    source_module ENUM('VISITOR', 'APPOINTMENT', 'CHECKIN', 'CHECKOUT', 'SECURITY', 'AUTHENTICATION', 'APPROVAL', 'RECEPTION', 'PASS', 'CALENDAR', 'ORGANIZATION', 'SYSTEM') NOT NULL COMMENT 'Originating system module for this event',
    default_template_id BIGINT UNSIGNED NULL COMMENT 'Reference to default template for this event',
    default_channels_json JSON NULL COMMENT 'JSON array of default channel codes (e.g., ["EMAIL", "IN_APP"])',
    default_priority ENUM('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY') NOT NULL DEFAULT 'MEDIUM' COMMENT 'Default priority level for notifications from this event',
    is_user_configurable BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Flags if users can subscribe/unsubscribe from this event',
    is_mandatory BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if this event notification cannot be disabled (e.g., security alerts)',
    cooldown_seconds INT UNSIGNED NULL COMMENT 'Minimum seconds between repeated notifications for same event/user',
    description TEXT NULL COMMENT 'Detailed explanation of when this event fires',
    status ENUM('ACTIVE', 'INACTIVE', 'DEPRECATED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Event trigger lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for event record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_ntev_code UNIQUE (event_code),
    CONSTRAINT fk_ntev_template FOREIGN KEY (default_template_id) REFERENCES notification_template_library (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ntev_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntev_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntev_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'System event trigger registry mapping module events to notification workflows';

-- =====================================================================================
-- 13.4 NOTIFICATION CAMPAIGNS (Bulk Broadcast Management)
-- =====================================================================================
CREATE TABLE notification_campaigns (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique campaign identifier',
    campaign_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    campaign_code VARCHAR(50) NOT NULL COMMENT 'Unique alphanumeric campaign code',
    campaign_name VARCHAR(200) NOT NULL COMMENT 'Human-readable campaign title',
    campaign_type ENUM('ANNOUNCEMENT', 'EMERGENCY_BROADCAST', 'MAINTENANCE_ALERT', 'POLICY_UPDATE', 'PROMOTIONAL', 'SURVEY', 'REMINDER', 'CUSTOM') NOT NULL DEFAULT 'ANNOUNCEMENT' COMMENT 'Campaign classification type',
    template_id BIGINT UNSIGNED NULL COMMENT 'Reference to template used for this campaign',
    target_audience ENUM('ALL_USERS', 'ALL_EMPLOYEES', 'ALL_VISITORS', 'DEPARTMENT', 'ROLE', 'BUILDING', 'ZONE', 'CUSTOM_LIST') NOT NULL DEFAULT 'ALL_USERS' COMMENT 'Target audience scope for the campaign',
    target_filter_json JSON NULL COMMENT 'JSON filter criteria for custom audience (department_ids, role_ids, building_ids, etc.)',
    channels_json JSON NOT NULL COMMENT 'JSON array of delivery channels for this campaign',
    subject VARCHAR(500) NULL COMMENT 'Campaign message subject line',
    body_content TEXT NOT NULL COMMENT 'Campaign message body content',
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY') NOT NULL DEFAULT 'MEDIUM' COMMENT 'Campaign delivery priority level',
    scheduled_at DATETIME NULL COMMENT 'Scheduled send time (NULL = send immediately)',
    started_at DATETIME NULL COMMENT 'Timestamp when campaign processing began',
    completed_at DATETIME NULL COMMENT 'Timestamp when all campaign messages were dispatched',
    total_recipients INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total number of targeted recipients',
    total_sent INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Count of successfully sent messages',
    total_failed INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Count of failed delivery attempts',
    total_delivered INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Count of confirmed delivered messages',
    total_read INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Count of read/opened messages',
    initiated_by BIGINT UNSIGNED NOT NULL COMMENT 'Reference to admin user who created the campaign',
    approved_by BIGINT UNSIGNED NULL COMMENT 'Reference to user who approved the campaign (if approval required)',
    status ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'DRAFT' COMMENT 'Campaign lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for campaign record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_ntcmp_code UNIQUE (campaign_code),
    CONSTRAINT fk_ntcmp_template FOREIGN KEY (template_id) REFERENCES notification_template_library (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ntcmp_initiated FOREIGN KEY (initiated_by) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ntcmp_approved FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ntcmp_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntcmp_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntcmp_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Bulk notification campaigns and emergency broadcast management';

-- =====================================================================================
-- 13.5 NOTIFICATION MESSAGES (Core Notification Records)
-- =====================================================================================
CREATE TABLE notification_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique notification message identifier',
    notification_msg_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    notification_uid VARCHAR(64) NOT NULL COMMENT 'Unique external reference UUID for the notification',
    event_id BIGINT UNSIGNED NULL COMMENT 'Reference to triggering system event',
    template_id BIGINT UNSIGNED NULL COMMENT 'Reference to template used for rendering',
    campaign_id BIGINT UNSIGNED NULL COMMENT 'Reference to parent campaign (NULL if not part of campaign)',
    category ENUM('VISITOR', 'APPOINTMENT', 'CHECKIN', 'CHECKOUT', 'SECURITY', 'AUTHENTICATION', 'APPROVAL', 'SYSTEM', 'CAMPAIGN', 'EMERGENCY', 'MAINTENANCE') NOT NULL DEFAULT 'SYSTEM' COMMENT 'Notification category classification',
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY') NOT NULL DEFAULT 'MEDIUM' COMMENT 'Delivery priority level',
    subject VARCHAR(500) NULL COMMENT 'Notification subject line or title',
    body_html TEXT NULL COMMENT 'Rendered HTML body content',
    body_plain TEXT NOT NULL COMMENT 'Rendered plain text body content',
    payload_json JSON NULL COMMENT 'Structured data payload for push/in-app notifications (deep links, actions, etc.)',
    placeholders_data_json JSON NULL COMMENT 'JSON of resolved placeholder values used during rendering',
    source_entity_type VARCHAR(50) NULL COMMENT 'Source entity type (e.g., appointment, visitor, checkin)',
    source_entity_id BIGINT UNSIGNED NULL COMMENT 'Source entity ID for back-reference',
    sender_user_id BIGINT UNSIGNED NULL COMMENT 'Reference to user who triggered the notification (NULL if system-generated)',
    scheduled_at DATETIME NULL COMMENT 'Scheduled delivery time (NULL = send immediately)',
    expires_at DATETIME NULL COMMENT 'Expiration time after which notification should not be delivered',
    total_recipients INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total number of recipients for this notification',
    status ENUM('PENDING', 'QUEUED', 'PROCESSING', 'SENT', 'PARTIALLY_SENT', 'DELIVERED', 'READ', 'FAILED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'PENDING' COMMENT 'Notification lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for notification record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_ntmsg_uid UNIQUE (notification_uid),
    CONSTRAINT fk_ntmsg_event FOREIGN KEY (event_id) REFERENCES notification_events (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ntmsg_template FOREIGN KEY (template_id) REFERENCES notification_template_library (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ntmsg_campaign FOREIGN KEY (campaign_id) REFERENCES notification_campaigns (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ntmsg_sender FOREIGN KEY (sender_user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ntmsg_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntmsg_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntmsg_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Core notification message records with template rendering and event sourcing';

-- =====================================================================================
-- 13.6 NOTIFICATION RECIPIENTS (Per-Recipient Delivery Tracking)
-- =====================================================================================
CREATE TABLE notification_recipients (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique recipient record identifier',
    recipient_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    notification_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to parent notification message',
    recipient_type ENUM('USER', 'VISITOR', 'EXTERNAL_EMAIL', 'EXTERNAL_PHONE', 'GROUP') NOT NULL COMMENT 'Type of the notification recipient',
    user_id BIGINT UNSIGNED NULL COMMENT 'Reference to internal user recipient',
    visitor_id BIGINT UNSIGNED NULL COMMENT 'Reference to visitor recipient',
    recipient_email VARCHAR(200) NULL COMMENT 'Email address for external or override delivery',
    recipient_phone VARCHAR(30) NULL COMMENT 'Phone number for SMS delivery',
    recipient_device_token VARCHAR(500) NULL COMMENT 'Push notification device token (FCM/APNs)',
    channel_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to delivery channel used for this recipient',
    delivery_status ENUM('PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'CLICKED', 'BOUNCED', 'FAILED', 'EXPIRED', 'UNSUBSCRIBED') NOT NULL DEFAULT 'PENDING' COMMENT 'Per-recipient delivery lifecycle status',
    sent_at DATETIME NULL COMMENT 'Timestamp when message was sent to provider',
    delivered_at DATETIME NULL COMMENT 'Timestamp when delivery was confirmed by provider',
    read_at DATETIME NULL COMMENT 'Timestamp when recipient opened/read the notification',
    clicked_at DATETIME NULL COMMENT 'Timestamp when recipient clicked a link in the notification',
    failure_reason TEXT NULL COMMENT 'Provider error message or failure description',
    provider_message_id VARCHAR(255) NULL COMMENT 'External provider tracking ID (e.g., SendGrid message ID)',
    retry_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of delivery retry attempts made',
    max_retries INT UNSIGNED NOT NULL DEFAULT 3 COMMENT 'Maximum allowed retry attempts',
    next_retry_at DATETIME NULL COMMENT 'Scheduled time for next retry attempt',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for recipient record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT chk_ntrcp_retry CHECK (retry_count <= max_retries),
    CONSTRAINT fk_ntrcp_notification FOREIGN KEY (notification_id) REFERENCES notification_messages (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ntrcp_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ntrcp_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ntrcp_channel FOREIGN KEY (channel_id) REFERENCES notification_channels (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ntrcp_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntrcp_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntrcp_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Per-recipient delivery tracking with retry logic and provider response mapping';

-- =====================================================================================
-- 13.7 NOTIFICATION QUEUE (Async Processing Queue)
-- =====================================================================================
CREATE TABLE notification_queue (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique queue entry identifier',
    queue_entry_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    notification_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to notification message to be processed',
    recipient_id BIGINT UNSIGNED NULL COMMENT 'Reference to specific recipient (NULL if broadcasting to all)',
    channel_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to delivery channel for this queue entry',
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY') NOT NULL DEFAULT 'MEDIUM' COMMENT 'Queue processing priority (EMERGENCY bypasses delays)',
    priority_score INT UNSIGNED NOT NULL DEFAULT 500 COMMENT 'Numeric priority score for sorting (higher = processed first)',
    payload_json JSON NOT NULL COMMENT 'Complete rendered message payload ready for delivery',
    attempt_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Current delivery attempt number',
    max_attempts INT UNSIGNED NOT NULL DEFAULT 3 COMMENT 'Maximum delivery attempts before marking as failed',
    scheduled_at DATETIME NOT NULL COMMENT 'Earliest time this entry should be processed',
    locked_at DATETIME NULL COMMENT 'Timestamp when a worker locked this entry for processing',
    locked_by VARCHAR(100) NULL COMMENT 'Worker process identifier that locked this entry',
    processed_at DATETIME NULL COMMENT 'Timestamp when processing was completed',
    next_retry_at DATETIME NULL COMMENT 'Scheduled time for next retry if current attempt fails',
    error_message TEXT NULL COMMENT 'Last error message from failed delivery attempt',
    queue_status ENUM('PENDING', 'LOCKED', 'PROCESSING', 'COMPLETED', 'FAILED', 'DEAD_LETTER', 'CANCELLED') NOT NULL DEFAULT 'PENDING' COMMENT 'Queue entry processing status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for queue entry',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT chk_ntq_attempts CHECK (attempt_count <= max_attempts),
    CONSTRAINT fk_ntq_notification FOREIGN KEY (notification_id) REFERENCES notification_messages (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ntq_recipient FOREIGN KEY (recipient_id) REFERENCES notification_recipients (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ntq_channel FOREIGN KEY (channel_id) REFERENCES notification_channels (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ntq_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntq_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntq_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Async notification processing queue with priority scoring, retry logic, and worker locking';

-- =====================================================================================
-- 13.8 NOTIFICATION DELIVERY LOGS (Audit Trail of Every Delivery Attempt)
-- =====================================================================================
CREATE TABLE notification_delivery_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique delivery log entry identifier',
    delivery_log_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    notification_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to parent notification message',
    recipient_id BIGINT UNSIGNED NULL COMMENT 'Reference to specific recipient',
    channel_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to delivery channel used',
    queue_entry_id BIGINT UNSIGNED NULL COMMENT 'Reference to queue entry that triggered this delivery',
    attempt_number INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Sequential attempt number for this delivery',
    delivery_status ENUM('INITIATED', 'SENT', 'DELIVERED', 'BOUNCED', 'FAILED', 'TIMEOUT', 'REJECTED', 'RATE_LIMITED') NOT NULL COMMENT 'Outcome of this delivery attempt',
    provider_name VARCHAR(100) NULL COMMENT 'Third-party provider used for delivery',
    provider_message_id VARCHAR(255) NULL COMMENT 'External tracking ID from provider',
    provider_response_code VARCHAR(20) NULL COMMENT 'HTTP status code or provider error code',
    provider_response_body TEXT NULL COMMENT 'Full provider response body for debugging',
    error_category ENUM('INVALID_ADDRESS', 'BOUNCED', 'SPAM_BLOCKED', 'RATE_LIMITED', 'PROVIDER_ERROR', 'TIMEOUT', 'NETWORK_ERROR', 'INVALID_TOKEN', 'UNSUBSCRIBED', 'NONE') NOT NULL DEFAULT 'NONE' COMMENT 'Standardized error category for analytics',
    error_message TEXT NULL COMMENT 'Human-readable error description',
    request_payload_json JSON NULL COMMENT 'Outbound request payload sent to provider (for debugging)',
    latency_ms INT UNSIGNED NULL COMMENT 'Delivery latency in milliseconds from send to provider response',
    ip_address VARCHAR(45) NULL COMMENT 'IP address of the sending server',
    attempted_at DATETIME NOT NULL COMMENT 'Timestamp when delivery attempt was initiated',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for log entry',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_ntdl_notification FOREIGN KEY (notification_id) REFERENCES notification_messages (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ntdl_recipient FOREIGN KEY (recipient_id) REFERENCES notification_recipients (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ntdl_channel FOREIGN KEY (channel_id) REFERENCES notification_channels (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ntdl_queue FOREIGN KEY (queue_entry_id) REFERENCES notification_queue (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ntdl_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntdl_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntdl_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Complete audit trail of every notification delivery attempt with provider responses';

-- =====================================================================================
-- 13.9 NOTIFICATION PREFERENCES (User Channel & Quiet Hours Preferences)
-- =====================================================================================
CREATE TABLE notification_preferences (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique preference record identifier',
    preference_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to user who owns these preferences',
    channel_id BIGINT UNSIGNED NULL COMMENT 'Reference to specific channel (NULL = global preferences)',
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Enable/disable email notifications',
    sms_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Enable/disable SMS notifications',
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Enable/disable push notifications',
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Enable/disable in-app notifications',
    whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Enable/disable WhatsApp notifications',
    slack_enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Enable/disable Slack notifications',
    teams_enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Enable/disable Microsoft Teams notifications',
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Enable/disable quiet hours filtering',
    quiet_hours_start TIME NULL COMMENT 'Start time for quiet hours (no notifications)',
    quiet_hours_end TIME NULL COMMENT 'End time for quiet hours',
    quiet_hours_timezone VARCHAR(50) NOT NULL DEFAULT 'UTC' COMMENT 'Timezone for quiet hours calculation',
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en' COMMENT 'Preferred notification language (ISO 639-1)',
    preferred_timezone VARCHAR(50) NOT NULL DEFAULT 'UTC' COMMENT 'Preferred timezone for date/time formatting',
    digest_enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Aggregate low-priority notifications into periodic digests',
    digest_frequency ENUM('HOURLY', 'DAILY', 'WEEKLY') NULL COMMENT 'Frequency of digest delivery if enabled',
    digest_time TIME NULL COMMENT 'Preferred delivery time for digest notifications',
    emergency_override BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Allow EMERGENCY priority to bypass all preferences',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for preference record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_ntprf_user_channel UNIQUE (user_id, channel_id),
    CONSTRAINT fk_ntprf_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ntprf_channel FOREIGN KEY (channel_id) REFERENCES notification_channels (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ntprf_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntprf_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntprf_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'User notification preferences with multi-channel toggles, quiet hours, and digest settings';

-- =====================================================================================
-- 13.10 NOTIFICATION SUBSCRIPTIONS (Event Subscription Management)
-- =====================================================================================
CREATE TABLE notification_subscriptions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique subscription record identifier',
    subscription_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to subscribing user',
    event_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to notification event being subscribed to',
    channels_json JSON NULL COMMENT 'JSON array of preferred channels for this subscription (overrides default)',
    is_subscribed BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Current subscription state (TRUE=subscribed, FALSE=unsubscribed)',
    subscribed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when subscription was created',
    unsubscribed_at DATETIME NULL COMMENT 'Timestamp when user unsubscribed (NULL if still active)',
    unsubscribe_reason VARCHAR(255) NULL COMMENT 'User-provided reason for unsubscribing',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for subscription record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_ntsub_user_event UNIQUE (user_id, event_id),
    CONSTRAINT fk_ntsub_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ntsub_event FOREIGN KEY (event_id) REFERENCES notification_events (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ntsub_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntsub_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntsub_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'User subscription management for specific notification event types';

-- =====================================================================================
-- 13.11 NOTIFICATION ATTACHMENTS (File Attachments for Notifications)
-- =====================================================================================
CREATE TABLE notification_attachments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique attachment record identifier',
    attachment_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    notification_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to parent notification message',
    file_name VARCHAR(255) NOT NULL COMMENT 'Original file name of the attachment',
    file_url VARCHAR(500) NOT NULL COMMENT 'Storage URL or path to the attachment file',
    file_type ENUM('QR_CODE', 'VISITOR_PASS', 'PDF', 'IMAGE', 'CSV', 'DOCUMENT', 'VIDEO', 'OTHER') NOT NULL DEFAULT 'DOCUMENT' COMMENT 'Attachment content type classification',
    mime_type VARCHAR(100) NOT NULL COMMENT 'MIME type of the attachment (e.g., application/pdf, image/png)',
    file_size_bytes BIGINT UNSIGNED NULL COMMENT 'File size in bytes',
    checksum_sha256 VARCHAR(64) NULL COMMENT 'SHA-256 hash of file content for integrity verification',
    is_inline BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if attachment is embedded inline (e.g., QR code in email body)',
    content_id VARCHAR(100) NULL COMMENT 'Content-ID for inline attachments (CID in HTML email)',
    expiry_date DATETIME NULL COMMENT 'Attachment access expiration date (for temporary URLs)',
    download_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of times the attachment was downloaded',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for attachment record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_ntatt_notification FOREIGN KEY (notification_id) REFERENCES notification_messages (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ntatt_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntatt_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntatt_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'File attachments for notifications including QR codes, visitor passes, and documents';

-- =====================================================================================
-- 13.12 NOTIFICATION STATISTICS (Aggregated Analytics & Metrics)
-- =====================================================================================
CREATE TABLE notification_statistics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique statistics record identifier',
    stats_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    period_type ENUM('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY') NOT NULL COMMENT 'Aggregation time period granularity',
    period_start DATETIME NOT NULL COMMENT 'Start of the statistics aggregation window',
    period_end DATETIME NOT NULL COMMENT 'End of the statistics aggregation window',
    channel_id BIGINT UNSIGNED NULL COMMENT 'Reference to specific channel (NULL = all channels aggregate)',
    event_id BIGINT UNSIGNED NULL COMMENT 'Reference to specific event type (NULL = all events aggregate)',
    campaign_id BIGINT UNSIGNED NULL COMMENT 'Reference to specific campaign (NULL = non-campaign stats)',
    total_notifications INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total notifications created in this period',
    total_sent INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total successfully sent',
    total_delivered INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total confirmed delivered',
    total_read INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total opened or read',
    total_clicked INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total link clicks',
    total_bounced INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total bounced deliveries',
    total_failed INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total failed delivery attempts',
    total_expired INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total expired before delivery',
    total_unsubscribed INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total unsubscribe events',
    delivery_rate DECIMAL(5,2) NULL COMMENT 'Delivery success rate percentage (0.00-100.00)',
    open_rate DECIMAL(5,2) NULL COMMENT 'Read/open rate percentage (0.00-100.00)',
    click_rate DECIMAL(5,2) NULL COMMENT 'Click-through rate percentage (0.00-100.00)',
    bounce_rate DECIMAL(5,2) NULL COMMENT 'Bounce rate percentage (0.00-100.00)',
    failure_rate DECIMAL(5,2) NULL COMMENT 'Failure rate percentage (0.00-100.00)',
    avg_delivery_latency_ms INT UNSIGNED NULL COMMENT 'Average delivery latency in milliseconds',
    avg_time_to_read_minutes INT UNSIGNED NULL COMMENT 'Average minutes from delivery to read',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag for statistics record',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_ntst_period UNIQUE (period_type, period_start, channel_id, event_id, campaign_id),
    CONSTRAINT chk_ntst_delivery_rate CHECK (delivery_rate IS NULL OR (delivery_rate >= 0 AND delivery_rate <= 100)),
    CONSTRAINT chk_ntst_open_rate CHECK (open_rate IS NULL OR (open_rate >= 0 AND open_rate <= 100)),
    CONSTRAINT chk_ntst_click_rate CHECK (click_rate IS NULL OR (click_rate >= 0 AND click_rate <= 100)),
    CONSTRAINT chk_ntst_bounce_rate CHECK (bounce_rate IS NULL OR (bounce_rate >= 0 AND bounce_rate <= 100)),
    CONSTRAINT chk_ntst_failure_rate CHECK (failure_rate IS NULL OR (failure_rate >= 0 AND failure_rate <= 100)),
    CONSTRAINT fk_ntst_channel FOREIGN KEY (channel_id) REFERENCES notification_channels (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ntst_event FOREIGN KEY (event_id) REFERENCES notification_events (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ntst_campaign FOREIGN KEY (campaign_id) REFERENCES notification_campaigns (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ntst_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntst_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ntst_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Aggregated notification analytics with delivery, open, click, and failure rate tracking';


-- =====================================================================================
-- MODULE 13: PERFORMANCE INDEXES
-- =====================================================================================

-- notification_channels indexes
CREATE INDEX idx_ntch_type ON notification_channels (channel_type);
CREATE INDEX idx_ntch_status ON notification_channels (status);
CREATE INDEX idx_ntch_default ON notification_channels (is_default);
CREATE INDEX idx_ntch_created_at ON notification_channels (created_at);

-- notification_template_library indexes
CREATE INDEX idx_ntlib_code ON notification_template_library (template_code);
CREATE INDEX idx_ntlib_category ON notification_template_library (category);
CREATE INDEX idx_ntlib_channel ON notification_template_library (channel_type);
CREATE INDEX idx_ntlib_language ON notification_template_library (language);
CREATE INDEX idx_ntlib_status ON notification_template_library (status);
CREATE INDEX idx_ntlib_system ON notification_template_library (is_system_template);
CREATE INDEX idx_ntlib_created_at ON notification_template_library (created_at);
CREATE INDEX idx_ntlib_cat_channel ON notification_template_library (category, channel_type);

-- notification_events indexes
CREATE INDEX idx_ntev_code ON notification_events (event_code);
CREATE INDEX idx_ntev_module ON notification_events (source_module);
CREATE INDEX idx_ntev_template ON notification_events (default_template_id);
CREATE INDEX idx_ntev_priority ON notification_events (default_priority);
CREATE INDEX idx_ntev_status ON notification_events (status);
CREATE INDEX idx_ntev_mandatory ON notification_events (is_mandatory);
CREATE INDEX idx_ntev_created_at ON notification_events (created_at);

-- notification_campaigns indexes
CREATE INDEX idx_ntcmp_type ON notification_campaigns (campaign_type);
CREATE INDEX idx_ntcmp_template ON notification_campaigns (template_id);
CREATE INDEX idx_ntcmp_audience ON notification_campaigns (target_audience);
CREATE INDEX idx_ntcmp_priority ON notification_campaigns (priority);
CREATE INDEX idx_ntcmp_status ON notification_campaigns (status);
CREATE INDEX idx_ntcmp_scheduled ON notification_campaigns (scheduled_at);
CREATE INDEX idx_ntcmp_initiated ON notification_campaigns (initiated_by);
CREATE INDEX idx_ntcmp_created_at ON notification_campaigns (created_at);
CREATE INDEX idx_ntcmp_status_sched ON notification_campaigns (status, scheduled_at);

-- notification_messages indexes
CREATE INDEX idx_ntmsg_uid ON notification_messages (notification_uid);
CREATE INDEX idx_ntmsg_event ON notification_messages (event_id);
CREATE INDEX idx_ntmsg_template ON notification_messages (template_id);
CREATE INDEX idx_ntmsg_campaign ON notification_messages (campaign_id);
CREATE INDEX idx_ntmsg_category ON notification_messages (category);
CREATE INDEX idx_ntmsg_priority ON notification_messages (priority);
CREATE INDEX idx_ntmsg_sender ON notification_messages (sender_user_id);
CREATE INDEX idx_ntmsg_status ON notification_messages (status);
CREATE INDEX idx_ntmsg_scheduled ON notification_messages (scheduled_at);
CREATE INDEX idx_ntmsg_expires ON notification_messages (expires_at);
CREATE INDEX idx_ntmsg_source ON notification_messages (source_entity_type, source_entity_id);
CREATE INDEX idx_ntmsg_created_at ON notification_messages (created_at);
CREATE INDEX idx_ntmsg_priority_status ON notification_messages (priority, status);
CREATE INDEX idx_ntmsg_category_status ON notification_messages (category, status);

-- notification_recipients indexes
CREATE INDEX idx_ntrcp_notification ON notification_recipients (notification_id);
CREATE INDEX idx_ntrcp_user ON notification_recipients (user_id);
CREATE INDEX idx_ntrcp_visitor ON notification_recipients (visitor_id);
CREATE INDEX idx_ntrcp_channel ON notification_recipients (channel_id);
CREATE INDEX idx_ntrcp_type ON notification_recipients (recipient_type);
CREATE INDEX idx_ntrcp_delivery ON notification_recipients (delivery_status);
CREATE INDEX idx_ntrcp_sent ON notification_recipients (sent_at);
CREATE INDEX idx_ntrcp_delivered ON notification_recipients (delivered_at);
CREATE INDEX idx_ntrcp_read ON notification_recipients (read_at);
CREATE INDEX idx_ntrcp_retry ON notification_recipients (next_retry_at);
CREATE INDEX idx_ntrcp_provider ON notification_recipients (provider_message_id);
CREATE INDEX idx_ntrcp_created_at ON notification_recipients (created_at);
CREATE INDEX idx_ntrcp_user_status ON notification_recipients (user_id, delivery_status);
CREATE INDEX idx_ntrcp_notif_status ON notification_recipients (notification_id, delivery_status);

-- notification_queue indexes
CREATE INDEX idx_ntq_notification ON notification_queue (notification_id);
CREATE INDEX idx_ntq_recipient ON notification_queue (recipient_id);
CREATE INDEX idx_ntq_channel ON notification_queue (channel_id);
CREATE INDEX idx_ntq_priority ON notification_queue (priority);
CREATE INDEX idx_ntq_priority_score ON notification_queue (priority_score);
CREATE INDEX idx_ntq_status ON notification_queue (queue_status);
CREATE INDEX idx_ntq_scheduled ON notification_queue (scheduled_at);
CREATE INDEX idx_ntq_locked ON notification_queue (locked_at);
CREATE INDEX idx_ntq_next_retry ON notification_queue (next_retry_at);
CREATE INDEX idx_ntq_created_at ON notification_queue (created_at);
CREATE INDEX idx_ntq_status_priority ON notification_queue (queue_status, priority_score DESC);
CREATE INDEX idx_ntq_status_scheduled ON notification_queue (queue_status, scheduled_at);
CREATE INDEX idx_ntq_pending_process ON notification_queue (queue_status, priority_score DESC, scheduled_at);

-- notification_delivery_logs indexes
CREATE INDEX idx_ntdl_notification ON notification_delivery_logs (notification_id);
CREATE INDEX idx_ntdl_recipient ON notification_delivery_logs (recipient_id);
CREATE INDEX idx_ntdl_channel ON notification_delivery_logs (channel_id);
CREATE INDEX idx_ntdl_queue ON notification_delivery_logs (queue_entry_id);
CREATE INDEX idx_ntdl_status ON notification_delivery_logs (delivery_status);
CREATE INDEX idx_ntdl_error_cat ON notification_delivery_logs (error_category);
CREATE INDEX idx_ntdl_provider ON notification_delivery_logs (provider_name);
CREATE INDEX idx_ntdl_provider_msg ON notification_delivery_logs (provider_message_id);
CREATE INDEX idx_ntdl_attempted ON notification_delivery_logs (attempted_at);
CREATE INDEX idx_ntdl_created_at ON notification_delivery_logs (created_at);
CREATE INDEX idx_ntdl_status_attempted ON notification_delivery_logs (delivery_status, attempted_at);

-- notification_preferences indexes
CREATE INDEX idx_ntprf_user ON notification_preferences (user_id);
CREATE INDEX idx_ntprf_channel ON notification_preferences (channel_id);
CREATE INDEX idx_ntprf_quiet ON notification_preferences (quiet_hours_enabled);
CREATE INDEX idx_ntprf_digest ON notification_preferences (digest_enabled);
CREATE INDEX idx_ntprf_language ON notification_preferences (preferred_language);
CREATE INDEX idx_ntprf_created_at ON notification_preferences (created_at);

-- notification_subscriptions indexes
CREATE INDEX idx_ntsub_user ON notification_subscriptions (user_id);
CREATE INDEX idx_ntsub_event ON notification_subscriptions (event_id);
CREATE INDEX idx_ntsub_subscribed ON notification_subscriptions (is_subscribed);
CREATE INDEX idx_ntsub_created_at ON notification_subscriptions (created_at);
CREATE INDEX idx_ntsub_user_sub ON notification_subscriptions (user_id, is_subscribed);

-- notification_attachments indexes
CREATE INDEX idx_ntatt_notification ON notification_attachments (notification_id);
CREATE INDEX idx_ntatt_type ON notification_attachments (file_type);
CREATE INDEX idx_ntatt_inline ON notification_attachments (is_inline);
CREATE INDEX idx_ntatt_expiry ON notification_attachments (expiry_date);
CREATE INDEX idx_ntatt_created_at ON notification_attachments (created_at);

-- notification_statistics indexes
CREATE INDEX idx_ntst_period_type ON notification_statistics (period_type);
CREATE INDEX idx_ntst_period_start ON notification_statistics (period_start);
CREATE INDEX idx_ntst_period_end ON notification_statistics (period_end);
CREATE INDEX idx_ntst_channel ON notification_statistics (channel_id);
CREATE INDEX idx_ntst_event ON notification_statistics (event_id);
CREATE INDEX idx_ntst_campaign ON notification_statistics (campaign_id);
CREATE INDEX idx_ntst_created_at ON notification_statistics (created_at);
CREATE INDEX idx_ntst_period_range ON notification_statistics (period_type, period_start, period_end);

-- =====================================================================================
-- MODULE 14: REPORTING & ANALYTICS MANAGEMENT
-- =====================================================================================

-- =====================================================================================
-- 14.1 REPORT DEFINITIONS (Master Report Registry)
-- =====================================================================================
CREATE TABLE report_definitions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique report definition identifier',
    report_def_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    report_code VARCHAR(80) NOT NULL COMMENT 'Unique machine-readable report code',
    report_name VARCHAR(200) NOT NULL COMMENT 'Human-readable report display name',
    report_type ENUM('VISITOR', 'SECURITY', 'CHECKIN', 'CHECKOUT', 'APPOINTMENT', 'APPROVAL', 'NOTIFICATION', 'SYSTEM_PERFORMANCE', 'COMPLIANCE', 'EXECUTIVE_SUMMARY', 'CUSTOM') NOT NULL COMMENT 'Report classification type',
    data_source_module ENUM('VISITOR', 'APPOINTMENT', 'CHECKIN', 'CHECKOUT', 'SECURITY', 'AUTHENTICATION', 'APPROVAL', 'RECEPTION', 'PASS', 'CALENDAR', 'ORGANIZATION', 'NOTIFICATION', 'SYSTEM', 'MULTI_MODULE') NOT NULL COMMENT 'Primary data source module',
    description TEXT NULL COMMENT 'Detailed description of what this report produces',
    query_template TEXT NULL COMMENT 'SQL query template or stored procedure reference for data extraction',
    parameters_schema_json JSON NULL COMMENT 'JSON schema defining available report parameters (date range, filters, etc.)',
    default_parameters_json JSON NULL COMMENT 'Default parameter values for this report',
    output_formats_json JSON NOT NULL DEFAULT ('["PDF","CSV","EXCEL"]') COMMENT 'JSON array of supported export formats',
    schedule_type ENUM('MANUAL', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM_CRON') NOT NULL DEFAULT 'MANUAL' COMMENT 'Report generation schedule type',
    cron_expression VARCHAR(50) NULL COMMENT 'Custom cron expression for CUSTOM_CRON schedule type',
    is_scheduled BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if this report runs on a schedule',
    is_public BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if report is accessible to all authenticated users',
    min_role_level INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Minimum role level required to access this report',
    allowed_roles_json JSON NULL COMMENT 'JSON array of role IDs allowed to access this report',
    category VARCHAR(100) NULL COMMENT 'Report category for UI grouping (e.g., Operations, Security, Executive)',
    version INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Report definition version for change tracking',
    owner_user_id BIGINT UNSIGNED NULL COMMENT 'Reference to user who owns/created this report definition',
    status ENUM('ACTIVE', 'DRAFT', 'ARCHIVED', 'DEPRECATED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Report definition lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_rptdef_code UNIQUE (report_code),
    CONSTRAINT fk_rptdef_owner FOREIGN KEY (owner_user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_rptdef_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_rptdef_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_rptdef_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Master report registry with scheduling, RBAC, and parameterized query support';

-- =====================================================================================
-- 14.2 REPORT EXECUTIONS (Execution History & Output Tracking)
-- =====================================================================================
CREATE TABLE report_executions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique execution record identifier',
    execution_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    report_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to report definition',
    execution_uid VARCHAR(64) NOT NULL COMMENT 'Unique execution UUID for external tracking',
    triggered_by BIGINT UNSIGNED NULL COMMENT 'Reference to user who triggered this execution (NULL if scheduled)',
    trigger_type ENUM('MANUAL', 'SCHEDULED', 'API', 'SYSTEM') NOT NULL DEFAULT 'MANUAL' COMMENT 'How the execution was triggered',
    parameters_json JSON NULL COMMENT 'Actual parameter values used for this execution run',
    output_format ENUM('PDF', 'CSV', 'EXCEL', 'JSON', 'HTML') NOT NULL DEFAULT 'PDF' COMMENT 'Output format for this execution',
    output_file_url VARCHAR(500) NULL COMMENT 'Storage URL of the generated report file',
    output_file_size_bytes BIGINT UNSIGNED NULL COMMENT 'Generated file size in bytes',
    output_row_count INT UNSIGNED NULL COMMENT 'Number of data rows in the generated report',
    start_time DATETIME NOT NULL COMMENT 'Execution start timestamp',
    end_time DATETIME NULL COMMENT 'Execution completion timestamp',
    execution_duration_ms BIGINT UNSIGNED NULL COMMENT 'Total execution duration in milliseconds',
    error_message TEXT NULL COMMENT 'Error details if execution failed',
    error_stack_trace TEXT NULL COMMENT 'Full error stack trace for debugging',
    retry_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of retry attempts',
    scheduled_job_id BIGINT UNSIGNED NULL COMMENT 'Reference to scheduled job that triggered this execution',
    execution_status ENUM('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED', 'TIMEOUT') NOT NULL DEFAULT 'PENDING' COMMENT 'Execution lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_rptexe_uid UNIQUE (execution_uid),
    CONSTRAINT fk_rptexe_report FOREIGN KEY (report_id) REFERENCES report_definitions (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rptexe_triggered FOREIGN KEY (triggered_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_rptexe_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_rptexe_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_rptexe_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Report execution history with output tracking, duration metrics, and error logging';

-- =====================================================================================
-- 14.3 ANALYTICS VISITOR SUMMARY (Time-Series Visitor Aggregation)
-- =====================================================================================
CREATE TABLE analytics_visitor_summary (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique analytics record identifier',
    summary_date DATE NOT NULL COMMENT 'Aggregation date',
    summary_hour TINYINT UNSIGNED NULL COMMENT 'Hour of day (0-23) for hourly granularity, NULL for daily rollup',
    granularity ENUM('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL DEFAULT 'DAILY' COMMENT 'Aggregation time granularity',
    facility_id BIGINT UNSIGNED NULL COMMENT 'Reference to facility (NULL = all facilities aggregate)',
    building_id BIGINT UNSIGNED NULL COMMENT 'Reference to building (NULL = all buildings aggregate)',
    total_visitors INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total visitor count in this period',
    new_visitors INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'First-time visitors in this period',
    returning_visitors INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Returning visitors in this period',
    pre_registered_visitors INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Pre-registered appointment visitors',
    walk_in_visitors INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Walk-in visitors without prior appointment',
    vip_visitors INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'VIP category visitors',
    contractor_visitors INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Contractor or vendor visitors',
    approved_visitors INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Visitors with approved appointments',
    rejected_visitors INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Visitors with rejected appointments',
    cancelled_visitors INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Visitors with cancelled appointments',
    blacklisted_attempts INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Blacklisted visitor access attempts',
    average_visit_duration_minutes INT UNSIGNED NULL COMMENT 'Average visit duration in minutes',
    peak_visitor_count INT UNSIGNED NULL COMMENT 'Maximum concurrent visitors in this period',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_avs_period UNIQUE (summary_date, summary_hour, granularity, facility_id, building_id),
    CONSTRAINT chk_avs_hour CHECK (summary_hour IS NULL OR (summary_hour >= 0 AND summary_hour <= 23)),
    CONSTRAINT fk_avs_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_avs_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_avs_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Time-series visitor analytics with hourly/daily/weekly/monthly granularity and category breakdown';

-- =====================================================================================
-- 14.4 ANALYTICS CHECKIN SUMMARY (Check-In Performance Analytics)
-- =====================================================================================
CREATE TABLE analytics_checkin_summary (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique analytics record identifier',
    summary_date DATE NOT NULL COMMENT 'Aggregation date',
    summary_hour TINYINT UNSIGNED NULL COMMENT 'Hour of day (0-23) for hourly granularity',
    granularity ENUM('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL DEFAULT 'DAILY' COMMENT 'Aggregation time granularity',
    facility_id BIGINT UNSIGNED NULL COMMENT 'Reference to facility (NULL = all facilities)',
    building_id BIGINT UNSIGNED NULL COMMENT 'Reference to building (NULL = all buildings)',
    total_checkins INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total check-ins in this period',
    qr_checkins INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Check-ins via QR code scanning',
    rfid_checkins INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Check-ins via RFID badge',
    manual_checkins INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Manual check-ins by receptionist',
    kiosk_checkins INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Self-service kiosk check-ins',
    biometric_checkins INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Biometric-based check-ins',
    average_checkin_time_seconds INT UNSIGNED NULL COMMENT 'Average check-in processing time in seconds',
    min_checkin_time_seconds INT UNSIGNED NULL COMMENT 'Fastest check-in processing time',
    max_checkin_time_seconds INT UNSIGNED NULL COMMENT 'Slowest check-in processing time',
    peak_hour TINYINT UNSIGNED NULL COMMENT 'Hour with highest check-in volume (0-23)',
    peak_hour_count INT UNSIGNED NULL COMMENT 'Check-in count during peak hour',
    gate_usage_json JSON NULL COMMENT 'JSON breakdown of check-ins per access point/gate',
    failed_checkins INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Failed check-in attempts',
    average_wait_time_minutes INT UNSIGNED NULL COMMENT 'Average visitor wait time before check-in',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_acs_period UNIQUE (summary_date, summary_hour, granularity, facility_id, building_id),
    CONSTRAINT chk_acs_hour CHECK (summary_hour IS NULL OR (summary_hour >= 0 AND summary_hour <= 23)),
    CONSTRAINT chk_acs_peak CHECK (peak_hour IS NULL OR (peak_hour >= 0 AND peak_hour <= 23)),
    CONSTRAINT fk_acs_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_acs_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_acs_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Check-in performance analytics with method breakdown, processing times, and gate usage';

-- =====================================================================================
-- 14.5 ANALYTICS CHECKOUT SUMMARY (Check-Out Analytics)
-- =====================================================================================
CREATE TABLE analytics_checkout_summary (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique analytics record identifier',
    summary_date DATE NOT NULL COMMENT 'Aggregation date',
    summary_hour TINYINT UNSIGNED NULL COMMENT 'Hour of day (0-23) for hourly granularity',
    granularity ENUM('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL DEFAULT 'DAILY' COMMENT 'Aggregation time granularity',
    facility_id BIGINT UNSIGNED NULL COMMENT 'Reference to facility (NULL = all facilities)',
    building_id BIGINT UNSIGNED NULL COMMENT 'Reference to building (NULL = all buildings)',
    total_checkouts INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total check-outs in this period',
    normal_checkouts INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'On-time checkouts within expected window',
    late_checkouts INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Checkouts past expected departure time',
    forced_checkouts INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Security-forced or system-auto checkouts',
    no_show_checkouts INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Visitors who checked in but never checked out',
    average_checkout_time_seconds INT UNSIGNED NULL COMMENT 'Average checkout processing time in seconds',
    average_visit_duration_minutes INT UNSIGNED NULL COMMENT 'Average total visit duration in minutes',
    max_visit_duration_minutes INT UNSIGNED NULL COMMENT 'Longest visit duration in minutes',
    overtime_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Visitors who exceeded standard visit duration',
    assets_returned INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total assets returned during checkout',
    assets_missing INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Assets not returned at checkout time',
    feedback_submissions INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of checkout feedback forms submitted',
    average_feedback_rating DECIMAL(3,2) NULL COMMENT 'Average visitor feedback rating (1.00-5.00)',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_acos_period UNIQUE (summary_date, summary_hour, granularity, facility_id, building_id),
    CONSTRAINT chk_acos_hour CHECK (summary_hour IS NULL OR (summary_hour >= 0 AND summary_hour <= 23)),
    CONSTRAINT chk_acos_rating CHECK (average_feedback_rating IS NULL OR (average_feedback_rating >= 1.00 AND average_feedback_rating <= 5.00)),
    CONSTRAINT fk_acos_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_acos_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_acos_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Check-out analytics with late checkout tracking, asset returns, and feedback metrics';

-- =====================================================================================
-- 14.6 ANALYTICS SECURITY SUMMARY (Security Analytics & Risk Monitoring)
-- =====================================================================================
CREATE TABLE analytics_security_summary (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique analytics record identifier',
    summary_date DATE NOT NULL COMMENT 'Aggregation date',
    summary_hour TINYINT UNSIGNED NULL COMMENT 'Hour of day (0-23) for hourly granularity',
    granularity ENUM('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL DEFAULT 'DAILY' COMMENT 'Aggregation time granularity',
    facility_id BIGINT UNSIGNED NULL COMMENT 'Reference to facility (NULL = all facilities)',
    building_id BIGINT UNSIGNED NULL COMMENT 'Reference to building (NULL = all buildings)',
    total_incidents INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total security incidents in this period',
    critical_incidents INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'CRITICAL severity incidents',
    high_risk_incidents INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'HIGH severity incidents',
    medium_risk_incidents INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'MEDIUM severity incidents',
    low_risk_incidents INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'LOW severity incidents',
    unauthorized_access_attempts INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Unauthorized access attempt count',
    denied_entries INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Access denied at gate count',
    tailgating_incidents INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Tailgating detection count',
    fake_credential_attempts INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Fake QR/badge/credential attempts',
    alerts_triggered INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total security alerts triggered',
    lockdowns_activated INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Emergency lockdowns activated',
    patrols_completed INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Security patrols completed',
    patrols_missed INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Scheduled patrols that were missed',
    surveillance_events INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'AI surveillance events detected',
    resolved_incidents INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Incidents resolved in this period',
    avg_resolution_time_minutes INT UNSIGNED NULL COMMENT 'Average incident resolution time in minutes',
    risk_score DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Calculated facility risk score (0.00-100.00)',
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'LOW' COMMENT 'Overall risk level assessment',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_asec_period UNIQUE (summary_date, summary_hour, granularity, facility_id, building_id),
    CONSTRAINT chk_asec_hour CHECK (summary_hour IS NULL OR (summary_hour >= 0 AND summary_hour <= 23)),
    CONSTRAINT chk_asec_risk CHECK (risk_score >= 0 AND risk_score <= 100),
    CONSTRAINT fk_asec_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_asec_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_asec_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Security analytics with incident classification, risk scoring, and patrol tracking';

-- =====================================================================================
-- 14.7 ANALYTICS NOTIFICATION SUMMARY (Notification Performance Analytics)
-- =====================================================================================
CREATE TABLE analytics_notification_summary (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique analytics record identifier',
    summary_date DATE NOT NULL COMMENT 'Aggregation date',
    summary_hour TINYINT UNSIGNED NULL COMMENT 'Hour of day (0-23) for hourly granularity',
    granularity ENUM('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL DEFAULT 'DAILY' COMMENT 'Aggregation time granularity',
    channel_type ENUM('EMAIL', 'SMS', 'PUSH', 'IN_APP', 'WHATSAPP', 'SLACK', 'TEAMS', 'WEBHOOK', 'ALL') NOT NULL DEFAULT 'ALL' COMMENT 'Notification channel type',
    total_created INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total notifications created',
    total_queued INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total entered queue',
    total_sent INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total successfully sent to provider',
    total_delivered INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total confirmed delivered',
    total_read INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total read/opened',
    total_clicked INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total link clicks',
    total_bounced INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total bounced',
    total_failed INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total failed delivery',
    total_expired INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total expired before delivery',
    total_unsubscribed INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total unsubscribes in period',
    delivery_rate DECIMAL(5,2) NULL COMMENT 'Delivery success rate percentage (0.00-100.00)',
    open_rate DECIMAL(5,2) NULL COMMENT 'Open/read rate percentage (0.00-100.00)',
    click_rate DECIMAL(5,2) NULL COMMENT 'Click-through rate percentage (0.00-100.00)',
    bounce_rate DECIMAL(5,2) NULL COMMENT 'Bounce rate percentage (0.00-100.00)',
    failure_rate DECIMAL(5,2) NULL COMMENT 'Failure rate percentage (0.00-100.00)',
    avg_delivery_latency_ms INT UNSIGNED NULL COMMENT 'Average delivery latency in milliseconds',
    avg_time_to_read_minutes INT UNSIGNED NULL COMMENT 'Average time from delivery to read',
    emergency_notifications INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'EMERGENCY priority notifications count',
    campaign_notifications INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Campaign/broadcast notification count',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_ans_period UNIQUE (summary_date, summary_hour, granularity, channel_type),
    CONSTRAINT chk_ans_hour CHECK (summary_hour IS NULL OR (summary_hour >= 0 AND summary_hour <= 23)),
    CONSTRAINT chk_ans_delivery CHECK (delivery_rate IS NULL OR (delivery_rate >= 0 AND delivery_rate <= 100)),
    CONSTRAINT chk_ans_open CHECK (open_rate IS NULL OR (open_rate >= 0 AND open_rate <= 100)),
    CONSTRAINT chk_ans_click CHECK (click_rate IS NULL OR (click_rate >= 0 AND click_rate <= 100)),
    CONSTRAINT fk_ans_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ans_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ans_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Notification performance analytics with channel breakdown and delivery rate tracking';

-- =====================================================================================
-- 14.8 KPI METRICS (Key Performance Indicator Tracking)
-- =====================================================================================
CREATE TABLE kpi_metrics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique KPI record identifier',
    kpi_metric_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    kpi_code VARCHAR(80) NOT NULL COMMENT 'Unique KPI identifier code',
    kpi_name VARCHAR(200) NOT NULL COMMENT 'Human-readable KPI display name',
    kpi_category ENUM('VISITOR', 'SECURITY', 'OPERATIONS', 'PERFORMANCE', 'COMPLIANCE', 'SATISFACTION', 'EFFICIENCY', 'CAPACITY') NOT NULL COMMENT 'KPI classification category',
    kpi_value DECIMAL(15,4) NOT NULL COMMENT 'Current KPI value',
    kpi_unit VARCHAR(30) NULL COMMENT 'Unit of measurement (%, count, minutes, seconds, score)',
    previous_value DECIMAL(15,4) NULL COMMENT 'Previous period KPI value for trend comparison',
    trend_direction ENUM('UP', 'DOWN', 'STABLE') NULL COMMENT 'Value trend compared to previous period',
    trend_percentage DECIMAL(8,2) NULL COMMENT 'Percentage change from previous period',
    calculation_method ENUM('COUNT', 'AVERAGE', 'SUM', 'PERCENTAGE', 'RATIO', 'RATE', 'MEDIAN', 'CUSTOM') NOT NULL DEFAULT 'COUNT' COMMENT 'Method used to calculate the KPI',
    calculation_query TEXT NULL COMMENT 'SQL query or formula used for calculation',
    data_source_module VARCHAR(50) NOT NULL COMMENT 'Module that provides data for this KPI',
    threshold_min DECIMAL(15,4) NULL COMMENT 'Minimum acceptable threshold (values below trigger warning)',
    threshold_max DECIMAL(15,4) NULL COMMENT 'Maximum acceptable threshold (values above trigger warning)',
    threshold_critical_min DECIMAL(15,4) NULL COMMENT 'Critical minimum threshold (values below trigger alert)',
    threshold_critical_max DECIMAL(15,4) NULL COMMENT 'Critical maximum threshold (values above trigger alert)',
    threshold_status ENUM('NORMAL', 'WARNING', 'CRITICAL', 'UNKNOWN') NOT NULL DEFAULT 'NORMAL' COMMENT 'Current threshold status based on value vs thresholds',
    alert_notification_event_id BIGINT UNSIGNED NULL COMMENT 'Reference to notification event for threshold alerts',
    measurement_period ENUM('REAL_TIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY') NOT NULL DEFAULT 'DAILY' COMMENT 'Period over which the KPI is measured',
    last_calculated_at DATETIME NULL COMMENT 'Timestamp of last KPI calculation',
    target_value DECIMAL(15,4) NULL COMMENT 'Target/goal value for this KPI',
    display_order INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Display order on dashboards',
    status ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'KPI lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_kpi_code UNIQUE (kpi_code),
    CONSTRAINT fk_kpi_alert_event FOREIGN KEY (alert_notification_event_id) REFERENCES notification_events (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_kpi_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_kpi_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_kpi_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Key performance indicators with threshold monitoring, trend tracking, and alert integration';

-- =====================================================================================
-- 14.9 DASHBOARD WIDGETS (UI Configuration Per Role)
-- =====================================================================================
CREATE TABLE dashboard_widgets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique widget identifier',
    widget_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    widget_code VARCHAR(80) NOT NULL COMMENT 'Unique widget identifier code',
    widget_name VARCHAR(200) NOT NULL COMMENT 'Human-readable widget display name',
    widget_type ENUM('CHART_LINE', 'CHART_BAR', 'CHART_PIE', 'CHART_DOUGHNUT', 'CHART_AREA', 'TABLE', 'KPI_CARD', 'GAUGE', 'HEATMAP', 'MAP', 'COUNTER', 'TIMELINE', 'CUSTOM') NOT NULL COMMENT 'Widget visualization type',
    data_source ENUM('VISITOR_SUMMARY', 'CHECKIN_SUMMARY', 'CHECKOUT_SUMMARY', 'SECURITY_SUMMARY', 'NOTIFICATION_SUMMARY', 'KPI_METRIC', 'REPORT_EXECUTION', 'SYSTEM_PERFORMANCE', 'CUSTOM_QUERY') NOT NULL COMMENT 'Data source for this widget',
    data_query TEXT NULL COMMENT 'Custom SQL query or API endpoint for widget data',
    data_config_json JSON NULL COMMENT 'JSON configuration for data mapping (axis, series, colors, etc.)',
    refresh_interval_seconds INT UNSIGNED NOT NULL DEFAULT 300 COMMENT 'Widget auto-refresh interval in seconds (0 = no auto-refresh)',
    allowed_roles_json JSON NULL COMMENT 'JSON array of role IDs allowed to see this widget',
    min_role_level INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Minimum role level to access this widget',
    dashboard_section ENUM('OVERVIEW', 'VISITOR', 'SECURITY', 'OPERATIONS', 'PERFORMANCE', 'EXECUTIVE', 'CUSTOM') NOT NULL DEFAULT 'OVERVIEW' COMMENT 'Dashboard section where widget appears',
    layout_position_json JSON NULL COMMENT 'JSON object with grid position {row, col, width, height}',
    display_order INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Display order within the dashboard section',
    default_time_range ENUM('TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'THIS_MONTH', 'LAST_MONTH', 'THIS_QUARTER', 'THIS_YEAR', 'CUSTOM') NOT NULL DEFAULT 'TODAY' COMMENT 'Default time range filter for this widget',
    is_resizable BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Flags if user can resize this widget',
    is_removable BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Flags if user can remove from their dashboard',
    status ENUM('ACTIVE', 'DRAFT', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Widget lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_dw_code UNIQUE (widget_code),
    CONSTRAINT fk_dw_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_dw_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_dw_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Dashboard widget configuration with role-based access, layout positioning, and auto-refresh';

-- =====================================================================================
-- 14.10 AUDIT REPORT LOGS (Report Access Audit Trail)
-- =====================================================================================
CREATE TABLE audit_report_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique audit log identifier',
    audit_log_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to user who performed the action',
    report_id BIGINT UNSIGNED NULL COMMENT 'Reference to report definition accessed',
    execution_id BIGINT UNSIGNED NULL COMMENT 'Reference to specific report execution',
    widget_id BIGINT UNSIGNED NULL COMMENT 'Reference to dashboard widget accessed',
    action_type ENUM('VIEW', 'EXPORT', 'DOWNLOAD', 'PRINT', 'SHARE', 'SCHEDULE', 'DELETE', 'MODIFY', 'EXECUTE') NOT NULL COMMENT 'Type of action performed',
    resource_type ENUM('REPORT', 'DASHBOARD', 'WIDGET', 'KPI', 'ANALYTICS', 'EXPORT_FILE') NOT NULL COMMENT 'Type of resource accessed',
    resource_name VARCHAR(200) NULL COMMENT 'Human-readable name of the accessed resource',
    export_format VARCHAR(20) NULL COMMENT 'Export format if action is EXPORT or DOWNLOAD',
    access_time DATETIME NOT NULL COMMENT 'Timestamp of the access event',
    ip_address VARCHAR(45) NOT NULL COMMENT 'IP address of the user at time of access',
    user_agent TEXT NULL COMMENT 'Browser or client user agent string',
    session_id VARCHAR(128) NULL COMMENT 'User session identifier for correlation',
    duration_ms INT UNSIGNED NULL COMMENT 'Time spent on the report/dashboard in milliseconds',
    data_rows_accessed INT UNSIGNED NULL COMMENT 'Number of data rows viewed or exported',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_arl_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_arl_report FOREIGN KEY (report_id) REFERENCES report_definitions (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_arl_execution FOREIGN KEY (execution_id) REFERENCES report_executions (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_arl_widget FOREIGN KEY (widget_id) REFERENCES dashboard_widgets (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_arl_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_arl_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_arl_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Complete audit trail for report and analytics access tracking for compliance';

-- =====================================================================================
-- 14.11 SYSTEM PERFORMANCE METRICS (Infrastructure Health Monitoring)
-- =====================================================================================
CREATE TABLE system_performance_metrics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique performance metric identifier',
    metric_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    metric_timestamp DATETIME NOT NULL COMMENT 'Exact timestamp of the metric measurement',
    granularity ENUM('MINUTE', 'FIVE_MINUTE', 'FIFTEEN_MINUTE', 'HOURLY', 'DAILY') NOT NULL DEFAULT 'FIVE_MINUTE' COMMENT 'Measurement sampling granularity',
    server_node VARCHAR(100) NULL COMMENT 'Server node/instance identifier (for multi-node deployments)',
    cpu_usage_percent DECIMAL(5,2) NULL COMMENT 'CPU utilization percentage (0.00-100.00)',
    memory_usage_percent DECIMAL(5,2) NULL COMMENT 'Memory utilization percentage (0.00-100.00)',
    memory_used_mb INT UNSIGNED NULL COMMENT 'Memory used in megabytes',
    memory_total_mb INT UNSIGNED NULL COMMENT 'Total available memory in megabytes',
    disk_usage_percent DECIMAL(5,2) NULL COMMENT 'Disk utilization percentage (0.00-100.00)',
    api_requests_count INT UNSIGNED NULL COMMENT 'Total API requests in this period',
    api_avg_latency_ms INT UNSIGNED NULL COMMENT 'Average API response latency in milliseconds',
    api_p95_latency_ms INT UNSIGNED NULL COMMENT '95th percentile API latency in milliseconds',
    api_p99_latency_ms INT UNSIGNED NULL COMMENT '99th percentile API latency in milliseconds',
    api_error_count INT UNSIGNED NULL COMMENT 'Total API errors in this period',
    api_error_rate DECIMAL(5,2) NULL COMMENT 'API error rate percentage (0.00-100.00)',
    db_active_connections INT UNSIGNED NULL COMMENT 'Number of active database connections',
    db_avg_query_time_ms INT UNSIGNED NULL COMMENT 'Average database query time in milliseconds',
    db_slow_queries_count INT UNSIGNED NULL COMMENT 'Number of slow queries (>1 second)',
    db_deadlocks_count INT UNSIGNED NULL COMMENT 'Number of database deadlocks detected',
    active_users_count INT UNSIGNED NULL COMMENT 'Number of active user sessions',
    active_visitors_count INT UNSIGNED NULL COMMENT 'Number of visitors currently on premises',
    queue_depth INT UNSIGNED NULL COMMENT 'Notification queue depth (pending items)',
    uptime_percent DECIMAL(5,2) NULL COMMENT 'System uptime percentage (0.00-100.00)',
    health_status ENUM('HEALTHY', 'DEGRADED', 'WARNING', 'CRITICAL', 'DOWN') NOT NULL DEFAULT 'HEALTHY' COMMENT 'Overall system health status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT chk_spm_cpu CHECK (cpu_usage_percent IS NULL OR (cpu_usage_percent >= 0 AND cpu_usage_percent <= 100)),
    CONSTRAINT chk_spm_mem CHECK (memory_usage_percent IS NULL OR (memory_usage_percent >= 0 AND memory_usage_percent <= 100)),
    CONSTRAINT chk_spm_disk CHECK (disk_usage_percent IS NULL OR (disk_usage_percent >= 0 AND disk_usage_percent <= 100)),
    CONSTRAINT chk_spm_uptime CHECK (uptime_percent IS NULL OR (uptime_percent >= 0 AND uptime_percent <= 100)),
    CONSTRAINT chk_spm_error CHECK (api_error_rate IS NULL OR (api_error_rate >= 0 AND api_error_rate <= 100)),
    CONSTRAINT fk_spm_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_spm_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_spm_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'System infrastructure health metrics with API latency, database performance, and resource usage';

-- =====================================================================================
-- 14.12 SCHEDULED REPORT JOBS (Automated Report Generation)
-- =====================================================================================
CREATE TABLE scheduled_report_jobs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique scheduled job identifier',
    job_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    job_code VARCHAR(80) NOT NULL COMMENT 'Unique job identifier code',
    job_name VARCHAR(200) NOT NULL COMMENT 'Human-readable job display name',
    report_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to report definition to be executed',
    frequency ENUM('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM_CRON') NOT NULL COMMENT 'Job execution frequency',
    cron_expression VARCHAR(50) NULL COMMENT 'Custom cron expression for CUSTOM_CRON frequency',
    schedule_time TIME NOT NULL COMMENT 'Time of day the job should execute',
    schedule_timezone VARCHAR(50) NOT NULL DEFAULT 'UTC' COMMENT 'Timezone for schedule time calculation',
    schedule_day_of_week TINYINT UNSIGNED NULL COMMENT 'Day of week for weekly jobs (1=Monday, 7=Sunday)',
    schedule_day_of_month TINYINT UNSIGNED NULL COMMENT 'Day of month for monthly jobs (1-31)',
    parameters_json JSON NULL COMMENT 'Default report parameters for this scheduled job',
    output_format ENUM('PDF', 'CSV', 'EXCEL', 'JSON', 'HTML') NOT NULL DEFAULT 'PDF' COMMENT 'Output format for generated reports',
    delivery_method ENUM('EMAIL', 'STORAGE', 'BOTH') NOT NULL DEFAULT 'BOTH' COMMENT 'How generated reports are delivered',
    recipients_json JSON NULL COMMENT 'JSON array of email addresses or user IDs to receive report',
    notification_on_failure BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Send notification if job fails',
    notification_on_success BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Send notification on successful completion',
    max_retries INT UNSIGNED NOT NULL DEFAULT 2 COMMENT 'Maximum retry attempts on failure',
    timeout_minutes INT UNSIGNED NOT NULL DEFAULT 30 COMMENT 'Job execution timeout in minutes',
    last_run_time DATETIME NULL COMMENT 'Timestamp of last job execution',
    last_run_status ENUM('SUCCESS', 'FAILED', 'TIMEOUT', 'CANCELLED') NULL COMMENT 'Status of last execution',
    last_run_duration_ms BIGINT UNSIGNED NULL COMMENT 'Duration of last execution in milliseconds',
    next_run_time DATETIME NULL COMMENT 'Calculated timestamp of next scheduled execution',
    total_runs INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total number of times this job has been executed',
    total_failures INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total number of failed executions',
    owner_user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to user who created this scheduled job',
    job_status ENUM('ACTIVE', 'PAUSED', 'DISABLED', 'COMPLETED', 'ERROR') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Job lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_srj_code UNIQUE (job_code),
    CONSTRAINT chk_srj_dow CHECK (schedule_day_of_week IS NULL OR (schedule_day_of_week >= 1 AND schedule_day_of_week <= 7)),
    CONSTRAINT chk_srj_dom CHECK (schedule_day_of_month IS NULL OR (schedule_day_of_month >= 1 AND schedule_day_of_month <= 31)),
    CONSTRAINT fk_srj_report FOREIGN KEY (report_id) REFERENCES report_definitions (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_srj_owner FOREIGN KEY (owner_user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_srj_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_srj_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_srj_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Automated scheduled report generation with delivery, retry logic, and execution tracking';


-- =====================================================================================
-- MODULE 14: PERFORMANCE INDEXES
-- =====================================================================================

-- report_definitions indexes
CREATE INDEX idx_rptdef_type ON report_definitions (report_type);
CREATE INDEX idx_rptdef_module ON report_definitions (data_source_module);
CREATE INDEX idx_rptdef_schedule ON report_definitions (schedule_type);
CREATE INDEX idx_rptdef_scheduled ON report_definitions (is_scheduled);
CREATE INDEX idx_rptdef_status ON report_definitions (status);
CREATE INDEX idx_rptdef_owner ON report_definitions (owner_user_id);
CREATE INDEX idx_rptdef_category ON report_definitions (category);
CREATE INDEX idx_rptdef_created_at ON report_definitions (created_at);
CREATE INDEX idx_rptdef_type_status ON report_definitions (report_type, status);
CREATE INDEX idx_rptdef_module_type ON report_definitions (data_source_module, report_type);

-- report_executions indexes
CREATE INDEX idx_rptexe_report ON report_executions (report_id);
CREATE INDEX idx_rptexe_uid ON report_executions (execution_uid);
CREATE INDEX idx_rptexe_triggered ON report_executions (triggered_by);
CREATE INDEX idx_rptexe_trigger_type ON report_executions (trigger_type);
CREATE INDEX idx_rptexe_status ON report_executions (execution_status);
CREATE INDEX idx_rptexe_start ON report_executions (start_time);
CREATE INDEX idx_rptexe_end ON report_executions (end_time);
CREATE INDEX idx_rptexe_format ON report_executions (output_format);
CREATE INDEX idx_rptexe_created_at ON report_executions (created_at);
CREATE INDEX idx_rptexe_report_status ON report_executions (report_id, execution_status);
CREATE INDEX idx_rptexe_status_start ON report_executions (execution_status, start_time);

-- analytics_visitor_summary indexes
CREATE INDEX idx_avs_date ON analytics_visitor_summary (summary_date);
CREATE INDEX idx_avs_hour ON analytics_visitor_summary (summary_hour);
CREATE INDEX idx_avs_granularity ON analytics_visitor_summary (granularity);
CREATE INDEX idx_avs_facility ON analytics_visitor_summary (facility_id);
CREATE INDEX idx_avs_building ON analytics_visitor_summary (building_id);
CREATE INDEX idx_avs_created_at ON analytics_visitor_summary (created_at);
CREATE INDEX idx_avs_date_gran ON analytics_visitor_summary (summary_date, granularity);
CREATE INDEX idx_avs_date_facility ON analytics_visitor_summary (summary_date, facility_id);
CREATE INDEX idx_avs_gran_date_range ON analytics_visitor_summary (granularity, summary_date);

-- analytics_checkin_summary indexes
CREATE INDEX idx_acs_date ON analytics_checkin_summary (summary_date);
CREATE INDEX idx_acs_hour ON analytics_checkin_summary (summary_hour);
CREATE INDEX idx_acs_granularity ON analytics_checkin_summary (granularity);
CREATE INDEX idx_acs_facility ON analytics_checkin_summary (facility_id);
CREATE INDEX idx_acs_building ON analytics_checkin_summary (building_id);
CREATE INDEX idx_acs_created_at ON analytics_checkin_summary (created_at);
CREATE INDEX idx_acs_date_gran ON analytics_checkin_summary (summary_date, granularity);
CREATE INDEX idx_acs_date_facility ON analytics_checkin_summary (summary_date, facility_id);
CREATE INDEX idx_acs_gran_date_range ON analytics_checkin_summary (granularity, summary_date);

-- analytics_checkout_summary indexes
CREATE INDEX idx_acos_date ON analytics_checkout_summary (summary_date);
CREATE INDEX idx_acos_hour ON analytics_checkout_summary (summary_hour);
CREATE INDEX idx_acos_granularity ON analytics_checkout_summary (granularity);
CREATE INDEX idx_acos_facility ON analytics_checkout_summary (facility_id);
CREATE INDEX idx_acos_building ON analytics_checkout_summary (building_id);
CREATE INDEX idx_acos_created_at ON analytics_checkout_summary (created_at);
CREATE INDEX idx_acos_date_gran ON analytics_checkout_summary (summary_date, granularity);
CREATE INDEX idx_acos_date_facility ON analytics_checkout_summary (summary_date, facility_id);

-- analytics_security_summary indexes
CREATE INDEX idx_asec_date ON analytics_security_summary (summary_date);
CREATE INDEX idx_asec_hour ON analytics_security_summary (summary_hour);
CREATE INDEX idx_asec_granularity ON analytics_security_summary (granularity);
CREATE INDEX idx_asec_facility ON analytics_security_summary (facility_id);
CREATE INDEX idx_asec_building ON analytics_security_summary (building_id);
CREATE INDEX idx_asec_risk_level ON analytics_security_summary (risk_level);
CREATE INDEX idx_asec_risk_score ON analytics_security_summary (risk_score);
CREATE INDEX idx_asec_created_at ON analytics_security_summary (created_at);
CREATE INDEX idx_asec_date_gran ON analytics_security_summary (summary_date, granularity);
CREATE INDEX idx_asec_date_risk ON analytics_security_summary (summary_date, risk_level);

-- analytics_notification_summary indexes
CREATE INDEX idx_ans_date ON analytics_notification_summary (summary_date);
CREATE INDEX idx_ans_hour ON analytics_notification_summary (summary_hour);
CREATE INDEX idx_ans_granularity ON analytics_notification_summary (granularity);
CREATE INDEX idx_ans_channel ON analytics_notification_summary (channel_type);
CREATE INDEX idx_ans_created_at ON analytics_notification_summary (created_at);
CREATE INDEX idx_ans_date_gran ON analytics_notification_summary (summary_date, granularity);
CREATE INDEX idx_ans_date_channel ON analytics_notification_summary (summary_date, channel_type);
CREATE INDEX idx_ans_gran_channel ON analytics_notification_summary (granularity, channel_type);

-- kpi_metrics indexes
CREATE INDEX idx_kpi_code ON kpi_metrics (kpi_code);
CREATE INDEX idx_kpi_name ON kpi_metrics (kpi_name);
CREATE INDEX idx_kpi_category ON kpi_metrics (kpi_category);
CREATE INDEX idx_kpi_threshold ON kpi_metrics (threshold_status);
CREATE INDEX idx_kpi_module ON kpi_metrics (data_source_module);
CREATE INDEX idx_kpi_period ON kpi_metrics (measurement_period);
CREATE INDEX idx_kpi_status ON kpi_metrics (status);
CREATE INDEX idx_kpi_calculated ON kpi_metrics (last_calculated_at);
CREATE INDEX idx_kpi_created_at ON kpi_metrics (created_at);
CREATE INDEX idx_kpi_name_status ON kpi_metrics (kpi_name, status);
CREATE INDEX idx_kpi_cat_status ON kpi_metrics (kpi_category, status);

-- dashboard_widgets indexes
CREATE INDEX idx_dw_code ON dashboard_widgets (widget_code);
CREATE INDEX idx_dw_type ON dashboard_widgets (widget_type);
CREATE INDEX idx_dw_source ON dashboard_widgets (data_source);
CREATE INDEX idx_dw_section ON dashboard_widgets (dashboard_section);
CREATE INDEX idx_dw_status ON dashboard_widgets (status);
CREATE INDEX idx_dw_created_at ON dashboard_widgets (created_at);
CREATE INDEX idx_dw_section_order ON dashboard_widgets (dashboard_section, display_order);

-- audit_report_logs indexes
CREATE INDEX idx_arl_user ON audit_report_logs (user_id);
CREATE INDEX idx_arl_report ON audit_report_logs (report_id);
CREATE INDEX idx_arl_execution ON audit_report_logs (execution_id);
CREATE INDEX idx_arl_widget ON audit_report_logs (widget_id);
CREATE INDEX idx_arl_action ON audit_report_logs (action_type);
CREATE INDEX idx_arl_resource ON audit_report_logs (resource_type);
CREATE INDEX idx_arl_access_time ON audit_report_logs (access_time);
CREATE INDEX idx_arl_ip ON audit_report_logs (ip_address);
CREATE INDEX idx_arl_created_at ON audit_report_logs (created_at);
CREATE INDEX idx_arl_user_time ON audit_report_logs (user_id, access_time);
CREATE INDEX idx_arl_report_action ON audit_report_logs (report_id, action_type);
CREATE INDEX idx_arl_user_resource ON audit_report_logs (user_id, resource_type, access_time);

-- system_performance_metrics indexes
CREATE INDEX idx_spm_timestamp ON system_performance_metrics (metric_timestamp);
CREATE INDEX idx_spm_granularity ON system_performance_metrics (granularity);
CREATE INDEX idx_spm_node ON system_performance_metrics (server_node);
CREATE INDEX idx_spm_health ON system_performance_metrics (health_status);
CREATE INDEX idx_spm_created_at ON system_performance_metrics (created_at);
CREATE INDEX idx_spm_ts_gran ON system_performance_metrics (metric_timestamp, granularity);
CREATE INDEX idx_spm_node_ts ON system_performance_metrics (server_node, metric_timestamp);
CREATE INDEX idx_spm_health_ts ON system_performance_metrics (health_status, metric_timestamp);

-- scheduled_report_jobs indexes
CREATE INDEX idx_srj_report ON scheduled_report_jobs (report_id);
CREATE INDEX idx_srj_frequency ON scheduled_report_jobs (frequency);
CREATE INDEX idx_srj_status ON scheduled_report_jobs (job_status);
CREATE INDEX idx_srj_owner ON scheduled_report_jobs (owner_user_id);
CREATE INDEX idx_srj_next_run ON scheduled_report_jobs (next_run_time);
CREATE INDEX idx_srj_last_run ON scheduled_report_jobs (last_run_time);
CREATE INDEX idx_srj_created_at ON scheduled_report_jobs (created_at);
CREATE INDEX idx_srj_status_next ON scheduled_report_jobs (job_status, next_run_time);
CREATE INDEX idx_srj_report_status ON scheduled_report_jobs (report_id, job_status);

-- =====================================================================================
-- MODULE 15: SYSTEM ADMINISTRATION & AUDIT MANAGEMENT
-- =====================================================================================
-- NAMING: Extended prefixes (system_audit_, system_security_, etc.) avoid conflicts
-- with existing audit_logs (Module 1) and user_sessions (Module 1) tables.
-- =====================================================================================

-- =====================================================================================
-- 15.1 SYSTEM AUDIT LOGS (Central Immutable Audit Trail)
-- =====================================================================================
-- [DEPRECATED] Use alm_audit_logs (Module 16) as the canonical system audit trail.
-- This table is retained for backwards compatibility. New code should write to Module 16.
-- =====================================================================================
CREATE TABLE system_audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique immutable audit log identifier',
    audit_uid VARCHAR(64) NOT NULL COMMENT 'Unique audit entry UUID for external correlation',
    user_id BIGINT UNSIGNED NULL COMMENT 'Reference to user who performed the action (NULL for system actions)',
    module_name ENUM('AUTHENTICATION', 'USER_MANAGEMENT', 'ORGANIZATION', 'VISITOR', 'APPOINTMENT', 'APPROVAL', 'CALENDAR', 'RECEPTION', 'PASS', 'CHECKIN', 'CHECKOUT', 'SECURITY', 'NOTIFICATION', 'REPORTING', 'SYSTEM_ADMIN', 'SYSTEM') NOT NULL COMMENT 'Source module generating the audit entry',
    action_type ENUM('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'ACCESS', 'EXPORT', 'IMPORT', 'CONFIGURE', 'EXECUTE', 'ESCALATE', 'LOCK', 'UNLOCK', 'GRANT', 'REVOKE') NOT NULL COMMENT 'Type of action performed',
    entity_name VARCHAR(120) NOT NULL COMMENT 'Target entity/table name affected by the action',
    entity_id BIGINT UNSIGNED NULL COMMENT 'Primary key of the affected entity record',
    old_values JSON NULL COMMENT 'JSON snapshot of entity state before the action',
    new_values JSON NULL COMMENT 'JSON snapshot of entity state after the action',
    change_summary VARCHAR(500) NULL COMMENT 'Human-readable summary of the change',
    ip_address VARCHAR(45) NOT NULL COMMENT 'Client IP address (IPv4 or IPv6)',
    user_agent TEXT NULL COMMENT 'Client browser/application user agent string',
    http_method VARCHAR(10) NULL COMMENT 'HTTP method used (GET, POST, PUT, DELETE, PATCH)',
    endpoint VARCHAR(500) NULL COMMENT 'API endpoint or URL path accessed',
    request_id VARCHAR(64) NULL COMMENT 'Correlation ID for distributed request tracing',
    session_id VARCHAR(128) NULL COMMENT 'User session identifier for correlation',
    outcome ENUM('SUCCESS', 'FAILURE', 'PARTIAL', 'DENIED') NOT NULL DEFAULT 'SUCCESS' COMMENT 'Action outcome status',
    severity ENUM('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'INFO' COMMENT 'Audit entry severity classification',
    risk_score TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Calculated risk score (0-100) for anomaly detection',
    execution_time_ms INT UNSIGNED NULL COMMENT 'Time taken to execute the action in milliseconds',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag (never used for soft-delete on immutable logs)',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Immutable creation timestamp',
    created_by BIGINT UNSIGNED NULL COMMENT 'Reference to user who generated the log (same as user_id for manual actions)',
    CONSTRAINT uq_sal_uid UNIQUE (audit_uid),
    CONSTRAINT fk_sal_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sal_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_sal_risk CHECK (risk_score >= 0 AND risk_score <= 100)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Central immutable audit log - NO UPDATE/DELETE - partition-ready by created_at';

-- =====================================================================================
-- 15.2 SYSTEM CONFIGURATIONS (Global Settings & Feature Flags)
-- [DEPRECATED] Use scc_system_configurations (Module 17) as the canonical config store.
-- This table is retained for backwards compatibility. New code should use Module 17.
-- =====================================================================================
CREATE TABLE system_configurations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique configuration record identifier',
    config_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    config_key VARCHAR(150) NOT NULL COMMENT 'Unique machine-readable configuration key',
    config_value TEXT NOT NULL COMMENT 'Configuration value (interpreted based on config_type)',
    config_type ENUM('STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'JSON', 'DATETIME', 'ENCRYPTED') NOT NULL DEFAULT 'STRING' COMMENT 'Data type of the configuration value',
    config_category ENUM('GENERAL', 'SECURITY', 'AUTHENTICATION', 'VISITOR', 'NOTIFICATION', 'REPORTING', 'PERFORMANCE', 'INTEGRATION', 'UI', 'FEATURE_FLAG', 'COMPLIANCE') NOT NULL DEFAULT 'GENERAL' COMMENT 'Configuration category for UI grouping',
    module_scope ENUM('GLOBAL', 'AUTHENTICATION', 'USER_MANAGEMENT', 'ORGANIZATION', 'VISITOR', 'APPOINTMENT', 'APPROVAL', 'CALENDAR', 'RECEPTION', 'PASS', 'CHECKIN', 'CHECKOUT', 'SECURITY', 'NOTIFICATION', 'REPORTING', 'SYSTEM_ADMIN') NOT NULL DEFAULT 'GLOBAL' COMMENT 'Module scope of this configuration',
    description TEXT NULL COMMENT 'Human-readable description of what this configuration controls',
    default_value TEXT NULL COMMENT 'Default value for reset operations',
    validation_rule VARCHAR(255) NULL COMMENT 'Regex or rule for value validation',
    is_editable BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Flags if this config can be modified by admin',
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if the value should be masked in UI/logs',
    is_feature_flag BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if this is a feature toggle',
    requires_restart BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if system restart is needed after change',
    last_modified_by BIGINT UNSIGNED NULL COMMENT 'Reference to user who last modified this config',
    last_modified_at DATETIME NULL COMMENT 'Timestamp of last modification',
    version INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Config version for change tracking',
    status ENUM('ACTIVE', 'DEPRECATED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Configuration lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_sysconf_key UNIQUE (config_key),
    CONSTRAINT fk_sysconf_modified FOREIGN KEY (last_modified_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sysconf_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_sysconf_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_sysconf_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Global system settings, feature flags, and module-scoped configurations';

-- =====================================================================================
-- 15.3 SYSTEM SECURITY EVENTS (Security Event Tracking & Anomaly Detection)
-- =====================================================================================
-- IMMUTABLE: Security events are append-only for forensic integrity.
-- =====================================================================================
CREATE TABLE system_security_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique security event identifier',
    event_uid VARCHAR(64) NOT NULL COMMENT 'Unique event UUID for external correlation',
    event_type ENUM('LOGIN_FAILURE', 'LOGIN_SUCCESS', 'BRUTE_FORCE', 'PASSWORD_SPRAYING', 'SUSPICIOUS_ACTIVITY', 'UNAUTHORIZED_ACCESS', 'PRIVILEGE_ESCALATION', 'TOKEN_ABUSE', 'SESSION_HIJACK', 'IP_BLOCKLIST_HIT', 'RATE_LIMIT_EXCEEDED', 'INJECTION_ATTEMPT', 'XSS_ATTEMPT', 'CSRF_DETECTED', 'DATA_EXFILTRATION', 'ACCOUNT_LOCKOUT', 'MFA_FAILURE', 'CONFIG_TAMPERING', 'API_ABUSE') NOT NULL COMMENT 'Type of security event detected',
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'LOW' COMMENT 'Security event severity classification',
    user_id BIGINT UNSIGNED NULL COMMENT 'Reference to user involved in the event',
    target_user_id BIGINT UNSIGNED NULL COMMENT 'Reference to target user if different from actor',
    ip_address VARCHAR(45) NOT NULL COMMENT 'Source IP address of the event',
    geo_country VARCHAR(100) NULL COMMENT 'GeoIP resolved country',
    geo_city VARCHAR(100) NULL COMMENT 'GeoIP resolved city',
    geo_latitude DECIMAL(10,7) NULL COMMENT 'GeoIP latitude coordinate',
    geo_longitude DECIMAL(10,7) NULL COMMENT 'GeoIP longitude coordinate',
    device_fingerprint VARCHAR(255) NULL COMMENT 'Client device fingerprint hash',
    device_type VARCHAR(50) NULL COMMENT 'Device category (desktop, mobile, tablet, bot)',
    device_os VARCHAR(80) NULL COMMENT 'Operating system name and version',
    device_browser VARCHAR(80) NULL COMMENT 'Browser name and version',
    user_agent TEXT NULL COMMENT 'Full user agent string',
    request_url VARCHAR(500) NULL COMMENT 'URL or endpoint that triggered the event',
    request_method VARCHAR(10) NULL COMMENT 'HTTP method used',
    request_payload_hash VARCHAR(64) NULL COMMENT 'SHA-256 hash of suspicious request payload',
    threat_indicator VARCHAR(200) NULL COMMENT 'Specific threat indicator or pattern detected',
    risk_score TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Calculated risk score (0-100)',
    action_taken ENUM('NONE', 'LOGGED', 'BLOCKED', 'RATE_LIMITED', 'ACCOUNT_LOCKED', 'SESSION_TERMINATED', 'IP_BANNED', 'ALERT_SENT', 'ESCALATED', 'MFA_REQUIRED') NOT NULL DEFAULT 'LOGGED' COMMENT 'Automated response action taken',
    related_audit_id BIGINT UNSIGNED NULL COMMENT 'Reference to system_audit_logs entry if applicable',
    notification_sent BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if notification was triggered for this event',
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if event has been investigated and resolved',
    resolved_by BIGINT UNSIGNED NULL COMMENT 'Reference to admin who resolved the event',
    resolved_at DATETIME NULL COMMENT 'Resolution timestamp',
    resolution_notes TEXT NULL COMMENT 'Admin notes on resolution',
    is_false_positive BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if event was determined to be a false positive',
    event_time DATETIME NOT NULL COMMENT 'Exact timestamp of the security event',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_sse_uid UNIQUE (event_uid),
    CONSTRAINT chk_sse_risk CHECK (risk_score >= 0 AND risk_score <= 100),
    CONSTRAINT fk_sse_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sse_target FOREIGN KEY (target_user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sse_resolved FOREIGN KEY (resolved_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sse_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Security event tracking with GeoIP, device fingerprinting, risk scoring, and anomaly detection support';

-- =====================================================================================
-- 15.4 SYSTEM HEALTH MONITORING (Infrastructure Performance Tracking)
-- =====================================================================================
-- IMMUTABLE: Metrics are append-only time-series data.
-- =====================================================================================
CREATE TABLE system_health_monitoring (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique health metric identifier',
    metric_uid VARCHAR(64) NOT NULL COMMENT 'Unique metric UUID for external correlation',
    metric_timestamp DATETIME NOT NULL COMMENT 'Exact timestamp of the metric snapshot',
    collection_interval ENUM('THIRTY_SECOND', 'MINUTE', 'FIVE_MINUTE', 'FIFTEEN_MINUTE', 'HOURLY', 'DAILY') NOT NULL DEFAULT 'MINUTE' COMMENT 'Metric collection interval/granularity',
    server_node VARCHAR(100) NOT NULL DEFAULT 'primary' COMMENT 'Server node identifier',
    service_name VARCHAR(100) NULL COMMENT 'Specific service or microservice name',
    cpu_usage_percent DECIMAL(5,2) NULL COMMENT 'CPU utilization (0.00-100.00)',
    cpu_load_avg_1m DECIMAL(6,2) NULL COMMENT 'CPU load average over 1 minute',
    cpu_load_avg_5m DECIMAL(6,2) NULL COMMENT 'CPU load average over 5 minutes',
    memory_usage_percent DECIMAL(5,2) NULL COMMENT 'Memory utilization (0.00-100.00)',
    memory_used_mb INT UNSIGNED NULL COMMENT 'Used memory in megabytes',
    memory_available_mb INT UNSIGNED NULL COMMENT 'Available memory in megabytes',
    disk_usage_percent DECIMAL(5,2) NULL COMMENT 'Disk utilization (0.00-100.00)',
    disk_read_iops INT UNSIGNED NULL COMMENT 'Disk read I/O operations per second',
    disk_write_iops INT UNSIGNED NULL COMMENT 'Disk write I/O operations per second',
    network_in_kbps INT UNSIGNED NULL COMMENT 'Network incoming traffic (Kbps)',
    network_out_kbps INT UNSIGNED NULL COMMENT 'Network outgoing traffic (Kbps)',
    api_requests_total INT UNSIGNED NULL COMMENT 'Total API requests in this interval',
    api_latency_avg_ms INT UNSIGNED NULL COMMENT 'Average API response latency (ms)',
    api_latency_p50_ms INT UNSIGNED NULL COMMENT 'Median API latency (ms)',
    api_latency_p95_ms INT UNSIGNED NULL COMMENT '95th percentile API latency (ms)',
    api_latency_p99_ms INT UNSIGNED NULL COMMENT '99th percentile API latency (ms)',
    api_errors_total INT UNSIGNED NULL COMMENT 'Total API errors in this interval',
    api_error_rate DECIMAL(5,2) NULL COMMENT 'API error rate percentage',
    db_connections_active INT UNSIGNED NULL COMMENT 'Active database connections',
    db_connections_idle INT UNSIGNED NULL COMMENT 'Idle database connections',
    db_latency_avg_ms INT UNSIGNED NULL COMMENT 'Average database query time (ms)',
    db_slow_queries INT UNSIGNED NULL COMMENT 'Number of slow queries (>1s)',
    db_deadlocks INT UNSIGNED NULL COMMENT 'Database deadlocks detected',
    db_replication_lag_ms INT UNSIGNED NULL COMMENT 'Replication lag in milliseconds',
    active_sessions INT UNSIGNED NULL COMMENT 'Active user sessions',
    active_visitors INT UNSIGNED NULL COMMENT 'Visitors currently on premises',
    notification_queue_depth INT UNSIGNED NULL COMMENT 'Notification queue pending items',
    background_jobs_running INT UNSIGNED NULL COMMENT 'Background jobs currently executing',
    error_rate DECIMAL(5,2) NULL COMMENT 'Overall system error rate',
    uptime_seconds BIGINT UNSIGNED NULL COMMENT 'System uptime in seconds since last restart',
    health_status ENUM('HEALTHY', 'DEGRADED', 'WARNING', 'CRITICAL', 'DOWN') NOT NULL DEFAULT 'HEALTHY' COMMENT 'Overall system health',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_shm_uid UNIQUE (metric_uid),
    CONSTRAINT chk_shm_cpu CHECK (cpu_usage_percent IS NULL OR (cpu_usage_percent >= 0 AND cpu_usage_percent <= 100)),
    CONSTRAINT chk_shm_mem CHECK (memory_usage_percent IS NULL OR (memory_usage_percent >= 0 AND memory_usage_percent <= 100)),
    CONSTRAINT chk_shm_disk CHECK (disk_usage_percent IS NULL OR (disk_usage_percent >= 0 AND disk_usage_percent <= 100)),
    CONSTRAINT chk_shm_err CHECK (api_error_rate IS NULL OR (api_error_rate >= 0 AND api_error_rate <= 100)),
    CONSTRAINT fk_shm_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Infrastructure health time-series metrics with API, DB, network, and resource monitoring';

-- =====================================================================================
-- 15.5 USER ACTIVITY LOGS (User Behavior & Activity Tracking)
-- =====================================================================================
-- IMMUTABLE: Activity logs are append-only for behavioral analysis.
-- =====================================================================================
CREATE TABLE user_activity_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique activity log identifier',
    activity_uid VARCHAR(64) NOT NULL COMMENT 'Unique activity UUID for external correlation',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to user who performed the activity',
    activity_type ENUM('LOGIN', 'LOGOUT', 'PAGE_VIEW', 'API_CALL', 'FORM_SUBMIT', 'FILE_UPLOAD', 'FILE_DOWNLOAD', 'REPORT_VIEW', 'REPORT_EXPORT', 'SETTINGS_CHANGE', 'SEARCH', 'VISITOR_CHECKIN', 'VISITOR_CHECKOUT', 'PASS_GENERATE', 'APPROVAL_ACTION', 'SECURITY_ACTION', 'DASHBOARD_VIEW', 'IDLE', 'SESSION_REFRESH') NOT NULL COMMENT 'Type of user activity',
    activity_category ENUM('AUTHENTICATION', 'NAVIGATION', 'DATA_ACCESS', 'DATA_MODIFICATION', 'ADMINISTRATION', 'REPORTING', 'SECURITY', 'COMMUNICATION') NOT NULL DEFAULT 'NAVIGATION' COMMENT 'Activity category for analytics',
    module_name VARCHAR(50) NULL COMMENT 'Module where activity occurred',
    resource_path VARCHAR(500) NULL COMMENT 'Page URL or API endpoint accessed',
    resource_name VARCHAR(200) NULL COMMENT 'Human-readable name of the resource accessed',
    login_time DATETIME NULL COMMENT 'Session login timestamp (for LOGIN activities)',
    logout_time DATETIME NULL COMMENT 'Session logout timestamp (for LOGOUT activities)',
    session_duration_seconds INT UNSIGNED NULL COMMENT 'Session duration in seconds (for LOGOUT activities)',
    ip_address VARCHAR(45) NOT NULL COMMENT 'Client IP address',
    device_type VARCHAR(50) NULL COMMENT 'Device type (desktop, mobile, tablet)',
    device_os VARCHAR(80) NULL COMMENT 'Operating system',
    device_browser VARCHAR(80) NULL COMMENT 'Browser name and version',
    user_agent TEXT NULL COMMENT 'Full user agent string',
    session_id VARCHAR(128) NULL COMMENT 'Session identifier for correlation',
    activity_metadata JSON NULL COMMENT 'Additional context-specific metadata',
    response_time_ms INT UNSIGNED NULL COMMENT 'Server response time for this activity',
    activity_time DATETIME NOT NULL COMMENT 'Exact timestamp of the activity',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_ual_uid UNIQUE (activity_uid),
    CONSTRAINT fk_ual_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ual_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'User behavior and activity tracking for analytics, session analysis, and usage patterns';

-- =====================================================================================
-- 15.6 SESSION MANAGEMENT (Active & Historical Session Registry)
-- =====================================================================================
CREATE TABLE session_management (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique session record identifier',
    session_uid VARCHAR(128) NOT NULL COMMENT 'Unique session identifier token',
    user_id BIGINT UNSIGNED NULL COMMENT 'Reference to session owner',
    session_type ENUM('WEB', 'MOBILE', 'API', 'KIOSK', 'ADMIN_CONSOLE') NOT NULL DEFAULT 'WEB' COMMENT 'Client type for this session',
    start_time DATETIME NOT NULL COMMENT 'Session start timestamp',
    last_activity_time DATETIME NOT NULL COMMENT 'Timestamp of last user activity in session',
    end_time DATETIME NULL COMMENT 'Session end timestamp (NULL if active)',
    session_duration_seconds INT UNSIGNED NULL COMMENT 'Total session duration in seconds',
    idle_timeout_seconds INT UNSIGNED NOT NULL DEFAULT 1800 COMMENT 'Configured idle timeout (default 30 min)',
    max_session_seconds INT UNSIGNED NOT NULL DEFAULT 28800 COMMENT 'Maximum session lifetime (default 8 hours)',
    ip_address VARCHAR(45) NOT NULL COMMENT 'Client IP at session start',
    current_ip_address VARCHAR(45) NULL COMMENT 'Current client IP (tracks IP changes)',
    device_fingerprint VARCHAR(255) NULL COMMENT 'Device fingerprint hash for anomaly detection',
    device_type VARCHAR(50) NULL COMMENT 'Device type (desktop, mobile, tablet)',
    device_os VARCHAR(80) NULL COMMENT 'Operating system',
    device_browser VARCHAR(80) NULL COMMENT 'Browser name and version',
    user_agent TEXT NULL COMMENT 'Full user agent string',
    geo_country VARCHAR(100) NULL COMMENT 'GeoIP resolved country',
    geo_city VARCHAR(100) NULL COMMENT 'GeoIP resolved city',
    refresh_token_hash VARCHAR(255) NULL COMMENT 'Hashed refresh token for session renewal',
    total_requests INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total API requests in this session',
    total_page_views INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total page views in this session',
    is_concurrent BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if user has other active sessions',
    termination_reason ENUM('USER_LOGOUT', 'IDLE_TIMEOUT', 'MAX_SESSION_TIMEOUT', 'ADMIN_TERMINATED', 'SECURITY_VIOLATION', 'CONCURRENT_LOGIN', 'TOKEN_EXPIRED', 'SYSTEM_RESTART') NULL COMMENT 'Reason for session termination',
    session_status ENUM('ACTIVE', 'IDLE', 'EXPIRED', 'TERMINATED', 'LOCKED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Current session lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_sm_uid UNIQUE (session_uid),
    CONSTRAINT fk_sm_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sm_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_sm_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_sm_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Session lifecycle management with timeout, concurrent session detection, and device tracking';

-- =====================================================================================
-- 15.7 SYSTEM ERROR LOGS (Error & Exception Tracking)
-- =====================================================================================
-- IMMUTABLE: Error logs are append-only for debugging integrity.
-- =====================================================================================
CREATE TABLE system_error_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique error log identifier',
    error_uid VARCHAR(64) NOT NULL COMMENT 'Unique error UUID for external tracking',
    module_name VARCHAR(80) NOT NULL COMMENT 'Module where the error occurred',
    error_code VARCHAR(50) NULL COMMENT 'Application error code (e.g., ERR-AUTH-001)',
    error_type ENUM('VALIDATION', 'AUTHENTICATION', 'AUTHORIZATION', 'DATABASE', 'NETWORK', 'TIMEOUT', 'RESOURCE', 'INTEGRATION', 'BUSINESS_LOGIC', 'SYSTEM', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN' COMMENT 'Error classification type',
    error_message TEXT NOT NULL COMMENT 'Error message text',
    stack_trace TEXT NULL COMMENT 'Full stack trace for debugging',
    severity ENUM('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL', 'FATAL') NOT NULL DEFAULT 'ERROR' COMMENT 'Error severity level',
    user_id BIGINT UNSIGNED NULL COMMENT 'Reference to user who triggered the error (if applicable)',
    ip_address VARCHAR(45) NULL COMMENT 'Client IP address when error occurred',
    request_url VARCHAR(500) NULL COMMENT 'API endpoint or URL that produced the error',
    request_method VARCHAR(10) NULL COMMENT 'HTTP method used',
    request_payload_summary TEXT NULL COMMENT 'Sanitized summary of request payload',
    response_status_code INT UNSIGNED NULL COMMENT 'HTTP response status code returned',
    correlation_id VARCHAR(64) NULL COMMENT 'Request correlation ID for distributed tracing',
    parent_error_id BIGINT UNSIGNED NULL COMMENT 'Reference to parent error for chained exceptions',
    occurrence_count INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Number of times this exact error occurred (for dedup)',
    first_occurred_at DATETIME NOT NULL COMMENT 'First occurrence timestamp',
    last_occurred_at DATETIME NOT NULL COMMENT 'Most recent occurrence timestamp',
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if error has been investigated and resolved',
    resolved_by BIGINT UNSIGNED NULL COMMENT 'Reference to user who resolved the error',
    resolved_at DATETIME NULL COMMENT 'Resolution timestamp',
    resolution_notes TEXT NULL COMMENT 'Notes on how the error was resolved',
    error_time DATETIME NOT NULL COMMENT 'Primary error timestamp',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_sel_uid UNIQUE (error_uid),
    CONSTRAINT fk_sel_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sel_resolved FOREIGN KEY (resolved_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sel_parent FOREIGN KEY (parent_error_id) REFERENCES system_error_logs (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sel_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'System error and exception tracking with severity classification, deduplication, and resolution workflow';

-- =====================================================================================
-- 15.8 ACCESS CONTROL AUDIT LOGS (Resource Access Attempt Tracking)
-- =====================================================================================
-- IMMUTABLE: Access control logs are append-only for security forensics.
-- =====================================================================================
CREATE TABLE access_control_audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique access control log identifier',
    access_uid VARCHAR(64) NOT NULL COMMENT 'Unique access log UUID for correlation',
    user_id BIGINT UNSIGNED NULL COMMENT 'Reference to user who attempted access',
    resource_type ENUM('API_ENDPOINT', 'PAGE', 'MODULE', 'REPORT', 'DASHBOARD', 'WIDGET', 'FILE', 'CONFIGURATION', 'DATABASE_TABLE', 'ADMIN_FUNCTION', 'INTEGRATION') NOT NULL COMMENT 'Type of system resource accessed',
    resource_name VARCHAR(250) NOT NULL COMMENT 'Name or path of the resource accessed',
    resource_id BIGINT UNSIGNED NULL COMMENT 'ID of the specific resource record',
    required_permission VARCHAR(100) NULL COMMENT 'Permission required for access',
    user_role VARCHAR(80) NULL COMMENT 'User role at time of access attempt',
    user_permission_level INT UNSIGNED NULL COMMENT 'User permission level at time of attempt',
    access_status ENUM('ALLOWED', 'DENIED', 'ELEVATED', 'DEGRADED') NOT NULL COMMENT 'Access attempt outcome',
    denial_reason VARCHAR(250) NULL COMMENT 'Reason for access denial (if denied)',
    ip_address VARCHAR(45) NOT NULL COMMENT 'Client IP address',
    session_id VARCHAR(128) NULL COMMENT 'User session identifier',
    user_agent TEXT NULL COMMENT 'Client user agent string',
    access_time DATETIME NOT NULL COMMENT 'Timestamp of the access attempt',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_acal_uid UNIQUE (access_uid),
    CONSTRAINT fk_acal_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_acal_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Immutable access control audit trail tracking all resource access attempts with RBAC context';

-- =====================================================================================
-- 15.9 ADMIN ACTION LOGS (Administrative Accountability Trail)
-- =====================================================================================
-- IMMUTABLE: Admin action logs are append-only for governance.
-- =====================================================================================
CREATE TABLE admin_action_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique admin action log identifier',
    action_uid VARCHAR(64) NOT NULL COMMENT 'Unique action UUID for correlation',
    admin_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to admin user who performed the action',
    admin_role VARCHAR(80) NOT NULL COMMENT 'Admin role at time of action',
    action_type ENUM('USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_ACTIVATE', 'USER_DEACTIVATE', 'USER_LOCK', 'USER_UNLOCK', 'ROLE_ASSIGN', 'ROLE_REVOKE', 'ROLE_CREATE', 'ROLE_UPDATE', 'PERMISSION_GRANT', 'PERMISSION_REVOKE', 'CONFIG_UPDATE', 'FEATURE_TOGGLE', 'SESSION_TERMINATE', 'IP_BAN', 'IP_UNBAN', 'DATA_EXPORT', 'DATA_PURGE', 'SYSTEM_RESTART', 'BACKUP_INITIATE', 'REPORT_SCHEDULE', 'LOCKDOWN_ACTIVATE', 'LOCKDOWN_RELEASE', 'NOTIFICATION_BROADCAST', 'POLICY_UPDATE') NOT NULL COMMENT 'Specific administrative action performed',
    target_module ENUM('AUTHENTICATION', 'USER_MANAGEMENT', 'ORGANIZATION', 'VISITOR', 'APPOINTMENT', 'APPROVAL', 'CALENDAR', 'RECEPTION', 'PASS', 'CHECKIN', 'CHECKOUT', 'SECURITY', 'NOTIFICATION', 'REPORTING', 'SYSTEM_ADMIN', 'GLOBAL') NOT NULL COMMENT 'Target module affected by admin action',
    target_entity VARCHAR(120) NULL COMMENT 'Target entity/table name affected',
    target_entity_id BIGINT UNSIGNED NULL COMMENT 'Primary key of the affected entity',
    target_user_id BIGINT UNSIGNED NULL COMMENT 'Target user if the action affects a specific user',
    description TEXT NOT NULL COMMENT 'Detailed description of the admin action',
    old_values JSON NULL COMMENT 'State before admin action',
    new_values JSON NULL COMMENT 'State after admin action',
    justification TEXT NULL COMMENT 'Admin justification or reason for the action',
    approval_required BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if this action required approval',
    approved_by BIGINT UNSIGNED NULL COMMENT 'Reference to approver if approval was required',
    ip_address VARCHAR(45) NOT NULL COMMENT 'Admin IP address',
    session_id VARCHAR(128) NULL COMMENT 'Admin session identifier',
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'LOW' COMMENT 'Risk level of this admin action',
    action_time DATETIME NOT NULL COMMENT 'Timestamp of the admin action',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_aal_uid UNIQUE (action_uid),
    CONSTRAINT fk_aal_admin FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_aal_target_user FOREIGN KEY (target_user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_aal_approved FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_aal_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Immutable administrative action audit trail with justification, approval tracking, and risk assessment';

-- =====================================================================================
-- 15.10 SYSTEM ALERTS (System-Generated Alert Management)
-- =====================================================================================
CREATE TABLE system_alerts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique system alert identifier',
    alert_uid VARCHAR(64) NOT NULL COMMENT 'Unique alert UUID for correlation',
    alert_code VARCHAR(80) NOT NULL COMMENT 'Machine-readable alert code (e.g., ALT-CPU-HIGH)',
    alert_type ENUM('PERFORMANCE', 'SECURITY', 'CAPACITY', 'ERROR_SPIKE', 'THRESHOLD_BREACH', 'INTEGRATION_FAILURE', 'BACKUP_FAILURE', 'CERTIFICATE_EXPIRY', 'LICENSE_EXPIRY', 'COMPLIANCE_VIOLATION', 'CUSTOM') NOT NULL COMMENT 'Alert classification type',
    severity ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL', 'EMERGENCY') NOT NULL DEFAULT 'WARNING' COMMENT 'Alert severity level',
    title VARCHAR(200) NOT NULL COMMENT 'Short alert title',
    message TEXT NOT NULL COMMENT 'Detailed alert message',
    source_module ENUM('AUTHENTICATION', 'USER_MANAGEMENT', 'ORGANIZATION', 'VISITOR', 'APPOINTMENT', 'APPROVAL', 'CALENDAR', 'RECEPTION', 'PASS', 'CHECKIN', 'CHECKOUT', 'SECURITY', 'NOTIFICATION', 'REPORTING', 'SYSTEM_ADMIN', 'INFRASTRUCTURE') NOT NULL COMMENT 'Module that generated the alert',
    source_component VARCHAR(100) NULL COMMENT 'Specific component (e.g., database, API gateway, auth service)',
    metric_name VARCHAR(100) NULL COMMENT 'Metric that triggered the alert (if threshold-based)',
    metric_value DECIMAL(15,4) NULL COMMENT 'Current metric value at time of alert',
    threshold_value DECIMAL(15,4) NULL COMMENT 'Threshold value that was breached',
    kpi_metric_id BIGINT UNSIGNED NULL COMMENT 'Reference to KPI metric if alert was KPI-triggered',
    notification_event_id BIGINT UNSIGNED NULL COMMENT 'Reference to notification event triggered by this alert',
    notification_sent BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if notification was dispatched',
    auto_resolved BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if alert was auto-resolved when metric normalized',
    escalation_level INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Current escalation level (0=initial, 1=manager, 2=director, etc.)',
    assigned_to BIGINT UNSIGNED NULL COMMENT 'Reference to user assigned to handle this alert',
    acknowledged_by BIGINT UNSIGNED NULL COMMENT 'Reference to user who acknowledged the alert',
    acknowledged_at DATETIME NULL COMMENT 'Acknowledgment timestamp',
    triggered_at DATETIME NOT NULL COMMENT 'Alert trigger timestamp',
    resolved_at DATETIME NULL COMMENT 'Alert resolution timestamp',
    resolved_by BIGINT UNSIGNED NULL COMMENT 'Reference to user who resolved the alert',
    resolution_notes TEXT NULL COMMENT 'Notes on how the alert was resolved',
    suppressed_until DATETIME NULL COMMENT 'Suppress duplicate alerts until this timestamp',
    occurrence_count INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Number of times this alert fired',
    alert_status ENUM('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'SUPPRESSED', 'AUTO_RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN' COMMENT 'Alert lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_sa_uid UNIQUE (alert_uid),
    CONSTRAINT fk_sa_kpi FOREIGN KEY (kpi_metric_id) REFERENCES kpi_metrics (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sa_notif_event FOREIGN KEY (notification_event_id) REFERENCES notification_events (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sa_assigned FOREIGN KEY (assigned_to) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sa_ack FOREIGN KEY (acknowledged_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sa_resolved FOREIGN KEY (resolved_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sa_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_sa_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_sa_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'System-generated alerts with severity escalation, KPI integration, notification triggers, and resolution workflow';


-- =====================================================================================
-- MODULE 15: PERFORMANCE INDEXES
-- =====================================================================================

-- system_audit_logs indexes (optimized for high-volume inserts and time-range queries)
CREATE INDEX idx_sal_user ON system_audit_logs (user_id);
CREATE INDEX idx_sal_module ON system_audit_logs (module_name);
CREATE INDEX idx_sal_action ON system_audit_logs (action_type);
CREATE INDEX idx_sal_entity ON system_audit_logs (entity_name);
CREATE INDEX idx_sal_entity_id ON system_audit_logs (entity_id);
CREATE INDEX idx_sal_outcome ON system_audit_logs (outcome);
CREATE INDEX idx_sal_severity ON system_audit_logs (severity);
CREATE INDEX idx_sal_ip ON system_audit_logs (ip_address);
CREATE INDEX idx_sal_session ON system_audit_logs (session_id);
CREATE INDEX idx_sal_created ON system_audit_logs (created_at);
CREATE INDEX idx_sal_user_created ON system_audit_logs (user_id, created_at);
CREATE INDEX idx_sal_module_action ON system_audit_logs (module_name, action_type);
CREATE INDEX idx_sal_entity_full ON system_audit_logs (entity_name, entity_id);
CREATE INDEX idx_sal_ip_created ON system_audit_logs (ip_address, created_at);
CREATE INDEX idx_sal_severity_created ON system_audit_logs (severity, created_at);
CREATE INDEX idx_sal_module_created ON system_audit_logs (module_name, created_at);

-- system_configurations indexes
CREATE INDEX idx_sysconf_key ON system_configurations (config_key);
CREATE INDEX idx_sysconf_type ON system_configurations (config_type);
CREATE INDEX idx_sysconf_category ON system_configurations (config_category);
CREATE INDEX idx_sysconf_scope ON system_configurations (module_scope);
CREATE INDEX idx_sysconf_status ON system_configurations (status);
CREATE INDEX idx_sysconf_feature ON system_configurations (is_feature_flag);
CREATE INDEX idx_sysconf_editable ON system_configurations (is_editable);
CREATE INDEX idx_sysconf_created ON system_configurations (created_at);
CREATE INDEX idx_sysconf_cat_scope ON system_configurations (config_category, module_scope);

-- system_security_events indexes
CREATE INDEX idx_sse_type ON system_security_events (event_type);
CREATE INDEX idx_sse_severity ON system_security_events (severity);
CREATE INDEX idx_sse_user ON system_security_events (user_id);
CREATE INDEX idx_sse_ip ON system_security_events (ip_address);
CREATE INDEX idx_sse_action ON system_security_events (action_taken);
CREATE INDEX idx_sse_resolved ON system_security_events (is_resolved);
CREATE INDEX idx_sse_event_time ON system_security_events (event_time);
CREATE INDEX idx_sse_risk ON system_security_events (risk_score);
CREATE INDEX idx_sse_created ON system_security_events (created_at);
CREATE INDEX idx_sse_type_severity ON system_security_events (event_type, severity);
CREATE INDEX idx_sse_user_time ON system_security_events (user_id, event_time);
CREATE INDEX idx_sse_ip_time ON system_security_events (ip_address, event_time);
CREATE INDEX idx_sse_type_time ON system_security_events (event_type, event_time);
CREATE INDEX idx_sse_severity_resolved ON system_security_events (severity, is_resolved);

-- system_health_monitoring indexes
CREATE INDEX idx_shm_timestamp ON system_health_monitoring (metric_timestamp);
CREATE INDEX idx_shm_interval ON system_health_monitoring (collection_interval);
CREATE INDEX idx_shm_node ON system_health_monitoring (server_node);
CREATE INDEX idx_shm_health ON system_health_monitoring (health_status);
CREATE INDEX idx_shm_service ON system_health_monitoring (service_name);
CREATE INDEX idx_shm_created ON system_health_monitoring (created_at);
CREATE INDEX idx_shm_node_ts ON system_health_monitoring (server_node, metric_timestamp);
CREATE INDEX idx_shm_interval_ts ON system_health_monitoring (collection_interval, metric_timestamp);
CREATE INDEX idx_shm_health_ts ON system_health_monitoring (health_status, metric_timestamp);

-- user_activity_logs indexes
CREATE INDEX idx_ual_user ON user_activity_logs (user_id);
CREATE INDEX idx_ual_type ON user_activity_logs (activity_type);
CREATE INDEX idx_ual_category ON user_activity_logs (activity_category);
CREATE INDEX idx_ual_module ON user_activity_logs (module_name);
CREATE INDEX idx_ual_ip ON user_activity_logs (ip_address);
CREATE INDEX idx_ual_session ON user_activity_logs (session_id);
CREATE INDEX idx_ual_time ON user_activity_logs (activity_time);
CREATE INDEX idx_ual_created ON user_activity_logs (created_at);
CREATE INDEX idx_ual_user_time ON user_activity_logs (user_id, activity_time);
CREATE INDEX idx_ual_user_type ON user_activity_logs (user_id, activity_type);
CREATE INDEX idx_ual_type_time ON user_activity_logs (activity_type, activity_time);

-- session_management indexes
CREATE INDEX idx_sm_uid ON session_management (session_uid);
CREATE INDEX idx_sm_user ON session_management (user_id);
CREATE INDEX idx_sm_type ON session_management (session_type);
CREATE INDEX idx_sm_status ON session_management (session_status);
CREATE INDEX idx_sm_start ON session_management (start_time);
CREATE INDEX idx_sm_last ON session_management (last_activity_time);
CREATE INDEX idx_sm_end ON session_management (end_time);
CREATE INDEX idx_sm_ip ON session_management (ip_address);
CREATE INDEX idx_sm_created ON session_management (created_at);
CREATE INDEX idx_sm_user_status ON session_management (user_id, session_status);
CREATE INDEX idx_sm_status_last ON session_management (session_status, last_activity_time);
CREATE INDEX idx_sm_user_start ON session_management (user_id, start_time);

-- system_error_logs indexes
CREATE INDEX idx_sel_module ON system_error_logs (module_name);
CREATE INDEX idx_sel_type ON system_error_logs (error_type);
CREATE INDEX idx_sel_severity ON system_error_logs (severity);
CREATE INDEX idx_sel_code ON system_error_logs (error_code);
CREATE INDEX idx_sel_user ON system_error_logs (user_id);
CREATE INDEX idx_sel_resolved ON system_error_logs (is_resolved);
CREATE INDEX idx_sel_error_time ON system_error_logs (error_time);
CREATE INDEX idx_sel_correlation ON system_error_logs (correlation_id);
CREATE INDEX idx_sel_created ON system_error_logs (created_at);
CREATE INDEX idx_sel_module_severity ON system_error_logs (module_name, severity);
CREATE INDEX idx_sel_severity_time ON system_error_logs (severity, error_time);
CREATE INDEX idx_sel_module_time ON system_error_logs (module_name, error_time);

-- access_control_audit_logs indexes
CREATE INDEX idx_acal_user ON access_control_audit_logs (user_id);
CREATE INDEX idx_acal_resource ON access_control_audit_logs (resource_type);
CREATE INDEX idx_acal_status ON access_control_audit_logs (access_status);
CREATE INDEX idx_acal_ip ON access_control_audit_logs (ip_address);
CREATE INDEX idx_acal_time ON access_control_audit_logs (access_time);
CREATE INDEX idx_acal_created ON access_control_audit_logs (created_at);
CREATE INDEX idx_acal_user_time ON access_control_audit_logs (user_id, access_time);
CREATE INDEX idx_acal_status_time ON access_control_audit_logs (access_status, access_time);
CREATE INDEX idx_acal_resource_status ON access_control_audit_logs (resource_type, access_status);
CREATE INDEX idx_acal_ip_time ON access_control_audit_logs (ip_address, access_time);

-- admin_action_logs indexes
CREATE INDEX idx_aal_admin ON admin_action_logs (admin_id);
CREATE INDEX idx_aal_action ON admin_action_logs (action_type);
CREATE INDEX idx_aal_module ON admin_action_logs (target_module);
CREATE INDEX idx_aal_target_user ON admin_action_logs (target_user_id);
CREATE INDEX idx_aal_risk ON admin_action_logs (risk_level);
CREATE INDEX idx_aal_time ON admin_action_logs (action_time);
CREATE INDEX idx_aal_created ON admin_action_logs (created_at);
CREATE INDEX idx_aal_admin_time ON admin_action_logs (admin_id, action_time);
CREATE INDEX idx_aal_action_module ON admin_action_logs (action_type, target_module);
CREATE INDEX idx_aal_module_time ON admin_action_logs (target_module, action_time);
CREATE INDEX idx_aal_risk_time ON admin_action_logs (risk_level, action_time);

-- system_alerts indexes
CREATE INDEX idx_sa_type ON system_alerts (alert_type);
CREATE INDEX idx_sa_severity ON system_alerts (severity);
CREATE INDEX idx_sa_source ON system_alerts (source_module);
CREATE INDEX idx_sa_status ON system_alerts (alert_status);
CREATE INDEX idx_sa_triggered ON system_alerts (triggered_at);
CREATE INDEX idx_sa_resolved ON system_alerts (resolved_at);
CREATE INDEX idx_sa_assigned ON system_alerts (assigned_to);
CREATE INDEX idx_sa_kpi ON system_alerts (kpi_metric_id);
CREATE INDEX idx_sa_created ON system_alerts (created_at);
CREATE INDEX idx_sa_type_severity ON system_alerts (alert_type, severity);
CREATE INDEX idx_sa_status_severity ON system_alerts (alert_status, severity);
CREATE INDEX idx_sa_source_status ON system_alerts (source_module, alert_status);
CREATE INDEX idx_sa_status_triggered ON system_alerts (alert_status, triggered_at);

-- =====================================================================================
-- MODULE 16: DASHBOARD MANAGEMENT
-- =====================================================================================
-- NAMING: Uses `dm_` prefix and extended names to avoid conflicts with
-- existing `dashboard_widgets` table from Module 14 (widget configuration registry).
-- Module 14's `dashboard_widgets` = widget DEFINITIONS (catalog).
-- Module 16's `dm_widget_instances` = widget PLACEMENTS on specific dashboards.
-- =====================================================================================

-- =====================================================================================
-- 16.1 DASHBOARDS (Dashboard Definitions & Registry)
-- =====================================================================================
CREATE TABLE dashboards (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique dashboard identifier',
    dashboard_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Alias for enterprise alignment',
    dashboard_uid VARCHAR(64) NOT NULL COMMENT 'Unique dashboard UUID for external reference',
    dashboard_code VARCHAR(80) NOT NULL COMMENT 'Machine-readable dashboard code (e.g., DSH-ADMIN-OVERVIEW)',
    dashboard_name VARCHAR(200) NOT NULL COMMENT 'Human-readable dashboard display name',
    dashboard_description TEXT NULL COMMENT 'Detailed description of the dashboard purpose',
    dashboard_type ENUM('SYSTEM', 'ROLE_BASED', 'CUSTOM', 'TEMPLATE', 'EMBEDDED') NOT NULL DEFAULT 'SYSTEM' COMMENT 'Dashboard category: system-managed, role-assigned, or user-created',
    dashboard_category ENUM('EXECUTIVE', 'OPERATIONS', 'SECURITY', 'RECEPTION', 'VISITOR', 'ANALYTICS', 'COMPLIANCE', 'IT_ADMIN', 'CUSTOM') NOT NULL DEFAULT 'OPERATIONS' COMMENT 'Functional category for grouping',
    role_id BIGINT UNSIGNED NULL COMMENT 'FK to roles table — binds this dashboard to a specific role',
    user_id BIGINT UNSIGNED NULL COMMENT 'FK to users — owner for CUSTOM dashboards (NULL for system dashboards)',
    organization_id BIGINT UNSIGNED NULL COMMENT 'FK to organizations — scopes dashboard to a specific organization',
    layout_config JSON NULL COMMENT 'JSON grid layout configuration {columns, rows, breakpoints, gaps}',
    theme ENUM('LIGHT', 'DARK', 'SYSTEM', 'HIGH_CONTRAST', 'CUSTOM') NOT NULL DEFAULT 'SYSTEM' COMMENT 'Dashboard color theme',
    theme_config JSON NULL COMMENT 'Custom theme configuration (colors, fonts, background)',
    icon VARCHAR(50) NULL COMMENT 'Dashboard icon identifier (e.g., material-icon name)',
    default_time_range ENUM('TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'THIS_MONTH', 'LAST_MONTH', 'THIS_QUARTER', 'THIS_YEAR', 'CUSTOM') NOT NULL DEFAULT 'TODAY' COMMENT 'Default time range filter',
    auto_refresh_seconds INT UNSIGNED NOT NULL DEFAULT 300 COMMENT 'Dashboard-level auto-refresh interval in seconds (0 = disabled)',
    min_role_level INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Minimum role level required to access this dashboard',
    allowed_roles_json JSON NULL COMMENT 'JSON array of role IDs allowed access (NULL = use min_role_level only)',
    is_default BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if this is the default dashboard for the assigned role',
    is_public BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if dashboard is publicly accessible (e.g., lobby display)',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if dashboard is pinned to navigation',
    display_order INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Display order in dashboard navigation menu',
    max_widgets INT UNSIGNED NOT NULL DEFAULT 20 COMMENT 'Maximum number of widgets allowed on this dashboard',
    version INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Dashboard version for change tracking',
    cloned_from_id BIGINT UNSIGNED NULL COMMENT 'Reference to source dashboard if cloned',
    status ENUM('ACTIVE', 'DRAFT', 'ARCHIVED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Dashboard lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_dsh_uid UNIQUE (dashboard_uid),
    CONSTRAINT uq_dsh_code UNIQUE (dashboard_code),
    CONSTRAINT fk_dsh_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_dsh_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_dsh_cloned FOREIGN KEY (cloned_from_id) REFERENCES dashboards (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_dsh_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_dsh_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_dsh_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Dashboard registry with role-based access, user customization, layout configs, and versioning';

-- =====================================================================================
-- 16.2 DM WIDGET INSTANCES (Widget Placements on Dashboards)
-- =====================================================================================
-- Relationship: Module 14 `dashboard_widgets` = widget CATALOG (definitions).
-- This table = widget INSTANCES placed on specific dashboards.
-- =====================================================================================
CREATE TABLE dm_widget_instances (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique widget instance identifier',
    instance_uid VARCHAR(64) NOT NULL COMMENT 'Unique widget instance UUID',
    dashboard_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to dashboards — which dashboard this widget is placed on',
    widget_definition_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to dashboard_widgets (Module 14) — the widget type/catalog entry',
    instance_name VARCHAR(200) NULL COMMENT 'User-customized widget title (overrides default widget name)',
    widget_type ENUM('KPI', 'CHART_LINE', 'CHART_BAR', 'CHART_PIE', 'CHART_DOUGHNUT', 'CHART_AREA', 'TABLE', 'ALERT_FEED', 'LIVE_STATUS', 'GAUGE', 'HEATMAP', 'COUNTER', 'MAP', 'TIMELINE', 'CUSTOM') NOT NULL COMMENT 'Widget visualization type (denormalized for fast queries)',
    data_source_module ENUM('VISITOR', 'APPOINTMENT', 'APPROVAL', 'CALENDAR', 'RECEPTION', 'PASS', 'CHECKIN', 'CHECKOUT', 'SECURITY', 'NOTIFICATION', 'REPORTING', 'SYSTEM_ADMIN', 'MULTI_MODULE') NOT NULL COMMENT 'Source module providing data',
    data_query_reference VARCHAR(250) NULL COMMENT 'Named query, API endpoint, or stored procedure reference',
    data_config_json JSON NULL COMMENT 'Instance-specific data config (overrides definition defaults)',
    data_filters_json JSON NULL COMMENT 'Applied filters (date range, facility, category, etc.)',
    position_row INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Grid row position (0-based)',
    position_col INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Grid column position (0-based)',
    width INT UNSIGNED NOT NULL DEFAULT 4 COMMENT 'Widget width in grid units',
    height INT UNSIGNED NOT NULL DEFAULT 3 COMMENT 'Widget height in grid units',
    display_order INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Stacking order for overlapping widgets',
    refresh_interval_seconds INT UNSIGNED NOT NULL DEFAULT 300 COMMENT 'Instance-specific refresh interval (0 = use dashboard default)',
    is_visible BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Flags if widget is currently visible',
    is_expanded BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if widget is in expanded/full-screen mode',
    is_locked BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if widget position is locked from drag-and-drop',
    custom_styles_json JSON NULL COMMENT 'Instance-specific CSS overrides (colors, borders, padding)',
    drill_down_report_id BIGINT UNSIGNED NULL COMMENT 'FK to report_definitions — click-through drill-down report',
    status ENUM('ACTIVE', 'HIDDEN', 'ERROR', 'LOADING') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Widget instance runtime status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_dwi_uid UNIQUE (instance_uid),
    CONSTRAINT fk_dwi_dashboard FOREIGN KEY (dashboard_id) REFERENCES dashboards (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_dwi_widget_def FOREIGN KEY (widget_definition_id) REFERENCES dashboard_widgets (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_dwi_drill_report FOREIGN KEY (drill_down_report_id) REFERENCES report_definitions (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_dwi_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_dwi_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_dwi_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Widget instances placed on dashboards — references Module 14 widget definitions catalog';

-- =====================================================================================
-- 16.3 DASHBOARD METRICS (Computed KPI Values for Dashboard Display)
-- =====================================================================================
CREATE TABLE dashboard_metrics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique dashboard metric identifier',
    metric_uid VARCHAR(64) NOT NULL COMMENT 'Unique metric UUID for external correlation',
    dashboard_id BIGINT UNSIGNED NULL COMMENT 'FK to dashboards — which dashboard this metric feeds',
    widget_instance_id BIGINT UNSIGNED NULL COMMENT 'FK to dm_widget_instances — specific widget displaying this metric',
    kpi_metric_id BIGINT UNSIGNED NULL COMMENT 'FK to kpi_metrics (Module 14) — source KPI definition',
    metric_code VARCHAR(80) NOT NULL COMMENT 'Machine-readable metric code (e.g., MTR-VISITOR-TODAY)',
    metric_name VARCHAR(200) NOT NULL COMMENT 'Human-readable metric display name',
    metric_value DECIMAL(15,4) NOT NULL COMMENT 'Current computed metric value',
    metric_unit VARCHAR(30) NULL COMMENT 'Unit of measurement (count, %, seconds, score, etc.)',
    metric_type ENUM('COUNT', 'SUM', 'AVERAGE', 'PERCENTAGE', 'RATE', 'RATIO', 'DURATION', 'SCORE', 'TREND', 'CUSTOM') NOT NULL DEFAULT 'COUNT' COMMENT 'Metric calculation type',
    calculation_method ENUM('REAL_TIME', 'AGGREGATED', 'SNAPSHOT', 'ROLLING_WINDOW', 'YEAR_OVER_YEAR', 'CUMULATIVE') NOT NULL DEFAULT 'AGGREGATED' COMMENT 'How the metric is computed',
    data_source_table VARCHAR(120) NULL COMMENT 'Source analytics table for this metric',
    previous_value DECIMAL(15,4) NULL COMMENT 'Previous period metric value for trend calculation',
    trend_direction ENUM('UP', 'DOWN', 'STABLE', 'NEW') NULL COMMENT 'Value trend compared to previous period',
    trend_percentage DECIMAL(8,2) NULL COMMENT 'Trend percentage change from previous period',
    threshold_min DECIMAL(15,4) NULL COMMENT 'Minimum acceptable value (below = WARNING)',
    threshold_max DECIMAL(15,4) NULL COMMENT 'Maximum acceptable value (above = WARNING)',
    threshold_critical_min DECIMAL(15,4) NULL COMMENT 'Critical minimum (below = CRITICAL alert)',
    threshold_critical_max DECIMAL(15,4) NULL COMMENT 'Critical maximum (above = CRITICAL alert)',
    threshold_status ENUM('NORMAL', 'WARNING', 'CRITICAL', 'UNKNOWN') NOT NULL DEFAULT 'NORMAL' COMMENT 'Current threshold evaluation status',
    display_format VARCHAR(50) NULL COMMENT 'Display format string (e.g., {value}%, #{value}, {value}s)',
    display_color VARCHAR(20) NULL COMMENT 'Color code for metric display (#hex or named)',
    display_icon VARCHAR(50) NULL COMMENT 'Icon identifier for the metric card',
    sparkline_data JSON NULL COMMENT 'JSON array of last N values for mini sparkline chart',
    time_range_start DATETIME NULL COMMENT 'Start of the time range for this metric calculation',
    time_range_end DATETIME NULL COMMENT 'End of the time range for this metric calculation',
    calculated_at DATETIME NOT NULL COMMENT 'Timestamp when this metric was last computed',
    cache_ttl_seconds INT UNSIGNED NOT NULL DEFAULT 60 COMMENT 'Cache time-to-live for this metric',
    status ENUM('ACTIVE', 'STALE', 'ERROR', 'RECALCULATING') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Metric computation status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_dmt_uid UNIQUE (metric_uid),
    CONSTRAINT uq_dmt_code UNIQUE (metric_code),
    CONSTRAINT fk_dmt_dashboard FOREIGN KEY (dashboard_id) REFERENCES dashboards (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_dmt_widget FOREIGN KEY (widget_instance_id) REFERENCES dm_widget_instances (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_dmt_kpi FOREIGN KEY (kpi_metric_id) REFERENCES kpi_metrics (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_dmt_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_dmt_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_dmt_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Computed dashboard KPI metrics with trend analysis, thresholds, sparklines, and caching';

-- =====================================================================================
-- 16.4 USER DASHBOARD PREFERENCES (User Personalization Layer)
-- =====================================================================================
CREATE TABLE user_dashboard_preferences (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique preference record identifier',
    preference_uid VARCHAR(64) NOT NULL COMMENT 'Unique preference UUID',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to users — preference owner',
    dashboard_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to dashboards — which dashboard these preferences apply to',
    layout_config JSON NULL COMMENT 'User-customized layout override (grid positions, sizes)',
    widget_visibility_json JSON NULL COMMENT 'JSON map of widget_instance_id → visible (true/false)',
    widget_order_json JSON NULL COMMENT 'JSON array of widget_instance_ids in user preferred order',
    filter_preferences JSON NULL COMMENT 'User default filters (date range, facility, department, etc.)',
    theme ENUM('LIGHT', 'DARK', 'SYSTEM', 'HIGH_CONTRAST', 'CUSTOM') NULL COMMENT 'User theme override (NULL = use dashboard default)',
    theme_config_json JSON NULL COMMENT 'User custom theme config override',
    collapsed_sections_json JSON NULL COMMENT 'JSON array of section names collapsed by user',
    pinned_widget_ids_json JSON NULL COMMENT 'JSON array of widget instance IDs pinned by user',
    default_time_range ENUM('TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'THIS_MONTH', 'LAST_MONTH', 'THIS_QUARTER', 'THIS_YEAR', 'CUSTOM') NULL COMMENT 'User time range override (NULL = use dashboard default)',
    auto_refresh_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'User toggle for auto-refresh',
    notification_overlay_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Show notification overlay on dashboard',
    compact_mode BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Compact layout mode for smaller screens',
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'User marked this dashboard as favorite',
    last_viewed_at DATETIME NULL COMMENT 'Last time user viewed this dashboard',
    view_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of times user has viewed this dashboard',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_udp_uid UNIQUE (preference_uid),
    CONSTRAINT uq_udp_user_dash UNIQUE (user_id, dashboard_id),
    CONSTRAINT fk_udp_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_udp_dashboard FOREIGN KEY (dashboard_id) REFERENCES dashboards (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_udp_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_udp_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_udp_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'User-specific dashboard personalization with layout, visibility, filters, theme, and favorites';

-- =====================================================================================
-- 16.5 DASHBOARD EVENTS (User Interaction Tracking)
-- =====================================================================================
-- IMMUTABLE: Interaction events are append-only for behavioral analytics.
-- =====================================================================================
CREATE TABLE dashboard_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique event identifier',
    event_uid VARCHAR(64) NOT NULL COMMENT 'Unique event UUID',
    event_type ENUM('VIEW', 'CLICK', 'FILTER', 'EXPORT', 'REFRESH', 'RESIZE', 'REORDER', 'DRILL_DOWN', 'TOGGLE_WIDGET', 'CUSTOMIZE', 'SHARE', 'PRINT', 'FULL_SCREEN', 'FAVORITE', 'UNFAVORITE') NOT NULL COMMENT 'Type of user interaction',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to users — who performed the interaction',
    dashboard_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to dashboards — which dashboard was interacted with',
    widget_instance_id BIGINT UNSIGNED NULL COMMENT 'FK to dm_widget_instances — specific widget interacted with (if applicable)',
    event_target VARCHAR(200) NULL COMMENT 'Specific UI element or data point interacted with',
    event_metadata JSON NULL COMMENT 'Additional event context (filter values, export format, drill-down params)',
    session_id VARCHAR(128) NULL COMMENT 'User session identifier for correlation',
    ip_address VARCHAR(45) NOT NULL COMMENT 'Client IP address',
    user_agent TEXT NULL COMMENT 'Client user agent string',
    device_type VARCHAR(50) NULL COMMENT 'Device type (desktop, mobile, tablet)',
    page_load_time_ms INT UNSIGNED NULL COMMENT 'Dashboard page load time in milliseconds',
    response_time_ms INT UNSIGNED NULL COMMENT 'Server response time for the interaction',
    event_time DATETIME NOT NULL COMMENT 'Exact timestamp of the interaction',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_de_uid UNIQUE (event_uid),
    CONSTRAINT fk_de_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_de_dashboard FOREIGN KEY (dashboard_id) REFERENCES dashboards (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_de_widget FOREIGN KEY (widget_instance_id) REFERENCES dm_widget_instances (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_de_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Immutable dashboard interaction tracking for behavioral analytics and UX optimization';

-- =====================================================================================
-- 16.6 DASHBOARD ALERTS (Alert Display Feed for Dashboards)
-- =====================================================================================
CREATE TABLE dashboard_alerts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique dashboard alert identifier',
    alert_uid VARCHAR(64) NOT NULL COMMENT 'Unique alert display UUID',
    dashboard_id BIGINT UNSIGNED NULL COMMENT 'FK to dashboards — which dashboard displays this alert (NULL = all)',
    system_alert_id BIGINT UNSIGNED NULL COMMENT 'FK to system_alerts (Module 15) — source system alert',
    notification_event_id BIGINT UNSIGNED NULL COMMENT 'FK to notification_events (Module 13) — linked notification',
    alert_type ENUM('SECURITY', 'PERFORMANCE', 'VISITOR', 'COMPLIANCE', 'SYSTEM', 'THRESHOLD', 'WORKFLOW', 'INTEGRATION', 'CUSTOM') NOT NULL COMMENT 'Alert classification for dashboard display',
    severity ENUM('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'LOW' COMMENT 'Alert severity for visual priority',
    title VARCHAR(200) NOT NULL COMMENT 'Short alert title for dashboard card',
    message TEXT NOT NULL COMMENT 'Detailed alert message',
    source_module ENUM('AUTHENTICATION', 'USER_MANAGEMENT', 'ORGANIZATION', 'VISITOR', 'APPOINTMENT', 'APPROVAL', 'CALENDAR', 'RECEPTION', 'PASS', 'CHECKIN', 'CHECKOUT', 'SECURITY', 'NOTIFICATION', 'REPORTING', 'SYSTEM_ADMIN', 'INFRASTRUCTURE') NOT NULL COMMENT 'Module that generated the alert',
    source_entity VARCHAR(120) NULL COMMENT 'Specific entity or record related to the alert',
    source_entity_id BIGINT UNSIGNED NULL COMMENT 'ID of the related entity record',
    action_url VARCHAR(500) NULL COMMENT 'Deep link URL to resolve or view the alert source',
    action_label VARCHAR(100) NULL COMMENT 'Label for the action button (e.g., "View Incident", "Resolve")',
    display_icon VARCHAR(50) NULL COMMENT 'Icon identifier for the alert card',
    display_color VARCHAR(20) NULL COMMENT 'Color code for alert badge (#hex)',
    target_roles_json JSON NULL COMMENT 'JSON array of role IDs who should see this alert (NULL = all)',
    target_user_ids_json JSON NULL COMMENT 'JSON array of specific user IDs to show this alert to',
    is_read BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if alert has been read by the user',
    read_by BIGINT UNSIGNED NULL COMMENT 'FK to users — who read/acknowledged this alert',
    read_at DATETIME NULL COMMENT 'Timestamp when alert was read',
    is_dismissed BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if alert has been dismissed from dashboard',
    dismissed_by BIGINT UNSIGNED NULL COMMENT 'FK to users — who dismissed this alert',
    dismissed_at DATETIME NULL COMMENT 'Timestamp when alert was dismissed',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if alert is pinned to top of dashboard feed',
    auto_dismiss_after_minutes INT UNSIGNED NULL COMMENT 'Auto-dismiss after N minutes (NULL = manual dismiss only)',
    triggered_at DATETIME NOT NULL COMMENT 'Alert trigger timestamp',
    expires_at DATETIME NULL COMMENT 'Alert expiration timestamp (NULL = no expiry)',
    resolved_at DATETIME NULL COMMENT 'Alert resolution timestamp',
    alert_status ENUM('ACTIVE', 'READ', 'DISMISSED', 'RESOLVED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Alert lifecycle on dashboard',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_da_uid UNIQUE (alert_uid),
    CONSTRAINT fk_da_dashboard FOREIGN KEY (dashboard_id) REFERENCES dashboards (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_da_system_alert FOREIGN KEY (system_alert_id) REFERENCES system_alerts (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_da_notif_event FOREIGN KEY (notification_event_id) REFERENCES notification_events (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_da_read FOREIGN KEY (read_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_da_dismissed FOREIGN KEY (dismissed_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_da_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_da_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_da_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Dashboard alert feed with role targeting, read tracking, dismiss behavior, and Module 13/15 integration';

-- =====================================================================================
-- 16.7 REAL TIME DASHBOARD CACHE (Performance Optimization Layer)
-- =====================================================================================
CREATE TABLE real_time_dashboard_cache (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique cache entry identifier',
    cache_uid VARCHAR(64) NOT NULL COMMENT 'Unique cache entry UUID',
    cache_key VARCHAR(250) NOT NULL COMMENT 'Unique cache key (composite of dashboard + widget + filters + role)',
    cache_scope ENUM('GLOBAL', 'DASHBOARD', 'WIDGET', 'METRIC', 'USER') NOT NULL DEFAULT 'WIDGET' COMMENT 'Scope of cached data',
    dashboard_id BIGINT UNSIGNED NULL COMMENT 'FK to dashboards — associated dashboard',
    widget_instance_id BIGINT UNSIGNED NULL COMMENT 'FK to dm_widget_instances — associated widget',
    user_id BIGINT UNSIGNED NULL COMMENT 'FK to users — for USER-scoped cache entries',
    cache_data JSON NOT NULL COMMENT 'Cached JSON payload (chart data, metric values, table rows)',
    data_hash VARCHAR(64) NULL COMMENT 'SHA-256 hash of cache_data for change detection',
    data_row_count INT UNSIGNED NULL COMMENT 'Number of data rows in cached payload',
    compression_type ENUM('NONE', 'GZIP', 'LZ4') NOT NULL DEFAULT 'NONE' COMMENT 'Compression method applied to cache_data',
    generated_at DATETIME NOT NULL COMMENT 'Timestamp when cache was generated',
    expiry_time DATETIME NOT NULL COMMENT 'Cache expiration timestamp',
    ttl_seconds INT UNSIGNED NOT NULL DEFAULT 60 COMMENT 'Time-to-live in seconds from generation',
    is_stale BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if cache is stale (past expiry but not yet refreshed)',
    refresh_in_progress BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if cache refresh is currently running',
    refresh_started_at DATETIME NULL COMMENT 'Timestamp when cache refresh started',
    last_hit_at DATETIME NULL COMMENT 'Timestamp of last cache hit',
    hit_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of cache hits since generation',
    miss_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of cache misses before this generation',
    generation_time_ms INT UNSIGNED NULL COMMENT 'Time taken to generate this cache entry in milliseconds',
    data_source_query VARCHAR(500) NULL COMMENT 'Reference to the query that generated this cache',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft deletion timestamp',
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_rtdc_uid UNIQUE (cache_uid),
    CONSTRAINT uq_rtdc_key UNIQUE (cache_key),
    CONSTRAINT fk_rtdc_dashboard FOREIGN KEY (dashboard_id) REFERENCES dashboards (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rtdc_widget FOREIGN KEY (widget_instance_id) REFERENCES dm_widget_instances (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rtdc_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rtdc_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_rtdc_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_rtdc_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Real-time dashboard cache with TTL, hit tracking, change detection, and stale-while-revalidate support';

-- =====================================================================================
-- 16.8 DASHBOARD ACTIVITY LOGS (Dashboard Usage Audit Trail)
-- =====================================================================================
-- IMMUTABLE: Activity logs are append-only for usage analytics and compliance.
-- =====================================================================================
CREATE TABLE dashboard_activity_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique activity log identifier',
    activity_uid VARCHAR(64) NOT NULL COMMENT 'Unique activity UUID',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to users — who performed the activity',
    dashboard_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to dashboards — which dashboard was accessed',
    widget_instance_id BIGINT UNSIGNED NULL COMMENT 'FK to dm_widget_instances — specific widget involved (if applicable)',
    action_type ENUM('VIEW', 'CREATE', 'UPDATE', 'DELETE', 'CLONE', 'SHARE', 'EXPORT', 'PRINT', 'FILTER', 'DRILL_DOWN', 'CUSTOMIZE', 'RESET', 'FAVORITE', 'UNFAVORITE', 'PIN', 'UNPIN') NOT NULL COMMENT 'Type of dashboard action',
    action_detail TEXT NULL COMMENT 'Detailed description of the action performed',
    action_metadata JSON NULL COMMENT 'Additional action context (filter values, export format, etc.)',
    session_id VARCHAR(128) NULL COMMENT 'User session identifier for correlation',
    ip_address VARCHAR(45) NOT NULL COMMENT 'Client IP address',
    user_agent TEXT NULL COMMENT 'Client user agent string',
    device_type VARCHAR(50) NULL COMMENT 'Device type (desktop, mobile, tablet)',
    duration_on_dashboard_ms INT UNSIGNED NULL COMMENT 'How long user spent on this dashboard (ms)',
    widgets_loaded_count INT UNSIGNED NULL COMMENT 'Number of widgets successfully loaded',
    widgets_error_count INT UNSIGNED NULL COMMENT 'Number of widgets that failed to load',
    page_load_time_ms INT UNSIGNED NULL COMMENT 'Total dashboard page load time (ms)',
    action_time DATETIME NOT NULL COMMENT 'Timestamp of the activity',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_dal_uid UNIQUE (activity_uid),
    CONSTRAINT fk_dal_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_dal_dashboard FOREIGN KEY (dashboard_id) REFERENCES dashboards (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_dal_widget FOREIGN KEY (widget_instance_id) REFERENCES dm_widget_instances (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_dal_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Immutable dashboard usage audit trail with performance metrics and widget load tracking';


-- =====================================================================================
-- MODULE 16: PERFORMANCE INDEXES
-- =====================================================================================

-- dashboards indexes
CREATE INDEX idx_dsh_uid ON dashboards (dashboard_uid);
CREATE INDEX idx_dsh_type ON dashboards (dashboard_type);
CREATE INDEX idx_dsh_category ON dashboards (dashboard_category);
CREATE INDEX idx_dsh_role ON dashboards (role_id);
CREATE INDEX idx_dsh_user ON dashboards (user_id);
CREATE INDEX idx_dsh_status ON dashboards (status);
CREATE INDEX idx_dsh_default ON dashboards (is_default);
CREATE INDEX idx_dsh_public ON dashboards (is_public);
CREATE INDEX idx_dsh_created ON dashboards (created_at);
CREATE INDEX idx_dsh_role_type ON dashboards (role_id, dashboard_type);
CREATE INDEX idx_dsh_type_status ON dashboards (dashboard_type, status);
CREATE INDEX idx_dsh_role_default ON dashboards (role_id, is_default);
CREATE INDEX idx_dsh_user_type ON dashboards (user_id, dashboard_type);

-- dm_widget_instances indexes
CREATE INDEX idx_dwi_dashboard ON dm_widget_instances (dashboard_id);
CREATE INDEX idx_dwi_widget_def ON dm_widget_instances (widget_definition_id);
CREATE INDEX idx_dwi_type ON dm_widget_instances (widget_type);
CREATE INDEX idx_dwi_source ON dm_widget_instances (data_source_module);
CREATE INDEX idx_dwi_status ON dm_widget_instances (status);
CREATE INDEX idx_dwi_visible ON dm_widget_instances (is_visible);
CREATE INDEX idx_dwi_drill ON dm_widget_instances (drill_down_report_id);
CREATE INDEX idx_dwi_created ON dm_widget_instances (created_at);
CREATE INDEX idx_dwi_dash_type ON dm_widget_instances (dashboard_id, widget_type);
CREATE INDEX idx_dwi_dash_order ON dm_widget_instances (dashboard_id, display_order);
CREATE INDEX idx_dwi_type_refresh ON dm_widget_instances (widget_type, refresh_interval_seconds);

-- dashboard_metrics indexes
CREATE INDEX idx_dmt_dashboard ON dashboard_metrics (dashboard_id);
CREATE INDEX idx_dmt_widget ON dashboard_metrics (widget_instance_id);
CREATE INDEX idx_dmt_kpi ON dashboard_metrics (kpi_metric_id);
CREATE INDEX idx_dmt_code ON dashboard_metrics (metric_code);
CREATE INDEX idx_dmt_type ON dashboard_metrics (metric_type);
CREATE INDEX idx_dmt_method ON dashboard_metrics (calculation_method);
CREATE INDEX idx_dmt_threshold ON dashboard_metrics (threshold_status);
CREATE INDEX idx_dmt_status ON dashboard_metrics (status);
CREATE INDEX idx_dmt_calculated ON dashboard_metrics (calculated_at);
CREATE INDEX idx_dmt_created ON dashboard_metrics (created_at);
CREATE INDEX idx_dmt_dash_status ON dashboard_metrics (dashboard_id, status);
CREATE INDEX idx_dmt_type_status ON dashboard_metrics (metric_type, threshold_status);

-- user_dashboard_preferences indexes
CREATE INDEX idx_udp_user ON user_dashboard_preferences (user_id);
CREATE INDEX idx_udp_dashboard ON user_dashboard_preferences (dashboard_id);
CREATE INDEX idx_udp_favorite ON user_dashboard_preferences (is_favorite);
CREATE INDEX idx_udp_last_viewed ON user_dashboard_preferences (last_viewed_at);
CREATE INDEX idx_udp_created ON user_dashboard_preferences (created_at);
CREATE INDEX idx_udp_user_fav ON user_dashboard_preferences (user_id, is_favorite);
CREATE INDEX idx_udp_user_viewed ON user_dashboard_preferences (user_id, last_viewed_at);

-- dashboard_events indexes
CREATE INDEX idx_de_type ON dashboard_events (event_type);
CREATE INDEX idx_de_user ON dashboard_events (user_id);
CREATE INDEX idx_de_dashboard ON dashboard_events (dashboard_id);
CREATE INDEX idx_de_widget ON dashboard_events (widget_instance_id);
CREATE INDEX idx_de_session ON dashboard_events (session_id);
CREATE INDEX idx_de_ip ON dashboard_events (ip_address);
CREATE INDEX idx_de_time ON dashboard_events (event_time);
CREATE INDEX idx_de_created ON dashboard_events (created_at);
CREATE INDEX idx_de_user_time ON dashboard_events (user_id, event_time);
CREATE INDEX idx_de_dash_time ON dashboard_events (dashboard_id, event_time);
CREATE INDEX idx_de_type_time ON dashboard_events (event_type, event_time);
CREATE INDEX idx_de_user_dash ON dashboard_events (user_id, dashboard_id);

-- dashboard_alerts indexes
CREATE INDEX idx_da_dashboard ON dashboard_alerts (dashboard_id);
CREATE INDEX idx_da_system_alert ON dashboard_alerts (system_alert_id);
CREATE INDEX idx_da_type ON dashboard_alerts (alert_type);
CREATE INDEX idx_da_severity ON dashboard_alerts (severity);
CREATE INDEX idx_da_source ON dashboard_alerts (source_module);
CREATE INDEX idx_da_status ON dashboard_alerts (alert_status);
CREATE INDEX idx_da_read ON dashboard_alerts (is_read);
CREATE INDEX idx_da_triggered ON dashboard_alerts (triggered_at);
CREATE INDEX idx_da_expires ON dashboard_alerts (expires_at);
CREATE INDEX idx_da_created ON dashboard_alerts (created_at);
CREATE INDEX idx_da_type_severity ON dashboard_alerts (alert_type, severity);
CREATE INDEX idx_da_status_severity ON dashboard_alerts (alert_status, severity);
CREATE INDEX idx_da_source_status ON dashboard_alerts (source_module, alert_status);
CREATE INDEX idx_da_dash_status ON dashboard_alerts (dashboard_id, alert_status);

-- real_time_dashboard_cache indexes
CREATE INDEX idx_rtdc_key ON real_time_dashboard_cache (cache_key);
CREATE INDEX idx_rtdc_scope ON real_time_dashboard_cache (cache_scope);
CREATE INDEX idx_rtdc_dashboard ON real_time_dashboard_cache (dashboard_id);
CREATE INDEX idx_rtdc_widget ON real_time_dashboard_cache (widget_instance_id);
CREATE INDEX idx_rtdc_user ON real_time_dashboard_cache (user_id);
CREATE INDEX idx_rtdc_expiry ON real_time_dashboard_cache (expiry_time);
CREATE INDEX idx_rtdc_stale ON real_time_dashboard_cache (is_stale);
CREATE INDEX idx_rtdc_generated ON real_time_dashboard_cache (generated_at);
CREATE INDEX idx_rtdc_created ON real_time_dashboard_cache (created_at);
CREATE INDEX idx_rtdc_scope_expiry ON real_time_dashboard_cache (cache_scope, expiry_time);
CREATE INDEX idx_rtdc_dash_expiry ON real_time_dashboard_cache (dashboard_id, expiry_time);
CREATE INDEX idx_rtdc_stale_refresh ON real_time_dashboard_cache (is_stale, refresh_in_progress);

-- dashboard_activity_logs indexes
CREATE INDEX idx_dal_user ON dashboard_activity_logs (user_id);
CREATE INDEX idx_dal_dashboard ON dashboard_activity_logs (dashboard_id);
CREATE INDEX idx_dal_widget ON dashboard_activity_logs (widget_instance_id);
CREATE INDEX idx_dal_action ON dashboard_activity_logs (action_type);
CREATE INDEX idx_dal_session ON dashboard_activity_logs (session_id);
CREATE INDEX idx_dal_ip ON dashboard_activity_logs (ip_address);
CREATE INDEX idx_dal_time ON dashboard_activity_logs (action_time);
CREATE INDEX idx_dal_created ON dashboard_activity_logs (created_at);
CREATE INDEX idx_dal_user_time ON dashboard_activity_logs (user_id, action_time);
CREATE INDEX idx_dal_dash_time ON dashboard_activity_logs (dashboard_id, action_time);
CREATE INDEX idx_dal_user_dash ON dashboard_activity_logs (user_id, dashboard_id);
CREATE INDEX idx_dal_action_time ON dashboard_activity_logs (action_type, action_time);

-- =====================================================================================
-- MODULE 17: AUDIT LOG MANAGEMENT
-- =====================================================================================
-- NAMING: Uses `alm_` prefix on ALL tables to avoid conflicts with:
--   audit_logs (Mod 1, line 2043), access_logs (Mod 12, line 6154),
--   system_audit_logs (Mod 15, line 7755), user_activity_logs (Mod 15, line 7931),
--   session_management (Mod 15, line 7964), system_error_logs (Mod 15, line 8010),
--   access_control_audit_logs (Mod 15, line 8051), admin_action_logs (Mod 15, line 8081)
-- ALL 10 TABLES ARE IMMUTABLE (append-only). No updated_at/deleted_at/deleted_by columns.
-- =====================================================================================

-- =====================================================================================
-- 17.1 ALM AUDIT LOGS (Master Immutable System-Wide Audit Trail)
-- =====================================================================================
CREATE TABLE alm_audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique audit record identifier',
    audit_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external correlation and deduplication',
    user_id BIGINT UNSIGNED NULL COMMENT 'FK to users — actor (NULL for system-generated events)',
    module_name ENUM('AUTHENTICATION','USER_MANAGEMENT','ORGANIZATION','VISITOR','APPOINTMENT','APPROVAL','CALENDAR','RECEPTION','PASS','CHECKIN','CHECKOUT','SECURITY','NOTIFICATION','REPORTING','DASHBOARD','SYSTEM_ADMIN','AUDIT','SYSTEM') NOT NULL COMMENT 'Source module',
    action_type ENUM('CREATE','READ','UPDATE','DELETE','LOGIN','LOGOUT','APPROVE','REJECT','ACCESS','DENY','EXPORT','IMPORT','CONFIGURE','EXECUTE','ESCALATE','LOCK','UNLOCK','GRANT','REVOKE','ARCHIVE','RESTORE') NOT NULL COMMENT 'Action classification',
    entity_name VARCHAR(120) NOT NULL COMMENT 'Target entity/table name',
    entity_id BIGINT UNSIGNED NULL COMMENT 'Primary key of affected entity record',
    old_values JSON NULL COMMENT 'Pre-action state snapshot',
    new_values JSON NULL COMMENT 'Post-action state snapshot',
    change_summary VARCHAR(500) NULL COMMENT 'Human-readable change description',
    ip_address VARCHAR(45) NOT NULL COMMENT 'Client IP (IPv4/IPv6)',
    user_agent TEXT NULL COMMENT 'Client user-agent string',
    http_method VARCHAR(10) NULL COMMENT 'HTTP verb (GET, POST, PUT, DELETE, PATCH)',
    endpoint VARCHAR(500) NULL COMMENT 'API endpoint or URL path',
    request_id VARCHAR(64) NULL COMMENT 'Distributed tracing correlation ID',
    session_id VARCHAR(128) NULL COMMENT 'Session identifier for correlation',
    outcome ENUM('SUCCESS','FAILURE','PARTIAL','DENIED','ERROR') NOT NULL DEFAULT 'SUCCESS' COMMENT 'Action outcome',
    severity ENUM('INFO','LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'INFO' COMMENT 'Audit severity',
    risk_score TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Computed risk (0-100)',
    execution_time_ms INT UNSIGNED NULL COMMENT 'Action execution time (ms)',
    data_classification ENUM('PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED','TOP_SECRET') NOT NULL DEFAULT 'INTERNAL' COMMENT 'Data sensitivity classification',
    compliance_tags JSON NULL COMMENT 'JSON array of compliance tags (GDPR, HIPAA, SOC2, ISO27001)',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Immutable creation timestamp',
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_alm_al_uid UNIQUE (audit_uid),
    CONSTRAINT chk_alm_al_risk CHECK (risk_score >= 0 AND risk_score <= 100),
    CONSTRAINT fk_alm_al_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_al_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'MASTER immutable audit log — append-only, partition-ready by created_at, compliance-tagged';

-- =====================================================================================
-- 17.2 ALM USER ACTIVITY LOGS (User Behavior Forensics)
-- =====================================================================================
CREATE TABLE alm_user_activity_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique activity record identifier',
    activity_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external correlation',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to users',
    activity_type ENUM('LOGIN','LOGOUT','PAGE_VIEW','API_CALL','FORM_SUBMIT','FILE_UPLOAD','FILE_DOWNLOAD','REPORT_VIEW','REPORT_EXPORT','SETTINGS_CHANGE','SEARCH','DATA_CREATE','DATA_UPDATE','DATA_DELETE','APPROVAL_ACTION','SECURITY_ACTION','DASHBOARD_VIEW','WIDGET_INTERACT','IDLE','SESSION_REFRESH','BULK_OPERATION') NOT NULL COMMENT 'Activity classification',
    module_name VARCHAR(60) NULL COMMENT 'Module where activity occurred',
    resource_path VARCHAR(500) NULL COMMENT 'URL or API endpoint',
    resource_name VARCHAR(200) NULL COMMENT 'Human-readable resource name',
    login_time DATETIME NULL COMMENT 'Login timestamp (for LOGIN activities)',
    logout_time DATETIME NULL COMMENT 'Logout timestamp (for LOGOUT activities)',
    session_duration_seconds INT UNSIGNED NULL COMMENT 'Session duration (for LOGOUT)',
    ip_address VARCHAR(45) NOT NULL COMMENT 'Client IP',
    device_type VARCHAR(50) NULL COMMENT 'Device category (desktop, mobile, tablet)',
    device_os VARCHAR(80) NULL COMMENT 'Operating system',
    device_browser VARCHAR(80) NULL COMMENT 'Browser name and version',
    user_agent TEXT NULL COMMENT 'Full user-agent string',
    geo_country VARCHAR(100) NULL COMMENT 'GeoIP country',
    geo_city VARCHAR(100) NULL COMMENT 'GeoIP city',
    session_id VARCHAR(128) NULL COMMENT 'Session identifier',
    activity_metadata JSON NULL COMMENT 'Context-specific metadata',
    response_time_ms INT UNSIGNED NULL COMMENT 'Server response time (ms)',
    bytes_transferred BIGINT UNSIGNED NULL COMMENT 'Data transferred in bytes',
    activity_time DATETIME NOT NULL COMMENT 'Exact activity timestamp',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_alm_ual_uid UNIQUE (activity_uid),
    CONSTRAINT fk_alm_ual_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_alm_ual_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Immutable user behavior forensics with GeoIP, device context, and transfer metrics';

-- =====================================================================================
-- 17.3 ALM SECURITY AUDIT LOGS (Security Threat Forensics)
-- =====================================================================================
CREATE TABLE alm_security_audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique security audit record',
    event_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external correlation',
    event_type ENUM('FAILED_LOGIN','SUCCESSFUL_LOGIN','BRUTE_FORCE','PASSWORD_SPRAYING','UNAUTHORIZED_ACCESS','PRIVILEGE_ESCALATION','TOKEN_ABUSE','SESSION_HIJACK','IP_BLOCKLIST_HIT','RATE_LIMIT_EXCEEDED','INJECTION_ATTEMPT','XSS_ATTEMPT','CSRF_DETECTED','DATA_EXFILTRATION','ACCOUNT_LOCKOUT','MFA_FAILURE','CONFIG_TAMPERING','API_ABUSE','CREDENTIAL_STUFFING','ANOMALOUS_BEHAVIOR') NOT NULL COMMENT 'Security event classification',
    severity ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW' COMMENT 'Threat severity',
    user_id BIGINT UNSIGNED NULL COMMENT 'FK to users — involved user',
    target_user_id BIGINT UNSIGNED NULL COMMENT 'FK to users — target of the attack',
    ip_address VARCHAR(45) NOT NULL COMMENT 'Source IP',
    geo_country VARCHAR(100) NULL COMMENT 'GeoIP country',
    geo_city VARCHAR(100) NULL COMMENT 'GeoIP city',
    geo_latitude DECIMAL(10,7) NULL COMMENT 'GeoIP latitude',
    geo_longitude DECIMAL(10,7) NULL COMMENT 'GeoIP longitude',
    device_fingerprint VARCHAR(255) NULL COMMENT 'Device fingerprint hash',
    device_type VARCHAR(50) NULL COMMENT 'Device category',
    device_os VARCHAR(80) NULL COMMENT 'OS name/version',
    device_browser VARCHAR(80) NULL COMMENT 'Browser name/version',
    user_agent TEXT NULL COMMENT 'Full user-agent',
    request_url VARCHAR(500) NULL COMMENT 'Triggering URL/endpoint',
    request_method VARCHAR(10) NULL COMMENT 'HTTP method',
    request_payload_hash VARCHAR(64) NULL COMMENT 'SHA-256 of suspicious payload',
    threat_indicator VARCHAR(200) NULL COMMENT 'Specific threat pattern detected',
    threat_category ENUM('AUTHENTICATION','AUTHORIZATION','INPUT_VALIDATION','SESSION','NETWORK','DATA_INTEGRITY','CONFIGURATION','API') NOT NULL DEFAULT 'AUTHENTICATION' COMMENT 'OWASP-aligned threat category',
    risk_score TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Computed risk (0-100)',
    action_taken ENUM('NONE','LOGGED','BLOCKED','RATE_LIMITED','ACCOUNT_LOCKED','SESSION_TERMINATED','IP_BANNED','ALERT_SENT','ESCALATED','MFA_REQUIRED','CAPTCHA_REQUIRED') NOT NULL DEFAULT 'LOGGED' COMMENT 'Automated response',
    related_audit_id BIGINT UNSIGNED NULL COMMENT 'FK to alm_audit_logs if correlated',
    notification_sent BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Notification dispatched flag',
    notification_event_id BIGINT UNSIGNED NULL COMMENT 'FK to notification_events (Mod 13)',
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Investigation status',
    resolved_by BIGINT UNSIGNED NULL COMMENT 'FK to resolving admin',
    resolved_at DATETIME NULL COMMENT 'Resolution timestamp',
    resolution_notes TEXT NULL COMMENT 'Resolution description',
    is_false_positive BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'False positive flag',
    event_time DATETIME NOT NULL COMMENT 'Exact event timestamp',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_alm_sal_uid UNIQUE (event_uid),
    CONSTRAINT chk_alm_sal_risk CHECK (risk_score >= 0 AND risk_score <= 100),
    CONSTRAINT fk_alm_sal_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_sal_target FOREIGN KEY (target_user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_sal_resolved FOREIGN KEY (resolved_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_sal_notif FOREIGN KEY (notification_event_id) REFERENCES notification_events (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_sal_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Immutable security threat forensics with OWASP categories, GeoIP, risk scoring, and notification integration';

-- =====================================================================================
-- 17.4 ALM SYSTEM EVENT LOGS (Backend & API Event Tracking)
-- =====================================================================================
CREATE TABLE alm_system_event_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique system event identifier',
    event_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external correlation',
    event_source ENUM('API_GATEWAY','AUTH_SERVICE','VISITOR_SERVICE','NOTIFICATION_SERVICE','REPORTING_SERVICE','SECURITY_SERVICE','SCHEDULER','QUEUE_WORKER','DATABASE','CACHE','FILE_STORAGE','EXTERNAL_INTEGRATION','SYSTEM_MONITOR') NOT NULL COMMENT 'Origin service/component',
    event_type ENUM('REQUEST','RESPONSE','ERROR','STARTUP','SHUTDOWN','CONFIG_CHANGE','DEPLOY','MIGRATION','CACHE_FLUSH','QUEUE_PROCESS','SCHEDULED_JOB','HEALTH_CHECK','INTEGRATION_CALL','BACKUP','RESTORE') NOT NULL COMMENT 'Event classification',
    event_name VARCHAR(200) NOT NULL COMMENT 'Descriptive event name',
    endpoint VARCHAR(500) NULL COMMENT 'API endpoint (for REQUEST/RESPONSE events)',
    http_method VARCHAR(10) NULL COMMENT 'HTTP method',
    status_code INT UNSIGNED NULL COMMENT 'HTTP response status code',
    response_time_ms INT UNSIGNED NULL COMMENT 'Response/execution time (ms)',
    request_payload_summary TEXT NULL COMMENT 'Sanitized request payload summary',
    response_payload_summary TEXT NULL COMMENT 'Sanitized response payload summary',
    request_size_bytes INT UNSIGNED NULL COMMENT 'Request payload size',
    response_size_bytes INT UNSIGNED NULL COMMENT 'Response payload size',
    correlation_id VARCHAR(64) NULL COMMENT 'Distributed tracing correlation ID',
    parent_event_id BIGINT UNSIGNED NULL COMMENT 'FK to parent event for event chains',
    user_id BIGINT UNSIGNED NULL COMMENT 'FK to users — triggering user (if applicable)',
    ip_address VARCHAR(45) NULL COMMENT 'Source IP address',
    server_node VARCHAR(100) NULL COMMENT 'Server node that processed the event',
    severity ENUM('DEBUG','INFO','WARNING','ERROR','CRITICAL') NOT NULL DEFAULT 'INFO' COMMENT 'Event severity',
    event_metadata JSON NULL COMMENT 'Additional event context',
    event_time DATETIME NOT NULL COMMENT 'Exact event timestamp',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_alm_sel_uid UNIQUE (event_uid),
    CONSTRAINT fk_alm_sel_parent FOREIGN KEY (parent_event_id) REFERENCES alm_system_event_logs (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_sel_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_sel_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Immutable backend/API event log with distributed tracing, event chains, and service-level tracking';

-- =====================================================================================
-- 17.5 ALM ADMIN ACTION LOGS (Administrative Accountability)
-- =====================================================================================
CREATE TABLE alm_admin_action_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique admin action identifier',
    action_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external correlation',
    admin_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to admin user',
    admin_role VARCHAR(80) NOT NULL COMMENT 'Admin role at time of action',
    action_type ENUM('USER_CREATE','USER_UPDATE','USER_DELETE','USER_ACTIVATE','USER_DEACTIVATE','USER_LOCK','USER_UNLOCK','ROLE_ASSIGN','ROLE_REVOKE','ROLE_CREATE','ROLE_UPDATE','ROLE_DELETE','PERMISSION_GRANT','PERMISSION_REVOKE','CONFIG_UPDATE','FEATURE_TOGGLE','SESSION_TERMINATE','IP_BAN','IP_UNBAN','DATA_EXPORT','DATA_PURGE','DATA_ARCHIVE','SYSTEM_RESTART','BACKUP_INITIATE','BACKUP_RESTORE','REPORT_SCHEDULE','LOCKDOWN_ACTIVATE','LOCKDOWN_RELEASE','NOTIFICATION_BROADCAST','POLICY_CREATE','POLICY_UPDATE','POLICY_DELETE','AUDIT_REVIEW','COMPLIANCE_ACTION') NOT NULL COMMENT 'Action classification',
    target_module ENUM('AUTHENTICATION','USER_MANAGEMENT','ORGANIZATION','VISITOR','APPOINTMENT','APPROVAL','CALENDAR','RECEPTION','PASS','CHECKIN','CHECKOUT','SECURITY','NOTIFICATION','REPORTING','DASHBOARD','SYSTEM_ADMIN','AUDIT','GLOBAL') NOT NULL COMMENT 'Affected module',
    target_entity VARCHAR(120) NULL COMMENT 'Target entity/table name',
    target_entity_id BIGINT UNSIGNED NULL COMMENT 'Target record PK',
    target_user_id BIGINT UNSIGNED NULL COMMENT 'FK to target user (if user-affecting action)',
    description TEXT NOT NULL COMMENT 'Detailed action description',
    old_values JSON NULL COMMENT 'Pre-action state',
    new_values JSON NULL COMMENT 'Post-action state',
    justification TEXT NULL COMMENT 'Admin justification/reason',
    approval_required BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Required approval flag',
    approved_by BIGINT UNSIGNED NULL COMMENT 'FK to approver',
    approval_time DATETIME NULL COMMENT 'Approval timestamp',
    ip_address VARCHAR(45) NOT NULL COMMENT 'Admin IP',
    session_id VARCHAR(128) NULL COMMENT 'Admin session identifier',
    risk_level ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW' COMMENT 'Action risk assessment',
    is_reversible BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if action can be undone',
    action_time DATETIME NOT NULL COMMENT 'Exact action timestamp',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_alm_aal_uid UNIQUE (action_uid),
    CONSTRAINT fk_alm_aal_admin FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_alm_aal_target FOREIGN KEY (target_user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_aal_approved FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_aal_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Immutable admin accountability log with justification, approval workflow, risk assessment, and reversibility tracking';

-- =====================================================================================
-- 17.6 ALM ACCESS LOGS (Resource Access Forensics)
-- =====================================================================================
CREATE TABLE alm_access_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique access log identifier',
    access_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external correlation',
    user_id BIGINT UNSIGNED NULL COMMENT 'FK to users',
    resource_type ENUM('API_ENDPOINT','PAGE','MODULE','REPORT','DASHBOARD','WIDGET','FILE','CONFIGURATION','DATABASE_RECORD','ADMIN_FUNCTION','INTEGRATION','PHYSICAL_ACCESS_POINT') NOT NULL COMMENT 'Resource category',
    resource_name VARCHAR(250) NOT NULL COMMENT 'Resource path or name',
    resource_id BIGINT UNSIGNED NULL COMMENT 'Specific resource record ID',
    access_status ENUM('ALLOWED','DENIED','ELEVATED','DEGRADED','RATE_LIMITED') NOT NULL COMMENT 'Access outcome',
    denial_reason VARCHAR(250) NULL COMMENT 'Denial reason (if denied)',
    required_permission VARCHAR(100) NULL COMMENT 'Permission needed',
    user_role VARCHAR(80) NULL COMMENT 'User role at time of access',
    user_permission_level INT UNSIGNED NULL COMMENT 'User permission level',
    ip_address VARCHAR(45) NOT NULL COMMENT 'Client IP',
    session_id VARCHAR(128) NULL COMMENT 'Session identifier',
    user_agent TEXT NULL COMMENT 'Client user-agent',
    access_time DATETIME NOT NULL COMMENT 'Exact access timestamp',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_alm_acl_uid UNIQUE (access_uid),
    CONSTRAINT fk_alm_acl_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_acl_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Immutable resource access forensics with RBAC context, denial reasons, and physical access tracking';

-- =====================================================================================
-- 17.7 ALM SESSION LOGS (Session Lifecycle Forensics)
-- =====================================================================================
CREATE TABLE alm_session_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique session log identifier',
    session_uid VARCHAR(128) NOT NULL COMMENT 'Session identifier token',
    user_id BIGINT UNSIGNED NULL COMMENT 'FK to users — session owner',
    session_type ENUM('WEB','MOBILE','API','KIOSK','ADMIN_CONSOLE','SSO') NOT NULL DEFAULT 'WEB' COMMENT 'Client type',
    start_time DATETIME NOT NULL COMMENT 'Session start timestamp',
    last_activity_time DATETIME NOT NULL COMMENT 'Last activity timestamp',
    end_time DATETIME NULL COMMENT 'Session end timestamp (NULL if active)',
    session_duration_seconds INT UNSIGNED NULL COMMENT 'Total session duration',
    idle_timeout_applied INT UNSIGNED NULL COMMENT 'Idle timeout in seconds at time of session',
    ip_address VARCHAR(45) NOT NULL COMMENT 'IP at session start',
    final_ip_address VARCHAR(45) NULL COMMENT 'IP at session end (detects IP changes)',
    device_fingerprint VARCHAR(255) NULL COMMENT 'Device fingerprint hash',
    device_type VARCHAR(50) NULL COMMENT 'Device type',
    device_os VARCHAR(80) NULL COMMENT 'OS name/version',
    device_browser VARCHAR(80) NULL COMMENT 'Browser name/version',
    user_agent TEXT NULL COMMENT 'Full user-agent',
    geo_country VARCHAR(100) NULL COMMENT 'GeoIP country',
    geo_city VARCHAR(100) NULL COMMENT 'GeoIP city',
    total_requests INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total API requests in session',
    total_page_views INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total page views',
    total_actions INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total user actions',
    ip_changed BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'IP changed during session',
    concurrent_sessions INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Concurrent session count at time of creation',
    termination_reason ENUM('USER_LOGOUT','IDLE_TIMEOUT','MAX_TIMEOUT','ADMIN_TERMINATED','SECURITY_VIOLATION','CONCURRENT_LOGIN','TOKEN_EXPIRED','SYSTEM_RESTART','UNKNOWN') NULL COMMENT 'Session termination cause',
    session_status ENUM('ACTIVE','IDLE','EXPIRED','TERMINATED','LOCKED','HIJACK_SUSPECTED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Session lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_alm_sl_uid UNIQUE (session_uid),
    CONSTRAINT fk_alm_sl_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_alm_sl_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Immutable session lifecycle forensics with IP change detection, concurrent session tracking, and hijack flagging';

-- =====================================================================================
-- 17.8 ALM ERROR LOGS (Error & Exception Forensics)
-- =====================================================================================
CREATE TABLE alm_error_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique error log identifier',
    error_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external tracking',
    module_name VARCHAR(80) NOT NULL COMMENT 'Source module',
    service_name VARCHAR(100) NULL COMMENT 'Specific service/microservice',
    error_code VARCHAR(50) NULL COMMENT 'Application error code (e.g., ERR-AUTH-001)',
    error_type ENUM('VALIDATION','AUTHENTICATION','AUTHORIZATION','DATABASE','NETWORK','TIMEOUT','RESOURCE','INTEGRATION','BUSINESS_LOGIC','CONFIGURATION','CONCURRENCY','MEMORY','SYSTEM','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN' COMMENT 'Error classification',
    error_message TEXT NOT NULL COMMENT 'Error message text',
    stack_trace TEXT NULL COMMENT 'Full stack trace',
    severity ENUM('DEBUG','INFO','WARNING','ERROR','CRITICAL','FATAL') NOT NULL DEFAULT 'ERROR' COMMENT 'Error severity',
    user_id BIGINT UNSIGNED NULL COMMENT 'FK to triggering user',
    ip_address VARCHAR(45) NULL COMMENT 'Client IP',
    request_url VARCHAR(500) NULL COMMENT 'URL that produced the error',
    request_method VARCHAR(10) NULL COMMENT 'HTTP method',
    request_payload_summary TEXT NULL COMMENT 'Sanitized request payload',
    response_status_code INT UNSIGNED NULL COMMENT 'HTTP status code returned',
    correlation_id VARCHAR(64) NULL COMMENT 'Distributed tracing ID',
    parent_error_id BIGINT UNSIGNED NULL COMMENT 'FK to parent error (chained exceptions)',
    occurrence_count INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Occurrences for dedup',
    first_occurred_at DATETIME NOT NULL COMMENT 'First occurrence',
    last_occurred_at DATETIME NOT NULL COMMENT 'Most recent occurrence',
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Resolution status',
    resolved_by BIGINT UNSIGNED NULL COMMENT 'FK to resolving user',
    resolved_at DATETIME NULL COMMENT 'Resolution timestamp',
    resolution_notes TEXT NULL COMMENT 'Resolution description',
    environment ENUM('PRODUCTION','STAGING','DEVELOPMENT','TESTING') NOT NULL DEFAULT 'PRODUCTION' COMMENT 'Environment where error occurred',
    error_time DATETIME NOT NULL COMMENT 'Primary error timestamp',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_alm_el_uid UNIQUE (error_uid),
    CONSTRAINT fk_alm_el_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_el_resolved FOREIGN KEY (resolved_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_el_parent FOREIGN KEY (parent_error_id) REFERENCES alm_error_logs (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_el_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Immutable error forensics with chained exceptions, deduplication, environment tagging, and resolution workflow';

-- =====================================================================================
-- 17.9 ALM API REQUEST LOGS (API Call Forensics & Performance)
-- =====================================================================================
CREATE TABLE alm_api_request_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique API log identifier',
    request_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external correlation',
    endpoint VARCHAR(500) NOT NULL COMMENT 'API endpoint path',
    http_method ENUM('GET','POST','PUT','PATCH','DELETE','OPTIONS','HEAD') NOT NULL COMMENT 'HTTP method',
    api_version VARCHAR(20) NULL COMMENT 'API version (e.g., v1, v2)',
    status_code INT UNSIGNED NOT NULL COMMENT 'HTTP response status code',
    response_time_ms INT UNSIGNED NOT NULL COMMENT 'Total response time (ms)',
    time_to_first_byte_ms INT UNSIGNED NULL COMMENT 'TTFB in milliseconds',
    request_body_summary TEXT NULL COMMENT 'Sanitized request body (PII stripped)',
    response_body_summary TEXT NULL COMMENT 'Sanitized response body summary',
    request_size_bytes INT UNSIGNED NULL COMMENT 'Request payload size',
    response_size_bytes INT UNSIGNED NULL COMMENT 'Response payload size',
    request_headers_json JSON NULL COMMENT 'Sanitized request headers (auth tokens masked)',
    user_id BIGINT UNSIGNED NULL COMMENT 'FK to authenticated user (NULL for anonymous)',
    ip_address VARCHAR(45) NOT NULL COMMENT 'Client IP',
    user_agent TEXT NULL COMMENT 'Client user-agent',
    correlation_id VARCHAR(64) NULL COMMENT 'Distributed tracing ID',
    server_node VARCHAR(100) NULL COMMENT 'Server that handled the request',
    is_authenticated BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Authenticated request flag',
    is_rate_limited BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Rate-limited request flag',
    is_cached_response BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Served from cache flag',
    error_code VARCHAR(50) NULL COMMENT 'Error code (if status >= 400)',
    error_message VARCHAR(500) NULL COMMENT 'Error message (if status >= 400)',
    request_time DATETIME NOT NULL COMMENT 'Request timestamp',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_alm_arl_uid UNIQUE (request_uid),
    CONSTRAINT fk_alm_arl_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_arl_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Immutable API request/response forensics with performance metrics, caching flags, and rate-limit tracking';

-- =====================================================================================
-- 17.10 ALM AUDIT ALERTS (Flagged Audit Events Requiring Attention)
-- =====================================================================================
CREATE TABLE alm_audit_alerts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique audit alert identifier',
    alert_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external correlation',
    alert_code VARCHAR(80) NOT NULL COMMENT 'Machine-readable alert code (e.g., ALM-BRUTE-001)',
    alert_type ENUM('SECURITY_THREAT','COMPLIANCE_VIOLATION','DATA_ANOMALY','ACCESS_VIOLATION','PRIVILEGE_ABUSE','CONFIGURATION_RISK','PERFORMANCE_ANOMALY','ERROR_SPIKE','POLICY_BREACH','SUSPICIOUS_PATTERN','DATA_EXFILTRATION','AUDIT_GAP') NOT NULL COMMENT 'Alert classification',
    severity ENUM('INFO','WARNING','ERROR','CRITICAL','EMERGENCY') NOT NULL DEFAULT 'WARNING' COMMENT 'Alert severity',
    title VARCHAR(200) NOT NULL COMMENT 'Alert title',
    message TEXT NOT NULL COMMENT 'Detailed alert message',
    source_module ENUM('AUTHENTICATION','USER_MANAGEMENT','ORGANIZATION','VISITOR','APPOINTMENT','APPROVAL','CALENDAR','RECEPTION','PASS','CHECKIN','CHECKOUT','SECURITY','NOTIFICATION','REPORTING','DASHBOARD','SYSTEM_ADMIN','AUDIT','INFRASTRUCTURE') NOT NULL COMMENT 'Source module',
    source_audit_log_id BIGINT UNSIGNED NULL COMMENT 'FK to triggering alm_audit_logs entry',
    source_security_log_id BIGINT UNSIGNED NULL COMMENT 'FK to triggering alm_security_audit_logs entry',
    affected_user_id BIGINT UNSIGNED NULL COMMENT 'FK to affected user',
    threat_indicator VARCHAR(200) NULL COMMENT 'Specific threat pattern or indicator',
    risk_score TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Computed risk (0-100)',
    notification_event_id BIGINT UNSIGNED NULL COMMENT 'FK to notification_events (Mod 13)',
    notification_sent BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Notification dispatched flag',
    kpi_metric_id BIGINT UNSIGNED NULL COMMENT 'FK to kpi_metrics (Mod 14) if KPI-triggered',
    auto_resolved BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Auto-resolved flag',
    escalation_level INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Current escalation level',
    assigned_to BIGINT UNSIGNED NULL COMMENT 'FK to assigned admin',
    acknowledged_by BIGINT UNSIGNED NULL COMMENT 'FK to acknowledging user',
    acknowledged_at DATETIME NULL COMMENT 'Acknowledgment timestamp',
    resolved_by BIGINT UNSIGNED NULL COMMENT 'FK to resolving user',
    resolved_at DATETIME NULL COMMENT 'Resolution timestamp',
    resolution_notes TEXT NULL COMMENT 'Resolution description',
    triggered_at DATETIME NOT NULL COMMENT 'Alert trigger timestamp',
    expires_at DATETIME NULL COMMENT 'Alert expiration (NULL = no expiry)',
    occurrence_count INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Alert fire count',
    alert_status ENUM('OPEN','ACKNOWLEDGED','IN_PROGRESS','RESOLVED','SUPPRESSED','AUTO_RESOLVED','ESCALATED','CLOSED') NOT NULL DEFAULT 'OPEN' COMMENT 'Alert lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_alm_aa_uid UNIQUE (alert_uid),
    CONSTRAINT chk_alm_aa_risk CHECK (risk_score >= 0 AND risk_score <= 100),
    CONSTRAINT fk_alm_aa_audit FOREIGN KEY (source_audit_log_id) REFERENCES alm_audit_logs (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_aa_security FOREIGN KEY (source_security_log_id) REFERENCES alm_security_audit_logs (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_aa_user FOREIGN KEY (affected_user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_aa_notif FOREIGN KEY (notification_event_id) REFERENCES notification_events (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_aa_kpi FOREIGN KEY (kpi_metric_id) REFERENCES kpi_metrics (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_aa_assigned FOREIGN KEY (assigned_to) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_aa_ack FOREIGN KEY (acknowledged_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_aa_resolved FOREIGN KEY (resolved_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_aa_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_alm_aa_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Audit alert management with OWASP threat types, KPI/notification integration, escalation, and compliance tracking';


-- =====================================================================================
-- MODULE 17: PERFORMANCE INDEXES
-- =====================================================================================

-- alm_audit_logs indexes
CREATE INDEX idx_alm_al_user ON alm_audit_logs (user_id);
CREATE INDEX idx_alm_al_module ON alm_audit_logs (module_name);
CREATE INDEX idx_alm_al_action ON alm_audit_logs (action_type);
CREATE INDEX idx_alm_al_entity ON alm_audit_logs (entity_name);
CREATE INDEX idx_alm_al_entity_id ON alm_audit_logs (entity_id);
CREATE INDEX idx_alm_al_outcome ON alm_audit_logs (outcome);
CREATE INDEX idx_alm_al_severity ON alm_audit_logs (severity);
CREATE INDEX idx_alm_al_ip ON alm_audit_logs (ip_address);
CREATE INDEX idx_alm_al_session ON alm_audit_logs (session_id);
CREATE INDEX idx_alm_al_classification ON alm_audit_logs (data_classification);
CREATE INDEX idx_alm_al_created ON alm_audit_logs (created_at);
CREATE INDEX idx_alm_al_user_created ON alm_audit_logs (user_id, created_at);
CREATE INDEX idx_alm_al_module_action ON alm_audit_logs (module_name, action_type);
CREATE INDEX idx_alm_al_entity_full ON alm_audit_logs (entity_name, entity_id);
CREATE INDEX idx_alm_al_ip_created ON alm_audit_logs (ip_address, created_at);
CREATE INDEX idx_alm_al_severity_created ON alm_audit_logs (severity, created_at);
CREATE INDEX idx_alm_al_module_created ON alm_audit_logs (module_name, created_at);
CREATE INDEX idx_alm_al_outcome_created ON alm_audit_logs (outcome, created_at);

-- alm_user_activity_logs indexes
CREATE INDEX idx_alm_ual_user ON alm_user_activity_logs (user_id);
CREATE INDEX idx_alm_ual_type ON alm_user_activity_logs (activity_type);
CREATE INDEX idx_alm_ual_module ON alm_user_activity_logs (module_name);
CREATE INDEX idx_alm_ual_ip ON alm_user_activity_logs (ip_address);
CREATE INDEX idx_alm_ual_session ON alm_user_activity_logs (session_id);
CREATE INDEX idx_alm_ual_time ON alm_user_activity_logs (activity_time);
CREATE INDEX idx_alm_ual_created ON alm_user_activity_logs (created_at);
CREATE INDEX idx_alm_ual_user_time ON alm_user_activity_logs (user_id, activity_time);
CREATE INDEX idx_alm_ual_user_type ON alm_user_activity_logs (user_id, activity_type);
CREATE INDEX idx_alm_ual_type_time ON alm_user_activity_logs (activity_type, activity_time);

-- alm_security_audit_logs indexes
CREATE INDEX idx_alm_sal_type ON alm_security_audit_logs (event_type);
CREATE INDEX idx_alm_sal_severity ON alm_security_audit_logs (severity);
CREATE INDEX idx_alm_sal_user ON alm_security_audit_logs (user_id);
CREATE INDEX idx_alm_sal_ip ON alm_security_audit_logs (ip_address);
CREATE INDEX idx_alm_sal_action ON alm_security_audit_logs (action_taken);
CREATE INDEX idx_alm_sal_threat ON alm_security_audit_logs (threat_category);
CREATE INDEX idx_alm_sal_resolved ON alm_security_audit_logs (is_resolved);
CREATE INDEX idx_alm_sal_time ON alm_security_audit_logs (event_time);
CREATE INDEX idx_alm_sal_created ON alm_security_audit_logs (created_at);
CREATE INDEX idx_alm_sal_type_sev ON alm_security_audit_logs (event_type, severity);
CREATE INDEX idx_alm_sal_user_time ON alm_security_audit_logs (user_id, event_time);
CREATE INDEX idx_alm_sal_ip_time ON alm_security_audit_logs (ip_address, event_time);
CREATE INDEX idx_alm_sal_sev_resolved ON alm_security_audit_logs (severity, is_resolved);
CREATE INDEX idx_alm_sal_threat_time ON alm_security_audit_logs (threat_category, event_time);

-- alm_system_event_logs indexes
CREATE INDEX idx_alm_sel_source ON alm_system_event_logs (event_source);
CREATE INDEX idx_alm_sel_type ON alm_system_event_logs (event_type);
CREATE INDEX idx_alm_sel_severity ON alm_system_event_logs (severity);
CREATE INDEX idx_alm_sel_endpoint ON alm_system_event_logs (endpoint(191));
CREATE INDEX idx_alm_sel_status ON alm_system_event_logs (status_code);
CREATE INDEX idx_alm_sel_user ON alm_system_event_logs (user_id);
CREATE INDEX idx_alm_sel_corr ON alm_system_event_logs (correlation_id);
CREATE INDEX idx_alm_sel_node ON alm_system_event_logs (server_node);
CREATE INDEX idx_alm_sel_time ON alm_system_event_logs (event_time);
CREATE INDEX idx_alm_sel_created ON alm_system_event_logs (created_at);
CREATE INDEX idx_alm_sel_source_type ON alm_system_event_logs (event_source, event_type);
CREATE INDEX idx_alm_sel_endpoint_time ON alm_system_event_logs (endpoint(191), event_time);

-- alm_admin_action_logs indexes
CREATE INDEX idx_alm_aal_admin ON alm_admin_action_logs (admin_id);
CREATE INDEX idx_alm_aal_action ON alm_admin_action_logs (action_type);
CREATE INDEX idx_alm_aal_module ON alm_admin_action_logs (target_module);
CREATE INDEX idx_alm_aal_target_user ON alm_admin_action_logs (target_user_id);
CREATE INDEX idx_alm_aal_risk ON alm_admin_action_logs (risk_level);
CREATE INDEX idx_alm_aal_time ON alm_admin_action_logs (action_time);
CREATE INDEX idx_alm_aal_created ON alm_admin_action_logs (created_at);
CREATE INDEX idx_alm_aal_admin_time ON alm_admin_action_logs (admin_id, action_time);
CREATE INDEX idx_alm_aal_action_module ON alm_admin_action_logs (action_type, target_module);
CREATE INDEX idx_alm_aal_module_time ON alm_admin_action_logs (target_module, action_time);
CREATE INDEX idx_alm_aal_risk_time ON alm_admin_action_logs (risk_level, action_time);

-- alm_access_logs indexes
CREATE INDEX idx_alm_acl_user ON alm_access_logs (user_id);
CREATE INDEX idx_alm_acl_resource ON alm_access_logs (resource_type);
CREATE INDEX idx_alm_acl_status ON alm_access_logs (access_status);
CREATE INDEX idx_alm_acl_ip ON alm_access_logs (ip_address);
CREATE INDEX idx_alm_acl_time ON alm_access_logs (access_time);
CREATE INDEX idx_alm_acl_created ON alm_access_logs (created_at);
CREATE INDEX idx_alm_acl_user_time ON alm_access_logs (user_id, access_time);
CREATE INDEX idx_alm_acl_status_time ON alm_access_logs (access_status, access_time);
CREATE INDEX idx_alm_acl_resource_status ON alm_access_logs (resource_type, access_status);
CREATE INDEX idx_alm_acl_ip_time ON alm_access_logs (ip_address, access_time);

-- alm_session_logs indexes
CREATE INDEX idx_alm_sl_user ON alm_session_logs (user_id);
CREATE INDEX idx_alm_sl_type ON alm_session_logs (session_type);
CREATE INDEX idx_alm_sl_status ON alm_session_logs (session_status);
CREATE INDEX idx_alm_sl_start ON alm_session_logs (start_time);
CREATE INDEX idx_alm_sl_end ON alm_session_logs (end_time);
CREATE INDEX idx_alm_sl_ip ON alm_session_logs (ip_address);
CREATE INDEX idx_alm_sl_created ON alm_session_logs (created_at);
CREATE INDEX idx_alm_sl_user_status ON alm_session_logs (user_id, session_status);
CREATE INDEX idx_alm_sl_status_last ON alm_session_logs (session_status, last_activity_time);
CREATE INDEX idx_alm_sl_user_start ON alm_session_logs (user_id, start_time);

-- alm_error_logs indexes
CREATE INDEX idx_alm_el_module ON alm_error_logs (module_name);
CREATE INDEX idx_alm_el_type ON alm_error_logs (error_type);
CREATE INDEX idx_alm_el_severity ON alm_error_logs (severity);
CREATE INDEX idx_alm_el_code ON alm_error_logs (error_code);
CREATE INDEX idx_alm_el_user ON alm_error_logs (user_id);
CREATE INDEX idx_alm_el_resolved ON alm_error_logs (is_resolved);
CREATE INDEX idx_alm_el_time ON alm_error_logs (error_time);
CREATE INDEX idx_alm_el_env ON alm_error_logs (environment);
CREATE INDEX idx_alm_el_corr ON alm_error_logs (correlation_id);
CREATE INDEX idx_alm_el_created ON alm_error_logs (created_at);
CREATE INDEX idx_alm_el_module_sev ON alm_error_logs (module_name, severity);
CREATE INDEX idx_alm_el_sev_time ON alm_error_logs (severity, error_time);
CREATE INDEX idx_alm_el_module_time ON alm_error_logs (module_name, error_time);
CREATE INDEX idx_alm_el_env_sev ON alm_error_logs (environment, severity);

-- alm_api_request_logs indexes
CREATE INDEX idx_alm_arl_endpoint ON alm_api_request_logs (endpoint(191));
CREATE INDEX idx_alm_arl_method ON alm_api_request_logs (http_method);
CREATE INDEX idx_alm_arl_status ON alm_api_request_logs (status_code);
CREATE INDEX idx_alm_arl_user ON alm_api_request_logs (user_id);
CREATE INDEX idx_alm_arl_ip ON alm_api_request_logs (ip_address);
CREATE INDEX idx_alm_arl_corr ON alm_api_request_logs (correlation_id);
CREATE INDEX idx_alm_arl_node ON alm_api_request_logs (server_node);
CREATE INDEX idx_alm_arl_time ON alm_api_request_logs (request_time);
CREATE INDEX idx_alm_arl_created ON alm_api_request_logs (created_at);
CREATE INDEX idx_alm_arl_endpoint_time ON alm_api_request_logs (endpoint(191), request_time);
CREATE INDEX idx_alm_arl_method_status ON alm_api_request_logs (http_method, status_code);
CREATE INDEX idx_alm_arl_user_time ON alm_api_request_logs (user_id, request_time);
CREATE INDEX idx_alm_arl_ip_time ON alm_api_request_logs (ip_address, request_time);

-- alm_audit_alerts indexes
CREATE INDEX idx_alm_aa_type ON alm_audit_alerts (alert_type);
CREATE INDEX idx_alm_aa_severity ON alm_audit_alerts (severity);
CREATE INDEX idx_alm_aa_source ON alm_audit_alerts (source_module);
CREATE INDEX idx_alm_aa_status ON alm_audit_alerts (alert_status);
CREATE INDEX idx_alm_aa_triggered ON alm_audit_alerts (triggered_at);
CREATE INDEX idx_alm_aa_assigned ON alm_audit_alerts (assigned_to);
CREATE INDEX idx_alm_aa_kpi ON alm_audit_alerts (kpi_metric_id);
CREATE INDEX idx_alm_aa_user ON alm_audit_alerts (affected_user_id);
CREATE INDEX idx_alm_aa_created ON alm_audit_alerts (created_at);
CREATE INDEX idx_alm_aa_type_sev ON alm_audit_alerts (alert_type, severity);
CREATE INDEX idx_alm_aa_status_sev ON alm_audit_alerts (alert_status, severity);
CREATE INDEX idx_alm_aa_source_status ON alm_audit_alerts (source_module, alert_status);
CREATE INDEX idx_alm_aa_status_triggered ON alm_audit_alerts (alert_status, triggered_at);

-- =====================================================================================
-- MODULE 18: SYSTEM ADMINISTRATION & CONTROL CENTER
-- =====================================================================================
-- NAMING: Uses `scc_` prefix to avoid conflicts with:
--   system_configurations (Mod 15, line 7789), system_health_monitoring (Mod 15, line 7876)
-- This module is the MASTER CONTROL PLANE — centralized config, module lifecycle,
-- feature flags, security policies, and emergency overrides.
-- =====================================================================================

-- =====================================================================================
-- 18.1 SCC SYSTEM CONFIGURATIONS (Global Configuration Key-Value Store)
-- =====================================================================================
CREATE TABLE scc_system_configurations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique configuration entry identifier',
    config_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external reference',
    config_key VARCHAR(200) NOT NULL COMMENT 'Dot-notation config key (e.g., auth.session.timeout)',
    config_value TEXT NOT NULL COMMENT 'Configuration value (cast by config_type)',
    config_type ENUM('STRING','INTEGER','FLOAT','BOOLEAN','JSON','ENCRYPTED','CSV','DURATION','URL','REGEX') NOT NULL DEFAULT 'STRING' COMMENT 'Value data type for parsing',
    config_category ENUM('GENERAL','AUTHENTICATION','SECURITY','NOTIFICATION','VISITOR','REPORTING','PERFORMANCE','INTEGRATION','COMPLIANCE','FEATURE','UI','STORAGE','NETWORK') NOT NULL DEFAULT 'GENERAL' COMMENT 'Functional category',
    environment ENUM('ALL','DEVELOPMENT','TESTING','STAGING','PRODUCTION') NOT NULL DEFAULT 'ALL' COMMENT 'Environment scope',
    module_scope ENUM('GLOBAL','AUTHENTICATION','USER_MANAGEMENT','ORGANIZATION','VISITOR','APPOINTMENT','APPROVAL','CALENDAR','RECEPTION','PASS','CHECKIN','CHECKOUT','SECURITY','NOTIFICATION','REPORTING','DASHBOARD','AUDIT','SYSTEM_ADMIN') NOT NULL DEFAULT 'GLOBAL' COMMENT 'Module scope',
    description TEXT NOT NULL COMMENT 'Human-readable description of this configuration',
    default_value TEXT NULL COMMENT 'Factory default value for reset capability',
    validation_rule VARCHAR(500) NULL COMMENT 'Validation regex or constraint expression',
    allowed_values JSON NULL COMMENT 'JSON array of allowed values for enum-like configs',
    is_editable BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Flags if config can be changed at runtime',
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if value contains sensitive data (mask in UI)',
    is_encrypted BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if value is stored encrypted',
    requires_restart BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags if change requires system restart',
    min_role_level INT UNSIGNED NOT NULL DEFAULT 4 COMMENT 'Minimum role level to modify (4 = SUPER_ADMIN)',
    version INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Config version for optimistic locking',
    effective_from DATETIME NULL COMMENT 'Scheduled activation time (NULL = immediate)',
    effective_until DATETIME NULL COMMENT 'Scheduled deactivation time (NULL = permanent)',
    status ENUM('ACTIVE','PENDING','DISABLED','DEPRECATED','SCHEDULED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Config lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_scc_sc_uid UNIQUE (config_uid),
    CONSTRAINT uq_scc_sc_key_env UNIQUE (config_key, environment),
    CONSTRAINT fk_scc_sc_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_sc_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_sc_deleted FOREIGN KEY (deleted_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Master config store with environment scoping, versioning, encryption, validation rules, and scheduled activation';

-- =====================================================================================
-- 18.2 SCC MODULE REGISTRY (Module Lifecycle Management)
-- =====================================================================================
CREATE TABLE scc_module_registry (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique module registry identifier',
    module_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external reference',
    module_code VARCHAR(80) NOT NULL COMMENT 'Machine-readable module code (e.g., MOD-AUTH-001)',
    module_name VARCHAR(200) NOT NULL COMMENT 'Human-readable module name',
    module_description TEXT NULL COMMENT 'Detailed module description and purpose',
    module_version VARCHAR(30) NOT NULL COMMENT 'Semantic version (e.g., 1.0.0)',
    previous_version VARCHAR(30) NULL COMMENT 'Previous version before upgrade',
    module_category ENUM('CORE','SECURITY','VISITOR','OPERATIONS','ANALYTICS','COMMUNICATION','ADMINISTRATION','INTEGRATION') NOT NULL DEFAULT 'CORE' COMMENT 'Module functional category',
    entry_point VARCHAR(250) NULL COMMENT 'Module entry point URL or service endpoint',
    health_check_url VARCHAR(250) NULL COMMENT 'Module health check endpoint',
    dependency_list JSON NULL COMMENT 'JSON array of required module codes',
    config_schema JSON NULL COMMENT 'JSON schema of configuration options this module supports',
    priority_level INT UNSIGNED NOT NULL DEFAULT 100 COMMENT 'Boot/init priority (lower = higher priority)',
    load_order INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Module loading order',
    installed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Installation timestamp',
    last_started_at DATETIME NULL COMMENT 'Last startup timestamp',
    last_stopped_at DATETIME NULL COMMENT 'Last shutdown timestamp',
    last_health_check DATETIME NULL COMMENT 'Last health check timestamp',
    health_status ENUM('HEALTHY','DEGRADED','UNHEALTHY','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN' COMMENT 'Last health check result',
    module_status ENUM('ACTIVE','INACTIVE','DEPRECATED','MAINTENANCE','FAILED','INSTALLING','UPGRADING') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Module lifecycle status',
    is_core BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Core module (cannot be disabled)',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_scc_mr_uid UNIQUE (module_uid),
    CONSTRAINT uq_scc_mr_code UNIQUE (module_code),
    CONSTRAINT fk_scc_mr_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_mr_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_mr_deleted FOREIGN KEY (deleted_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Module lifecycle registry with versioning, health checks, priority ordering, and dependency declarations';

-- =====================================================================================
-- 18.3 SCC FEATURE FLAGS (Runtime Feature Control)
-- =====================================================================================
CREATE TABLE scc_feature_flags (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique feature flag identifier',
    flag_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external reference',
    feature_key VARCHAR(150) NOT NULL COMMENT 'Machine-readable feature key (e.g., visitor.ai_screening)',
    feature_name VARCHAR(200) NOT NULL COMMENT 'Human-readable feature name',
    feature_description TEXT NULL COMMENT 'Description of what this feature flag controls',
    module_id BIGINT UNSIGNED NULL COMMENT 'FK to scc_module_registry — owning module',
    module_name VARCHAR(80) NULL COMMENT 'Module name (denormalized for fast queries)',
    enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Master on/off switch',
    rollout_percentage DECIMAL(5,2) NOT NULL DEFAULT 100.00 COMMENT 'Gradual rollout percentage (0-100)',
    rollout_strategy ENUM('ALL_USERS','PERCENTAGE','USER_LIST','ROLE_LIST','ORGANIZATION_LIST','A_B_TEST','CANARY','RING') NOT NULL DEFAULT 'ALL_USERS' COMMENT 'Rollout targeting strategy',
    target_user_ids JSON NULL COMMENT 'JSON array of specific user IDs for USER_LIST strategy',
    target_role_ids JSON NULL COMMENT 'JSON array of role IDs for ROLE_LIST strategy',
    target_org_ids JSON NULL COMMENT 'JSON array of org IDs for ORGANIZATION_LIST strategy',
    user_group_target VARCHAR(100) NULL COMMENT 'Named user group for targeting',
    environment ENUM('ALL','DEVELOPMENT','TESTING','STAGING','PRODUCTION') NOT NULL DEFAULT 'ALL' COMMENT 'Environment scope',
    starts_at DATETIME NULL COMMENT 'Scheduled activation time',
    expires_at DATETIME NULL COMMENT 'Scheduled expiration time (NULL = permanent)',
    depends_on_flags JSON NULL COMMENT 'JSON array of prerequisite feature keys',
    kill_switch BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Emergency kill switch — overrides enabled',
    version INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Flag version for tracking changes',
    status ENUM('ACTIVE','DISABLED','EXPIRED','SCHEDULED','ARCHIVED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Flag lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_scc_ff_uid UNIQUE (flag_uid),
    CONSTRAINT uq_scc_ff_key_env UNIQUE (feature_key, environment),
    CONSTRAINT chk_scc_ff_rollout CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    CONSTRAINT fk_scc_ff_module FOREIGN KEY (module_id) REFERENCES scc_module_registry (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_ff_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_ff_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_ff_deleted FOREIGN KEY (deleted_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Feature flags with gradual rollout, A/B testing, kill switches, scheduling, and multi-environment support';

-- =====================================================================================
-- 18.4 SCC ENVIRONMENT SETTINGS (Environment-Specific Configuration)
-- =====================================================================================
CREATE TABLE scc_environment_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique environment setting identifier',
    env_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external reference',
    environment_name ENUM('DEVELOPMENT','TESTING','STAGING','PRODUCTION','DR_RECOVERY') NOT NULL COMMENT 'Environment identifier',
    environment_label VARCHAR(100) NOT NULL COMMENT 'Display label (e.g., Production - US East)',
    database_host VARCHAR(250) NULL COMMENT 'Database host (masked in non-admin views)',
    database_port INT UNSIGNED NULL COMMENT 'Database port',
    database_name VARCHAR(100) NULL COMMENT 'Database name',
    database_pool_size INT UNSIGNED NOT NULL DEFAULT 50 COMMENT 'Connection pool size',
    api_base_url VARCHAR(500) NOT NULL COMMENT 'Base URL for API services',
    api_version VARCHAR(20) NOT NULL DEFAULT 'v1' COMMENT 'API version',
    cdn_base_url VARCHAR(500) NULL COMMENT 'CDN base URL for static assets',
    storage_provider ENUM('LOCAL','AWS_S3','AZURE_BLOB','GCS','MINIO') NOT NULL DEFAULT 'LOCAL' COMMENT 'File storage provider',
    storage_config JSON NULL COMMENT 'Storage provider config (bucket, region, etc.)',
    cache_provider ENUM('NONE','REDIS','MEMCACHED','IN_MEMORY') NOT NULL DEFAULT 'IN_MEMORY' COMMENT 'Cache provider',
    cache_config JSON NULL COMMENT 'Cache provider config (host, port, TTL)',
    security_level ENUM('MINIMAL','STANDARD','HIGH','MAXIMUM','PARANOID') NOT NULL DEFAULT 'HIGH' COMMENT 'Security enforcement level',
    ssl_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'SSL/TLS enforcement',
    cors_origins JSON NULL COMMENT 'JSON array of allowed CORS origins',
    rate_limit_per_minute INT UNSIGNED NOT NULL DEFAULT 100 COMMENT 'API rate limit per user per minute',
    max_upload_size_mb INT UNSIGNED NOT NULL DEFAULT 10 COMMENT 'Maximum file upload size in MB',
    log_level ENUM('DEBUG','INFO','WARNING','ERROR','CRITICAL') NOT NULL DEFAULT 'INFO' COMMENT 'Logging verbosity level',
    maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Environment maintenance mode flag',
    config_data JSON NULL COMMENT 'Additional environment-specific JSON config',
    is_primary BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags the primary production environment',
    status ENUM('ACTIVE','MAINTENANCE','DEGRADED','OFFLINE','PROVISIONING') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Environment status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_scc_es_uid UNIQUE (env_uid),
    CONSTRAINT uq_scc_es_env UNIQUE (environment_name),
    CONSTRAINT fk_scc_es_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_es_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_es_deleted FOREIGN KEY (deleted_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Environment-specific settings with database, API, storage, cache, security, and rate-limit configurations';

-- =====================================================================================
-- 18.5 SCC SECURITY POLICIES (Global Security Rule Engine)
-- =====================================================================================
CREATE TABLE scc_security_policies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique security policy identifier',
    policy_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external reference',
    policy_code VARCHAR(80) NOT NULL COMMENT 'Machine-readable policy code (e.g., POL-PASSWORD-001)',
    policy_name VARCHAR(200) NOT NULL COMMENT 'Human-readable policy name',
    policy_description TEXT NULL COMMENT 'Detailed description of what this policy enforces',
    policy_type ENUM('PASSWORD','SESSION','ACCESS_CONTROL','MFA','IP_RESTRICTION','DATA_RETENTION','ENCRYPTION','RATE_LIMIT','AUDIT','COMPLIANCE','VISITOR_SCREENING','NOTIFICATION','LOCKDOWN') NOT NULL COMMENT 'Policy functional type',
    policy_category ENUM('AUTHENTICATION','AUTHORIZATION','DATA_SECURITY','NETWORK','COMPLIANCE','OPERATIONAL') NOT NULL DEFAULT 'AUTHENTICATION' COMMENT 'Policy category',
    policy_value TEXT NOT NULL COMMENT 'Policy value or rule expression',
    policy_config JSON NULL COMMENT 'Complex policy configuration as JSON',
    enforcement_level ENUM('ADVISORY','RECOMMENDED','ENFORCED','MANDATORY','CRITICAL') NOT NULL DEFAULT 'ENFORCED' COMMENT 'How strictly this policy is enforced',
    module_scope ENUM('GLOBAL','AUTHENTICATION','USER_MANAGEMENT','ORGANIZATION','VISITOR','APPOINTMENT','APPROVAL','CALENDAR','RECEPTION','PASS','CHECKIN','CHECKOUT','SECURITY','NOTIFICATION','REPORTING','DASHBOARD','AUDIT','SYSTEM_ADMIN') NOT NULL DEFAULT 'GLOBAL' COMMENT 'Module scope',
    applies_to_roles JSON NULL COMMENT 'JSON array of role IDs this policy applies to (NULL = all)',
    exception_roles JSON NULL COMMENT 'JSON array of role IDs exempt from this policy',
    compliance_framework VARCHAR(100) NULL COMMENT 'Compliance standard (GDPR, HIPAA, SOC2, ISO27001)',
    effective_from DATETIME NULL COMMENT 'Policy activation date',
    effective_until DATETIME NULL COMMENT 'Policy expiration date (NULL = permanent)',
    version INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Policy version',
    priority INT UNSIGNED NOT NULL DEFAULT 100 COMMENT 'Priority order (lower = higher priority)',
    status ENUM('ACTIVE','DRAFT','REVIEW','DISABLED','EXPIRED','SUPERSEDED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Policy lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_scc_sp_uid UNIQUE (policy_uid),
    CONSTRAINT uq_scc_sp_code UNIQUE (policy_code),
    CONSTRAINT fk_scc_sp_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_sp_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_sp_deleted FOREIGN KEY (deleted_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Security policy engine with compliance tagging, role-based enforcement, versioning, and priority ordering';

-- =====================================================================================
-- 18.6 SCC ADMIN CONTROLS (Administrative Control Actions)
-- =====================================================================================
-- IMMUTABLE: Admin control actions are append-only for accountability.
-- =====================================================================================
CREATE TABLE scc_admin_controls (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique admin control action identifier',
    control_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external correlation',
    admin_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to users — performing admin',
    admin_role VARCHAR(80) NOT NULL COMMENT 'Admin role at time of action',
    action_type ENUM('CONFIG_UPDATE','MODULE_ENABLE','MODULE_DISABLE','MODULE_RESTART','FEATURE_TOGGLE','POLICY_UPDATE','OVERRIDE_ACTIVATE','OVERRIDE_DEACTIVATE','ENVIRONMENT_CHANGE','SECURITY_LOCKDOWN','MAINTENANCE_MODE','USER_MASS_ACTION','SYSTEM_RESTART','BACKUP_TRIGGER','CACHE_FLUSH','DB_MAINTENANCE','DEPLOY','ROLLBACK','EMERGENCY_STOP') NOT NULL COMMENT 'Control action type',
    target_module VARCHAR(80) NULL COMMENT 'Target module affected',
    target_entity VARCHAR(120) NULL COMMENT 'Target entity/table name',
    target_entity_id BIGINT UNSIGNED NULL COMMENT 'Specific entity record ID',
    action_description TEXT NOT NULL COMMENT 'Detailed description',
    old_state JSON NULL COMMENT 'State before action',
    new_state JSON NULL COMMENT 'State after action',
    justification TEXT NULL COMMENT 'Reason for the action',
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Action requires secondary approval',
    approved_by BIGINT UNSIGNED NULL COMMENT 'FK to approving admin',
    approved_at DATETIME NULL COMMENT 'Approval timestamp',
    ip_address VARCHAR(45) NOT NULL COMMENT 'Admin IP',
    session_id VARCHAR(128) NULL COMMENT 'Admin session',
    risk_level ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW' COMMENT 'Risk assessment',
    audit_log_id BIGINT UNSIGNED NULL COMMENT 'FK to alm_audit_logs for cross-reference',
    notification_sent BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Notification dispatched flag',
    action_time DATETIME NOT NULL COMMENT 'Action timestamp',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_scc_ac_uid UNIQUE (control_uid),
    CONSTRAINT fk_scc_ac_admin FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_scc_ac_approved FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_ac_audit FOREIGN KEY (audit_log_id) REFERENCES alm_audit_logs (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_ac_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Immutable admin control action log with approval workflow, risk assessment, and Mod 17 audit integration';

-- =====================================================================================
-- 18.7 SCC SYSTEM OVERRIDES (Emergency & Forced Overrides)
-- =====================================================================================
CREATE TABLE scc_system_overrides (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique override identifier',
    override_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external reference',
    override_code VARCHAR(80) NOT NULL COMMENT 'Machine-readable override code',
    override_type ENUM('MAINTENANCE_MODE','EMERGENCY_LOCKDOWN','FEATURE_KILL','CONFIG_FORCE','SECURITY_ESCALATION','RATE_LIMIT_BYPASS','ACCESS_OVERRIDE','MODULE_FORCE_STOP','MODULE_FORCE_START','NOTIFICATION_SUPPRESS','REPORT_FREEZE','VISITOR_BLOCK_ALL','DATA_EXPORT_LOCK','SESSION_FLUSH_ALL') NOT NULL COMMENT 'Override category',
    override_name VARCHAR(200) NOT NULL COMMENT 'Human-readable override name',
    reason TEXT NOT NULL COMMENT 'Detailed justification for the override',
    applied_by BIGINT UNSIGNED NOT NULL COMMENT 'FK to admin who activated',
    approved_by BIGINT UNSIGNED NULL COMMENT 'FK to secondary approver (required for CRITICAL)',
    affected_module ENUM('ALL','AUTHENTICATION','USER_MANAGEMENT','ORGANIZATION','VISITOR','APPOINTMENT','APPROVAL','CALENDAR','RECEPTION','PASS','CHECKIN','CHECKOUT','SECURITY','NOTIFICATION','REPORTING','DASHBOARD','AUDIT','SYSTEM_ADMIN') NOT NULL DEFAULT 'ALL' COMMENT 'Affected module scope',
    affected_config_keys JSON NULL COMMENT 'JSON array of config keys affected by this override',
    override_value TEXT NULL COMMENT 'Forced value (if CONFIG_FORCE type)',
    original_value TEXT NULL COMMENT 'Original value before override (for rollback)',
    severity ENUM('LOW','MEDIUM','HIGH','CRITICAL','EMERGENCY') NOT NULL DEFAULT 'HIGH' COMMENT 'Override severity',
    max_duration_minutes INT UNSIGNED NULL COMMENT 'Maximum allowed duration (NULL = indefinite)',
    auto_revert BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Automatically revert after max_duration',
    activated_at DATETIME NOT NULL COMMENT 'Override activation timestamp',
    expires_at DATETIME NULL COMMENT 'Scheduled expiration (NULL = manual deactivation only)',
    deactivated_at DATETIME NULL COMMENT 'Actual deactivation timestamp',
    deactivated_by BIGINT UNSIGNED NULL COMMENT 'FK to admin who deactivated',
    deactivation_reason TEXT NULL COMMENT 'Reason for deactivation',
    notification_event_id BIGINT UNSIGNED NULL COMMENT 'FK to notification_events (Mod 13)',
    override_status ENUM('ACTIVE','EXPIRED','REVERTED','DEACTIVATED','PENDING_APPROVAL') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Override lifecycle',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_scc_so_uid UNIQUE (override_uid),
    CONSTRAINT uq_scc_so_code UNIQUE (override_code),
    CONSTRAINT fk_scc_so_applied FOREIGN KEY (applied_by) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_scc_so_approved FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_so_deactivated FOREIGN KEY (deactivated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_so_notif FOREIGN KEY (notification_event_id) REFERENCES notification_events (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_so_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_so_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Emergency overrides with approval workflow, auto-revert, rollback values, and notification integration';

-- =====================================================================================
-- 18.8 SCC CONFIGURATION HISTORY (Config Change Audit Trail)
-- =====================================================================================
-- IMMUTABLE: Configuration history is append-only for full traceability.
-- =====================================================================================
CREATE TABLE scc_configuration_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique history entry identifier',
    history_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external correlation',
    config_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to scc_system_configurations',
    config_key VARCHAR(200) NOT NULL COMMENT 'Config key (denormalized for forensic queries)',
    environment ENUM('ALL','DEVELOPMENT','TESTING','STAGING','PRODUCTION') NOT NULL COMMENT 'Environment at time of change',
    old_value TEXT NULL COMMENT 'Value before change (NULL for new configs)',
    new_value TEXT NOT NULL COMMENT 'Value after change',
    old_version INT UNSIGNED NULL COMMENT 'Version before change',
    new_version INT UNSIGNED NOT NULL COMMENT 'Version after change',
    change_type ENUM('CREATE','UPDATE','DELETE','RESTORE','OVERRIDE','ROLLBACK','SCHEDULED_ACTIVATE','SCHEDULED_DEACTIVATE') NOT NULL COMMENT 'Change classification',
    changed_by BIGINT UNSIGNED NOT NULL COMMENT 'FK to admin who made the change',
    change_reason TEXT NULL COMMENT 'Reason for the change',
    change_source ENUM('MANUAL','API','OVERRIDE','MIGRATION','IMPORT','SCHEDULED','SYSTEM') NOT NULL DEFAULT 'MANUAL' COMMENT 'How the change was triggered',
    ip_address VARCHAR(45) NOT NULL COMMENT 'Admin IP at time of change',
    session_id VARCHAR(128) NULL COMMENT 'Admin session',
    rollback_available BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Can be rolled back',
    rolled_back BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Has been rolled back',
    rolled_back_to_id BIGINT UNSIGNED NULL COMMENT 'FK to the history entry rolled back to',
    change_time DATETIME NOT NULL COMMENT 'Exact change timestamp',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_scc_ch_uid UNIQUE (history_uid),
    CONSTRAINT fk_scc_ch_config FOREIGN KEY (config_id) REFERENCES scc_system_configurations (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_scc_ch_changed FOREIGN KEY (changed_by) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_scc_ch_rollback FOREIGN KEY (rolled_back_to_id) REFERENCES scc_configuration_history (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_ch_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Immutable config change history with rollback tracking, source attribution, and version chain';

-- =====================================================================================
-- 18.9 SCC MODULE DEPENDENCIES (Module Dependency Graph)
-- =====================================================================================
CREATE TABLE scc_module_dependencies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique dependency record identifier',
    dependency_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external reference',
    module_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to scc_module_registry — dependent module',
    module_code VARCHAR(80) NOT NULL COMMENT 'Dependent module code (denormalized)',
    depends_on_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to scc_module_registry — required module',
    depends_on_code VARCHAR(80) NOT NULL COMMENT 'Required module code (denormalized)',
    dependency_type ENUM('REQUIRED','OPTIONAL','RECOMMENDED','CONFLICTING','ENHANCES') NOT NULL DEFAULT 'REQUIRED' COMMENT 'Dependency relationship type',
    version_constraint VARCHAR(50) NULL COMMENT 'SemVer constraint (e.g., >=1.0.0, ^2.0)',
    min_version VARCHAR(30) NULL COMMENT 'Minimum required version',
    max_version VARCHAR(30) NULL COMMENT 'Maximum compatible version',
    load_order_offset INT NOT NULL DEFAULT 0 COMMENT 'Offset from dependency load order (+1 = load after)',
    is_runtime BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Required at runtime (vs install-time only)',
    failure_action ENUM('BLOCK','WARN','SKIP','DEGRADE') NOT NULL DEFAULT 'BLOCK' COMMENT 'Action if dependency is unmet',
    status ENUM('SATISFIED','UNSATISFIED','CONFLICT','DEGRADED','UNKNOWN') NOT NULL DEFAULT 'SATISFIED' COMMENT 'Current dependency status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_scc_md_uid UNIQUE (dependency_uid),
    CONSTRAINT uq_scc_md_pair UNIQUE (module_id, depends_on_id),
    CONSTRAINT fk_scc_md_module FOREIGN KEY (module_id) REFERENCES scc_module_registry (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_scc_md_depends FOREIGN KEY (depends_on_id) REFERENCES scc_module_registry (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_scc_md_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_md_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_md_deleted FOREIGN KEY (deleted_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Module dependency graph with SemVer constraints, load ordering, and failure action policies';

-- =====================================================================================
-- 18.10 SCC SYSTEM HEALTH RULES (System Monitoring Rules Engine)
-- =====================================================================================
CREATE TABLE scc_system_health_rules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique health rule identifier',
    rule_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external reference',
    rule_code VARCHAR(80) NOT NULL COMMENT 'Machine-readable rule code (e.g., HLT-CPU-HIGH)',
    rule_name VARCHAR(200) NOT NULL COMMENT 'Human-readable rule name',
    rule_description TEXT NULL COMMENT 'Description of what this rule monitors',
    metric_name VARCHAR(150) NOT NULL COMMENT 'Metric to monitor (e.g., cpu_usage_percent)',
    metric_source ENUM('INFRASTRUCTURE','DATABASE','API','APPLICATION','SECURITY','NOTIFICATION','CACHE','STORAGE','CUSTOM') NOT NULL DEFAULT 'INFRASTRUCTURE' COMMENT 'Metric source category',
    threshold_value DECIMAL(15,4) NOT NULL COMMENT 'Threshold value for comparison',
    comparison_operator ENUM('GREATER_THAN','LESS_THAN','EQUAL_TO','NOT_EQUAL','GREATER_OR_EQUAL','LESS_OR_EQUAL','BETWEEN','NOT_BETWEEN') NOT NULL DEFAULT 'GREATER_THAN' COMMENT 'Comparison operator',
    threshold_secondary DECIMAL(15,4) NULL COMMENT 'Secondary threshold (for BETWEEN comparisons)',
    evaluation_window_seconds INT UNSIGNED NOT NULL DEFAULT 300 COMMENT 'Time window for metric evaluation (seconds)',
    consecutive_breaches INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Number of consecutive breaches before action',
    action_on_breach ENUM('ALERT','LOG','NOTIFY','SCALE','RESTART','DEGRADE','LOCKDOWN','CUSTOM') NOT NULL DEFAULT 'ALERT' COMMENT 'Automated response on breach',
    notification_targets JSON NULL COMMENT 'JSON array of user/role IDs to notify on breach',
    notification_cooldown_minutes INT UNSIGNED NOT NULL DEFAULT 30 COMMENT 'Minimum minutes between repeated notifications',
    severity_level ENUM('INFO','WARNING','ERROR','CRITICAL','EMERGENCY') NOT NULL DEFAULT 'WARNING' COMMENT 'Breach severity',
    affected_module VARCHAR(80) NULL COMMENT 'Module this rule monitors',
    auto_resolve BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Auto-resolve when metric returns to normal',
    last_evaluated_at DATETIME NULL COMMENT 'Last rule evaluation timestamp',
    last_breach_at DATETIME NULL COMMENT 'Last breach detected timestamp',
    current_value DECIMAL(15,4) NULL COMMENT 'Most recent metric value',
    breach_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total breach count',
    rule_status ENUM('ACTIVE','DISABLED','TRIGGERED','SUPPRESSED','TESTING') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Rule lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_scc_shr_uid UNIQUE (rule_uid),
    CONSTRAINT uq_scc_shr_code UNIQUE (rule_code),
    CONSTRAINT fk_scc_shr_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_shr_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_scc_shr_deleted FOREIGN KEY (deleted_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'System health monitoring rules with threshold evaluation, consecutive breach tracking, and auto-resolve';


-- =====================================================================================
-- MODULE 18: PERFORMANCE INDEXES
-- =====================================================================================

-- scc_system_configurations indexes
CREATE INDEX idx_scc_sc_key ON scc_system_configurations (config_key);
CREATE INDEX idx_scc_sc_type ON scc_system_configurations (config_type);
CREATE INDEX idx_scc_sc_category ON scc_system_configurations (config_category);
CREATE INDEX idx_scc_sc_env ON scc_system_configurations (environment);
CREATE INDEX idx_scc_sc_scope ON scc_system_configurations (module_scope);
CREATE INDEX idx_scc_sc_status ON scc_system_configurations (status);
CREATE INDEX idx_scc_sc_sensitive ON scc_system_configurations (is_sensitive);
CREATE INDEX idx_scc_sc_created ON scc_system_configurations (created_at);
CREATE INDEX idx_scc_sc_key_env ON scc_system_configurations (config_key, environment);
CREATE INDEX idx_scc_sc_cat_scope ON scc_system_configurations (config_category, module_scope);
CREATE INDEX idx_scc_sc_env_scope ON scc_system_configurations (environment, module_scope);

-- scc_module_registry indexes
CREATE INDEX idx_scc_mr_code ON scc_module_registry (module_code);
CREATE INDEX idx_scc_mr_name ON scc_module_registry (module_name);
CREATE INDEX idx_scc_mr_category ON scc_module_registry (module_category);
CREATE INDEX idx_scc_mr_status ON scc_module_registry (module_status);
CREATE INDEX idx_scc_mr_health ON scc_module_registry (health_status);
CREATE INDEX idx_scc_mr_priority ON scc_module_registry (priority_level);
CREATE INDEX idx_scc_mr_core ON scc_module_registry (is_core);
CREATE INDEX idx_scc_mr_created ON scc_module_registry (created_at);
CREATE INDEX idx_scc_mr_status_health ON scc_module_registry (module_status, health_status);

-- scc_feature_flags indexes
CREATE INDEX idx_scc_ff_key ON scc_feature_flags (feature_key);
CREATE INDEX idx_scc_ff_module ON scc_feature_flags (module_id);
CREATE INDEX idx_scc_ff_module_name ON scc_feature_flags (module_name);
CREATE INDEX idx_scc_ff_enabled ON scc_feature_flags (enabled);
CREATE INDEX idx_scc_ff_env ON scc_feature_flags (environment);
CREATE INDEX idx_scc_ff_strategy ON scc_feature_flags (rollout_strategy);
CREATE INDEX idx_scc_ff_status ON scc_feature_flags (status);
CREATE INDEX idx_scc_ff_kill ON scc_feature_flags (kill_switch);
CREATE INDEX idx_scc_ff_created ON scc_feature_flags (created_at);
CREATE INDEX idx_scc_ff_key_enabled ON scc_feature_flags (feature_key, enabled);
CREATE INDEX idx_scc_ff_env_enabled ON scc_feature_flags (environment, enabled);

-- scc_environment_settings indexes
CREATE INDEX idx_scc_es_env ON scc_environment_settings (environment_name);
CREATE INDEX idx_scc_es_security ON scc_environment_settings (security_level);
CREATE INDEX idx_scc_es_status ON scc_environment_settings (status);
CREATE INDEX idx_scc_es_primary ON scc_environment_settings (is_primary);
CREATE INDEX idx_scc_es_maintenance ON scc_environment_settings (maintenance_mode);
CREATE INDEX idx_scc_es_created ON scc_environment_settings (created_at);

-- scc_security_policies indexes
CREATE INDEX idx_scc_sp_code ON scc_security_policies (policy_code);
CREATE INDEX idx_scc_sp_type ON scc_security_policies (policy_type);
CREATE INDEX idx_scc_sp_category ON scc_security_policies (policy_category);
CREATE INDEX idx_scc_sp_enforcement ON scc_security_policies (enforcement_level);
CREATE INDEX idx_scc_sp_scope ON scc_security_policies (module_scope);
CREATE INDEX idx_scc_sp_compliance ON scc_security_policies (compliance_framework);
CREATE INDEX idx_scc_sp_status ON scc_security_policies (status);
CREATE INDEX idx_scc_sp_priority ON scc_security_policies (priority);
CREATE INDEX idx_scc_sp_created ON scc_security_policies (created_at);
CREATE INDEX idx_scc_sp_type_status ON scc_security_policies (policy_type, status);
CREATE INDEX idx_scc_sp_scope_enforcement ON scc_security_policies (module_scope, enforcement_level);

-- scc_admin_controls indexes
CREATE INDEX idx_scc_ac_admin ON scc_admin_controls (admin_id);
CREATE INDEX idx_scc_ac_action ON scc_admin_controls (action_type);
CREATE INDEX idx_scc_ac_module ON scc_admin_controls (target_module);
CREATE INDEX idx_scc_ac_risk ON scc_admin_controls (risk_level);
CREATE INDEX idx_scc_ac_audit ON scc_admin_controls (audit_log_id);
CREATE INDEX idx_scc_ac_time ON scc_admin_controls (action_time);
CREATE INDEX idx_scc_ac_created ON scc_admin_controls (created_at);
CREATE INDEX idx_scc_ac_admin_time ON scc_admin_controls (admin_id, action_time);
CREATE INDEX idx_scc_ac_action_time ON scc_admin_controls (action_type, action_time);

-- scc_system_overrides indexes
CREATE INDEX idx_scc_so_type ON scc_system_overrides (override_type);
CREATE INDEX idx_scc_so_applied ON scc_system_overrides (applied_by);
CREATE INDEX idx_scc_so_module ON scc_system_overrides (affected_module);
CREATE INDEX idx_scc_so_severity ON scc_system_overrides (severity);
CREATE INDEX idx_scc_so_status ON scc_system_overrides (override_status);
CREATE INDEX idx_scc_so_activated ON scc_system_overrides (activated_at);
CREATE INDEX idx_scc_so_expires ON scc_system_overrides (expires_at);
CREATE INDEX idx_scc_so_created ON scc_system_overrides (created_at);
CREATE INDEX idx_scc_so_type_status ON scc_system_overrides (override_type, override_status);
CREATE INDEX idx_scc_so_module_status ON scc_system_overrides (affected_module, override_status);

-- scc_configuration_history indexes
CREATE INDEX idx_scc_ch_config ON scc_configuration_history (config_id);
CREATE INDEX idx_scc_ch_key ON scc_configuration_history (config_key);
CREATE INDEX idx_scc_ch_env ON scc_configuration_history (environment);
CREATE INDEX idx_scc_ch_type ON scc_configuration_history (change_type);
CREATE INDEX idx_scc_ch_changed ON scc_configuration_history (changed_by);
CREATE INDEX idx_scc_ch_source ON scc_configuration_history (change_source);
CREATE INDEX idx_scc_ch_time ON scc_configuration_history (change_time);
CREATE INDEX idx_scc_ch_created ON scc_configuration_history (created_at);
CREATE INDEX idx_scc_ch_key_time ON scc_configuration_history (config_key, change_time);
CREATE INDEX idx_scc_ch_config_time ON scc_configuration_history (config_id, change_time);

-- scc_module_dependencies indexes
CREATE INDEX idx_scc_md_module ON scc_module_dependencies (module_id);
CREATE INDEX idx_scc_md_depends ON scc_module_dependencies (depends_on_id);
CREATE INDEX idx_scc_md_type ON scc_module_dependencies (dependency_type);
CREATE INDEX idx_scc_md_status ON scc_module_dependencies (status);
CREATE INDEX idx_scc_md_failure ON scc_module_dependencies (failure_action);
CREATE INDEX idx_scc_md_created ON scc_module_dependencies (created_at);
CREATE INDEX idx_scc_md_module_type ON scc_module_dependencies (module_id, dependency_type);

-- scc_system_health_rules indexes
CREATE INDEX idx_scc_shr_metric ON scc_system_health_rules (metric_name);
CREATE INDEX idx_scc_shr_source ON scc_system_health_rules (metric_source);
CREATE INDEX idx_scc_shr_severity ON scc_system_health_rules (severity_level);
CREATE INDEX idx_scc_shr_action ON scc_system_health_rules (action_on_breach);
CREATE INDEX idx_scc_shr_module ON scc_system_health_rules (affected_module);
CREATE INDEX idx_scc_shr_status ON scc_system_health_rules (rule_status);
CREATE INDEX idx_scc_shr_created ON scc_system_health_rules (created_at);
CREATE INDEX idx_scc_shr_metric_source ON scc_system_health_rules (metric_name, metric_source);
CREATE INDEX idx_scc_shr_status_severity ON scc_system_health_rules (rule_status, severity_level);

-- =====================================================================================
-- PHASE 2: RECOMMENDED ENHANCEMENTS
-- =====================================================================================

-- =====================================================================================
-- 2.1 WEBHOOK ENDPOINTS (External Integration Delivery)
-- =====================================================================================
CREATE TABLE webhook_endpoints (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique webhook endpoint identifier',
    webhook_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external reference',
    organization_id BIGINT UNSIGNED NULL COMMENT 'FK to organizations (NULL = system-wide)',
    endpoint_name VARCHAR(150) NOT NULL COMMENT 'Human-readable webhook name',
    endpoint_url VARCHAR(500) NOT NULL COMMENT 'Target URL for webhook delivery',
    http_method ENUM('POST','PUT','PATCH') NOT NULL DEFAULT 'POST' COMMENT 'HTTP method for delivery',
    secret_key VARCHAR(255) NOT NULL COMMENT 'HMAC secret for payload signing',
    content_type ENUM('APPLICATION_JSON','APPLICATION_XML','APPLICATION_FORM') NOT NULL DEFAULT 'APPLICATION_JSON' COMMENT 'Payload content type',
    event_types JSON NOT NULL COMMENT 'JSON array of subscribed event types',
    headers JSON NULL COMMENT 'Custom HTTP headers as JSON object',
    retry_count INT UNSIGNED NOT NULL DEFAULT 3 COMMENT 'Max retry attempts on failure',
    retry_delay_seconds INT UNSIGNED NOT NULL DEFAULT 60 COMMENT 'Delay between retries',
    timeout_seconds INT UNSIGNED NOT NULL DEFAULT 30 COMMENT 'Request timeout',
    last_triggered_at DATETIME NULL COMMENT 'Last successful delivery timestamp',
    last_failure_at DATETIME NULL COMMENT 'Last failed delivery timestamp',
    failure_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Consecutive failure count',
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Webhook active flag',
    status ENUM('ACTIVE','DISABLED','SUSPENDED','FAILED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Webhook lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_wh_uid UNIQUE (webhook_uid),
    CONSTRAINT fk_wh_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_wh_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_wh_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_wh_deleted FOREIGN KEY (deleted_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'External webhook endpoint subscriptions with retry, HMAC signing, and event filtering';

-- =====================================================================================
-- 2.2 WEBHOOK DELIVERY LOGS (Immutable Delivery Tracking)
-- =====================================================================================
CREATE TABLE webhook_delivery_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique delivery log identifier',
    delivery_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external correlation',
    webhook_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to webhook_endpoints',
    event_type VARCHAR(100) NOT NULL COMMENT 'Event type that triggered delivery',
    event_payload JSON NOT NULL COMMENT 'Full payload sent',
    request_url VARCHAR(500) NOT NULL COMMENT 'Target URL at time of delivery',
    request_headers JSON NULL COMMENT 'Headers sent with request',
    response_status_code INT UNSIGNED NULL COMMENT 'HTTP response status code',
    response_body TEXT NULL COMMENT 'Response body (truncated to 2KB)',
    response_time_ms INT UNSIGNED NULL COMMENT 'Response time in milliseconds',
    attempt_number INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Delivery attempt number',
    delivery_status ENUM('SUCCESS','FAILED','TIMEOUT','PENDING','RETRYING') NOT NULL DEFAULT 'PENDING' COMMENT 'Delivery outcome',
    error_message TEXT NULL COMMENT 'Error details on failure',
    delivered_at DATETIME NOT NULL COMMENT 'Delivery attempt timestamp',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_wdl_uid UNIQUE (delivery_uid),
    CONSTRAINT fk_wdl_webhook FOREIGN KEY (webhook_id) REFERENCES webhook_endpoints (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_wdl_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Immutable webhook delivery audit trail with response tracking and retry history';

-- =====================================================================================
-- 2.3 USER GROUPS (Group-Based Feature Targeting)
-- =====================================================================================
CREATE TABLE user_groups (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique user group identifier',
    group_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external reference',
    group_code VARCHAR(80) NOT NULL COMMENT 'Machine-readable group code',
    group_name VARCHAR(150) NOT NULL COMMENT 'Human-readable group name',
    group_description TEXT NULL COMMENT 'Group purpose and membership criteria',
    organization_id BIGINT UNSIGNED NULL COMMENT 'FK to organizations (NULL = system-wide)',
    group_type ENUM('STATIC','DYNAMIC','ROLE_BASED','DEPARTMENT_BASED','CUSTOM') NOT NULL DEFAULT 'STATIC' COMMENT 'Group membership type',
    membership_rule JSON NULL COMMENT 'Dynamic membership rule (e.g., {"role_id": [1,2], "department_id": [3]})',
    member_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Cached member count',
    max_members INT UNSIGNED NULL COMMENT 'Maximum group size (NULL = unlimited)',
    is_system BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'System-managed group (cannot be deleted)',
    status ENUM('ACTIVE','INACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Group lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_ug_uid UNIQUE (group_uid),
    CONSTRAINT uq_ug_code UNIQUE (group_code),
    CONSTRAINT fk_ug_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ug_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ug_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ug_deleted FOREIGN KEY (deleted_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'User groups for feature flag targeting, notification campaigns, and access policies';

-- =====================================================================================
-- 2.4 API KEYS (Service Account Management)
-- =====================================================================================
CREATE TABLE api_keys (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique API key identifier',
    key_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external reference',
    key_name VARCHAR(150) NOT NULL COMMENT 'Human-readable key name',
    key_prefix VARCHAR(10) NOT NULL COMMENT 'First 8 chars of key for identification (e.g., vms_live_)',
    key_hash VARCHAR(255) NOT NULL COMMENT 'Hashed API key (never store plaintext)',
    organization_id BIGINT UNSIGNED NULL COMMENT 'FK to organizations (NULL = system-wide)',
    user_id BIGINT UNSIGNED NULL COMMENT 'FK to user who owns this key',
    key_type ENUM('LIVE','TEST','SANDBOX','INTERNAL','WEBHOOK') NOT NULL DEFAULT 'LIVE' COMMENT 'Key environment type',
    scopes JSON NOT NULL COMMENT 'JSON array of granted API scopes',
    rate_limit_per_minute INT UNSIGNED NOT NULL DEFAULT 60 COMMENT 'Rate limit for this key',
    allowed_ips JSON NULL COMMENT 'JSON array of allowed IP addresses (NULL = any)',
    allowed_origins JSON NULL COMMENT 'JSON array of allowed CORS origins',
    expires_at DATETIME NULL COMMENT 'Key expiration (NULL = no expiry)',
    last_used_at DATETIME NULL COMMENT 'Last API call timestamp',
    last_used_ip VARCHAR(45) NULL COMMENT 'IP of last API call',
    total_requests BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total API calls made with this key',
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Key revocation flag',
    revoked_at DATETIME NULL COMMENT 'Revocation timestamp',
    revoked_by BIGINT UNSIGNED NULL COMMENT 'Admin who revoked the key',
    revocation_reason TEXT NULL COMMENT 'Reason for revocation',
    status ENUM('ACTIVE','EXPIRED','REVOKED','SUSPENDED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Key lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_ak_uid UNIQUE (key_uid),
    CONSTRAINT uq_ak_hash UNIQUE (key_hash),
    CONSTRAINT fk_ak_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ak_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ak_revoked FOREIGN KEY (revoked_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ak_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ak_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ak_deleted FOREIGN KEY (deleted_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'API key management with scoped permissions, rate limiting, IP restrictions, and usage tracking';

-- =====================================================================================
-- 2.5 REPORT SUBSCRIPTIONS (Scheduled Report Delivery)
-- =====================================================================================
CREATE TABLE report_subscriptions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique subscription identifier',
    subscription_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external reference',
    report_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to report_definitions',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to subscribing user',
    organization_id BIGINT UNSIGNED NULL COMMENT 'FK to organizations',
    delivery_channel ENUM('EMAIL','WEBHOOK','SFTP','S3','SLACK','TEAMS') NOT NULL DEFAULT 'EMAIL' COMMENT 'Delivery method',
    delivery_config JSON NULL COMMENT 'Channel-specific config (email address, webhook URL, etc.)',
    export_format ENUM('PDF','CSV','EXCEL','JSON','HTML') NOT NULL DEFAULT 'PDF' COMMENT 'Report output format',
    schedule_cron VARCHAR(100) NOT NULL COMMENT 'Cron expression for delivery schedule',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC' COMMENT 'Timezone for schedule evaluation',
    report_parameters JSON NULL COMMENT 'Saved report filter parameters',
    last_delivered_at DATETIME NULL COMMENT 'Last delivery timestamp',
    next_delivery_at DATETIME NULL COMMENT 'Next scheduled delivery',
    delivery_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total deliveries made',
    failure_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total delivery failures',
    status ENUM('ACTIVE','PAUSED','DISABLED','FAILED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Subscription status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_rs_uid UNIQUE (subscription_uid),
    CONSTRAINT fk_rs_report FOREIGN KEY (report_id) REFERENCES report_definitions (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rs_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rs_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_rs_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_rs_deleted FOREIGN KEY (deleted_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Scheduled report delivery subscriptions with multi-channel support and cron scheduling';

-- =====================================================================================
-- 2.6 DATA EXPORT JOBS (Async Bulk Export)
-- =====================================================================================
CREATE TABLE data_export_jobs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique export job identifier',
    job_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external reference',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to requesting user',
    organization_id BIGINT UNSIGNED NULL COMMENT 'FK to organizations',
    export_type ENUM('VISITORS','APPOINTMENTS','CHECKINS','AUDIT_LOGS','REPORTS','SECURITY_INCIDENTS','NOTIFICATIONS','USERS','CUSTOM') NOT NULL COMMENT 'Data entity to export',
    export_format ENUM('CSV','EXCEL','JSON','XML','PDF') NOT NULL DEFAULT 'CSV' COMMENT 'Output format',
    export_filters JSON NULL COMMENT 'Applied filters (date range, status, org, etc.)',
    export_columns JSON NULL COMMENT 'Selected columns for export',
    total_records INT UNSIGNED NULL COMMENT 'Total records matched',
    exported_records INT UNSIGNED NULL COMMENT 'Records successfully exported',
    file_path VARCHAR(500) NULL COMMENT 'Generated file path/URL',
    file_size_bytes BIGINT UNSIGNED NULL COMMENT 'Generated file size',
    file_checksum VARCHAR(64) NULL COMMENT 'SHA-256 checksum for integrity verification',
    download_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of times file was downloaded',
    download_expires_at DATETIME NULL COMMENT 'Download link expiration',
    started_at DATETIME NULL COMMENT 'Processing start time',
    completed_at DATETIME NULL COMMENT 'Processing completion time',
    error_message TEXT NULL COMMENT 'Error details on failure',
    job_status ENUM('QUEUED','PROCESSING','COMPLETED','FAILED','CANCELLED','EXPIRED') NOT NULL DEFAULT 'QUEUED' COMMENT 'Job lifecycle status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_dej_uid UNIQUE (job_uid),
    CONSTRAINT fk_dej_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_dej_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_dej_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_dej_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Async bulk data export job tracking with file management and download expiry';

-- =====================================================================================
-- PHASE 2: PERFORMANCE INDEXES
-- =====================================================================================

-- webhook_endpoints indexes
CREATE INDEX idx_wh_org ON webhook_endpoints (organization_id);
CREATE INDEX idx_wh_status ON webhook_endpoints (status);
CREATE INDEX idx_wh_enabled ON webhook_endpoints (is_enabled);
CREATE INDEX idx_wh_created ON webhook_endpoints (created_at);

-- webhook_delivery_logs indexes
CREATE INDEX idx_wdl_webhook ON webhook_delivery_logs (webhook_id);
CREATE INDEX idx_wdl_event ON webhook_delivery_logs (event_type);
CREATE INDEX idx_wdl_status ON webhook_delivery_logs (delivery_status);
CREATE INDEX idx_wdl_delivered ON webhook_delivery_logs (delivered_at);
CREATE INDEX idx_wdl_webhook_status ON webhook_delivery_logs (webhook_id, delivery_status);

-- user_groups indexes
CREATE INDEX idx_ug_org ON user_groups (organization_id);
CREATE INDEX idx_ug_type ON user_groups (group_type);
CREATE INDEX idx_ug_status ON user_groups (status);
CREATE INDEX idx_ug_created ON user_groups (created_at);

-- api_keys indexes
CREATE INDEX idx_ak_org ON api_keys (organization_id);
CREATE INDEX idx_ak_user ON api_keys (user_id);
CREATE INDEX idx_ak_prefix ON api_keys (key_prefix);
CREATE INDEX idx_ak_type ON api_keys (key_type);
CREATE INDEX idx_ak_status ON api_keys (status);
CREATE INDEX idx_ak_last_used ON api_keys (last_used_at);
CREATE INDEX idx_ak_org_status ON api_keys (organization_id, status);

-- report_subscriptions indexes
CREATE INDEX idx_rs_report ON report_subscriptions (report_id);
CREATE INDEX idx_rs_user ON report_subscriptions (user_id);
CREATE INDEX idx_rs_org ON report_subscriptions (organization_id);
CREATE INDEX idx_rs_status ON report_subscriptions (status);
CREATE INDEX idx_rs_next ON report_subscriptions (next_delivery_at);
CREATE INDEX idx_rs_user_status ON report_subscriptions (user_id, status);

-- data_export_jobs indexes
CREATE INDEX idx_dej_user ON data_export_jobs (user_id);
CREATE INDEX idx_dej_org ON data_export_jobs (organization_id);
CREATE INDEX idx_dej_type ON data_export_jobs (export_type);
CREATE INDEX idx_dej_status ON data_export_jobs (job_status);
CREATE INDEX idx_dej_created ON data_export_jobs (created_at);
CREATE INDEX idx_dej_user_status ON data_export_jobs (user_id, job_status);

-- =====================================================================================
-- PHASE 3: ENTERPRISE OPTIMIZATIONS
-- =====================================================================================

-- =====================================================================================
-- 3.1 DATA PURGE LOGS (Data Retention Compliance Audit)
-- =====================================================================================
-- IMMUTABLE: Purge logs are append-only for compliance evidence.
-- =====================================================================================
CREATE TABLE data_purge_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique purge log identifier',
    purge_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external reference',
    purge_policy_id BIGINT UNSIGNED NULL COMMENT 'FK to scc_security_policies for retention policy reference',
    target_table VARCHAR(120) NOT NULL COMMENT 'Table name that was purged',
    target_module VARCHAR(80) NOT NULL COMMENT 'Module owning the purged data',
    purge_type ENUM('SOFT_DELETE','HARD_DELETE','ARCHIVE','ANONYMIZE','TRUNCATE') NOT NULL COMMENT 'Type of purge operation',
    purge_criteria JSON NOT NULL COMMENT 'WHERE clause or criteria used for purge',
    records_affected BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of records purged',
    records_archived BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Records moved to archive (if applicable)',
    retention_days INT UNSIGNED NOT NULL COMMENT 'Retention period that triggered purge',
    compliance_framework ENUM('GDPR','HIPAA','CCPA','LGPD','POPIA','SOC2','INTERNAL') NOT NULL DEFAULT 'INTERNAL' COMMENT 'Compliance framework driving purge',
    execution_time_ms BIGINT UNSIGNED NULL COMMENT 'Purge execution duration',
    executed_by BIGINT UNSIGNED NULL COMMENT 'Admin who initiated or approved purge',
    execution_method ENUM('SCHEDULED','MANUAL','API','SYSTEM') NOT NULL DEFAULT 'SCHEDULED' COMMENT 'How purge was triggered',
    started_at DATETIME NOT NULL COMMENT 'Purge start timestamp',
    completed_at DATETIME NULL COMMENT 'Purge completion timestamp',
    error_message TEXT NULL COMMENT 'Error details if purge failed',
    purge_status ENUM('QUEUED','RUNNING','COMPLETED','FAILED','ROLLED_BACK') NOT NULL DEFAULT 'QUEUED' COMMENT 'Purge job status',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Retention flag',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_dpl_uid UNIQUE (purge_uid),
    CONSTRAINT fk_dpl_policy FOREIGN KEY (purge_policy_id) REFERENCES scc_security_policies (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_dpl_executed FOREIGN KEY (executed_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_dpl_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Immutable audit trail for data retention policy execution — GDPR/HIPAA compliance evidence';

-- =====================================================================================
-- 3.2 TRANSLATIONS (i18n Multi-Language Support)
-- =====================================================================================
CREATE TABLE translations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique translation identifier',
    translation_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external reference',
    locale VARCHAR(10) NOT NULL COMMENT 'Language-region code (e.g., en-US, pt-BR, fr-FR)',
    translation_key VARCHAR(255) NOT NULL COMMENT 'Dot-notation key (e.g., visitor.status.active)',
    translation_value TEXT NOT NULL COMMENT 'Translated string value',
    module_scope VARCHAR(80) NOT NULL DEFAULT 'GLOBAL' COMMENT 'Module this translation belongs to',
    context VARCHAR(150) NULL COMMENT 'UI context (e.g., button_label, page_title, error_message)',
    pluralization_rules JSON NULL COMMENT 'Pluralization variants as JSON',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Translation verified by linguist',
    verified_by BIGINT UNSIGNED NULL COMMENT 'User who verified the translation',
    version INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Translation version for cache busting',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_tr_uid UNIQUE (translation_uid),
    CONSTRAINT uq_tr_locale_key UNIQUE (locale, translation_key),
    CONSTRAINT fk_tr_verified FOREIGN KEY (verified_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_tr_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_tr_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_tr_deleted FOREIGN KEY (deleted_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Multi-language translation strings for full i18n support across all modules';

-- =====================================================================================
-- 3.3 ORGANIZATION BRANDING (White-Label Theming)
-- =====================================================================================
CREATE TABLE organization_branding (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique branding record identifier',
    branding_uid VARCHAR(64) NOT NULL COMMENT 'UUID for external reference',
    organization_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to organizations',
    primary_color VARCHAR(10) NOT NULL DEFAULT '#1976D2' COMMENT 'Primary brand color (hex)',
    secondary_color VARCHAR(10) NOT NULL DEFAULT '#424242' COMMENT 'Secondary brand color (hex)',
    accent_color VARCHAR(10) NOT NULL DEFAULT '#FF6F00' COMMENT 'Accent/highlight color (hex)',
    background_color VARCHAR(10) NOT NULL DEFAULT '#FFFFFF' COMMENT 'Page background color',
    text_color VARCHAR(10) NOT NULL DEFAULT '#212121' COMMENT 'Primary text color',
    logo_url VARCHAR(500) NULL COMMENT 'Organization logo URL',
    logo_dark_url VARCHAR(500) NULL COMMENT 'Logo variant for dark backgrounds',
    favicon_url VARCHAR(500) NULL COMMENT 'Favicon URL',
    login_background_url VARCHAR(500) NULL COMMENT 'Login page background image',
    badge_logo_url VARCHAR(500) NULL COMMENT 'Logo printed on visitor badges',
    font_family VARCHAR(100) NOT NULL DEFAULT 'Inter, system-ui, sans-serif' COMMENT 'Primary font family',
    custom_css TEXT NULL COMMENT 'Custom CSS overrides',
    email_header_html TEXT NULL COMMENT 'Custom email template header',
    email_footer_html TEXT NULL COMMENT 'Custom email template footer',
    kiosk_welcome_message TEXT NULL COMMENT 'Kiosk welcome screen message',
    default_locale VARCHAR(10) NOT NULL DEFAULT 'en-US' COMMENT 'Default locale for this organization',
    default_timezone VARCHAR(50) NOT NULL DEFAULT 'UTC' COMMENT 'Default timezone for this organization',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Soft-active flag',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT uq_ob_uid UNIQUE (branding_uid),
    CONSTRAINT uq_ob_org UNIQUE (organization_id),
    CONSTRAINT fk_ob_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ob_created FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ob_updated FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ob_deleted FOREIGN KEY (deleted_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Organization white-label branding with colors, logos, fonts, locale, and timezone settings';

-- =====================================================================================
-- PHASE 3: PERFORMANCE INDEXES
-- =====================================================================================

-- data_purge_logs indexes
CREATE INDEX idx_dpl_table ON data_purge_logs (target_table);
CREATE INDEX idx_dpl_module ON data_purge_logs (target_module);
CREATE INDEX idx_dpl_type ON data_purge_logs (purge_type);
CREATE INDEX idx_dpl_status ON data_purge_logs (purge_status);
CREATE INDEX idx_dpl_framework ON data_purge_logs (compliance_framework);
CREATE INDEX idx_dpl_started ON data_purge_logs (started_at);
CREATE INDEX idx_dpl_policy ON data_purge_logs (purge_policy_id);

-- translations indexes
CREATE INDEX idx_tr_locale ON translations (locale);
CREATE INDEX idx_tr_key ON translations (translation_key);
CREATE INDEX idx_tr_module ON translations (module_scope);
CREATE INDEX idx_tr_locale_module ON translations (locale, module_scope);

-- organization_branding indexes
CREATE INDEX idx_ob_org ON organization_branding (organization_id);
CREATE INDEX idx_ob_locale ON organization_branding (default_locale);

-- =====================================================================================
-- PHASE 3: COVERING INDEXES FOR HIGH-FREQUENCY QUERIES
-- =====================================================================================

-- Feature flag evaluation (hot path: check if flag is enabled for environment)
CREATE INDEX idx_scc_ff_eval ON scc_feature_flags (feature_key, environment, enabled, kill_switch);

-- Config lookup by key+env (hot path: system boot, API requests)
CREATE INDEX idx_scc_sc_lookup ON scc_system_configurations (config_key, environment, status);

-- Partitioning readiness comments (no ALTER in fresh schema — apply post-deployment):
-- NOTE: For tables exceeding 10M rows, implement RANGE partitioning by created_at:
--   alm_audit_logs, alm_api_request_logs, alm_user_activity_logs, webhook_delivery_logs
--   Requires PK change: PRIMARY KEY (id, created_at) for partition key inclusion.


-- =====================================================================================
-- PHASE 1 CRITICAL FIX: MULTI-TENANT ORGANIZATION INDEXES
-- =====================================================================================
CREATE INDEX idx_visitors_org ON visitors (organization_id);
CREATE INDEX idx_visitors_org_status ON visitors (organization_id, status);
CREATE INDEX idx_visitors_org_active ON visitors (organization_id, is_active);
CREATE INDEX idx_appointments_org ON appointments (organization_id);
CREATE INDEX idx_appointments_org_status ON appointments (organization_id, appointment_status);
CREATE INDEX idx_visitor_passes_org ON visitor_passes (organization_id);
CREATE INDEX idx_visitor_passes_visitor ON visitor_passes (visitor_id);
CREATE INDEX idx_visitor_passes_type ON visitor_passes (pass_type_id);
CREATE INDEX idx_checkins_org ON checkins (organization_id);
CREATE INDEX idx_checkins_visitor ON checkins (visitor_id);
CREATE INDEX idx_checkins_org_date ON checkins (organization_id, checked_in_at);


-- TRIGGERS
DELIMITER //

CREATE TRIGGER trg_visitor_checkouts_before_insert
BEFORE INSERT ON visitor_checkouts
FOR EACH ROW
BEGIN
    IF NEW.checkout_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.checkout_id = NEW.id;
        ELSE
            SET NEW.checkout_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_checkouts');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_checkouts_before_update
BEFORE UPDATE ON visitor_checkouts
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.checkout_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_asset_returns_before_insert
BEFORE INSERT ON visitor_asset_returns
FOR EACH ROW
BEGIN
    IF NEW.asset_return_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.asset_return_id = NEW.id;
        ELSE
            SET NEW.asset_return_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_asset_returns');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_asset_returns_before_update
BEFORE UPDATE ON visitor_asset_returns
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.asset_return_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_pass_returns_before_insert
BEFORE INSERT ON visitor_pass_returns
FOR EACH ROW
BEGIN
    IF NEW.pass_return_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.pass_return_id = NEW.id;
        ELSE
            SET NEW.pass_return_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visitor_pass_returns');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visitor_pass_returns_before_update
BEFORE UPDATE ON visitor_pass_returns
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.pass_return_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_checkout_verifications_before_insert
BEFORE INSERT ON checkout_verifications
FOR EACH ROW
BEGIN
    IF NEW.verification_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.verification_id = NEW.id;
        ELSE
            SET NEW.verification_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'checkout_verifications');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_checkout_verifications_before_update
BEFORE UPDATE ON checkout_verifications
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.verification_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_visit_durations_before_insert
BEFORE INSERT ON visit_durations
FOR EACH ROW
BEGIN
    IF NEW.visit_duration_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.visit_duration_id = NEW.id;
        ELSE
            SET NEW.visit_duration_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'visit_durations');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_visit_durations_before_update
BEFORE UPDATE ON visit_durations
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.visit_duration_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_checkout_exceptions_before_insert
BEFORE INSERT ON checkout_exceptions
FOR EACH ROW
BEGIN
    IF NEW.exception_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.exception_id = NEW.id;
        ELSE
            SET NEW.exception_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'checkout_exceptions');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_checkout_exceptions_before_update
BEFORE UPDATE ON checkout_exceptions
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.exception_id = NEW.id;
    END IF;
END;
//

CREATE TRIGGER trg_checkout_feedbacks_before_insert
BEFORE INSERT ON checkout_feedbacks
FOR EACH ROW
BEGIN
    IF NEW.feedback_id IS NULL THEN
        IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
            SET NEW.feedback_id = NEW.id;
        ELSE
            SET NEW.feedback_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'checkout_feedbacks');
        END IF;
    END IF;
END;
//

CREATE TRIGGER trg_checkout_feedbacks_before_update
BEFORE UPDATE ON checkout_feedbacks
FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SET NEW.feedback_id = NEW.id;
    END IF;
END;
//

-- Automated Duration Calculation Trigger
CREATE TRIGGER trg_visitor_checkouts_after_insert
AFTER INSERT ON visitor_checkouts
FOR EACH ROW
BEGIN
    DECLARE v_checkin_time DATETIME;
    DECLARE v_total_mins INT;
    DECLARE v_total_hours DECIMAL(6, 2);
    DECLARE v_overtime BOOLEAN;
    DECLARE v_category VARCHAR(30);

    -- Get checkin time from visitor_checkins
    SELECT checkin_time INTO v_checkin_time
    FROM visitor_checkins
    WHERE id = NEW.checkin_id;

    IF v_checkin_time IS NOT NULL THEN
        -- Calculate total minutes
        SET v_total_mins = TIMESTAMPDIFF(MINUTE, v_checkin_time, NEW.checkout_time);
        SET v_total_hours = v_total_mins / 60.0;
        
        -- Flag overtime if checkout exceeds expected checkout time
        IF NEW.expected_checkout_time IS NOT NULL AND NEW.checkout_time > NEW.expected_checkout_time THEN
            SET v_overtime = TRUE;
        ELSE
            SET v_overtime = FALSE;
        END IF;

        -- Categorize duration
        IF v_total_mins <= 60 THEN
            SET v_category = 'SHORT_STAY';
        ELSEIF v_total_mins <= 480 THEN
            SET v_category = 'STANDARD_STAY';
        ELSEIF v_overtime = TRUE THEN
            SET v_category = 'OVERTIME';
        ELSE
            SET v_category = 'LONG_STAY';
        END IF;

        -- Insert into visit_durations table
        INSERT INTO visit_durations (
            checkout_id, checkin_id, checkin_time, checkout_time,
            total_minutes, total_hours, is_overtime, duration_category,
            created_by
        ) VALUES (
            NEW.id, NEW.checkin_id, v_checkin_time, NEW.checkout_time,
            v_total_mins, v_total_hours, v_overtime, v_category,
            NEW.created_by
        );
    END IF;
END;
//

-- Pass Deactivation Integration Trigger
CREATE TRIGGER trg_visitor_pass_returns_after_insert
AFTER INSERT ON visitor_pass_returns
FOR EACH ROW
BEGIN
    -- Update visitor pass status in visitor_passes table
    UPDATE visitor_passes 
    SET status = 'REVOKED', updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.visitor_pass_id;
END;
//

DELIMITER ;

-- =====================================================================================
-- 25. CALENDARS, SCHEDULES & INTEGRATION SETTINGS MODULE
-- =====================================================================================

CREATE TABLE IF NOT EXISTS business_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique schedule identifier',
  organization_id INT NOT NULL COMMENT 'Reference to Organization',
  branch_id INT NULL COMMENT 'Reference to branch location (optional override)',
  timezone VARCHAR(100) DEFAULT 'Africa/Addis_Ababa' COMMENT 'Primary timezone key',
  start_date DATE NOT NULL COMMENT 'First active date of schedule',
  end_date DATE NULL COMMENT 'End date of schedule (null if indefinite)',
  weekly_schedule TEXT NOT NULL COMMENT 'JSON payload representing Mon-Sun hours configuration',
  status VARCHAR(20) DEFAULT 'ACTIVE' COMMENT 'Active or overridden status state',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Business hours schedule profiles';

CREATE TABLE IF NOT EXISTS holidays (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique holiday identifier',
  name VARCHAR(255) NOT NULL COMMENT 'Descriptive holiday name',
  type VARCHAR(50) NOT NULL COMMENT 'Category of closure: PUBLIC, ORGANIZATION, BRANCH, EMERGENCY',
  date DATE NOT NULL COMMENT 'Calendar holiday date',
  applies_to VARCHAR(50) DEFAULT 'ALL' COMMENT 'Exempt scopes: ALL, BRANCH_ONLY',
  organization_id INT NOT NULL COMMENT 'Reference to Organization',
  branch_id INT NULL COMMENT 'Target branch identifier overrides',
  status VARCHAR(20) DEFAULT 'ACTIVE' COMMENT 'Active or suspended state flag',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Official holiday calendar exclusion dates';

CREATE TABLE IF NOT EXISTS special_working_days (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique exception day identifier',
  date DATE NOT NULL COMMENT 'Calendar exception date',
  reason VARCHAR(255) NOT NULL COMMENT 'Description of exemption reason',
  opening_time VARCHAR(10) NOT NULL COMMENT 'Custom opening time',
  closing_time VARCHAR(10) NOT NULL COMMENT 'Custom closing time',
  applies_to VARCHAR(50) DEFAULT 'ALL' COMMENT 'Exempt scopes',
  organization_id INT NOT NULL COMMENT 'Reference to Organization',
  branch_id INT NULL COMMENT 'Branch target override code'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Non-standard working days exceptions';

CREATE TABLE IF NOT EXISTS timezone_settings (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique timezone map identifier',
  organization_id INT NOT NULL COMMENT 'Reference to Organization',
  branch_id INT NULL COMMENT 'Branch scope code override',
  timezone VARCHAR(100) NOT NULL COMMENT 'TimeZone name identifier',
  utc_offset VARCHAR(20) NOT NULL COMMENT 'Offset string from UTC',
  dst BOOLEAN DEFAULT FALSE COMMENT 'Daylight savings status active'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Timezone custom parameters mapping';

/*
CREATE TABLE IF NOT EXISTS organization_settings (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique settings parameter link',
  organization_id INT NOT NULL COMMENT 'Reference to Organization',
  category VARCHAR(50) NOT NULL COMMENT 'Category group mapping code',
  settings_value TEXT NOT NULL COMMENT 'JSON string mapping configuration keys',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  UNIQUE KEY unique_org_category (organization_id, category)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Category configuration profiles';
*/

CREATE TABLE IF NOT EXISTS settings_change_history (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique audit entry ID',
  setting VARCHAR(100) NOT NULL COMMENT 'Modified property label',
  prev_value TEXT NOT NULL COMMENT 'Old field value representation',
  new_value TEXT NOT NULL COMMENT 'New field value representation',
  changed_by VARCHAR(100) NOT NULL COMMENT 'Author of change',
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Change timestamp',
  reason TEXT NULL COMMENT 'Descriptive editor update reason'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Settings changes audit logs';

CREATE TABLE IF NOT EXISTS settings_backups (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique backup link ID',
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Backup timestamp',
  size VARCHAR(50) NOT NULL COMMENT 'Formatted backup file size',
  created_by VARCHAR(100) NOT NULL COMMENT 'Author of snapshot',
  status VARCHAR(50) DEFAULT 'COMPLETED' COMMENT 'Snapshot creation state',
  snapshot MEDIUMTEXT COMMENT 'Full JSON dump representing active configurations'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Configuration snapshots logs';

-- =====================================================================================
-- MODULE 4.2 VISITOR REGISTRATION EXTENSIONS & TABLES
-- =====================================================================================

ALTER TABLE visitors
  ADD COLUMN visitor_code VARCHAR(50) NULL AFTER visitor_id,
  ADD COLUMN reference_number VARCHAR(50) NULL AFTER visitor_code,
  ADD COLUMN marital_status ENUM('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'OTHER') NULL AFTER nationality,
  ADD COLUMN alt_phone VARCHAR(30) NULL AFTER phone,
  ADD COLUMN alt_email VARCHAR(150) NULL AFTER email,
  ADD COLUMN branch_id BIGINT UNSIGNED NULL AFTER organization_id,
  ADD COLUMN department_id BIGINT UNSIGNED NULL AFTER branch_id,
  ADD COLUMN purpose_of_visit VARCHAR(255) NULL AFTER category,
  ADD COLUMN expected_visit_type VARCHAR(50) NULL AFTER purpose_of_visit,
  ADD COLUMN expected_arrival_time DATETIME NULL AFTER expected_visit_type,
  ADD COLUMN expected_departure_time DATETIME NULL AFTER expected_arrival_time,
  ADD COLUMN host_employee_id BIGINT UNSIGNED NULL AFTER expected_departure_time,
  ADD CONSTRAINT uq_visitor_code UNIQUE (visitor_code),
  ADD CONSTRAINT uq_reference_number UNIQUE (reference_number);

ALTER TABLE visitor_addresses
  ADD COLUMN sub_city VARCHAR(100) NULL AFTER city,
  ADD COLUMN zone VARCHAR(100) NULL AFTER sub_city,
  ADD COLUMN woreda VARCHAR(100) NULL AFTER zone;

ALTER TABLE visitor_documents
  ADD COLUMN file_name VARCHAR(255) NULL AFTER document_url,
  ADD COLUMN file_size INT UNSIGNED NULL AFTER file_name,
  ADD COLUMN mime_type VARCHAR(100) NULL AFTER file_size,
  ADD COLUMN issuing_country VARCHAR(100) NULL AFTER issuing_authority;

CREATE TABLE IF NOT EXISTS visitor_vehicles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    visitor_id BIGINT UNSIGNED NOT NULL,
    license_plate VARCHAR(30) NOT NULL,
    vehicle_type VARCHAR(50) NULL,
    brand VARCHAR(80) NULL,
    model VARCHAR(80) NULL,
    color VARCHAR(50) NULL,
    parking_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    deleted_by BIGINT UNSIGNED NULL,
    CONSTRAINT fk_vv_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_vv_plate (license_plate)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Stores visitor vehicle records';

CREATE TABLE IF NOT EXISTS visitor_registration_drafts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    draft_id VARCHAR(100) NOT NULL UNIQUE,
    user_id BIGINT UNSIGNED NULL,
    current_step INT NOT NULL DEFAULT 1,
    form_data JSON NOT NULL,
    status ENUM('DRAFT', 'SUBMITTED', 'DISCARDED') DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_vrd_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Draft registrations for multi-step visitor wizard';

-- =====================================================================================
-- CONSOLIDATED EXTENSION MODULES (Profiles, RBAC Responsibilities, Categories, Verification & History)
-- =====================================================================================

-- Manager Profiles Table
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
    CONSTRAINT fk_mgr_dept FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL,
    INDEX idx_mgr_number (manager_number)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT='Manager Profiles';

-- Receptionist Profiles Table
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
    CONSTRAINT fk_rec_supervisor FOREIGN KEY (supervisor_user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_rec_number (receptionist_number)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT='Receptionist Profiles';

-- Security Profiles Table
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
    CONSTRAINT fk_sec_supervisor FOREIGN KEY (supervisor_user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_sec_number (security_number)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT='Security Profiles';

-- Administrator Profiles Table
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
    CONSTRAINT fk_adm_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_adm_number (admin_number)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT='Administrator Profiles';

-- Verification Requests Table
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
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT='User Verification Requests';

-- Responsibilities Table
CREATE TABLE IF NOT EXISTS responsibilities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    responsibility_id BIGINT UNSIGNED NULL UNIQUE,
    responsibility_code VARCHAR(50) NOT NULL UNIQUE,
    responsibility_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RBAC Responsibilities';

-- Role Responsibilities Junction Table
CREATE TABLE IF NOT EXISTS role_responsibilities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    responsibility_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_role_resp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_role_resp_resp FOREIGN KEY (responsibility_id) REFERENCES responsibilities(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_role_responsibility UNIQUE (role_id, responsibility_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Role Responsibilities Mapping';

-- Responsibility Permissions Junction Table
CREATE TABLE IF NOT EXISTS responsibility_permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    responsibility_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resp_perm_resp FOREIGN KEY (responsibility_id) REFERENCES responsibilities(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_resp_perm_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_responsibility_permission UNIQUE (responsibility_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Responsibility Permissions Mapping';

-- UI Resources Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Protected UI Resources & Routes';

-- Permission Resources Junction Table
CREATE TABLE IF NOT EXISTS permission_resources (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    permission_id BIGINT UNSIGNED NOT NULL,
    resource_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_perm_res_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_perm_res_res FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_permission_resource UNIQUE (permission_id, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Permission Resource Mapping';

-- Visitor Identity Verifications Table
CREATE TABLE IF NOT EXISTS visitor_identity_verifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique verification log ID',
    verification_session_id VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique session reference key',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to visitor profile',
    doc_type VARCHAR(50) NOT NULL COMMENT 'Document type: National ID, Passport, Driving License, Government ID, Employee ID',
    front_image_url LONGTEXT NULL COMMENT 'URL or base64 of front document image',
    back_image_url LONGTEXT NULL COMMENT 'URL or base64 of back document image',
    selfie_image_url LONGTEXT NULL COMMENT 'URL or base64 of live selfie image',
    image_quality_json JSON NULL COMMENT 'Crop, blur, glare, rotation quality metrics',
    ocr_data_json JSON NULL COMMENT 'Extracted full_name, id_number, dob, gender, nationality, issue/expiry dates, country',
    liveness_challenges_json JSON NULL COMMENT 'Randomized visual challenge logs',
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
    CONSTRAINT fk_viv_user FOREIGN KEY (verified_by) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_viv_visitor (visitor_id),
    INDEX idx_viv_status (final_status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Enterprise identity verification session history';

-- Visitor Profile History Table
CREATE TABLE IF NOT EXISTS visitor_profile_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique history entry ID',
    visitor_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to the visitor record',
    user_id BIGINT UNSIGNED NULL COMMENT 'User who performed the change',
    action VARCHAR(100) NOT NULL COMMENT 'Action type',
    field_changed VARCHAR(100) NULL COMMENT 'Name of the field that changed',
    old_value TEXT NULL COMMENT 'Previous field value',
    new_value TEXT NULL COMMENT 'Updated field value',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp of change',
    CONSTRAINT fk_vph_visitor FOREIGN KEY (visitor_id) REFERENCES visitors (id) ON DELETE CASCADE,
    CONSTRAINT fk_vph_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_vph_visitor (visitor_id),
    INDEX idx_vph_created_at (created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Field-level profile change log for visitors';

-- Visitor Categories Table
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

-- Visitor Category Documents Table
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

-- Visitor Category Workflows Table
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

-- Visitor Category Access Levels Table
CREATE TABLE IF NOT EXISTS visitor_category_access_levels (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NOT NULL,
  location_name VARCHAR(100) NOT NULL,
  is_granted BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vcal_category FOREIGN KEY (category_id) REFERENCES visitor_categories(id) ON DELETE CASCADE,
  INDEX idx_vcal_cat (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Access Level Locations per Category';

-- Document Statuses Table
CREATE TABLE IF NOT EXISTS document_statuses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    status_code VARCHAR(50) NOT NULL UNIQUE,
    status_name VARCHAR(100) NOT NULL,
    color_badge VARCHAR(30) DEFAULT 'primary',
    description TEXT NULL,
    is_system_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Enterprise Document Status Registry';

-- Visitor Document Verifications Table
CREATE TABLE IF NOT EXISTS visitor_document_verifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT UNSIGNED NOT NULL,
    visitor_id BIGINT UNSIGNED NULL,
    verification_status VARCHAR(50) NOT NULL,
    verification_method VARCHAR(50) DEFAULT 'MANUAL',
    checklist_json JSON NULL,
    remarks TEXT NULL,
    verified_by BIGINT UNSIGNED NULL,
    verified_by_name VARCHAR(150) NULL,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vdv_doc (document_id),
    INDEX idx_vdv_visitor (visitor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Document Verification Audit Logs';

-- Visitor Document Approvals Table
CREATE TABLE IF NOT EXISTS visitor_document_approvals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT UNSIGNED NOT NULL,
    stage VARCHAR(50) NOT NULL DEFAULT 'Review',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    reviewer_id BIGINT UNSIGNED NULL,
    reviewer_name VARCHAR(150) NULL,
    comments TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vda_doc (document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Document Approval Workflow History';

-- Visitor Document Download Logs Table
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

-- Visitor Document Audit Logs Table
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

-- Document Version History Table
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

-- Visitor Histories Table
CREATE TABLE IF NOT EXISTS visitor_histories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    history_code VARCHAR(50) NOT NULL UNIQUE,
    organization_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
    visitor_id BIGINT UNSIGNED NULL,
    appointment_id BIGINT UNSIGNED NULL,
    pass_id BIGINT UNSIGNED NULL,
    checkin_id BIGINT UNSIGNED NULL,
    checkout_id BIGINT UNSIGNED NULL,
    reference_number VARCHAR(100) NULL,
    visitor_photo LONGTEXT NULL,
    visitor_name VARCHAR(150) NOT NULL,
    visitor_email VARCHAR(150) NULL,
    visitor_phone VARCHAR(50) NULL,
    visitor_company VARCHAR(150) NULL,
    visitor_category VARCHAR(100) NULL,
    host_employee_id BIGINT UNSIGNED NULL,
    host_employee_name VARCHAR(150) NULL,
    department_id BIGINT UNSIGNED NULL,
    department_name VARCHAR(150) NULL,
    branch_id BIGINT UNSIGNED NULL,
    branch_name VARCHAR(150) NULL,
    appointment_number VARCHAR(100) NULL,
    visit_purpose VARCHAR(255) NULL,
    meeting_location VARCHAR(255) NULL,
    appointment_date DATE NULL,
    checkin_time DATETIME NULL,
    checkout_time DATETIME NULL,
    visit_duration_minutes INT NULL,
    pass_number VARCHAR(100) NULL,
    visit_status VARCHAR(50) NOT NULL DEFAULT 'Completed',
    identity_type VARCHAR(100) NULL,
    identity_number VARCHAR(100) NULL,
    verification_status VARCHAR(50) NULL,
    completed_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vh_visitor (visitor_id),
    INDEX idx_vh_appointment (appointment_id),
    INDEX idx_vh_dept (department_id),
    INDEX idx_vh_status (visit_status),
    INDEX idx_vh_completed (completed_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Visitor Historical Activity Archive';

-- =====================================================================================
-- CONSOLIDATED COMMUNICATION, RECEPTION & NOTIFICATION MODULES
-- =====================================================================================

-- System Announcements Table
CREATE TABLE IF NOT EXISTS system_announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT='System Announcements';

-- Visitor Queues Table
CREATE TABLE IF NOT EXISTS visitor_queues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    queue_number VARCHAR(50) NOT NULL UNIQUE,
    visitor_id INT NULL,
    visitor_name VARCHAR(255) NOT NULL,
    visitor_company VARCHAR(255) NULL,
    appointment_id INT NULL,
    appointment_number VARCHAR(50) NULL,
    host_id INT NULL,
    host_name VARCHAR(255) NULL,
    reception_counter VARCHAR(100) DEFAULT 'Lobby Counter 1',
    arrival_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    called_time DATETIME NULL,
    meeting_start_time DATETIME NULL,
    completed_time DATETIME NULL,
    priority VARCHAR(50) DEFAULT 'NORMAL',
    status VARCHAR(50) DEFAULT 'WAITING',
    notes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT='Reception Visitor Queue Management';

-- Reception Activity Logs Table
CREATE TABLE IF NOT EXISTS reception_activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    details TEXT NULL,
    receptionist_id INT NULL,
    receptionist_name VARCHAR(255) NULL,
    visitor_id INT NULL,
    visitor_name VARCHAR(255) NULL,
    appointment_id INT NULL,
    ip_address VARCHAR(50) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT='Reception Operations Activity Logs';

-- Notification Delivery Tracking Table
CREATE TABLE IF NOT EXISTS notification_delivery (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    notification_id BIGINT UNSIGNED NOT NULL,
    channel VARCHAR(30) NOT NULL,
    status ENUM('queued','sending','sent','delivered','read','archived','failed','retrying','cancelled') DEFAULT 'queued',
    attempt_count INT DEFAULT 1,
    last_error TEXT NULL,
    delivered_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_delivery_notif FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT='Notification Channel Delivery Logs';

-- Message Threads Table
CREATE TABLE IF NOT EXISTS message_threads (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    visitor_id BIGINT UNSIGNED NOT NULL,
    recipient_id BIGINT UNSIGNED NOT NULL,
    recipient_role ENUM('employee', 'receptionist', 'support') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status ENUM('active', 'closed', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_thread_visitor FOREIGN KEY (visitor_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_thread_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT='Direct Messaging Threads';

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    thread_id BIGINT UNSIGNED NOT NULL,
    sender_id BIGINT UNSIGNED NOT NULL,
    sender_role VARCHAR(50) NOT NULL,
    recipient_id BIGINT UNSIGNED NOT NULL,
    recipient_role VARCHAR(50) NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_msg_thread FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT='Visitor & Staff Communication Messages';

-- Message Attachments Table
CREATE TABLE IF NOT EXISTS message_attachments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    message_id BIGINT UNSIGNED NOT NULL,
    attachment_type ENUM('image', 'pdf', 'visitor_pass', 'document') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_att_msg FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT='Message File Attachments';

-- Notification Audit Logs Table
CREATE TABLE IF NOT EXISTS notification_audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    notification_id BIGINT UNSIGNED NULL,
    user_id BIGINT UNSIGNED NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NULL,
    ip_address VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT='Notification System Audit Logs';

-- Re-enable FK checks after all tables and triggers are created
SET FOREIGN_KEY_CHECKS = 1;