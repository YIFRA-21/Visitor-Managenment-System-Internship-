const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();
const http = require('http');
const os = require('os');
const { Server: SocketServer } = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./modules/authentication/routes/auth.routes');
const departmentRoutes = require('./modules/department-management/routes/department.routes');
const employeeRoutes = require('./modules/employee-management/routes/employee.routes');
const appointmentRoutes = require('./modules/appointment-management/routes/appointment.routes');
const checkinRoutesData = require('./modules/check-in-out/routes/checkin.routes');
const checkinRoutes = checkinRoutesData.default || checkinRoutesData;
const { setSocketIO } = checkinRoutesData;
const checkoutRoutes = require('./modules/check-in-out/routes/checkout.routes');
const reportRoutes = require('./modules/reporting-analytics/routes/report.routes');
const roomRoutes = require('./modules/building-room/routes/room.routes');
const buildingRoutes = require('./modules/building-room/routes/building.routes');
const floorRoutes = require('./modules/building-room/routes/floor.routes');
const workplaceRoutes = require('./modules/building-room/routes/workplace.routes');
const notificationRoutes = require('./modules/notifications/routes/notification.routes');
const communicationRoutes = require('./modules/notifications/routes/communication.routes');
const securityRoutes = require('./modules/security-access/routes/security.routes');
const organizationRoutes = require('./modules/organization-management/routes/org.routes');
const organizationHomeRoutes = require('./modules/organization-management/routes/org-home.routes');
const branchRoutes = require('./modules/organization-management/routes/branches.routes');
const userManagementRoutes = require('./modules/user-management/routes/user.routes');
const roleRoutes = require('./modules/role-management/routes/role.routes');
const systemRoutes = require('./modules/system-admin/routes/system.routes');
const managerRoutes = require('./modules/employee-management/routes/manager.routes');
const calendarRoutes = require('./modules/calendar-scheduling/routes/calendar.routes');
const visitorDashboardRoutes = require('./modules/visitor-management/routes/visitor-dashboard.routes');
const visitorPortalRoutes = require('./modules/visitor-management/routes/visitor-portal.routes');
const visitorRegistrationRoutes = require('./modules/visitor-management/routes/visitor-registration.routes');
const receptionRoutes = require('./modules/reception/routes/reception.routes');
const exportRoutes = require('./modules/reporting-analytics/routes/exports.routes');
const identityRoutes = require('./modules/visitor-management/routes/identity.routes');
const dashboardRoutes = require('./modules/dashboards/routes/dashboard.routes');
const resourcesRoutes = require('./modules/permission-management/routes/resources.routes');
const permissionsRoutes = require('./modules/permission-management/routes/permission.routes');
const hierarchyRoutes = require('./modules/organization-management/routes/hierarchy.routes');
const settingsRoutes = require('./modules/system-admin/routes/settings.routes');
const visitorProfileRoutes = require('./modules/visitor-management/routes/visitor-profiles.routes');
const identityVerificationRoutes = require('./modules/visitor-management/routes/identity-verification.routes');
const visitorDocumentRoutes = require('./modules/document-management/routes/document.routes');
const visitorCategoryRoutes = require('./modules/visitor-management/routes/visitor-categories.routes');
const visitorHistoryRoutes = require('./modules/visitor-history/routes/visitor-history.routes');
const visitorNotificationCommunicationRoutes = require('./modules/notifications/routes/visitor-notifications.routes');
const workflowRoutes = require('./modules/approval-workflow/routes/workflow.routes');
const employeePortalRoutes = require('./modules/employee-management/routes/employee-portal.routes');
const visitorHistoryRepository = require('./modules/visitor-history/repositories/visitor-history.repository');
const pool = require('./config/db');

