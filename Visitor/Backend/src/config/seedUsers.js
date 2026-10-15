/**
 * MySQL Database User Seeder
 * ──────────────────────────────────────────────────────────────
 * Seeds clean demo users directly into the MySQL database.
 * All users are stored in the real DB so they appear on the Dashboard
 * and can be managed through the User Management UI.
 *
 * Password for all demo accounts: Password123!
 */

const bcrypt = require('bcryptjs');

const PASSWORD_HASH = bcrypt.hashSync('Belay2123@#', 10);

const DEMO_USERS = [
  // id, user_code, username, email, first_name, middle_name, last_name, full_name, phone, role, department_id, job_title
  [1, 'ADM000001', 'admin', 'admin@visitor.com', 'System', null, 'Admin', 'System Admin', '+1-555-0100', 'admin', 1, 'System Administrator'],
  [2, 'EMP000001', 'sarah.j', 'sarah.j@visitor.com', 'Sarah', 'M.', 'Johnson', 'Sarah Johnson', '+1-555-0101', 'staff', 2, 'Sales Director'],
  [3, 'EMP000002', 'michael.c', 'michael.c@visitor.com', 'Michael', 'K.', 'Chen', 'Michael Chen', '+1-555-0102', 'staff', 2, 'Account Manager'],
  [4, 'MGR000001', 'emily.d', 'emily.d@visitor.com', 'Emily', 'A.', 'Davis', 'Emily Davis', '+1-555-0103', 'manager', 3, 'Finance Manager'],
  [5, 'EMP000003', 'james.w', 'james.w@visitor.com', 'James', 'R.', 'Wilson', 'James Wilson', '+1-555-0104', 'staff', 4, 'Operations Lead'],
  [6, 'REC000001', 'lisa.t', 'lisa.t@visitor.com', 'Lisa', '', 'Thompson', 'Lisa Thompson', '+1-555-0105', 'receptionist', 1, 'Front Desk Manager'],
  [7, 'SEC000001', 'robert.g', 'robert.g@visitor.com', 'Robert', '', 'Garcia', 'Robert Garcia', '+1-555-0106', 'security_officer', 6, 'Security Officer'],
  [8, 'EMP000004', 'amanda.f', 'amanda.f@visitor.com', 'Amanda', '', 'Foster', 'Amanda Foster', '+1-555-0107', 'staff', 5, 'HR Director'],
  [9, 'EMP000005', 'kevin.p', 'kevin.p@visitor.com', 'Kevin', '', 'Park', 'Kevin Park', '+1-555-0108', 'staff', 5, 'Talent Acquisition Lead'],
  [10, 'EMP000006', 'diana.r', 'diana.r@visitor.com', 'Diana', '', 'Ruiz', 'Diana Ruiz', '+1-555-0109', 'staff', 6, 'IT Support Manager'],
  [11, 'EMP000007', 'thomas.w', 'thomas.w@visitor.com', 'Thomas', '', 'Wright', 'Thomas Wright', '+1-555-0110', 'staff', 1, 'Executive Assistant'],
  [12, 'VIS000001', 'visitor', 'visitor@visitor.com', 'David', '', 'Visitor', 'David Visitor', '+1-555-0111', 'visitor', null, 'Visiting Client'],
  [13, 'VIS000002', 'yetmul8@gmail.com', 'yetmul8@gmail.com', 'Yetmwerk', 'Ayele', 'Muluneh', 'Yetmwerk Ayele Muluneh', '+251911234567', 'visitor', null, 'Guest Visitor'],
  [14, 'EMP000008', 'employee', 'employee@visitor.com', 'Employee', '', 'Demo', 'Employee Demo', '+1-555-0112', 'staff', 2, 'Host Employee'],
  [15, 'MGR000002', 'manager', 'manager@visitor.com', 'Manager', '', 'Demo', 'Manager Demo', '+1-555-0113', 'manager', 3, 'General Manager'],
  [16, 'REC000002', 'receptionist', 'receptionist@visitor.com', 'Receptionist', '', 'Demo', 'Receptionist Demo', '+1-555-0114', 'receptionist', 1, 'Front Desk Staff'],
  [17, 'SEC000002', 'security', 'security@visitor.com', 'Security', '', 'Demo', 'Security Demo', '+1-555-0115', 'security_officer', 6, 'Security Guard']
];

