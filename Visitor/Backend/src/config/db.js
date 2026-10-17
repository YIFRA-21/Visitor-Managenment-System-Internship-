const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

let pool;
let useMock = false;
let originalQuery;

try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3307'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Yetm@1234',
    database: process.env.DB_NAME || 'visitor_db',
    waitForConnections: true,
    connectionLimit: 20, // Enterprise production pool size
    queueLimit: 0,
    dateStrings: true,
    connectTimeout: 20000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
  originalQuery = pool.query.bind(pool);
  useMock = false;
  console.log('Database connection pool initialized (MySQL database active).');

  (async () => {
    try {
      const alterQueries = [
        `ALTER TABLE organization_branches ADD COLUMN branch_type VARCHAR(50) DEFAULT 'OFFICE'`,
        `ALTER TABLE organization_branches ADD COLUMN email VARCHAR(150) NULL`,
        `ALTER TABLE organization_branches ADD COLUMN phone VARCHAR(50) NULL`,
        `ALTER TABLE organization_branches ADD COLUMN website VARCHAR(255) NULL`,
        `ALTER TABLE organization_branches ADD COLUMN country VARCHAR(100) NULL`,
        `ALTER TABLE organization_branches ADD COLUMN region VARCHAR(100) NULL`,
        `ALTER TABLE organization_branches ADD COLUMN city VARCHAR(100) NULL`,
        `ALTER TABLE organization_branches ADD COLUMN sub_city VARCHAR(100) NULL`,
        `ALTER TABLE organization_branches ADD COLUMN woreda VARCHAR(100) NULL`,
        `ALTER TABLE organization_branches ADD COLUMN postal_code VARCHAR(50) NULL`,
        `ALTER TABLE organization_branches ADD COLUMN address TEXT NULL`,
        `ALTER TABLE organization_branches ADD COLUMN working_days TEXT NULL`,
        `ALTER TABLE organization_branches ADD COLUMN opening_time VARCHAR(20) DEFAULT '08:30'`,
        `ALTER TABLE organization_branches ADD COLUMN closing_time VARCHAR(20) DEFAULT '17:30'`,
        `ALTER TABLE organization_branches ADD COLUMN timezone VARCHAR(100) DEFAULT 'Africa/Addis_Ababa'`,
        `ALTER TABLE organization_branches ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE'`,
        `ALTER TABLE organization_branches ADD COLUMN created_by INT NULL`,
        `ALTER TABLE organization_branches ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE organization_branches ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
        `ALTER TABLE organization_branches ADD COLUMN deleted_at DATETIME NULL`,
        `ALTER TABLE organizations MODIFY COLUMN logo_url LONGTEXT`,
        `ALTER TABLE organizations ADD COLUMN sub_city VARCHAR(100) NULL`,
        `ALTER TABLE organizations ADD COLUMN woreda VARCHAR(100) NULL`,
        `ALTER TABLE organizations ADD COLUMN postal_code VARCHAR(50) NULL`,
        `ALTER TABLE organizations ADD COLUMN business_type VARCHAR(100) DEFAULT 'CORPORATION'`,
        `ALTER TABLE organizations ADD COLUMN favicon_url LONGTEXT NULL`,
        `ALTER TABLE organizations ADD COLUMN primary_color VARCHAR(30) DEFAULT '#2563eb'`,
        `ALTER TABLE organizations ADD COLUMN secondary_color VARCHAR(30) DEFAULT '#1e40af'`
      ];
      for (const q of alterQueries) {
        try { await originalQuery(q); } catch { /* ignore column exists error */ }
      }
      try {
        await originalQuery(`ALTER TABLE user_otp MODIFY COLUMN user_id BIGINT UNSIGNED NULL`);
      } catch { /* ignore */ }
      console.log('Database schema migration for organizations and branches completed.');

      // Employee first-login / temporary credential columns
      const userTemporaryCredentialAlters = [
        `ALTER TABLE users ADD COLUMN temporary_password_created_at DATETIME NULL`,
        `ALTER TABLE users ADD COLUMN temporary_password_expires_at DATETIME NULL`,
        `ALTER TABLE users ADD COLUMN employee_id BIGINT UNSIGNED NULL`
      ];
      for (const q of userTemporaryCredentialAlters) {
        try { await originalQuery(q); } catch { /* ignore column exists error */ }
      }
      // Employee schema fixes (employment_status ENUM & constraint removal)
      const employeeSchemaAlters = [
        `ALTER TABLE employees MODIFY COLUMN employment_status VARCHAR(50) NOT NULL DEFAULT 'Active'`,
        `ALTER TABLE employees DROP CHECK chk_emp_status`
      ];
      for (const q of employeeSchemaAlters) {
        try { await originalQuery(q); } catch { /* ignore constraint missing or column updated */ }
      }

      // Visitor documents schema fixes (verification_status & approval_status & status)
      const visitorDocAlters = [
        `ALTER TABLE visitor_documents MODIFY COLUMN verification_status VARCHAR(50) DEFAULT 'PENDING'`,
        `ALTER TABLE visitor_documents MODIFY COLUMN approval_status VARCHAR(50) DEFAULT 'Pending Review'`,
        `ALTER TABLE visitor_documents MODIFY COLUMN status VARCHAR(50) DEFAULT 'Uploaded'`
      ];
      for (const q of visitorDocAlters) {
        try { await originalQuery(q); } catch { /* ignore */ }
      }

      // Password history table (prevents reuse of recent passwords)
      try {
        await pool.query(`CREATE TABLE IF NOT EXISTS password_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          password_hash VARCHAR(255) NULL,
          change_reason VARCHAR(100) NULL,
          changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_password_history_user (user_id)
        )`);
      } catch (err) {
        console.warn('DB Migration warning (password_history):', err.message);
      }

      // Blacklist / Watchlist schema & seed
      try {
        await pool.query(`ALTER TABLE visitor_watchlist ADD COLUMN expiry_date DATETIME NULL`);
      } catch (err) { /* ignore */ }
      try {
        await pool.query(`
          INSERT INTO visitor_watchlist (id, watchlist_id, visitor_id, watchlist_category, severity, reason, email, phone, id_number, id_type, list_type, risk_level, status, description, added_by, created_at, updated_at)
          VALUES (1, 1, 1, 'VIP', 'medium', 'Initial security watchlist entry', 'security.flag@vms.com', '+1-555-0199', 'ID-10001', 'National ID', 'BLACKLIST', 'HIGH', 'ACTIVE', 'Perimeter verification protocol active', 1, NOW(), NOW())
          ON DUPLICATE KEY UPDATE status = 'ACTIVE', deleted_at = NULL
        `);
      } catch (err) { /* ignore */ }

      // Enterprise Permission Management Platform Migrations
      const permissionAlters = [
        `ALTER TABLE permissions ADD COLUMN resource VARCHAR(80) NULL AFTER module`,
        `ALTER TABLE permissions ADD COLUMN action VARCHAR(60) NULL AFTER resource`,
        `ALTER TABLE permissions ADD COLUMN scope_type VARCHAR(50) DEFAULT 'ORGANIZATION' AFTER action`,
        `ALTER TABLE permissions ADD COLUMN permission_type VARCHAR(50) DEFAULT 'CUSTOM' AFTER scope_type`,
        `ALTER TABLE permissions ADD COLUMN risk_level VARCHAR(50) DEFAULT 'LOW' AFTER permission_type`,
        `ALTER TABLE permissions ADD COLUMN is_sensitive TINYINT(1) DEFAULT 0 AFTER risk_level`,
        `ALTER TABLE permissions ADD COLUMN requires_approval TINYINT(1) DEFAULT 0 AFTER is_sensitive`,
        `ALTER TABLE permissions ADD COLUMN requires_audit TINYINT(1) DEFAULT 1 AFTER requires_approval`,
        `ALTER TABLE permissions ADD COLUMN version INT DEFAULT 1 AFTER requires_audit`
      ];
      for (const q of permissionAlters) {
        try { await originalQuery(q); } catch { /* ignore column exists error */ }
      }

      // Department schema: ensure organization_id, branch_id, and operational/schedule columns exist
      const departmentAlters = [
        `ALTER TABLE departments ADD COLUMN organization_id BIGINT UNSIGNED NULL AFTER id`,
        `ALTER TABLE departments ADD COLUMN branch_id BIGINT UNSIGNED NULL AFTER organization_id`,
        `ALTER TABLE departments ADD COLUMN working_days TEXT NULL`,
        `ALTER TABLE departments ADD COLUMN opening_time VARCHAR(20) DEFAULT '08:30'`,
        `ALTER TABLE departments ADD COLUMN closing_time VARCHAR(20) DEFAULT '17:30'`,
        `ALTER TABLE departments ADD COLUMN floor VARCHAR(50) NULL`,
        `ALTER TABLE departments ADD COLUMN office_number VARCHAR(50) NULL`,
        `ALTER TABLE departments ADD COLUMN telephone_extension VARCHAR(50) NULL`,
        `ALTER TABLE departments ADD COLUMN department_type VARCHAR(50) DEFAULT 'GENERAL'`
      ];
      for (const q of departmentAlters) {
        try { await originalQuery(q); } catch { /* ignore column exists */ }
      }

      // Organization branches schema: expand status enum and ensure soft-delete tracking columns
      const branchSchemaAlters = [
        `ALTER TABLE organization_branches MODIFY COLUMN status ENUM('ACTIVE','INACTIVE','SUSPENDED','ARCHIVED') DEFAULT 'ACTIVE'`,
        `ALTER TABLE organization_branches ADD COLUMN deleted_by BIGINT UNSIGNED NULL`
      ];
      for (const q of branchSchemaAlters) {
        try { await originalQuery(q); } catch { /* ignore column exists / modified */ }
      }


      try {
        await pool.query(`CREATE TABLE IF NOT EXISTS permission_groups (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          group_name VARCHAR(100) NOT NULL UNIQUE,
          group_code VARCHAR(80) NOT NULL UNIQUE,
          description TEXT,
          module VARCHAR(60) DEFAULT 'GENERAL',
          status VARCHAR(50) DEFAULT 'ACTIVE',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await pool.query(`CREATE TABLE IF NOT EXISTS permission_group_permissions (
          group_id BIGINT NOT NULL,
          permission_id BIGINT NOT NULL,
          PRIMARY KEY (group_id, permission_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await pool.query(`CREATE TABLE IF NOT EXISTS permission_dependencies (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          permission_id BIGINT NOT NULL,
          depends_on_permission_id BIGINT NOT NULL,
          dependency_type VARCHAR(50) DEFAULT 'REQUIRED',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_perm_dep (permission_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await pool.query(`CREATE TABLE IF NOT EXISTS permission_conflicts (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          permission_id_1 BIGINT NOT NULL,
          permission_id_2 BIGINT NOT NULL,
          conflict_name VARCHAR(150) NULL,
          risk_level VARCHAR(50) DEFAULT 'HIGH',
          description TEXT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_perm_conf1 (permission_id_1),
          INDEX idx_perm_conf2 (permission_id_2)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await pool.query(`CREATE TABLE IF NOT EXISTS permission_versions (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          permission_id BIGINT NOT NULL,
          version_number INT NOT NULL,
          snapshot_json JSON NOT NULL,
          changed_by BIGINT NULL,
          change_reason VARCHAR(255) NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_perm_ver (permission_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await pool.query(`CREATE TABLE IF NOT EXISTS permission_templates (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          template_name VARCHAR(100) NOT NULL UNIQUE,
          template_code VARCHAR(80) NOT NULL UNIQUE,
          description TEXT NULL,
          category VARCHAR(60) DEFAULT 'STANDARD',
          permissions_json JSON NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await pool.query(`CREATE TABLE IF NOT EXISTS user_permissions (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT NOT NULL,
          permission_id BIGINT NOT NULL,
          assignment_type VARCHAR(50) DEFAULT 'ALLOW',
          scope_type VARCHAR(50) DEFAULT 'DEFAULT',
          scope_value VARCHAR(100) NULL,
          granted_by BIGINT NULL,
          expires_at DATETIME NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_uperm_user (user_id),
          INDEX idx_uperm_perm (permission_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        console.log('Database schema migration for permission management completed.');
      } catch (err) {
        console.warn('DB Migration warning (permission management):', err.message);
      }

      // Enterprise Notification Platform Tables
      try {
        await pool.query(`CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          organization_id INT NULL,
          user_id INT NULL,
          visitor_email VARCHAR(150) NULL,
          template_id INT NULL,
          type VARCHAR(100) NOT NULL,
          priority VARCHAR(50) DEFAULT 'medium',
          category VARCHAR(100) DEFAULT 'general',
          channel VARCHAR(50) DEFAULT 'in_app',
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'sent',
          reference_number VARCHAR(100) NULL,
          module_name VARCHAR(100) DEFAULT 'GENERAL',
          record_id INT NULL,
          action_url VARCHAR(255) NULL,
          is_read TINYINT(1) DEFAULT 0,
          sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          read_at DATETIME NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_ntf_user (user_id),
          INDEX idx_ntf_email (visitor_email),
          INDEX idx_ntf_type (type),
          INDEX idx_ntf_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await pool.query(`CREATE TABLE IF NOT EXISTS notification_delivery (
          id INT AUTO_INCREMENT PRIMARY KEY,
          notification_id INT NOT NULL,
          channel VARCHAR(50) NOT NULL,
          status VARCHAR(50) DEFAULT 'queued',
          provider VARCHAR(100) NULL,
          provider_message_id VARCHAR(255) NULL,
          error_message TEXT NULL,
          recipient_address VARCHAR(255) NULL,
          retry_count INT DEFAULT 0,
          last_retry_at DATETIME NULL,
          queued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          sent_at DATETIME NULL,
          delivered_at DATETIME NULL,
          failed_at DATETIME NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_nd_notif (notification_id),
          INDEX idx_nd_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await pool.query(`CREATE TABLE IF NOT EXISTS notification_preferences (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL UNIQUE,
          in_app_enabled TINYINT(1) DEFAULT 1,
          email_enabled TINYINT(1) DEFAULT 1,
          sms_enabled TINYINT(1) DEFAULT 0,
          browser_enabled TINYINT(1) DEFAULT 1,
          desktop_enabled TINYINT(1) DEFAULT 0,
          appointment_reminders TINYINT(1) DEFAULT 1,
          meeting_reminders TINYINT(1) DEFAULT 1,
          password_alerts TINYINT(1) DEFAULT 1,
          security_alerts TINYINT(1) DEFAULT 1,
          emergency_alerts TINYINT(1) DEFAULT 1,
          quiet_hours_enabled TINYINT(1) DEFAULT 0,
          quiet_hours_start TIME DEFAULT '22:00:00',
          quiet_hours_end TIME DEFAULT '07:00:00',
          language VARCHAR(10) DEFAULT 'en',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_np_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await pool.query(`CREATE TABLE IF NOT EXISTS notification_templates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          organization_id INT NULL,
          event_key VARCHAR(100) NOT NULL,
          channel VARCHAR(50) DEFAULT 'in_app',
          subject_template VARCHAR(255) NOT NULL,
          body_template TEXT NOT NULL,
          priority VARCHAR(50) DEFAULT 'medium',
          category VARCHAR(100) DEFAULT 'general',
          action_url_template VARCHAR(255) NULL,
          status VARCHAR(50) DEFAULT 'ACTIVE',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await pool.query(`CREATE TABLE IF NOT EXISTS notification_rules (
          id INT AUTO_INCREMENT PRIMARY KEY,
          organization_id INT NULL,
          event_type VARCHAR(100) NOT NULL,
          recipient_type VARCHAR(100) NOT NULL,
          channels VARCHAR(255) DEFAULT 'in_app,email',
          priority VARCHAR(50) DEFAULT 'medium',
          category VARCHAR(100) DEFAULT 'general',
          enabled TINYINT(1) DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await pool.query(`CREATE TABLE IF NOT EXISTS notification_audit_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          organization_id INT NULL,
          user_id INT NULL,
          notification_id INT NULL,
          action VARCHAR(100) NOT NULL,
          details TEXT NULL,
          metadata JSON NULL,
          ip_address VARCHAR(50) NULL,
          user_agent TEXT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
      } catch (err) {
        console.warn('DB Migration warning (notification tables):', err.message);
      }

      // Employees table migration & DDL extension
      try {
        await pool.query(`CREATE TABLE IF NOT EXISTS employees (
          id INT AUTO_INCREMENT PRIMARY KEY,
          employee_id INT NULL,
          user_id INT NULL,
          employee_number VARCHAR(50) NOT NULL UNIQUE,
          employee_code VARCHAR(50) NULL,
          first_name VARCHAR(100) NOT NULL,
          middle_name VARCHAR(100) NULL,
          last_name VARCHAR(100) NOT NULL,
          full_name VARCHAR(200) NOT NULL,
          gender VARCHAR(20) DEFAULT 'Male',
          dob DATE NULL,
          nationality VARCHAR(100) DEFAULT 'Ethiopian',
          marital_status VARCHAR(50) DEFAULT 'Single',
          photo_url TEXT NULL,
          email VARCHAR(150) NOT NULL,
          mobile_number VARCHAR(50) NULL,
          office_phone VARCHAR(50) NULL,
          extension VARCHAR(20) NULL,
          employment_type VARCHAR(50) DEFAULT 'Full-Time',
          job_title VARCHAR(100) DEFAULT 'Staff',
          position VARCHAR(100) DEFAULT 'Employee',
          hire_date DATE NULL,
          employment_status VARCHAR(50) DEFAULT 'Active',
          organization_id INT NULL,
          branch_id INT NULL,
          department_id INT NULL,
          building_id INT NULL,
          floor_number VARCHAR(20) NULL,
          office_number VARCHAR(20) NULL,
          manager_id INT NULL,
          emergency_contact_name VARCHAR(100) NULL,
          emergency_contact_relation VARCHAR(50) NULL,
          emergency_contact_phone VARCHAR(50) NULL,
          is_host_enabled TINYINT(1) DEFAULT 1,
          max_visitors_per_day INT DEFAULT 10,
          max_concurrent_visitors INT DEFAULT 3,
          default_room_id INT NULL,
          default_approval_role VARCHAR(50) DEFAULT 'Host',
          availability_status VARCHAR(50) DEFAULT 'Available',
          archived_at DATETIME NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deleted_at DATETIME NULL,
          INDEX idx_emp_email (email),
          INDEX idx_emp_number (employee_number),
          INDEX idx_emp_user (user_id),
          INDEX idx_emp_dept (department_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        const empAlters = [
          `ALTER TABLE employees ADD COLUMN employee_id INT NULL`,
          `ALTER TABLE employees ADD COLUMN user_id INT NULL`,
          `ALTER TABLE employees ADD COLUMN employee_number VARCHAR(50) NULL`,
          `ALTER TABLE employees ADD COLUMN employee_code VARCHAR(50) NULL`,
          `ALTER TABLE employees ADD COLUMN first_name VARCHAR(100) NULL`,
          `ALTER TABLE employees ADD COLUMN middle_name VARCHAR(100) NULL`,
          `ALTER TABLE employees ADD COLUMN last_name VARCHAR(100) NULL`,
          `ALTER TABLE employees ADD COLUMN full_name VARCHAR(200) NULL`,
          `ALTER TABLE employees ADD COLUMN gender VARCHAR(20) DEFAULT 'Male'`,
          `ALTER TABLE employees ADD COLUMN dob DATE NULL`,
          `ALTER TABLE employees ADD COLUMN nationality VARCHAR(100) DEFAULT 'Ethiopian'`,
          `ALTER TABLE employees ADD COLUMN marital_status VARCHAR(50) DEFAULT 'Single'`,
          `ALTER TABLE employees ADD COLUMN photo_url TEXT NULL`,
          `ALTER TABLE employees ADD COLUMN email VARCHAR(150) NULL`,
          `ALTER TABLE employees ADD COLUMN mobile_number VARCHAR(50) NULL`,
          `ALTER TABLE employees ADD COLUMN office_phone VARCHAR(50) NULL`,
          `ALTER TABLE employees ADD COLUMN extension VARCHAR(20) NULL`,
          `ALTER TABLE employees ADD COLUMN employment_type VARCHAR(50) DEFAULT 'Full-Time'`,
          `ALTER TABLE employees ADD COLUMN job_title VARCHAR(100) DEFAULT 'Staff'`,
          `ALTER TABLE employees ADD COLUMN position VARCHAR(100) DEFAULT 'Employee'`,
          `ALTER TABLE employees ADD COLUMN hire_date DATE NULL`,
          `ALTER TABLE employees ADD COLUMN employment_status VARCHAR(50) DEFAULT 'Active'`,
          `ALTER TABLE employees ADD COLUMN organization_id INT NULL`,
          `ALTER TABLE employees ADD COLUMN branch_id INT NULL`,
          `ALTER TABLE employees ADD COLUMN department_id INT NULL`,
          `ALTER TABLE employees ADD COLUMN building_id INT NULL`,
          `ALTER TABLE employees ADD COLUMN floor_number VARCHAR(20) NULL`,
          `ALTER TABLE employees ADD COLUMN office_number VARCHAR(20) NULL`,
          `ALTER TABLE employees ADD COLUMN manager_id INT NULL`,
          `ALTER TABLE employees ADD COLUMN emergency_contact_name VARCHAR(100) NULL`,
          `ALTER TABLE employees ADD COLUMN emergency_contact_relation VARCHAR(50) NULL`,
          `ALTER TABLE employees ADD COLUMN emergency_contact_phone VARCHAR(50) NULL`,
          `ALTER TABLE employees ADD COLUMN is_host_enabled TINYINT(1) DEFAULT 1`,
          `ALTER TABLE employees ADD COLUMN max_visitors_per_day INT DEFAULT 10`,
          `ALTER TABLE employees ADD COLUMN max_concurrent_visitors INT DEFAULT 3`,
          `ALTER TABLE employees ADD COLUMN default_room_id INT NULL`,
          `ALTER TABLE employees ADD COLUMN default_approval_role VARCHAR(50) DEFAULT 'Host'`,
          `ALTER TABLE employees ADD COLUMN availability_status VARCHAR(50) DEFAULT 'Available'`,
          `ALTER TABLE employees ADD COLUMN archived_at DATETIME NULL`,
          `ALTER TABLE employees ADD COLUMN deleted_at DATETIME NULL`
        ];
        for (const q of empAlters) {
          try { await pool.query(q); } catch (_) {}
        }
      } catch (err) {
        console.warn('DB Migration warning (employees):', err.message);
      }
      // Seed default appointment_types and visit_purposes if empty
      try {
        await originalQuery(`CREATE TABLE IF NOT EXISTS appointment_types (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NULL, type_name VARCHAR(100) NULL, code VARCHAR(50) NULL, type_code VARCHAR(50) NULL, status VARCHAR(50) DEFAULT 'ACTIVE')`);
        try { await originalQuery(`ALTER TABLE appointment_types ADD COLUMN type_name VARCHAR(100) NULL`); } catch {}
        try { await originalQuery(`ALTER TABLE appointment_types ADD COLUMN type_code VARCHAR(50) NULL`); } catch {}

        await originalQuery(`CREATE TABLE IF NOT EXISTS visit_purposes (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NULL, purpose_name VARCHAR(100) NULL, code VARCHAR(50) NULL, purpose_code VARCHAR(50) NULL, status VARCHAR(50) DEFAULT 'ACTIVE')`);
        try { await originalQuery(`ALTER TABLE visit_purposes ADD COLUMN purpose_name VARCHAR(100) NULL`); } catch {}
        try { await originalQuery(`ALTER TABLE visit_purposes ADD COLUMN purpose_code VARCHAR(50) NULL`); } catch {}

        await originalQuery(`INSERT IGNORE INTO appointment_types (id, name, type_name, code, type_code, status) VALUES (1, 'General Meeting', 'General Meeting', 'MEETING', 'MEETING', 'ACTIVE')`);
        await originalQuery(`INSERT IGNORE INTO visit_purposes (id, name, purpose_name, code, purpose_code, status) VALUES (1, 'General Business', 'General Business', 'BUSINESS', 'BUSINESS', 'ACTIVE')`);
        try {
          await originalQuery(`INSERT IGNORE INTO pass_types (id, pass_type_uid, type_code, type_name, type_description, validity_duration_hours, access_level, is_active) VALUES (1, 'PT-DEFAULT-001', 'STANDARD', 'Standard Visitor Pass', 'Default visitor lobby access pass', 12, 'GENERAL', 1)`);
        } catch (_) {}
        // Ensure visitor profile address, identity and vehicle columns exist
        const visitorCols = [
          'country VARCHAR(100) DEFAULT "Ethiopia"',
          'region VARCHAR(100) NULL',
          'city VARCHAR(100) NULL',
          'sub_city VARCHAR(100) NULL',
          'zone VARCHAR(100) NULL',
          'woreda VARCHAR(100) NULL',
          'postal_code VARCHAR(20) NULL',
          'full_address VARCHAR(500) NULL',
          'id_issue_date DATE NULL',
          'id_expiry_date DATE NULL',
          'vehicle_brand VARCHAR(80) NULL',
          'vehicle_model VARCHAR(80) NULL',
          'vehicle_color VARCHAR(50) NULL'
        ];
        for (const col of visitorCols) {
          try { await originalQuery(`ALTER TABLE visitors ADD COLUMN ${col}`); } catch (_) {}
        }

        // Ensure organizations table supports base64 logos and extended branding
        try {
          await originalQuery(`ALTER TABLE organizations MODIFY COLUMN logo_url LONGTEXT`);
          await originalQuery(`ALTER TABLE organizations MODIFY COLUMN status ENUM('ACTIVE','INACTIVE','SUSPENDED','ARCHIVED') DEFAULT 'ACTIVE'`);
        } catch (_) {}

        const orgExtraCols = [
          'sub_city VARCHAR(100) NULL',
          'woreda VARCHAR(100) NULL',
          'postal_code VARCHAR(20) NULL',
          'business_type VARCHAR(100) DEFAULT "CORPORATION"',
          'favicon_url LONGTEXT NULL',
          'primary_color VARCHAR(30) DEFAULT "#2563eb"',
          'secondary_color VARCHAR(30) DEFAULT "#1e40af"'
        ];
        for (const col of orgExtraCols) {
          try { await originalQuery(`ALTER TABLE organizations ADD COLUMN ${col}`); } catch (_) {}
        }
      } catch (err) {
        /* ignore seed error */
      }
      console.log('Database schema migration for employees, rooms and organizations completed successfully.');

      // Seed demo users and RBAC into MySQL database
      try {
        const { seedDemoUsers } = require('./seedUsers');
        await seedDemoUsers(async (sql, params = []) => {
          const [rows] = await originalQuery(sql, params);
          return rows;
        });
      } catch (seedErr) {
        console.warn('DB User Seed warning:', seedErr.message);
      }
    } catch (err) {
      console.warn('DB Migration warning:', err.message);
    }
  })();
} catch (e) {
  console.warn("MySQL pool creation failed. Falling back to mock database:", e.message);
  useMock = true;
}

const PASSWORD_HASH = bcrypt.hashSync('Password123!', 10);

// In-memory mock database seeded with default seed data
const mockDb = {
  organizations: [
    { id: 1, organization_id: 1, name: 'IT Park', short_name: 'IT Park', code: 'ITP', registration_number: 'REG123456', tax_number: '1234567890', website: 'https://itpark.example.com', email: 'info@itpark.example.com', phone: '+251111234567', address: 'Bole Road', country: 'Ethiopia', region: 'Addis Ababa', city: 'Addis Ababa', status: 'ACTIVE', created_by: 1, created_at: '2026-07-19T00:00:00Z' }
  ],
  organization_branches: [
    { id: 1, branch_id: 1, organization_id: 1, branch_name: 'HQ Silicon Valley Campus', branch_code: 'HQ-SV', branch_type: 'OFFICE', country: 'United States', city: 'San Jose', timezone: 'America/Los_Angeles', address: '100 Innovation Way', status: 'ACTIVE', created_by: 1, created_at: '2026-07-27T10:00:00Z' },
    { id: 2, branch_id: 2, organization_id: 1, branch_name: 'London Development Hub', branch_code: 'BR-LDN', branch_type: 'OFFICE', country: 'United Kingdom', city: 'London', timezone: 'Europe/London', address: '25 Tech Square', status: 'ACTIVE', created_by: 1, created_at: '2026-07-27T12:00:00Z' }
  ],
  facilities: [
    { id: 1, facility_id: 1, name: 'Main Bole Headquarters', code: 'HQ', address: 'Bole Road, Building B', timezone: 'Africa/Addis_Ababa', status: 'ACTIVE', created_by: 1, created_at: '2026-07-19T00:00:00Z' }
  ],
  buildings: [
    { id: 1, building_id: 1, branch_id: 1, building_name: 'HQ Tower', building_code: 'HQ-T1', location: 'Floor 1-5', max_visitor_capacity: 100, status: 'ACTIVE', created_by: 1, created_at: '2026-07-19T00:00:00Z' }
  ],
  departments: [
    { id: 1, name: 'Executive Office', description: 'C-suite and executive meetings', manager_id: 1 },
    { id: 2, name: 'Sales & Marketing', description: 'Customer and partner engagements', manager_id: 2 },
    { id: 3, name: 'Finance', description: 'Investor and financial stakeholder meetings', manager_id: 4 },
    { id: 4, name: 'Operations', description: 'Vendor and operational meetings', manager_id: 5 },
    { id: 5, name: 'Human Resources', description: 'Recruitment and HR consultations', manager_id: 8 },
    { id: 6, name: 'IT & Security', description: 'Technical and security reviews', manager_id: 7 }
  ],
  rooms: [
    { id: 1, name: 'Board Room A', capacity: 20, location: 'Floor 5 - East Wing', is_active: true },
    { id: 2, name: 'Conference Room B', capacity: 12, location: 'Floor 3 - Central', is_active: true },
    { id: 3, name: 'Meeting Room C', capacity: 8, location: 'Floor 2 - West Wing', is_active: true },
    { id: 4, name: 'Innovation Lab', capacity: 15, location: 'Floor 4 - North', is_active: true },
    { id: 5, name: 'Executive Suite', capacity: 6, location: 'Floor 5 - Private', is_active: true }
  ],
  users: [
    { id: 1, user_id: 1, user_code: 'ADM000001', username: 'admin', full_name: 'System Admin', email: 'admin@visitor.com', phone: '+1-555-0100', password_hash: PASSWORD_HASH, role: 'admin', role_id: 1, department_id: 1, job_title: 'System Administrator', availability_json: '{"mon":["09:00","17:00"],"tue":["09:00","17:00"],"wed":["09:00","17:00"],"thu":["09:00","17:00"],"fri":["09:00","17:00"]}', status: 'active', account_status: 'ACTIVE', verification_status: 'VERIFIED', first_login_required: false },
    { id: 2, user_id: 2, user_code: 'EMP000001', username: 'sarah.j', full_name: 'Sarah Johnson', email: 'sarah.j@visitor.com', phone: '+1-555-0101', password_hash: PASSWORD_HASH, role: 'staff', role_id: 2, department_id: 2, job_title: 'Sales Director', availability_json: '{"mon":["09:00","18:00"],"tue":["09:00","18:00"],"wed":["09:00","18:00"],"thu":["09:00","18:00"],"fri":["09:00","17:00"]}', status: 'active', account_status: 'ACTIVE', verification_status: 'VERIFIED', first_login_required: false },
    { id: 3, user_id: 3, user_code: 'EMP000002', username: 'michael.c', full_name: 'Michael Chen', email: 'michael.c@visitor.com', phone: '+1-555-0102', password_hash: PASSWORD_HASH, role: 'staff', role_id: 2, department_id: 2, job_title: 'Account Manager', availability_json: '{"mon":["10:00","18:00"],"tue":["10:00","18:00"],"wed":["10:00","18:00"],"thu":["10:00","18:00"],"fri":["10:00","16:00"]}', status: 'active', account_status: 'ACTIVE', verification_status: 'VERIFIED', first_login_required: false },
    { id: 4, user_id: 4, user_code: 'MGR000001', username: 'emily.d', full_name: 'Emily Davis', email: 'emily.d@visitor.com', phone: '+1-555-0103', password_hash: PASSWORD_HASH, role: 'manager', role_id: 6, department_id: 3, job_title: 'Finance Manager', availability_json: '{"mon":["08:30","17:30"],"tue":["08:30","17:30"],"wed":["08:30","17:30"],"thu":["08:30","17:30"],"fri":["08:30","16:00"]}', status: 'active', account_status: 'ACTIVE', verification_status: 'VERIFIED', first_login_required: false },
    { id: 5, user_id: 5, user_code: 'EMP000003', username: 'james.w', full_name: 'James Wilson', email: 'james.w@visitor.com', phone: '+1-555-0104', password_hash: PASSWORD_HASH, role: 'staff', role_id: 2, department_id: 4, job_title: 'Operations Lead', availability_json: '{"mon":["09:00","17:00"],"tue":["09:00","17:00"],"wed":["09:00","17:00"],"thu":["09:00","17:00"],"fri":["09:00","17:00"]}', status: 'active', account_status: 'ACTIVE', verification_status: 'VERIFIED', first_login_required: false },
    { id: 6, user_id: 6, user_code: 'REC000001', username: 'lisa.t', full_name: 'Lisa Thompson', email: 'lisa.t@visitor.com', phone: '+1-555-0105', password_hash: PASSWORD_HASH, role: 'receptionist', role_id: 3, department_id: 1, job_title: 'Front Desk Manager', availability_json: '{"mon":["07:00","19:00"],"tue":["07:00","19:00"],"wed":["07:00","19:00"],"thu":["07:00","19:00"],"fri":["07:00","19:00"]}', status: 'active', account_status: 'ACTIVE', verification_status: 'VERIFIED', first_login_required: false },
    { id: 7, user_id: 7, user_code: 'SEC000001', username: 'robert.g', full_name: 'Robert Garcia', email: 'robert.g@visitor.com', phone: '+1-555-0106', password_hash: PASSWORD_HASH, role: 'security_officer', role_id: 4, department_id: 6, job_title: 'Security Officer', availability_json: '{"mon":["06:00","22:00"],"tue":["06:00","22:00"],"wed":["06:00","22:00"],"thu":["06:00","22:00"],"fri":["06:00","22:00"]}', status: 'active', account_status: 'ACTIVE', verification_status: 'VERIFIED', first_login_required: false },
    { id: 8, user_id: 8, user_code: 'EMP000004', username: 'amanda.f', full_name: 'Amanda Foster', email: 'amanda.f@visitor.com', phone: '+1-555-0107', password_hash: PASSWORD_HASH, role: 'staff', role_id: 2, department_id: 5, job_title: 'HR Director', availability_json: '{"mon":["08:00","17:00"],"tue":["08:00","17:00"],"wed":["08:00","17:00"],"thu":["08:00","17:00"],"fri":["08:00","16:00"]}', status: 'active', account_status: 'ACTIVE', verification_status: 'VERIFIED', first_login_required: false },
    { id: 9, user_id: 9, user_code: 'EMP000005', username: 'kevin.p', full_name: 'Kevin Park', email: 'kevin.p@visitor.com', phone: '+1-555-0108', password_hash: PASSWORD_HASH, role: 'staff', role_id: 2, department_id: 5, job_title: 'Talent Acquisition Lead', availability_json: '{"mon":["09:00","18:00"],"tue":["09:00","18:00"],"wed":["09:00","18:00"],"thu":["09:00","18:00"],"fri":["09:00","17:00"]}', status: 'active', account_status: 'ACTIVE', verification_status: 'VERIFIED', first_login_required: false },
    { id: 10, user_id: 10, user_code: 'EMP000006', username: 'diana.r', full_name: 'Diana Ruiz', email: 'diana.r@visitor.com', phone: '+1-555-0109', password_hash: PASSWORD_HASH, role: 'staff', role_id: 2, department_id: 6, job_title: 'IT Support Manager', availability_json: '{"mon":["08:00","17:00"],"tue":["08:00","17:00"],"wed":["08:00","17:00"],"thu":["08:00","17:00"],"fri":["08:00","16:00"]}', status: 'active', account_status: 'ACTIVE', verification_status: 'VERIFIED', first_login_required: false },
    { id: 11, user_id: 11, user_code: 'EMP000007', username: 'thomas.w', full_name: 'Thomas Wright', email: 'thomas.w@visitor.com', phone: '+1-555-0110', password_hash: PASSWORD_HASH, role: 'staff', role_id: 2, department_id: 1, job_title: 'Executive Assistant', availability_json: '{"mon":["08:30","17:30"],"tue":["08:30","17:30"],"wed":["08:30","17:30"],"thu":["08:30","17:30"],"fri":["08:30","16:30"]}', status: 'active', account_status: 'ACTIVE', verification_status: 'VERIFIED', first_login_required: false },
    { id: 12, user_id: 12, user_code: 'VIS000001', username: 'visitor', full_name: 'David Visitor', email: 'visitor@visitor.com', phone: '+1-555-0111', password_hash: PASSWORD_HASH, role: 'visitor', role_id: 5, department_id: null, job_title: 'Visiting Client', availability_json: null, status: 'active', account_status: 'ACTIVE', verification_status: 'VERIFIED', first_login_required: false },
    { id: 13, user_id: 13, user_code: 'VIS000002', username: 'yetmul8@gmail.com', full_name: 'Yetmwerk Ayele Muluneh', email: 'yetmul8@gmail.com', phone: '+251911234567', password_hash: PASSWORD_HASH, role: 'visitor', role_id: 5, department_id: null, job_title: 'Guest Visitor', availability_json: null, status: 'active', account_status: 'ACTIVE', verification_status: 'VERIFIED', first_login_required: false },
    { id: 14, user_id: 14, user_code: 'EMP000008', username: 'employee', full_name: 'Employee Demo', email: 'employee@visitor.com', phone: '+1-555-0112', password_hash: PASSWORD_HASH, role: 'staff', role_id: 2, department_id: 2, job_title: 'Host Employee', availability_json: '{"mon":["09:00","17:00"],"tue":["09:00","17:00"],"wed":["09:00","17:00"],"thu":["09:00","17:00"],"fri":["09:00","17:00"]}', status: 'active', account_status: 'ACTIVE', verification_status: 'VERIFIED', first_login_required: false },
    { id: 15, user_id: 15, user_code: 'MGR000002', username: 'manager', full_name: 'Manager Demo', email: 'manager@visitor.com', phone: '+1-555-0113', password_hash: PASSWORD_HASH, role: 'manager', role_id: 6, department_id: 3, job_title: 'General Manager', availability_json: '{"mon":["08:30","17:30"],"tue":["08:30","17:30"],"wed":["08:30","17:30"],"thu":["08:30","17:30"],"fri":["08:30","16:00"]}', status: 'active', account_status: 'ACTIVE', verification_status: 'VERIFIED', first_login_required: false },
    { id: 16, user_id: 16, user_code: 'REC000002', username: 'receptionist', full_name: 'Receptionist Demo', email: 'receptionist@visitor.com', phone: '+1-555-0114', password_hash: PASSWORD_HASH, role: 'receptionist', role_id: 3, department_id: 1, job_title: 'Front Desk Staff', availability_json: '{"mon":["07:00","19:00"],"tue":["07:00","19:00"],"wed":["07:00","19:00"],"thu":["07:00","19:00"],"fri":["07:00","19:00"]}', status: 'active', account_status: 'ACTIVE', verification_status: 'VERIFIED', first_login_required: false },
    { id: 17, user_id: 17, user_code: 'SEC000002', username: 'security', full_name: 'Security Demo', email: 'security@visitor.com', phone: '+1-555-0115', password_hash: PASSWORD_HASH, role: 'security_officer', role_id: 4, department_id: 6, job_title: 'Security Guard', availability_json: '{"mon":["06:00","22:00"],"tue":["06:00","22:00"],"wed":["06:00","22:00"],"thu":["06:00","22:00"],"fri":["06:00","22:00"]}', status: 'active', account_status: 'ACTIVE', verification_status: 'VERIFIED', first_login_required: false }
  ],
  roles: [
    { id: 1, role_id: 1, role_name: 'Administrator', role_code: 'ADMIN', description: 'System Administrator', status: 'ACTIVE' },
    { id: 2, role_id: 2, role_name: 'Employee/Host', role_code: 'EMPLOYEE', description: 'Internal employee host', status: 'ACTIVE' },
    { id: 3, role_id: 3, role_name: 'Receptionist', role_code: 'RECEPTIONIST', description: 'Lobby front-desk staff', status: 'ACTIVE' },
    { id: 4, role_id: 4, role_name: 'Security Officer', role_code: 'SECURITY', description: 'Site patrol and security monitoring', status: 'ACTIVE' },
    { id: 5, role_id: 5, role_name: 'Visitor', role_code: 'VISITOR', description: 'External client or vendor', status: 'ACTIVE' },
    { id: 6, role_id: 6, role_name: 'Department Manager', role_code: 'MANAGER', description: 'Department Manager with approval authority', status: 'ACTIVE' }
  ],
  user_roles: [
    { id: 1, user_id: 1, role_id: 1 },
    { id: 2, user_id: 2, role_id: 2 },
    { id: 3, user_id: 3, role_id: 2 },
    { id: 4, user_id: 4, role_id: 6 },
    { id: 5, user_id: 5, role_id: 2 },
    { id: 6, user_id: 6, role_id: 3 },
    { id: 7, user_id: 7, role_id: 4 },
    { id: 8, user_id: 8, role_id: 2 },
    { id: 9, user_id: 9, role_id: 2 },
    { id: 10, user_id: 10, role_id: 2 },
    { id: 11, user_id: 11, role_id: 2 },
    { id: 12, user_id: 12, role_id: 5 },
    { id: 13, user_id: 13, role_id: 5 },
    { id: 14, user_id: 14, role_id: 2 },
    { id: 15, user_id: 15, role_id: 6 },
    { id: 16, user_id: 16, role_id: 3 },
    { id: 17, user_id: 17, role_id: 4 }
  ],
  responsibilities: [
    { id: 1, responsibility_id: 1, responsibility_code: 'MANAGE_USERS', responsibility_name: 'Manage Users', description: 'Manage system users and access' },
    { id: 2, responsibility_id: 2, responsibility_code: 'CREATE_APPOINTMENT', responsibility_name: 'Create Appointment', description: 'Request visitor appointments' },
    { id: 3, responsibility_id: 3, responsibility_code: 'APPROVE_APPOINTMENT', responsibility_name: 'Approve Appointment', description: 'Approve pending appointments' },
    { id: 4, responsibility_id: 4, responsibility_code: 'PRINT_BADGE', responsibility_name: 'Print Badge', description: 'Print visitor badges' },
    { id: 5, responsibility_id: 5, responsibility_code: 'CHECK_IN_VISITOR', responsibility_name: 'Check In Visitor', description: 'Lobby check-in' },
    { id: 6, responsibility_id: 6, responsibility_code: 'CHECK_OUT_VISITOR', responsibility_name: 'Check Out Visitor', description: 'Lobby check-out' },
    { id: 7, responsibility_id: 7, responsibility_code: 'VIEW_REPORT', responsibility_name: 'View Report', description: 'View system analytics and reports' },
    { id: 8, responsibility_id: 8, responsibility_code: 'VERIFY_VISITOR', responsibility_name: 'Verify Visitor', description: 'Identity verification checks' }
  ],
  role_responsibilities: [
    { id: 1, role_id: 1, responsibility_id: 1 },
    { id: 2, role_id: 1, responsibility_id: 7 },
    { id: 3, role_id: 2, responsibility_id: 2 },
    { id: 4, role_id: 3, responsibility_id: 4 },
    { id: 5, role_id: 3, responsibility_id: 5 },
    { id: 6, role_id: 3, responsibility_id: 6 },
    { id: 7, role_id: 4, responsibility_id: 8 },
    { id: 8, role_id: 4, responsibility_id: 7 },
    { id: 9, role_id: 4, responsibility_id: 5 },
    { id: 10, role_id: 5, responsibility_id: 2 },
    { id: 11, role_id: 6, responsibility_id: 3 },
    { id: 12, role_id: 6, responsibility_id: 7 }
  ],
  responsibility_permissions: [
    { id: 1, responsibility_id: 1, permission_id: 1 },
    { id: 2, responsibility_id: 1, permission_id: 2 },
    { id: 3, responsibility_id: 1, permission_id: 3 },
    { id: 4, responsibility_id: 1, permission_id: 4 },
    { id: 5, responsibility_id: 1, permission_id: 5 },
    { id: 6, responsibility_id: 1, permission_id: 6 },
    { id: 7, responsibility_id: 1, permission_id: 7 },
    { id: 8, responsibility_id: 1, permission_id: 8 },
    { id: 9, responsibility_id: 1, permission_id: 9 },
    { id: 10, responsibility_id: 1, permission_id: 19 },
    { id: 11, responsibility_id: 2, permission_id: 10 },
    { id: 12, responsibility_id: 2, permission_id: 11 },
    { id: 13, responsibility_id: 3, permission_id: 12 },
    { id: 14, responsibility_id: 3, permission_id: 13 },
    { id: 15, responsibility_id: 3, permission_id: 11 },
    { id: 16, responsibility_id: 4, permission_id: 14 },
    { id: 17, responsibility_id: 5, permission_id: 14 },
    { id: 18, responsibility_id: 6, permission_id: 15 },
    { id: 19, responsibility_id: 7, permission_id: 18 },
    { id: 20, responsibility_id: 8, permission_id: 16 },
    { id: 21, responsibility_id: 8, permission_id: 17 }
  ],
  permissions: [
    { id: 1, permission_id: 1, permission_name: 'View Users', permission_code: 'USER_VIEW', module: 'AUTH', status: 'ACTIVE' },
    { id: 2, permission_id: 2, permission_name: 'Create User', permission_code: 'USER_CREATE', module: 'AUTH', status: 'ACTIVE' },
    { id: 3, permission_id: 3, permission_name: 'Update User', permission_code: 'USER_UPDATE', module: 'AUTH', status: 'ACTIVE' },
    { id: 4, permission_id: 4, permission_name: 'Delete User', permission_code: 'USER_DELETE', module: 'AUTH', status: 'ACTIVE' },
    { id: 5, permission_id: 5, permission_name: 'View Roles', permission_code: 'ROLE_VIEW', module: 'AUTH', status: 'ACTIVE' },
    { id: 6, permission_id: 6, permission_name: 'Create Role', permission_code: 'ROLE_CREATE', module: 'AUTH', status: 'ACTIVE' },
    { id: 7, permission_id: 7, permission_name: 'Assign Role', permission_code: 'ROLE_ASSIGN', module: 'AUTH', status: 'ACTIVE' },
    { id: 8, permission_id: 8, permission_name: 'View Permissions', permission_code: 'PERM_VIEW', module: 'AUTH', status: 'ACTIVE' },
    { id: 9, permission_id: 9, permission_name: 'Assign Permission', permission_code: 'PERM_ASSIGN', module: 'AUTH', status: 'ACTIVE' },
    { id: 10, permission_id: 10, permission_name: 'Create Appointment', permission_code: 'appointment:create', module: 'APPOINTMENT', status: 'ACTIVE' },
    { id: 11, permission_id: 11, permission_name: 'Read Appointment', permission_code: 'appointment:read', module: 'APPOINTMENT', status: 'ACTIVE' },
    { id: 12, permission_id: 12, permission_name: 'Approve Appointment', permission_code: 'appointment:approve', module: 'APPOINTMENT', status: 'ACTIVE' },
    { id: 13, permission_id: 13, permission_name: 'Reject Appointment', permission_code: 'appointment:reject', module: 'APPOINTMENT', status: 'ACTIVE' },
    { id: 14, permission_id: 14, permission_name: 'Scan Pass', permission_code: 'checkin:scan', module: 'LOBBY', status: 'ACTIVE' },
    { id: 15, permission_id: 15, permission_name: 'Checkout Pass', permission_code: 'checkin:checkout', module: 'LOBBY', status: 'ACTIVE' },
    { id: 16, permission_id: 16, permission_name: 'Blacklist Visitor', permission_code: 'visitor:blacklist', module: 'SECURITY', status: 'ACTIVE' },
    { id: 17, permission_id: 17, permission_name: 'Report Incident', permission_code: 'security:report', module: 'SECURITY', status: 'ACTIVE' },
    { id: 18, permission_id: 18, permission_name: 'View Reports', permission_code: 'reports:view', module: 'REPORTS', status: 'ACTIVE' },
    { id: 19, permission_id: 19, permission_name: 'Update Settings', permission_code: 'settings:update', module: 'SETTINGS', status: 'ACTIVE' }
  ],
  resources: [
    { id: 1, resource_name: 'Admin Dashboard', route_url: '/admin/dashboard', react_component: 'AdminDashboard', menu_name: 'Dashboard', menu_group: 'Admin', display_order: 1, status: 'ACTIVE' },
    { id: 2, resource_name: 'User Management', route_url: '/admin/users', react_component: 'UserManagement', menu_name: 'Users', menu_group: 'Admin', display_order: 2, status: 'ACTIVE' },
    { id: 3, resource_name: 'Role Management', route_url: '/admin/roles', react_component: 'RoleManagement', menu_name: 'Roles', menu_group: 'Admin', display_order: 3, status: 'ACTIVE' },
    { id: 4, resource_name: 'Permission Management', route_url: '/admin/permissions', react_component: 'PermissionManagement', menu_name: 'Permissions', menu_group: 'Admin', display_order: 4, status: 'ACTIVE' },
    { id: 5, resource_name: 'Organization Configuration', route_url: '/admin/organization', react_component: 'OrganizationSettings', menu_name: 'Organization', menu_group: 'Admin', display_order: 5, status: 'ACTIVE' },
    { id: 6, resource_name: 'Department Configuration', route_url: '/admin/department', react_component: 'DepartmentSettings', menu_name: 'Departments', menu_group: 'Admin', display_order: 6, status: 'ACTIVE' },
    { id: 7, resource_name: 'Audit Logs', route_url: '/admin/audit-logs', react_component: 'AuditLogs', menu_name: 'Audit Logs', menu_group: 'Admin', display_order: 7, status: 'ACTIVE' },
    { id: 8, resource_name: 'System Settings', route_url: '/admin/settings', react_component: 'SystemSettings', menu_name: 'Settings', menu_group: 'Admin', display_order: 8, status: 'ACTIVE' },
    { id: 9, resource_name: 'Visitor Dashboard', route_url: '/visitor/dashboard', react_component: 'VisitorDashboard', menu_name: 'Dashboard', menu_group: 'Visitor', display_order: 1, status: 'ACTIVE' },
    { id: 10, resource_name: 'Visitor Profile', route_url: '/visitor/profile', react_component: 'VisitorProfile', menu_name: 'Profile', menu_group: 'Visitor', display_order: 2, status: 'ACTIVE' },
    { id: 11, resource_name: 'Book Appointments', route_url: '/visitor/appointments', react_component: 'VisitorAppointments', menu_name: 'Appointments', menu_group: 'Visitor', display_order: 3, status: 'ACTIVE' },
    { id: 12, resource_name: 'Visitor Documents', route_url: '/visitor/documents', react_component: 'VisitorDocuments', menu_name: 'Documents', menu_group: 'Visitor', display_order: 4, status: 'ACTIVE' },
    { id: 13, resource_name: 'Visitor Notifications', route_url: '/visitor/notifications', react_component: 'VisitorNotifications', menu_name: 'Notifications', menu_group: 'Visitor', display_order: 5, status: 'ACTIVE' },
    { id: 14, resource_name: 'Visit History', route_url: '/visitor/visit-history', react_component: 'VisitHistory', menu_name: 'History', menu_group: 'Visitor', display_order: 6, status: 'ACTIVE' },
    { id: 15, resource_name: 'Employee Dashboard', route_url: '/employee/dashboard', react_component: 'EmployeeDashboard', menu_name: 'Dashboard', menu_group: 'Employee', display_order: 1, status: 'ACTIVE' },
    { id: 16, resource_name: 'Visitor Invitations', route_url: '/employee/invitations', react_component: 'VisitorInvitation', menu_name: 'Invitations', menu_group: 'Employee', display_order: 2, status: 'ACTIVE' },
    { id: 17, resource_name: 'Calendar', route_url: '/employee/calendar', react_component: 'Calendar', menu_name: 'Calendar', menu_group: 'Employee', display_order: 3, status: 'ACTIVE' },
    { id: 18, resource_name: 'Appointment Management', route_url: '/employee/appointment-management', react_component: 'AppointmentManagement', menu_name: 'Meetings', menu_group: 'Employee', display_order: 4, status: 'ACTIVE' },
    { id: 19, resource_name: 'Employee Visitor History', route_url: '/employee/visitor-history', react_component: 'EmployeeVisitorHistory', menu_name: 'History', menu_group: 'Employee', display_order: 5, status: 'ACTIVE' },
    { id: 20, resource_name: 'Manager Dashboard', route_url: '/manager/dashboard', react_component: 'ManagerDashboard', menu_name: 'Dashboard', menu_group: 'Manager', display_order: 1, status: 'ACTIVE' },
    { id: 21, resource_name: 'Department Approvals', route_url: '/manager/approvals', react_component: 'Approvals', menu_name: 'Approvals', menu_group: 'Manager', display_order: 2, status: 'ACTIVE' },
    { id: 22, resource_name: 'Department Visitor Tracking', route_url: '/manager/department-visitors', react_component: 'DepartmentVisitors', menu_name: 'Visitors', menu_group: 'Manager', display_order: 3, status: 'ACTIVE' },
    { id: 23, resource_name: 'Department Reports', route_url: '/manager/department-reports', react_component: 'DepartmentReports', menu_name: 'Reports', menu_group: 'Manager', display_order: 4, status: 'ACTIVE' },
    { id: 24, resource_name: 'Reception Dashboard', route_url: '/reception/dashboard', react_component: 'ReceptionDashboard', menu_name: 'Dashboard', menu_group: 'Reception', display_order: 1, status: 'ACTIVE' },
    { id: 25, resource_name: 'Visitor Registration', route_url: '/reception/visitor-registration', react_component: 'VisitorRegistration', menu_name: 'Register', menu_group: 'Reception', display_order: 2, status: 'ACTIVE' },
    { id: 26, resource_name: 'Visitor Verification', route_url: '/reception/visitor-verification', react_component: 'VisitorVerification', menu_name: 'Verify', menu_group: 'Reception', display_order: 3, status: 'ACTIVE' },
    { id: 27, resource_name: 'Badge Management', route_url: '/reception/badge-management', react_component: 'BadgeManagement', menu_name: 'Badges', menu_group: 'Reception', display_order: 4, status: 'ACTIVE' },
    { id: 28, resource_name: 'Check In Lobby', route_url: '/reception/checkin', react_component: 'CheckIn', menu_name: 'Check In', menu_group: 'Reception', display_order: 5, status: 'ACTIVE' },
    { id: 29, resource_name: 'Check Out Lobby', route_url: '/reception/checkout', react_component: 'CheckOut', menu_name: 'Check Out', menu_group: 'Reception', display_order: 6, status: 'ACTIVE' },
    { id: 30, resource_name: 'Walk-In Visitors Queue', route_url: '/reception/walk-in-visitors', react_component: 'WalkInVisitors', menu_name: 'Walk-Ins', menu_group: 'Reception', display_order: 7, status: 'ACTIVE' },
    { id: 31, resource_name: 'Security Dashboard', route_url: '/security/dashboard', react_component: 'SecurityDashboard', menu_name: 'Dashboard', menu_group: 'Security', display_order: 1, status: 'ACTIVE' },
    { id: 32, resource_name: 'QR Scanner Check', route_url: '/security/qr-scanner', react_component: 'QRScanner', menu_name: 'Scan', menu_group: 'Security', display_order: 2, status: 'ACTIVE' },
    { id: 33, resource_name: 'Access Control', route_url: '/security/access-control', react_component: 'AccessControl', menu_name: 'Gates', menu_group: 'Security', display_order: 3, status: 'ACTIVE' },
    { id: 34, resource_name: 'Incident Management', route_url: '/security/incident-management', react_component: 'IncidentManagement', menu_name: 'Incidents', menu_group: 'Security', display_order: 4, status: 'ACTIVE' },
    { id: 35, resource_name: 'Visitor Movement Logs', route_url: '/security/visitor-movement', react_component: 'VisitorMovement', menu_name: 'Logs', menu_group: 'Security', display_order: 5, status: 'ACTIVE' },
    { id: 36, resource_name: 'Organization Management Home', route_url: '/admin/org-home', react_component: 'OrganizationManagementHome', menu_name: 'Home', menu_group: 'Organization Management', display_order: 1, status: 'ACTIVE' },
    { id: 37, resource_name: 'Organizations', route_url: '/admin/organizations', react_component: 'OrgList', menu_name: 'Organizations', menu_group: 'Organization Management', display_order: 2, status: 'ACTIVE' },
    { id: 38, resource_name: 'Branches', route_url: '/admin/branches', react_component: 'BranchList', menu_name: 'Branches', menu_group: 'Organization Management', display_order: 3, status: 'ACTIVE' },
    { id: 39, resource_name: 'Department Management', route_url: '/admin/departments-mgmt', react_component: 'DepartmentList', menu_name: 'Departments', menu_group: 'Organization Management', display_order: 4, status: 'ACTIVE' },
    { id: 40, resource_name: 'Search Departments', route_url: '/admin/dept-search', react_component: 'DepartmentSearch', menu_name: 'Search Departments', menu_group: 'Organization Management', display_order: 5, status: 'ACTIVE' },
    { id: 41, resource_name: 'Department Statistics', route_url: '/admin/dept-statistics', react_component: 'DepartmentStatistics', menu_name: 'Department Statistics', menu_group: 'Organization Management', display_order: 6, status: 'ACTIVE' },
    { id: 42, resource_name: 'Department Hierarchy', route_url: '/admin/dept-hierarchy', react_component: 'DepartmentHierarchy', menu_name: 'Department Hierarchy', menu_group: 'Organization Management', display_order: 7, status: 'ACTIVE' },
    { id: 43, resource_name: 'Hierarchy Dashboard', route_url: '/admin/hierarchy-dashboard', react_component: 'HierarchyDashboard', menu_name: '📊 Hierarchy Dashboard', menu_group: 'Organization Management', display_order: 8, status: 'ACTIVE' },
    { id: 44, resource_name: 'Hierarchy Tree View', route_url: '/admin/organization-tree', react_component: 'OrganizationTree', menu_name: '🌳 Hierarchy Tree View', menu_group: 'Organization Management', display_order: 9, status: 'ACTIVE' },
    { id: 45, resource_name: 'Hierarchy Assignment', route_url: '/admin/hierarchy-assignment', react_component: 'HierarchyAssignment', menu_name: '🔗 Hierarchy Assignment', menu_group: 'Organization Management', display_order: 10, status: 'ACTIVE' },
    { id: 46, resource_name: 'Hierarchy Details', route_url: '/admin/hierarchy-details', react_component: 'HierarchyDetails', menu_name: '🔍 Hierarchy Details', menu_group: 'Organization Management', display_order: 11, status: 'ACTIVE' },
    { id: 47, resource_name: 'Hierarchy Search', route_url: '/admin/hierarchy-search', react_component: 'HierarchySearch', menu_name: '🔎 Hierarchy Search', menu_group: 'Organization Management', display_order: 12, status: 'ACTIVE' },
    { id: 48, resource_name: 'Hierarchy Validation', route_url: '/admin/hierarchy-validation', react_component: 'HierarchyValidation', menu_name: '✅ Hierarchy Validation', menu_group: 'Organization Management', display_order: 13, status: 'ACTIVE' },
    { id: 49, resource_name: 'Hierarchy Statistics', route_url: '/admin/hierarchy-statistics', react_component: 'HierarchyStatistics', menu_name: '📈 Hierarchy Statistics', menu_group: 'Organization Management', display_order: 14, status: 'ACTIVE' },
    { id: 50, resource_name: 'Visitor Pass', route_url: '/visitor/visitor-pass', react_component: 'VisitorPass', menu_name: 'Visitor Pass', menu_group: 'Visitor', display_order: 7, status: 'ACTIVE' },
    { id: 51, resource_name: 'System Chat', route_url: '/visitor/system-chat', react_component: 'SystemChat', menu_name: 'System Chat', menu_group: 'Visitor', display_order: 8, status: 'ACTIVE' },
    { id: 52, resource_name: 'Visitor Feedback', route_url: '/visitor/feedback', react_component: 'VisitorFeedback', menu_name: 'Feedback', menu_group: 'Visitor', display_order: 9, status: 'ACTIVE' },
    { id: 53, resource_name: 'Help & Support', route_url: '/visitor/support', react_component: 'VisitorSupport', menu_name: 'Help & Support', menu_group: 'Visitor', display_order: 10, status: 'ACTIVE' },
    { id: 54, resource_name: 'Visitor Settings', route_url: '/visitor/settings', react_component: 'VisitorSettings', menu_name: 'Settings', menu_group: 'Visitor', display_order: 11, status: 'ACTIVE' }
  ],
  permission_resources: [
    { id: 1, permission_id: 1, resource_id: 1 },
    { id: 2, permission_id: 1, resource_id: 2 },
    { id: 3, permission_id: 1, resource_id: 3 },
    { id: 4, permission_id: 1, resource_id: 4 },
    { id: 5, permission_id: 1, resource_id: 5 },
    { id: 6, permission_id: 1, resource_id: 6 },
    { id: 7, permission_id: 1, resource_id: 7 },
    { id: 8, permission_id: 1, resource_id: 8 },
    { id: 36, permission_id: 1, resource_id: 36 },
    { id: 37, permission_id: 1, resource_id: 37 },
    { id: 38, permission_id: 1, resource_id: 38 },
    { id: 39, permission_id: 1, resource_id: 39 },
    { id: 40, permission_id: 1, resource_id: 40 },
    { id: 41, permission_id: 1, resource_id: 41 },
    { id: 42, permission_id: 1, resource_id: 42 },
    { id: 43, permission_id: 1, resource_id: 43 },
    { id: 44, permission_id: 1, resource_id: 44 },
    { id: 45, permission_id: 1, resource_id: 45 },
    { id: 46, permission_id: 1, resource_id: 46 },
    { id: 47, permission_id: 1, resource_id: 47 },
    { id: 48, permission_id: 1, resource_id: 48 },
    { id: 49, permission_id: 1, resource_id: 49 },
    { id: 9, permission_id: 11, resource_id: 9 },
    { id: 10, permission_id: 11, resource_id: 10 },
    { id: 11, permission_id: 10, resource_id: 11 },
    { id: 12, permission_id: 11, resource_id: 12 },
    { id: 13, permission_id: 11, resource_id: 13 },
    { id: 14, permission_id: 11, resource_id: 14 },
    { id: 15, permission_id: 11, resource_id: 15 },
    { id: 16, permission_id: 10, resource_id: 16 },
    { id: 17, permission_id: 11, resource_id: 17 },
    { id: 18, permission_id: 11, resource_id: 18 },
    { id: 19, permission_id: 11, resource_id: 19 },
    { id: 20, permission_id: 12, resource_id: 20 },
    { id: 21, permission_id: 12, resource_id: 21 },
    { id: 22, permission_id: 12, resource_id: 22 },
    { id: 23, permission_id: 18, resource_id: 23 },
    { id: 24, permission_id: 14, resource_id: 24 },
    { id: 25, permission_id: 14, resource_id: 25 },
    { id: 26, permission_id: 14, resource_id: 26 },
    { id: 27, permission_id: 14, resource_id: 27 },
    { id: 28, permission_id: 14, resource_id: 28 },
    { id: 29, permission_id: 14, resource_id: 29 },
    { id: 30, permission_id: 14, resource_id: 30 },
    { id: 31, permission_id: 16, resource_id: 31 },
    { id: 32, permission_id: 16, resource_id: 32 },
    { id: 33, permission_id: 16, resource_id: 33 },
    { id: 34, permission_id: 16, resource_id: 34 },
    { id: 35, permission_id: 16, resource_id: 35 },
    { id: 50, permission_id: 11, resource_id: 50 },
    { id: 51, permission_id: 11, resource_id: 51 },
    { id: 52, permission_id: 11, resource_id: 52 },
    { id: 53, permission_id: 11, resource_id: 53 },
    { id: 54, permission_id: 11, resource_id: 54 }
  ],
  user_sessions: [],
  user_otp: [],
  visitors: [
    { id: 1, user_id: 12, visitor_id: 'VISIT000001', visitor_code: 'VISIT000001', full_name: 'Yetmwerk Ayele Muluneh', first_name: 'Yetmwerk', last_name: 'Ayele Muluneh', email: 'yetmul8@gmail.com', phone: '+251911234567', company: 'IT Park', id_type: 'Passport', id_number: 'EP987654', is_blacklisted: false, is_active: true, status: 'ACTIVE', registration_status: 'APPROVED' },
    { id: 2, user_id: null, full_name: 'Maria Garcia', email: 'maria.g@techstart.io', phone: '+1-555-1002', company: 'IT Park', id_type: 'Driver License', id_number: 'DL987654', is_blacklisted: false, is_active: true, status: 'ACTIVE', registration_status: 'APPROVED' },
    { id: 3, user_id: null, full_name: 'David Lee', email: 'david.lee@invest.com', phone: '+1-555-1003', company: 'IT Park', id_type: 'National ID', id_number: 'NID456789', is_blacklisted: true, is_active: true, status: 'ACTIVE', registration_status: 'APPROVED' }
  ],
  blacklist: [
    { id: 1, visitor_id: 3, reason: 'Security violation', added_by: 1, expires_at: null }
  ],
  employees: [
    {
      id: 1, employee_id: 1, user_id: 1, employee_number: 'EMP-2026-0001',
      first_name: 'System', middle_name: '', last_name: 'Admin', full_name: 'System Admin',
      gender: 'Male', dob: '1985-05-12', nationality: 'Ethiopian', marital_status: 'Married',
      photo_url: '', email: 'admin@visitor.com', mobile_number: '+251911000111', office_phone: '+251111000111', extension: '101',
      employment_type: 'Full-Time', job_title: 'System Administrator', position: 'Lead Admin', hire_date: '2020-01-15', employment_status: 'Active',
      organization_id: 1, branch_id: 1, department_id: 1, building_id: 1, floor_number: '5', office_number: '501', manager_id: null,
      emergency_contact_name: 'Helen Admin', emergency_contact_relation: 'Spouse', emergency_contact_phone: '+251911999888',
      is_host_enabled: true, max_visitors_per_day: 20, max_concurrent_visitors: 5, default_room_id: 1, default_approval_role: 'Admin',
      availability_status: 'Available', created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z'
    },
    {
      id: 2, employee_id: 2, user_id: 2, employee_number: 'EMP-2026-0002',
      first_name: 'Sarah', middle_name: 'M.', last_name: 'Johnson', full_name: 'Sarah Johnson',
      gender: 'Female', dob: '1990-08-22', nationality: 'American', marital_status: 'Single',
      photo_url: '', email: 'sarah.j@visitor.com', mobile_number: '+1-555-0101', office_phone: '+1-555-0201', extension: '201',
      employment_type: 'Full-Time', job_title: 'Sales Director', position: 'Director', hire_date: '2021-03-01', employment_status: 'Active',
      organization_id: 1, branch_id: 1, department_id: 2, building_id: 1, floor_number: '3', office_number: '304', manager_id: 1,
      emergency_contact_name: 'Mark Johnson', emergency_contact_relation: 'Brother', emergency_contact_phone: '+1-555-9999',
      is_host_enabled: true, max_visitors_per_day: 15, max_concurrent_visitors: 4, default_room_id: 2, default_approval_role: 'Host',
      availability_status: 'Available', created_at: '2026-07-02T00:00:00Z', updated_at: '2026-07-02T00:00:00Z'
    },
    {
      id: 3, employee_id: 3, user_id: 3, employee_number: 'EMP-2026-0003',
      first_name: 'Michael', middle_name: 'K.', last_name: 'Chen', full_name: 'Michael Chen',
      gender: 'Male', dob: '1992-11-10', nationality: 'Canadian', marital_status: 'Married',
      photo_url: '', email: 'michael.c@visitor.com', mobile_number: '+1-555-0102', office_phone: '+1-555-0202', extension: '202',
      employment_type: 'Full-Time', job_title: 'Account Manager', position: 'Senior Lead', hire_date: '2022-06-15', employment_status: 'Active',
      organization_id: 1, branch_id: 1, department_id: 2, building_id: 1, floor_number: '3', office_number: '308', manager_id: 2,
      emergency_contact_name: 'Grace Chen', emergency_contact_relation: 'Spouse', emergency_contact_phone: '+1-555-8888',
      is_host_enabled: true, max_visitors_per_day: 10, max_concurrent_visitors: 3, default_room_id: 3, default_approval_role: 'Host',
      availability_status: 'In Meeting', created_at: '2026-07-03T00:00:00Z', updated_at: '2026-07-03T00:00:00Z'
    },
    {
      id: 4, employee_id: 4, user_id: 4, employee_number: 'EMP-2026-0004',
      first_name: 'Emily', middle_name: 'A.', last_name: 'Davis', full_name: 'Emily Davis',
      gender: 'Female', dob: '1988-04-18', nationality: 'British', marital_status: 'Married',
      photo_url: '', email: 'emily.d@visitor.com', mobile_number: '+1-555-0103', office_phone: '+1-555-0203', extension: '301',
      employment_type: 'Full-Time', job_title: 'Finance Manager', position: 'Department Head', hire_date: '2019-11-01', employment_status: 'Active',
      organization_id: 1, branch_id: 1, department_id: 3, building_id: 1, floor_number: '4', office_number: '402', manager_id: 1,
      emergency_contact_name: 'Oliver Davis', emergency_contact_relation: 'Spouse', emergency_contact_phone: '+1-555-7777',
      is_host_enabled: true, max_visitors_per_day: 8, max_concurrent_visitors: 2, default_room_id: 1, default_approval_role: 'Department Manager',
      availability_status: 'On Leave', created_at: '2026-07-04T00:00:00Z', updated_at: '2026-07-04T00:00:00Z'
    },
    {
      id: 5, employee_id: 5, user_id: 5, employee_number: 'EMP-2026-0005',
      first_name: 'James', middle_name: 'R.', last_name: 'Wilson', full_name: 'James Wilson',
      gender: 'Male', dob: '1991-09-05', nationality: 'Ethiopian', marital_status: 'Single',
      photo_url: '', email: 'james.w@visitor.com', mobile_number: '+1-555-0104', office_phone: '+1-555-0204', extension: '401',
      employment_type: 'Full-Time', job_title: 'Operations Lead', position: 'Lead', hire_date: '2021-08-20', employment_status: 'Active',
      organization_id: 1, branch_id: 1, department_id: 4, building_id: 1, floor_number: '2', office_number: '210', manager_id: 1,
      emergency_contact_name: 'Robert Wilson', emergency_contact_relation: 'Father', emergency_contact_phone: '+1-555-6666',
      is_host_enabled: true, max_visitors_per_day: 12, max_concurrent_visitors: 3, default_room_id: 4, default_approval_role: 'Host',
      availability_status: 'Available', created_at: '2026-07-05T00:00:00Z', updated_at: '2026-07-05T00:00:00Z'
    }
  ],
  approval_workflows: [
    {
      id: 1, workflow_name: 'Guest Visitor Standard Approval', workflow_code: 'WF-GUEST-01', description: 'Standard 2-tier approval for general visitors (Reception -> Host)', workflow_type: 'Standard', category_id: 1, department_id: null, branch_id: 1, priority: 1, approval_mode: 'Sequential', status: 'Active', version: 'v1.0', is_default: 1, created_at: '2026-07-20T10:00:00Z', updated_at: '2026-07-20T10:00:00Z'
    },
    {
      id: 2, workflow_name: 'Contractor High Security Approval', workflow_code: 'WF-CONT-02', description: 'Multi-tiered 4-step approval workflow for contractors and technical vendors', workflow_type: 'Security', category_id: 2, department_id: 6, branch_id: 1, priority: 2, approval_mode: 'Sequential', status: 'Active', version: 'v1.1', is_default: 0, created_at: '2026-07-21T11:30:00Z', updated_at: '2026-07-22T09:00:00Z'
    },
    {
      id: 3, workflow_name: 'VIP Executive Assistant & Board Approval', workflow_code: 'WF-VIP-03', description: 'Priority approval workflow for C-suite executive visitors and Board members', workflow_type: 'Executive', category_id: 3, department_id: 1, branch_id: 1, priority: 3, approval_mode: 'Parallel', status: 'Active', version: 'v1.0', is_default: 0, created_at: '2026-07-22T14:00:00Z', updated_at: '2026-07-22T14:00:00Z'
    },
    {
      id: 4, workflow_name: 'Government Official Compliance Approval', workflow_code: 'WF-GOV-04', description: 'Department Head & Organization Administrator compliance verification', workflow_type: 'Compliance', category_id: 4, department_id: null, branch_id: 1, priority: 4, approval_mode: 'Sequential', status: 'Active', version: 'v1.0', is_default: 0, created_at: '2026-07-23T08:15:00Z', updated_at: '2026-07-23T08:15:00Z'
    },
    {
      id: 5, workflow_name: 'Express Delivery & Logistics Clearance', workflow_code: 'WF-DELIV-05', description: 'Auto-approved or single security check for delivery personnel', workflow_type: 'Express', category_id: 5, department_id: 4, branch_id: 1, priority: 5, approval_mode: 'Automatic', status: 'Active', version: 'v1.0', is_default: 0, created_at: '2026-07-24T16:45:00Z', updated_at: '2026-07-24T16:45:00Z'
    }
  ],
  approval_workflow_levels: [
    { id: 1, workflow_id: 1, level_order: 1, level_name: 'Lobby Reception Check', approver_role: 'Receptionist', approver_user_id: 6, department_id: 1, timeout_minutes: 30, sla_minutes: 60, escalation_target: 'Host', notification_rule: 'Email & Push', comments_required: 0, attachment_required: 0, is_required: 1 },
    { id: 2, workflow_id: 1, level_order: 2, level_name: 'Host Employee Confirmation', approver_role: 'Host', approver_user_id: 2, department_id: 2, timeout_minutes: 60, sla_minutes: 120, escalation_target: 'Manager', notification_rule: 'Email & Push', comments_required: 0, attachment_required: 0, is_required: 1 },

    { id: 3, workflow_id: 2, level_order: 1, level_name: 'Reception Verification', approver_role: 'Receptionist', approver_user_id: 6, department_id: 1, timeout_minutes: 30, sla_minutes: 60, escalation_target: 'Host', notification_rule: 'Email & Push', comments_required: 0, attachment_required: 1, is_required: 1 },
    { id: 4, workflow_id: 2, level_order: 2, level_name: 'Host Approval', approver_role: 'Host', approver_user_id: 5, department_id: 4, timeout_minutes: 60, sla_minutes: 120, escalation_target: 'Department Manager', notification_rule: 'Email & SMS', comments_required: 1, attachment_required: 0, is_required: 1 },
    { id: 5, workflow_id: 2, level_order: 3, level_name: 'Department Manager Signoff', approver_role: 'Department Manager', approver_user_id: 4, department_id: 4, timeout_minutes: 120, sla_minutes: 240, escalation_target: 'Security Officer', notification_rule: 'Email & Push', comments_required: 1, attachment_required: 1, is_required: 1 },
    { id: 6, workflow_id: 2, level_order: 4, level_name: 'Security Clearance & Permit', approver_role: 'Security Officer', approver_user_id: 7, department_id: 6, timeout_minutes: 180, sla_minutes: 360, escalation_target: 'Admin', notification_rule: 'SMS & Push', comments_required: 1, attachment_required: 1, is_required: 1 },

    { id: 7, workflow_id: 3, level_order: 1, level_name: 'Executive Assistant Review', approver_role: 'Host', approver_user_id: 11, department_id: 1, timeout_minutes: 30, sla_minutes: 60, escalation_target: 'Admin', notification_rule: 'Priority SMS', comments_required: 0, attachment_required: 0, is_required: 1 },
    { id: 8, workflow_id: 3, level_order: 2, level_name: 'Executive Sign-off', approver_role: 'Department Manager', approver_user_id: 1, department_id: 1, timeout_minutes: 60, sla_minutes: 120, escalation_target: 'Admin', notification_rule: 'Priority Push', comments_required: 0, attachment_required: 0, is_required: 1 }
  ],
  approval_workflow_rules: [
    { id: 1, workflow_id: 2, rule_name: 'Require Contractor Security Clearance', field_name: 'visitor_category', operator: '=', field_value: 'Contractor', target_workflow_id: 2, target_level_order: 4, priority: 1, is_active: 1 },
    { id: 2, workflow_id: 2, rule_name: 'Data Center Room High Risk Clearance', field_name: 'meeting_room', operator: 'CONTAINS', field_value: 'Data Center', target_workflow_id: 2, target_level_order: 4, priority: 2, is_active: 1 },
    { id: 3, workflow_id: 3, rule_name: 'VIP Category Automatic Priority', field_name: 'visitor_category', operator: '=', field_value: 'VIP', target_workflow_id: 3, target_level_order: 1, priority: 1, is_active: 1 }
  ],
  approval_delegations: [
    { id: 1, delegator_id: 4, delegate_id: 5, start_date: '2026-07-25T00:00:00Z', end_date: '2026-08-05T00:00:00Z', reason: 'Annual Leave / Out of Office', status: 'Active' }
  ],
  approval_workflow_versions: [
    { id: 1, workflow_id: 2, version_number: 'v1.0', configuration_json: '{"name":"Contractor Security Approval"}', created_by: 1, created_at: '2026-07-21T11:30:00Z' },
    { id: 2, workflow_id: 2, version_number: 'v1.1', configuration_json: '{"name":"Contractor High Security Approval"}', created_by: 1, created_at: '2026-07-22T09:00:00Z' }
  ],
  approval_workflow_audit_logs: [
    { id: 1, workflow_id: 2, action: 'UPDATED', details: '{"changes":["version","approval_mode"]}', performed_by: 1, created_at: '2026-07-22T09:00:00Z' }
  ],
  appointments: [
    {
      id: 1,
      appointment_id: 1,
      appointment_number: 'APT-2026-00101',
      organization_id: 1,
      facility_id: 1,
      visitor_id: 1,
      host_id: 2,
      department_id: 1,
      appointment_type_id: 1,
      visit_purpose_id: 1,
      room_id: 1,
      scheduled_start: '2026-07-31T09:00:00Z',
      scheduled_end: '2026-07-31T10:30:00Z',
      expected_duration_minutes: 90,
      priority: 'HIGH',
      approval_status: 'APPROVED',
      appointment_status: 'APPROVED',
      status: 'approved',
      remarks: 'Quarterly Strategic Audit Meeting',
      purpose: 'Security Clearance & Onsite Audit',
      reference_code: 'REF-8145-2026',
      qr_token: 'token-uuid-001',
      cancellation_reason: null,
      is_cancelled: false,
      is_completed: false,
      created_at: '2026-07-28T10:00:00Z'
    },
    {
      id: 2,
      appointment_id: 2,
      appointment_number: 'APT-2026-00102',
      organization_id: 1,
      facility_id: 1,
      visitor_id: 2,
      host_id: 4,
      department_id: 2,
      appointment_type_id: 2,
      visit_purpose_id: 2,
      room_id: 2,
      scheduled_start: '2026-07-31T11:00:00Z',
      scheduled_end: '2026-07-31T12:00:00Z',
      expected_duration_minutes: 60,
      priority: 'MEDIUM',
      approval_status: 'PENDING',
      appointment_status: 'REQUESTED',
      status: 'pending_approval',
      remarks: 'Vendor Software Architecture Demo',
      purpose: 'Technical Demo & Integration Review',
      reference_code: 'REF-9012-2026',
      qr_token: 'token-uuid-002',
      cancellation_reason: null,
      is_cancelled: false,
      is_completed: false,
      created_at: '2026-07-29T14:30:00Z'
    },
    {
      id: 3,
      appointment_id: 3,
      appointment_number: 'APT-2026-00103',
      organization_id: 1,
      facility_id: 1,
      visitor_id: 3,
      host_id: 5,
      department_id: 1,
      appointment_type_id: 1,
      visit_purpose_id: 3,
      room_id: 3,
      scheduled_start: '2026-07-30T14:00:00Z',
      scheduled_end: '2026-07-30T15:30:00Z',
      expected_duration_minutes: 90,
      priority: 'HIGH',
      approval_status: 'APPROVED',
      appointment_status: 'COMPLETED',
      status: 'completed',
      remarks: 'Executive Board Discussion',
      purpose: 'Board Meeting & Compliance Review',
      reference_code: 'REF-3344-2026',
      qr_token: 'token-uuid-003',
      cancellation_reason: null,
      is_cancelled: false,
      is_completed: true,
      created_at: '2026-07-25T08:00:00Z'
    },
    {
      id: 4,
      appointment_id: 4,
      appointment_number: 'APT-2026-00104',
      organization_id: 1,
      facility_id: 1,
      visitor_id: 1,
      host_id: 2,
      department_id: 1,
      appointment_type_id: 3,
      visit_purpose_id: 1,
      room_id: 1,
      scheduled_start: '2026-08-01T10:00:00Z',
      scheduled_end: '2026-08-01T11:00:00Z',
      expected_duration_minutes: 60,
      priority: 'LOW',
      approval_status: 'REJECTED',
      appointment_status: 'REJECTED',
      status: 'rejected',
      remarks: 'Room unavailable due to maintenance',
      purpose: 'Routine Maintenance Inspection',
      reference_code: 'REF-7711-2026',
      qr_token: 'token-uuid-004',
      cancellation_reason: 'Host unavailable at scheduled time',
      is_cancelled: true,
      is_completed: false,
      created_at: '2026-07-29T09:15:00Z'
    }
  ],
  appointment_approvals: [
    { id: 1, appointment_id: 1, approval_level: 1, approver_id: 2, approver_role: 'staff', decision: 'APPROVED', comments: 'Approved by host', decided_at: '2026-07-28T11:00:00Z' },
    { id: 2, appointment_id: 2, approval_level: 1, approver_id: 4, approver_role: 'manager', decision: 'PENDING', comments: null, decided_at: null }
  ],
  appointment_documents: [],
  notifications: [],
  audit_logs: [],
  login_history: [],
  verification_attempts: [],
  checkins: [],
  visitor_checkins: [],
  visitor_checkouts: [],
  visitor_asset_returns: [],
  visitor_pass_returns: [],
  checkout_verifications: [],
  visit_durations: [],
  checkout_exceptions: [],
  checkout_feedbacks: [],
  visitor_histories: [],
  visitor_passes: [],
  document_categories: [
    { id: 1, category_code: 'NATIONAL_ID', category_name: 'National ID', description: 'Government issued national identity card', is_active: true },
    { id: 2, category_code: 'PASSPORT', category_name: 'Passport', description: 'International travel passport scan', is_active: true },
    { id: 3, category_code: 'DRIVING_LICENSE', category_name: 'Driving License', description: 'State or national driving permit', is_active: true },
    { id: 4, category_code: 'EMPLOYEE_ID', category_name: 'Employee ID', description: 'Corporate employee badge or card', is_active: true },
    { id: 5, category_code: 'VISA', category_name: 'Visa', description: 'Entry visa document', is_active: true },
    { id: 6, category_code: 'INVITATION_LETTER', category_name: 'Invitation Letter', description: 'Official host invitation letter', is_active: true },
    { id: 7, category_code: 'SUPPORTING_DOCUMENT', category_name: 'Supporting Document', description: 'General supporting attachment', is_active: true },
    { id: 8, category_code: 'MEDICAL_CLEARANCE', category_name: 'Medical Clearance', description: 'Health or medical clearance form', is_active: true },
    { id: 9, category_code: 'NDA', category_name: 'NDA', description: 'Signed Non-Disclosure Agreement', is_active: true },
    { id: 10, category_code: 'OTHER', category_name: 'Other', description: 'Miscellaneous document', is_active: true }
  ],
  visitor_documents: [
    {
      id: 1,
      document_code: 'DOC-2026-00001',
      visitor_id: 1,
      visitor_code: 'VIS-2026-00009',
      visitor_name: 'belay ayele ayele ayele zewude',
      document_name: 'National Identity Card Scan.pdf',
      document_number: 'NID-998252002',
      category_id: 1,
      category_name: 'National ID',
      file_path: '/uploads/documents/doc-sample-1.pdf',
      document_url: '/uploads/documents/doc-sample-1.pdf',
      original_file_name: 'National_ID_Belay.pdf',
      file_type: 'application/pdf',
      file_size_bytes: 524288,
      issue_date: '2025-01-15',
      expiry_date: '2030-01-15',
      status: 'Verified',
      description: 'Front and back scan of National ID card',
      remarks: 'Identity verified during initial check-in',
      uploaded_by: 1,
      uploaded_by_name: 'System Admin',
      version_number: 1,
      is_archived: false,
      is_deleted: false,
      created_at: '2026-07-25T10:00:00Z',
      updated_at: '2026-07-25T10:00:00Z'
    },
    {
      id: 2,
      document_code: 'DOC-2026-00002',
      visitor_id: 2,
      visitor_code: 'VIS-2026-00002',
      visitor_name: 'Maria Garcia',
      document_name: 'Signed Non-Disclosure Agreement.pdf',
      document_number: 'NDA-2026-8812',
      category_id: 9,
      category_name: 'NDA',
      file_path: '/uploads/documents/doc-sample-2.pdf',
      document_url: '/uploads/documents/doc-sample-2.pdf',
      original_file_name: 'Signed_NDA_Maria_Garcia.pdf',
      file_type: 'application/pdf',
      file_size_bytes: 262144,
      issue_date: '2026-07-20',
      expiry_date: '2027-07-20',
      status: 'Verified',
      description: 'Standard visitor NDA form',
      remarks: 'Signed electronically at reception desk',
      uploaded_by: 6,
      uploaded_by_name: 'Lisa Thompson',
      version_number: 1,
      is_archived: false,
      is_deleted: false,
      created_at: '2026-07-25T11:30:00Z',
      updated_at: '2026-07-25T11:30:00Z'
    }
  ],
  document_version_history: [
    {
      id: 1,
      document_id: 1,
      version_number: 1,
      file_path: '/uploads/documents/doc-sample-1.pdf',
      original_file_name: 'National_ID_Belay.pdf',
      file_type: 'application/pdf',
      file_size_bytes: 524288,
      changes_description: 'Initial document upload',
      uploaded_by: 1,
      uploaded_by_name: 'System Admin',
      created_at: '2026-07-25T10:00:00Z'
    }
  ],
  visitor_photos: [],
  visitor_identity_verifications: [],
  visitor_identity_verification: [],
  visitor_watchlist: [],
  visitor_escorts: [],
  security_incidents: [
    { id: 1, title: 'Tailgating Incident at Turnstile Gate A', incident_title: 'Tailgating Incident at Turnstile Gate A', description: 'Unregistered individual attempted following an employee through the automated speed gate without scanning badge.', severity: 'CRITICAL', status: 'RESOLVED', location: 'Turnstile Speed Gate East A', resolution_notes: 'Incident resolved and cleared by security officer.', reported_by: 1, reporter_id: 1, incident_code: 'INC-2026-0041', created_at: '2026-09-29 05:05:29' }
  ],
  security_access_rules: [
    { id: 1, rule_name: 'Standard Visitor Zone A', zone_name: 'Main Lobby & Floor 1', access_level: 'PUBLIC', description: 'General visitor access to public reception and ground floor meeting rooms', is_active: true },
    { id: 2, rule_name: 'Restricted Executive Suite', zone_name: 'Floor 5 Executive', access_level: 'RESTRICTED', description: 'Access requires executive host escort or prior authorization', is_active: true },
    { id: 3, rule_name: 'Server Room Security Zone', zone_name: 'Basement Server Room', access_level: 'HIGH_SECURITY', description: 'Strictly restricted to authorized IT operations and certified security personnel', is_active: true }
  ],
  visitor_biometrics: [],
  // VMS Profile arrays (employees are seeded above — do NOT re-declare here)
  manager_profiles: [],
  receptionist_profiles: [],
  security_profiles: [],
  administrator_profiles: [],
  verification_requests: [],
  // Module 17 System Administration Collections
  system_settings: [
    { id: 1, key: 'company_name', value: 'Enterprise VMS Portal', category: 'general', updated_at: '2026-08-01T00:00:00Z' },
    { id: 2, key: 'system_name', value: 'Visitor Access & Security Hub', category: 'general', updated_at: '2026-08-01T00:00:00Z' },
    { id: 3, key: 'timezone', value: 'Africa/Addis_Ababa', category: 'regional', updated_at: '2026-08-01T00:00:00Z' },
    { id: 4, key: 'date_format', value: 'YYYY-MM-DD', category: 'regional', updated_at: '2026-08-01T00:00:00Z' },
    { id: 5, key: 'time_format', value: '24h', category: 'regional', updated_at: '2026-08-01T00:00:00Z' },
    { id: 6, key: 'currency', value: 'ETB', category: 'regional', updated_at: '2026-08-01T00:00:00Z' },
    { id: 7, key: 'session_timeout_minutes', value: '30', category: 'security', updated_at: '2026-08-01T00:00:00Z' },
    { id: 8, key: 'mfa_enabled', value: 'true', category: 'security', updated_at: '2026-08-01T00:00:00Z' }
  ],
  feature_flags: [
    { id: 1, key: 'vip_escort_workflow', name: 'VIP Escort Workflow', enabled: true, category: 'visitor', description: 'Enforces mandatory host escort for VIP visitors' },
    { id: 2, key: 'biometric_verification', name: 'Biometric Verification', enabled: true, category: 'security', description: 'Facial recognition matching at check-in kiosks' },
    { id: 3, key: 'contractor_document_check', name: 'Contractor Safety Doc Check', enabled: true, category: 'compliance', description: 'Requires safety induction docs before contractor check-in' },
    { id: 4, key: 'sms_instant_notifications', name: 'SMS Instant Alerts', enabled: true, category: 'notification', description: 'Sends real-time SMS to host employees upon arrival' },
    { id: 5, key: 'auto_archiving', name: 'Automatic Data Archiving', enabled: false, category: 'system', description: 'Archives visitor records older than 365 days' }
  ],
  backup_jobs: [
    { id: 1, filename: 'vms_backup_20260801_full.sql', type: 'FULL', size_mb: 245.8, status: 'COMPLETED', created_at: '2026-08-01T02:00:00Z', duration_sec: 42 },
    { id: 2, filename: 'vms_backup_20260807_incremental.sql', type: 'INCREMENTAL', size_mb: 18.4, status: 'COMPLETED', created_at: '2026-08-07T02:00:00Z', duration_sec: 12 }
  ],
  scheduled_jobs: [
    { id: 1, name: 'Daily Visitor Overstay Check', cron: '0 * * * *', status: 'ACTIVE', last_run: '2026-08-08T02:00:00Z', next_run: '2026-08-08T03:00:00Z' },
    { id: 2, name: 'Audit Log Archival', cron: '0 0 * * 0', status: 'ACTIVE', last_run: '2026-08-03T00:00:00Z', next_run: '2026-08-10T00:00:00Z' },
    { id: 3, name: 'Notification Queue Retry', cron: '*/5 * * * *', status: 'ACTIVE', last_run: '2026-08-08T02:55:00Z', next_run: '2026-08-08T03:00:00Z' }
  ],
  integration_configs: [
    { id: 1, name: 'Twilio SMS Gateway', type: 'SMS', status: 'CONNECTED', endpoint: 'https://api.twilio.com', last_sync: '2026-08-08T02:50:00Z' },
    { id: 2, name: 'SendGrid Email Service', type: 'EMAIL', status: 'CONNECTED', endpoint: 'smtp.sendgrid.net', last_sync: '2026-08-08T02:52:00Z' },
    { id: 3, name: 'Active Directory / LDAP', type: 'AUTH', status: 'CONNECTED', endpoint: 'ldap://ad.company.internal', last_sync: '2026-08-08T02:45:00Z' },
    { id: 4, name: 'Hikvision Gate Control', type: 'IOT_ACCESS', status: 'DISCONNECTED', endpoint: 'http://192.168.1.100:8080', last_sync: '2026-08-05T12:00:00Z' }
  ],
  security_policies: {
    min_password_length: 10,
    require_uppercase: true,
    require_numbers: true,
    require_symbols: true,
    max_failed_attempts: 5,
    lockout_duration_minutes: 15,
    ip_allowlist: ['192.168.1.0/24', '10.0.0.0/8'],
    ip_denylist: ['185.220.101.5']
  },
  maintenance_config: {
    is_active: false,
    message: 'System is undergoing scheduled maintenance. Please try again shortly.',
    allowed_roles: ['admin']
  }
};

async function query(sql, params = []) {
  if (useMock) {
    return handleMockQuery(sql, params);
  }

  // Sanitize params: replace all undefined with null to avoid MySQL driver crashes
  const sanitizedParams = params ? params.map(p => p === undefined ? null : p) : [];

  try {
    const [rows] = await originalQuery(sql, sanitizedParams);
    return rows;
  } catch (err) {
    // Ignorable schema-level errors (ALTER TABLE duplicates) — safe to suppress
    if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME') {
      return [];
    }
    // Column already exists during ALTER TABLE — safe to suppress
    if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
      return [];
    }
    const fatalConnErrors = ['ECONNREFUSED', 'ENOTFOUND', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'];
    if (fatalConnErrors.includes(err.code)) {
      console.warn(`Database connection failed (${err.code}). Falling back to mock database.`);
      useMock = true;
      return handleMockQuery(sql, sanitizedParams);
    }
    if (err.code === 'ETIMEDOUT' || err.code === 'PROTOCOL_CONNECTION_LOST') {
      try {
        const [retryRows] = await originalQuery(sql, sanitizedParams);
        return retryRows;
      } catch (retryErr) {
        console.warn(`Database query timeout (${err.code}). Falling back to mock database for request.`);
        return handleMockQuery(sql, sanitizedParams);
      }
    }

    // Critical data-integrity errors that MUST be thrown — never swallow silently
    const criticalErrors = [
      'ER_NO_REFERENCED_ROW_2', 'ER_NO_REFERENCED_ROW', 'ER_ROW_IS_REFERENCED_2', 
      'ER_DUP_ENTRY', 'ER_BAD_FIELD_ERROR', 'WARN_DATA_TRUNCATED', 
      'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD', 'ER_WARN_DATA_OUT_OF_RANGE', 'ER_BAD_NULL_ERROR'
    ];
    if (criticalErrors.includes(err.code)) {
      console.error(`[DB ERROR] ${err.code}: ${err.message}`);
      throw err;
    }

    // For non-critical errors in dev mode, fall back to mock cleanly
    if (process.env.NODE_ENV !== 'production') {
      if (process.env.DEBUG_DB) {
        console.warn(`Database query warning (${err.code}: ${err.message}). Handling fallback for single query.`);
      }
      return handleMockQuery(sql, sanitizedParams);
    }
    throw err;
  }
}

async function transaction(workCallback) {
  if (useMock) {
    return workCallback({
      execute: async (sql, params) => query(sql, params),
      query: async (sql, params) => query(sql, params),
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Wrap the connection with a Proxy to transparently sanitize params for all queries run inside transaction
    const connectionWrapper = new Proxy(connection, {
      get(target, prop, receiver) {
        if (prop === 'query' || prop === 'execute') {
          return async (sql, params) => {
            const sanitizedParams = params ? params.map(p => p === undefined ? null : p) : [];
            const [results] = await target[prop](sql, sanitizedParams);
            return results;
          };
        }
        return Reflect.get(target, prop, receiver);
      }
    });

    const result = await workCallback(connectionWrapper);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

function handleMockQuery(sql, params) {
  const normalizedSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();

  // 1. INSERT INTO APPOINTMENT_APPROVALS
  if (normalizedSql.includes('insert into appointment_approvals')) {
    const newId = mockDb.appointment_approvals.length + 1;
    mockDb.appointment_approvals.push({
      id: newId,
      appointment_id: params ? params[0] : null,
      level: params ? params[1] : null,
      approver_id: params ? params[2] : null,
      decision: params ? (params[3] || 'pending') : 'pending'
    });
    return { insertId: newId };
  }

  // 1a. UPDATE APPOINTMENT_APPROVALS
  if (normalizedSql.includes('update appointment_approvals')) {
    if (normalizedSql.includes('where id =')) {
      const id = params ? params[params.length - 1] : null;
      const approval = mockDb.appointment_approvals.find(a => a.id === parseInt(id));
      if (approval) {
        approval.decision = 'approved';
        approval.comment = params ? params[0] : null;
        approval.decided_at = new Date().toISOString();
      }
    } else if (normalizedSql.includes('appointment_id =')) {
      const apptId = params ? params[params.length - 1] : null;
      mockDb.appointment_approvals
        .filter(a => a.appointment_id === parseInt(apptId) && a.decision === 'pending')
        .forEach(a => {
          a.decision = 'approved';
          a.comment = params ? params[0] : 'Approved';
          a.decided_at = new Date().toISOString();
        });
    }
    return { affectedRows: 1 };
  }

  // 1b. SELECT FROM APPOINTMENT_APPROVALS
  if (normalizedSql.includes('from appointment_approvals')) {
    const apptId = params ? params[0] : null;
    if (normalizedSql.includes('count(*)')) {
      const count = mockDb.appointment_approvals.filter(
        a => a.appointment_id === parseInt(apptId) && a.decision === 'pending'
      ).length;
      return [{ count }];
    }
    if (normalizedSql.includes('approver_id =')) {
      const approverId = params ? params[1] : null;
      return mockDb.appointment_approvals.filter(
        a => a.appointment_id === parseInt(apptId) && a.approver_id === parseInt(approverId) && a.decision === 'pending'
      );
    }
    return mockDb.appointment_approvals.filter(a => a.appointment_id === parseInt(apptId)).map(a => {
      const approver = mockDb.users.find(u => u.id === a.approver_id) || {};
      return { ...a, approver_name: approver.full_name };
    });
  }

  // 2. INSERT INTO APPOINTMENT_DOCUMENTS
  if (normalizedSql.includes('insert into appointment_documents')) {
    const newId = mockDb.appointment_documents.length + 1;
    mockDb.appointment_documents.push({
      id: newId,
      appointment_id: params ? params[0] : null,
      file_name: params ? params[1] : null,
      file_url: params ? params[2] : null,
      doc_type: params ? params[3] : null
    });
    return { insertId: newId };
  }

  // 3. INSERT INTO NOTIFICATIONS
  if (normalizedSql.includes('insert into notifications')) {
    const newId = mockDb.notifications.length + 1;
    mockDb.notifications.push({
      id: newId,
      user_id: params ? params[0] : null,
      visitor_email: params ? params[1] : null,
      type: params ? params[2] : null,
      channel: params ? params[3] : null,
      title: params ? params[4] : null,
      message: params ? params[5] : null,
      is_read: false
    });
    return { insertId: newId };
  }

  // 4. INSERT INTO AUDIT_LOGS
  if (normalizedSql.includes('insert into audit_logs')) {
    const newId = mockDb.audit_logs.length + 1;
    mockDb.audit_logs.push({
      id: newId,
      actor_id: params ? params[0] : null,
      action: params ? params[1] : null,
      entity: params ? params[2] : null,
      entity_id: params ? params[3] : null,
      metadata_json: params ? params[4] : null
    });
    return { insertId: newId };
  }

  // 5. INSERT INTO EMPLOYEES
  if (normalizedSql.includes('insert into employees')) {
    if (!mockDb.employees) mockDb.employees = [];
    const newId = mockDb.employees.length + 1;
    const nowStr = new Date().toISOString();
    const newEmp = {
      id: newId,
      employee_id: newId,
      user_id: params ? params[0] || null : null,
      employee_number: params && params[1] ? params[1] : `EMP-2026-${Math.floor(Math.random() * 90000 + 10000)}`,
      first_name: params && params[2] ? params[2] : 'Employee',
      middle_name: params && params[3] ? params[3] : '',
      last_name: params && params[4] ? params[4] : '',
      full_name: params && params[5] ? params[5] : `${params && params[2] ? params[2] : 'New'} ${params && params[4] ? params[4] : 'Employee'}`.trim(),
      gender: params && params[6] ? params[6] : 'Male',
      dob: params && params[7] ? params[7] : null,
      nationality: params && params[8] ? params[8] : 'Ethiopian',
      marital_status: params && params[9] ? params[9] : 'Single',
      photo_url: params && params[10] ? params[10] : '',
      email: params && params[11] ? params[11] : `employee.${newId}@visitor.com`,
      mobile_number: params && params[12] ? params[12] : '',
      office_phone: params && params[13] ? params[13] : '',
      extension: params && params[14] ? params[14] : '',
      employment_type: params && params[15] ? params[15] : 'Full-Time',
      job_title: params && params[16] ? params[16] : 'Staff',
      position: params && params[17] ? params[17] : 'Employee',
      hire_date: params && params[18] ? params[18] : nowStr.slice(0, 10),
      employment_status: params && params[19] ? params[19] : 'Active',
      organization_id: params && params[20] ? params[20] : 1,
      branch_id: params && params[21] ? params[21] : 1,
      department_id: params && params[22] ? params[22] : 1,
      building_id: params && params[23] ? params[23] : 1,
      floor_number: params && params[24] ? params[24] : '',
      office_number: params && params[25] ? params[25] : '',
      manager_id: params && params[26] ? params[26] : null,
      emergency_contact_name: params && params[27] ? params[27] : '',
      emergency_contact_relation: params && params[28] ? params[28] : '',
      emergency_contact_phone: params && params[29] ? params[29] : '',
      is_host_enabled: params ? (params[30] === 1 || params[30] === true) : true,
      max_visitors_per_day: params && params[31] ? params[31] : 10,
      max_concurrent_visitors: params && params[32] ? params[32] : 3,
      default_room_id: params && params[33] ? params[33] : null,
      default_approval_role: params && params[34] ? params[34] : 'Host',
      availability_status: params && params[35] ? params[35] : 'Available',
      created_at: nowStr,
      updated_at: nowStr
    };
    mockDb.employees.unshift(newEmp);

    if (!mockDb.users) mockDb.users = [];
    const userExists = mockDb.users.find(u => u.email?.toLowerCase() === newEmp.email?.toLowerCase());
    if (!userExists) {
      const uId = mockDb.users.length + 1;
      mockDb.users.unshift({
        id: uId,
        user_id: uId,
        username: newEmp.email ? newEmp.email.split('@')[0] : newEmp.employee_number,
        email: newEmp.email,
        password_hash: PASSWORD_HASH,
        full_name: newEmp.full_name,
        role: 'staff',
        user_code: newEmp.employee_number,
        account_status: 'ACTIVE',
        status: 'active',
        verification_status: 'VERIFIED',
        failed_login_attempts: 0,
        created_at: nowStr
      });
      newEmp.user_id = uId;
    }

    return { insertId: newId };
  }

  // 5. INSERT INTO VISITORS
  if (normalizedSql.includes('insert into visitors')) {
    const newId = mockDb.visitors.length + 1;
    const newVisitor = {
      id: newId,
      organization_id: params ? params[0] : null,
      user_id: params ? params[1] : null,
      visitor_type_id: params ? params[2] : null,
      visitor_company_id: params ? params[3] : null,
      first_name: params ? params[4] : null,
      middle_name: params ? params[5] : null,
      last_name: params ? params[6] : null,
      full_name: params ? params[7] : null,
      email: params ? params[8] : null,
      phone: params ? params[9] : null,
      gender: params ? params[10] : null,
      date_of_birth: params ? params[11] : null,
      nationality: params ? params[12] : null,
      company: params ? params[13] : null,
      category: params ? params[14] : null,
      photo_url: params ? params[15] : null,
      id_type: params ? params[16] : null,
      id_number: params ? params[17] : null,
      emergency_contact_name: params ? params[18] : null,
      emergency_contact_phone: params ? params[19] : null,
      registration_status: params ? params[20] : 'PENDING',
      status: 'ACTIVE',
      is_blacklisted: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockDb.visitors.push(newVisitor);
    return { insertId: newId };
  }

  // 5a-2. INSERT INTO VISITOR_DOCUMENTS
  if (normalizedSql.includes('insert into visitor_documents')) {
    const newId = (mockDb.visitor_documents || []).length + 1;
    const vId = params ? params[0] : 1;
    const matchedVisitor = (mockDb.visitors || []).find(v => v.id == vId || v.user_id == vId) || {};
    const vName = matchedVisitor.full_name || matchedVisitor.name || 'John Smith';
    const vCode = matchedVisitor.visitor_code || `VIS-${String(vId).padStart(4, '0')}`;
    const docType = params ? (params[1] || 'Passport') : 'Passport';
    const docNum = params ? (params[2] || null) : null;
    const fileUrl = params ? (params[3] || '/uploads/documents/doc.pdf') : '/uploads/documents/doc.pdf';
    const fileName = params ? (params[4] || 'Document.pdf') : 'Document.pdf';
    const fileSize = params ? (params[5] || 102400) : 102400;
    const mimeType = params ? (params[6] || 'application/pdf') : 'application/pdf';
    const expDate = params ? (params[7] || null) : null;

    const newDoc = {
      id: newId,
      document_code: `DOC-${Date.now()}`,
      ref_number: `REF-DOC-${Date.now()}`,
      visitor_id: vId,
      visitor_code: vCode,
      visitor_name: vName,
      document_type: docType,
      category_name: docType,
      document_name: fileName.replace(/\.[^/.]+$/, ''),
      document_number: docNum || `EP${Math.floor(100000 + Math.random() * 900000)}`,
      file_url: fileUrl,
      file_path: fileUrl,
      document_url: fileUrl,
      file_name: fileName,
      original_file_name: fileName,
      file_size: fileSize,
      file_size_bytes: fileSize,
      mime_type: mimeType,
      file_type: mimeType,
      expiry_date: expDate,
      verification_status: 'Pending Review',
      status: 'Pending Review',
      approval_status: 'Pending Review',
      is_active: true,
      is_archived: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (!mockDb.visitor_documents) mockDb.visitor_documents = [];
    mockDb.visitor_documents.unshift(newDoc);
    return { insertId: newId };
  }

  // 5a. INSERT INTO USERS
  if (normalizedSql.includes('insert into users')) {
    const newId = mockDb.users.length + 1;
    const colMatch = sql.match(/insert\s+into\s+users\s*\(([^)]+)\)/i);
    const newUser = {
      id: newId,
      user_id: newId,
      account_status: 'ACTIVE',
      status: 'active',
      email_verified: false,
      failed_login_attempts: 0,
      verification_status: 'VERIFIED',
      created_at: new Date().toISOString()
    };

    if (colMatch && params) {
      const cols = colMatch[1].split(',').map(c => c.trim().toLowerCase());
      cols.forEach((col, idx) => {
        if (params[idx] !== undefined) {
          newUser[col] = params[idx];
        }
      });
      if (newUser.department_id) {
        newUser.department_id = parseInt(newUser.department_id) || null;
      }
    } else if (params) {
      newUser.username = params[0];
      newUser.email = params[1];
      newUser.password_hash = params[2];
      newUser.first_name = params[3];
      newUser.middle_name = params[4];
      newUser.last_name = params[5];
      newUser.full_name = params[6];
      newUser.phone = params[7];
      newUser.phone_number = params[8];
      newUser.role = params[9];
      newUser.department_id = params[10] ? parseInt(params[10]) : null;
      newUser.job_title = params[11];
      newUser.user_code = params[12];
    }
    mockDb.users.push(newUser);
    return [{ insertId: newId }, {}];
  }

  // 6. INSERT INTO APPOINTMENTS
  if (normalizedSql.includes('insert into appointments')) {
    const newId = mockDb.appointments.length + 1;
    const appt = {
      id: newId,
      visitor_id: params ? params[0] : null,
      host_id: params ? params[1] : null,
      department_id: params ? params[2] : null,
      room_id: params ? params[3] : null,
      purpose: params ? params[4] : null,
      visit_type: params ? params[5] : null,
      scheduled_start: params ? params[6] : null,
      scheduled_end: params? params[7] : null,
      reference_code: params ? params[8] : null,
      qr_token: params ? params[9] : null,
      status: 'pending_approval',
      current_approval_level: 1,
      verification_status: params && params.length > 10 ? params[10] : 'unverified',
      similarity_score: params && params.length > 11 ? params[11] : null,
      verified_at: params && params.length > 10 ? new Date().toISOString() : null
    };
    mockDb.appointments.push(appt);
    return { insertId: newId };
  }

  // 6a. INSERT INTO VERIFICATION_ATTEMPTS
  if (normalizedSql.includes('insert into verification_attempts')) {
    const email = params ? params[0] : null;
    const attempts = params ? params[1] : 0;
    const lockedUntil = params ? params[2] : null;
    let attempt = mockDb.verification_attempts.find(a => a.email === email);
    if (attempt) {
      attempt.attempts = attempts;
      attempt.locked_until = lockedUntil;
    } else {
      attempt = {
        id: mockDb.verification_attempts.length + 1,
        email,
        attempts,
        locked_until: lockedUntil
      };
      mockDb.verification_attempts.push(attempt);
    }
    return { insertId: attempt.id };
  }

  // 6b. UPDATE VERIFICATION_ATTEMPTS
  if (normalizedSql.includes('update verification_attempts')) {
    const attempts = params ? params[0] : 0;
    const lockedUntil = params ? params[1] : null;
    const email = params ? params[2] : null;
    const attempt = mockDb.verification_attempts.find(a => a.email === email);
    if (attempt) {
      attempt.attempts = attempts;
      attempt.locked_until = lockedUntil;
    }
    return { affectedRows: 1 };
  }

  // 7. UPDATE VISITORS
  if (normalizedSql.includes('update visitors')) {
    const visitorId = params ? params[params.length - 1] : null;
    const visitor = mockDb.visitors.find(v => v.id == visitorId);
    if (visitor && params) {
      // Dynamically parse SET clause columns
      const setMatch = sql.match(/set\s+([\s\S]+?)\s+where/i);
      if (setMatch) {
        const setParts = setMatch[1].split(',').map(p => p.split('=')[0].trim().toLowerCase().replace(/[`"']/g, ''));
        setParts.forEach((col, idx) => {
          if (idx < params.length - 1 && params[idx] !== undefined) {
            visitor[col] = params[idx];
          }
        });
      }
    }
    return { affectedRows: visitor ? 1 : 0 };
  }

  // 7a. UPDATE USERS
  if (normalizedSql.includes('update users')) {
    const id = params ? params[params.length - 1] : null;
    const user = mockDb.users.find(u => u.id === parseInt(id));
    if (user && params) {
      const setMatch = sql.match(/set\s+([\s\S]+?)\s+where/i);
      if (setMatch) {
        const setParts = setMatch[1].split(',').map(p => p.split('=')[0].trim().toLowerCase().replace(/[`"']/g, ''));
        setParts.forEach((col, idx) => {
          if (idx < params.length - 1 && params[idx] !== undefined) {
            user[col] = params[idx];
          }
        });
      }
    }
    return { affectedRows: 1 };
  }

  // 8. UPDATE APPOINTMENTS
  if (normalizedSql.includes('update appointments')) {
    const statusMatch = sql.match(/status\s*=\s*['"]([^'"]+)['"]/i);
    const status = statusMatch ? statusMatch[1] : null;
    const id = params ? params[params.length - 1] : null;
    const appt = mockDb.appointments.find(a => a.id === parseInt(id));
    if (appt && status) {
      appt.status = status;
    }
    return { affectedRows: 1 };
  }

  // 9. SELECT FROM DEPARTMENTS
  if (normalizedSql.includes('from departments')) {
    return mockDb.departments.map(d => {
      const manager = mockDb.users.find(u => u.id === d.manager_id);
      const empCount = mockDb.users.filter(u => u.department_id === d.id && u.role === 'staff').length;
      return {
        ...d,
        manager_name: manager ? manager.full_name : null,
        employee_count: empCount
      };
    });
  }

  // 10. SELECT FROM ROOMS
  if (normalizedSql.includes('from rooms')) {
    return mockDb.rooms.map(r => {
      const bookingsCount = mockDb.appointments.filter(a => a.room_id === r.id && a.status === 'approved').length;
      return {
        ...r,
        current_bookings: bookingsCount
      };
    });
  }

  // 11. SELECT FROM APPROVAL_WORKFLOWS
  if (normalizedSql.includes('from approval_workflows')) {
    const deptId = params ? params[0] : null;
    return mockDb.approval_workflows.filter(w => w.department_id === parseInt(deptId));
  }

  // 12. SELECT FROM APPROVAL_STEPS
  if (normalizedSql.includes('from approval_steps')) {
    const workflowId = params ? params[0] : null;
    return mockDb.approval_steps.filter(s => s.workflow_id === parseInt(workflowId));
  }

  // 13. SELECT FROM BLACKLIST
  if (normalizedSql.includes('from blacklist')) {
    return mockDb.blacklist.map(b => {
      const visitor = mockDb.visitors.find(v => v.id === b.visitor_id) || {};
      return {
        id: b.id,
        visitor_id: b.visitor_id,
        full_name: visitor.full_name,
        email: visitor.email,
        company: visitor.company,
        reason: b.reason,
        expires_at: b.expires_at
      };
    });
  }

  // 13a. SELECT FROM VERIFICATION_ATTEMPTS
  if (normalizedSql.includes('from verification_attempts')) {
    const email = params ? params[0] : null;
    const attempt = mockDb.verification_attempts.find(a => a.email === email);
    return attempt ? [attempt] : [];
  }

  // 14. SELECT FROM USERS
  if (normalizedSql.includes('from users')) {
    // generateUserCode: SELECT user_code FROM users WHERE user_code LIKE ?
    if (normalizedSql.includes('select user_code') && normalizedSql.includes('like')) {
      const prefix = (params && params[0] ? params[0] : '').replace('%', '');
      return mockDb.users
        .filter(u => u.user_code && u.user_code.startsWith(prefix))
        .map(u => ({ user_code: u.user_code }));
    }
    if (normalizedSql.includes('department_id =') && normalizedSql.includes('role =')) {
      const deptId = params ? params[0] : null;
      // The role value is hardcoded in the SQL string (e.g. role = 'staff'), not a parameter
      const roleMatch = normalizedSql.match(/role\s*=\s*'([^']+)'/);
      const role = roleMatch ? roleMatch[1] : (params && params[1] ? params[1] : 'staff');
      return mockDb.users
        .filter(u => u.department_id === parseInt(deptId) && u.role === role && u.status === 'active')
        .map(u => ({ id: u.id, full_name: u.full_name, email: u.email, job_title: u.job_title, status: u.status }));
    }
    if (normalizedSql.includes('department_id =')) {
      const deptId = params ? params[0] : null;
      return mockDb.users.filter(u => u.department_id === parseInt(deptId));
    }
    if (normalizedSql.includes('email') || normalizedSql.includes('username') || normalizedSql.includes('user_code')) {
      const identifier = params ? params[0] : null;
      if (identifier) {
        const lowerId = String(identifier).toLowerCase().trim();
        const prefixId = lowerId.includes('@') ? lowerId : `${lowerId}@`;
        const user = mockDb.users.find(u => {
          const uEmail = (u.email || '').toLowerCase();
          const uName = (u.username || '').toLowerCase();
          const uCode = (u.user_code || '').toLowerCase();
          return uEmail === lowerId || uName === lowerId || uCode === lowerId || uEmail.startsWith(prefixId) || uName.startsWith(lowerId);
        });
        if (user) return [user];
      }
      return [];
    }
    if (normalizedSql.includes('id =')) {
      const id = params ? params[0] : null;
      const user = mockDb.users.find(u => u.id === parseInt(id));
      return user ? [user] : [];
    }
    return mockDb.users;
  }

  // 15. SELECT FROM VISITORS
  if (normalizedSql.includes('from visitors')) {
    // Handle WHERE user_id = ? (used by findByUserId)
    if (normalizedSql.includes('user_id =')) {
      const uid = params ? params[0] : null;
      const match = mockDb.visitors.filter(v => v.user_id == uid && v.is_active !== false);
      return match;
    }
    if (normalizedSql.includes('email =')) {
      const email = params ? params[0] : null;
      const match = mockDb.visitors.filter(v => v.email === email);
      if (match.length) return match;
      if (params && params.length > 1 && params[1]) {
        return mockDb.visitors.filter(v => v.id_number === params[1]);
      }
      return [];
    }
    if (normalizedSql.includes('where') && normalizedSql.includes('id =')) {
      const vid = params ? params[0] : null;
      return mockDb.visitors.filter(v => v.id == vid && v.is_active !== false);
    }
    return mockDb.visitors;
  }

  // 15b. SELECT FROM VISITOR_DOCUMENTS
  if (normalizedSql.includes('from visitor_documents')) {
    const visitorId = params ? params[0] : null;
    let docs = mockDb.visitor_documents || [];
    // Filter by visitor_id if WHERE visitor_id = ? is present
    if (visitorId && normalizedSql.includes('visitor_id =')) {
      const match = docs.filter(d => d.visitor_id == visitorId || d.visitor_id == 1);
      docs = match.length > 0 ? match : docs;
    }
    // Filter active only if is_active check present
    if (normalizedSql.includes('is_active')) {
      docs = docs.filter(d => d.is_active !== false && d.is_deleted !== true);
    }
    // Map seed data fields to match the repository SELECT column names
    docs = docs.map(d => ({
      id: d.id,
      visitor_id: d.visitor_id,
      document_type: d.document_type || d.category_name || d.document_name || 'OTHER',
      document_number: d.document_number || null,
      file_url: d.file_url || d.file_path || d.document_url || null,
      file_name: d.file_name || d.original_file_name || d.document_name || null,
      file_size: d.file_size || d.file_size_bytes || 0,
      mime_type: d.mime_type || d.file_type || null,
      verification_status: d.verification_status || d.status || 'PENDING',
      verified_by: d.verified_by || null,
      verified_at: d.verified_at || null,
      expiry_date: d.expiry_date || null,
      is_active: d.is_active !== false,
      created_at: d.created_at || new Date().toISOString(),
      updated_at: d.updated_at || new Date().toISOString()
    }));
    // Sort by created_at DESC
    docs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return docs;
  }

  // 16. SELECT FROM APPOINTMENTS (including joins for active checkins)
  if (normalizedSql.includes('from appointments')) {
    if (normalizedSql.includes('c.checked_out_at is null') && normalizedSql.includes('reference_code =')) {
      const code = params ? params[0] : null;
      const activeCheckin = mockDb.checkins.find(c => {
        if (c.checked_out_at) return false;
        const appt = mockDb.appointments.find(a => a.id === c.appointment_id);
        if (!appt) return false;
        const pass = mockDb.visitor_passes.find(p => p.id === c.pass_id);
        return appt.reference_code === code || (pass && pass.pass_code === code) || c.badge_number === code;
      });

      if (activeCheckin) {
        const appt = mockDb.appointments.find(a => a.id === activeCheckin.appointment_id);
        const visitor = mockDb.visitors.find(v => v.id === appt.visitor_id) || {};
        const host = mockDb.users.find(u => u.id === appt.host_id) || {};
        const pass = mockDb.visitor_passes.find(p => p.id === activeCheckin.pass_id) || {};
        return [{
          appointment_id: appt.id,
          reference_code: appt.reference_code,
          purpose: appt.purpose,
          scheduled_start: appt.scheduled_start,
          scheduled_end: appt.scheduled_end,
          visitor_id: visitor.id,
          visitor_name: visitor.full_name,
          visitor_company: visitor.company,
          visitor_phone: visitor.phone,
          visitor_email: visitor.email,
          host_id: host.id,
          host_name: host.full_name,
          checkin_id: activeCheckin.id,
          checked_in_at: activeCheckin.checked_in_at,
          badge_number: activeCheckin.badge_number,
          visitor_pass_id: pass.id || null,
          pass_code: pass.pass_code || null
        }];
      }
      return [];
    }

    if (normalizedSql.includes('reference_code =')) {
      const ref = params ? params[0] : null;
      const appt = mockDb.appointments.find(a => a.reference_code === ref);
      if (appt) {
        const visitor = mockDb.visitors.find(v => v.id === appt.visitor_id) || {};
        const host = mockDb.users.find(u => u.id === appt.host_id) || {};
        const dept = mockDb.departments.find(d => d.id === appt.department_id) || {};
        const room = mockDb.rooms.find(r => r.id === appt.room_id) || {};
        const checkin = mockDb.checkins.find(c => c.appointment_id === appt.id) || {};
        return [{
          ...appt,
          visitor_name: visitor.full_name,
          visitor_email: visitor.email,
          visitor_phone: visitor.phone,
          company: visitor.company,
          id_type: visitor.id_type,
          id_number: visitor.id_number,
          is_blacklisted: visitor.is_blacklisted || false,
          host_name: host.full_name,
          host_user_id: host.id,
          department_name: dept.name,
          room_name: room.name || null,
          checked_in_at: checkin.checked_in_at || null,
          checked_out_at: checkin.checked_out_at || null,
          badge_number: checkin.badge_number || null
        }];
      }
      return [];
    }
    if (normalizedSql.includes('qr_token =')) {
      const token = params ? params[0] : null;
      const appt = mockDb.appointments.find(a => a.qr_token === token);
      if (appt) {
        const visitor = mockDb.visitors.find(v => v.id === appt.visitor_id) || {};
        const host = mockDb.users.find(u => u.id === appt.host_id) || {};
        return [{
          ...appt,
          visitor_name: visitor.full_name,
          is_blacklisted: visitor.is_blacklisted || false,
          host_name: host.full_name,
          host_user_id: host.id,
          email: visitor.email
        }];
      }
      return [];
    }
    if (normalizedSql.includes('a.id =') || (normalizedSql.includes('where id =') && !normalizedSql.includes('visitor_id ='))) {
      const id = params ? params[0] : null;
      const appt = mockDb.appointments.find(a => a.id === parseInt(id));
      if (appt) {
        const visitor = mockDb.visitors.find(v => v.id === appt.visitor_id) || {};
        const host = mockDb.users.find(u => u.id === appt.host_id) || {};
        const dept = mockDb.departments.find(d => d.id === appt.department_id) || {};
        const room = mockDb.rooms.find(r => r.id === appt.room_id) || {};
        return [{
          ...appt,
          email: visitor.email,
          visitor_name: visitor.full_name,
          visitor_email: visitor.email,
          visitor_phone: visitor.phone,
          company: visitor.company,
          id_type: visitor.id_type,
          id_number: visitor.id_number,
          is_blacklisted: visitor.is_blacklisted || false,
          host_name: host.full_name,
          host_user_id: host.id,
          department_name: dept.name,
          room_name: room.name || null
        }];
      }
      return [];
    }
    if (normalizedSql.includes('visitor_id =')) {
      const visitorId = params ? params[0] : null;
      const vIdInt = parseInt(visitorId);
      return mockDb.appointments.filter(a => a.visitor_id === vIdInt).map(appt => {
        const visitor = mockDb.visitors.find(v => v.id === vIdInt || v.id == visitorId || v.user_id == visitorId) || {};
        const matchedUser = mockDb.users.find(u => u.id === vIdInt || u.id == visitor.user_id) || {};
        const host = mockDb.users.find(u => u.id === appt.host_id) || {};
        const dept = mockDb.departments.find(d => d.id === appt.department_id) || {};
        const room = mockDb.rooms.find(r => r.id === appt.room_id) || {};
        const checkin = mockDb.checkins.find(c => c.appointment_id === appt.id) || {};
        const fullName = visitor.full_name || matchedUser.full_name || matchedUser.username || 'Registered Visitor';
        const email = visitor.email || matchedUser.email || '';
        const phone = visitor.phone || matchedUser.phone || '';
        return {
          ...appt,
          appointmentId: appt.id,
          referenceCode: appt.reference_code,
          scheduledStart: appt.scheduled_start,
          scheduledEnd: appt.scheduled_end,
          appointmentStatus: appt.appointment_status || appt.status,
          visitor_name: fullName,
          visitor_email: email,
          visitor_phone: phone,
          visitor_company: visitor.company || 'Enterprise Visitor',
          visitor_category: visitor.category || 'General Visitor',
          identity_type: visitor.id_type || 'Government ID',
          identity_number: visitor.id_number || 'VERIFIED',
          photo_url: visitor.photo_url || '',
          hostName: host.full_name || 'Security Officer',
          host_name: host.full_name || 'Security Officer',
          departmentName: dept.name || 'Security Office',
          department_name: dept.name || 'Security Office',
          roomName: room.name || null,
          entryTime: checkin.checked_in_at || null,
          exitTime: checkin.checked_out_at || null,
          durationMinutes: appt.expected_duration_minutes || 30
        };
      });
    }
    // Return all appointments with visitor name, host name, department name, checkin details, etc.
    return mockDb.appointments.map(appt => {
      const visitor = mockDb.visitors.find(v => v.id === appt.visitor_id) || {};
      const host = mockDb.users.find(u => u.id === appt.host_id) || {};
      const dept = mockDb.departments.find(d => d.id === appt.department_id) || {};
      const room = mockDb.rooms.find(r => r.id === appt.room_id) || {};
      const checkin = mockDb.checkins.find(c => c.appointment_id === appt.id) || {};
      return {
        ...appt,
        visitor_name: visitor.full_name,
        visitor_email: visitor.email,
        visitor_phone: visitor.phone,
        company: visitor.company,
        id_type: visitor.id_type,
        id_number: visitor.id_number,
        host_name: host.full_name,
        department_name: dept.name,
        room_name: room.name || null,
        checked_in_at: checkin.checked_in_at || null,
        checked_out_at: checkin.checked_out_at || null,
        badge_number: checkin.badge_number || null
      };
    });
  }

  // 16b. SELECT FROM VISITOR_HISTORIES
  if (normalizedSql.includes('from visitor_histories')) {
    let results = mockDb.visitor_histories || [];
    if (normalizedSql.includes('visitor_id =') && params && params[0]) {
      const vId = parseInt(params[0]);
      results = results.filter(h => {
        if (h.is_deleted) return false;
        return h.visitor_id === vId || h.visitor_id === String(vId);
      });
      // Also try matching by visitor_email if second param provided
      if (results.length === 0 && params[1]) {
        const visitor = mockDb.visitors.find(v => v.id === parseInt(params[1]));
        if (visitor && visitor.email) {
          results = (mockDb.visitor_histories || []).filter(h => {
            if (h.is_deleted) return false;
            return h.visitor_email === visitor.email;
          });
        }
      }
    }
    return results;
  }

  // 17. INSERT INTO VISITOR_PASSES
  if (normalizedSql.includes('insert into visitor_passes')) {
    const newId = mockDb.visitor_passes.length + 1;
    mockDb.visitor_passes.push({
      id: newId,
      appointment_id: params ? params[0] : null,
      pass_code: params ? params[1] : null,
      qr_token: params ? params[2] : null,
      barcode_data: params ? params[3] : null,
      status: 'active',
      is_printed: true,
      issued_by: params ? params[4] : null,
      expires_at: params ? params[5] : null
    });
    return { insertId: newId };
  }

  // 17a. UPDATE VISITOR_PASSES
  if (normalizedSql.includes('update visitor_passes')) {
    const id = params ? params[params.length - 1] : null;
    const pass = mockDb.visitor_passes.find(p => p.id === parseInt(id));
    if (pass) {
      pass.status = 'revoked';
      pass.updated_at = new Date().toISOString();
    }
    return { affectedRows: 1 };
  }

  // 17b. SELECT FROM VISITOR_PASSES
  if (normalizedSql.includes('from visitor_passes')) {
    if (normalizedSql.includes('appointment_id =')) {
      const apptId = params ? params[0] : null;
      return mockDb.visitor_passes.filter(p => p.appointment_id === parseInt(apptId));
    }
    return mockDb.visitor_passes;
  }

  // 18. INSERT INTO CHECKINS
  if (normalizedSql.includes('insert into checkins')) {
    const newId = mockDb.checkins.length + 1;
    mockDb.checkins.push({
      id: newId,
      appointment_id: params ? params[0] : null,
      checked_in_at: new Date().toISOString(),
      checked_out_at: null,
      receptionist_id: params ? params[1] : null,
      badge_number: params ? params[2] : null,
      pass_id: params ? params[3] : null
    });
    return { insertId: newId };
  }

  // 19. INSERT INTO VISITOR_CHECKINS
  if (normalizedSql.includes('insert into visitor_checkins')) {
    const newId = mockDb.visitor_checkins.length + 1;
    mockDb.visitor_checkins.push({
      id: newId,
      visitor_id: params ? params[0] : null,
      appointment_id: params ? params[1] : null,
      visitor_pass_id: params ? params[2] : null,
      receptionist_user_id: params ? params[3] : null,
      organization_id: params ? params[4] : null,
      building_id: params ? params[5] : null,
      floor_id: params ? params[6] : null,
      checkin_method: params ? params[7] : 'QR_CODE',
      checkin_source: params ? params[8] : 'RECEPTION_DESK',
      status: 'ACTIVE',
      checkin_time: new Date().toISOString(),
      expected_checkout_time: params ? params[9] : null,
      remarks: params ? params[10] : null,
      is_active: true,
      created_by: params ? params[11] : null
    });
    return { insertId: newId };
  }

  // 20. UPDATE CHECKINS
  if (normalizedSql.includes('update checkins')) {
    const id = params ? params[params.length - 1] : null;
    const checkin = mockDb.checkins.find(c => c.id === parseInt(id));
    if (checkin) {
      if (normalizedSql.includes('checked_out_at = now()')) {
        checkin.checked_out_at = new Date().toISOString();
      } else if (normalizedSql.includes('checked_out_at = ?')) {
        checkin.checked_out_at = params[0];
      }
    }
    return { affectedRows: 1 };
  }

  // 21. UPDATE VISITOR_CHECKINS
  if (normalizedSql.includes('update visitor_checkins')) {
    const id = params ? params[params.length - 1] : null;
    const checkin = mockDb.visitor_checkins.find(c => c.id === parseInt(id));
    if (checkin) {
      if (normalizedSql.includes('status = ?')) {
        checkin.status = params[0];
      }
      if (normalizedSql.includes('actual_checkout_time = ?')) {
        checkin.actual_checkout_time = params[1] || new Date().toISOString();
      }
    }
    return { affectedRows: 1 };
  }

  // 22. INSERT INTO VISITOR_CHECKOUTS
  if (normalizedSql.includes('insert into visitor_checkouts')) {
    const newId = mockDb.visitor_checkouts.length + 1;
    const checkinId = params ? params[0] : null;
    const checkout = {
      id: newId,
      checkin_id: checkinId,
      visitor_id: params ? params[1] : null,
      appointment_id: params ? params[2] : null,
      host_id: params ? params[3] : null,
      receptionist_id: params ? params[4] : null,
      security_officer_id: params ? params[5] : null,
      checkout_time: new Date().toISOString(),
      checkout_method: params ? params[6] : 'MANUAL',
      checkout_status: params ? params[7] : 'COMPLETED',
      expected_checkout_time: params ? params[8] : null,
      actual_checkout_time: new Date().toISOString(),
      visit_completion_status: params ? params[9] : 'NORMAL',
      total_visit_duration: params ? params[10] : 0,
      remarks: params ? params[11] : null,
      is_active: true,
      created_by: params ? params[12] : null
    };
    mockDb.visitor_checkouts.push(checkout);

    // Calculate stay duration
    const checkinRecord = mockDb.visitor_checkins.find(c => c.id === checkinId);
    if (checkinRecord) {
      const checkinTime = new Date(checkinRecord.checkin_time);
      const checkoutTime = new Date(checkout.checkout_time);
      const diffMins = Math.round((checkoutTime - checkinTime) / 60000);
      const diffHours = diffMins / 60.0;
      let durationCategory = 'STANDARD_STAY';
      if (diffMins <= 60) durationCategory = 'SHORT_STAY';
      else if (diffMins > 480) durationCategory = 'LONG_STAY';

      mockDb.visit_durations.push({
        id: mockDb.visit_durations.length + 1,
        checkout_id: newId,
        checkin_id: checkinId,
        checkin_time: checkinRecord.checkin_time,
        checkout_time: checkout.checkout_time,
        total_minutes: diffMins,
        total_hours: diffHours,
        is_overtime: checkout.visit_completion_status === 'LATE',
        duration_category: durationCategory,
        is_active: true,
        created_by: checkout.created_by
      });
    }

    return { insertId: newId };
  }

  // 23. INSERT INTO VISITOR_ASSET_RETURNS
  if (normalizedSql.includes('insert into visitor_asset_returns')) {
    const newId = mockDb.visitor_asset_returns.length + 1;
    mockDb.visitor_asset_returns.push({
      id: newId,
      checkout_id: params ? params[0] : null,
      visitor_id: params ? params[1] : null,
      asset_id: params ? params[2] : null,
      asset_name: params ? params[3] : null,
      issued_time: params ? params[4] : null,
      returned_time: new Date().toISOString(),
      asset_condition: params ? params[5] : 'GOOD',
      return_status: params ? params[6] : 'RETURNED',
      verified_by: params ? params[7] : null,
      remarks: params ? params[8] : null,
      is_active: true,
      created_by: params ? params[9] : null
    });
    return { insertId: newId };
  }

  // 24. INSERT INTO VISITOR_PASS_RETURNS
  if (normalizedSql.includes('insert into visitor_pass_returns')) {
    const newId = mockDb.visitor_pass_returns.length + 1;
    const returnedPass = {
      id: newId,
      checkout_id: params ? params[0] : null,
      visitor_pass_id: params ? params[1] : null,
      return_time: new Date().toISOString(),
      returned_by: params ? params[2] : null,
      pass_condition: params ? params[3] : 'GOOD',
      pass_status: params ? params[4] : 'RETURNED',
      deactivation_status: params ? params[5] : 'DEACTIVATED',
      remarks: params ? params[6] : null,
      is_active: true,
      created_by: params ? params[7] : null
    };
    mockDb.visitor_pass_returns.push(returnedPass);

    const pass = mockDb.visitor_passes.find(p => p.id === returnedPass.visitor_pass_id);
    if (pass) {
      pass.status = 'revoked';
    }
    return { insertId: newId };
  }

  // 25. INSERT INTO CHECKOUT_VERIFICATIONS
  if (normalizedSql.includes('insert into checkout_verifications')) {
    const newId = mockDb.checkout_verifications.length + 1;
    mockDb.checkout_verifications.push({
      id: newId,
      checkout_id: params ? params[0] : null,
      verification_type: params ? params[1] : 'IDENTITY',
      verification_status: params ? params[2] : 'PASSED',
      verified_by: params ? params[3] : null,
      verification_time: new Date().toISOString(),
      verification_result: params ? params[4] : 'PASSED',
      security_notes: params ? params[5] : null,
      is_active: true,
      created_by: params ? params[6] : null
    });
    return { insertId: newId };
  }

  // 26. INSERT INTO CHECKOUT_EXCEPTIONS
  if (normalizedSql.includes('insert into checkout_exceptions')) {
    const newId = mockDb.checkout_exceptions.length + 1;
    mockDb.checkout_exceptions.push({
      id: newId,
      checkout_id: params ? params[0] : null,
      exception_type: params ? params[1] : null,
      severity: params ? params[2] : 'LOW',
      description: params ? params[3] : null,
      resolution_status: params ? params[4] : 'RESOLVED',
      resolved_by: params ? params[5] : null,
      resolved_at: params ? params[6] : null,
      is_active: true,
      created_by: params ? params[7] : null
    });
    return { insertId: newId };
  }

  // 27. INSERT INTO CHECKOUT_FEEDBACKS
  if (normalizedSql.includes('insert into checkout_feedbacks')) {
    const newId = mockDb.checkout_feedbacks.length + 1;
    mockDb.checkout_feedbacks.push({
      id: newId,
      checkout_id: params ? params[0] : null,
      rating: params ? params[1] : 5,
      comments: params ? params[2] : null,
      reception_rating: params ? params[3] : 5,
      host_rating: params ? params[4] : 5,
      overall_rating: params ? params[5] : 5,
      submitted_at: new Date().toISOString(),
      is_active: true,
      created_by: params ? params[6] : null
    });
    return { insertId: newId };
  }

  // 28. SELECT FROM CHECKINS
  if (normalizedSql.includes('from checkins') && !normalizedSql.includes('join')) {
    if (normalizedSql.includes('appointment_id =')) {
      const apptId = params ? params[0] : null;
      const filtered = mockDb.checkins.filter(c => c.appointment_id === parseInt(apptId));
      filtered.sort((a, b) => new Date(b.checked_in_at) - new Date(a.checked_in_at));
      return filtered;
    }
    return mockDb.checkins;
  }

  // 29. SELECT FROM VISITOR_CHECKINS
  if (normalizedSql.includes('from visitor_checkins')) {
    if (normalizedSql.includes('appointment_id =')) {
      const apptId = params ? params[0] : null;
      return mockDb.visitor_checkins.filter(c => c.appointment_id === parseInt(apptId) && c.status === 'ACTIVE');
    }
    return mockDb.visitor_checkins;
  }

  // 30. SELECT FROM ORGANIZATIONS
  if (normalizedSql.includes('from organizations')) {
    return [{ id: 1, name: 'Corporate HQ' }];
  }

  // 31. SELECT FROM BUILDINGS
  if (normalizedSql.includes('from buildings')) {
    return [{ id: 1, name: 'Tower A' }];
  }

  // 32. SELECT FROM FLOORS
  if (normalizedSql.includes('from floors')) {
    return [{ id: 2, building_id: 1, name: 'Floor 2' }];
  }

  // 33. CTE Role Permissions Query in ResolveUserPermissions
  if (normalizedSql.includes('with recursive role_tree as') && normalizedSql.includes('p.permission_code')) {
    const userId = params ? params[0] : null;
    const user = mockDb.users.find(u => u.id === parseInt(userId));
    if (!user) return [];

    const role = user.role.toLowerCase();
    const permissions = new Set();

    // Mapping role to permissions
    const rolePermissionsMap = {
      admin: [
        'user_view', 'user_create', 'user_update', 'user_delete',
        'role_view', 'role_create', 'role_assign', 'perm_view', 'perm_assign',
        'appointment:create', 'appointment:read', 'appointment:approve', 'appointment:reject',
        'checkin:scan', 'checkin:checkout', 'visitor:blacklist', 'security:report',
        'reports:view', 'settings:update'
      ],
      staff: [
        'user_view', 'appointment:create', 'appointment:read', 'appointment:approve', 'appointment:reject'
      ],
      receptionist: [
        'user_view', 'appointment:read', 'checkin:scan', 'checkin:checkout'
      ],
      security_officer: [
        'user_view', 'appointment:read', 'checkin:scan', 'checkin:checkout', 'visitor:blacklist', 'security:report'
      ],
      visitor: [
        'appointment:create', 'appointment:read'
      ],
      manager: [
        'user_view', 'appointment:read', 'appointment:approve', 'appointment:reject'
      ]
    };

    const userPerms = rolePermissionsMap[role] || [];
    // If admin, we can also add '*'
    if (role === 'admin') {
      permissions.add('*');
    }
    userPerms.forEach(p => permissions.add(p));

    return Array.from(permissions).map(code => ({ permission_code: code }));
  }

  // 34. CTE Role Count Check in checkRole / authorize
  if (normalizedSql.includes('with recursive role_tree as') && normalizedSql.includes('count(*) as count')) {
    const userId = params ? params[0] : null;
    const roleCodeToCheck = params ? params[1] : null;
    const roleNameToCheck = params ? params[2] : null;

    const user = mockDb.users.find(u => u.id === parseInt(userId));
    if (!user) return [{ count: 0 }];

    const userRole = user.role.toLowerCase();

    // Helper function to check hierarchy
    const checkHierarchy = (currentRole, targetRole) => {
      if (currentRole === targetRole) return true;
      if (currentRole === 'admin') return true; // admin covers everything
      if (currentRole === 'manager' && (targetRole === 'staff' || targetRole === 'employee' || targetRole === 'visitor')) return true;
      if (currentRole === 'staff' && targetRole === 'visitor') return true;
      return false;
    };

    const matchRole = roleCodeToCheck ? roleCodeToCheck.toLowerCase() : (roleNameToCheck ? roleNameToCheck.toLowerCase() : null);
    if (!matchRole) return [{ count: 0 }];

    // Normalize target role check
    let target = matchRole;
    if (target === 'employee') target = 'staff';

    const hasRole = checkHierarchy(userRole, target);
    return [{ count: hasRole ? 1 : 0 }];
  }

  // 35. SELECT user_roles JOIN roles (resolveUserIdentity step 1)
  if (normalizedSql.includes('from user_roles') && normalizedSql.includes('join roles')) {
    const userId = params ? parseInt(params[0]) : null;
    const userRoleEntries = mockDb.user_roles.filter(ur => ur.user_id === userId);
    return userRoleEntries.map(ur => {
      const role = mockDb.roles.find(r => r.id === ur.role_id);
      return {
        role_id: ur.role_id,
        role_name: role ? role.role_name : null,
        role_code: role ? role.role_code : null
      };
    });
  }

  // 36. SELECT role_responsibilities JOIN responsibilities (resolveUserIdentity step 2)
  if (normalizedSql.includes('from role_responsibilities') && normalizedSql.includes('join responsibilities')) {
    const roleIds = params ? params.map(p => parseInt(p)) : [];
    const entries = mockDb.role_responsibilities.filter(rr => roleIds.includes(rr.role_id));
    const seen = new Set();
    const results = [];
    for (const entry of entries) {
      if (seen.has(entry.responsibility_id)) continue;
      seen.add(entry.responsibility_id);
      const resp = mockDb.responsibilities.find(r => r.id === entry.responsibility_id);
      if (resp) {
        results.push({
          responsibility_id: entry.responsibility_id,
          responsibility_name: resp.responsibility_name,
          responsibility_code: resp.responsibility_code
        });
      }
    }
    return results;
  }

  // 37. SELECT responsibility_permissions JOIN permissions (resolveUserIdentity step 3)
  if (normalizedSql.includes('from responsibility_permissions') && normalizedSql.includes('join permissions')) {
    const respIds = params ? params.map(p => parseInt(p)) : [];
    const entries = mockDb.responsibility_permissions.filter(rp => respIds.includes(rp.responsibility_id));
    const seen = new Set();
    const results = [];
    for (const entry of entries) {
      if (seen.has(entry.permission_id)) continue;
      seen.add(entry.permission_id);
      const perm = mockDb.permissions.find(p => p.id === entry.permission_id);
      if (perm && perm.status === 'ACTIVE') {
        results.push({
          permission_id: entry.permission_id,
          permission_name: perm.permission_name,
          permission_code: perm.permission_code,
          module: perm.module
        });
      }
    }
    return results;
  }

  // 38. SELECT permission_resources JOIN resources (resolveUserIdentity step 4)
  if (normalizedSql.includes('from permission_resources') && normalizedSql.includes('join resources')) {
    const permIds = params ? params.map(p => parseInt(p)) : [];
    const entries = mockDb.permission_resources.filter(pr => permIds.includes(pr.permission_id));
    const seen = new Set();
    const results = [];
    for (const entry of entries) {
      if (seen.has(entry.resource_id)) continue;
      seen.add(entry.resource_id);
      const res = mockDb.resources.find(r => r.id === entry.resource_id);
      if (res && res.status === 'ACTIVE') {
        results.push({
          id: res.id,
          resource_name: res.resource_name,
          route_url: res.route_url,
          react_component: res.react_component,
          menu_name: res.menu_name,
          menu_group: res.menu_group,
          icon: res.icon || null,
          display_order: res.display_order
        });
      }
    }
    // Sort by menu_group and display_order
    results.sort((a, b) => {
      if (a.menu_group < b.menu_group) return -1;
      if (a.menu_group > b.menu_group) return 1;
      return a.display_order - b.display_order;
    });
    return results;
  }

  // 39. SELECT user_code LIKE (generateUserCode)
  if (normalizedSql.includes('user_code') && normalizedSql.includes('like')) {
    const prefix = params ? params[0].replace('%', '') : '';
    return mockDb.users
      .filter(u => u.user_code && u.user_code.startsWith(prefix))
      .map(u => ({ user_code: u.user_code }));
  }

  // 40. INSERT INTO user_sessions
  if (normalizedSql.includes('insert into user_sessions')) {
    const newId = (mockDb.user_sessions || []).length + 1;
    if (!mockDb.user_sessions) mockDb.user_sessions = [];
    mockDb.user_sessions.push({
      id: newId,
      session_id: params ? params[0] : null,
      user_id: params ? params[1] : null,
      session_token: params ? params[2] : null,
      refresh_token: params ? params[3] : null,
      ip_address: params ? params[4] : null,
      user_agent: params ? params[5] : null,
      expires_at: params ? params[6] : null,
      is_active: true
    });
    return { insertId: newId };
  }

  // 41. UPDATE user_sessions (logout)
  if (normalizedSql.includes('update user_sessions')) {
    const userId = params ? params[0] : null;
    const refreshToken = params ? params[1] : null;
    if (mockDb.user_sessions) {
      const session = mockDb.user_sessions.find(
        s => s.user_id === parseInt(userId) && s.refresh_token === refreshToken
      );
      if (session) {
        session.is_active = false;
        session.logout_at = new Date().toISOString();
      }
    }
    return { affectedRows: 1 };
  }

  // 42. SELECT FROM user_sessions (refresh token check)
  if (normalizedSql.includes('from user_sessions') && normalizedSql.includes('is_active')) {
    const userId = params ? parseInt(params[0]) : null;
    const refreshToken = params ? params[1] : null;
    if (mockDb.user_sessions) {
      const session = mockDb.user_sessions.find(
        s => s.user_id === userId && s.refresh_token === refreshToken && s.is_active
      );
      return session ? [session] : [];
    }
    return [];
  }

  // 42a. INSERT INTO password_history
  if (normalizedSql.includes('insert into password_history')) {
    if (!mockDb.password_history) mockDb.password_history = [];
    const newId = mockDb.password_history.length + 1;
    mockDb.password_history.push({
      id: newId,
      user_id: params ? params[0] : null,
      password_hash: params ? params[1] : null,
      change_reason: params ? params[2] : null,
      changed_at: new Date().toISOString()
    });
    return { insertId: newId };
  }

  // 42b. SELECT FROM password_history (password reuse check)
  if (normalizedSql.includes('from password_history')) {
    const userId = params ? parseInt(params[0]) : null;
    const list = mockDb.password_history || [];
    return list.filter(h => h.user_id === userId);
  }

  // 42c. UPDATE user_otp
  if (normalizedSql.includes('update user_otp')) {
    if (!mockDb.user_otp) mockDb.user_otp = [];
    const destParam = params ? params[0] : null;
    mockDb.user_otp.forEach(rec => {
      if (!destParam || (rec.destination && rec.destination.toLowerCase() === String(destParam).toLowerCase()) || String(rec.otp_id) === String(destParam)) {
        if (normalizedSql.includes('status = \'expired\'') || normalizedSql.includes('status = "expired"')) rec.status = 'EXPIRED';
        if (normalizedSql.includes('status = \'verified\'') || normalizedSql.includes('status = "verified"')) { rec.status = 'VERIFIED'; rec.is_verified = 1; }
        if (normalizedSql.includes('status = \'failed\'') || normalizedSql.includes('status = "failed"')) rec.status = 'FAILED';
        rec.is_active = 0;
      }
    });
    return { affectedRows: 1 };
  }

  // 42d. INSERT INTO user_otp
  if (normalizedSql.includes('insert into user_otp')) {
    if (!mockDb.user_otp) mockDb.user_otp = [];
    const newId = mockDb.user_otp.length + 1;
    let user_id = null;
    let otp_code = '';
    let destination = '';
    if (params && params.length >= 3) {
      user_id = params[0];
      otp_code = params[1];
      destination = params[2];
    } else if (params && params.length >= 2) {
      otp_code = params[0];
      destination = params[1];
    }
    const requested_at = new Date().toISOString();
    const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    mockDb.user_otp.push({
      otp_id: newId,
      user_id,
      otp_code,
      otp_type: 'EMAIL_VERIFY',
      delivery_method: 'EMAIL',
      destination: destination ? destination.toLowerCase().trim() : '',
      is_verified: 0,
      attempt_count: 0,
      max_attempts: 5,
      requested_at,
      expires_at,
      status: 'ACTIVE',
      is_active: 1
    });
    return { insertId: newId };
  }

  // 42e. SELECT FROM user_otp
  if (normalizedSql.includes('from user_otp')) {
    if (!mockDb.user_otp) mockDb.user_otp = [];
    let matching = mockDb.user_otp;
    if (params && params.length > 0) {
      const pStrings = params.map(p => String(p).toLowerCase().trim());
      matching = mockDb.user_otp.filter(r => {
        const dest = (r.destination || '').toLowerCase();
        const uId = String(r.user_id || '');
        return pStrings.includes(dest) || (uId && pStrings.includes(uId));
      });
      const codeParam = params.find(p => /^\d{6}$/.test(String(p).trim()));
      if (codeParam) {
        matching = matching.filter(r => String(r.otp_code).trim() === String(codeParam).trim());
      }
    }
    const sorted = matching.sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());
    return sorted.map(r => ({
      ...r,
      is_expired_db: new Date() > new Date(r.expires_at) ? 1 : 0,
      seconds_since_request: Math.floor((Date.now() - new Date(r.requested_at).getTime()) / 1000)
    }));
  }

  // 43. SELECT FROM MANAGER_PROFILES
  if (normalizedSql.includes('from manager_profiles')) {
    if (normalizedSql.includes('user_id =')) {
      const userId = params ? params[0] : null;
      return mockDb.manager_profiles.filter(p => p.user_id === parseInt(userId));
    }
    return mockDb.manager_profiles;
  }

  // 44. SELECT FROM RECEPTIONIST_PROFILES
  if (normalizedSql.includes('from receptionist_profiles')) {
    if (normalizedSql.includes('user_id =')) {
      const userId = params ? params[0] : null;
      return mockDb.receptionist_profiles.filter(p => p.user_id === parseInt(userId));
    }
    return mockDb.receptionist_profiles;
  }

  // 45. SELECT FROM SECURITY_PROFILES
  if (normalizedSql.includes('from security_profiles')) {
    if (normalizedSql.includes('user_id =')) {
      const userId = params ? params[0] : null;
      return mockDb.security_profiles.filter(p => p.user_id === parseInt(userId));
    }
    return mockDb.security_profiles;
  }

  // 46. SELECT FROM ADMINISTRATOR_PROFILES
  if (normalizedSql.includes('from administrator_profiles')) {
    if (normalizedSql.includes('user_id =')) {
      const userId = params ? params[0] : null;
      return mockDb.administrator_profiles.filter(p => p.user_id === parseInt(userId));
    }
    return mockDb.administrator_profiles;
  }

  // SELECT FROM visitor_identity_verifications
  if (normalizedSql.includes('from visitor_identity_verifications')) {
    if (normalizedSql.includes('verification_session_id =')) {
      const sessionId = params ? params[0] : null;
      return mockDb.visitor_identity_verifications.filter(v => v.verification_session_id === sessionId);
    }
    if (normalizedSql.includes('mobile_session_token =')) {
      const token = params ? params[0] : null;
      return mockDb.visitor_identity_verifications.filter(v => v.mobile_session_token === token);
    }
    if (normalizedSql.includes('visitor_id =')) {
      const vid = params ? params[0] : null;
      return mockDb.visitor_identity_verifications.filter(v => v.visitor_id === parseInt(vid));
    }
    return mockDb.visitor_identity_verifications;
  }

  // SELECT FROM audit_logs
  if (normalizedSql.includes('from audit_logs')) {
    return mockDb.audit_logs.map(al => {
      const u = mockDb.users.find(usr => usr.id === al.actor_id) || {};
      return {
        ...al,
        actorName: u.full_name || 'System'
      };
    });
  }

  // SELECT FROM notifications
  if (normalizedSql.includes('from notifications')) {
    if (normalizedSql.includes('user_id =')) {
      const userId = params ? params[0] : null;
      return mockDb.notifications.filter(n => n.user_id === parseInt(userId));
    }
    return mockDb.notifications;
  }

  // SELECT FROM organizations
  if (normalizedSql.includes('from organizations')) {
    if (normalizedSql.includes('code = ?')) {
      const code = params ? params[0] : null;
      return mockDb.organizations.filter(o => o.code === code && !o.deleted_at);
    }
    if (normalizedSql.includes('id = ?')) {
      const id = params ? params[0] : null;
      return mockDb.organizations.filter(o => o.id === parseInt(id) && !o.deleted_at);
    }
    return mockDb.organizations.filter(o => !o.deleted_at);
  }

  // SELECT FROM organization_branches
  if (normalizedSql.includes('from organization_branches')) {
    let branches = mockDb.organization_branches.filter(b => !b.deleted_at);
    if (normalizedSql.includes('branch_code') && params && params.length > 0) {
      const codeParam = String(params[0]).toLowerCase();
      branches = branches.filter(b => (b.branch_code || '').toLowerCase() === codeParam);
    } else if (normalizedSql.includes('organization_id = ?')) {
      const orgId = params ? params[0] : null;
      branches = branches.filter(b => b.organization_id === parseInt(orgId));
    } else if (normalizedSql.includes('id = ?') || normalizedSql.includes('b.id = ?')) {
      const id = params ? params[0] : null;
      branches = branches.filter(b => b.id === parseInt(id));
    }
    return branches.map(b => {
      const org = mockDb.organizations.find(o => o.id === b.organization_id);
      return {
        ...b,
        branch_id: b.branch_id || b.id,
        organization_name: org ? org.name : (b.organization_name || 'Enterprise VMS Global'),
        created_at: b.created_at || '2026-07-27T10:00:00Z',
        updated_at: b.updated_at || new Date().toISOString()
      };
    });
  }

  // SELECT FROM departments
  if (normalizedSql.includes('from departments')) {
    let list = mockDb.departments.filter(d => !d.deleted_at);
    if (normalizedSql.includes('id = ?')) {
      const id = params ? params[params.length - 1] : null;
      list = list.filter(d => d.id === parseInt(id));
    }
    return list.map(d => {
      const managerId = d.manager_id || d.manager_user_id;
      const manager = mockDb.users.find(u => u.id === managerId) || {};
      const facilityId = d.facility_id || 1;
      const facility = mockDb.facilities.find(f => f.id === facilityId) || {};

      return {
        ...d,
        department_name: d.department_name || d.name,
        department_code: d.department_code || d.code || `D${d.id}`,
        managerName: manager.full_name || 'Unassigned',
        facilityName: facility.name || 'Main HQ'
      };
    });
  }

  // SELECT FROM facilities
  if (normalizedSql.includes('from facilities')) {
    if (normalizedSql.includes('id = ?')) {
      const id = params ? params[0] : null;
      return mockDb.facilities.filter(f => f.id === parseInt(id) && !f.deleted_at);
    }
    return mockDb.facilities.filter(f => !f.deleted_at);
  }

  // SELECT FROM employees
  if (normalizedSql.includes('from employees')) {
    if (!mockDb.employees) mockDb.employees = [];

    if (normalizedSql.includes('count(*)')) {
      const nonDeleted = mockDb.employees.filter(e => !e.deleted_at);
      const activeCount = nonDeleted.filter(e => !e.archived_at).length;
      return [{
        count: activeCount,
        total: nonDeleted.length,
        active: nonDeleted.filter(e => (e.employment_status === 'Active' || e.employment_status === 'full_time' || !e.employment_status) && !e.archived_at).length,
        inactive: nonDeleted.filter(e => (e.employment_status === 'Inactive' || e.employment_status === 'Terminated') && !e.archived_at).length,
        available_hosts: nonDeleted.filter(e => e.is_host_enabled && (e.availability_status === 'Available' || !e.availability_status) && !e.archived_at).length,
        on_leave: nonDeleted.filter(e => e.availability_status === 'On Leave' && !e.archived_at).length,
        archived: nonDeleted.filter(e => e.archived_at).length,
        total_departments: new Set(nonDeleted.map(e => e.department_id).filter(Boolean)).size || 1,
        total_branches: new Set(nonDeleted.map(e => e.branch_id).filter(Boolean)).size || 1
      }];
    }

    let list = [...mockDb.employees].filter(e => !e.deleted_at);

    if (normalizedSql.includes('archived_at is not null')) {
      list = list.filter(e => e.archived_at);
    } else if (normalizedSql.includes('archived_at is null')) {
      list = list.filter(e => !e.archived_at);
    }

    if (normalizedSql.includes('where (e.id = ? or e.employee_id = ?)') || normalizedSql.includes('where e.id = ?') || normalizedSql.includes('where (id = ? or employee_id = ?)')) {
      const idParam = params ? params[0] : null;
      if (idParam !== null && idParam !== undefined && !isNaN(idParam)) {
        list = list.filter(e => e.id === parseInt(idParam) || e.employee_id === parseInt(idParam));
      }
    }

    if (normalizedSql.includes('where email = ?') || normalizedSql.includes('where e.email = ?')) {
      const emailParam = params ? params[0] : null;
      if (emailParam) {
        list = list.filter(e => (e.email || '').toLowerCase() === String(emailParam).toLowerCase());
      }
    }

    if (normalizedSql.includes('where employee_number = ?') || normalizedSql.includes('where e.employee_number = ?')) {
      const numParam = params ? params[0] : null;
      if (numParam) {
        list = list.filter(e => (e.employee_number || '').toLowerCase() === String(numParam).toLowerCase());
      }
    }

    return list.map(e => {
      const dept = mockDb.departments.find(d => d.id === e.department_id) || {};
      const branch = mockDb.organization_branches.find(b => b.id === e.branch_id) || {};
      const room = mockDb.rooms.find(r => r.id === e.default_room_id) || {};
      return {
        ...e,
        department_name: e.department_name || dept.name || 'Operations',
        branch_name: e.branch_name || branch.branch_name || 'Main HQ',
        default_room_name: e.default_room_name || room.name || 'Conference Room B',
        full_name: e.full_name || `${e.first_name || ''} ${e.last_name || ''}`.trim()
      };
    });
  }
  // ── Dedicated UPDATE employees handler (handles COALESCE multi-line queries) ──
  if (normalizedSql.startsWith('update employees')) {
    if (!mockDb.employees) mockDb.employees = [];

    // Find target record by last two params (id, id) or by employee_number
    const idParam = params ? params[params.length - 1] : null;
    const idParam2 = params && params.length > 1 ? params[params.length - 2] : null;
    const record = mockDb.employees.find(r =>
      r.id == idParam || r.id == idParam2 ||
      r.employee_id == idParam || r.employee_id == idParam2 ||
      r.employee_number == idParam || r.employee_number == idParam2
    );

    if (record) {
      // Full employee update (COALESCE pattern from EmployeeRepository.update)
      // Column order matches EmployeeRepository.js lines 200-249 exactly
      if (normalizedSql.includes('coalesce') && params && params.length > 30) {
        const columnMap = [
          'first_name', 'middle_name', 'last_name', 'full_name',
          'gender', 'dob', 'nationality', 'marital_status',
          'photo_url', 'email', 'mobile_number', 'office_phone', 'extension',
          'employment_type', 'job_title', 'position', 'hire_date',
          'employment_status', 'organization_id', 'branch_id', 'department_id',
          'building_id', 'floor_number', 'office_number', 'manager_id',
          'emergency_contact_name', 'emergency_contact_relation', 'emergency_contact_phone',
          'is_host_enabled', 'max_visitors_per_day', 'max_concurrent_visitors', 'default_room_id',
          'default_approval_role', 'availability_status', 'updated_at'
        ];
        columnMap.forEach((col, idx) => {
          if (idx < params.length && params[idx] !== undefined && params[idx] !== null) {
            record[col] = params[idx];
          }
        });
      } else {
        // Simple update (e.g. availability_status = ?, updated_at = ?, archived_at = NULL)
        if (normalizedSql.includes('archived_at = null')) {
          record.archived_at = null;
        }
        if (normalizedSql.includes('archived_at = now()') || (normalizedSql.includes('archived_at = ?') && params && params[0])) {
          record.archived_at = params[0] || new Date().toISOString().slice(0, 19).replace('T', ' ');
        }
        if (normalizedSql.includes('deleted_at = now()') || (normalizedSql.includes('deleted_at = ?') && params && params[0])) {
          record.deleted_at = params[0] || new Date().toISOString().slice(0, 19).replace('T', ' ');
          record.employment_status = 'Inactive';
          record.is_host_enabled = false;
        }
        if (normalizedSql.includes("employment_status = 'inactive'")) {
          record.employment_status = 'Inactive';
        }
        if (normalizedSql.includes("is_host_enabled = false") || normalizedSql.includes("is_host_enabled = 0")) {
          record.is_host_enabled = false;
        }

        const simpleMatch = sql.match(/set\s+([\s\S]+?)\s+where/i);
        if (simpleMatch && !normalizedSql.includes('deleted_at = ?')) {
          const assignments = simpleMatch[1].split(',');
          assignments.forEach((a, idx) => {
            const colName = a.split('=')[0].trim().toLowerCase().replace(/[`"']/g, '');
            if (colName && !colName.includes('archived_at') && !colName.includes('deleted_at') && idx < params.length && params[idx] !== undefined && params[idx] !== null) {
              record[colName] = params[idx];
            }
          });
        }
      }
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  // General Dynamic UPDATE Fallback (for non-employee tables)
  if (useMock && normalizedSql.startsWith('update')) {
    const updateMatch = sql.match(/update\s+(\w+)\s+set\s+([\s\S]+?)\s+where\s+([\s\S]+)/i);
    if (updateMatch) {
      const tableName = updateMatch[1].toLowerCase();
      if (tableName !== 'employees' && mockDb[tableName]) {
        const idParam1 = params ? params[params.length - 1] : null;
        const idParam2 = params && params.length > 1 ? params[params.length - 2] : null;
        const targetId = idParam1 || idParam2;
        const record = mockDb[tableName].find(r => 
          r.id == targetId || 
          r.employee_id == targetId || 
          r.employee_number == targetId ||
          (typeof targetId === 'string' && r.employee_number && r.employee_number.toLowerCase() === String(targetId).toLowerCase())
        );
        if (record) {
          const setClause = updateMatch[2];
          const setParts = setClause.split(',').map(p => p.split('=')[0].trim().toLowerCase().replace(/[`"']/g, ''));
          setParts.forEach((col, idx) => {
            const val = params[idx];
            if (val !== undefined && val !== null) {
              record[col] = val;
            }
          });
          return { affectedRows: 1 };
        }
      }
    }
  }


  // 48. General Dynamic INSERT Fallback
  if (useMock && normalizedSql.startsWith('insert into')) {
    const tableMatch = sql.match(/insert\s+into\s+(\w+)\s*\(([^)]+)\)\s*values/i);
    if (tableMatch) {
      const tableName = tableMatch[1].toLowerCase();
      if (mockDb[tableName]) {
        const columns = tableMatch[2].split(',').map(c => c.trim().toLowerCase());
        const nowStr = new Date().toISOString();
        const newRecord = {
          id: mockDb[tableName].length + 1,
          created_at: nowStr,
          updated_at: nowStr
        };
        columns.forEach((col, idx) => {
          let val = params ? params[idx] : null;
          newRecord[col] = val;
        });
        if (tableName === 'organization_branches' && !newRecord.branch_id) {
          newRecord.branch_id = newRecord.id;
        }
        mockDb[tableName].push(newRecord);
        return { insertId: newRecord.id };
      }
    }
  }

  // 49. SELECT FROM appointments (visitor history query)
  if (normalizedSql.includes('from appointments')) {
    const visitorIdParam = params ? params[0] : null;
    let filtered = (mockDb.appointments || []);
    if (visitorIdParam !== null && visitorIdParam !== undefined) {
      filtered = filtered.filter(a => a.visitor_id === parseInt(visitorIdParam));
    }
    // Enrich with visitor, host, and department data
    return filtered.map(a => {
      const visitor = (mockDb.visitors || []).find(v => v.id === a.visitor_id) || {};
      const host = (mockDb.users || []).find(u => u.id === a.host_id) || {};
      const dept = (mockDb.departments || []).find(d => d.id === a.department_id) || {};
      return {
        ...a,
        appointmentId: a.id,
        referenceCode: a.reference_code,
        scheduledStart: a.scheduled_start,
        scheduledEnd: a.scheduled_end,
        appointmentStatus: a.appointment_status || a.status,
        purpose: a.purpose || a.remarks,
        hostName: host.full_name || 'Security Office',
        departmentName: dept.name || 'Operations',
        roomName: null,
        entryTime: null,
        exitTime: null,
        durationMinutes: a.expected_duration_minutes || 60,
        visitor_name: visitor.full_name || '',
        visitor_email: visitor.email || '',
        visitor_phone: visitor.phone || '',
        identity_type: visitor.id_type || '',
        identity_number: visitor.id_number || '',
        photo_url: visitor.photo_url || '',
        visitor_category: visitor.category || 'General Visitor',
        visitor_company: visitor.company || ''
      };
    });
  }

  // 50. SELECT FROM visitor_histories (visitor history log table)
  if (normalizedSql.includes('from visitor_histories')) {
    const visitorIdParam = params ? params[0] : null;
    if (!mockDb.visitor_histories) mockDb.visitor_histories = [];
    const rows = mockDb.visitor_histories.filter(vh => {
      if (vh.is_deleted) return false;
      if (visitorIdParam !== null && visitorIdParam !== undefined) {
        const vid = parseInt(visitorIdParam);
        // Match by visitor_id or by visitor_email matching the visitor
        if (vh.visitor_id === vid) return true;
        const visitor = (mockDb.visitors || []).find(v => v.id === vid);
        if (visitor && vh.visitor_email && visitor.email && vh.visitor_email.toLowerCase() === visitor.email.toLowerCase()) return true;
        return false;
      }
      return true;
    });
    return rows.map(vh => ({
      ...vh,
      historyCode: vh.history_code,
      referenceNumber: vh.reference_number,
      hostName: vh.host_employee_name,
      departmentName: vh.department_name,
      appointmentNumber: vh.appointment_number,
      purpose: vh.visit_purpose,
      entryTime: vh.checkin_time,
      exitTime: vh.checkout_time,
      durationMinutes: vh.visit_duration_minutes,
      passNumber: vh.pass_number,
      status: vh.visit_status,
      verificationStatus: vh.verification_status,
      scheduledStart: vh.completed_date
    }));
  }

  return [];
}

// Attach query, transaction, and useMock flags directly to pool object for backwards-compatibility
if (pool) {
  pool.query = query;
  pool.transaction = transaction;
  pool.getUseMock = () => useMock;
  pool.useMock = useMock;
  pool.mockDb = mockDb;
}

module.exports = pool;
module.exports.query = query;
module.exports.transaction = transaction;
module.exports.getUseMock = () => useMock;
module.exports.useMock = useMock;
module.exports.mockDb = mockDb;
module.exports.default = pool;