// Run auto DDL column expansion for photo_url, photo_path, document_url, rotation, zoom, status history, identity verifications
(async () => {
  try {
    try { await pool.query(`ALTER TABLE visitors MODIFY COLUMN photo_url LONGTEXT NULL COMMENT 'Path or data URL to profile photograph'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_photos MODIFY COLUMN photo_path LONGTEXT NOT NULL COMMENT 'File path/URL of captured photograph'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents MODIFY COLUMN document_url LONGTEXT NOT NULL COMMENT 'Path or URL to uploaded document scan'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_photos ADD COLUMN rotation INT DEFAULT 0 COMMENT 'Photo rotation angle in degrees'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_photos ADD COLUMN zoom DECIMAL(3,2) DEFAULT 1.00 COMMENT 'Photo zoom level scale'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_status_history MODIFY COLUMN status VARCHAR(50) NOT NULL COMMENT 'Historical status state indicator'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_identity_verifications MODIFY COLUMN front_image_url LONGTEXT NULL COMMENT 'Base64 or URL of front document'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_identity_verifications MODIFY COLUMN back_image_url LONGTEXT NULL COMMENT 'Base64 or URL of back document'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_identity_verifications MODIFY COLUMN selfie_image_url LONGTEXT NULL COMMENT 'Base64 or URL of selfie photo'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_identity_verifications ADD COLUMN front_portrait_url LONGTEXT NULL COMMENT 'Extracted front document portrait'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_identity_verifications ADD COLUMN cropped_portrait_url LONGTEXT NULL COMMENT 'Cropped face portrait'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_identity_verifications ADD COLUMN country VARCHAR(100) NULL COMMENT 'Country of document issuance'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_identity_verifications ADD COLUMN verification_method VARCHAR(50) NULL DEFAULT 'CURRENT_DEVICE'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_identity_verifications ADD COLUMN mobile_session_token VARCHAR(100) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_identity_verifications ADD COLUMN mobile_session_status VARCHAR(50) NULL DEFAULT 'PENDING'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_identity_verifications ADD COLUMN mobile_expires_at DATETIME NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE employees ADD COLUMN archived_at DATETIME NULL COMMENT 'Timestamp when employee was archived'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE employees ADD COLUMN photo_url LONGTEXT NULL COMMENT 'Profile photo URL or Base64'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users MODIFY COLUMN avatar_url LONGTEXT NULL COMMENT 'Avatar image data URL or file path'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users MODIFY COLUMN profile_photo LONGTEXT NULL COMMENT 'Profile photo image data URL or file path'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE manager_profiles MODIFY COLUMN photo_url LONGTEXT NULL COMMENT 'Profile photo image data URL or file path'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE administrator_profiles MODIFY COLUMN photo_url LONGTEXT NULL COMMENT 'Profile photo image data URL or file path'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE receptionist_profiles MODIFY COLUMN photo_url LONGTEXT NULL COMMENT 'Profile photo image data URL or file path'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE security_profiles MODIFY COLUMN photo_url LONGTEXT NULL COMMENT 'Profile photo image data URL or file path'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_signatures MODIFY COLUMN signature_image_url LONGTEXT NULL COMMENT 'Signature image data URL or file path'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE surveillance_events MODIFY COLUMN image_url LONGTEXT NULL COMMENT 'Event snapshot data URL or file path'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_checkins ADD COLUMN department_id INT NULL DEFAULT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_checkins MODIFY COLUMN building_id BIGINT UNSIGNED NULL DEFAULT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_checkins MODIFY COLUMN floor_id BIGINT UNSIGNED NULL DEFAULT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_checkins MODIFY COLUMN department_id INT NULL DEFAULT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_checkins MODIFY COLUMN expected_checkout_time DATETIME NULL DEFAULT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE appointments ADD COLUMN title VARCHAR(255) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE appointments MODIFY COLUMN approval_status ENUM('PENDING','APPROVED','REJECTED','ESC_PENDING','CANCELLED') DEFAULT 'PENDING'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE appointment_approvals MODIFY COLUMN decision ENUM('PENDING','APPROVED','REJECTED','DELEGATED','ESCALATED','BYPASSED','CANCELLED') NOT NULL DEFAULT 'PENDING'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE appointments ADD COLUMN is_walk_in BOOLEAN DEFAULT FALSE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN visitor_type VARCHAR(50) NULL DEFAULT 'WALK_IN'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE meeting_rooms DROP INDEX room_number`); await pool.query(`ALTER TABLE meeting_rooms ADD INDEX idx_room_number (room_number)`); } catch (e) {}
    try { await pool.query(`INSERT IGNORE INTO buildings (id, branch_id, building_name, is_active) VALUES (1, 1, 'Main HQ Building', 1)`); } catch (e) {}
    try { await pool.query(`INSERT IGNORE INTO floors (id, building_id, floor_name, is_active) VALUES (1, 1, 'Ground Floor', 1)`); } catch (e) {}
    try { await pool.query(`CREATE OR REPLACE VIEW rooms AS SELECT mr.id, mr.room_id, mr.facility_id, mr.room_number, mr.room_name, mr.room_name AS name, mr.building_id, mr.floor_id, mr.department_id, mr.capacity, mr.has_projector, mr.has_tv, mr.has_video_conference, mr.status, mr.is_accessible, mr.location, mr.is_active, mr.is_bookable, mr.created_at, mr.updated_at, mr.deleted_at FROM meeting_rooms mr`); } catch (e) {}
    // Module 13: Notifications Engine Auto-Migration
    try { await pool.query(`ALTER TABLE notifications ADD COLUMN organization_id INT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notifications ADD COLUMN notification_type VARCHAR(100) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notifications ADD COLUMN deleted_at DATETIME NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE COMMENT 'Read flag for notification'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notifications ADD COLUMN priority VARCHAR(20) DEFAULT 'medium'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notifications ADD COLUMN category VARCHAR(100) DEFAULT 'General'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notifications ADD COLUMN reference_number VARCHAR(100) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notifications ADD COLUMN module_name VARCHAR(100) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notifications ADD COLUMN record_id BIGINT UNSIGNED NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notifications ADD COLUMN action_url VARCHAR(255) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notifications ADD COLUMN read_at DATETIME NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notifications ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notification_templates ADD COLUMN event_key VARCHAR(100) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notification_preferences ADD COLUMN browser_enabled BOOLEAN DEFAULT TRUE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notification_preferences ADD COLUMN desktop_enabled BOOLEAN DEFAULT FALSE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notification_preferences ADD COLUMN appointment_reminders BOOLEAN DEFAULT TRUE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notification_preferences ADD COLUMN meeting_reminders BOOLEAN DEFAULT TRUE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notification_preferences ADD COLUMN password_alerts BOOLEAN DEFAULT TRUE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notification_preferences ADD COLUMN security_alerts BOOLEAN DEFAULT TRUE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notification_preferences ADD COLUMN emergency_alerts BOOLEAN DEFAULT TRUE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notification_preferences ADD COLUMN language VARCHAR(10) DEFAULT 'en'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE notification_audit_logs ADD COLUMN metadata JSON NULL`); } catch (e) {}
    try {
      await pool.query(`
        INSERT IGNORE INTO notifications (id, user_id, type, priority, category, channel, title, message, status, sent_at, is_read)
        VALUES (1, 1, 'APPT_CONFIRMED', 'medium', 'General', 'in_app', 'Welcome to VMS Platform', 'Your visit has been approved and registered.', 'sent', NOW(), 1)
      `);
    } catch (e) {}

    // Visitor Profile Directory columns migration
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN is_archived TINYINT(1) DEFAULT 0`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN archived_at DATETIME NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN archived_by BIGINT UNSIGNED NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN occupation VARCHAR(150) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN id_verification_status VARCHAR(50) DEFAULT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN preferred_contact_method VARCHAR(50) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN access_level VARCHAR(50) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN approval_requirement VARCHAR(50) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN visit_duration VARCHAR(50) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN street VARCHAR(255) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN house_number VARCHAR(50) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN department_name VARCHAR(150) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN alt_phone VARCHAR(50) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN emergency_relationship VARCHAR(50) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN escort_required VARCHAR(50) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN allowed_areas VARCHAR(255) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN allowed_days VARCHAR(100) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN visit_purpose VARCHAR(255) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN vehicle_plate_number VARCHAR(50) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN vehicle_type VARCHAR(50) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitors ADD COLUMN parking_required TINYINT(1) DEFAULT 0`); } catch (e) {}

    // Enterprise Role Management Auto-Migrations
    try { await pool.query(`ALTER TABLE roles ADD COLUMN scope_type ENUM('SYSTEM', 'ORGANIZATION', 'BRANCH', 'DEPARTMENT', 'BUILDING') DEFAULT 'SYSTEM'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE roles ADD COLUMN role_type ENUM('SYSTEM', 'CUSTOM', 'TEMPLATE') DEFAULT 'CUSTOM'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE roles ADD COLUMN priority INT DEFAULT 10`); } catch (e) {}
    try { await pool.query(`ALTER TABLE roles ADD COLUMN is_assignment_allowed BOOLEAN DEFAULT TRUE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE roles ADD COLUMN is_temporary_allowed BOOLEAN DEFAULT TRUE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE roles ADD COLUMN is_multiple_allowed BOOLEAN DEFAULT TRUE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE roles ADD COLUMN requires_approval BOOLEAN DEFAULT FALSE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE roles ADD COLUMN risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'LOW'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE roles ADD COLUMN version INT DEFAULT 1`); } catch (e) {}
    try { await pool.query(`ALTER TABLE roles ADD COLUMN organization_id BIGINT UNSIGNED NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE roles ADD COLUMN branch_id BIGINT UNSIGNED NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE roles ADD COLUMN department_id BIGINT UNSIGNED NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE roles ADD COLUMN building_id BIGINT UNSIGNED NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE roles ADD COLUMN parent_role_id BIGINT UNSIGNED NULL`); } catch (e) {}

    try { await pool.query(`ALTER TABLE user_roles ADD COLUMN organization_id BIGINT UNSIGNED NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE user_roles ADD COLUMN branch_id BIGINT UNSIGNED NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE user_roles ADD COLUMN department_id BIGINT UNSIGNED NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE user_roles ADD COLUMN building_id BIGINT UNSIGNED NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE user_roles ADD COLUMN start_date DATETIME NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE user_roles ADD COLUMN end_date DATETIME NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE user_roles ADD COLUMN assignment_status ENUM('ACTIVE', 'PENDING_APPROVAL', 'EXPIRED', 'REVOKED') DEFAULT 'ACTIVE'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE user_roles ADD COLUMN assignment_reason TEXT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE user_roles ADD COLUMN approval_status ENUM('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED') DEFAULT 'NOT_REQUIRED'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE user_roles ADD COLUMN approved_by BIGINT UNSIGNED NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE user_roles ADD COLUMN approved_at DATETIME NULL`); } catch (e) {}

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS role_conflicts (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          role_id_1 BIGINT UNSIGNED NOT NULL,
          role_id_2 BIGINT UNSIGNED NOT NULL,
          conflict_code VARCHAR(80) NOT NULL UNIQUE,
          conflict_name VARCHAR(150) NOT NULL,
          description TEXT NULL,
          severity ENUM('HIGH', 'CRITICAL') DEFAULT 'CRITICAL',
          is_active BOOLEAN DEFAULT TRUE,
          created_by BIGINT UNSIGNED NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_role_pair UNIQUE (role_id_1, role_id_2)
        ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
      `);
    } catch (e) {}

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sod_rules (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          rule_code VARCHAR(80) NOT NULL UNIQUE,
          rule_name VARCHAR(150) NOT NULL,
          description TEXT NULL,
          permission_id_1 BIGINT UNSIGNED NOT NULL,
          permission_id_2 BIGINT UNSIGNED NOT NULL,
          risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'HIGH',
          is_active BOOLEAN DEFAULT TRUE,
          created_by BIGINT UNSIGNED NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_sod_perm_pair UNIQUE (permission_id_1, permission_id_2)
        ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
      `);
    } catch (e) {}

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS role_versions (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          role_id BIGINT UNSIGNED NOT NULL,
          version_number INT NOT NULL,
          role_name VARCHAR(80) NOT NULL,
          role_code VARCHAR(40) NOT NULL,
          scope_type VARCHAR(50) DEFAULT 'SYSTEM',
          description TEXT NULL,
          permissions_snapshot_json JSON NULL,
          created_by BIGINT UNSIGNED NULL,
          change_reason TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_rv_role_ver (role_id, version_number)
        ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
      `);
    } catch (e) {}

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS role_templates (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          template_code VARCHAR(80) NOT NULL UNIQUE,
          template_name VARCHAR(100) NOT NULL,
          category VARCHAR(50) DEFAULT 'General',
          description TEXT NULL,
          scope_type VARCHAR(50) DEFAULT 'ORGANIZATION',
          default_permissions_json JSON NULL,
          risk_level VARCHAR(20) DEFAULT 'LOW',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
      `);
    } catch (e) {}

    try {
      await pool.query(`
        INSERT IGNORE INTO role_templates (template_code, template_name, category, description, scope_type, default_permissions_json, risk_level) VALUES
        ('RECEPTIONIST_TEMPLATE', 'Receptionist Role Template', 'Front Desk', 'Standard front desk operational role for registering, checking in, and printing passes for visitors.', 'BRANCH', '["VISITOR:READ", "VISITOR:CREATE", "VISITOR:CHECKIN", "VISITOR:CHECKOUT", "PASS:GENERATE"]', 'LOW'),
        ('SECURITY_OFFICER_TEMPLATE', 'Security Officer Role Template', 'Security', 'Physical security and access verification role for monitoring badges, blacklist checks, and incidents.', 'BUILDING', '["VISITOR:READ", "SECURITY:CHECK", "BLACKLIST:VIEW", "INCIDENT:CREATE", "ACCESS:VERIFY"]', 'MEDIUM'),
        ('DEPARTMENT_MANAGER_TEMPLATE', 'Department Manager Role Template', 'Management', 'Managerial role for host employees approving visitor appointments and managing departmental access.', 'DEPARTMENT', '["APPOINTMENT:APPROVE", "APPOINTMENT:READ", "EMPLOYEE:READ", "REPORTS:DEPARTMENT"]', 'MEDIUM'),
        ('BRANCH_ADMINISTRATOR_TEMPLATE', 'Branch Administrator Role Template', 'Administration', 'Administrative control over facility branch configuration, hosts, schedules, and staff rosters.', 'BRANCH', '["BRANCH:MANAGE", "EMPLOYEE:MANAGE", "APPOINTMENT:MANAGE", "REPORTS:BRANCH"]', 'HIGH');
      `);
    } catch (e) {}

    // Enterprise User Management Auto-Migrations
    try { await pool.query(`ALTER TABLE users ADD COLUMN suspended_by BIGINT UNSIGNED NULL COMMENT 'Admin ID who suspended account'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN suspended_at DATETIME NULL COMMENT 'Timestamp when suspended'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN suspension_reason VARCHAR(255) NULL COMMENT 'Reason for account suspension'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN review_date DATE NULL COMMENT 'Scheduled suspension review date'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN archived_at DATETIME NULL COMMENT 'Timestamp when archived'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN archived_by BIGINT UNSIGNED NULL COMMENT 'Admin ID who archived account'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN user_tags VARCHAR(255) NULL COMMENT 'Comma-separated tags (VIP, Contractor, Internal, etc)'`); } catch (e) {}

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_invitations (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'employee',
          department_id BIGINT UNSIGNED NULL,
          token_hash VARCHAR(255) NOT NULL,
          status ENUM('SENT', 'DELIVERED', 'OPENED', 'ACCEPTED', 'EXPIRED', 'CANCELLED') DEFAULT 'SENT',
          invited_by BIGINT UNSIGNED NULL,
          expires_at DATETIME NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email),
          INDEX idx_status (status)
        ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
      `);
    } catch (e) {}

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS saved_user_searches (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT UNSIGNED NOT NULL,
          search_name VARCHAR(150) NOT NULL,
          filters_json JSON NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id)
        ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
      `);
    } catch (e) {}

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_rules (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        rule_code VARCHAR(100) NOT NULL UNIQUE,
        rule_name VARCHAR(200) NOT NULL,
        event_key VARCHAR(100) NOT NULL,
        description TEXT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        conditions_json JSON NULL,
        actions_json JSON NULL,
        escalation_json JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_event_key (event_key),
        INDEX idx_active (is_active)
      ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_template_versions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        template_id BIGINT UNSIGNED NOT NULL,
        version_number INT NOT NULL DEFAULT 1,
        subject_template VARCHAR(200) NULL,
        body_template TEXT NOT NULL,
        created_by BIGINT UNSIGNED NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_queues (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        notification_id BIGINT UNSIGNED NOT NULL,
        channel VARCHAR(30) NOT NULL,
        recipient_user_id BIGINT UNSIGNED NULL,
        recipient_address VARCHAR(255) NULL,
        payload_json JSON NOT NULL,
        status ENUM('queued', 'processing', 'sent', 'failed', 'retrying', 'cancelled') DEFAULT 'queued',
        attempt_count INT DEFAULT 0,
        max_attempts INT DEFAULT 3,
        last_error TEXT NULL,
        scheduled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_otp (
        otp_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        otp_code VARCHAR(20) NOT NULL,
        otp_type VARCHAR(50) NOT NULL DEFAULT 'EMAIL_VERIFY',
        delivery_method VARCHAR(20) DEFAULT 'EMAIL',
        destination VARCHAR(255) NOT NULL,
        is_verified TINYINT(1) DEFAULT 0,
        attempt_count INT DEFAULT 0,
        max_attempts INT DEFAULT 5,
        requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        verified_at DATETIME NULL,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_dest_type (destination, otp_type, status, is_active),
        INDEX idx_otp_code (otp_code)
      ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
    `);

    try { await pool.query(`ALTER TABLE user_otp MODIFY COLUMN otp_code VARCHAR(255) NOT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE user_otp MODIFY COLUMN destination VARCHAR(255) NOT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE user_otp ADD COLUMN IF NOT EXISTS user_id BIGINT UNSIGNED NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE user_otp ADD COLUMN IF NOT EXISTS otp_hash VARCHAR(255) NULL`); } catch (e) {}

    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_outbox (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        operation_id VARCHAR(100) NOT NULL UNIQUE,
        purpose VARCHAR(50) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body_text TEXT NULL,
        body_html LONGTEXT NULL,
        provider VARCHAR(50) NOT NULL DEFAULT 'smtp',
        status ENUM('PENDING', 'ACCEPTED', 'DELIVERED', 'FAILED', 'BOUNCED', 'RETRYING') NOT NULL DEFAULT 'PENDING',
        attempt_count INT NOT NULL DEFAULT 0,
        max_attempts INT NOT NULL DEFAULT 3,
        next_retry_at DATETIME NULL,
        provider_message_id VARCHAR(255) NULL,
        provider_response TEXT NULL,
        error_message TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_recipient (recipient),
        INDEX idx_status_retry (status, next_retry_at),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        sender_id BIGINT UNSIGNED NOT NULL,
        recipient_id BIGINT UNSIGNED NULL,
        recipient_role VARCHAR(50) NULL,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        category VARCHAR(100) DEFAULT 'general',
        channel ENUM('in_app', 'email', 'sms') DEFAULT 'in_app',
        status ENUM('unread', 'read', 'archived', 'deleted') DEFAULT 'unread',
        reference_id VARCHAR(100) NULL,
        related_entity_type VARCHAR(100) NULL,
        related_entity_id BIGINT UNSIGNED NULL,
        attachments_json JSON NULL,
        is_starred BOOLEAN DEFAULT FALSE,
        is_important BOOLEAN DEFAULT FALSE,
        is_read BOOLEAN DEFAULT FALSE,
        read_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sender (sender_id),
        INDEX idx_recipient (recipient_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        conversation_type ENUM('direct', 'group', 'channel') DEFAULT 'direct',
        title VARCHAR(200) NULL,
        description TEXT NULL,
        created_by BIGINT UNSIGNED NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_participants (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        conversation_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        role ENUM('admin', 'member') DEFAULT 'member',
        last_read_at DATETIME NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_conv_user (conversation_id, user_id),
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        conversation_id BIGINT UNSIGNED NOT NULL,
        sender_id BIGINT UNSIGNED NOT NULL,
        message_type ENUM('text', 'file', 'image', 'system') DEFAULT 'text',
        message_text TEXT NOT NULL,
        attachments_json JSON NULL,
        is_edited BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_conv (conversation_id),
        INDEX idx_sender (sender_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    try { await pool.query(`ALTER TABLE chat_messages MODIFY COLUMN message_type VARCHAR(50) DEFAULT 'text'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE chat_conversations ADD COLUMN avatar_url VARCHAR(500) NULL`); } catch (e) {}

    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content_body LONGTEXT NOT NULL,
        banner_url LONGTEXT NULL,
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        category VARCHAR(100) DEFAULT 'General Notice',
        status ENUM('draft', 'scheduled', 'published', 'archived') DEFAULT 'published',
        publish_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NULL,
        created_by BIGINT UNSIGNED NULL,
        target_audience_json JSON NULL,
        target_org_id BIGINT UNSIGNED NULL,
        target_branch_id BIGINT UNSIGNED NULL,
        target_dept_id BIGINT UNSIGNED NULL,
        allow_comments BOOLEAN DEFAULT TRUE,
        allow_reactions BOOLEAN DEFAULT TRUE,
        views_count INT DEFAULT 0,
        likes_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_publish (publish_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcement_recipients (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        announcement_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        read_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_ann_user (announcement_id, user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);


    // Module 4.7 Visitor Document Management Tables Auto-Migration
    await pool.query(`
      CREATE TABLE IF NOT EXISTS document_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_code VARCHAR(50) NOT NULL UNIQUE,
        category_name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS visitor_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        document_code VARCHAR(50) NOT NULL UNIQUE,
        ref_number VARCHAR(100) NULL,
        visitor_id INT NULL,
        visitor_code VARCHAR(50) NULL,
        visitor_name VARCHAR(150) NULL,
        appointment_id INT NULL,
        document_name VARCHAR(255) NOT NULL,
        document_number VARCHAR(100) NULL,
        category_id INT NULL,
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
        uploaded_by INT NULL,
        uploaded_by_name VARCHAR(150) NULL,
        version_number INT NOT NULL DEFAULT 1,
        is_archived BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        deleted_at TIMESTAMP NULL,
        deleted_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // ─── Alter columns safely if visitor_documents existed previously ───
    // Core identity columns
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN document_code VARCHAR(50) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN ref_number VARCHAR(100) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN visitor_code VARCHAR(50) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN visitor_name VARCHAR(150) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN appointment_id INT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN document_name VARCHAR(255) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN category_id INT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN category_name VARCHAR(100) NULL DEFAULT 'Other'`); } catch (e) {}
    // File storage columns
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN file_path LONGTEXT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN original_file_name VARCHAR(255) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN file_type VARCHAR(100) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN file_size_bytes BIGINT NOT NULL DEFAULT 0`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN checksum_sha256 VARCHAR(64) NULL`); } catch (e) {}
    // Extended metadata
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN issuing_country VARCHAR(100) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Uploaded'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN verification_status VARCHAR(50) NOT NULL DEFAULT 'Pending Review'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN approval_status VARCHAR(50) NOT NULL DEFAULT 'Pending Review'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN ocr_extracted_data JSON NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN ocr_confidence DECIMAL(5,2) DEFAULT 0.00`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN keywords TEXT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN description TEXT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN remarks TEXT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN document_type VARCHAR(100) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN file_url LONGTEXT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN file_name VARCHAR(255) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN file_size BIGINT DEFAULT 0`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN mime_type VARCHAR(100) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN is_active BOOLEAN DEFAULT TRUE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN uploaded_by INT NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN uploaded_by_name VARCHAR(150) NULL`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN version_number INT NOT NULL DEFAULT 1`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN is_archived BOOLEAN DEFAULT FALSE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE visitor_documents ADD COLUMN deleted_by INT NULL`); } catch (e) {}
    // Ensure document_code has a unique index (safe duplicate skip)
    try { await pool.query(`CREATE UNIQUE INDEX uq_vd_document_code ON visitor_documents(document_code)`); } catch (e) {}

    await pool.query(`
      CREATE TABLE IF NOT EXISTS document_version_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        document_id INT NOT NULL,
        version_number INT NOT NULL,
        file_path LONGTEXT NOT NULL,
        original_file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        file_size_bytes BIGINT NOT NULL DEFAULT 0,
        checksum_sha256 VARCHAR(64) NULL,
        changes_description TEXT NULL,
        uploaded_by INT NULL,
        uploaded_by_name VARCHAR(150) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS visitor_document_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        document_id INT NOT NULL,
        visitor_id INT NULL,
        verification_status VARCHAR(50) NOT NULL,
        verification_method VARCHAR(50) DEFAULT 'MANUAL',
        checklist_json JSON NULL,
        remarks TEXT NULL,
        verified_by INT NULL,
        verified_by_name VARCHAR(150) NULL,
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS visitor_document_approvals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        document_id INT NOT NULL,
        stage VARCHAR(50) NOT NULL DEFAULT 'Review',
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        reviewer_id INT NULL,
        reviewer_name VARCHAR(150) NULL,
        comments TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS visitor_document_download_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        document_id INT NOT NULL,
        version_downloaded INT NOT NULL DEFAULT 1,
        download_option VARCHAR(50) NOT NULL DEFAULT 'LATEST',
        downloaded_by INT NULL,
        downloaded_by_name VARCHAR(150) NULL,
        ip_address VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS visitor_document_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        document_id INT NOT NULL,
        action VARCHAR(50) NOT NULL,
        performed_by INT NULL,
        performed_by_name VARCHAR(150) NULL,
        role VARCHAR(80) NULL,
        ip_address VARCHAR(50) NULL,
        device_info VARCHAR(255) NULL,
        details_json JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Database DDL column size & schema migration executed successfully (LONGTEXT & Document Management extended tables).');
    // Module 4.8 Visitor History Table Auto-Migration
    await pool.query(`
      CREATE TABLE IF NOT EXISTS visitor_histories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        history_code VARCHAR(50) NOT NULL UNIQUE,
        organization_id INT NOT NULL DEFAULT 1,
        visitor_id INT NULL,
        appointment_id INT NULL,
        pass_id INT NULL,
        checkin_id INT NULL,
        checkout_id INT NULL,
        reference_number VARCHAR(100) NULL,
        visitor_photo LONGTEXT NULL,
        visitor_name VARCHAR(150) NOT NULL,
        visitor_email VARCHAR(150) NULL,
        visitor_phone VARCHAR(50) NULL,
        visitor_company VARCHAR(150) NULL,
        visitor_category VARCHAR(100) NULL,
        host_employee_id INT NULL,
        host_employee_name VARCHAR(150) NULL,
        department_id INT NULL,
        department_name VARCHAR(150) NULL,
        branch_id INT NULL,
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
        INDEX idx_visitor (visitor_id),
        INDEX idx_appointment (appointment_id),
        INDEX idx_dept (department_id),
        INDEX idx_status (visit_status),
        INDEX idx_completed (completed_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure common extended schema columns exist
    const extendedColumns = [
      `ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE`,
      `ALTER TABLE users ADD COLUMN address VARCHAR(255) NULL`,
      `ALTER TABLE users ADD COLUMN mobile_number VARCHAR(50) NULL`,
      `ALTER TABLE visitors ADD COLUMN address VARCHAR(255) NULL`,
      `ALTER TABLE visitors ADD COLUMN category VARCHAR(100) NULL`,
      `ALTER TABLE visitors ADD COLUMN city VARCHAR(100) NULL`,
      `ALTER TABLE visitors ADD COLUMN sub_city VARCHAR(100) NULL`,
      `ALTER TABLE visitors ADD COLUMN region VARCHAR(100) NULL`,
      `ALTER TABLE visitors ADD COLUMN country VARCHAR(100) NULL`,
      `ALTER TABLE visitors ADD COLUMN postal_code VARCHAR(50) NULL`,
      `ALTER TABLE visitors ADD COLUMN company VARCHAR(150) NULL`,
      `ALTER TABLE visitors ADD COLUMN department_name VARCHAR(150) NULL`,
      `ALTER TABLE visitors ADD COLUMN branch_name VARCHAR(150) NULL`,
      `ALTER TABLE visitors ADD COLUMN host_employee_name VARCHAR(150) NULL`,
      `ALTER TABLE visitors ADD COLUMN visit_purpose VARCHAR(255) NULL`,
      `ALTER TABLE visitors ADD COLUMN visit_duration INT NULL`,
      `ALTER TABLE visitors ADD COLUMN meeting_location VARCHAR(255) NULL`,
      `ALTER TABLE visitor_emergency_contacts ADD COLUMN is_active BOOLEAN DEFAULT TRUE`,
      `ALTER TABLE checkins ADD COLUMN entry_time DATETIME NULL`,
      `ALTER TABLE visitor_checkouts ADD COLUMN exit_time DATETIME NULL`,
      `ALTER TABLE checkout_feedbacks ADD COLUMN visitor_id INT UNSIGNED NULL`,
      `ALTER TABLE checkout_feedbacks ADD COLUMN checkin_id INT UNSIGNED NULL`,
      `ALTER TABLE checkout_feedbacks ADD COLUMN security_rating INT NULL`,
      `ALTER TABLE checkout_feedbacks ADD COLUMN suggestions TEXT NULL`,
      `ALTER TABLE checkout_feedbacks ADD COLUMN complaints TEXT NULL`,
      `ALTER TABLE visitor_notes ADD COLUMN subject VARCHAR(255) NULL`,
      `ALTER TABLE visitor_notes ADD COLUMN note_text TEXT NULL`,
      `ALTER TABLE visitor_notes ADD COLUMN content TEXT NULL`,
      `ALTER TABLE visitor_notes ADD COLUMN is_resolved BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE visitor_notes ADD COLUMN is_active BOOLEAN DEFAULT TRUE`,
      `ALTER TABLE appointments ADD COLUMN meeting_room_id INT NULL`,
    ];
    for (const ddl of extendedColumns) {
      try { await pool.query(ddl); } catch (_) {}
    }

    // Sync any existing checkouts & seed sample records into visitor_histories & employees
    setTimeout(() => {
      visitorHistoryRepository.syncPastCheckouts().catch(() => {});
      require('./modules/employee-management/repositories/employee.repository').seedInitialEmployees().catch(() => {});
    }, 1000);

  } catch (e) {
    console.warn('Auto DDL migration note:', e.message);
  }
})();