const USER_ROLE_MAPPINGS = [
  [1, 1],   // admin → Administrator
  [2, 2],   // sarah.j → Employee/Host
  [3, 2],   // michael.c → Employee/Host
  [4, 6],   // emily.d → Department Manager
  [5, 2],   // james.w → Employee/Host
  [6, 3],   // lisa.t → Receptionist
  [7, 4],   // robert.g → Security Officer
  [8, 2],   // amanda.f → Employee/Host
  [9, 2],   // kevin.p → Employee/Host
  [10, 2],  // diana.r → Employee/Host
  [11, 2],  // thomas.w → Employee/Host
  [12, 5],  // visitor → Visitor
  [13, 5],  // yetmul8 → Visitor
  [14, 2],  // employee → Employee/Host
  [15, 6],  // manager → Department Manager
  [16, 3],  // receptionist → Receptionist
  [17, 4]   // security → Security Officer
];

const EMPLOYEES = [
  [1, 1, 1, 'EMP-2026-0001', 'System', '', 'Admin', 'System Admin', 'Male', 'admin@visitor.com', '+1-555-0100', 'System Administrator', 'Lead Admin', 1, 1, 1, 1, null],
  [2, 2, 2, 'EMP-2026-0002', 'Sarah', 'M.', 'Johnson', 'Sarah Johnson', 'Female', 'sarah.j@visitor.com', '+1-555-0101', 'Sales Director', 'Director', 1, 1, 2, 1, 1],
  [3, 3, 3, 'EMP-2026-0003', 'Michael', 'K.', 'Chen', 'Michael Chen', 'Male', 'michael.c@visitor.com', '+1-555-0102', 'Account Manager', 'Senior Lead', 1, 1, 2, 1, 2],
  [4, 4, 4, 'EMP-2026-0004', 'Emily', 'A.', 'Davis', 'Emily Davis', 'Female', 'emily.d@visitor.com', '+1-555-0103', 'Finance Manager', 'Department Head', 1, 1, 3, 1, 1],
  [5, 5, 5, 'EMP-2026-0005', 'James', 'R.', 'Wilson', 'James Wilson', 'Male', 'james.w@visitor.com', '+1-555-0104', 'Operations Lead', 'Lead', 1, 1, 4, 1, 1],
  [6, 6, 6, 'EMP-2026-0006', 'Lisa', '', 'Thompson', 'Lisa Thompson', 'Female', 'lisa.t@visitor.com', '+1-555-0105', 'Front Desk Manager', 'Manager', 1, 1, 1, 1, 1],
  [7, 7, 7, 'EMP-2026-0007', 'Robert', '', 'Garcia', 'Robert Garcia', 'Male', 'robert.g@visitor.com', '+1-555-0106', 'Security Officer', 'Officer', 1, 1, 6, 1, 1],
  [8, 8, 8, 'EMP-2026-0008', 'Amanda', '', 'Foster', 'Amanda Foster', 'Female', 'amanda.f@visitor.com', '+1-555-0107', 'HR Director', 'Director', 1, 1, 5, 1, 1],
  [9, 9, 9, 'EMP-2026-0009', 'Kevin', '', 'Park', 'Kevin Park', 'Male', 'kevin.p@visitor.com', '+1-555-0108', 'Talent Acquisition Lead', 'Lead', 1, 1, 5, 1, 8],
  [10, 10, 10, 'EMP-2026-0010', 'Diana', '', 'Ruiz', 'Diana Ruiz', 'Female', 'diana.r@visitor.com', '+1-555-0109', 'IT Support Manager', 'Manager', 1, 1, 6, 1, 1],
  [11, 11, 11, 'EMP-2026-0011', 'Thomas', '', 'Wright', 'Thomas Wright', 'Male', 'thomas.w@visitor.com', '+1-555-0110', 'Executive Assistant', 'Assistant', 1, 1, 1, 1, 1],
  [14, 14, 14, 'EMP-2026-0014', 'Employee', '', 'Demo', 'Employee Demo', 'Other', 'employee@visitor.com', '+1-555-0112', 'Host Employee', 'Staff', 1, 1, 2, 1, 2],
  [15, 15, 15, 'EMP-2026-0015', 'Manager', '', 'Demo', 'Manager Demo', 'Other', 'manager@visitor.com', '+1-555-0113', 'General Manager', 'Manager', 1, 1, 3, 1, 1],
  [16, 16, 16, 'EMP-2026-0016', 'Receptionist', '', 'Demo', 'Receptionist Demo', 'Female', 'receptionist@visitor.com', '+1-555-0114', 'Front Desk Staff', 'Staff', 1, 1, 1, 1, 1],
  [17, 17, 17, 'EMP-2026-0017', 'Security', '', 'Demo', 'Security Demo', 'Male', 'security@visitor.com', '+1-555-0115', 'Security Guard', 'Officer', 1, 1, 6, 1, 1]
];