const { sanitizeBody } = require('./middleware/sanitize');
const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const server = http.createServer(app);

const normalizeOrigin = (url) => String(url || '').trim().replace(/\/+$/, '').toLowerCase();

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'https://visitor-managenment-system-internsh-rho.vercel.app',
  'https://visitor-management-system.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

/**
 * Validates origin for both Express CORS and Socket.io.
 * Allows localhost, configured CLIENT_URL, Vercel deployments, and private RFC 1918 LAN IPs during development.
 */
const isOriginAllowed = (origin) => {
  if (!origin) return true; // Mobile apps, Postman, curl, server-to-server

  const norm = normalizeOrigin(origin);
  if (allowedOrigins.some(o => normalizeOrigin(o) === norm)) return true;
  if (norm.endsWith('.vercel.app') || norm.includes('vercel.app')) return true;
  if (norm.includes('localhost') || norm.includes('127.0.0.1')) return true;

  if (process.env.NODE_ENV !== 'production') {
    try {
      const url = new URL(origin);
      const hostname = url.hostname;
      const isPrivateLan =
        /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        hostname === 'localhost' ||
        hostname === '127.0.0.1';

      if (isPrivateLan) return true;
    } catch (_) {
      return false;
    }
  }

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

const io = new SocketServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS origin rejected for Socket.io'), false);
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setSocketIO(io);

// Production security headers and GZIP compression
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows browser to load local images from /uploads
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false, // Allows frontend iframe document reader to display cross-origin PDFs & documents
  originAgentCluster: false,
  frameguard: false, // Allows frontend iframe document reader to display PDFs & documents
  contentSecurityPolicy: false, // Prevents frame-ancestors blocking on frontend iframe previews
}));
app.use(compression());

// Global Rate Limiting (generous in development, skip localhost loopback)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 1000 : 50000,
  skip: (req) => {
    if (process.env.NODE_ENV !== 'production') return true;
    const ip = req.ip || req.connection?.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip.includes('127.0.0.1');
  },
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.', code: 'RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);


// Upload-specific rate limiter (20 uploads per minute per IP)
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Upload rate limit exceeded. Please wait and retry.', code: 'UPLOAD_RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/appointments/upload', uploadLimiter);

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(sanitizeBody);
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.removeHeader('X-Frame-Options');
  next();
});
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'modules/uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/test-email-connectivity', async (_req, res) => {
  const dns = require('dns').promises;
  const net = require('net');
  const results = { timestamp: new Date().toISOString() };

  try {
    results.dns = await dns.lookup('smtp.gmail.com');
  } catch (e) {
    results.dns = { error: e.message };
  }

  const testPort = (port) => new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(4000);
    s.on('connect', () => { s.destroy(); resolve({ port, open: true }); });
    s.on('timeout', () => { s.destroy(); resolve({ port, open: false, error: 'TIMEOUT' }); });
    s.on('error', (err) => { s.destroy(); resolve({ port, open: false, error: err.message }); });
    s.connect(port, 'smtp.gmail.com');
  });

  results.port587 = await testPort(587);
  results.port465 = await testPort(465);

  try {
    const emailProvider = require('./modules/notifications/services/email/email.provider');
    results.verifyConnection = await emailProvider.verifyConnection();
  } catch (e) {
    results.verifyConnection = { error: e.message };
  }

  res.json(results);
});