const ALL_RESOURCES = [
  // Admin
  { id: 1, name: 'Admin Dashboard', route_url: '/admin/dashboard', react_component: 'AdminDashboard', menu_name: 'Dashboard', menu_group: 'Admin', display_order: 1 },
  { id: 2, name: 'User Management', route_url: '/admin/users', react_component: 'UserManagement', menu_name: 'Users', menu_group: 'Admin', display_order: 2 },
  { id: 3, name: 'Role Management', route_url: '/admin/roles', react_component: 'RoleManagement', menu_name: 'Roles', menu_group: 'Admin', display_order: 3 },
  { id: 4, name: 'Permission Management', route_url: '/admin/permissions', react_component: 'PermissionManagement', menu_name: 'Permissions', menu_group: 'Admin', display_order: 4 },
  { id: 5, name: 'Organization Configuration', route_url: '/admin/organization', react_component: 'OrganizationSettings', menu_name: 'Organization', menu_group: 'Admin', display_order: 5 },
  { id: 6, name: 'Department Configuration', route_url: '/admin/department', react_component: 'DepartmentSettings', menu_name: 'Departments', menu_group: 'Admin', display_order: 6 },
  { id: 7, name: 'Audit Logs', route_url: '/admin/audit-logs', react_component: 'AuditLogs', menu_name: 'Audit Logs', menu_group: 'Admin', display_order: 7 },
  { id: 8, name: 'System Settings', route_url: '/admin/settings', react_component: 'SystemSettings', menu_name: 'Settings', menu_group: 'Admin', display_order: 8 },

  // Visitor
  { id: 9, name: 'Visitor Dashboard', route_url: '/visitor/dashboard', react_component: 'VisitorDashboard', menu_name: 'Dashboard', menu_group: 'Visitor', display_order: 1 },
  { id: 10, name: 'Visitor Profile', route_url: '/visitor/profile', react_component: 'VisitorProfile', menu_name: 'Profile', menu_group: 'Visitor', display_order: 2 },
  { id: 11, name: 'Book Appointments', route_url: '/visitor/appointments', react_component: 'VisitorAppointments', menu_name: 'Appointments', menu_group: 'Visitor', display_order: 3 },
  { id: 12, name: 'Visitor Documents', route_url: '/visitor/documents', react_component: 'VisitorDocuments', menu_name: 'Documents', menu_group: 'Visitor', display_order: 4 },
  { id: 13, name: 'Visitor Notifications', route_url: '/visitor/notifications', react_component: 'VisitorNotifications', menu_name: 'Notifications', menu_group: 'Visitor', display_order: 5 },
  { id: 14, name: 'Visit History', route_url: '/visitor/visit-history', react_component: 'VisitHistory', menu_name: 'History', menu_group: 'Visitor', display_order: 6 },
  { id: 50, name: 'Visitor Pass', route_url: '/visitor/visitor-pass', react_component: 'VisitorPass', menu_name: 'Visitor Pass', menu_group: 'Visitor', display_order: 7 },
  { id: 51, name: 'System Chat', route_url: '/visitor/system-chat', react_component: 'SystemChat', menu_name: 'System Chat', menu_group: 'Visitor', display_order: 8 },
  { id: 52, name: 'Visitor Feedback', route_url: '/visitor/feedback', react_component: 'VisitorFeedback', menu_name: 'Feedback', menu_group: 'Visitor', display_order: 9 },
  { id: 53, name: 'Help & Support', route_url: '/visitor/support', react_component: 'VisitorSupport', menu_name: 'Help & Support', menu_group: 'Visitor', display_order: 10 },
  { id: 54, name: 'Visitor Settings', route_url: '/visitor/settings', react_component: 'VisitorSettings', menu_name: 'Settings', menu_group: 'Visitor', display_order: 11 },

  // Employee
  { id: 15, name: 'Employee Dashboard', route_url: '/employee/dashboard', react_component: 'EmployeeDashboard', menu_name: 'Dashboard', menu_group: 'Employee', display_order: 1 },
  { id: 16, name: 'Visitor Invitations', route_url: '/employee/invitations', react_component: 'VisitorInvitation', menu_name: 'Invitations', menu_group: 'Employee', display_order: 2 },
  { id: 17, name: 'Calendar', route_url: '/employee/calendar', react_component: 'Calendar', menu_name: 'Calendar', menu_group: 'Employee', display_order: 3 },
  { id: 18, name: 'Appointment Management', route_url: '/employee/appointment-management', react_component: 'AppointmentManagement', menu_name: 'Meetings', menu_group: 'Employee', display_order: 4 },
  { id: 19, name: 'Employee Visitor History', route_url: '/employee/visitor-history', react_component: 'EmployeeVisitorHistory', menu_name: 'History', menu_group: 'Employee', display_order: 5 },

  // Manager
  { id: 20, name: 'Manager Dashboard', route_url: '/manager/dashboard', react_component: 'ManagerDashboard', menu_name: 'Dashboard', menu_group: 'Manager', display_order: 1 },
  { id: 21, name: 'Department Approvals', route_url: '/manager/approvals', react_component: 'Approvals', menu_name: 'Approvals', menu_group: 'Manager', display_order: 2 },
  { id: 22, name: 'Department Visitor Tracking', route_url: '/manager/department-visitors', react_component: 'DepartmentVisitors', menu_name: 'Visitors', menu_group: 'Manager', display_order: 3 },
  { id: 23, name: 'Department Reports', route_url: '/manager/department-reports', react_component: 'DepartmentReports', menu_name: 'Reports', menu_group: 'Manager', display_order: 4 },

  // Receptionist
  { id: 24, name: 'Reception Dashboard', route_url: '/reception/dashboard', react_component: 'ReceptionDashboard', menu_name: 'Dashboard', menu_group: 'Reception', display_order: 1 },
  { id: 25, name: 'Visitor Registration', route_url: '/reception/visitor-registration', react_component: 'VisitorRegistration', menu_name: 'Register', menu_group: 'Reception', display_order: 2 },
  { id: 26, name: 'Visitor Verification', route_url: '/reception/visitor-verification', react_component: 'VisitorVerification', menu_name: 'Verify', menu_group: 'Reception', display_order: 3 },
  { id: 27, name: 'Badge Management', route_url: '/reception/badge-management', react_component: 'BadgeManagement', menu_name: 'Badges', menu_group: 'Reception', display_order: 4 },
  { id: 28, name: 'Check In Lobby', route_url: '/reception/checkin', react_component: 'CheckIn', menu_name: 'Check In', menu_group: 'Reception', display_order: 5 },
  { id: 29, name: 'Check Out Lobby', route_url: '/reception/checkout', react_component: 'CheckOut', menu_name: 'Check Out', menu_group: 'Reception', display_order: 6 },
  { id: 30, name: 'Walk-In Visitors Queue', route_url: '/reception/walk-in-visitors', react_component: 'WalkInVisitors', menu_name: 'Walk-Ins', menu_group: 'Reception', display_order: 7 },

  // Security
  { id: 31, name: 'Security Dashboard', route_url: '/security/dashboard', react_component: 'SecurityDashboard', menu_name: 'Dashboard', menu_group: 'Security', display_order: 1 },
  { id: 32, name: 'QR Scanner Check', route_url: '/security/qr-scanner', react_component: 'QRScanner', menu_name: 'Scan', menu_group: 'Security', display_order: 2 },
  { id: 33, name: 'Access Control', route_url: '/security/access-control', react_component: 'AccessControl', menu_name: 'Gates', menu_group: 'Security', display_order: 3 },
  { id: 34, name: 'Incident Management', route_url: '/security/incident-management', react_component: 'IncidentManagement', menu_name: 'Incidents', menu_group: 'Security', display_order: 4 },
  { id: 35, name: 'Visitor Movement Logs', route_url: '/security/visitor-movement', react_component: 'VisitorMovement', menu_name: 'Logs', menu_group: 'Security', display_order: 5 }
];