const {
  getModulesCatalog,
  getAllEndpoints,
  generatePostmanCollection,
  renderHtmlCatalog,
  findEndpointByPath,
  renderSingleEndpointTester
} = require('./utils/apiEndpointsRegistry');

app.get(['/', '/api'], (req, res) => {
  const wantsJson = req.query.format === 'json' || (req.headers.accept && req.headers.accept.includes('application/json') && !req.headers.accept.includes('text/html'));
  if (!wantsJson && req.accepts && req.accepts('html')) {
    return res.send(renderHtmlCatalog(req));
  }

  const allEndpoints = getAllEndpoints();
  const modulesCatalog = getModulesCatalog();
  res.json({
    name: 'Visitor Management System API',
    status: 'running',
    version: '1.0.0',
    frontend: process.env.CLIENT_URL || 'http://localhost:3000',
    health: '/api/health',
    endpoints_catalog: '/api/endpoints',
    total_endpoints: allEndpoints.length,
    total_modules: modulesCatalog.length,
    postman_collection: '/api/postman-collection',
    modules: modulesCatalog.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      endpoint_count: m.endpoints.length
    })),
    quick_links: {
      html_catalog: '/api/endpoints',
      auth_login_help: '/api/auth/login',
      health_check: '/api/health',
      all_endpoints: '/api/endpoints?format=json',
      postman_collection: '/api/postman-collection'
    }
  });
});

app.get('/api/endpoints', (req, res) => {
  const wantsJson = req.query.format === 'json' || (req.headers.accept && req.headers.accept.includes('application/json') && !req.headers.accept.includes('text/html'));
  if (!wantsJson && req.accepts && req.accepts('html')) {
    return res.send(renderHtmlCatalog(req));
  }

  const all = getAllEndpoints();
  const modulesCatalog = getModulesCatalog();
  res.json({
    name: 'Visitor Management System API - Complete Collection by Module',
    version: '1.0.0',
    total_endpoints: all.length,
    total_modules: modulesCatalog.length,
    collections: modulesCatalog,
    endpoints: all
  });
});

app.get('/api/postman-collection', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const collection = generatePostmanCollection(baseUrl);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="VMS_Postman_Collection.json"');
  res.send(JSON.stringify(collection, null, 2));
});

app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/workplace', workplaceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/organization/home', organizationHomeRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/users', userManagementRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/admin/roles', roleRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/audit-logs', systemRoutes);
app.use('/api/admin/audit-logs', systemRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/visitor/dashboard', visitorDashboardRoutes);
app.use('/api/visitor', visitorPortalRoutes);
app.use('/api/visitors/registration', visitorRegistrationRoutes);
app.use('/api/reception', receptionRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/identity', identityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/admin/permissions', permissionsRoutes);
app.use('/api/hierarchy', hierarchyRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/visitor-profiles', visitorProfileRoutes);
app.use('/api/identity-verification', identityVerificationRoutes);
app.use('/api/v1/identity-verification', require('./modules/identity-verification/routes/identity-verification.routes'));
app.use('/api/documents', visitorDocumentRoutes);
app.use('/api/visitor-categories', visitorCategoryRoutes);
app.use('/api/visitor-history', visitorHistoryRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/employee-portal', employeePortalRoutes);
app.use('/api/visitor-notifications', visitorNotificationCommunicationRoutes);
app.use('/api/automatic-notifications', require('./modules/notifications/routes/automatic-notifications.routes'));
app.use('/api/manual-notifications', require('./modules/notifications/routes/manual-notifications.routes'));
app.use('/api/manual-composer', require('./modules/notifications/routes/manual-composer.routes'));
app.use('/api/manual-analytics', require('./modules/reporting-analytics/routes/manual-analytics.routes'));
app.use('/api/notification-rules', require('./modules/notifications/routes/notification-rules.routes'));
app.use('/api/notification-engine', require('./modules/notifications/routes/notification-engine.routes'));
app.use('/api/v1/notifications', require('./modules/notifications/routes/notification-api.routes'));
app.use('/api/notifications', require('./modules/system-admin/routes/production-monitoring-api.routes'));
app.use('/api/admin/notifications', require('./modules/notifications/routes/notification-admin-api.routes'));
app.use('/api/admin/notification-operations', require('./modules/notifications/routes/notification-operations-api.routes'));
app.use('/api/manager/notifications', require('./modules/notifications/routes/manager-notification-api.routes'));
app.use('/api/reception/notifications', require('./modules/notifications/routes/reception-notification-api.routes'));
app.use('/api/security/notifications', require('./modules/notifications/routes/security-notification-api.routes'));
app.use('/api/platform/notifications', require('./modules/notifications/routes/platform-notification-api.routes'));
app.use('/api/security/blacklist-watchlist', require('./modules/blacklist-watchlist/routes/watchlist.routes'));
app.use('/api/admin/system', require('./modules/system-admin/routes/admin-system.routes'));
app.use('/api/feedback-support', require('./modules/system-admin/routes/feedback-support.routes'));
app.use('/api/support', require('./modules/system-admin/routes/feedback-support.routes'));




app.use('/api/docs/swagger.json', (req, res) => res.sendFile(require('path').join(__dirname, 'docs', 'swagger.json')));



app.use('/api/rules', require('./modules/approval-workflow/routes/workflow-rules.routes'));


app.use('/api/business-events', (req, res) => {

  const RuleEngineController = require('./modules/system-admin/controllers/rule-engine.controller');
  RuleEngineController.getBusinessEvents(req, res);
});





// Initialize Enterprise Automatic Notification Event Listener Subscribers
try {
  const NotificationEventListener = require('./events/listeners/NotificationEventListener');
  NotificationEventListener.init();
} catch (err) {
  console.error('Error initializing NotificationEventListener:', err);
}

// Browser Fallback: When a user clicks or navigates directly to a POST / PUT / PATCH / DELETE endpoint in a browser address bar,
// instead of returning Express's default raw "Cannot GET /api/...", render an interactive Form Tester pre-filled with database payload.
app.use((req, res, next) => {
  const acceptHeader = req.headers.accept || '';
  const isBrowserHtml = acceptHeader.includes('text/html') && !acceptHeader.includes('application/json') && !req.xhr;
  if (isBrowserHtml && req.method === 'GET' && req.path.startsWith('/api/')) {
    const ep = findEndpointByPath(req.path);
    if (ep && ep.method !== 'GET') {
      return res.status(200).send(renderSingleEndpointTester(req, ep));
    }
  }
  next();
});

// Centralized error handling middleware
app.use(errorHandler);


// Initialize Socket.io via Enterprise SocketService
const SocketService = require('./modules/system-admin/services/socket.service');
SocketService.initialize(io);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

function getNetworkIpv4Addresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const [name, ifaces] of Object.entries(interfaces)) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ name, address: iface.address });
      }
    }
  }
  return addresses;
}