let _seedDemoUsersRun = false;

async function seedDemoUsers(queryFn, options = {}) {
  const { cleanReset = false } = options;
  if (_seedDemoUsersRun && !cleanReset) return;
  _seedDemoUsersRun = true;

  try {
    // ─── Ensure users table schema ─────────────────────────────────────
    const userAlters = [
      `ALTER TABLE users ADD COLUMN user_code VARCHAR(50) NULL`,
      `ALTER TABLE users ADD COLUMN first_name VARCHAR(100) NULL`,
      `ALTER TABLE users ADD COLUMN middle_name VARCHAR(100) NULL`,
      `ALTER TABLE users ADD COLUMN last_name VARCHAR(100) NULL`,
      `ALTER TABLE users ADD COLUMN full_name VARCHAR(200) NULL`,
      `ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL`,
      `ALTER TABLE users ADD COLUMN phone_number VARCHAR(50) NULL`,
      `ALTER TABLE users ADD COLUMN avatar_url TEXT NULL`,
      `ALTER TABLE users ADD COLUMN account_status VARCHAR(50) DEFAULT 'ACTIVE'`,
      `ALTER TABLE users ADD COLUMN email_verified TINYINT(1) DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN phone_verified TINYINT(1) DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN mfa_enabled TINYINT(1) DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN failed_login_attempts INT DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN account_locked_until DATETIME NULL`,
      `ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL`,
      `ALTER TABLE users ADD COLUMN first_login_required TINYINT(1) DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN verification_status VARCHAR(50) DEFAULT 'VERIFIED'`,
      `ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL`,
      `ALTER TABLE users ADD COLUMN reset_token_expires DATETIME NULL`,
      `ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL`,
      `ALTER TABLE users ADD COLUMN department_id INT NULL`,
      `ALTER TABLE users ADD COLUMN job_title VARCHAR(100) NULL`,
      `ALTER TABLE users ADD COLUMN availability_json TEXT NULL`,
    ];
    for (const q of userAlters) {
      try { await queryFn(q); } catch (e) { /* column exists */ }
    }

    const userModifies = [
      `ALTER TABLE users MODIFY COLUMN account_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'`,
      `ALTER TABLE users MODIFY COLUMN status VARCHAR(50) NULL DEFAULT 'active'`,
    ];
    for (const q of userModifies) {
      try { await queryFn(q); } catch (e) { /* ignore */ }
    }

    try {
      await queryFn("DROP TRIGGER IF EXISTS trg_users_before_insert");
      await queryFn(`
        CREATE TRIGGER trg_users_before_insert
        BEFORE INSERT ON users
        FOR EACH ROW
        BEGIN
            IF NEW.user_id IS NULL THEN
                IF NEW.id IS NOT NULL AND NEW.id > 0 THEN
                    SET NEW.user_id = NEW.id;
                ELSE
                    SET NEW.user_id = (SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users');
                END IF;
            END IF;
            IF (NEW.full_name IS NULL OR NEW.full_name = '') AND (NEW.first_name IS NOT NULL AND NEW.first_name != '') THEN
                SET NEW.full_name = TRIM(CONCAT(NEW.first_name, ' ', COALESCE(NEW.middle_name, ''), ' ', NEW.last_name));
            ELSEIF (NEW.full_name IS NOT NULL AND NEW.full_name != '') AND (NEW.first_name IS NULL OR NEW.first_name = '') THEN
                SET NEW.first_name = SUBSTRING_INDEX(NEW.full_name, ' ', 1);
                SET NEW.last_name = SUBSTRING(NEW.full_name, LENGTH(SUBSTRING_INDEX(NEW.full_name, ' ', 1)) + 2);
            END IF;
            IF NEW.phone IS NOT NULL AND NEW.phone_number IS NULL THEN
                SET NEW.phone_number = NEW.phone;
            ELSEIF NEW.phone_number IS NOT NULL AND NEW.phone IS NULL THEN
                SET NEW.phone = NEW.phone_number;
            END IF;
            IF NEW.avatar_url IS NOT NULL AND NEW.profile_photo IS NULL THEN
                SET NEW.profile_photo = NEW.avatar_url;
            ELSEIF NEW.profile_photo IS NOT NULL AND NEW.avatar_url IS NULL THEN
                SET NEW.avatar_url = NEW.profile_photo;
            END IF;
            IF NEW.status IS NOT NULL AND (NEW.account_status = 'PENDING' OR NEW.account_status IS NULL) THEN
                SET NEW.account_status = CASE 
                    WHEN NEW.status = 'active' THEN 'ACTIVE'
                    WHEN NEW.status = 'locked' THEN 'LOCKED'
                    WHEN NEW.status = 'suspended' THEN 'SUSPENDED'
                    WHEN NEW.status = 'archived' THEN 'ARCHIVED'
                    ELSE 'INACTIVE'
                END;
            ELSEIF NEW.account_status IS NOT NULL THEN
                SET NEW.status = CASE 
                    WHEN NEW.account_status = 'ACTIVE' THEN 'active'
                    WHEN NEW.account_status = 'LOCKED' THEN 'locked'
                    WHEN NEW.account_status = 'SUSPENDED' THEN 'suspended'
                    WHEN NEW.account_status = 'ARCHIVED' THEN 'archived'
                    ELSE 'inactive'
                END;
            END IF;
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
            IF NEW.job_title_id IS NOT NULL AND (NEW.job_title IS NULL OR NEW.job_title = '') THEN
                SET NEW.job_title = (SELECT title_name FROM job_titles WHERE id = NEW.job_title_id);
            END IF;
            IF NEW.username IS NULL OR NEW.username = '' THEN
                SET NEW.username = SUBSTRING_INDEX(NEW.email, '@', 1);
            END IF;
        END
      `);

      await queryFn("DROP TRIGGER IF EXISTS trg_users_before_update");
      await queryFn(`
        CREATE TRIGGER trg_users_before_update
        BEFORE UPDATE ON users
        FOR EACH ROW
        BEGIN
            IF NEW.id <> OLD.id THEN
                SET NEW.user_id = NEW.id;
            END IF;
            IF NEW.full_name <> OLD.full_name OR (NEW.full_name IS NOT NULL AND OLD.full_name IS NULL) THEN
                SET NEW.first_name = SUBSTRING_INDEX(NEW.full_name, ' ', 1);
                SET NEW.last_name = SUBSTRING(NEW.full_name, LENGTH(SUBSTRING_INDEX(NEW.full_name, ' ', 1)) + 2);
            ELSEIF NEW.first_name <> OLD.first_name OR NEW.last_name <> OLD.last_name OR (NEW.first_name IS NOT NULL AND OLD.first_name IS NULL) OR (NEW.last_name IS NOT NULL AND OLD.last_name IS NULL) THEN
                SET NEW.full_name = TRIM(CONCAT(NEW.first_name, ' ', COALESCE(NEW.middle_name, ''), ' ', NEW.last_name));
            END IF;
            IF NEW.phone <> OLD.phone OR (NEW.phone IS NOT NULL AND OLD.phone IS NULL) THEN
                SET NEW.phone_number = NEW.phone;
            ELSEIF NEW.phone_number <> OLD.phone_number OR (NEW.phone_number IS NOT NULL AND OLD.phone_number IS NULL) THEN
                SET NEW.phone = NEW.phone_number;
            END IF;
            IF NEW.avatar_url <> OLD.avatar_url OR (NEW.avatar_url IS NOT NULL AND OLD.avatar_url IS NULL) THEN
                SET NEW.profile_photo = NEW.avatar_url;
            ELSEIF NEW.profile_photo <> OLD.profile_photo OR (NEW.profile_photo IS NOT NULL AND OLD.profile_photo IS NULL) THEN
                SET NEW.avatar_url = NEW.profile_photo;
            END IF;
            IF NEW.status <> OLD.status OR (NEW.status IS NOT NULL AND OLD.status IS NULL) THEN
                SET NEW.account_status = CASE 
                    WHEN NEW.status = 'active' THEN 'ACTIVE'
                    WHEN NEW.status = 'locked' THEN 'LOCKED'
                    WHEN NEW.status = 'suspended' THEN 'SUSPENDED'
                    WHEN NEW.status = 'archived' THEN 'ARCHIVED'
                    ELSE 'INACTIVE'
                END;
            ELSEIF NEW.account_status <> OLD.account_status OR (NEW.account_status IS NOT NULL AND OLD.account_status IS NULL) THEN
                SET NEW.status = CASE 
                    WHEN NEW.account_status = 'ACTIVE' THEN 'active'
                    WHEN NEW.account_status = 'LOCKED' THEN 'locked'
                    WHEN NEW.account_status = 'SUSPENDED' THEN 'suspended'
                    WHEN NEW.account_status = 'ARCHIVED' THEN 'archived'
                    ELSE 'inactive'
                END;
            END IF;
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
            IF NEW.job_title_id <> OLD.job_title_id OR (NEW.job_title_id IS NOT NULL AND OLD.job_title_id IS NULL) THEN
                SET NEW.job_title = (SELECT title_name FROM job_titles WHERE id = NEW.job_title_id);
            END IF;
        END
      `);
    } catch (trigErr) { /* ignore trigger sync error */ }

    // ─── Ensure roles table exists and seed ─────────────────────────────
    try {
      await queryFn(`CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_name VARCHAR(100) NOT NULL,
        role_code VARCHAR(50) NOT NULL,
        description TEXT NULL,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        deleted_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    } catch (e) {}

    const roles = [
      [1, 'Administrator', 'ADMIN', 'System Administrator'],
      [2, 'Employee/Host', 'EMPLOYEE', 'Internal employee host'],
      [3, 'Receptionist', 'RECEPTIONIST', 'Lobby front-desk staff'],
      [4, 'Security Officer', 'SECURITY', 'Site patrol and security monitoring'],
      [5, 'Visitor', 'VISITOR', 'External client or vendor'],
      [6, 'Department Manager', 'MANAGER', 'Department Manager with approval authority']
    ];
    for (const r of roles) {
      try { await queryFn(`INSERT IGNORE INTO roles (id, role_name, role_code, description, status) VALUES (?, ?, ?, ?, 'ACTIVE')`, r); } catch (e) {}
    }

    // ─── Ensure departments table exists and seed ───────────────────────
    try {
      await queryFn(`CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NULL,
        department_name VARCHAR(100) NULL,
        description TEXT NULL,
        manager_id INT NULL,
        organization_id BIGINT UNSIGNED NULL,
        branch_id BIGINT UNSIGNED NULL,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    } catch (e) {}

    const departments = [
      [1, 'Executive Office', 'Executive Office', 'C-suite and executive meetings', 1],
      [2, 'Sales & Marketing', 'Sales & Marketing', 'Customer and partner engagements', 2],
      [3, 'Finance', 'Finance', 'Investor and financial stakeholder meetings', 4],
      [4, 'Operations', 'Operations', 'Vendor and operational meetings', 5],
      [5, 'Human Resources', 'Human Resources', 'Recruitment and HR consultations', 8],
      [6, 'IT & Security', 'IT & Security', 'Technical and security reviews', 7]
    ];
    for (const d of departments) {
      try {
        await queryFn(
          `INSERT IGNORE INTO departments (id, name, department_name, description, manager_id, status) VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
          d
        );
      } catch (e) {}
    }

    // ─── Ensure rooms view / table exists ──────────────────────────────
    try {
      await queryFn(`CREATE OR REPLACE VIEW rooms AS SELECT * FROM meeting_rooms`);
    } catch (e) {
      try {
        await queryFn(`CREATE TABLE IF NOT EXISTS rooms (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          room_name VARCHAR(100) NULL,
          location VARCHAR(100) NULL,
          capacity INT DEFAULT 10,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
      } catch (err2) {}
    }

    // ─── Ensure baseline employees are properly populated ────────────────
    try {
      const empCountRows = await queryFn(`SELECT COUNT(*) as count FROM employees`);
      const totalCount = empCountRows && empCountRows[0] ? Number(empCountRows[0].count) : 0;
      if (totalCount === 0) {
        const initialEmployees = [
          [1, 'EMP-2026-0001', 1, 'System', '', 'Admin', 'System Admin', 'Male', 'admin@visitor.com', '+251911000111', 'System Administrator', 1, 1, 'Available'],
          [2, 'EMP-2026-0002', 3, 'Sarah', 'M.', 'Johnson', 'Sarah Johnson', 'Female', 'sarah.j@visitor.com', '+1-555-0101', 'Sales Director', 2, 1, 'Available'],
          [3, 'EMP-2026-0003', 4, 'Michael', 'K.', 'Chen', 'Michael Chen', 'Male', 'michael.c@visitor.com', '+1-555-0102', 'Account Manager', 2, 1, 'In Meeting'],
          [4, 'EMP-2026-0004', 5, 'Emily', 'A.', 'Davis', 'Emily Davis', 'Female', 'emily.d@visitor.com', '+1-555-0103', 'Finance Manager', 3, 1, 'On Leave'],
          [5, 'EMP-2026-0005', 6, 'James', 'R.', 'Wilson', 'James Wilson', 'Male', 'james.w@visitor.com', '+1-555-0104', 'Operations Lead', 4, 1, 'Available']
        ];
        for (const u of initialEmployees) {
          await queryFn(`
            INSERT INTO employees (
              id, employee_number, user_id, first_name, middle_name, last_name,
              full_name, gender, email, mobile_number, job_title,
              department_id, is_host_enabled, availability_status,
              employment_status, deleted_at, archived_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', NULL, NULL)
          `, [u[0], u[1], u[2], u[3], u[4], u[5], u[6], u[7], u[8], u[9], u[10], u[11], u[12], u[13]]);
        }
      }
    } catch (e) {}

    // ─── Ensure user_roles table exists ─────────────────────────────────
    try {
      await queryFn(`CREATE TABLE IF NOT EXISTS user_roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        role_id INT NOT NULL,
        UNIQUE KEY uk_user_role (user_id, role_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    } catch (e) {}

    // ─── Ensure resources table exists and seed ─────────────────────────
    try {
      await queryFn(`CREATE TABLE IF NOT EXISTS resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        resource_name VARCHAR(100) NOT NULL,
        route_url VARCHAR(255) NOT NULL,
        react_component VARCHAR(100) NOT NULL,
        menu_name VARCHAR(100) NOT NULL,
        menu_group VARCHAR(100) NOT NULL,
        icon VARCHAR(50) NULL,
        display_order INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'ACTIVE'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    } catch (e) {}

    for (const res of ALL_RESOURCES) {
      try {
        await queryFn(
          `INSERT IGNORE INTO resources (id, resource_name, route_url, react_component, menu_name, menu_group, display_order, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
          [res.id, res.name, res.route_url, res.react_component, res.menu_name, res.menu_group, res.display_order]
        );
      } catch (e) {}
    }

    // ─── Ensure Root Administrator Exists ──────────────────────────────
    try {
      await queryFn(
        `INSERT INTO users (id, user_code, username, email, password_hash, first_name, last_name, full_name, role, department_id, job_title, phone, phone_number, account_status, status, email_verified, phone_verified, failed_login_attempts, first_login_required, verification_status)
         VALUES (1, 'ADM000001', 'admin', 'admin@visitor.com', ?, 'System', 'Admin', 'System Admin', 'admin', 1, 'System Administrator', '+1-555-0100', '+1-555-0100', 'ACTIVE', 'active', 1, 1, 0, 0, 'VERIFIED')
         ON DUPLICATE KEY UPDATE
           password_hash = VALUES(password_hash),
           account_status = 'ACTIVE',
           status = 'active',
           failed_login_attempts = 0,
           account_locked_until = NULL,
           email_verified = 1,
           phone_verified = 1,
           verification_status = 'VERIFIED'`,
        [PASSWORD_HASH]
      );
      await queryFn(`INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (1, 1)`);
    } catch (e) {
      console.warn('Admin account ensure warning:', e.message);
    }

    // ─── Optional Clean Reset ───────────────────────────────────────────
    if (cleanReset) {
      console.log('🔄 Cleaning old users and setting zero baseline...');
      try { await queryFn('SET FOREIGN_KEY_CHECKS = 0'); } catch (e) {}
      try { await queryFn('DELETE FROM checkins'); } catch (e) {}
      try { await queryFn('DELETE FROM appointments'); } catch (e) {}
      try { await queryFn('DELETE FROM visitors'); } catch (e) {}
      try { await queryFn('DELETE FROM notifications'); } catch (e) {}
      try { await queryFn('DELETE FROM notification_audit_logs'); } catch (e) {}
      try { await queryFn('DELETE FROM employees'); } catch (e) {}
      try { await queryFn(`DELETE FROM user_roles WHERE user_id != 1`); } catch (e) {}
      try { await queryFn(`DELETE FROM users WHERE id != 1 AND username != 'admin'`); } catch (e) {}
      try { await queryFn('SET FOREIGN_KEY_CHECKS = 1'); } catch (e) {}
    }

    // ─── Optional Demo User Seeding (only if requested explicitly) ──────
    if (options.seedDemoAccounts) {
      for (const u of DEMO_USERS) {
        try {
          await queryFn(
            `INSERT INTO users (id, user_code, username, email, password_hash, first_name, middle_name, last_name, full_name, phone, phone_number, role, department_id, job_title, account_status, status, email_verified, phone_verified, failed_login_attempts, first_login_required, verification_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 'active', 1, 1, 0, 0, 'VERIFIED')
             ON DUPLICATE KEY UPDATE
               username = VALUES(username),
               email = VALUES(email),
               password_hash = VALUES(password_hash),
               full_name = VALUES(full_name),
               role = VALUES(role),
               account_status = 'ACTIVE',
               status = 'active',
               verification_status = 'VERIFIED'`,
            [u[0], u[1], u[2], u[3], PASSWORD_HASH, u[4], u[5], u[6], u[7], u[8], u[8], u[9], u[10], u[11]]
          );
        } catch (e) {}
      }

      for (const [uid, rid] of USER_ROLE_MAPPINGS) {
        try {
          await queryFn(`INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`, [uid, rid]);
        } catch (e) {}
      }

      for (const e of EMPLOYEES) {
        try {
          await queryFn(
            `INSERT INTO employees (id, employee_id, user_id, employee_number, first_name, middle_name, last_name, full_name, gender, email, mobile_number, job_title, position, organization_id, branch_id, department_id, building_id, manager_id, employment_status, is_host_enabled)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', 1)
             ON DUPLICATE KEY UPDATE
               full_name = VALUES(full_name),
               email = VALUES(email),
               employment_status = 'Active'`,
            e
          );
        } catch (e2) {}
      }
    }

    console.log('✅ Base system initialized (Admin user and RBAC active).');
  } catch (err) {
    console.warn('DB User Seed warning:', err.message);
  }
}

module.exports = { seedDemoUsers, DEMO_USERS, ALL_RESOURCES };