server.listen(PORT, HOST, () => {
  const netIps = getNetworkIpv4Addresses();
  console.log(`\n==================================================`);
  console.log(` Visitor Management System (VMS) — Backend API`);
  console.log(`==================================================`);
  console.log(`  ➜ Local:   http://localhost:${PORT}`);
  if (netIps.length > 0) {
    netIps.forEach((iface) => {
      console.log(`  ➜ Network: http://${iface.address}:${PORT}  (${iface.name})`);
    });
  } else {
    console.log(`  ➜ Network: http://${HOST}:${PORT}`);
  }
  console.log(`==================================================\n`);

  // ── Render Production Keepalive (Prevents Free-Tier Container Sleep) ──
  const keepAliveUrl = process.env.RENDER_EXTERNAL_URL || 'https://visitor-managenment-system-backend.onrender.com';
  if (process.env.NODE_ENV === 'production' && keepAliveUrl) {
    const PING_INTERVAL_MS = 13 * 60 * 1000; // Ping every 13 minutes (Render sleeps at 15)
    setInterval(() => {
      try {
        const pingTarget = `${keepAliveUrl.replace(/\/+$/, '')}/api/health`;
        const https = require('https');
        https.get(pingTarget, (res) => {
          res.resume();
        }).on('error', () => {});
      } catch {
        // Silent error suppression for background keepalive
      }
    }, PING_INTERVAL_MS);
    console.log(`[Keepalive] Background self-ping initialized for ${keepAliveUrl}`);
  }
});

module.exports = app;
