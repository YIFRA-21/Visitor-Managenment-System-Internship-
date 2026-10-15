USE visitor_db;

SET FOREIGN_KEY_CHECKS = 0;

-- Password for all demo users: Password123!
-- bcrypt hash generated for 'Password123!'
SET
    @pwd = '$2a$10$0XfFhDBs7qXRsDWAtk8wI.bbSJlXnyxYzKn0mDsU9pC0Fk9RzEFCq';

-- =====================================================================================
-- 1. SEED ROLES
-- =====================================================================================
INSERT INTO
    roles (
        id,
        role_name,
        role_code,
        description,
        is_system_role,
        status
    )
VALUES (
        1,
        'admin',
        'ADMIN',
        'System Administrator with full access to configuration, audits, and user controls',
        TRUE,
        'ACTIVE'
    ),
    (
        2,
        'staff',
        'EMPLOYEE',
        'Internal employee host allowed to schedule and authorize visitor requests',
        TRUE,
        'ACTIVE'
    ),
    (
        3,
        'receptionist',
        'RECEPTIONIST',
        'Lobby front-desk staff responsible for checking in, printing passes, and badge management',
        TRUE,
        'ACTIVE'
    ),
    (
        4,
        'security_officer',
        'SECURITY',
        'Site patrol and security monitoring responsible for watchlists, incident logging, and alerts',
        TRUE,
        'ACTIVE'
    ),
    (
        5,
        'visitor',
        'VISITOR',
        'External client or vendor with limited profile review capabilities',
        TRUE,
        'ACTIVE'
    ),
    (
        6,
        'manager',
        'MANAGER',
        'Department Manager with approval authority',
        TRUE,
        'ACTIVE'
    );

-- =====================================================================================
-- 2. SEED ROLE HIERARCHY
-- =====================================================================================
INSERT INTO
    role_hierarchy (
        parent_role_id,
        child_role_id,
        path,
        level
    )
VALUES (1, 6, '1/6', 1), -- Admin covers Manager
    (6, 2, '6/2', 2), -- Manager covers Staff
    (2, 5, '2/5', 3);
-- Staff covers Visitor

-- =====================================================================================
-- 3. SEED PERMISSIONS
-- =====================================================================================
INSERT INTO
    permissions (
        id,
        permission_name,
        permission_code,
        module,
        description,
        is_system_permission,
        status
    )
VALUES (
        1,
        'View Users',
        'USER_VIEW',
        'AUTH',
        'View user list',
        TRUE,
        'ACTIVE'
    ),
    (
        2,
        'Create User',
        'USER_CREATE',
        'AUTH',
        'Create new user',
        TRUE,
        'ACTIVE'
    ),
    (
        3,
        'Update User',
        'USER_UPDATE',
        'AUTH',
        'Update user data',
        TRUE,
        'ACTIVE'
    ),
    (
        4,
        'Delete User',
        'USER_DELETE',
        'AUTH',
        'Delete user',
        TRUE,
        'ACTIVE'
    ),
    (
        5,
        'View Roles',
        'ROLE_VIEW',
        'AUTH',
        'View roles',
        TRUE,
        'ACTIVE'
    ),
    (
        6,
        'Create Role',
        'ROLE_CREATE',
        'AUTH',
        'Create roles',
        TRUE,
        'ACTIVE'
    ),
    (
        7,
        'Assign Role',
        'ROLE_ASSIGN',
        'AUTH',
        'Assign roles to users',
        TRUE,
        'ACTIVE'
    ),
    (
        8,
        'View Permissions',
        'PERM_VIEW',
        'AUTH',
        'View permissions',
        TRUE,
        'ACTIVE'
    ),
    (
        9,
        'Assign Permission',
        'PERM_ASSIGN',
        'AUTH',
        'Assign permissions to roles',
        TRUE,
        'ACTIVE'
    ),
    (
        10,
        'Create Appointment',
        'appointment:create',
        'APPOINTMENT',
        'Request visitor appointments',
        TRUE,
        'ACTIVE'
    ),
    (
        11,
        'Read Appointment',
        'appointment:read',
        'APPOINTMENT',
        'Review scheduled appointments',
        TRUE,
        'ACTIVE'
    ),
    (
        12,
        'Approve Appointment',
        'appointment:approve',
        'APPOINTMENT',
        'Approve pending appointment levels',
        TRUE,
        'ACTIVE'
    ),
    (
        13,
        'Reject Appointment',
        'appointment:reject',
        'APPOINTMENT',
        'Reject appointment requests',
        TRUE,
        'ACTIVE'
    ),
    (
        14,
        'Scan Pass',
        'checkin:scan',
        'LOBBY',
        'Scan visitor passes at lobby desks',
        TRUE,
        'ACTIVE'
    ),
    (
        15,
        'Checkout Pass',
        'checkin:checkout',
        'LOBBY',
        'Log visitor checkout events',
        TRUE,
        'ACTIVE'
    ),
    (
        16,
        'Blacklist Visitor',
        'visitor:blacklist',
        'SECURITY',
        'Manage visitor safety watchlist status',
        TRUE,
        'ACTIVE'
    ),
    (
        17,
        'Report Incident',
        'security:report',
        'SECURITY',
        'Log physical security incidents and attach files',
        TRUE,
        'ACTIVE'
    ),
    (
        18,
        'View Reports',
        'reports:view',
        'REPORTS',
        'Access dashboard analytics and audit logs',
        TRUE,
        'ACTIVE'
    ),
    (
        19,
        'Update Settings',
        'settings:update',
        'SETTINGS',
        'Modify system-wide parameter configurations',
        TRUE,
        'ACTIVE'
    );

-- =====================================================================================
-- 4. SEED ROLE-PERMISSION JUNCTIONS
-- =====================================================================================
-- Admin permissions (All 1-19)
INSERT INTO
    role_permissions (role_id, permission_id)
VALUES (1, 1),
    (1, 2),
    (1, 3),
    (1, 4),
    (1, 5),
    (1, 6),
    (1, 7),
    (1, 8),
    (1, 9),
    (1, 10),
    (1, 11),
    (1, 12),
    (1, 13),
    (1, 14),
    (1, 15),
    (1, 16),
    (1, 17),
    (1, 18),
    (1, 19);

-- Staff permissions (View Users, Create/Read appts, Approve/Reject own levels)
INSERT INTO
    role_permissions (role_id, permission_id)
VALUES (2, 1),
    (2, 10),
    (2, 11),
    (2, 12),
    (2, 13);

-- Receptionist permissions (View Users, Read appts, Scan/Checkout passes)
INSERT INTO
    role_permissions (role_id, permission_id)
VALUES (3, 1),
    (3, 11),
    (3, 14),
    (3, 15);

-- Security Officer permissions (View Users, Read appts, Scan/Checkout, Blacklist, Report Incident)
INSERT INTO
    role_permissions (role_id, permission_id)
VALUES (4, 1),
    (4, 11),
    (4, 14),
    (4, 15),
    (4, 16),
    (4, 17);

-- Visitor permissions (Create/Read own appointments)
INSERT INTO
    role_permissions (role_id, permission_id)
VALUES (5, 10),
    (5, 11);

-- Manager permissions (View Users, Read/Approve/Reject appointments)
INSERT INTO
    role_permissions (role_id, permission_id)
VALUES (6, 1),
    (6, 11),
    (6, 12),
    (6, 13);

-- =====================================================================================
-- 5. SEED FACILITIES
-- =====================================================================================
INSERT INTO
    facilities (
        id,
        name,
        code,
        address,
        timezone,
        status
    )
VALUES (
        1,
        'Addis Ababa HQ',
        'AA-HQ',
        'Bole Road, Addis Ababa, Ethiopia',
        'Africa/Addis_Ababa',
        'ACTIVE'
    ),
    (
        2,
        'New York Corporate Branch',
        'NY-BR',
        'Midtown Manhattan, New York, USA',
        'America/New_York',
        'ACTIVE'
    );

-- =====================================================================================
-- 6. SEED DEPARTMENTS
-- =====================================================================================
INSERT INTO
    departments (
        id,
        facility_id,
        department_code,
        department_name,
        description,
        manager_user_id
    )
VALUES (
        1,
        1,
        'EXEC',
        'Executive Office',
        'Corporate leadership and corporate affairs',
        NULL
    ),
    (
        2,
        1,
        'SALES',
        'Sales & Marketing',
        'Customer acquisition, partner management, and public branding',
        NULL
    ),
    (
        3,
        1,
        'FIN',
        'Finance & Accounting',
        'Corporate treasury, investment reviews, and reporting',
        NULL
    ),
    (
        4,
        1,
        'OPS',
        'Operations & Infrastructure',
        'General operations, logistics, facilities, and maintenance',
        NULL
    ),
    (
        5,
        1,
        'HR',
        'Human Resources',
        'Recruitment, employee onboarding, and talent administration',
        NULL
    ),
    (
        6,
        1,
        'IT',
        'IT & Information Security',
        'Security audits, helpdesk support, and cloud systems',
        NULL
    );

-- =====================================================================================
-- 6.5 SEED JOB TITLES
-- =====================================================================================
INSERT INTO
    job_titles (
        id,
        title_code,
        title_name,
        description,
        hierarchy_level,
        status
    )
VALUES (
        1,
        'CEO',
        'Chief Executive Officer',
        'Company Executive Officer',
        1,
        'ACTIVE'
    ),
    (
        2,
        'DIR',
        'Director',
        'Departmental Executive Director',
        2,
        'ACTIVE'
    ),
    (
        3,
        'MGR',
        'Manager',
        'Team or Section Manager',
        3,
        'ACTIVE'
    ),
    (
        4,
        'EMP',
        'Employee',
        'Standard staff member',
        4,
        'ACTIVE'
    ),
    (
        5,
        'SEC',
        'Security Officer',
        'Site physical security protection',
        4,
        'ACTIVE'
    ),
    (
        6,
        'RCP',
        'Receptionist',
        'Lobby receptionist service',
        4,
        'ACTIVE'
    ),
    (
        7,
        'SYSADMIN',
        'System Administrator',
        'Infrastructure administration services',
        3,
        'ACTIVE'
    );

-- =====================================================================================
-- 7. SEED USERS
-- =====================================================================================
INSERT INTO
    users (
        id,
        username,
        email,
        password_hash,
        first_name,
        last_name,
        phone_number,
        gender,
        account_status,
        email_verified,
        phone_verified,
        role,
        department_id,
        job_title_id,
        availability_json
    )
VALUES (
        1,
        'admin',
        'admin@visitor.com',
        @pwd,
        'System',
        'Admin',
        '+1-555-0100',
        'MALE',
        'ACTIVE',
        TRUE,
        TRUE,
        'admin',
        1,
        7,
        '{"mon":["09:00","17:00"],"tue":["09:00","17:00"],"wed":["09:00","17:00"],"thu":["09:00","17:00"],"fri":["09:00","17:00"]}'
    ),
    (
        2,
        'reception',
        'reception@system.com',
        @pwd,
        'Front',
        'Desk',
        '+251911111111',
        'FEMALE',
        'ACTIVE',
        TRUE,
        TRUE,
        'receptionist',
        1,
        6,
        '{"mon":["07:00","19:00"],"tue":["07:00","19:00"],"wed":["07:00","19:00"],"thu":["07:00","19:00"],"fri":["07:00","19:00"]}'
    ),
    (
        3,
        'sarah.j',
        'sarah.j@visitor.com',
        @pwd,
        'Sarah',
        'Johnson',
        '+1-555-0101',
        'FEMALE',
        'ACTIVE',
        TRUE,
        TRUE,
        'staff',
        2,
        2,
        '{"mon":["09:00","18:00"],"tue":["09:00","18:00"],"wed":["09:00","18:00"],"thu":["09:00","18:00"],"fri":["09:00","17:00"]}'
    ),
    (
        4,
        'michael.c',
        'michael.c@visitor.com',
        @pwd,
        'Michael',
        'Chen',
        '+1-555-0102',
        'MALE',
        'ACTIVE',
        TRUE,
        TRUE,
        'staff',
        2,
        4,
        '{"mon":["10:00","18:00"],"tue":["10:00","18:00"],"wed":["10:00","18:00"],"thu":["10:00","18:00"],"fri":["10:00","16:00"]}'
    ),
    (
        5,
        'emily.d',
        'emily.d@visitor.com',
        @pwd,
        'Emily',
        'Davis',
        '+1-555-0103',
        'FEMALE',
        'ACTIVE',
        TRUE,
        TRUE,
        'manager',
        3,
        3,
        '{"mon":["08:30","17:30"],"tue":["08:30","17:30"],"wed":["08:30","17:30"],"thu":["08:30","17:30"],"fri":["08:30","16:00"]}'
    ),
    (
        6,
        'james.w',
        'james.w@visitor.com',
        @pwd,
        'James',
        'Wilson',
        '+1-555-0104',
        'MALE',
        'ACTIVE',
        TRUE,
        TRUE,
        'staff',
        4,
        3,
        '{"mon":["09:00","17:00"],"tue":["09:00","17:00"],"wed":["09:00","17:00"],"thu":["09:00","17:00"],"fri":["09:00","17:00"]}'
    ),
    (
        7,
        'lisa.t',
        'lisa.t@visitor.com',
        @pwd,
        'Lisa',
        'Thompson',
        '+1-555-0105',
        'FEMALE',
        'ACTIVE',
        TRUE,
        TRUE,
        'receptionist',
        1,
        3,
        '{"mon":["07:00","19:00"],"tue":["07:00","19:00"],"wed":["07:00","19:00"],"thu":["07:00","19:00"],"fri":["07:00","19:00"]}'
    ),
    (
        8,
        'robert.g',
        'robert.g@visitor.com',
        @pwd,
        'Robert',
        'Garcia',
        '+1-555-0106',
        'MALE',
        'ACTIVE',
        TRUE,
        TRUE,
        'security_officer',
        6,
        5,
        '{"mon":["06:00","22:00"],"tue":["06:00","22:00"],"wed":["06:00","22:00"],"thu":["06:00","22:00"],"fri":["06:00","22:00"]}'
    ),
    (
        9,
        'system_admin_alt',
        'admin@system.com',
        @pwd,
        'Admin',
        'Alt',
        '+251900000000',
        'MALE',
        'ACTIVE',
        TRUE,
        TRUE,
        'admin',
        1,
        7,
        '{"mon":["09:00","17:00"]}'
    ),
    (
        10,
        'john.smith',
        'john.smith@email.com',
        @pwd,
        'John',
        'Smith',
        '+1-555-1001',
        'MALE',
        'ACTIVE',
        TRUE,
        TRUE,
        'visitor',
        NULL,
        NULL,
        NULL
    ),
    (
        11,
        'maria.g',
        'maria.g@techstart.io',
        @pwd,
        'Maria',
        'Garcia',
        '+1-555-1002',
        'FEMALE',
        'ACTIVE',
        TRUE,
        TRUE,
        'visitor',
        NULL,
        NULL,
        NULL
    ),
    (
        12,
        'david.lee',
        'david.lee@invest.com',
        @pwd,
        'David',
        'Lee',
        '+1-555-1003',
        'MALE',
        'ACTIVE',
        TRUE,
        TRUE,
        'visitor',
        NULL,
        NULL,
        NULL
    ),
    (
        13,
        'amanda.f',
        'amanda.f@visitor.com',
        @pwd,
        'Amanda',
        'Foster',
        '+1-555-0107',
        'FEMALE',
        'ACTIVE',
        TRUE,
        TRUE,
        'staff',
        5,
        2,
        '{"mon":["08:00","17:00"],"tue":["08:00","17:00"],"wed":["08:00","17:00"],"thu":["08:00","17:00"],"fri":["08:00","16:00"]}'
    ),
    (
        14,
        'kevin.p',
        'kevin.p@visitor.com',
        @pwd,
        'Kevin',
        'Park',
        '+1-555-0108',
        'MALE',
        'ACTIVE',
        TRUE,
        TRUE,
        'staff',
        6,
        2,
        '{"mon":["09:00","18:00"],"tue":["09:00","18:00"],"wed":["09:00","18:00"],"thu":["09:00","18:00"],"fri":["09:00","17:00"]}'
    );

-- =====================================================================================
-- 8. LINK DEPARTMENTS MANAGERS
-- =====================================================================================
UPDATE departments SET manager_user_id = 3 WHERE id = 2;
-- Sarah Johnson manages Sales
UPDATE departments SET manager_user_id = 5 WHERE id = 3;
-- Emily Davis manages Finance

-- =====================================================================================
-- 9. SEED USER ROLES (JUNCTION MAP)
-- =====================================================================================
INSERT INTO
    user_roles (user_id, role_id, assigned_by)
VALUES (1, 1, 1), -- Admin -> Admin
    (2, 3, 1), -- Reception -> Receptionist
    (3, 2, 1), -- Sarah -> Staff
    (4, 2, 1), -- Michael -> Staff
    (5, 6, 1), -- Emily -> Manager
    (6, 2, 1), -- James -> Staff
    (7, 3, 1), -- Lisa -> Receptionist
    (8, 4, 1), -- Robert -> Security
    (9, 1, 1), -- System Admin Alt -> Admin
    (10, 5, 1), -- John Smith -> Visitor
    (11, 5, 1), -- Maria Garcia -> Visitor
    (12, 5, 1), -- David Lee -> Visitor
    (13, 2, 1), -- Amanda Foster -> Staff
    (14, 2, 1);
-- Kevin Park -> Staff

-- =====================================================================================
-- 10. SEED STAFF PROFILES
-- =====================================================================================
INSERT INTO
    employees (
        id,
        facility_id,
        user_id,
        department_id,
        manager_id,
        employee_number,
        job_title_id,
        office_location,
        employment_status,
        created_by
    )
VALUES (
        1,
        1,
        1,
        1,
        NULL,
        'EMP-001',
        7,
        'Server Room - 4th Floor',
        'full_time',
        1
    ),
    (
        2,
        1,
        3,
        2,
        NULL,
        'EMP-002',
        2,
        'Desk 5 - 3rd Floor',
        'full_time',
        1
    ),
    (
        3,
        1,
        4,
        2,
        3,
        'EMP-003',
        4,
        'Desk 12 - 3rd Floor',
        'full_time',
        1
    ),
    (
        4,
        1,
        5,
        3,
        NULL,
        'EMP-004',
        3,
        'Office 2B - 2nd Floor',
        'full_time',
        1
    ),
    (
        5,
        1,
        6,
        4,
        NULL,
        'EMP-005',
        3,
        'Facility Bay 1',
        'full_time',
        1
    ),
    (
        6,
        1,
        7,
        1,
        NULL,
        'EMP-006',
        3,
        'Main Lobby Reception',
        'full_time',
        1
    ),
    (
        7,
        1,
        8,
        6,
        NULL,
        'EMP-007',
        5,
        'Control Center',
        'full_time',
        1
    ),
    (
        8,
        1,
        13,
        5,
        NULL,
        'EMP-008',
        2,
        'Office 3C - 3rd Floor',
        'full_time',
        1
    ),
    (
        9,
        1,
        14,
        6,
        NULL,
        'EMP-009',
        2,
        'IT Help Desk',
        'full_time',
        1
    );

-- =====================================================================================
-- 12. SEED MEETING ROOMS
-- =====================================================================================
INSERT INTO
    meeting_rooms (
        id,
        facility_id,
        name,
        capacity,
        location,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        'Board Room A',
        20,
        'Floor 5 - East Wing',
        TRUE,
        1
    ),
    (
        2,
        1,
        'Conference Room B',
        12,
        'Floor 3 - Central',
        TRUE,
        1
    ),
    (
        3,
        1,
        'Meeting Room C',
        8,
        'Floor 2 - West Wing',
        TRUE,
        1
    ),
    (
        4,
        1,
        'Innovation Lab',
        15,
        'Floor 4 - North',
        TRUE,
        1
    ),
    (
        5,
        1,
        'Executive Suite',
        6,
        'Floor 5 - Private',
        TRUE,
        1
    );

-- =====================================================================================
-- 13. SEED WORKFLOWS AND STEPS
-- =====================================================================================
INSERT INTO
    approval_workflows (
        id,
        department_id,
        name,
        levels
    )
VALUES (
        1,
        2,
        'Sales Meeting Approval',
        2
    ),
    (
        2,
        3,
        'Finance Meeting Approval',
        1
    ),
    (
        3,
        4,
        'Operations Approval',
        1
    );

INSERT INTO
    approval_steps (
        workflow_id,
        level,
        approver_role_id,
        approver_role,
        approver_id
    )
VALUES (1, 1, 2, 'staff', 4), -- Level 1 Sales goes to Michael Chen
    (1, 2, 6, 'manager', 3), -- Level 2 Sales goes to Sarah Johnson
    (2, 1, 6, 'manager', 5), -- Level 1 Finance goes to Emily Davis
    (3, 1, 2, 'staff', 6);
-- Level 1 Operations goes to James Wilson

-- =====================================================================================
-- 14. SEED VISITOR TYPES & COMPANIES (MODULE 3)
-- =====================================================================================

INSERT INTO
    visitor_types (id, type_name, description)
VALUES (
        1,
        'Guest',
        'General personal guest or customer'
    ),
    (
        2,
        'Vendor',
        'External service provider or supplier'
    ),
    (
        3,
        'Contractor',
        'Temporary contracted staff or worker'
    ),
    (
        4,
        'Consultant',
        'External expert or advisor'
    ),
    (
        5,
        'Government Official',
        'Regulatory or government representative'
    ),
    (
        6,
        'VIP',
        'High profile corporate visitor'
    ),
    (
        7,
        'Delivery Person',
        'Courier or delivery driver'
    ),
    (
        8,
        'Interview Candidate',
        'Potential employee interviewee'
    ),
    (
        9,
        'Student',
        'Academic visitor or intern student'
    ),
    (
        10,
        'Auditor',
        'Financial or system auditor'
    ),
    (
        11,
        'Maintenance Staff',
        'Technical or maintenance personnel'
    );

INSERT INTO
    visitor_companies (
        id,
        company_name,
        contact_email,
        contact_phone
    )
VALUES (
        1,
        'Acme Corp',
        'info@acme.com',
        '+1-555-9000'
    ),
    (
        2,
        'TechStart Inc',
        'hello@techstart.io',
        '+1-555-9001'
    ),
    (
        3,
        'Capital Partners',
        'deals@invest.com',
        '+1-555-9002'
    ),
    (
        4,
        'Google',
        'vms-visitors@google.com',
        '+1-555-0199'
    ),
    (
        5,
        'Microsoft',
        'visitors@microsoft.com',
        '+1-555-0200'
    ),
    (
        6,
        'UNICEF',
        'visitorhq@unicef.org',
        '+1-555-0300'
    ),
    (
        7,
        'World Bank',
        'guestpass@worldbank.org',
        '+1-555-0400'
    );

-- =====================================================================================
-- 14.2 SEED VISITORS
-- =====================================================================================

INSERT INTO
    visitors (
        id,
        organization_id,
        user_id,
        visitor_type_id,
        visitor_company_id,
        first_name,
        last_name,
        full_name,
        email,
        phone,
        company,
        category,
        status,
        is_blacklisted,
        created_by
    )
VALUES (
        1,
        1,
        10,
        2,
        1,
        'John',
        'Smith',
        'John Smith',
        'john.smith@email.com',
        '+1-555-1001',
        'Acme Corp',
        'vendor',
        'ACTIVE',
        FALSE,
        1
    ),
    (
        2,
        1,
        11,
        1,
        2,
        'Maria',
        'Garcia',
        'Maria Garcia',
        'maria.g@techstart.io',
        '+1-555-1002',
        'TechStart Inc',
        'customer',
        'ACTIVE',
        FALSE,
        1
    ),
    (
        3,
        1,
        12,
        4,
        3,
        'David',
        'Lee',
        'David Lee',
        'david.lee@invest.com',
        '+1-555-1003',
        'Capital Partners',
        'investor',
        'BLOCKED',
        TRUE,
        1
    );

-- =====================================================================================
-- 14.3 SEED VISITOR DOCUMENTS & METADATA
-- =====================================================================================

INSERT INTO
    visitor_documents (
        id,
        visitor_id,
        document_type,
        document_number,
        document_url,
        verification_status
    )
VALUES (
        1,
        1,
        'Passport',
        'P12345678',
        'uploads/docs/john_passport.png',
        'VERIFIED'
    ),
    (
        2,
        2,
        'Drivers License',
        'DL987654',
        'uploads/docs/maria_license.png',
        'VERIFIED'
    ),
    (
        3,
        3,
        'National ID',
        'NID456789',
        'uploads/docs/david_id.png',
        'REJECTED'
    );

INSERT INTO
    visitor_photos (
        id,
        visitor_id,
        photo_path,
        is_active_photo,
        captured_by
    )
VALUES (
        1,
        1,
        'uploads/photos/john_smith.png',
        TRUE,
        1
    ),
    (
        2,
        2,
        'uploads/photos/maria_garcia.png',
        TRUE,
        1
    ),
    (
        3,
        3,
        'uploads/photos/david_lee.png',
        TRUE,
        1
    );

INSERT INTO
    visitor_addresses (
        id,
        visitor_id,
        address_type,
        address_line1,
        city,
        country
    )
VALUES (
        1,
        1,
        'HOME',
        '123 Main St',
        'New York',
        'USA'
    ),
    (
        2,
        2,
        'OFFICE',
        '456 Tech Way',
        'San Francisco',
        'USA'
    );

INSERT INTO
    visitor_emergency_contacts (
        id,
        visitor_id,
        contact_name,
        relationship,
        phone
    )
VALUES (
        1,
        1,
        'Jane Smith',
        'Spouse',
        '+1-555-2001'
    ),
    (
        2,
        2,
        'Carlos Garcia',
        'Brother',
        '+1-555-2002'
    );

INSERT INTO
    visitor_identity_verification (
        id,
        visitor_id,
        visitor_document_id,
        verification_method,
        verification_result,
        confidence_score,
        verified_by
    )
VALUES (
        1,
        1,
        1,
        'PASSPORT_SCANNER',
        'PASSED',
        98.50,
        1
    ),
    (
        2,
        2,
        2,
        'NATIONAL_ID_SCANNER',
        'PASSED',
        95.00,
        1
    ),
    (
        3,
        3,
        3,
        'MANUAL',
        'FAILED',
        45.00,
        1
    );

INSERT INTO
    visitor_biometrics (
        id,
        visitor_id,
        biometric_type,
        template_data_encrypted,
        algorithm_version
    )
VALUES (
        1,
        1,
        'FACE_TEMPLATE',
        'ENCRYPTED_FACE_DATA_XYZ_SMITH_1',
        'v2.1'
    ),
    (
        2,
        2,
        'FACE_TEMPLATE',
        'ENCRYPTED_FACE_DATA_XYZ_GARCIA_2',
        'v2.1'
    );

INSERT INTO
    visitor_blacklist (
        id,
        visitor_id,
        reason,
        blocked_by
    )
VALUES (
        1,
        3,
        'Security incident reported in lobby',
        1
    );

INSERT INTO
    visitor_watchlist (
        id,
        visitor_id,
        watchlist_category,
        reason,
        added_by
    )
VALUES (
        1,
        2,
        'VIP',
        'Important corporate partner guest',
        1
    );

INSERT INTO
    visitor_preferences (
        id,
        visitor_id,
        parking_required,
        wheelchair_assistance,
        notification_preference
    )
VALUES (1, 1, TRUE, FALSE, 'EMAIL'),
    (2, 2, FALSE, FALSE, 'SMS');

INSERT INTO
    visitor_tags (id, tag_name, description)
VALUES (
        1,
        'VIP',
        'Very Important Person'
    ),
    (
        2,
        'Frequent Visitor',
        'Regular visitor profile'
    ),
    (
        3,
        'Supplier',
        'Inventory or goods supplier'
    );

INSERT INTO
    visitor_tag_mapping (
        visitor_id,
        tag_id,
        assigned_by
    )
VALUES (2, 1, 1),
    (1, 2, 1);

INSERT INTO
    visitor_notes (
        id,
        visitor_id,
        note,
        visibility,
        author_id
    )
VALUES (
        1,
        1,
        'Will require parking pass validation during lobby check-out.',
        'PUBLIC',
        1
    ),
    (
        2,
        3,
        'Access denied due to invalid passport document verification.',
        'SECURITY_ONLY',
        1
    );

INSERT INTO
    visitor_status_history (
        id,
        visitor_id,
        status,
        changed_by,
        change_reason
    )
VALUES (
        1,
        1,
        'REGISTERED',
        1,
        'Initial visitor registration'
    ),
    (
        2,
        1,
        'APPROVED',
        1,
        'Manager approval level 2 complete'
    ),
    (
        3,
        3,
        'BLACKLISTED',
        1,
        'Failed document check and manual verification'
    );

INSERT INTO
    visitor_activity_log (
        id,
        visitor_id,
        user_id,
        action,
        description
    )
VALUES (
        1,
        1,
        1,
        'REGISTER',
        'Visitor John Smith profile registered'
    ),
    (
        2,
        3,
        1,
        'BLACKLIST',
        'Visitor David Lee added to system blacklist'
    );

INSERT INTO
    visitor_custom_fields (
        id,
        field_name,
        field_type,
        is_required
    )
VALUES (
        1,
        'Vehicle Plate',
        'TEXT',
        FALSE
    ),
    (
        2,
        'Laptop Serial',
        'TEXT',
        FALSE
    );

INSERT INTO
    visitor_custom_values (
        id,
        visitor_id,
        custom_field_id,
        field_value
    )
VALUES (1, 1, 1, 'NY-12345'),
    (2, 1, 2, 'LT-98765-ABC');

INSERT INTO
    visitor_relationships (
        id,
        visitor_id,
        related_visitor_id,
        relationship_type
    )
VALUES (1, 1, 2, 'COLLEAGUE');

-- =====================================================================================
-- 15. SEED SYSTEM SETTINGS
-- =====================================================================================
INSERT INTO
    system_settings (
        setting_key,
        setting_value,
        setting_group,
        description,
        updated_by
    )
VALUES (
        'company_name',
        'Enterprise Corporate Head Office',
        'general',
        'Corporate display name',
        1
    ),
    (
        'office_hours_start',
        '08:00:00',
        'general',
        'Operational business doors open time',
        1
    ),
    (
        'office_hours_end',
        '18:00:00',
        'general',
        'Operational business doors close time',
        1
    ),
    (
        'working_days',
        'monday,tuesday,wednesday,thursday,friday',
        'general',
        'Valid operational days of the week',
        1
    ),
    (
        'password_expiry_days',
        '90',
        'security',
        'Password rotation enforcement threshold',
        1
    ),
    (
        'account_lockout_attempts',
        '5',
        'security',
        'Failed attempts limit before lock',
        1
    ),
    (
        'lockout_duration_minutes',
        '15',
        'security',
        'Length of account lockout penalty',
        1
    ),
    (
        'session_timeout_seconds',
        '3600',
        'security',
        'Active user token session validation lifetime',
        1
    ),
    (
        'pass_expiration_padding_minutes',
        '30',
        'qr',
        'Valid grace time after meeting schedule completes',
        1
    ),
    (
        'require_facial_similarity_threshold',
        '0.85',
        'security',
        'Required facial score during scanning',
        1
    ),
    (
        'sms_notification_provider',
        'twilio',
        'sms',
        'Provider configuration selector',
        1
    );

-- =====================================================================================
-- 16. SEED AUTHENTICATION SETTINGS
-- =====================================================================================
INSERT INTO
    authentication_settings (
        setting_key,
        setting_value,
        data_type,
        description,
        is_system,
        created_by
    )
VALUES (
        'MAX_LOGIN_ATTEMPTS',
        '5',
        'INTEGER',
        'Maximum failed login attempts before account lock',
        TRUE,
        1
    ),
    (
        'ACCOUNT_LOCK_DURATION_MINUTES',
        '30',
        'INTEGER',
        'Account lock duration after failed attempts',
        TRUE,
        1
    ),
    (
        'PASSWORD_MIN_LENGTH',
        '8',
        'INTEGER',
        'Minimum password length requirement',
        TRUE,
        1
    ),
    (
        'SESSION_TIMEOUT_MINUTES',
        '60',
        'INTEGER',
        'User session expiration time',
        TRUE,
        1
    ),
    (
        'ENABLE_2FA',
        'false',
        'BOOLEAN',
        'Enable two-factor authentication globally',
        TRUE,
        1
    );

-- =====================================================================================
-- 17. SEED NOTIFICATION TEMPLATES
-- =====================================================================================
INSERT INTO
    notification_templates (
        id,
        name,
        channel,
        subject_template,
        body_template
    )
VALUES (
        1,
        'Visitor Appointment Requested',
        'in_app',
        'New Appointment Request - Level {{level}}',
        'Visitor {{visitor_name}} from {{company}} has requested a meeting with you on {{scheduled_start}}. Please review the approval checklist.'
    ),
    (
        2,
        'Visitor Arrived Notice',
        'in_app',
        'Visitor Has Checked In',
        'Your visitor {{visitor_name}} has completed lobby scanning and badge issuance (Badge No: {{badge_number}}).'
    ),
    (
        3,
        'Appointment Decision Dispatch',
        'email',
        'Meeting Request Update: {{status}}',
        'Dear {{visitor_name}}, your appointment request reference {{reference_code}} for meeting {{host_name}} has been {{status}}. Instructions: {{special_instructions}}'
    ),
    (
        4,
        'Late Departure Warning',
        'push',
        'Lobby Security Alert: Overstay',
        'Visitor {{visitor_name}} under pass code {{pass_code}} has exceeded the checkout threshold. Contact host {{host_name}} immediately.'
    );

-- =====================================================================================
-- 18. SEED SESSIONS, PASSWORDS HISTORY AND TRUSTED DEVICES
-- =====================================================================================
INSERT INTO
    user_sessions (
        user_id,
        session_token,
        refresh_token,
        ip_address,
        user_agent,
        expires_at,
        is_active,
        device_type,
        location,
        created_by
    )
VALUES (
        1,
        'sess_admin_abc123xyz_token',
        'refresh_admin_xyz789token',
        '192.168.1.10',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        DATE_ADD(NOW(), INTERVAL 1 DAY),
        TRUE,
        'DESKTOP',
        'Office Network',
        1
    ),
    (
        2,
        'sess_reception_def456xyz_token',
        'refresh_reception_xyz111token',
        '192.168.1.11',
        'Mozilla/5.0 (Android Mobile)',
        DATE_ADD(NOW(), INTERVAL 1 DAY),
        TRUE,
        'MOBILE',
        'Reception Area',
        1
    );

INSERT INTO
    login_history (
        user_id,
        login_status,
        failure_reason,
        ip_address,
        user_agent,
        device_type,
        location,
        session_token,
        created_by
    )
VALUES (
        1,
        'SUCCESS',
        NULL,
        '192.168.1.10',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'DESKTOP',
        'Office Network',
        'sess_admin_abc123xyz_token',
        1
    ),
    (
        2,
        'FAILED',
        'Invalid password',
        '192.168.1.11',
        'Mozilla/5.0 (Android Mobile)',
        'MOBILE',
        'Reception Area',
        NULL,
        1
    );

INSERT INTO
    ip_blocklist (
        ip_address,
        user_id,
        reason,
        failed_attempts,
        block_type,
        is_blocked,
        unblock_at,
        country,
        device_info,
        status,
        created_by
    )
VALUES (
        '192.168.1.200',
        NULL,
        'Multiple failed login attempts detected',
        6,
        'AUTO',
        TRUE,
        DATE_ADD(NOW(), INTERVAL 30 MINUTE),
        'Unknown',
        'Windows PC',
        'ACTIVE',
        1
    ),
    (
        '192.168.1.201',
        2,
        'Suspicious login behavior',
        8,
        'MANUAL',
        TRUE,
        DATE_ADD(NOW(), INTERVAL 1 HOUR),
        'Unknown',
        'Android Device',
        'ACTIVE',
        1
    );

INSERT INTO
    password_resets (
        user_id,
        reset_token,
        reset_code,
        expires_at,
        request_ip,
        user_agent,
        status,
        created_by
    )
VALUES (
        1,
        'reset_token_admin_123456',
        '789101',
        DATE_ADD(NOW(), INTERVAL 15 MINUTE),
        '192.168.1.10',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'PENDING',
        1
    ),
    (
        2,
        'reset_token_reception_654321',
        '112233',
        DATE_ADD(NOW(), INTERVAL 15 MINUTE),
        '192.168.1.11',
        'Mozilla/5.0 (Android Mobile)',
        'PENDING',
        1
    );

INSERT INTO
    password_history (
        user_id,
        password_hash,
        change_reason,
        created_by
    )
VALUES (
        1,
        '$2b$12$old_admin_password_hash_001',
        'Initial password setup',
        1
    ),
    (
        2,
        '$2b$12$old_reception_password_hash_002',
        'Initial password setup',
        1
    );

INSERT INTO
    refresh_tokens (
        user_id,
        token,
        expires_at,
        ip_address,
        user_agent,
        device_type,
        device_fingerprint,
        created_by
    )
VALUES (
        1,
        'refresh_token_admin_abc123xyz',
        DATE_ADD(NOW(), INTERVAL 7 DAY),
        '192.168.1.10',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'DESKTOP',
        'fp_admin_device_001',
        1
    ),
    (
        2,
        'refresh_token_reception_def456xyz',
        DATE_ADD(NOW(), INTERVAL 7 DAY),
        '192.168.1.11',
        'Mozilla/5.0 (Android Mobile)',
        'MOBILE',
        'fp_reception_device_002',
        1
    );

INSERT INTO
    audit_logs (
        user_id,
        action,
        module,
        entity,
        record_id,
        old_values,
        new_values,
        ip_address,
        user_agent,
        http_method,
        endpoint,
        status,
        severity
    )
VALUES (
        1,
        'LOGIN',
        'AUTH',
        'users',
        1,
        NULL,
        JSON_OBJECT('username', 'admin'),
        '192.168.1.10',
        'Mozilla/5.0 (Windows NT 10.0)',
        'POST',
        '/api/login',
        'SUCCESS',
        'LOW'
    ),
    (
        2,
        'UPDATE_ROLE',
        'RBAC',
        'user_roles',
        2,
        JSON_OBJECT('role', 'RECEPTIONIST'),
        JSON_OBJECT('role', 'EMPLOYEE'),
        '192.168.1.11',
        'Mozilla/5.0 (Android)',
        'PUT',
        '/api/users/roles',
        'SUCCESS',
        'MEDIUM'
    );

INSERT INTO
    login_anomalies (
        user_id,
        ip_address,
        device_fingerprint,
        anomaly_type,
        risk_score,
        severity,
        description,
        country,
        location,
        device_type,
        status,
        created_by
    )
VALUES (
        1,
        '192.168.1.200',
        'fp_unknown_device_999',
        'SUSPICIOUS_IP',
        85,
        'HIGH',
        'Login attempt from flagged IP address with unusual pattern',
        'Unknown',
        'External Network',
        'DESKTOP',
        'ACTIVE',
        1
    ),
    (
        2,
        '192.168.1.201',
        'fp_repeated_failed_login',
        'MULTIPLE_FAILED_LOGINS',
        70,
        'MEDIUM',
        'Multiple failed login attempts detected in short time window',
        'Unknown',
        'Reception Area',
        'MOBILE',
        'ACTIVE',
        1
    );

INSERT INTO
    user_otp (
        user_id,
        otp_code,
        otp_type,
        delivery_method,
        destination,
        expires_at,
        ip_address,
        user_agent,
        status,
        created_by
    )
VALUES (
        1,
        '123456',
        'LOGIN',
        'EMAIL',
        'admin@visitor.com',
        DATE_ADD(NOW(), INTERVAL 5 MINUTE),
        '192.168.1.10',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'ACTIVE',
        1
    ),
    (
        2,
        '654321',
        'LOGIN',
        'SMS',
        '+251911111111',
        DATE_ADD(NOW(), INTERVAL 5 MINUTE),
        '192.168.1.11',
        'Mozilla/5.0 (Android Mobile)',
        'ACTIVE',
        1
    );

INSERT INTO
    trusted_devices (
        user_id,
        device_fingerprint,
        device_name,
        device_type,
        os,
        browser,
        ip_address,
        location,
        country,
        trust_level,
        is_trusted,
        trust_method,
        status,
        created_by
    )
VALUES (
        1,
        'fp_admin_device_001',
        'Admin Laptop',
        'DESKTOP',
        'Windows 11',
        'Chrome',
        '192.168.1.10',
        'Office Network',
        'Ethiopia',
        100,
        TRUE,
        'ADMIN_APPROVAL',
        'ACTIVE',
        1
    ),
    (
        2,
        'fp_reception_device_002',
        'Reception Android',
        'MOBILE',
        'Android 14',
        'Chrome Mobile',
        '192.168.1.11',
        'Reception Desk',
        'Ethiopia',
        80,
        TRUE,
        'OTP',
        'ACTIVE',
        1
    );

-- =====================================================================================
-- 19. SEED ENTERPRISE SPECIFIC ENTITIES (NDA/AGREEMENT, SECURITY QUESTIONS)
-- =====================================================================================
INSERT INTO
    agreements (
        id,
        title,
        content,
        version,
        is_required,
        status,
        created_by
    )
VALUES (
        1,
        'Non-Disclosure Agreement (NDA)',
        'By signing this document, the visitor agrees to hold all proprietary and confidential information in strict confidence and to not disclose it to any third party.',
        '1.0',
        TRUE,
        'ACTIVE',
        1
    );

INSERT INTO
    security_questions (id, question_text)
VALUES (
        1,
        'What was the name of your first pet?'
    ),
    (
        2,
        'In what city were you born?'
    ),
    (
        3,
        'What was your high school mascot?'
    ),
    (
        4,
        'What is the name of your favorite book?'
    );

-- =====================================================================================
-- 20. SEED APPOINTMENT & VISIT SCHEDULING MANAGEMENT (MODULE 4)
-- =====================================================================================

-- Table 1: appointment_types
INSERT INTO
    appointment_types (
        id,
        code,
        name,
        description,
        is_active,
        created_by
    )
VALUES (
        1,
        'BIZ_MEET',
        'Business Meeting',
        'Standard corporate or client alignment meeting',
        TRUE,
        1
    ),
    (
        2,
        'INTERVIEW',
        'Interview',
        'Candidate job interview session',
        TRUE,
        1
    ),
    (
        3,
        'VENDOR',
        'Vendor Visit',
        'External supply chain or system vendor review',
        TRUE,
        1
    ),
    (
        4,
        'DELIVERY',
        'Delivery',
        'External product or document courier services',
        TRUE,
        1
    ),
    (
        5,
        'MAINTENANCE',
        'Maintenance',
        'Physical facility site restoration or repair operations',
        TRUE,
        1
    ),
    (
        6,
        'GOVT_MEET',
        'Government Visit',
        'Regulatory audits, checks or civil coordination reviews',
        TRUE,
        1
    ),
    (
        7,
        'AUDIT',
        'Audit',
        'System, compliance, and balance sheet auditing audits',
        TRUE,
        1
    ),
    (
        8,
        'TRAINING',
        'Training',
        'External workshop or corporate educational training class',
        TRUE,
        1
    ),
    (
        9,
        'VIP_MEET',
        'VIP Meeting',
        'High level stakeholder corporate alignment',
        TRUE,
        1
    ),
    (
        10,
        'CONSULTING',
        'Consultation',
        'External advisory advice and audit alignment reviews',
        TRUE,
        1
    ),
    (
        11,
        'MEDICAL',
        'Medical Visit',
        'On-site medical checkup or employee service support',
        TRUE,
        1
    ),
    (
        12,
        'CONTRACTOR',
        'Contractor Visit',
        'Temporary gig development or system integration operations',
        TRUE,
        1
    );

-- Table 2: visit_purposes
INSERT INTO
    visit_purposes (
        id,
        code,
        name,
        description,
        is_active,
        created_by
    )
VALUES (
        1,
        'INTVW',
        'Interview',
        'Candidate employment testing',
        TRUE,
        1
    ),
    (
        2,
        'SALES',
        'Sales Meeting',
        'Client product presentation and alignment',
        TRUE,
        1
    ),
    (
        3,
        'MAINT',
        'Maintenance',
        'Onsite hardware or elevator service checks',
        TRUE,
        1
    ),
    (
        4,
        'TRAIN',
        'Training',
        'External education alignment classes',
        TRUE,
        1
    ),
    (
        5,
        'PROJ_DISC',
        'Project Discussion',
        'Milestone planning and system design reviews',
        TRUE,
        1
    ),
    (
        6,
        'DELV',
        'Delivery',
        'Heavy equipment or documents courier checks',
        TRUE,
        1
    ),
    (
        7,
        'CONF',
        'Conference',
        'Enterprise corporate summit attendance',
        TRUE,
        1
    ),
    (
        8,
        'AUDT',
        'Audit',
        'Financial accounts reconciliation verification',
        TRUE,
        1
    ),
    (
        9,
        'GOVT',
        'Government Meeting',
        'Taxation, trade or safety inspections review',
        TRUE,
        1
    ),
    (
        10,
        'SUPPORT',
        'Support Visit',
        'Third-party system debugging onsite support',
        TRUE,
        1
    );

-- Update approval_workflows with Module 4 specific metadata
UPDATE approval_workflows
SET
    description = 'Mandatory 2 levels validation for Executive Office space',
    is_active = TRUE,
    escalation_timeout_minutes = 30,
    auto_approval_enabled = FALSE,
    auto_rejection_enabled = FALSE,
    created_by = 1
WHERE
    id = 1;

UPDATE approval_workflows
SET
    description = 'Single level fast verification validation',
    is_active = TRUE,
    escalation_timeout_minutes = 60,
    auto_approval_enabled = TRUE,
    auto_rejection_enabled = FALSE,
    created_by = 1
WHERE
    id = 2;

UPDATE approval_workflows
SET
    description = 'High safety level workflow requiring managers approvals',
    is_active = TRUE,
    escalation_timeout_minutes = 45,
    auto_approval_enabled = FALSE,
    auto_rejection_enabled = TRUE,
    created_by = 1
WHERE
    id = 3;

-- Update meeting_rooms with Module 4 specific metadata
UPDATE meeting_rooms
SET
    room_number = 'RM-501',
    room_name = 'Board Room A',
    building = 'HQ Tower A',
    floor = 'Floor 5',
    has_projector = TRUE,
    has_tv = TRUE,
    has_video_conference = TRUE,
    is_accessible = TRUE,
    status = 'ACTIVE'
WHERE
    id = 1;

UPDATE meeting_rooms
SET
    room_number = 'RM-302',
    room_name = 'Conference Room B',
    building = 'HQ Tower A',
    floor = 'Floor 3',
    has_projector = TRUE,
    has_tv = TRUE,
    has_video_conference = FALSE,
    is_accessible = TRUE,
    status = 'ACTIVE'
WHERE
    id = 2;

UPDATE meeting_rooms
SET
    room_number = 'RM-204',
    room_name = 'Meeting Room C',
    building = 'HQ Tower A',
    floor = 'Floor 2',
    has_projector = FALSE,
    has_tv = TRUE,
    has_video_conference = FALSE,
    is_accessible = TRUE,
    status = 'ACTIVE'
WHERE
    id = 3;

UPDATE meeting_rooms
SET
    room_number = 'RM-401',
    room_name = 'Innovation Lab',
    building = 'HQ Tower B',
    floor = 'Floor 4',
    has_projector = TRUE,
    has_tv = FALSE,
    has_video_conference = TRUE,
    is_accessible = TRUE,
    status = 'ACTIVE'
WHERE
    id = 4;

UPDATE meeting_rooms
SET
    room_number = 'RM-505',
    room_name = 'Executive Suite',
    building = 'HQ Tower A',
    floor = 'Floor 5',
    has_projector = FALSE,
    has_tv = TRUE,
    has_video_conference = TRUE,
    is_accessible = FALSE,
    status = 'ACTIVE'
WHERE
    id = 5;

-- Table 5: appointments
INSERT INTO
    appointments (
        id,
        appointment_number,
        organization_id,
        visitor_id,
        host_id,
        department_id,
        appointment_type_id,
        visit_purpose_id,
        room_id,
        scheduled_start,
        scheduled_end,
        expected_duration_minutes,
        priority,
        approval_status,
        appointment_status,
        security_level,
        visitor_count,
        remarks,
        is_cancelled,
        is_completed,
        created_by
    )
VALUES (
        1,
        'APT-2026-0001',
        1,
        1,
        3,
        2,
        1,
        2,
        2,
        '2026-07-06 10:00:00',
        '2026-07-06 11:30:00',
        90,
        'MEDIUM',
        'APPROVED',
        'APPROVED',
        'NORMAL',
        2,
        'Ensure parking space validation is pre-cleared',
        FALSE,
        FALSE,
        1
    ),
    (
        2,
        'APT-2026-0002',
        1,
        2,
        4,
        2,
        2,
        1,
        3,
        '2026-07-06 14:00:00',
        '2026-07-06 15:00:00',
        60,
        'LOW',
        'APPROVED',
        'APPROVED',
        'NORMAL',
        1,
        'Candidate for Senior Architect role',
        FALSE,
        FALSE,
        1
    ),
    (
        3,
        'APT-2026-0003',
        1,
        3,
        5,
        3,
        7,
        8,
        5,
        '2026-07-07 09:00:00',
        '2026-07-07 12:00:00',
        180,
        'HIGH',
        'PENDING',
        'REQUESTED',
        'HIGH_SECURITY',
        3,
        'Annual taxation compliance inspection audit',
        FALSE,
        FALSE,
        1
    );

-- Table 6: appointment_approvals
INSERT INTO
    appointment_approvals (
        id,
        appointment_id,
        approver_id,
        approval_level,
        decision,
        decided_at,
        comments,
        is_delegated,
        delegated_to_id,
        duration_seconds,
        created_by
    )
VALUES (
        1,
        1,
        3,
        1,
        'APPROVED',
        '2026-07-05 10:15:00',
        'Welcome to corporate office, pre-approved',
        FALSE,
        NULL,
        450,
        1
    ),
    (
        2,
        2,
        4,
        1,
        'APPROVED',
        '2026-07-05 11:00:00',
        'Interview schedule approved',
        FALSE,
        NULL,
        600,
        1
    ),
    (
        3,
        3,
        5,
        1,
        'PENDING',
        NULL,
        NULL,
        FALSE,
        NULL,
        NULL,
        1
    );

-- Table 7: appointment_status_history
INSERT INTO
    appointment_status_history (
        id,
        appointment_id,
        old_status,
        new_status,
        change_reason,
        changed_by,
        changed_at,
        created_by
    )
VALUES (
        1,
        1,
        'REQUESTED',
        'APPROVED',
        'Approvals level 1 complete',
        3,
        '2026-07-05 10:15:00',
        1
    ),
    (
        2,
        2,
        'REQUESTED',
        'APPROVED',
        'Approvals level 1 complete',
        4,
        '2026-07-05 11:00:00',
        1
    );

-- Table 8: appointment_reschedule_history
INSERT INTO
    appointment_reschedule_history (
        id,
        appointment_id,
        old_start_date,
        new_start_date,
        old_end_date,
        new_end_date,
        reason,
        changed_by,
        changed_at,
        created_by
    )
VALUES (
        1,
        1,
        '2026-07-06 09:00:00',
        '2026-07-06 10:00:00',
        '2026-07-06 10:30:00',
        '2026-07-06 11:30:00',
        'Conflict with early executive board call',
        3,
        '2026-07-05 09:30:00',
        1
    );

-- Table 10: room_bookings
INSERT INTO
    room_bookings (
        id,
        appointment_id,
        room_id,
        booking_start,
        booking_end,
        booking_status,
        created_by
    )
VALUES (
        1,
        1,
        2,
        '2026-07-06 10:00:00',
        '2026-07-06 11:30:00',
        'CONFIRMED',
        1
    ),
    (
        2,
        2,
        3,
        '2026-07-06 14:00:00',
        '2026-07-06 15:00:00',
        'CONFIRMED',
        1
    );

-- Table 12: calendar_events
INSERT INTO
    calendar_events (
        id,
        appointment_id,
        provider,
        external_event_id,
        sync_status,
        last_sync_at,
        created_by
    )
VALUES (
        1,
        1,
        'GOOGLE',
        'evt_gcal_abc123xyz789',
        'SUCCESS',
        '2026-07-05 10:16:00',
        1
    ),
    (
        2,
        2,
        'OUTLOOK',
        'evt_msout_def456xyz111',
        'SUCCESS',
        '2026-07-05 11:01:00',
        1
    );

-- Table 13: appointment_participants
INSERT INTO
    appointment_participants (
        id,
        appointment_id,
        participant_type,
        user_id,
        visitor_id,
        name,
        email,
        created_by
    )
VALUES (
        1,
        1,
        'HOST',
        3,
        NULL,
        'Sarah Johnson',
        'sarah.j@visitor.com',
        1
    ),
    (
        2,
        1,
        'VISITOR',
        NULL,
        1,
        'John Smith',
        'john.smith@email.com',
        1
    ),
    (
        3,
        2,
        'HOST',
        4,
        NULL,
        'Michael Chen',
        'michael.c@visitor.com',
        1
    ),
    (
        4,
        2,
        'VISITOR',
        NULL,
        2,
        'Maria Garcia',
        'maria.g@techstart.io',
        1
    );

-- Table 14: appointment_documents
INSERT INTO
    appointment_documents (
        id,
        appointment_id,
        document_name,
        document_type,
        file_url,
        file_size_bytes,
        upload_status,
        created_by
    )
VALUES (
        1,
        1,
        'NDA_AcmeCorp.pdf',
        'CONTRACT',
        'uploads/docs/nda_acme_corp.pdf',
        245600,
        'ACTIVE',
        1
    ),
    (
        2,
        2,
        'Maria_Garcia_CV.pdf',
        'IDENTITY_DOCUMENT',
        'uploads/docs/cv_maria_garcia.pdf',
        512000,
        'ACTIVE',
        1
    );

-- Table 15: appointment_notes
INSERT INTO
    appointment_notes (
        id,
        appointment_id,
        note_type,
        note_text,
        is_pinned,
        created_by
    )
VALUES (
        1,
        1,
        'INTERNAL',
        'Requires briefing on new procurement policies prior to main pitch',
        TRUE,
        1
    ),
    (
        2,
        2,
        'INTERNAL',
        'Ensure the candidate is given visitor pass code validation before leaving room C',
        FALSE,
        1
    );

-- Table 16: appointment_notifications
INSERT INTO
    appointment_notifications (
        id,
        appointment_id,
        channel,
        recipient,
        subject,
        message_body,
        status,
        retry_count,
        created_by
    )
VALUES (
        1,
        1,
        'EMAIL',
        'john.smith@email.com',
        'Appointment Confirmed - VMS',
        'Dear John, your appointment reference code is APT-2026-0001.',
        'DELIVERED',
        0,
        1
    ),
    (
        2,
        2,
        'EMAIL',
        'maria.g@techstart.io',
        'Interview Details - VMS',
        'Dear Maria, your interview is confirmed in Meeting Room C on Floor 2.',
        'DELIVERED',
        0,
        1
    );

-- Table 17: appointment_checklists
INSERT INTO
    appointment_checklists (
        id,
        appointment_id,
        task_name,
        is_completed,
        completed_by,
        completed_at,
        created_by
    )
VALUES (
        1,
        1,
        'Host Approved',
        TRUE,
        3,
        '2026-07-05 10:15:00',
        1
    ),
    (
        2,
        1,
        'Room Reserved',
        TRUE,
        1,
        '2026-07-05 10:16:00',
        1
    ),
    (
        3,
        2,
        'Host Approved',
        TRUE,
        4,
        '2026-07-05 11:00:00',
        1
    );

-- Table 18: parking_reservations
INSERT INTO
    parking_reservations (
        id,
        appointment_id,
        vehicle_plate,
        vehicle_type,
        parking_slot,
        expected_arrival,
        expected_departure,
        status,
        created_by
    )
VALUES (
        1,
        1,
        'NY-12345',
        'Sedan',
        'LOBBY-VIP-03',
        '2026-07-06 10:00:00',
        '2026-07-06 11:30:00',
        'RESERVED',
        1
    );

-- Table 19: escort_assignments
INSERT INTO
    escort_assignments (
        id,
        appointment_id,
        escort_user_id,
        security_officer_id,
        assigned_at,
        completed_at,
        status,
        created_by
    )
VALUES (
        1,
        1,
        3,
        NULL,
        '2026-07-06 09:55:00',
        NULL,
        'ASSIGNED',
        1
    );

-- Table 20: appointment_activity_logs
INSERT INTO
    appointment_activity_logs (
        id,
        appointment_id,
        action,
        user_id,
        action_timestamp,
        ip_address,
        device_info,
        description,
        created_by
    )
VALUES (
        1,
        1,
        'CREATE',
        1,
        '2026-07-05 09:10:00',
        '192.168.1.10',
        'Chrome/Windows 11',
        'Appointment registration created',
        1
    ),
    (
        2,
        1,
        'RESCHEDULE',
        3,
        '2026-07-05 09:30:00',
        '192.168.1.12',
        'Chrome/macOS',
        'Appointment timing rescheduled to 10:00 AM',
        1
    ),
    (
        3,
        1,
        'APPROVE',
        3,
        '2026-07-05 10:15:00',
        '192.168.1.12',
        'Chrome/macOS',
        'Appointment approved by Host',
        1
    );

-- =====================================================================================
-- 21. SEED APPROVAL WORKFLOW MANAGEMENT (MODULE 6)
-- =====================================================================================

-- Update approval_workflows and approval_steps with Module 6 configuration values
UPDATE approval_workflows
SET
    version_major = 1,
    version_minor = 0,
    is_latest = TRUE
WHERE
    id IN (1, 2, 3);

UPDATE approval_steps
SET
    step_name = 'Peer Host Review',
    sequence_number = 1,
    logic_operator = 'NONE',
    approval_type = 'USER',
    sla_minutes = 60,
    action_type = 'APPROVE'
WHERE
    workflow_id = 1
    AND level = 1;

UPDATE approval_steps
SET
    step_name = 'Department Manager Approval',
    sequence_number = 2,
    logic_operator = 'NONE',
    approval_type = 'USER',
    sla_minutes = 120,
    action_type = 'APPROVE'
WHERE
    workflow_id = 1
    AND level = 2;

UPDATE approval_steps
SET
    step_name = 'Finance Officer Verification',
    sequence_number = 1,
    logic_operator = 'NONE',
    approval_type = 'USER',
    sla_minutes = 45,
    action_type = 'APPROVE'
WHERE
    workflow_id = 2
    AND level = 1;

UPDATE approval_steps
SET
    step_name = 'Operations Lead Safety Clearance',
    sequence_number = 1,
    logic_operator = 'NONE',
    approval_type = 'USER',
    sla_minutes = 90,
    action_type = 'APPROVE'
WHERE
    workflow_id = 3
    AND level = 1;

-- Table 1: approval_conditions
INSERT INTO
    approval_conditions (
        id,
        workflow_id,
        field_name,
        operator,
        field_value,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        'priority',
        '=',
        'HIGH',
        TRUE,
        1
    ),
    (
        2,
        2,
        'expected_duration_minutes',
        '>',
        '120',
        TRUE,
        1
    ),
    (
        3,
        3,
        'visitor_count',
        '>=',
        '5',
        TRUE,
        1
    );

-- Table 2: approval_delegations
INSERT INTO
    approval_delegations (
        id,
        delegator_id,
        delegate_id,
        start_date,
        end_date,
        reason,
        is_active,
        created_by
    )
VALUES (
        1,
        3,
        4,
        '2026-07-05 00:00:00',
        '2026-07-12 23:59:59',
        'Annual summer vacation leave',
        TRUE,
        1
    ),
    (
        2,
        5,
        3,
        '2026-07-06 08:00:00',
        '2026-07-06 17:00:00',
        'Out-of-office client seminar attendance',
        TRUE,
        1
    );

-- Table 3: approval_comments
INSERT INTO
    approval_comments (
        id,
        appointment_id,
        user_id,
        comment_text,
        parent_comment_id,
        attachment_url,
        created_by
    )
VALUES (
        1,
        3,
        5,
        'Please clarify the business agenda for this high security finance audit request.',
        NULL,
        NULL,
        1
    ),
    (
        2,
        3,
        3,
        'The agenda is attached, covering Q2 balance sheet reconciliation.',
        1,
        'uploads/docs/audit_agenda_q2.pdf',
        1
    );

-- Table 4: approval_history
INSERT INTO
    approval_history (
        id,
        appointment_id,
        workflow_id,
        step_id,
        approver_id,
        action,
        comment,
        action_timestamp,
        created_by
    )
VALUES (
        1,
        1,
        1,
        1,
        4,
        'APPROVE',
        'Peer check passed, routing to department manager.',
        '2026-07-05 10:15:00',
        1
    ),
    (
        2,
        2,
        2,
        3,
        5,
        'APPROVE',
        'Standard recruitment candidate schedule pre-clearance completed.',
        '2026-07-05 11:00:00',
        1
    );

-- Table 5: approval_escalations
INSERT INTO
    approval_escalations (
        id,
        appointment_id,
        approval_id,
        step_id,
        original_approver_id,
        escalated_to_id,
        escalation_reason,
        status,
        escalated_at,
        created_by
    )
VALUES (
        1,
        3,
        3,
        3,
        5,
        1,
        'SLA timeout of 45 minutes exceeded for level 1 finance review.',
        'PENDING',
        '2026-07-05 12:45:00',
        1
    );

-- Table 6: approval_notifications
INSERT INTO
    approval_notifications (
        id,
        appointment_id,
        recipient_id,
        notification_type,
        channel,
        sent_at,
        status,
        created_by
    )
VALUES (
        1,
        3,
        5,
        'PENDING_ACTION',
        'EMAIL',
        '2026-07-05 09:00:00',
        'SENT',
        1
    ),
    (
        2,
        3,
        5,
        'REMINDER',
        'IN_APP',
        '2026-07-05 09:30:00',
        'SENT',
        1
    ),
    (
        3,
        3,
        1,
        'ESCALATION_NOTICE',
        'PUSH',
        '2026-07-05 12:45:00',
        'SENT',
        1
    );

-- Table 7: approval_audit_logs
INSERT INTO
    approval_audit_logs (
        id,
        user_id,
        action,
        ip_address,
        user_agent,
        description
    )
VALUES (
        1,
        1,
        'WORKFLOW_CONFIG_MODIFIED',
        '192.168.1.10',
        'Mozilla/5.0 (Windows NT 10.0)',
        'Enabled auto-approval flag for Sales Onsite Approvals workflow.'
    ),
    (
        2,
        1,
        'DELEGATION_ACTIVATED',
        '192.168.1.10',
        'Mozilla/5.0 (Windows NT 10.0)',
        'System administrator registered vacation delegation from Sarah Johnson to Michael Chen.'
    );

-- =====================================================================================
-- 22. SEED CALENDAR & SCHEDULING MANAGEMENT (MODULE 7)
-- =====================================================================================

-- Table 1: calendar_resources
INSERT INTO
    calendar_resources (
        id,
        resource_type,
        resource_name,
        resource_code,
        capacity,
        location,
        availability_status,
        is_active,
        created_by
    )
VALUES (
        1,
        'MEETING_ROOM',
        'Board Room A',
        'RES-RM-501',
        20,
        'HQ Tower A - Floor 5',
        'AVAILABLE',
        TRUE,
        1
    ),
    (
        2,
        'VEHICLE',
        'Company Sedan Executive',
        'RES-VH-01',
        4,
        'Basement Parking Spot B-12',
        'AVAILABLE',
        TRUE,
        1
    ),
    (
        3,
        'LAPTOP',
        'Visitor Laptop ThinkPad',
        'RES-LT-02',
        NULL,
        'IT Help Desk Cabinet C',
        'AVAILABLE',
        TRUE,
        1
    ),
    (
        4,
        'PROJECTOR',
        '4K Portable Projector',
        'RES-PJ-05',
        NULL,
        'Floor 3 Logistics Storage',
        'AVAILABLE',
        TRUE,
        1
    ),
    (
        5,
        'CONFERENCE_HALL',
        'Grand Auditorium',
        'RES-CH-01',
        150,
        'HQ Tower B - Ground Floor',
        'AVAILABLE',
        TRUE,
        1
    );

-- Table 2: resource_bookings
INSERT INTO
    resource_bookings (
        id,
        resource_id,
        appointment_id,
        event_id,
        booking_start,
        booking_end,
        booking_reason,
        approval_status,
        conflict_status,
        resource_owner_id,
        created_by
    )
VALUES (
        1,
        1,
        1,
        NULL,
        '2026-07-06 10:00:00',
        '2026-07-06 11:30:00',
        'Executive Board Alignment Pitch',
        'APPROVED',
        'NO_CONFLICT',
        3,
        1
    ),
    (
        2,
        4,
        1,
        NULL,
        '2026-07-06 10:00:00',
        '2026-07-06 11:30:00',
        'Projector reservation for Board Room A presentation',
        'APPROVED',
        'NO_CONFLICT',
        3,
        1
    ),
    (
        3,
        2,
        2,
        NULL,
        '2026-07-06 14:00:00',
        '2026-07-06 15:00:00',
        'Transporting senior candidate to airport shuttle',
        'APPROVED',
        'NO_CONFLICT',
        4,
        1
    );

-- Table 3: calendar_event_participants
INSERT INTO
    calendar_event_participants (
        id,
        event_id,
        user_id,
        visitor_id,
        role_type,
        rsvp_status,
        response_time,
        created_by
    )
VALUES (
        1,
        1,
        3,
        NULL,
        'HOST',
        'ACCEPTED',
        '2026-07-05 10:17:00',
        1
    ),
    (
        2,
        1,
        NULL,
        1,
        'VISITOR',
        'ACCEPTED',
        '2026-07-05 10:20:00',
        1
    ),
    (
        3,
        2,
        4,
        NULL,
        'HOST',
        'ACCEPTED',
        '2026-07-05 11:02:00',
        1
    ),
    (
        4,
        2,
        NULL,
        2,
        'VISITOR',
        'TENTATIVE',
        '2026-07-05 11:15:00',
        1
    );

-- Table 4: employee_working_hours
INSERT INTO
    employee_working_hours (
        id,
        employee_id,
        weekday,
        start_time,
        end_time,
        break_start,
        break_end,
        max_appointments,
        timezone,
        effective_start_date,
        effective_end_date,
        is_active,
        created_by
    )
VALUES (
        1,
        2,
        'MONDAY',
        '09:00:00',
        '18:00:00',
        '13:00:00',
        '14:00:00',
        8,
        'Africa/Addis_Ababa',
        '2026-01-01',
        NULL,
        TRUE,
        1
    ),
    (
        2,
        2,
        'TUESDAY',
        '09:00:00',
        '18:00:00',
        '13:00:00',
        '14:00:00',
        8,
        'Africa/Addis_Ababa',
        '2026-01-01',
        NULL,
        TRUE,
        1
    ),
    (
        3,
        3,
        'WEDNESDAY',
        '10:00:00',
        '18:00:00',
        '12:30:00',
        '13:30:00',
        6,
        'Africa/Addis_Ababa',
        '2026-01-01',
        NULL,
        TRUE,
        1
    ),
    (
        4,
        4,
        'THURSDAY',
        '08:30:00',
        '17:30:00',
        '12:00:00',
        '13:00:00',
        10,
        'Africa/Addis_Ababa',
        '2026-01-01',
        NULL,
        TRUE,
        1
    );

-- Table 5: employee_time_off
INSERT INTO
    employee_time_off (
        id,
        employee_id,
        time_off_type,
        start_datetime,
        end_datetime,
        reason,
        status,
        created_by
    )
VALUES (
        1,
        2,
        'VACATION',
        '2026-07-10 09:00:00',
        '2026-07-17 18:00:00',
        'Family summer vacation holiday leave',
        'APPROVED',
        1
    ),
    (
        2,
        3,
        'SICK_LEAVE',
        '2026-07-08 09:00:00',
        '2026-07-08 18:00:00',
        'Routine outpatient medical checkup appointment',
        'APPROVED',
        1
    );

-- Table 6: organization_holidays
INSERT INTO
    organization_holidays (
        id,
        name,
        holiday_date,
        holiday_type,
        department_id,
        facility_id,
        is_recurring,
        created_by
    )
VALUES (
        1,
        'New Year Holiday Day',
        '2026-01-01',
        'NATIONAL',
        NULL,
        NULL,
        TRUE,
        1
    ),
    (
        2,
        'Company Foundation Anniversary Day',
        '2026-07-09',
        'COMPANY',
        NULL,
        NULL,
        TRUE,
        1
    ),
    (
        3,
        'Executive Office Maintenance Day',
        '2026-07-11',
        'DEPARTMENT',
        1,
        NULL,
        FALSE,
        1
    );

-- Table 7: calendar_time_slots
INSERT INTO
    calendar_time_slots (
        id,
        slot_start,
        slot_end,
        slot_duration_minutes,
        availability_status,
        capacity,
        resource_id,
        employee_id,
        created_by
    )
VALUES (
        1,
        '2026-07-06 09:00:00',
        '2026-07-06 09:30:00',
        30,
        'FREE',
        1,
        NULL,
        2,
        1
    ),
    (
        2,
        '2026-07-06 09:30:00',
        '2026-07-06 10:00:00',
        30,
        'FREE',
        1,
        NULL,
        2,
        1
    ),
    (
        3,
        '2026-07-06 10:00:00',
        '2026-07-06 10:30:00',
        30,
        'BOOKED',
        1,
        NULL,
        2,
        1
    );

-- Table 8: schedule_conflicts
INSERT INTO
    schedule_conflicts (
        id,
        conflict_type,
        severity,
        resolution_status,
        description,
        first_event_id,
        second_event_id,
        resource_booking_id,
        created_by
    )
VALUES (
        1,
        'DOUBLE_BOOKING',
        'BLOCKING',
        'UNRESOLVED',
        'Overlapping meeting schedule detected for Board Room A',
        1,
        NULL,
        1,
        1
    ),
    (
        2,
        'HOLIDAY',
        'WARNING',
        'BYPASSED',
        'Meeting booked on Company Anniversary foundation day',
        2,
        NULL,
        NULL,
        1
    );

-- Table 9: recurring_schedules
INSERT INTO
    recurring_schedules (
        id,
        event_id,
        recurrence_pattern,
        recurrence_interval,
        start_date,
        end_date,
        occurrence_count,
        recurrence_rules,
        created_by
    )
VALUES (
        1,
        1,
        'WEEKLY',
        1,
        '2026-07-06',
        '2026-10-06',
        12,
        '{"freq":"weekly","byday":["MO"]}',
        1
    ),
    (
        2,
        2,
        'DAILY',
        1,
        '2026-07-06',
        '2026-07-10',
        5,
        '{"freq":"daily"}',
        1
    );

-- Table 10: calendar_reminders
INSERT INTO
    calendar_reminders (
        id,
        event_id,
        recipient_id,
        channel,
        reminder_time_minutes_before,
        status,
        created_by
    )
VALUES (
        1,
        1,
        3,
        'EMAIL',
        30,
        'QUEUED',
        1
    ),
    (
        2,
        1,
        3,
        'IN_APP',
        15,
        'QUEUED',
        1
    ),
    (3, 2, 4, 'SMS', 60, 'SENT', 1);

-- Table 11: calendar_permissions
INSERT INTO
    calendar_permissions (
        id,
        target_calendar_owner_id,
        user_id,
        role_id,
        department_id,
        permission_level,
        created_by
    )
VALUES (
        1,
        3,
        4,
        NULL,
        NULL,
        'EDITOR',
        1
    ),
    (
        2,
        3,
        NULL,
        2,
        NULL,
        'VIEWER',
        1
    ),
    (
        3,
        5,
        NULL,
        NULL,
        3,
        'SCHEDULER',
        1
    );

-- Table 12: calendar_sync_accounts
INSERT INTO
    calendar_sync_accounts (
        id,
        user_id,
        provider,
        oauth_access_token,
        oauth_refresh_token,
        sync_status,
        last_sync_at,
        created_by
    )
VALUES (
        1,
        3,
        'GOOGLE',
        'tok_acc_gcal_abc123xyz789_active_user',
        'tok_ref_gcal_def456_renew',
        'ACTIVE',
        '2026-07-05 10:16:00',
        1
    ),
    (
        2,
        4,
        'OUTLOOK',
        'tok_acc_msout_xyz789_active_user',
        'tok_ref_msout_abc111_renew',
        'ACTIVE',
        '2026-07-05 11:01:00',
        1
    );

-- Table 13: calendar_sync_logs
INSERT INTO
    calendar_sync_logs (
        id,
        sync_account_id,
        success,
        records_synced,
        error_message,
        duration_ms
    )
VALUES (1, 1, TRUE, 5, NULL, 450),
    (
        2,
        2,
        FALSE,
        0,
        'OAuth access token has expired or is invalid',
        120
    );

-- =====================================================================================
-- 23. SEED ORGANIZATION MANAGEMENT (MODULE 3)
-- =====================================================================================

-- Table 1: organizations
INSERT INTO
    organizations (
        id,
        organization_id,
        name,
        short_name,
        code,
        registration_number,
        tax_number,
        website,
        email,
        phone,
        address,
        country,
        region,
        city,
        timezone,
        currency,
        language,
        logo_url,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        'Enterprise VMS Global',
        'EVMS',
        'EVMSG',
        'REG-120938-US',
        'TAX-9988112-FED',
        'https://evmsglobal.com',
        'admin@evmsglobal.com',
        '+1-800-555-0100',
        '100 Innovation Way, Suite 500',
        'USA',
        'CA',
        'San Jose',
        'America/Los_Angeles',
        'USD',
        'en',
        'uploads/logos/evmsglobal.png',
        'ACTIVE',
        TRUE,
        1
    );

-- Table 2: organization_branches
INSERT INTO
    organization_branches (
        id,
        branch_id,
        organization_id,
        branch_name,
        branch_code,
        timezone,
        address,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        'HQ Silicon Valley Campus',
        'HQ-SV',
        'America/Los_Angeles',
        '100 Innovation Way',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        2,
        1,
        'London Development Hub',
        'BR-LDN',
        'Europe/London',
        '25 Canary Wharf Road',
        'ACTIVE',
        TRUE,
        1
    );

-- Table 3: business_units
INSERT INTO
    business_units (
        id,
        unit_id,
        organization_id,
        unit_name,
        unit_code,
        description,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        'Core Product Research & Development',
        'BU-RD',
        'Focuses on building the next generation of physical security software',
        TRUE,
        1
    ),
    (
        2,
        2,
        1,
        'Corporate Support and Administration',
        'BU-CORP',
        'General management, accounting, corporate finance and Legal',
        TRUE,
        1
    );

-- Table 4: teams
INSERT INTO
    teams (
        id,
        team_id,
        department_id,
        team_name,
        team_code,
        description,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        2,
        'Core Software Dev Team A',
        'TM-SDEV-A',
        'Builds core software services and microservices integrations',
        TRUE,
        1
    ),
    (
        2,
        2,
        2,
        'Enterprise Sales North America',
        'TM-ES-NA',
        'Coordinates corporate contracts and sales operations',
        TRUE,
        1
    ),
    (
        3,
        3,
        3,
        'Facility Security Guard Shift A',
        'TM-SEC-A',
        'Runs lobby clearance control and physical safety escorts',
        TRUE,
        1
    );

-- Table 5: job_positions
INSERT INTO
    job_positions (
        id,
        position_id,
        position_title,
        position_code,
        grade_level,
        description,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        'Senior Database Architect',
        'POS-SDBA',
        'Grade 9',
        'Oversees high-scale databases and InnoDB replication topologies',
        TRUE,
        1
    ),
    (
        2,
        2,
        'Principal Safety Officer',
        'POS-PSO',
        'Grade 7',
        'Coordinates lobby check-ins, visitor escorts and watchlist flags',
        TRUE,
        1
    ),
    (
        3,
        3,
        'Vice President of Engineering',
        'POS-VPE',
        'Grade 12',
        'Directs corporate technology stack choices and R&D pipelines',
        TRUE,
        1
    );

-- Table 5A: buildings
INSERT INTO
    buildings (
        id,
        building_id,
        branch_id,
        building_name,
        building_code,
        location,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        'HQ Tower A',
        'BLDG-HQ-A',
        'Silicon Valley Campus',
        TRUE,
        1
    ),
    (
        2,
        2,
        1,
        'HQ Tower B',
        'BLDG-HQ-B',
        'Silicon Valley Campus',
        TRUE,
        1
    );

-- Table 5B: floors
INSERT INTO
    floors (
        id,
        floor_id,
        building_id,
        floor_name,
        floor_number,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        'Floor 5 R&D',
        5,
        TRUE,
        1
    ),
    (
        2,
        2,
        1,
        'Floor 3 Reception Lobby',
        3,
        TRUE,
        1
    ),
    (
        3,
        3,
        2,
        'Floor 1 Public Lounge',
        1,
        TRUE,
        1
    );

-- Table 6: offices
INSERT INTO
    offices (
        id,
        office_id,
        office_number,
        office_name,
        office_type,
        capacity,
        floor_id,
        department_id,
        qr_code_token,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        'DESK-501-A',
        'HQ Floor 5 R&D Cubicle 1',
        'CUBICLE',
        1,
        1,
        2,
        'qr_token_desk_501_a_evms',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        2,
        'ROOM-302-B',
        'HQ Floor 3 Lobby Guard Post B',
        'LAB',
        3,
        2,
        3,
        'qr_token_guard_lobby_302_b',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        3,
        'CABIN-401',
        'VP Engineering Corner Suite',
        'CABIN',
        1,
        1,
        2,
        'qr_token_vp_suite_401',
        'ACTIVE',
        TRUE,
        1
    );

-- Table 7: work_schedules
INSERT INTO
    work_schedules (
        id,
        schedule_id,
        shift_name,
        working_days,
        start_time,
        end_time,
        break_time_minutes,
        grace_period_minutes,
        is_night_shift,
        is_flexible,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        'HQ Standard Office Hours Shift',
        'MON,TUE,WED,THU,FRI',
        '09:00:00',
        '18:00:00',
        60,
        15,
        FALSE,
        FALSE,
        TRUE,
        1
    ),
    (
        2,
        2,
        'Lobby Guards Rotation B Night Shift',
        'MON,TUE,WED,THU,FRI,SAT,SUN',
        '18:00:00',
        '06:00:00',
        60,
        30,
        TRUE,
        FALSE,
        TRUE,
        1
    );

-- Table 8: holidays
INSERT INTO
    enterprise_holidays (
        id,
        holiday_id,
        name,
        holiday_date,
        holiday_type,
        branch_id,
        is_recurring,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        'US Independence Day',
        '2026-07-04',
        'NATIONAL',
        1,
        TRUE,
        TRUE,
        1
    ),
    (
        2,
        2,
        'Company Foundation Gala Day',
        '2026-07-09',
        'COMPANY',
        NULL,
        TRUE,
        TRUE,
        1
    );

-- Table 9: organization_assets
INSERT INTO
    organization_assets (
        id,
        asset_id,
        branch_id,
        employee_id,
        asset_name,
        asset_code,
        asset_type,
        serial_number,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        1,
        'Engineering Workstation laptop',
        'AST-LT-78811',
        'LAPTOP',
        'SN-LT-771199A',
        'ASSIGNED',
        TRUE,
        1
    ),
    (
        2,
        2,
        1,
        2,
        'Lobby Visitor Badge Printer Zebra',
        'AST-DEV-991',
        'DEVICE',
        'SN-PRT-889922Z',
        'ASSIGNED',
        TRUE,
        1
    );

-- Table 10: access_zones
INSERT INTO
    access_zones (
        id,
        zone_id,
        building_id,
        zone_name,
        security_level,
        description,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        'R&D Server Closet Zone',
        5,
        'Highly restricted server area. Access logs required.',
        TRUE,
        1
    ),
    (
        2,
        2,
        1,
        'Reception Lobby Visitors Lounge',
        1,
        'Open access area for registered visitors and lobby hosts',
        TRUE,
        1
    );

-- Table 11: cost_centers
INSERT INTO
    cost_centers (
        id,
        cost_center_id,
        department_id,
        code,
        name,
        budget_limit,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        2,
        'CC-RD-PROD',
        'Core Product Development Cost Center',
        250000.00,
        TRUE,
        1
    ),
    (
        2,
        2,
        3,
        'CC-SEC-LOBBY',
        'Corporate Security Operations budget',
        50000.00,
        TRUE,
        1
    );

-- Table 12: emergency_contacts
INSERT INTO
    emergency_contacts (
        id,
        employee_id,
        contact_name,
        relationship,
        phone_number,
        alternate_phone_number,
        email,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        'Jane Johnson',
        'SPOUSE',
        '+1-555-0144',
        NULL,
        'jane@myfamily.com',
        TRUE,
        1
    ),
    (
        2,
        2,
        'Robert Chen',
        'BROTHER',
        '+1-555-0188',
        '+1-555-0199',
        'robert.chen@myfamily.com',
        TRUE,
        1
    );

-- Table 13: organization_settings
INSERT INTO
    organization_settings (
        id,
        setting_id,
        organization_id,
        setting_key,
        setting_value,
        description,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        'vms.require_ndas',
        'TRUE',
        'Global check flag that forces all visitors to sign NDAs before receiving badge approval',
        TRUE,
        1
    ),
    (
        2,
        2,
        1,
        'vms.auto_checkout_minutes',
        '480',
        'Auto checkout checkouts in lobby scanner after 8 hours',
        TRUE,
        1
    );

-- Table 14: organization_documents
INSERT INTO
    organization_documents (
        id,
        document_id,
        organization_id,
        document_title,
        document_type,
        file_url,
        version,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        'Visitor Site Entry Safety Guidelines',
        'SAFETY',
        'uploads/docs/visitor_safety_v2.pdf',
        '2.0',
        TRUE,
        1
    ),
    (
        2,
        2,
        1,
        'Mutual Non-Disclosure Agreement Form',
        'NDA',
        'uploads/docs/mnda_template.pdf',
        '1.0',
        TRUE,
        1
    );

-- Table 15: employee_hierarchy
INSERT INTO
    employee_hierarchy (
        id,
        employee_id,
        supervisor_employee_id,
        hierarchy_type,
        start_date,
        end_date,
        is_active,
        created_by
    )
VALUES (
        1,
        2,
        1,
        'SUPERVISOR',
        '2026-01-01',
        NULL,
        TRUE,
        1
    );

-- Update Legacy Infrastructure Tables with Module 3 Hierarchy Constraints
UPDATE facilities SET branch_id = 1 WHERE id IN (1, 2, 3);

UPDATE departments
SET
    business_unit_id = 1,
    parent_department_id = NULL
WHERE
    id IN (1, 2, 3);

-- Seed Employee Organizational Assignments
UPDATE employees
SET
    organization_id = 1,
    branch_id = 1,
    business_unit_id = 1,
    team_id = 1,
    position_id = 1,
    office_id = 1
WHERE
    id = 1;

UPDATE employees
SET
    organization_id = 1,
    branch_id = 1,
    business_unit_id = 1,
    team_id = 3,
    position_id = 2,
    office_id = 2
WHERE
    id = 2;

UPDATE employees
SET
    organization_id = 1,
    branch_id = 1,
    business_unit_id = 1,
    team_id = 1,
    position_id = 1,
    office_id = 3
WHERE
    id = 3;

-- =====================================================================================
-- 24. SEED RECEPTION MANAGEMENT (MODULE 8)
-- =====================================================================================

-- Table 1: reception_desks
INSERT INTO
    reception_desks (
        id,
        desk_id,
        desk_code,
        desk_name,
        building_id,
        floor_id,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        'DSK-SV-01',
        'Lobby Tower A East Counter',
        1,
        2,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        2,
        'DSK-SV-02',
        'Lobby Tower A West Counter',
        1,
        2,
        'ACTIVE',
        TRUE,
        1
    );

-- Table 2: receptionist_assignments
INSERT INTO
    receptionist_assignments (
        id,
        assignment_id,
        user_id,
        desk_id,
        shift_start,
        shift_end,
        start_date,
        end_date,
        is_current,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        2,
        1,
        '08:00:00',
        '17:00:00',
        '2026-07-01',
        NULL,
        TRUE,
        TRUE,
        1
    ),
    (
        2,
        2,
        7,
        2,
        '09:00:00',
        '18:00:00',
        '2026-07-01',
        NULL,
        TRUE,
        TRUE,
        1
    );

-- Table 3: visitor_arrivals
INSERT INTO
    visitor_arrivals (
        id,
        arrival_id,
        visitor_id,
        appointment_id,
        receptionist_user_id,
        desk_id,
        arrival_status,
        arrival_method,
        arrival_timestamp,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        1,
        2,
        1,
        'CHECKED_IN',
        'APPOINTMENT',
        '2026-07-05 10:00:00',
        TRUE,
        1
    ),
    (
        2,
        2,
        2,
        2,
        7,
        2,
        'ARRIVED',
        'APPOINTMENT',
        '2026-07-05 10:45:00',
        TRUE,
        1
    );

-- Table 4: identity_verifications
INSERT INTO
    identity_verifications (
        id,
        verification_id,
        visitor_id,
        verification_type,
        ocr_result_json,
        is_manual,
        verification_officer_user_id,
        status,
        verification_timestamp,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        'PASSPORT',
        '{"passport_number":"USA12003881","issuing_country":"USA"}',
        FALSE,
        2,
        'VERIFIED',
        '2026-07-05 10:05:00',
        TRUE,
        1
    ),
    (
        2,
        2,
        2,
        'DRIVERS_LICENSE',
        '{"license_number":"NY-112233","issuing_state":"NY"}',
        TRUE,
        7,
        'VERIFIED',
        '2026-07-05 10:48:00',
        TRUE,
        1
    );

-- Table 5: waiting_areas
INSERT INTO
    waiting_areas (
        id,
        waiting_area_id,
        name,
        capacity,
        current_occupancy,
        building_id,
        floor_id,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        'Tower A Executive Lounge',
        30,
        5,
        1,
        2,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        2,
        'Tower A Public Lobby Seating Area',
        50,
        12,
        1,
        2,
        'ACTIVE',
        TRUE,
        1
    );

-- Table 6: visitor_waiting_queue
INSERT INTO
    visitor_waiting_queue (
        id,
        queue_id,
        queue_number,
        visitor_id,
        waiting_area_id,
        status,
        priority,
        waiting_start_time,
        called_time,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        'Q-0705-001',
        1,
        1,
        'SERVED',
        'VIP',
        '2026-07-05 10:00:00',
        '2026-07-05 10:15:00',
        TRUE,
        1
    ),
    (
        2,
        2,
        'Q-0705-002',
        2,
        2,
        'WAITING',
        'STANDARD',
        '2026-07-05 10:45:00',
        NULL,
        TRUE,
        1
    );

-- Table 7: host_notifications
INSERT INTO
    host_notifications (
        id,
        notification_id,
        host_user_id,
        visitor_id,
        delivery_channel,
        delivery_status,
        notification_timestamp,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        3,
        1,
        'EMAIL',
        'DELIVERED',
        '2026-07-05 10:05:00',
        TRUE,
        1
    ),
    (
        2,
        2,
        4,
        2,
        'SMS',
        'SENT',
        '2026-07-05 10:48:00',
        TRUE,
        1
    );

-- Table 8: reception_actions
INSERT INTO
    reception_actions (
        id,
        action_id,
        action_type,
        description,
        performed_by_user_id,
        action_timestamp,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        'CHECK_IN',
        'Guest checked in and badge printed for Boardroom A',
        2,
        '2026-07-05 10:15:00',
        TRUE,
        1
    );

-- Table 9: reception_notes
INSERT INTO
    reception_notes (
        id,
        note_id,
        visitor_id,
        receptionist_user_id,
        note_text,
        is_confidential,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        2,
        'Requires access setup for elevator, security access badge configured.',
        FALSE,
        TRUE,
        1
    );

-- Table 10: reception_incidents
INSERT INTO
    reception_incidents (
        id,
        incident_id,
        visitor_id,
        incident_type,
        severity,
        description,
        resolution,
        reported_by_user_id,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        'FAKE_DOCUMENT',
        'HIGH',
        'Visitor presented expired paper passport, verified via secondary ID.',
        'Guest checked in using validated Driver License instead.',
        2,
        TRUE,
        1
    );

-- Table 11: reception_statistics
INSERT INTO
    reception_statistics (
        id,
        summary_date,
        visitor_count,
        walk_in_count,
        appointment_count,
        avg_waiting_time_seconds,
        avg_processing_time_seconds,
        rejected_visitor_count,
        is_active,
        created_by
    )
VALUES (
        1,
        '2026-07-05',
        120,
        30,
        90,
        450,
        180,
        2,
        TRUE,
        1
    );

-- =====================================================================================
-- 25. SEED CHECK-IN MANAGEMENT (MODULE 10)
-- =====================================================================================

-- Table 1: checkin_gates
INSERT INTO
    checkin_gates (
        id,
        gate_id,
        gate_code,
        gate_name,
        building_id,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        'GAT-MAIN-01',
        'Lobby Main Speed Gate A',
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        2,
        'GAT-MAIN-02',
        'Lobby Main Speed Gate B',
        1,
        'ACTIVE',
        TRUE,
        1
    );

-- Table 2: visitor_checkins
INSERT INTO
    visitor_checkins (
        id,
        checkin_id,
        visitor_id,
        appointment_id,
        visitor_pass_id,
        reception_arrival_id,
        receptionist_user_id,
        security_officer_user_id,
        organization_id,
        building_id,
        floor_id,
        gate_id,
        checkin_method,
        checkin_source,
        status,
        checkin_time,
        expected_checkout_time,
        actual_checkout_time,
        remarks,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        1,
        NULL,
        1,
        2,
        8,
        1,
        1,
        2,
        1,
        'QR_CODE',
        'SECURITY_GATE',
        'ACTIVE',
        '2026-07-05 10:05:00',
        '2026-07-05 18:00:00',
        NULL,
        'Baggage checked and verified',
        TRUE,
        1
    ),
    (
        2,
        2,
        2,
        2,
        NULL,
        2,
        7,
        8,
        1,
        1,
        2,
        2,
        'RFID',
        'SECURITY_GATE',
        'ACTIVE',
        '2026-07-05 10:50:00',
        '2026-07-05 17:00:00',
        NULL,
        'Standard business check-in',
        TRUE,
        1
    );

-- Table 3: checkin_verifications
INSERT INTO
    checkin_verifications (
        id,
        verification_id,
        checkin_id,
        verification_type,
        verifier_user_id,
        verification_time,
        result,
        remarks,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        'QR_CODE',
        8,
        '2026-07-05 10:04:00',
        'PASSED',
        'Cleared security gates scanner',
        TRUE,
        1
    ),
    (
        2,
        2,
        2,
        'PASS',
        8,
        '2026-07-05 10:49:00',
        'PASSED',
        'Credential cards matching verified',
        TRUE,
        1
    );

-- Table 4: checkin_security_screenings
INSERT INTO
    checkin_security_screenings (
        id,
        screening_id,
        checkin_id,
        screening_method,
        screening_result,
        security_officer_user_id,
        risk_level,
        prohibited_items_found,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        'METAL_DETECTOR',
        'PASSED',
        8,
        'LOW',
        NULL,
        TRUE,
        1
    ),
    (
        2,
        2,
        2,
        'BAG_INSPECTION',
        'PASSED',
        8,
        'LOW',
        NULL,
        TRUE,
        1
    );

-- Table 5: checkin_access_grants
INSERT INTO
    checkin_access_grants (
        id,
        grant_id,
        checkin_id,
        access_level_code,
        zone_id,
        building_id,
        floor_id,
        room_id,
        department_id,
        grant_time,
        expiry_time,
        granted_by_user_id,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        'ZONE-1',
        1,
        1,
        2,
        NULL,
        NULL,
        '2026-07-05 10:05:00',
        '2026-07-05 18:00:00',
        8,
        TRUE,
        1
    ),
    (
        2,
        2,
        2,
        'ZONE-1',
        1,
        1,
        2,
        NULL,
        NULL,
        '2026-07-05 10:50:00',
        '2026-07-05 17:00:00',
        8,
        TRUE,
        1
    );

-- Table 6: checkin_gate_logs
INSERT INTO
    checkin_gate_logs (
        id,
        log_id,
        gate_id,
        checkin_id,
        scan_method,
        scan_data,
        scan_result,
        gate_status,
        scanned_at,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        1,
        'QR_SCAN',
        'pass_qr_token_123',
        'GRANTED',
        'OPEN',
        '2026-07-05 10:05:00',
        TRUE,
        1
    ),
    (
        2,
        2,
        2,
        2,
        'RFID_SCAN',
        'rfid_tag_456',
        'GRANTED',
        'OPEN',
        '2026-07-05 10:50:00',
        TRUE,
        1
    );

-- Table 7: visitor_belongings
INSERT INTO
    visitor_belongings (
        id,
        belonging_id,
        checkin_id,
        item_type,
        description,
        serial_number,
        storage_locker_number,
        is_return_required,
        returned_status,
        returned_at,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        'LAPTOP',
        'MacBook Pro 16 Space Gray',
        'C02DD1234XYZ',
        'L-40',
        TRUE,
        'RETAINED',
        NULL,
        TRUE,
        1
    ),
    (
        2,
        2,
        2,
        'BAG',
        'Leather Briefcase',
        NULL,
        'L-41',
        TRUE,
        'RETAINED',
        NULL,
        TRUE,
        1
    );

-- Table 8: checkin_notifications
INSERT INTO
    checkin_notifications (
        id,
        notification_id,
        checkin_id,
        notification_type,
        delivery_channel,
        delivery_status,
        notification_timestamp,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        'HOST',
        'SMS',
        'DELIVERED',
        '2026-07-05 10:05:00',
        TRUE,
        1
    ),
    (
        2,
        2,
        2,
        'HOST',
        'EMAIL',
        'DELIVERED',
        '2026-07-05 10:50:00',
        TRUE,
        1
    );

-- Table 9: visitor_access_sessions
INSERT INTO
    visitor_access_sessions (
        id,
        session_id,
        checkin_id,
        session_start,
        session_end,
        current_location,
        current_zone_id,
        current_floor_id,
        current_building_id,
        status,
        idle_time_minutes,
        last_activity_time,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        '2026-07-05 10:05:00',
        NULL,
        'Tower A Executive Lounge',
        1,
        2,
        1,
        'ACTIVE',
        0,
        '2026-07-05 10:05:00',
        TRUE,
        1
    ),
    (
        2,
        2,
        2,
        '2026-07-05 10:50:00',
        NULL,
        'Tower A Public Lobby Seating Area',
        1,
        2,
        1,
        'ACTIVE',
        0,
        '2026-07-05 10:50:00',
        TRUE,
        1
    );

-- Table 10: checkin_documents
INSERT INTO
    checkin_documents (
        id,
        document_id,
        checkin_id,
        document_type,
        file_url,
        verification_status,
        expiry_date,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        'INVITATION_LETTER',
        'uploads/checkin/invite_boardroom.pdf',
        'VERIFIED',
        '2026-07-05',
        TRUE,
        1
    );

-- Table 11: checkin_incidents
INSERT INTO
    checkin_incidents (
        id,
        incident_id,
        checkin_id,
        incident_type,
        severity,
        description,
        action_taken,
        resolved_by_user_id,
        resolution_time,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        'POLICY_VIOLATION',
        'LOW',
        'Visitor forgot to wear safety vest upon entry.',
        'Safety vest provided by security desk.',
        8,
        '2026-07-05 10:10:00',
        TRUE,
        1
    );

-- Table 12: biometric_checkins
INSERT INTO
    biometric_checkins (
        id,
        biometric_id,
        checkin_id,
        biometric_type,
        template_data,
        confidence_score,
        verification_result,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        'FACE_RECOGNITION',
        0x11223344,
        99.20,
        'PASSED',
        TRUE,
        1
    );

-- Table 13: checkin_audit_trail
INSERT INTO
    checkin_audit_trail (
        id,
        audit_id,
        checkin_id,
        action,
        description,
        performed_by_user_id,
        timestamp,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        'VISITOR_VERIFIED',
        'Visitor identity matches registered ID scan',
        8,
        '2026-07-05 10:04:00',
        TRUE,
        1
    );

-- Table 14: denied_checkins
INSERT INTO
    denied_checkins (
        id,
        denied_id,
        visitor_id,
        appointment_id,
        reason,
        denied_by_user_id,
        recommendation,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        NULL,
        'OUTSIDE_VISITING_HOURS',
        8,
        'Redirect guest to reschedule appointment during office hours',
        TRUE,
        1
    );

-- Table 15: emergency_checkins
INSERT INTO
    emergency_checkins (
        id,
        emergency_id,
        checkin_id,
        visitor_type,
        priority,
        approval_reference,
        emergency_contact,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        NULL,
        'AMBULANCE',
        'CRITICAL',
        'EMERG-OVERRIDE-911',
        'Addis Ababa Red Cross Response',
        TRUE,
        1
    );

-- =====================================================================================
-- 16. SEED MODULE 11: CHECK-OUT MANAGEMENT
-- =====================================================================================

-- Seed Visitor Passes (referenced by checkins and pass returns)
INSERT INTO
    visitor_passes (
        id,
        organization_id,
        visitor_id,
        appointment_id,
        pass_type_id,
        pass_code,
        qr_token,
        barcode_data,
        status,
        is_printed,
        issued_by,
        expires_at
    )
VALUES (
        1,
        1,
        1,
        1,
        1,
        'PASS-2026-0001',
        'pass_qr_token_123',
        'barcode_123',
        'ACTIVE',
        TRUE,
        2,
        '2026-07-05 18:00:00'
    ),
    (
        2,
        1,
        2,
        2,
        1,
        'PASS-2026-0002',
        'pass_qr_token_456',
        'barcode_456',
        'ACTIVE',
        TRUE,
        7,
        '2026-07-05 17:00:00'
    );

-- Link visitor passes to the active checkins
UPDATE visitor_checkins SET visitor_pass_id = 1 WHERE id = 1;

UPDATE visitor_checkins SET visitor_pass_id = 2 WHERE id = 2;

-- Table 1: visitor_checkouts
INSERT INTO
    visitor_checkouts (
        id,
        checkout_id,
        checkin_id,
        visitor_id,
        appointment_id,
        host_id,
        receptionist_id,
        security_officer_id,
        checkout_time,
        checkout_method,
        checkout_status,
        expected_checkout_time,
        actual_checkout_time,
        visit_completion_status,
        total_visit_duration,
        remarks,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        1,
        1,
        3,
        2,
        8,
        '2026-07-05 17:30:00',
        'QR_CODE',
        'COMPLETED',
        '2026-07-05 18:00:00',
        '2026-07-05 17:30:00',
        'NORMAL',
        445,
        'Checked out via Lobby speed gate.',
        TRUE,
        1
    ),
    (
        2,
        2,
        2,
        2,
        2,
        4,
        7,
        8,
        '2026-07-05 16:45:00',
        'RFID',
        'COMPLETED',
        '2026-07-05 17:00:00',
        '2026-07-05 16:45:00',
        'NORMAL',
        355,
        'Visitor returned RFID badge and checked out.',
        TRUE,
        1
    ),
    (
        3,
        3,
        2,
        2,
        2,
        4,
        7,
        8,
        '2026-07-05 17:30:00',
        'MANUAL',
        'COMPLETED',
        '2026-07-05 17:00:00',
        '2026-07-05 17:30:00',
        'LATE',
        400,
        'Checked out late due to meeting extension.',
        TRUE,
        1
    );

-- Table 2: visitor_asset_returns
INSERT INTO
    visitor_asset_returns (
        id,
        asset_return_id,
        checkout_id,
        visitor_id,
        asset_id,
        asset_name,
        issued_time,
        returned_time,
        asset_condition,
        return_status,
        verified_by,
        remarks,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        1,
        101,
        'Visitor Access Card A',
        '2026-07-05 10:05:00',
        '2026-07-05 17:30:00',
        'GOOD',
        'RETURNED',
        2,
        'Card in perfect condition.',
        TRUE,
        1
    ),
    (
        2,
        2,
        2,
        2,
        102,
        'Visitor RFID Badge B',
        '2026-07-05 10:50:00',
        '2026-07-05 16:45:00',
        'GOOD',
        'RETURNED',
        7,
        'Returned on time.',
        TRUE,
        1
    ),
    (
        3,
        3,
        3,
        2,
        103,
        'Lobby Access Key 05',
        '2026-07-05 10:50:00',
        '2026-07-05 17:30:00',
        'EXCELLENT',
        'RETURNED',
        7,
        'Access key returned.',
        TRUE,
        1
    );

-- Table 3: visitor_pass_returns
INSERT INTO
    visitor_pass_returns (
        id,
        pass_return_id,
        checkout_id,
        visitor_pass_id,
        return_time,
        returned_by,
        pass_condition,
        pass_status,
        deactivation_status,
        remarks,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        1,
        '2026-07-05 17:30:00',
        2,
        'GOOD',
        'RETURNED',
        'DEACTIVATED',
        'QR code pass returned.',
        TRUE,
        1
    ),
    (
        2,
        2,
        2,
        2,
        '2026-07-05 16:45:00',
        7,
        'GOOD',
        'RETURNED',
        'DEACTIVATED',
        'RFID pass returned.',
        TRUE,
        1
    );

-- Table 4: checkout_verifications
INSERT INTO
    checkout_verifications (
        id,
        verification_id,
        checkout_id,
        verification_type,
        verification_status,
        verified_by,
        verification_time,
        verification_result,
        security_notes,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        'IDENTITY',
        'PASSED',
        2,
        '2026-07-05 17:28:00',
        'Verified visually and via photo check.',
        'Normal checkout verification.',
        TRUE,
        1
    ),
    (
        2,
        2,
        1,
        'ASSET',
        'PASSED',
        2,
        '2026-07-05 17:29:00',
        'All assets returned.',
        'No assets missing.',
        TRUE,
        1
    ),
    (
        3,
        3,
        2,
        'PASS',
        'PASSED',
        7,
        '2026-07-05 16:44:00',
        'Pass scanned and deactivated.',
        'RFID checked.',
        TRUE,
        1
    );

-- Table 5: visit_durations (Insert Ignore because trigger will automatically insert them)
INSERT IGNORE INTO
    visit_durations (
        id,
        visit_duration_id,
        checkout_id,
        checkin_id,
        checkin_time,
        checkout_time,
        total_minutes,
        total_hours,
        is_overtime,
        duration_category,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        1,
        '2026-07-05 10:05:00',
        '2026-07-05 17:30:00',
        445,
        7.42,
        FALSE,
        'STANDARD_STAY',
        TRUE,
        1
    ),
    (
        2,
        2,
        2,
        2,
        '2026-07-05 10:50:00',
        '2026-07-05 16:45:00',
        355,
        5.92,
        FALSE,
        'STANDARD_STAY',
        TRUE,
        1
    ),
    (
        3,
        3,
        3,
        2,
        '2026-07-05 10:50:00',
        '2026-07-05 17:30:00',
        400,
        6.67,
        TRUE,
        'OVERTIME',
        TRUE,
        1
    );

-- Table 6: checkout_exceptions
INSERT INTO
    checkout_exceptions (
        id,
        exception_id,
        checkout_id,
        exception_type,
        severity,
        description,
        resolution_status,
        resolved_by,
        resolved_at,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        3,
        'DAMAGED_ASSET',
        'MEDIUM',
        'RFID access key card plastic holder was cracked.',
        'RESOLVED',
        7,
        '2026-07-05 17:35:00',
        TRUE,
        1
    ),
    (
        2,
        2,
        3,
        'LOST_PASS',
        'LOW',
        'Visitor misplaced the printed pass paper.',
        'RESOLVED',
        7,
        '2026-07-05 17:32:00',
        TRUE,
        1
    );

-- Table 7: checkout_feedbacks
INSERT INTO
    checkout_feedbacks (
        id,
        feedback_id,
        checkout_id,
        rating,
        comments,
        reception_rating,
        host_rating,
        overall_rating,
        submitted_at,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        5,
        'Great visit! Very fast checkout process.',
        5,
        5,
        5,
        '2026-07-05 17:35:00',
        TRUE,
        1
    ),
    (
        2,
        2,
        2,
        4,
        'Very good system, lobby receptionist was helpful.',
        4,
        5,
        4,
        '2026-07-05 16:50:00',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 12: PREREQUISITE INFRASTRUCTURE SEEDS
-- =====================================================================================

-- Organization (parent of everything)
INSERT IGNORE INTO
    organizations (
        id,
        name,
        short_name,
        code,
        email,
        phone,
        address,
        country,
        timezone,
        status,
        is_active
    )
VALUES (
        1,
        'Hybrid-Tech Global Corporation',
        'HT-Global',
        'HTGC',
        'info@hybrid-tech.com',
        '+1-800-555-0000',
        '1000 Innovation Blvd, San Jose, CA 95134',
        'United States',
        'America/Los_Angeles',
        'ACTIVE',
        TRUE
    );

-- Branches
INSERT IGNORE INTO
    organization_branches (
        id,
        organization_id,
        branch_name,
        branch_code,
        timezone,
        address,
        status,
        is_active
    )
VALUES (
        1,
        1,
        'Main Campus HQ',
        'HQ-MAIN',
        'America/Los_Angeles',
        '1000 Innovation Blvd, San Jose, CA 95134',
        'ACTIVE',
        TRUE
    ),
    (
        2,
        1,
        'East Coast Office',
        'EC-NYC',
        'America/New_York',
        '200 Park Ave, New York, NY 10166',
        'ACTIVE',
        TRUE
    );

-- Buildings
INSERT IGNORE INTO
    buildings (
        id,
        branch_id,
        building_name,
        building_code,
        location,
        is_active
    )
VALUES (
        1,
        1,
        'Main Tower',
        'BLD-MAIN',
        '1000 Innovation Blvd - Main Campus',
        TRUE
    ),
    (
        2,
        1,
        'Research & Innovation Center',
        'BLD-RIC',
        '1010 Innovation Blvd - East Wing',
        TRUE
    ),
    (
        3,
        2,
        'East Coast Tower',
        'BLD-NYC',
        '200 Park Ave - 15th Floor',
        TRUE
    );

-- Floors
INSERT IGNORE INTO
    floors (
        id,
        building_id,
        floor_name,
        floor_number,
        is_active
    )
VALUES (
        1,
        1,
        'Ground Floor / Lobby',
        0,
        TRUE
    ),
    (
        2,
        1,
        'First Floor - General Offices',
        1,
        TRUE
    ),
    (
        3,
        1,
        'Second Floor - Finance & HR',
        2,
        TRUE
    ),
    (
        4,
        1,
        'Third Floor - Sales & Marketing',
        3,
        TRUE
    ),
    (
        5,
        1,
        'Fourth Floor - IT & Server Room',
        4,
        TRUE
    ),
    (
        6,
        1,
        'Fifth Floor - Executive Suite',
        5,
        TRUE
    ),
    (
        7,
        2,
        'Ground Floor - Lab Reception',
        0,
        TRUE
    ),
    (
        8,
        2,
        'First Floor - Research Lab',
        1,
        TRUE
    );

-- =====================================================================================
-- MODULE 12: SEED SECURITY ACCESS ZONES
-- =====================================================================================
INSERT INTO
    security_access_zones (
        id,
        zone_code,
        zone_name,
        parent_zone_id,
        building_id,
        floor_id,
        security_level,
        is_restricted,
        visitor_allowed,
        max_occupancy,
        description,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'SAZ-LOBBY',
        'Main Lobby & Reception',
        NULL,
        1,
        1,
        1,
        FALSE,
        TRUE,
        200,
        'Public reception and waiting area with visitor registration desks',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'SAZ-GOFF',
        'General Office Wing',
        NULL,
        1,
        2,
        2,
        FALSE,
        TRUE,
        150,
        'Standard office workspace area for departments',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'SAZ-FIN',
        'Finance Secure Area',
        2,
        1,
        3,
        3,
        TRUE,
        FALSE,
        40,
        'Restricted finance department with confidential data access',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'SAZ-EXEC',
        'Executive Suite',
        NULL,
        1,
        6,
        4,
        TRUE,
        FALSE,
        20,
        'C-suite executive offices - Top Secret clearance required',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'SAZ-SRVR',
        'Server Room & Data Center',
        NULL,
        1,
        5,
        5,
        TRUE,
        FALSE,
        10,
        'Critical infrastructure - biometric access only, no visitors',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        6,
        'SAZ-LAB',
        'Research Laboratory',
        NULL,
        2,
        8,
        4,
        TRUE,
        FALSE,
        30,
        'R&D lab with classified equipment and experiments',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        7,
        'SAZ-PKG',
        'Parking Structure',
        NULL,
        1,
        1,
        1,
        FALSE,
        TRUE,
        500,
        'Visitor and employee parking garage - ground level',
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 12: SEED ACCESS POINTS
-- =====================================================================================
INSERT INTO
    access_points (
        id,
        point_code,
        point_name,
        point_type,
        direction,
        reader_type,
        building_id,
        floor_id,
        zone_id,
        gps_latitude,
        gps_longitude,
        security_level,
        device_connection_status,
        is_emergency_exit,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'AP-MAIN-GATE',
        'Main Entrance Gate',
        'GATE',
        'BIDIRECTIONAL',
        'QR_SCANNER',
        1,
        1,
        1,
        37.38710000,
        -121.94430000,
        1,
        'ONLINE',
        FALSE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'AP-LOBBY-DOOR',
        'Reception Lobby Door',
        'DOOR',
        'ENTRY',
        'RFID_READER',
        1,
        1,
        1,
        37.38712000,
        -121.94428000,
        1,
        'ONLINE',
        FALSE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'AP-FIN-DOOR',
        'Finance Department Entry',
        'DOOR',
        'BIDIRECTIONAL',
        'FINGERPRINT',
        1,
        3,
        3,
        37.38715000,
        -121.94425000,
        3,
        'ONLINE',
        FALSE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'AP-SRVR-LOCK',
        'Server Room Smart Lock',
        'SMART_LOCK',
        'BIDIRECTIONAL',
        'MULTI_FACTOR',
        1,
        5,
        5,
        37.38720000,
        -121.94420000,
        5,
        'ONLINE',
        FALSE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'AP-PKG-BARRIER',
        'Parking Barrier Gate',
        'BARRIER',
        'BIDIRECTIONAL',
        'BARCODE',
        1,
        1,
        7,
        37.38700000,
        -121.94440000,
        1,
        'ONLINE',
        FALSE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        6,
        'AP-EXEC-TURN',
        'Executive Floor Turnstile',
        'TURNSTILE',
        'BIDIRECTIONAL',
        'FACE_RECOGNITION',
        1,
        6,
        4,
        37.38718000,
        -121.94422000,
        4,
        'ONLINE',
        FALSE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        7,
        'AP-EMRG-EXIT1',
        'Emergency Exit - Ground Floor East',
        'EMERGENCY_EXIT',
        'EXIT',
        'MANUAL',
        1,
        1,
        1,
        37.38708000,
        -121.94435000,
        1,
        'ONLINE',
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        8,
        'AP-ELEV-MAIN',
        'Main Elevator Access',
        'ELEVATOR',
        'BIDIRECTIONAL',
        'SMART_CARD',
        1,
        1,
        2,
        37.38711000,
        -121.94427000,
        2,
        'ONLINE',
        FALSE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        9,
        'AP-LAB-DOOR',
        'Research Lab Entry',
        'DOOR',
        'BIDIRECTIONAL',
        'FACE_RECOGNITION',
        2,
        8,
        6,
        37.38730000,
        -121.94410000,
        4,
        'ONLINE',
        FALSE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        10,
        'AP-PKG-EXIT',
        'Parking Exit Barrier',
        'BARRIER',
        'EXIT',
        'BARCODE',
        1,
        1,
        7,
        37.38698000,
        -121.94442000,
        1,
        'ONLINE',
        FALSE,
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 12: SEED SECURITY DEVICES
-- =====================================================================================
INSERT INTO
    security_devices (
        id,
        device_code,
        device_name,
        device_type,
        serial_number,
        firmware_version,
        mac_address,
        ip_address,
        building_id,
        floor_id,
        zone_id,
        access_point_id,
        installation_date,
        last_maintenance_date,
        next_maintenance_date,
        health_status,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'DEV-QR-001',
        'Main Gate QR Scanner',
        'QR_SCANNER',
        'QR-SN-20250101',
        'v3.2.1',
        'AA:BB:CC:DD:EE:01',
        '192.168.10.101',
        1,
        1,
        1,
        1,
        '2025-01-15',
        '2026-06-01',
        '2026-12-01',
        'HEALTHY',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'DEV-RFID-001',
        'Lobby RFID Reader',
        'RFID_READER',
        'RFID-SN-20250102',
        'v2.8.0',
        'AA:BB:CC:DD:EE:02',
        '192.168.10.102',
        1,
        1,
        1,
        2,
        '2025-01-15',
        '2026-06-01',
        '2026-12-01',
        'HEALTHY',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'DEV-FP-001',
        'Finance Fingerprint Scanner',
        'FINGERPRINT_SCANNER',
        'FP-SN-20250201',
        'v4.1.0',
        'AA:BB:CC:DD:EE:03',
        '192.168.10.103',
        1,
        3,
        3,
        3,
        '2025-02-01',
        '2026-05-15',
        '2026-11-15',
        'HEALTHY',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'DEV-FR-001',
        'Executive Face Recognition Unit',
        'FACE_RECOGNITION',
        'FR-SN-20250301',
        'v5.0.2',
        'AA:BB:CC:DD:EE:04',
        '192.168.10.104',
        1,
        6,
        4,
        6,
        '2025-03-01',
        '2026-06-10',
        '2026-12-10',
        'HEALTHY',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'DEV-CAM-001',
        'Lobby CCTV Camera 1',
        'CAMERA',
        'CAM-SN-20250101',
        'v2.5.3',
        'AA:BB:CC:DD:EE:05',
        '192.168.10.201',
        1,
        1,
        1,
        NULL,
        '2025-01-10',
        '2026-06-01',
        '2026-12-01',
        'HEALTHY',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        6,
        'DEV-CAM-002',
        'Parking CCTV Camera',
        'CAMERA',
        'CAM-SN-20250102',
        'v2.5.3',
        'AA:BB:CC:DD:EE:06',
        '192.168.10.202',
        1,
        1,
        7,
        NULL,
        '2025-01-10',
        '2026-06-01',
        '2026-12-01',
        'HEALTHY',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        7,
        'DEV-BG-001',
        'Parking Barrier Controller',
        'BARRIER_GATE',
        'BG-SN-20250401',
        'v1.9.0',
        'AA:BB:CC:DD:EE:07',
        '192.168.10.301',
        1,
        1,
        7,
        5,
        '2025-04-01',
        '2026-05-20',
        '2026-11-20',
        'HEALTHY',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        8,
        'DEV-DC-001',
        'Server Room Multi-Factor Controller',
        'DOOR_CONTROLLER',
        'DC-SN-20250501',
        'v6.0.1',
        'AA:BB:CC:DD:EE:08',
        '192.168.10.105',
        1,
        5,
        5,
        4,
        '2025-05-01',
        '2026-06-15',
        '2026-12-15',
        'HEALTHY',
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 12: SEED ACCESS PERMISSIONS
-- =====================================================================================
INSERT INTO
    access_permissions (
        id,
        permission_type,
        visitor_id,
        employee_id,
        role_id,
        department_id,
        zone_id,
        access_level,
        valid_from,
        valid_to,
        approval_status,
        approved_by,
        approved_at,
        is_temporary,
        is_vip,
        is_emergency,
        reason,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'ROLE',
        NULL,
        NULL,
        1,
        NULL,
        1,
        'FULL',
        '2026-01-01 00:00:00',
        NULL,
        'APPROVED',
        1,
        '2026-01-01 08:00:00',
        FALSE,
        FALSE,
        FALSE,
        'Admin role has full access to lobby and public areas',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'ROLE',
        NULL,
        NULL,
        1,
        NULL,
        5,
        'FULL',
        '2026-01-01 00:00:00',
        NULL,
        'APPROVED',
        1,
        '2026-01-01 08:00:00',
        FALSE,
        FALSE,
        FALSE,
        'Admin role has full access to server room',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'DEPARTMENT',
        NULL,
        NULL,
        NULL,
        3,
        3,
        'STANDARD',
        '2026-01-01 00:00:00',
        NULL,
        'APPROVED',
        1,
        '2026-01-01 08:00:00',
        FALSE,
        FALSE,
        FALSE,
        'Finance department standard access to finance zone',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'EMPLOYEE',
        NULL,
        7,
        NULL,
        NULL,
        1,
        'FULL',
        '2026-01-01 00:00:00',
        NULL,
        'APPROVED',
        1,
        '2026-01-01 08:00:00',
        FALSE,
        FALSE,
        FALSE,
        'Security officer Robert Garcia full lobby access',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'VISITOR',
        1,
        NULL,
        NULL,
        NULL,
        1,
        'STANDARD',
        '2026-07-05 09:00:00',
        '2026-07-05 18:00:00',
        'APPROVED',
        7,
        '2026-07-05 09:30:00',
        TRUE,
        FALSE,
        FALSE,
        'Visitor John Smith temporary lobby access for appointment',
        'ACTIVE',
        TRUE,
        7
    ),
    (
        6,
        'VISITOR',
        2,
        NULL,
        NULL,
        NULL,
        2,
        'STANDARD',
        '2026-07-05 09:00:00',
        '2026-07-05 18:00:00',
        'APPROVED',
        7,
        '2026-07-05 10:30:00',
        TRUE,
        TRUE,
        FALSE,
        'VIP visitor Maria Garcia access to general offices',
        'ACTIVE',
        TRUE,
        7
    );

-- =====================================================================================
-- MODULE 12: SEED BIOMETRIC ENROLLMENT RECORDS
-- =====================================================================================
INSERT INTO
    biometric_enrollment_records (
        id,
        subject_type,
        visitor_id,
        employee_id,
        biometric_type,
        template_hash,
        encryption_method,
        algorithm_version,
        enrollment_date,
        enrollment_device_id,
        quality_score,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'EMPLOYEE',
        NULL,
        1,
        'FINGERPRINT',
        'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'AES-256-GCM',
        'BioMatch-FP-v4.1',
        '2025-02-01 10:00:00',
        3,
        95.50,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'EMPLOYEE',
        NULL,
        7,
        'FACE',
        'sha256:d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
        'AES-256-GCM',
        'FaceID-v5.0',
        '2025-03-15 14:00:00',
        4,
        98.20,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'VISITOR',
        1,
        NULL,
        'FACE',
        'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        'AES-256-GCM',
        'FaceID-v5.0',
        '2026-07-05 10:10:00',
        4,
        87.30,
        'ACTIVE',
        TRUE,
        7
    ),
    (
        4,
        'EMPLOYEE',
        NULL,
        4,
        'FINGERPRINT',
        'sha256:3c9909afec25354d551dae21590bb26e38d53f2173b8d3dc3eee4c047e7ab1c1',
        'AES-256-GCM',
        'BioMatch-FP-v4.1',
        '2025-04-10 09:30:00',
        3,
        92.10,
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 12: SEED EMERGENCY LOCKDOWNS
-- =====================================================================================
INSERT INTO
    emergency_lockdowns (
        id,
        lockdown_code,
        lockdown_type,
        trigger_source,
        lockdown_scope,
        building_id,
        floor_id,
        zone_id,
        start_time,
        end_time,
        reason,
        initiated_by,
        released_by,
        affected_persons_count,
        evacuation_required,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'ELK-2026-001',
        'DRILL',
        'MANUAL',
        'BUILDING',
        1,
        NULL,
        NULL,
        '2026-03-15 14:00:00',
        '2026-03-15 14:45:00',
        'Quarterly emergency evacuation drill for Main Tower building',
        1,
        1,
        350,
        TRUE,
        'DRILL_COMPLETED',
        TRUE,
        1
    ),
    (
        2,
        'ELK-2026-002',
        'FIRE',
        'SENSOR',
        'FLOOR',
        1,
        5,
        NULL,
        '2026-05-20 11:30:00',
        '2026-05-20 12:15:00',
        'Smoke detected in server room HVAC system - false alarm from overheating UPS',
        8,
        1,
        15,
        TRUE,
        'RELEASED',
        TRUE,
        8
    ),
    (
        3,
        'ELK-2026-003',
        'SECURITY_BREACH',
        'PANIC_BUTTON',
        'ZONE',
        1,
        6,
        4,
        '2026-06-10 16:45:00',
        '2026-06-10 17:30:00',
        'Unauthorized individual attempted to access executive suite without credentials',
        8,
        8,
        8,
        FALSE,
        'RELEASED',
        TRUE,
        8
    );

-- =====================================================================================
-- MODULE 12: SEED SECURITY INCIDENTS DETAIL
-- =====================================================================================
INSERT INTO
    security_incidents_detail (
        id,
        incident_code,
        incident_type,
        severity,
        title,
        description,
        resolution_notes,
        visitor_id,
        employee_id,
        access_point_id,
        zone_id,
        reporter_user_id,
        assigned_officer_id,
        resolved_by_user_id,
        incident_time,
        resolved_at,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'INC-2026-0001',
        'UNAUTHORIZED_ACCESS',
        'HIGH',
        'Unauthorized Entry Attempt at Server Room',
        'Unknown individual attempted to use a cloned RFID badge to access server room. Multi-factor authentication prevented entry.',
        'Badge was confiscated and visitor was escorted off premises. RFID badge serial blacklisted.',
        NULL,
        NULL,
        4,
        5,
        8,
        8,
        8,
        '2026-04-12 22:15:00',
        '2026-04-12 23:00:00',
        'CLOSED',
        TRUE,
        8
    ),
    (
        2,
        'INC-2026-0002',
        'TAILGATING',
        'MEDIUM',
        'Tailgating Detected at Finance Entry',
        'Camera detected two persons entering through finance door on single fingerprint scan.',
        'Second person identified as new employee who forgot badge. Reminded of security protocols.',
        NULL,
        4,
        3,
        3,
        8,
        8,
        8,
        '2026-05-08 09:30:00',
        '2026-05-08 10:00:00',
        'RESOLVED',
        TRUE,
        8
    ),
    (
        3,
        'INC-2026-0003',
        'FAKE_QR',
        'CRITICAL',
        'Counterfeit QR Pass Detected at Main Gate',
        'Visitor presented a photographed QR code from another visitor pass. System detected duplicate usage and denied entry.',
        'Visitor was detained and police were called. Incident escalated to facility management.',
        3,
        NULL,
        1,
        1,
        8,
        8,
        8,
        '2026-06-22 14:00:00',
        '2026-06-22 16:30:00',
        'CLOSED',
        TRUE,
        8
    ),
    (
        4,
        'INC-2026-0004',
        'SUSPICIOUS_MOVEMENT',
        'LOW',
        'Loitering Detected Near Emergency Exit',
        'AI surveillance flagged repeated movement near emergency exit after hours.',
        'Reviewed footage - identified as cleaning crew member taking breaks. No threat.',
        NULL,
        NULL,
        7,
        1,
        8,
        8,
        8,
        '2026-07-01 21:30:00',
        '2026-07-01 22:00:00',
        'CLOSED',
        TRUE,
        8
    );

-- =====================================================================================
-- MODULE 12: SEED ACCESS LOGS
-- =====================================================================================
INSERT INTO
    access_logs (
        id,
        visitor_id,
        employee_id,
        access_point_id,
        zone_id,
        device_id,
        pass_id,
        checkin_id,
        access_method,
        credential_reference,
        access_result,
        access_time,
        deny_reason,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        NULL,
        1,
        1,
        1,
        1,
        NULL,
        'QR',
        'VMS-REF-001',
        'GRANTED',
        '2026-07-05 10:00:00',
        NULL,
        TRUE,
        7
    ),
    (
        2,
        1,
        NULL,
        2,
        1,
        2,
        1,
        NULL,
        'RFID',
        'BADGE-VIS-001',
        'GRANTED',
        '2026-07-05 10:02:00',
        NULL,
        TRUE,
        7
    ),
    (
        3,
        NULL,
        1,
        4,
        5,
        8,
        NULL,
        NULL,
        'MULTI_FACTOR',
        'EMP-001-MFA',
        'GRANTED',
        '2026-07-05 08:30:00',
        NULL,
        TRUE,
        1
    ),
    (
        4,
        NULL,
        4,
        3,
        3,
        3,
        NULL,
        NULL,
        'FINGERPRINT',
        'EMP-004-FP',
        'GRANTED',
        '2026-07-05 08:45:00',
        NULL,
        TRUE,
        5
    ),
    (
        5,
        3,
        NULL,
        1,
        1,
        1,
        NULL,
        NULL,
        'QR',
        'FAKE-QR-TOKEN',
        'INVALID_QR',
        '2026-06-22 14:00:00',
        'Duplicate QR code detected - previously scanned by visitor ID 1',
        TRUE,
        8
    ),
    (
        6,
        NULL,
        NULL,
        4,
        5,
        8,
        NULL,
        NULL,
        'RFID',
        'UNKNOWN-RFID',
        'DENIED',
        '2026-04-12 22:15:00',
        'Unregistered RFID badge presented at server room - no matching record',
        TRUE,
        8
    ),
    (
        7,
        2,
        NULL,
        6,
        4,
        4,
        2,
        NULL,
        'FACE_RECOGNITION',
        'VIS-FACE-002',
        'UNAUTHORIZED_AREA',
        '2026-07-05 11:30:00',
        'Visitor does not have permission to access Executive Suite zone',
        TRUE,
        8
    ),
    (
        8,
        NULL,
        7,
        1,
        1,
        1,
        NULL,
        NULL,
        'QR',
        'EMP-007-QR',
        'GRANTED',
        '2026-07-05 06:55:00',
        NULL,
        TRUE,
        8
    );

-- =====================================================================================
-- MODULE 12: SEED VEHICLE ACCESS LOGS
-- =====================================================================================
INSERT INTO
    vehicle_access_logs (
        id,
        vehicle_type,
        license_plate,
        vehicle_color,
        vehicle_make,
        vehicle_model,
        driver_name,
        driver_type,
        visitor_id,
        employee_id,
        appointment_id,
        entry_gate_id,
        exit_gate_id,
        entry_time,
        exit_time,
        parking_area,
        parking_spot,
        security_check_result,
        security_officer_id,
        lpr_confidence_score,
        remarks,
        is_active,
        created_by
    )
VALUES (
        1,
        'CAR',
        'CA-7XYZ-123',
        'Silver',
        'Toyota',
        'Camry',
        'John Smith',
        'VISITOR',
        1,
        NULL,
        1,
        5,
        10,
        '2026-07-05 09:45:00',
        '2026-07-05 17:40:00',
        'Visitor Lot A',
        'A-12',
        'PASSED',
        8,
        97.50,
        'Regular visitor vehicle - LPR matched.',
        TRUE,
        8
    ),
    (
        2,
        'CAR',
        'CA-8ABC-456',
        'Black',
        'BMW',
        '3 Series',
        'Maria Garcia',
        'VISITOR',
        2,
        NULL,
        2,
        5,
        10,
        '2026-07-05 10:30:00',
        '2026-07-05 16:50:00',
        'VIP Lot B',
        'B-03',
        'PASSED',
        8,
        99.10,
        'VIP visitor - expedited entry.',
        TRUE,
        8
    ),
    (
        3,
        'CAR',
        'CA-1EMP-789',
        'White',
        'Honda',
        'Civic',
        'Robert Garcia',
        'EMPLOYEE',
        NULL,
        7,
        NULL,
        5,
        NULL,
        '2026-07-05 06:50:00',
        NULL,
        'Employee Lot C',
        'C-45',
        'NOT_CHECKED',
        NULL,
        95.80,
        'Employee daily parking - still on premises.',
        TRUE,
        8
    ),
    (
        4,
        'TRUCK',
        'CA-9DEL-000',
        'White',
        'Ford',
        'Transit',
        'Mike Delivery',
        'DELIVERY',
        NULL,
        NULL,
        NULL,
        5,
        10,
        '2026-07-05 08:00:00',
        '2026-07-05 08:45:00',
        'Loading Dock',
        'LD-01',
        'PASSED',
        8,
        94.20,
        'Catering delivery for executive lunch event.',
        TRUE,
        8
    );

-- =====================================================================================
-- MODULE 12: SEED SURVEILLANCE EVENTS
-- =====================================================================================
INSERT INTO
    surveillance_events (
        id,
        event_type,
        camera_device_id,
        zone_id,
        event_time,
        confidence_score,
        ai_model_version,
        image_url,
        video_url,
        visitor_id,
        employee_id,
        incident_id,
        severity,
        reviewed_by,
        reviewed_at,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'FACE_RECOGNITION',
        5,
        1,
        '2026-07-05 10:00:30',
        94.50,
        'YOLOv8-Face-v2.1',
        '/surveillance/2026/07/05/cam001_face_100030.jpg',
        '/surveillance/2026/07/05/cam001_clip_100025_100035.mp4',
        1,
        NULL,
        NULL,
        'INFO',
        8,
        '2026-07-05 10:05:00',
        'REVIEWED',
        TRUE,
        8
    ),
    (
        2,
        'UNKNOWN_PERSON',
        5,
        1,
        '2026-06-22 13:58:00',
        88.20,
        'YOLOv8-Face-v2.1',
        '/surveillance/2026/06/22/cam001_unknown_135800.jpg',
        '/surveillance/2026/06/22/cam001_clip_135750_135810.mp4',
        NULL,
        NULL,
        3,
        'HIGH',
        8,
        '2026-06-22 14:05:00',
        'INVESTIGATING',
        TRUE,
        8
    ),
    (
        3,
        'MOTION_DETECTION',
        6,
        7,
        '2026-07-05 02:30:00',
        76.10,
        'YOLOv8-Motion-v1.5',
        '/surveillance/2026/07/05/cam002_motion_023000.jpg',
        NULL,
        NULL,
        NULL,
        NULL,
        'LOW',
        8,
        '2026-07-05 07:00:00',
        'FALSE_ALARM',
        TRUE,
        8
    ),
    (
        4,
        'CROWD_DETECTION',
        5,
        1,
        '2026-07-05 12:00:00',
        91.30,
        'YOLOv8-Crowd-v1.2',
        '/surveillance/2026/07/05/cam001_crowd_120000.jpg',
        NULL,
        NULL,
        NULL,
        NULL,
        'INFO',
        NULL,
        NULL,
        'NEW',
        TRUE,
        8
    ),
    (
        5,
        'RESTRICTED_ENTRY',
        5,
        1,
        '2026-07-05 11:30:15',
        96.80,
        'YOLOv8-Face-v2.1',
        '/surveillance/2026/07/05/cam001_restricted_113015.jpg',
        '/surveillance/2026/07/05/cam001_clip_113010_113020.mp4',
        2,
        NULL,
        NULL,
        'MEDIUM',
        8,
        '2026-07-05 11:35:00',
        'REVIEWED',
        TRUE,
        8
    );

-- =====================================================================================
-- MODULE 12: SEED SECURITY PATROLS
-- =====================================================================================
INSERT INTO
    security_patrols (
        id,
        patrol_code,
        guard_user_id,
        patrol_route_name,
        building_id,
        zone_id,
        scheduled_start,
        scheduled_end,
        actual_start,
        actual_end,
        checkpoints_completed,
        total_checkpoints,
        patrol_status,
        notes,
        is_active,
        created_by
    )
VALUES (
        1,
        'PTR-2026-0705-AM',
        8,
        'Morning Perimeter Walk',
        1,
        1,
        '2026-07-05 07:00:00',
        '2026-07-05 08:00:00',
        '2026-07-05 07:02:00',
        '2026-07-05 07:55:00',
        8,
        8,
        'COMPLETED',
        'All clear. No issues found during morning patrol. All emergency exits verified.',
        TRUE,
        8
    ),
    (
        2,
        'PTR-2026-0705-PM',
        8,
        'Afternoon Interior Sweep',
        1,
        2,
        '2026-07-05 14:00:00',
        '2026-07-05 15:30:00',
        '2026-07-05 14:05:00',
        '2026-07-05 15:25:00',
        12,
        12,
        'COMPLETED',
        'Checked all floors. Found propped-open door on 3rd floor - secured and reported.',
        TRUE,
        8
    ),
    (
        3,
        'PTR-2026-0705-NIGHT',
        8,
        'Night Lockdown Verification',
        1,
        NULL,
        '2026-07-05 22:00:00',
        '2026-07-05 23:30:00',
        '2026-07-05 22:00:00',
        '2026-07-05 23:20:00',
        15,
        15,
        'COMPLETED',
        'All zones locked down. Server room sealed. Parking lot cleared.',
        TRUE,
        8
    ),
    (
        4,
        'PTR-2026-0706-AM',
        8,
        'Morning Perimeter Walk',
        1,
        1,
        '2026-07-06 07:00:00',
        '2026-07-06 08:00:00',
        NULL,
        NULL,
        0,
        8,
        'SCHEDULED',
        NULL,
        TRUE,
        8
    );

-- =====================================================================================
-- MODULE 12: SEED VISITOR ACCESS HISTORY
-- =====================================================================================
INSERT INTO
    visitor_access_history (
        id,
        visitor_id,
        total_visits,
        total_entries,
        total_exits,
        successful_access_count,
        failed_access_count,
        restricted_area_attempts,
        last_access_time,
        last_access_point,
        first_visit_date,
        average_visit_duration_minutes,
        risk_score,
        risk_level,
        notes,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        5,
        12,
        10,
        11,
        1,
        0,
        '2026-07-05 17:30:00',
        'Main Entrance Gate',
        '2025-11-10',
        420,
        5.00,
        'LOW',
        'Regular business visitor - consistent pattern, no security concerns.',
        TRUE,
        8
    ),
    (
        2,
        2,
        3,
        8,
        7,
        7,
        1,
        1,
        '2026-07-05 16:45:00',
        'Reception Lobby Door',
        '2026-02-14',
        380,
        15.50,
        'LOW',
        'VIP investor visitor. One unauthorized area attempt (executive suite) - resolved.',
        TRUE,
        8
    ),
    (
        3,
        3,
        1,
        1,
        0,
        0,
        1,
        0,
        '2026-06-22 14:00:00',
        'Main Entrance Gate',
        '2026-06-22',
        0,
        85.00,
        'CRITICAL',
        'FLAGGED: Attempted entry with counterfeit QR code. Police report filed. Blacklisted.',
        TRUE,
        8
    ),
    (
        4,
        4,
        2,
        4,
        4,
        4,
        0,
        0,
        '2026-07-04 15:00:00',
        'Reception Lobby Door',
        '2026-06-01',
        300,
        2.00,
        'LOW',
        'Contractor - scheduled maintenance visits. Clean record.',
        TRUE,
        8
    );

-- =====================================================================================
-- MODULE 13: SEED NOTIFICATION CHANNELS
-- =====================================================================================
INSERT INTO
    notification_channels (
        id,
        channel_code,
        channel_name,
        channel_type,
        provider_name,
        rate_limit_per_minute,
        rate_limit_per_hour,
        is_default,
        priority_order,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'CH-EMAIL',
        'Primary Email Channel',
        'EMAIL',
        'SendGrid',
        100,
        5000,
        TRUE,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'CH-SMS',
        'Primary SMS Channel',
        'SMS',
        'Twilio',
        50,
        2000,
        TRUE,
        2,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'CH-PUSH',
        'Firebase Push Notifications',
        'PUSH',
        'Firebase Cloud Messaging',
        200,
        10000,
        TRUE,
        3,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'CH-INAPP',
        'In-App Notification Center',
        'IN_APP',
        'Internal',
        NULL,
        NULL,
        TRUE,
        4,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'CH-WHATSAPP',
        'WhatsApp Business Channel',
        'WHATSAPP',
        'Meta Business API',
        30,
        1000,
        FALSE,
        5,
        'INACTIVE',
        TRUE,
        1
    ),
    (
        6,
        'CH-SLACK',
        'Slack Workspace Integration',
        'SLACK',
        'Slack API',
        60,
        3000,
        FALSE,
        6,
        'INACTIVE',
        TRUE,
        1
    ),
    (
        7,
        'CH-TEAMS',
        'Microsoft Teams Integration',
        'TEAMS',
        'Microsoft Graph API',
        60,
        3000,
        FALSE,
        7,
        'INACTIVE',
        TRUE,
        1
    ),
    (
        8,
        'CH-WEBHOOK',
        'Custom Webhook Endpoint',
        'WEBHOOK',
        'Internal',
        120,
        5000,
        FALSE,
        8,
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 13: SEED NOTIFICATION TEMPLATE LIBRARY
-- =====================================================================================
INSERT INTO
    notification_template_library (
        id,
        template_code,
        template_name,
        category,
        channel_type,
        subject_template,
        body_template,
        body_plain_text,
        default_priority,
        language,
        version,
        is_system_template,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'VISITOR_CHECKIN',
        'Visitor Check-In Confirmation',
        'CHECKIN',
        'EMAIL',
        'Visitor {{visitor_name}} has checked in',
        '<h2>Check-In Confirmed</h2><p>Dear {{host_name}},</p><p>Your visitor <strong>{{visitor_name}}</strong> from {{visitor_company}} has checked in at {{checkin_time}} via {{checkin_method}}.</p><p>Location: {{building_name}}, {{floor_name}}</p><p>Pass Code: {{pass_code}}</p>',
        'Visitor {{visitor_name}} from {{visitor_company}} checked in at {{checkin_time}}. Pass: {{pass_code}}',
        'HIGH',
        'en',
        1,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'VISITOR_CHECKIN',
        'Visitor Check-In Push Alert',
        'CHECKIN',
        'PUSH',
        'Visitor Arrived',
        '{{visitor_name}} has checked in for your meeting',
        '{{visitor_name}} has checked in for your meeting',
        'HIGH',
        'en',
        1,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'VISITOR_CHECKIN',
        'Visitor Check-In In-App',
        'CHECKIN',
        'IN_APP',
        'Visitor Arrived',
        '{{visitor_name}} from {{visitor_company}} has arrived and checked in at {{checkin_time}}.',
        '{{visitor_name}} from {{visitor_company}} has arrived and checked in at {{checkin_time}}.',
        'HIGH',
        'en',
        1,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'APPOINTMENT_APPROVED',
        'Appointment Approved Email',
        'APPROVAL',
        'EMAIL',
        'Your appointment on {{appointment_date}} has been approved',
        '<h2>Appointment Approved</h2><p>Dear {{visitor_name}},</p><p>Your appointment with <strong>{{host_name}}</strong> on {{appointment_date}} at {{appointment_time}} has been approved.</p><p>Location: {{building_name}}, {{meeting_room}}</p><p>Please arrive 10 minutes before your scheduled time.</p>',
        'Your appointment with {{host_name}} on {{appointment_date}} at {{appointment_time}} has been approved.',
        'MEDIUM',
        'en',
        1,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'APPOINTMENT_APPROVED',
        'Appointment Approved SMS',
        'APPROVAL',
        'SMS',
        NULL,
        'VMS: Your appointment with {{host_name}} on {{appointment_date}} at {{appointment_time}} is approved. Ref: {{appointment_ref}}',
        'VMS: Your appointment with {{host_name}} on {{appointment_date}} at {{appointment_time}} is approved. Ref: {{appointment_ref}}',
        'MEDIUM',
        'en',
        1,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        6,
        'PASS_GENERATED',
        'Visitor Pass Generated',
        'VISITOR',
        'EMAIL',
        'Your Visitor Pass for {{organization_name}}',
        '<h2>Your Visitor Pass</h2><p>Dear {{visitor_name}},</p><p>Your visitor pass has been generated. Please present the attached QR code at the reception desk.</p><p><strong>Pass Code:</strong> {{pass_code}}</p><p><strong>Valid Until:</strong> {{pass_expiry}}</p>',
        'Your visitor pass code is {{pass_code}}. Valid until {{pass_expiry}}. Present the attached QR code at reception.',
        'HIGH',
        'en',
        1,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        7,
        'SECURITY_ALERT',
        'Security Alert Notification',
        'SECURITY',
        'EMAIL',
        '[SECURITY ALERT] {{alert_type}} - {{severity}}',
        '<h2 style="color:red;">Security Alert</h2><p><strong>Type:</strong> {{alert_type}}</p><p><strong>Severity:</strong> {{severity}}</p><p><strong>Location:</strong> {{location}}</p><p><strong>Details:</strong> {{description}}</p><p>Reported by: {{reporter_name}} at {{incident_time}}</p>',
        'SECURITY ALERT: {{alert_type}} ({{severity}}) at {{location}}. {{description}}',
        'EMERGENCY',
        'en',
        1,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        8,
        'SECURITY_ALERT',
        'Security Alert Push',
        'SECURITY',
        'PUSH',
        'Security Alert',
        '{{severity}} ALERT: {{alert_type}} at {{location}}',
        '{{severity}} ALERT: {{alert_type}} at {{location}}',
        'EMERGENCY',
        'en',
        1,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        9,
        'EMERGENCY_LOCKDOWN',
        'Emergency Lockdown Broadcast',
        'EMERGENCY',
        'EMAIL',
        '[EMERGENCY] {{lockdown_type}} - Facility Lockdown Activated',
        '<h1 style="color:red;">EMERGENCY LOCKDOWN</h1><p><strong>Type:</strong> {{lockdown_type}}</p><p><strong>Scope:</strong> {{lockdown_scope}}</p><p><strong>Location:</strong> {{location}}</p><p>{{reason}}</p><p>Follow emergency evacuation procedures immediately.</p>',
        'EMERGENCY LOCKDOWN: {{lockdown_type}} at {{location}}. {{reason}}. Follow evacuation procedures.',
        'EMERGENCY',
        'en',
        1,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        10,
        'EMERGENCY_LOCKDOWN',
        'Emergency Lockdown SMS',
        'EMERGENCY',
        'SMS',
        NULL,
        'EMERGENCY: {{lockdown_type}} lockdown at {{location}}. {{reason}}. Follow evacuation procedures immediately.',
        'EMERGENCY: {{lockdown_type}} lockdown at {{location}}. {{reason}}. Follow evacuation procedures immediately.',
        'EMERGENCY',
        'en',
        1,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        11,
        'CHECKOUT_COMPLETE',
        'Visitor Checkout Confirmation',
        'CHECKOUT',
        'EMAIL',
        'Visit Summary - {{visitor_name}} - {{checkout_date}}',
        '<h2>Visit Complete</h2><p>Dear {{host_name}},</p><p>Your visitor <strong>{{visitor_name}}</strong> has checked out at {{checkout_time}}.</p><p><strong>Duration:</strong> {{visit_duration}}</p><p>Thank you for using the Visitor Management System.</p>',
        'Visitor {{visitor_name}} checked out at {{checkout_time}}. Visit duration: {{visit_duration}}.',
        'LOW',
        'en',
        1,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        12,
        'APPOINTMENT_REMINDER',
        'Appointment Reminder Email',
        'APPOINTMENT',
        'EMAIL',
        'Reminder: Appointment with {{visitor_name}} tomorrow',
        '<h2>Appointment Reminder</h2><p>Dear {{host_name}},</p><p>You have an appointment with <strong>{{visitor_name}}</strong> tomorrow at {{appointment_time}}.</p><p>Location: {{meeting_room}}</p>',
        'Reminder: You have an appointment with {{visitor_name}} tomorrow at {{appointment_time}} in {{meeting_room}}.',
        'MEDIUM',
        'en',
        1,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        13,
        'PASSWORD_RESET',
        'Password Reset Email',
        'AUTHENTICATION',
        'EMAIL',
        'Password Reset Request',
        '<h2>Password Reset</h2><p>Dear {{user_name}},</p><p>A password reset was requested for your account. Click the link below to reset your password:</p><p><a href="{{reset_link}}">Reset Password</a></p><p>This link expires in {{expiry_minutes}} minutes.</p>',
        'Password reset requested. Visit {{reset_link}} to reset. Expires in {{expiry_minutes}} minutes.',
        'HIGH',
        'en',
        1,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        14,
        'SYSTEM_MAINTENANCE',
        'Scheduled Maintenance Notice',
        'MAINTENANCE',
        'EMAIL',
        'Scheduled Maintenance: {{maintenance_window}}',
        '<h2>Scheduled Maintenance</h2><p>The Visitor Management System will undergo scheduled maintenance on <strong>{{maintenance_date}}</strong> from {{start_time}} to {{end_time}} ({{timezone}}).</p><p>During this window, the system may be temporarily unavailable.</p>',
        'Scheduled maintenance on {{maintenance_date}} from {{start_time}} to {{end_time}}. System may be unavailable.',
        'MEDIUM',
        'en',
        1,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        15,
        'VISITOR_BLACKLISTED',
        'Visitor Blacklisted Alert',
        'SECURITY',
        'IN_APP',
        'Visitor Blacklisted',
        'Visitor {{visitor_name}} has been added to the blacklist. Reason: {{reason}}. Blacklisted by: {{blocked_by}}.',
        'Visitor {{visitor_name}} blacklisted. Reason: {{reason}}.',
        'HIGH',
        'en',
        1,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        16,
        'CAMPAIGN_ANNOUNCEMENT',
        'General Announcement Template',
        'CAMPAIGN',
        'EMAIL',
        '{{subject}}',
        '<h2>{{title}}</h2><p>{{body}}</p><p>Best regards,<br>{{organization_name}} Administration</p>',
        '{{title}}: {{body}}',
        'MEDIUM',
        'en',
        1,
        FALSE,
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 13: SEED NOTIFICATION EVENTS
-- =====================================================================================
INSERT INTO
    notification_events (
        id,
        event_code,
        event_name,
        source_module,
        default_template_id,
        default_priority,
        is_user_configurable,
        is_mandatory,
        cooldown_seconds,
        description,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'EVT_VISITOR_CHECKIN',
        'Visitor Checked In',
        'CHECKIN',
        1,
        'HIGH',
        TRUE,
        FALSE,
        60,
        'Fires when a visitor completes check-in at reception or kiosk',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'EVT_VISITOR_CHECKOUT',
        'Visitor Checked Out',
        'CHECKOUT',
        11,
        'LOW',
        TRUE,
        FALSE,
        60,
        'Fires when a visitor completes checkout process',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'EVT_APPOINTMENT_APPROVED',
        'Appointment Approved',
        'APPROVAL',
        4,
        'MEDIUM',
        TRUE,
        FALSE,
        NULL,
        'Fires when an appointment request is approved',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'EVT_APPOINTMENT_REJECTED',
        'Appointment Rejected',
        'APPROVAL',
        NULL,
        'MEDIUM',
        TRUE,
        FALSE,
        NULL,
        'Fires when an appointment request is rejected',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'EVT_APPOINTMENT_REMINDER',
        'Appointment Reminder',
        'APPOINTMENT',
        12,
        'MEDIUM',
        TRUE,
        FALSE,
        NULL,
        'Fires 24 hours before a scheduled appointment',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        6,
        'EVT_PASS_GENERATED',
        'Visitor Pass Generated',
        'PASS',
        6,
        'HIGH',
        FALSE,
        TRUE,
        NULL,
        'Fires when a visitor pass QR code is generated and ready',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        7,
        'EVT_PASS_EXPIRED',
        'Visitor Pass Expired',
        'PASS',
        NULL,
        'MEDIUM',
        TRUE,
        FALSE,
        NULL,
        'Fires when a visitor pass expires',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        8,
        'EVT_SECURITY_ALERT',
        'Security Alert Raised',
        'SECURITY',
        7,
        'EMERGENCY',
        FALSE,
        TRUE,
        30,
        'Fires on security incidents (unauthorized access, tailgating, fake QR, etc.)',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        9,
        'EVT_EMERGENCY_LOCKDOWN',
        'Emergency Lockdown Activated',
        'SECURITY',
        9,
        'EMERGENCY',
        FALSE,
        TRUE,
        0,
        'Fires when an emergency lockdown is initiated - mandatory for all users',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        10,
        'EVT_PASSWORD_RESET',
        'Password Reset Requested',
        'AUTHENTICATION',
        13,
        'HIGH',
        FALSE,
        TRUE,
        120,
        'Fires when a user requests a password reset',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        11,
        'EVT_VISITOR_BLACKLISTED',
        'Visitor Added to Blacklist',
        'SECURITY',
        15,
        'HIGH',
        TRUE,
        FALSE,
        NULL,
        'Fires when a visitor is blacklisted from the facility',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        12,
        'EVT_SYSTEM_MAINTENANCE',
        'System Maintenance Scheduled',
        'SYSTEM',
        14,
        'MEDIUM',
        TRUE,
        FALSE,
        NULL,
        'Fires when scheduled maintenance is announced',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        13,
        'EVT_ACCESS_DENIED',
        'Access Denied at Gate',
        'SECURITY',
        NULL,
        'HIGH',
        TRUE,
        FALSE,
        60,
        'Fires when an access attempt is denied at a security gate',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        14,
        'EVT_VISITOR_ARRIVED',
        'Visitor Arrived at Reception',
        'RECEPTION',
        NULL,
        'MEDIUM',
        TRUE,
        FALSE,
        30,
        'Fires when a visitor checks in at the reception lobby',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        15,
        'EVT_HOST_NOTIFICATION',
        'Host Meeting Notification',
        'APPOINTMENT',
        NULL,
        'MEDIUM',
        TRUE,
        FALSE,
        NULL,
        'Fires to notify host that their visitor has arrived',
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 13: SEED NOTIFICATION CAMPAIGNS
-- =====================================================================================
INSERT INTO
    notification_campaigns (
        id,
        campaign_code,
        campaign_name,
        campaign_type,
        template_id,
        target_audience,
        channels_json,
        subject,
        body_content,
        priority,
        scheduled_at,
        started_at,
        completed_at,
        total_recipients,
        total_sent,
        total_failed,
        total_delivered,
        total_read,
        initiated_by,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'CMP-2026-001',
        'Q3 Security Policy Update',
        'POLICY_UPDATE',
        16,
        'ALL_EMPLOYEES',
        '["EMAIL", "IN_APP"]',
        'Updated Security Policies - Effective July 15, 2026',
        'Please review the updated facility security policies effective July 15, 2026. All employees must acknowledge receipt by July 14. Key changes include mandatory badge display, updated visitor escort procedures, and new emergency exit protocols.',
        'MEDIUM',
        '2026-07-08 09:00:00',
        NULL,
        NULL,
        0,
        0,
        0,
        0,
        0,
        1,
        'SCHEDULED',
        TRUE,
        1
    ),
    (
        2,
        'CMP-2026-002',
        'System Maintenance Window July 12',
        'MAINTENANCE_ALERT',
        14,
        'ALL_USERS',
        '["EMAIL", "IN_APP", "PUSH"]',
        'Scheduled Maintenance: July 12, 2026 02:00-06:00 UTC',
        'The VMS system will undergo scheduled maintenance on July 12, 2026 from 02:00 to 06:00 UTC. During this period, check-in kiosks, mobile app, and web portal may be intermittently unavailable. Pre-registered visitors will still be processed manually at reception.',
        'HIGH',
        '2026-07-10 09:00:00',
        NULL,
        NULL,
        0,
        0,
        0,
        0,
        0,
        1,
        'APPROVED',
        TRUE,
        1
    ),
    (
        3,
        'CMP-2026-DRILL',
        'Emergency Drill Announcement',
        'EMERGENCY_BROADCAST',
        9,
        'ALL_USERS',
        '["EMAIL", "SMS", "PUSH", "IN_APP"]',
        'Emergency Evacuation Drill - July 15, 2026 14:00',
        'An emergency evacuation drill is scheduled for July 15, 2026 at 14:00 local time. All personnel must participate. Please review emergency exit routes posted in your area. Assembly points: Parking Lot A (Main Tower), Parking Lot C (Research Center).',
        'EMERGENCY',
        NULL,
        '2026-07-05 10:00:00',
        '2026-07-05 10:05:00',
        45,
        45,
        0,
        43,
        38,
        1,
        'COMPLETED',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 13: SEED NOTIFICATION MESSAGES
-- =====================================================================================
INSERT INTO
    notification_messages (
        id,
        notification_uid,
        event_id,
        template_id,
        campaign_id,
        category,
        priority,
        subject,
        body_html,
        body_plain,
        source_entity_type,
        source_entity_id,
        sender_user_id,
        total_recipients,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'ntf-uuid-0001-checkin-john',
        1,
        1,
        NULL,
        'CHECKIN',
        'HIGH',
        'Visitor John Smith has checked in',
        '<h2>Check-In Confirmed</h2><p>Dear Sarah Johnson,</p><p>Your visitor <strong>John Smith</strong> from TechCorp Solutions has checked in at 10:05 AM via QR Code.</p>',
        'Visitor John Smith from TechCorp Solutions checked in at 10:05 AM. Pass: VMS-PASS-001',
        'visitor_checkin',
        1,
        NULL,
        2,
        'DELIVERED',
        TRUE,
        1
    ),
    (
        2,
        'ntf-uuid-0002-approved-maria',
        3,
        4,
        NULL,
        'APPROVAL',
        'MEDIUM',
        'Your appointment on July 5 has been approved',
        '<h2>Appointment Approved</h2><p>Dear Maria Garcia,</p><p>Your appointment with <strong>Michael Chen</strong> on July 5, 2026 at 10:30 AM has been approved.</p>',
        'Your appointment with Michael Chen on July 5 at 10:30 AM has been approved.',
        'appointment',
        2,
        5,
        1,
        'READ',
        TRUE,
        1
    ),
    (
        3,
        'ntf-uuid-0003-security-fakeqr',
        8,
        7,
        NULL,
        'SECURITY',
        'EMERGENCY',
        '[SECURITY ALERT] FAKE_QR - CRITICAL',
        '<h2 style="color:red;">Security Alert</h2><p><strong>Type:</strong> Counterfeit QR Code</p><p><strong>Severity:</strong> CRITICAL</p><p><strong>Location:</strong> Main Entrance Gate</p><p><strong>Details:</strong> Visitor presented photographed QR code from another visitor pass.</p>',
        'SECURITY ALERT: Counterfeit QR Code (CRITICAL) at Main Entrance Gate. Visitor presented photographed QR code.',
        'security_incident',
        3,
        8,
        3,
        'READ',
        TRUE,
        8
    ),
    (
        4,
        'ntf-uuid-0004-pass-john',
        6,
        6,
        NULL,
        'VISITOR',
        'HIGH',
        'Your Visitor Pass for Hybrid-Tech Global Corporation',
        '<h2>Your Visitor Pass</h2><p>Dear John Smith,</p><p>Your visitor pass has been generated. Present the attached QR code at reception.</p><p><strong>Pass Code:</strong> VMS-PASS-001</p><p><strong>Valid Until:</strong> July 5, 2026 18:00</p>',
        'Your visitor pass code is VMS-PASS-001. Valid until July 5 18:00. Present QR at reception.',
        'visitor_pass',
        1,
        NULL,
        1,
        'DELIVERED',
        TRUE,
        1
    ),
    (
        5,
        'ntf-uuid-0005-checkout-john',
        2,
        11,
        NULL,
        'CHECKOUT',
        'LOW',
        'Visit Summary - John Smith - July 5, 2026',
        '<h2>Visit Complete</h2><p>Dear Sarah Johnson,</p><p>Your visitor <strong>John Smith</strong> has checked out at 5:30 PM.</p><p><strong>Duration:</strong> 7 hours 25 minutes</p>',
        'Visitor John Smith checked out at 5:30 PM. Visit duration: 7 hours 25 minutes.',
        'visitor_checkout',
        1,
        NULL,
        1,
        'SENT',
        TRUE,
        1
    ),
    (
        6,
        'ntf-uuid-0006-drill-broadcast',
        9,
        9,
        3,
        'EMERGENCY',
        'EMERGENCY',
        'Emergency Evacuation Drill - July 15, 2026 14:00',
        '<h1 style="color:red;">EMERGENCY DRILL</h1><p><strong>Type:</strong> Evacuation Drill</p><p><strong>Scope:</strong> Full Facility</p><p>All personnel must participate. Review emergency exit routes.</p>',
        'EMERGENCY DRILL: Evacuation drill on July 15 at 14:00. All personnel must participate.',
        'campaign',
        3,
        1,
        45,
        'DELIVERED',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 13: SEED NOTIFICATION RECIPIENTS
-- =====================================================================================
INSERT INTO
    notification_recipients (
        id,
        notification_id,
        recipient_type,
        user_id,
        visitor_id,
        recipient_email,
        channel_id,
        delivery_status,
        sent_at,
        delivered_at,
        read_at,
        provider_message_id,
        retry_count,
        max_retries,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        'USER',
        3,
        NULL,
        'sarah.j@visitor.com',
        1,
        'DELIVERED',
        '2026-07-05 10:05:30',
        '2026-07-05 10:05:32',
        '2026-07-05 10:06:00',
        'sg-msg-001',
        0,
        3,
        TRUE,
        1
    ),
    (
        2,
        1,
        'USER',
        3,
        NULL,
        NULL,
        4,
        'READ',
        '2026-07-05 10:05:30',
        '2026-07-05 10:05:30',
        '2026-07-05 10:06:00',
        NULL,
        0,
        3,
        TRUE,
        1
    ),
    (
        3,
        2,
        'VISITOR',
        NULL,
        2,
        'maria.g@techstart.io',
        1,
        'READ',
        '2026-07-05 09:35:00',
        '2026-07-05 09:35:03',
        '2026-07-05 09:40:00',
        'sg-msg-002',
        0,
        3,
        TRUE,
        1
    ),
    (
        4,
        3,
        'USER',
        1,
        NULL,
        'admin@visitor.com',
        1,
        'READ',
        '2026-06-22 14:01:00',
        '2026-06-22 14:01:02',
        '2026-06-22 14:02:00',
        'sg-msg-003',
        0,
        3,
        TRUE,
        8
    ),
    (
        5,
        3,
        'USER',
        8,
        NULL,
        'robert.g@visitor.com',
        3,
        'READ',
        '2026-06-22 14:01:00',
        '2026-06-22 14:01:01',
        '2026-06-22 14:01:15',
        'fcm-msg-001',
        0,
        3,
        TRUE,
        8
    ),
    (
        6,
        3,
        'USER',
        8,
        NULL,
        NULL,
        4,
        'READ',
        '2026-06-22 14:01:00',
        '2026-06-22 14:01:00',
        '2026-06-22 14:01:10',
        NULL,
        0,
        3,
        TRUE,
        8
    ),
    (
        7,
        4,
        'VISITOR',
        NULL,
        1,
        'john.smith@email.com',
        1,
        'DELIVERED',
        '2026-07-05 09:30:00',
        '2026-07-05 09:30:04',
        NULL,
        'sg-msg-004',
        0,
        3,
        TRUE,
        1
    ),
    (
        8,
        5,
        'USER',
        3,
        NULL,
        'sarah.j@visitor.com',
        1,
        'SENT',
        '2026-07-05 17:31:00',
        NULL,
        NULL,
        'sg-msg-005',
        0,
        3,
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 13: SEED NOTIFICATION QUEUE
-- =====================================================================================
INSERT INTO
    notification_queue (
        id,
        notification_id,
        recipient_id,
        channel_id,
        priority,
        priority_score,
        payload_json,
        attempt_count,
        max_attempts,
        scheduled_at,
        locked_at,
        locked_by,
        processed_at,
        queue_status,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        1,
        'HIGH',
        800,
        '{"to":"sarah.j@visitor.com","subject":"Visitor John Smith has checked in","body":"Check-in confirmed..."}',
        1,
        3,
        '2026-07-05 10:05:00',
        '2026-07-05 10:05:28',
        'worker-email-01',
        '2026-07-05 10:05:32',
        'COMPLETED',
        TRUE,
        1
    ),
    (
        2,
        3,
        4,
        1,
        'EMERGENCY',
        1000,
        '{"to":"admin@visitor.com","subject":"[SECURITY ALERT] FAKE_QR - CRITICAL","body":"Security alert..."}',
        1,
        3,
        '2026-06-22 14:00:30',
        '2026-06-22 14:00:58',
        'worker-email-01',
        '2026-06-22 14:01:02',
        'COMPLETED',
        TRUE,
        8
    ),
    (
        3,
        3,
        5,
        3,
        'EMERGENCY',
        1000,
        '{"to":"fcm-token-robert","title":"Security Alert","body":"CRITICAL: Counterfeit QR at Main Gate"}',
        1,
        3,
        '2026-06-22 14:00:30',
        '2026-06-22 14:00:59',
        'worker-push-01',
        '2026-06-22 14:01:01',
        'COMPLETED',
        TRUE,
        8
    ),
    (
        4,
        5,
        8,
        1,
        'LOW',
        200,
        '{"to":"sarah.j@visitor.com","subject":"Visit Summary - John Smith","body":"Checkout complete..."}',
        1,
        3,
        '2026-07-05 17:30:30',
        '2026-07-05 17:30:58',
        'worker-email-01',
        '2026-07-05 17:31:00',
        'COMPLETED',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 13: SEED NOTIFICATION DELIVERY LOGS
-- =====================================================================================
INSERT INTO
    notification_delivery_logs (
        id,
        notification_id,
        recipient_id,
        channel_id,
        queue_entry_id,
        attempt_number,
        delivery_status,
        provider_name,
        provider_message_id,
        provider_response_code,
        error_category,
        latency_ms,
        attempted_at,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        1,
        1,
        1,
        'DELIVERED',
        'SendGrid',
        'sg-msg-001',
        '202',
        'NONE',
        1850,
        '2026-07-05 10:05:30',
        TRUE,
        1
    ),
    (
        2,
        1,
        2,
        4,
        NULL,
        1,
        'DELIVERED',
        'Internal',
        NULL,
        '200',
        'NONE',
        5,
        '2026-07-05 10:05:30',
        TRUE,
        1
    ),
    (
        3,
        2,
        3,
        1,
        NULL,
        1,
        'DELIVERED',
        'SendGrid',
        'sg-msg-002',
        '202',
        'NONE',
        2100,
        '2026-07-05 09:35:00',
        TRUE,
        1
    ),
    (
        4,
        3,
        4,
        1,
        2,
        1,
        'DELIVERED',
        'SendGrid',
        'sg-msg-003',
        '202',
        'NONE',
        1920,
        '2026-06-22 14:01:00',
        TRUE,
        8
    ),
    (
        5,
        3,
        5,
        3,
        3,
        1,
        'DELIVERED',
        'Firebase Cloud Messaging',
        'fcm-msg-001',
        '200',
        'NONE',
        450,
        '2026-06-22 14:01:00',
        TRUE,
        8
    ),
    (
        6,
        4,
        7,
        1,
        NULL,
        1,
        'DELIVERED',
        'SendGrid',
        'sg-msg-004',
        '202',
        'NONE',
        3200,
        '2026-07-05 09:30:00',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 13: SEED NOTIFICATION PREFERENCES
-- =====================================================================================
INSERT INTO
    notification_preferences (
        id,
        user_id,
        channel_id,
        email_enabled,
        sms_enabled,
        push_enabled,
        in_app_enabled,
        quiet_hours_enabled,
        quiet_hours_start,
        quiet_hours_end,
        quiet_hours_timezone,
        preferred_language,
        preferred_timezone,
        digest_enabled,
        emergency_override,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        NULL,
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        NULL,
        NULL,
        'UTC',
        'en',
        'America/Los_Angeles',
        FALSE,
        TRUE,
        TRUE,
        1
    ),
    (
        2,
        3,
        NULL,
        TRUE,
        FALSE,
        TRUE,
        TRUE,
        TRUE,
        '22:00:00',
        '07:00:00',
        'America/Los_Angeles',
        'en',
        'America/Los_Angeles',
        FALSE,
        TRUE,
        TRUE,
        3
    ),
    (
        3,
        7,
        NULL,
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        NULL,
        NULL,
        'UTC',
        'en',
        'America/Los_Angeles',
        FALSE,
        TRUE,
        TRUE,
        7
    ),
    (
        4,
        8,
        NULL,
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        NULL,
        NULL,
        'UTC',
        'en',
        'America/Los_Angeles',
        FALSE,
        TRUE,
        TRUE,
        8
    );

-- =====================================================================================
-- MODULE 13: SEED NOTIFICATION SUBSCRIPTIONS
-- =====================================================================================
INSERT INTO
    notification_subscriptions (
        id,
        user_id,
        event_id,
        is_subscribed,
        subscribed_at,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        8,
        TRUE,
        '2026-01-01 08:00:00',
        TRUE,
        1
    ),
    (
        2,
        1,
        9,
        TRUE,
        '2026-01-01 08:00:00',
        TRUE,
        1
    ),
    (
        3,
        3,
        1,
        TRUE,
        '2026-01-15 09:00:00',
        TRUE,
        3
    ),
    (
        4,
        3,
        2,
        TRUE,
        '2026-01-15 09:00:00',
        TRUE,
        3
    ),
    (
        5,
        3,
        5,
        TRUE,
        '2026-01-15 09:00:00',
        TRUE,
        3
    ),
    (
        6,
        8,
        8,
        TRUE,
        '2026-01-01 08:00:00',
        TRUE,
        8
    ),
    (
        7,
        8,
        9,
        TRUE,
        '2026-01-01 08:00:00',
        TRUE,
        8
    ),
    (
        8,
        8,
        13,
        TRUE,
        '2026-01-01 08:00:00',
        TRUE,
        8
    );

-- =====================================================================================
-- MODULE 13: SEED NOTIFICATION ATTACHMENTS
-- =====================================================================================
INSERT INTO
    notification_attachments (
        id,
        notification_id,
        file_name,
        file_url,
        file_type,
        mime_type,
        file_size_bytes,
        checksum_sha256,
        is_inline,
        content_id,
        download_count,
        is_active,
        created_by
    )
VALUES (
        1,
        4,
        'visitor_pass_john_smith.png',
        '/passes/2026/07/05/vms-pass-001-qr.png',
        'QR_CODE',
        'image/png',
        24576,
        'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        TRUE,
        'qr-pass-001',
        2,
        TRUE,
        1
    ),
    (
        2,
        4,
        'visitor_pass_john_smith.pdf',
        '/passes/2026/07/05/vms-pass-001-full.pdf',
        'VISITOR_PASS',
        'application/pdf',
        156000,
        'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
        FALSE,
        NULL,
        1,
        TRUE,
        1
    ),
    (
        3,
        6,
        'emergency_drill_map.pdf',
        '/campaigns/2026/07/emergency_drill_evacuation_map.pdf',
        'PDF',
        'application/pdf',
        524288,
        'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
        FALSE,
        NULL,
        38,
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 13: SEED NOTIFICATION STATISTICS
-- =====================================================================================
INSERT INTO
    notification_statistics (
        id,
        period_type,
        period_start,
        period_end,
        channel_id,
        total_notifications,
        total_sent,
        total_delivered,
        total_read,
        total_clicked,
        total_bounced,
        total_failed,
        total_expired,
        total_unsubscribed,
        delivery_rate,
        open_rate,
        click_rate,
        bounce_rate,
        failure_rate,
        avg_delivery_latency_ms,
        avg_time_to_read_minutes,
        is_active,
        created_by
    )
VALUES (
        1,
        'DAILY',
        '2026-07-05 00:00:00',
        '2026-07-05 23:59:59',
        1,
        28,
        28,
        26,
        20,
        5,
        1,
        1,
        0,
        0,
        92.86,
        76.92,
        19.23,
        3.57,
        3.57,
        2150,
        8,
        TRUE,
        1
    ),
    (
        2,
        'DAILY',
        '2026-07-05 00:00:00',
        '2026-07-05 23:59:59',
        3,
        15,
        15,
        14,
        12,
        0,
        0,
        1,
        0,
        0,
        93.33,
        85.71,
        0.00,
        0.00,
        6.67,
        380,
        2,
        TRUE,
        1
    ),
    (
        3,
        'DAILY',
        '2026-07-05 00:00:00',
        '2026-07-05 23:59:59',
        4,
        42,
        42,
        42,
        35,
        8,
        0,
        0,
        0,
        0,
        100.00,
        83.33,
        19.05,
        0.00,
        0.00,
        5,
        5,
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 14: SEED REPORT DEFINITIONS
-- =====================================================================================
INSERT INTO
    report_definitions (
        id,
        report_code,
        report_name,
        report_type,
        data_source_module,
        description,
        schedule_type,
        is_scheduled,
        is_public,
        min_role_level,
        category,
        owner_user_id,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'RPT-VISITOR-DAILY',
        'Daily Visitor Summary Report',
        'VISITOR',
        'VISITOR',
        'Comprehensive daily breakdown of all visitor activity including arrivals, departures, categories, and visit durations.',
        'DAILY',
        TRUE,
        FALSE,
        2,
        'Operations',
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'RPT-SECURITY-WEEKLY',
        'Weekly Security Incident Report',
        'SECURITY',
        'SECURITY',
        'Weekly summary of all security incidents, access denials, lockdowns, and patrol completion rates.',
        'WEEKLY',
        TRUE,
        FALSE,
        3,
        'Security',
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'RPT-CHECKIN-PERF',
        'Check-In Performance Analysis',
        'CHECKIN',
        'CHECKIN',
        'Analysis of check-in throughput, processing times, peak hours, and method breakdown.',
        'DAILY',
        TRUE,
        TRUE,
        1,
        'Operations',
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'RPT-EXEC-SUMMARY',
        'Executive Monthly Dashboard',
        'EXECUTIVE_SUMMARY',
        'MULTI_MODULE',
        'High-level monthly executive summary with KPIs from all modules for C-suite review.',
        'MONTHLY',
        TRUE,
        FALSE,
        4,
        'Executive',
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'RPT-COMPLIANCE-AUDIT',
        'Compliance Audit Trail Report',
        'COMPLIANCE',
        'MULTI_MODULE',
        'Complete audit trail for regulatory compliance including all access logs, report access, and system changes.',
        'MONTHLY',
        TRUE,
        FALSE,
        4,
        'Compliance',
        1,
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 14: SEED REPORT EXECUTIONS
-- =====================================================================================
INSERT INTO
    report_executions (
        id,
        report_id,
        execution_uid,
        triggered_by,
        trigger_type,
        output_format,
        output_file_url,
        output_file_size_bytes,
        output_row_count,
        start_time,
        end_time,
        execution_duration_ms,
        execution_status,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        'exec-uuid-0001',
        1,
        'SCHEDULED',
        'PDF',
        '/reports/2026/07/05/visitor-daily-20260705.pdf',
        245000,
        156,
        '2026-07-05 23:55:00',
        '2026-07-05 23:55:08',
        8200,
        'SUCCESS',
        TRUE,
        1
    ),
    (
        2,
        2,
        'exec-uuid-0002',
        1,
        'SCHEDULED',
        'PDF',
        '/reports/2026/07/05/security-weekly-w27.pdf',
        180000,
        42,
        '2026-07-05 23:58:00',
        '2026-07-05 23:58:05',
        5100,
        'SUCCESS',
        TRUE,
        1
    ),
    (
        3,
        3,
        'exec-uuid-0003',
        3,
        'MANUAL',
        'EXCEL',
        '/reports/2026/07/05/checkin-perf-20260705.xlsx',
        98000,
        89,
        '2026-07-05 16:00:00',
        '2026-07-05 16:00:03',
        3400,
        'SUCCESS',
        TRUE,
        3
    ),
    (
        4,
        4,
        'exec-uuid-0004',
        1,
        'MANUAL',
        'PDF',
        '/reports/2026/06/exec-summary-june2026.pdf',
        520000,
        320,
        '2026-07-01 09:00:00',
        '2026-07-01 09:00:25',
        24800,
        'SUCCESS',
        TRUE,
        1
    ),
    (
        5,
        1,
        'exec-uuid-0005',
        NULL,
        'SCHEDULED',
        'PDF',
        NULL,
        NULL,
        NULL,
        '2026-07-06 23:55:00',
        NULL,
        NULL,
        'RUNNING',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 14: SEED ANALYTICS VISITOR SUMMARY
-- =====================================================================================
INSERT INTO
    analytics_visitor_summary (
        id,
        summary_date,
        summary_hour,
        granularity,
        facility_id,
        building_id,
        total_visitors,
        new_visitors,
        returning_visitors,
        pre_registered_visitors,
        walk_in_visitors,
        vip_visitors,
        contractor_visitors,
        approved_visitors,
        rejected_visitors,
        cancelled_visitors,
        blacklisted_attempts,
        average_visit_duration_minutes,
        peak_visitor_count,
        is_active,
        created_by
    )
VALUES (
        1,
        '2026-07-05',
        NULL,
        'DAILY',
        NULL,
        NULL,
        45,
        12,
        33,
        38,
        7,
        3,
        5,
        42,
        2,
        1,
        1,
        420,
        18,
        TRUE,
        1
    ),
    (
        2,
        '2026-07-05',
        10,
        'HOURLY',
        NULL,
        NULL,
        12,
        4,
        8,
        10,
        2,
        1,
        1,
        11,
        1,
        0,
        0,
        NULL,
        12,
        TRUE,
        1
    ),
    (
        3,
        '2026-07-05',
        14,
        'HOURLY',
        NULL,
        NULL,
        8,
        2,
        6,
        7,
        1,
        1,
        0,
        8,
        0,
        0,
        0,
        NULL,
        8,
        TRUE,
        1
    ),
    (
        4,
        '2026-07-04',
        NULL,
        'DAILY',
        NULL,
        NULL,
        38,
        8,
        30,
        35,
        3,
        2,
        4,
        37,
        1,
        0,
        0,
        390,
        15,
        TRUE,
        1
    ),
    (
        5,
        '2026-06-01',
        NULL,
        'MONTHLY',
        NULL,
        NULL,
        890,
        180,
        710,
        780,
        110,
        45,
        85,
        850,
        28,
        12,
        3,
        405,
        42,
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 14: SEED ANALYTICS CHECKIN SUMMARY
-- =====================================================================================
INSERT INTO
    analytics_checkin_summary (
        id,
        summary_date,
        summary_hour,
        granularity,
        facility_id,
        building_id,
        total_checkins,
        qr_checkins,
        rfid_checkins,
        manual_checkins,
        kiosk_checkins,
        biometric_checkins,
        average_checkin_time_seconds,
        min_checkin_time_seconds,
        max_checkin_time_seconds,
        peak_hour,
        peak_hour_count,
        failed_checkins,
        average_wait_time_minutes,
        is_active,
        created_by
    )
VALUES (
        1,
        '2026-07-05',
        NULL,
        'DAILY',
        NULL,
        NULL,
        45,
        20,
        10,
        8,
        5,
        2,
        35,
        8,
        180,
        10,
        12,
        3,
        4,
        TRUE,
        1
    ),
    (
        2,
        '2026-07-05',
        10,
        'HOURLY',
        NULL,
        NULL,
        12,
        6,
        3,
        2,
        1,
        0,
        28,
        8,
        95,
        NULL,
        NULL,
        1,
        3,
        TRUE,
        1
    ),
    (
        3,
        '2026-07-04',
        NULL,
        'DAILY',
        NULL,
        NULL,
        38,
        18,
        8,
        7,
        4,
        1,
        32,
        10,
        150,
        9,
        10,
        1,
        5,
        TRUE,
        1
    ),
    (
        4,
        '2026-06-01',
        NULL,
        'MONTHLY',
        NULL,
        NULL,
        890,
        420,
        200,
        150,
        90,
        30,
        38,
        5,
        300,
        10,
        280,
        22,
        6,
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 14: SEED ANALYTICS CHECKOUT SUMMARY
-- =====================================================================================
INSERT INTO
    analytics_checkout_summary (
        id,
        summary_date,
        summary_hour,
        granularity,
        facility_id,
        building_id,
        total_checkouts,
        normal_checkouts,
        late_checkouts,
        forced_checkouts,
        no_show_checkouts,
        average_checkout_time_seconds,
        average_visit_duration_minutes,
        max_visit_duration_minutes,
        overtime_count,
        assets_returned,
        assets_missing,
        feedback_submissions,
        average_feedback_rating,
        is_active,
        created_by
    )
VALUES (
        1,
        '2026-07-05',
        NULL,
        'DAILY',
        NULL,
        NULL,
        43,
        38,
        3,
        1,
        1,
        45,
        420,
        540,
        4,
        28,
        1,
        18,
        4.50,
        TRUE,
        1
    ),
    (
        2,
        '2026-07-04',
        NULL,
        'DAILY',
        NULL,
        NULL,
        37,
        35,
        2,
        0,
        0,
        40,
        390,
        480,
        2,
        22,
        0,
        15,
        4.70,
        TRUE,
        1
    ),
    (
        3,
        '2026-06-01',
        NULL,
        'MONTHLY',
        NULL,
        NULL,
        875,
        810,
        45,
        12,
        8,
        42,
        405,
        720,
        55,
        580,
        4,
        320,
        4.35,
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 14: SEED ANALYTICS SECURITY SUMMARY
-- =====================================================================================
INSERT INTO
    analytics_security_summary (
        id,
        summary_date,
        summary_hour,
        granularity,
        facility_id,
        building_id,
        total_incidents,
        critical_incidents,
        high_risk_incidents,
        medium_risk_incidents,
        low_risk_incidents,
        unauthorized_access_attempts,
        denied_entries,
        tailgating_incidents,
        fake_credential_attempts,
        alerts_triggered,
        lockdowns_activated,
        patrols_completed,
        patrols_missed,
        surveillance_events,
        resolved_incidents,
        avg_resolution_time_minutes,
        risk_score,
        risk_level,
        is_active,
        created_by
    )
VALUES (
        1,
        '2026-07-05',
        NULL,
        'DAILY',
        NULL,
        NULL,
        4,
        0,
        1,
        1,
        2,
        1,
        3,
        1,
        0,
        5,
        0,
        3,
        0,
        5,
        4,
        25,
        12.50,
        'LOW',
        TRUE,
        1
    ),
    (
        2,
        '2026-06-22',
        NULL,
        'DAILY',
        NULL,
        NULL,
        3,
        1,
        1,
        0,
        1,
        2,
        2,
        0,
        1,
        4,
        0,
        3,
        0,
        3,
        3,
        45,
        35.00,
        'MEDIUM',
        TRUE,
        1
    ),
    (
        3,
        '2026-06-01',
        NULL,
        'MONTHLY',
        NULL,
        NULL,
        18,
        2,
        5,
        6,
        5,
        8,
        15,
        3,
        2,
        22,
        1,
        90,
        2,
        45,
        16,
        30,
        18.75,
        'LOW',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 14: SEED ANALYTICS NOTIFICATION SUMMARY
-- =====================================================================================
INSERT INTO
    analytics_notification_summary (
        id,
        summary_date,
        summary_hour,
        granularity,
        channel_type,
        total_created,
        total_queued,
        total_sent,
        total_delivered,
        total_read,
        total_clicked,
        total_bounced,
        total_failed,
        total_expired,
        total_unsubscribed,
        delivery_rate,
        open_rate,
        click_rate,
        bounce_rate,
        failure_rate,
        avg_delivery_latency_ms,
        avg_time_to_read_minutes,
        emergency_notifications,
        campaign_notifications,
        is_active,
        created_by
    )
VALUES (
        1,
        '2026-07-05',
        NULL,
        'DAILY',
        'ALL',
        85,
        85,
        85,
        82,
        67,
        13,
        1,
        2,
        0,
        0,
        96.47,
        81.71,
        15.85,
        1.18,
        2.35,
        1200,
        5,
        3,
        45,
        TRUE,
        1
    ),
    (
        2,
        '2026-07-05',
        NULL,
        'DAILY',
        'EMAIL',
        28,
        28,
        28,
        26,
        20,
        5,
        1,
        1,
        0,
        0,
        92.86,
        76.92,
        19.23,
        3.57,
        3.57,
        2150,
        8,
        1,
        12,
        TRUE,
        1
    ),
    (
        3,
        '2026-07-05',
        NULL,
        'DAILY',
        'PUSH',
        15,
        15,
        15,
        14,
        12,
        0,
        0,
        1,
        0,
        0,
        93.33,
        85.71,
        0.00,
        0.00,
        6.67,
        380,
        2,
        1,
        8,
        TRUE,
        1
    ),
    (
        4,
        '2026-07-05',
        NULL,
        'DAILY',
        'IN_APP',
        42,
        42,
        42,
        42,
        35,
        8,
        0,
        0,
        0,
        0,
        100.00,
        83.33,
        19.05,
        0.00,
        0.00,
        5,
        5,
        1,
        25,
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 14: SEED KPI METRICS
-- =====================================================================================
INSERT INTO
    kpi_metrics (
        id,
        kpi_code,
        kpi_name,
        kpi_category,
        kpi_value,
        kpi_unit,
        previous_value,
        trend_direction,
        trend_percentage,
        calculation_method,
        data_source_module,
        threshold_min,
        threshold_max,
        threshold_critical_min,
        threshold_critical_max,
        threshold_status,
        measurement_period,
        last_calculated_at,
        target_value,
        display_order,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'KPI-AVG-CHECKIN-TIME',
        'Average Check-In Time',
        'EFFICIENCY',
        35.0000,
        'seconds',
        42.0000,
        'DOWN',
        -16.67,
        'AVERAGE',
        'CHECKIN',
        15.0000,
        60.0000,
        10.0000,
        120.0000,
        'NORMAL',
        'DAILY',
        '2026-07-05 23:59:00',
        30.0000,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'KPI-VISITOR-SATISFACTION',
        'Visitor Satisfaction Score',
        'SATISFACTION',
        4.5000,
        'score',
        4.3000,
        'UP',
        4.65,
        'AVERAGE',
        'CHECKOUT',
        3.5000,
        NULL,
        3.0000,
        NULL,
        'NORMAL',
        'DAILY',
        '2026-07-05 23:59:00',
        4.8000,
        2,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'KPI-SECURITY-RISK',
        'Facility Security Risk Score',
        'SECURITY',
        12.5000,
        'score',
        18.7500,
        'DOWN',
        -33.33,
        'CUSTOM',
        'SECURITY',
        NULL,
        30.0000,
        NULL,
        50.0000,
        'NORMAL',
        'DAILY',
        '2026-07-05 23:59:00',
        10.0000,
        3,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'KPI-NOTIFICATION-DELIVERY',
        'Notification Delivery Rate',
        'PERFORMANCE',
        96.4700,
        '%',
        94.2000,
        'UP',
        2.41,
        'PERCENTAGE',
        'NOTIFICATION',
        90.0000,
        NULL,
        80.0000,
        NULL,
        'NORMAL',
        'DAILY',
        '2026-07-05 23:59:00',
        99.0000,
        4,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'KPI-SYSTEM-UPTIME',
        'System Uptime',
        'PERFORMANCE',
        99.9800,
        '%',
        99.9500,
        'UP',
        0.03,
        'PERCENTAGE',
        'SYSTEM',
        99.5000,
        NULL,
        99.0000,
        NULL,
        'NORMAL',
        'MONTHLY',
        '2026-07-05 23:59:00',
        99.9900,
        5,
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 14: SEED DASHBOARD WIDGETS
-- =====================================================================================
INSERT INTO
    dashboard_widgets (
        id,
        widget_code,
        widget_name,
        widget_type,
        data_source,
        refresh_interval_seconds,
        min_role_level,
        dashboard_section,
        display_order,
        default_time_range,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'WDG-VISITOR-TREND',
        'Visitor Trend (7 Days)',
        'CHART_LINE',
        'VISITOR_SUMMARY',
        300,
        1,
        'OVERVIEW',
        1,
        'LAST_7_DAYS',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'WDG-CHECKIN-METHODS',
        'Check-In Methods Breakdown',
        'CHART_PIE',
        'CHECKIN_SUMMARY',
        300,
        1,
        'OPERATIONS',
        2,
        'TODAY',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'WDG-SECURITY-RISK',
        'Security Risk Gauge',
        'GAUGE',
        'SECURITY_SUMMARY',
        60,
        3,
        'SECURITY',
        1,
        'TODAY',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'WDG-KPI-CARDS',
        'Key Metrics Overview',
        'KPI_CARD',
        'KPI_METRIC',
        120,
        1,
        'OVERVIEW',
        0,
        'TODAY',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'WDG-SYS-HEALTH',
        'System Health Monitor',
        'GAUGE',
        'SYSTEM_PERFORMANCE',
        30,
        4,
        'PERFORMANCE',
        1,
        'TODAY',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        6,
        'WDG-NOTIF-FUNNEL',
        'Notification Delivery Funnel',
        'CHART_BAR',
        'NOTIFICATION_SUMMARY',
        300,
        2,
        'OPERATIONS',
        3,
        'LAST_7_DAYS',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        7,
        'WDG-VISITOR-HEATMAP',
        'Visitor Activity Heatmap',
        'HEATMAP',
        'VISITOR_SUMMARY',
        600,
        2,
        'VISITOR',
        1,
        'LAST_30_DAYS',
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 14: SEED AUDIT REPORT LOGS
-- =====================================================================================
INSERT INTO
    audit_report_logs (
        id,
        user_id,
        report_id,
        execution_id,
        action_type,
        resource_type,
        resource_name,
        export_format,
        access_time,
        ip_address,
        duration_ms,
        data_rows_accessed,
        is_active,
        created_by
    )
VALUES (
        1,
        1,
        1,
        1,
        'VIEW',
        'REPORT',
        'Daily Visitor Summary Report',
        NULL,
        '2026-07-06 08:30:00',
        '192.168.1.100',
        15000,
        156,
        TRUE,
        1
    ),
    (
        2,
        1,
        4,
        4,
        'DOWNLOAD',
        'EXPORT_FILE',
        'Executive Monthly Dashboard - June 2026',
        'PDF',
        '2026-07-06 08:35:00',
        '192.168.1.100',
        2000,
        320,
        TRUE,
        1
    ),
    (
        3,
        3,
        3,
        3,
        'EXPORT',
        'REPORT',
        'Check-In Performance Analysis',
        'EXCEL',
        '2026-07-05 16:05:00',
        '192.168.1.105',
        3000,
        89,
        TRUE,
        3
    ),
    (
        4,
        1,
        NULL,
        NULL,
        'VIEW',
        'DASHBOARD',
        'Executive Overview Dashboard',
        NULL,
        '2026-07-06 09:00:00',
        '192.168.1.100',
        45000,
        NULL,
        TRUE,
        1
    ),
    (
        5,
        8,
        NULL,
        NULL,
        'VIEW',
        'WIDGET',
        'Security Risk Gauge',
        NULL,
        '2026-07-06 07:00:00',
        '192.168.1.110',
        8000,
        NULL,
        TRUE,
        8
    );

-- =====================================================================================
-- MODULE 14: SEED SYSTEM PERFORMANCE METRICS
-- =====================================================================================
INSERT INTO
    system_performance_metrics (
        id,
        metric_timestamp,
        granularity,
        server_node,
        cpu_usage_percent,
        memory_usage_percent,
        memory_used_mb,
        memory_total_mb,
        disk_usage_percent,
        api_requests_count,
        api_avg_latency_ms,
        api_p95_latency_ms,
        api_p99_latency_ms,
        api_error_count,
        api_error_rate,
        db_active_connections,
        db_avg_query_time_ms,
        db_slow_queries_count,
        db_deadlocks_count,
        active_users_count,
        active_visitors_count,
        queue_depth,
        uptime_percent,
        health_status,
        is_active,
        created_by
    )
VALUES (
        1,
        '2026-07-05 10:00:00',
        'FIVE_MINUTE',
        'vms-prod-01',
        42.50,
        68.30,
        2186,
        3200,
        45.20,
        340,
        125,
        380,
        720,
        2,
        0.59,
        45,
        15,
        1,
        0,
        28,
        18,
        3,
        99.99,
        'HEALTHY',
        TRUE,
        1
    ),
    (
        2,
        '2026-07-05 10:05:00',
        'FIVE_MINUTE',
        'vms-prod-01',
        55.80,
        72.10,
        2307,
        3200,
        45.20,
        520,
        145,
        420,
        850,
        3,
        0.58,
        52,
        18,
        2,
        0,
        32,
        22,
        5,
        99.99,
        'HEALTHY',
        TRUE,
        1
    ),
    (
        3,
        '2026-07-05 14:00:00',
        'FIVE_MINUTE',
        'vms-prod-01',
        78.20,
        85.40,
        2733,
        3200,
        45.30,
        890,
        210,
        650,
        1200,
        8,
        0.90,
        68,
        25,
        4,
        0,
        45,
        35,
        12,
        99.98,
        'DEGRADED',
        TRUE,
        1
    ),
    (
        4,
        '2026-07-05 00:00:00',
        'DAILY',
        'vms-prod-01',
        38.50,
        62.00,
        1984,
        3200,
        45.20,
        15200,
        135,
        400,
        780,
        45,
        0.30,
        35,
        12,
        15,
        0,
        12,
        0,
        0,
        99.99,
        'HEALTHY',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 14: SEED SCHEDULED REPORT JOBS
-- =====================================================================================
INSERT INTO
    scheduled_report_jobs (
        id,
        job_code,
        job_name,
        report_id,
        frequency,
        schedule_time,
        schedule_timezone,
        schedule_day_of_week,
        parameters_json,
        output_format,
        delivery_method,
        notification_on_failure,
        max_retries,
        timeout_minutes,
        last_run_time,
        last_run_status,
        last_run_duration_ms,
        next_run_time,
        total_runs,
        total_failures,
        owner_user_id,
        job_status,
        is_active,
        created_by
    )
VALUES (
        1,
        'JOB-VISITOR-DAILY',
        'Daily Visitor Summary Generator',
        1,
        'DAILY',
        '23:55:00',
        'America/Los_Angeles',
        NULL,
        '{"date_range":"yesterday"}',
        'PDF',
        'BOTH',
        TRUE,
        2,
        15,
        '2026-07-05 23:55:00',
        'SUCCESS',
        8200,
        '2026-07-06 23:55:00',
        180,
        2,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'JOB-SECURITY-WEEKLY',
        'Weekly Security Report Generator',
        2,
        'WEEKLY',
        '23:58:00',
        'America/Los_Angeles',
        5,
        '{"date_range":"last_week"}',
        'PDF',
        'EMAIL',
        TRUE,
        2,
        20,
        '2026-07-05 23:58:00',
        'SUCCESS',
        5100,
        '2026-07-12 23:58:00',
        26,
        0,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'JOB-EXEC-MONTHLY',
        'Monthly Executive Summary Generator',
        4,
        'MONTHLY',
        '09:00:00',
        'America/Los_Angeles',
        NULL,
        '{"date_range":"last_month"}',
        'PDF',
        'BOTH',
        TRUE,
        3,
        30,
        '2026-07-01 09:00:00',
        'SUCCESS',
        24800,
        '2026-08-01 09:00:00',
        6,
        0,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'JOB-COMPLIANCE-MONTHLY',
        'Monthly Compliance Audit Generator',
        5,
        'MONTHLY',
        '06:00:00',
        'UTC',
        NULL,
        '{"date_range":"last_month","include_pii":false}',
        'PDF',
        'STORAGE',
        TRUE,
        3,
        45,
        '2026-07-01 06:00:00',
        'SUCCESS',
        35200,
        '2026-08-01 06:00:00',
        6,
        1,
        1,
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 15: SEED SYSTEM AUDIT LOGS
-- =====================================================================================
INSERT INTO
    system_audit_logs (
        id,
        audit_uid,
        user_id,
        module_name,
        action_type,
        entity_name,
        entity_id,
        old_values,
        new_values,
        change_summary,
        ip_address,
        http_method,
        endpoint,
        outcome,
        severity,
        risk_score,
        execution_time_ms,
        created_at,
        created_by
    )
VALUES (
        1,
        'sal-uuid-0001',
        1,
        'AUTHENTICATION',
        'LOGIN',
        'users',
        1,
        NULL,
        '{"login_method":"password","mfa_verified":true}',
        'Admin user logged in with MFA',
        '192.168.1.100',
        'POST',
        '/api/auth/login',
        'SUCCESS',
        'INFO',
        0,
        250,
        '2026-07-06 08:00:00',
        1
    ),
    (
        2,
        'sal-uuid-0002',
        3,
        'VISITOR',
        'CREATE',
        'visitors',
        5,
        NULL,
        '{"name":"David Kim","company":"CloudTech","visit_type":"BUSINESS"}',
        'New visitor pre-registered by host',
        '192.168.1.105',
        'POST',
        '/api/visitors',
        'SUCCESS',
        'LOW',
        5,
        180,
        '2026-07-06 09:00:00',
        3
    ),
    (
        3,
        'sal-uuid-0003',
        NULL,
        'SECURITY',
        'ACCESS',
        'access_points',
        1,
        NULL,
        '{"visitor_id":3,"access_result":"DENIED","reason":"counterfeit_qr"}',
        'Visitor access denied - counterfeit QR code detected',
        '10.0.1.50',
        'POST',
        '/api/security/access-check',
        'DENIED',
        'CRITICAL',
        95,
        45,
        '2026-06-22 14:00:00',
        NULL
    ),
    (
        4,
        'sal-uuid-0004',
        1,
        'SYSTEM_ADMIN',
        'CONFIGURE',
        'system_configurations',
        12,
        '{"config_value":"30"}',
        '{"config_value":"15"}',
        'Session idle timeout reduced from 30 to 15 minutes',
        '192.168.1.100',
        'PUT',
        '/api/admin/config/session.idle_timeout',
        'SUCCESS',
        'MEDIUM',
        20,
        85,
        '2026-07-06 08:15:00',
        1
    ),
    (
        5,
        'sal-uuid-0005',
        8,
        'CHECKIN',
        'CREATE',
        'visitor_checkins',
        1,
        NULL,
        '{"visitor_id":1,"method":"QR_CODE","gate":"Main Entrance"}',
        'Visitor John Smith checked in via QR code at Main Entrance',
        '10.0.1.50',
        'POST',
        '/api/checkin',
        'SUCCESS',
        'INFO',
        0,
        320,
        '2026-07-05 10:05:00',
        8
    );

-- =====================================================================================
-- MODULE 15: SEED SYSTEM CONFIGURATIONS
-- =====================================================================================
INSERT INTO
    system_configurations (
        id,
        config_key,
        config_value,
        config_type,
        config_category,
        module_scope,
        description,
        default_value,
        is_editable,
        is_sensitive,
        is_feature_flag,
        requires_restart,
        version,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'system.name',
        'Hybrid-Tech Visitor Management System',
        'STRING',
        'GENERAL',
        'GLOBAL',
        'Display name of the VMS platform',
        'Enterprise Visitor Management System',
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'auth.session.idle_timeout_minutes',
        '30',
        'INTEGER',
        'AUTHENTICATION',
        'AUTHENTICATION',
        'Session idle timeout in minutes before auto-logout',
        '30',
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'auth.session.max_lifetime_hours',
        '8',
        'INTEGER',
        'AUTHENTICATION',
        'AUTHENTICATION',
        'Maximum session lifetime in hours regardless of activity',
        '8',
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'auth.login.max_failed_attempts',
        '5',
        'INTEGER',
        'SECURITY',
        'AUTHENTICATION',
        'Maximum failed login attempts before account lockout',
        '5',
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'auth.mfa.enabled',
        'true',
        'BOOLEAN',
        'SECURITY',
        'AUTHENTICATION',
        'Enable multi-factor authentication system-wide',
        'false',
        TRUE,
        FALSE,
        TRUE,
        FALSE,
        2,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        6,
        'visitor.pass.default_expiry_hours',
        '12',
        'INTEGER',
        'VISITOR',
        'PASS',
        'Default visitor pass validity in hours',
        '8',
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        7,
        'notification.email.provider',
        'SendGrid',
        'STRING',
        'NOTIFICATION',
        'NOTIFICATION',
        'Primary email delivery provider',
        'SendGrid',
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        8,
        'notification.email.api_key',
        '***ENCRYPTED***',
        'ENCRYPTED',
        'NOTIFICATION',
        'NOTIFICATION',
        'Email provider API key (encrypted at rest)',
        NULL,
        TRUE,
        TRUE,
        FALSE,
        FALSE,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        9,
        'security.ip_blocklist.enabled',
        'true',
        'BOOLEAN',
        'SECURITY',
        'SECURITY',
        'Enable IP-based blocking for suspicious activity',
        'true',
        TRUE,
        FALSE,
        TRUE,
        FALSE,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        10,
        'feature.ai_surveillance.enabled',
        'false',
        'BOOLEAN',
        'FEATURE_FLAG',
        'SECURITY',
        'Enable AI-powered surveillance event detection',
        'false',
        TRUE,
        FALSE,
        TRUE,
        TRUE,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        11,
        'reporting.data_retention_days',
        '365',
        'INTEGER',
        'COMPLIANCE',
        'REPORTING',
        'Number of days to retain report data before archival',
        '365',
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        12,
        'system.maintenance_mode',
        'false',
        'BOOLEAN',
        'GENERAL',
        'GLOBAL',
        'Enable maintenance mode (blocks all non-admin access)',
        'false',
        TRUE,
        FALSE,
        TRUE,
        FALSE,
        1,
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 15: SEED SYSTEM SECURITY EVENTS
-- =====================================================================================
INSERT INTO
    system_security_events (
        id,
        event_uid,
        event_type,
        severity,
        user_id,
        ip_address,
        geo_country,
        geo_city,
        device_type,
        device_os,
        device_browser,
        threat_indicator,
        risk_score,
        action_taken,
        notification_sent,
        is_resolved,
        event_time,
        is_active,
        created_by
    )
VALUES (
        1,
        'sse-uuid-0001',
        'LOGIN_FAILURE',
        'LOW',
        5,
        '192.168.1.200',
        'United States',
        'San Francisco',
        'desktop',
        'Windows 11',
        'Chrome 120',
        'Wrong password attempt 1/5',
        10,
        'LOGGED',
        FALSE,
        TRUE,
        '2026-07-05 08:45:00',
        TRUE,
        NULL
    ),
    (
        2,
        'sse-uuid-0002',
        'BRUTE_FORCE',
        'HIGH',
        5,
        '103.42.55.12',
        'Nigeria',
        'Lagos',
        'desktop',
        'Linux',
        'curl/7.88',
        '15 failed login attempts in 2 minutes from external IP',
        85,
        'IP_BANNED',
        TRUE,
        TRUE,
        '2026-07-04 03:22:00',
        TRUE,
        NULL
    ),
    (
        3,
        'sse-uuid-0003',
        'UNAUTHORIZED_ACCESS',
        'CRITICAL',
        NULL,
        '10.0.1.50',
        'United States',
        'San Francisco',
        'unknown',
        NULL,
        NULL,
        'Counterfeit QR code presented at Main Entrance Gate',
        95,
        'BLOCKED',
        TRUE,
        TRUE,
        '2026-06-22 14:00:00',
        TRUE,
        8
    ),
    (
        4,
        'sse-uuid-0004',
        'RATE_LIMIT_EXCEEDED',
        'MEDIUM',
        7,
        '192.168.1.108',
        'United States',
        'San Francisco',
        'desktop',
        'macOS 14',
        'Safari 17',
        'API rate limit exceeded: 120 requests/minute (limit: 100)',
        40,
        'RATE_LIMITED',
        FALSE,
        TRUE,
        '2026-07-06 11:30:00',
        TRUE,
        NULL
    ),
    (
        5,
        'sse-uuid-0005',
        'SUSPICIOUS_ACTIVITY',
        'HIGH',
        3,
        '45.33.32.156',
        'Russia',
        'Moscow',
        'mobile',
        'Android 14',
        'Chrome 120',
        'Login from unusual location (user normally in US)',
        70,
        'MFA_REQUIRED',
        TRUE,
        FALSE,
        '2026-07-06 02:15:00',
        TRUE,
        NULL
    );

-- =====================================================================================
-- MODULE 15: SEED SYSTEM HEALTH MONITORING
-- =====================================================================================
INSERT INTO
    system_health_monitoring (
        id,
        metric_uid,
        metric_timestamp,
        collection_interval,
        server_node,
        service_name,
        cpu_usage_percent,
        cpu_load_avg_1m,
        memory_usage_percent,
        memory_used_mb,
        memory_available_mb,
        disk_usage_percent,
        api_requests_total,
        api_latency_avg_ms,
        api_latency_p95_ms,
        api_latency_p99_ms,
        api_errors_total,
        api_error_rate,
        db_connections_active,
        db_latency_avg_ms,
        db_slow_queries,
        db_deadlocks,
        active_sessions,
        active_visitors,
        notification_queue_depth,
        error_rate,
        uptime_seconds,
        health_status,
        is_active,
        created_by
    )
VALUES (
        1,
        'shm-uuid-0001',
        '2026-07-06 10:00:00',
        'MINUTE',
        'vms-prod-01',
        'api-gateway',
        35.20,
        1.20,
        62.50,
        2000,
        1200,
        42.80,
        85,
        120,
        350,
        680,
        0,
        0.00,
        42,
        12,
        0,
        0,
        25,
        15,
        2,
        0.00,
        864000,
        'HEALTHY',
        TRUE,
        1
    ),
    (
        2,
        'shm-uuid-0002',
        '2026-07-06 10:01:00',
        'MINUTE',
        'vms-prod-01',
        'api-gateway',
        38.50,
        1.35,
        64.20,
        2054,
        1146,
        42.80,
        92,
        135,
        380,
        720,
        1,
        1.09,
        44,
        14,
        0,
        0,
        26,
        15,
        3,
        1.09,
        864060,
        'HEALTHY',
        TRUE,
        1
    ),
    (
        3,
        'shm-uuid-0003',
        '2026-07-06 14:00:00',
        'MINUTE',
        'vms-prod-01',
        'api-gateway',
        82.30,
        3.80,
        88.50,
        2832,
        368,
        43.10,
        210,
        285,
        890,
        1500,
        12,
        5.71,
        72,
        35,
        5,
        0,
        48,
        38,
        18,
        5.71,
        878400,
        'WARNING',
        TRUE,
        1
    ),
    (
        4,
        'shm-uuid-0004',
        '2026-07-06 00:00:00',
        'DAILY',
        'vms-prod-01',
        'all',
        42.10,
        1.80,
        68.00,
        2176,
        1024,
        42.90,
        18500,
        145,
        420,
        800,
        52,
        0.28,
        38,
        14,
        18,
        0,
        15,
        0,
        0,
        0.28,
        950400,
        'HEALTHY',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 15: SEED USER ACTIVITY LOGS
-- =====================================================================================
INSERT INTO
    user_activity_logs (
        id,
        activity_uid,
        user_id,
        activity_type,
        activity_category,
        module_name,
        resource_path,
        resource_name,
        login_time,
        ip_address,
        device_type,
        device_browser,
        session_id,
        response_time_ms,
        activity_time,
        is_active,
        created_by
    )
VALUES (
        1,
        'ual-uuid-0001',
        1,
        'LOGIN',
        'AUTHENTICATION',
        'AUTHENTICATION',
        '/api/auth/login',
        'User Login',
        '2026-07-06 08:00:00',
        '192.168.1.100',
        'desktop',
        'Chrome 120',
        'sess-admin-001',
        250,
        '2026-07-06 08:00:00',
        TRUE,
        1
    ),
    (
        2,
        'ual-uuid-0002',
        1,
        'DASHBOARD_VIEW',
        'NAVIGATION',
        'REPORTING',
        '/dashboard/executive',
        'Executive Dashboard',
        NULL,
        '192.168.1.100',
        'desktop',
        'Chrome 120',
        'sess-admin-001',
        450,
        '2026-07-06 08:01:00',
        TRUE,
        1
    ),
    (
        3,
        'ual-uuid-0003',
        3,
        'VISITOR_CHECKIN',
        'DATA_MODIFICATION',
        'CHECKIN',
        '/api/checkin',
        'Visitor Check-In',
        NULL,
        '192.168.1.105',
        'desktop',
        'Firefox 125',
        'sess-host-003',
        320,
        '2026-07-05 10:05:00',
        TRUE,
        3
    ),
    (
        4,
        'ual-uuid-0004',
        1,
        'REPORT_EXPORT',
        'REPORTING',
        'REPORTING',
        '/api/reports/1/export',
        'Daily Visitor Summary Export',
        NULL,
        '192.168.1.100',
        'desktop',
        'Chrome 120',
        'sess-admin-001',
        3400,
        '2026-07-06 08:35:00',
        TRUE,
        1
    ),
    (
        5,
        'ual-uuid-0005',
        8,
        'SECURITY_ACTION',
        'SECURITY',
        'SECURITY',
        '/api/security/incidents/3',
        'Security Incident Review',
        NULL,
        '192.168.1.110',
        'desktop',
        'Chrome 120',
        'sess-sec-008',
        180,
        '2026-06-22 14:05:00',
        TRUE,
        8
    );

-- =====================================================================================
-- MODULE 15: SEED SESSION MANAGEMENT
-- =====================================================================================
INSERT INTO
    session_management (
        id,
        session_uid,
        user_id,
        session_type,
        start_time,
        last_activity_time,
        end_time,
        session_duration_seconds,
        ip_address,
        current_ip_address,
        device_type,
        device_os,
        device_browser,
        geo_country,
        geo_city,
        total_requests,
        total_page_views,
        is_concurrent,
        session_status,
        is_active,
        created_by
    )
VALUES (
        1,
        'sess-admin-001',
        1,
        'WEB',
        '2026-07-06 08:00:00',
        '2026-07-06 12:30:00',
        NULL,
        NULL,
        '192.168.1.100',
        '192.168.1.100',
        'desktop',
        'Windows 11',
        'Chrome 120',
        'United States',
        'San Francisco',
        342,
        45,
        FALSE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'sess-host-003',
        3,
        'WEB',
        '2026-07-06 08:30:00',
        '2026-07-06 11:45:00',
        '2026-07-06 12:00:00',
        12600,
        '192.168.1.105',
        '192.168.1.105',
        'desktop',
        'macOS 14',
        'Firefox 125',
        'United States',
        'San Francisco',
        185,
        28,
        FALSE,
        'EXPIRED',
        TRUE,
        3
    ),
    (
        3,
        'sess-sec-008',
        8,
        'WEB',
        '2026-07-06 07:00:00',
        '2026-07-06 13:00:00',
        NULL,
        NULL,
        '192.168.1.110',
        '192.168.1.110',
        'desktop',
        'Windows 11',
        'Chrome 120',
        'United States',
        'San Francisco',
        520,
        62,
        FALSE,
        'ACTIVE',
        TRUE,
        8
    ),
    (
        4,
        'sess-kiosk-001',
        NULL,
        'KIOSK',
        '2026-07-06 06:00:00',
        '2026-07-06 12:45:00',
        NULL,
        NULL,
        '10.0.1.50',
        '10.0.1.50',
        'kiosk',
        'Linux',
        'Chromium Kiosk',
        'United States',
        'San Francisco',
        1200,
        0,
        FALSE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'sess-mobile-007',
        7,
        'MOBILE',
        '2026-07-05 09:00:00',
        '2026-07-05 09:45:00',
        '2026-07-05 10:30:00',
        5400,
        '192.168.1.108',
        '192.168.1.108',
        'mobile',
        'iOS 17',
        'Safari 17',
        'United States',
        'San Francisco',
        42,
        12,
        FALSE,
        'EXPIRED',
        TRUE,
        7
    );

-- =====================================================================================
-- MODULE 15: SEED SYSTEM ERROR LOGS
-- =====================================================================================
INSERT INTO
    system_error_logs (
        id,
        error_uid,
        module_name,
        error_code,
        error_type,
        error_message,
        stack_trace,
        severity,
        user_id,
        ip_address,
        request_url,
        request_method,
        response_status_code,
        correlation_id,
        occurrence_count,
        first_occurred_at,
        last_occurred_at,
        is_resolved,
        error_time,
        is_active,
        created_by
    )
VALUES (
        1,
        'sel-uuid-0001',
        'NOTIFICATION',
        'ERR-NOTIF-SEND-001',
        'INTEGRATION',
        'SendGrid API timeout: connection reset after 30000ms',
        'at NotificationService.send() line 245\n  at QueueWorker.process() line 180\n  at Worker.run() line 55',
        'ERROR',
        NULL,
        NULL,
        '/internal/notification/send',
        'POST',
        504,
        'corr-notif-timeout-001',
        3,
        '2026-07-05 14:20:00',
        '2026-07-05 14:35:00',
        TRUE,
        '2026-07-05 14:20:00',
        TRUE,
        NULL
    ),
    (
        2,
        'sel-uuid-0002',
        'CHECKIN',
        'ERR-CHECKIN-QR-002',
        'VALIDATION',
        'QR code validation failed: expired token (exp: 2026-07-04T18:00:00Z)',
        NULL,
        'WARNING',
        8,
        '10.0.1.50',
        '/api/checkin/qr-validate',
        'POST',
        400,
        'corr-qr-expired-001',
        1,
        '2026-07-05 09:15:00',
        '2026-07-05 09:15:00',
        TRUE,
        '2026-07-05 09:15:00',
        TRUE,
        NULL
    ),
    (
        3,
        'sel-uuid-0003',
        'AUTHENTICATION',
        'ERR-AUTH-DB-003',
        'DATABASE',
        'Deadlock detected during concurrent login session creation',
        'at SessionDAO.create() line 88\n  at AuthService.createSession() line 312\n  at LoginController.login() line 45',
        'CRITICAL',
        NULL,
        '192.168.1.200',
        '/api/auth/login',
        'POST',
        500,
        'corr-deadlock-001',
        1,
        '2026-07-06 10:15:00',
        '2026-07-06 10:15:00',
        FALSE,
        '2026-07-06 10:15:00',
        TRUE,
        NULL
    ),
    (
        4,
        'sel-uuid-0004',
        'REPORTING',
        'ERR-RPT-GEN-004',
        'TIMEOUT',
        'Report generation timeout: execution exceeded 300000ms limit',
        'at ReportEngine.execute() line 420\n  at ScheduledJobRunner.run() line 150',
        'ERROR',
        NULL,
        NULL,
        '/internal/reports/generate',
        'POST',
        504,
        'corr-rpt-timeout-001',
        1,
        '2026-07-04 23:59:00',
        '2026-07-04 23:59:00',
        TRUE,
        '2026-07-04 23:59:00',
        TRUE,
        NULL
    );

-- =====================================================================================
-- MODULE 15: SEED ACCESS CONTROL AUDIT LOGS
-- =====================================================================================
INSERT INTO
    access_control_audit_logs (
        id,
        access_uid,
        user_id,
        resource_type,
        resource_name,
        required_permission,
        user_role,
        access_status,
        denial_reason,
        ip_address,
        session_id,
        access_time,
        is_active,
        created_by
    )
VALUES (
        1,
        'acal-uuid-0001',
        1,
        'PAGE',
        '/admin/system-config',
        'admin.config.view',
        'SUPER_ADMIN',
        'ALLOWED',
        NULL,
        '192.168.1.100',
        'sess-admin-001',
        '2026-07-06 08:10:00',
        TRUE,
        1
    ),
    (
        2,
        'acal-uuid-0002',
        3,
        'REPORT',
        'Weekly Security Incident Report',
        'reports.security.view',
        'HOST',
        'DENIED',
        'Insufficient role level: required level 3, user level 1',
        '192.168.1.105',
        'sess-host-003',
        '2026-07-06 09:30:00',
        TRUE,
        3
    ),
    (
        3,
        'acal-uuid-0003',
        7,
        'API_ENDPOINT',
        '/api/admin/users/5/deactivate',
        'admin.users.deactivate',
        'RECEPTIONIST',
        'DENIED',
        'Permission admin.users.deactivate not granted to RECEPTIONIST role',
        '192.168.1.108',
        'sess-mobile-007',
        '2026-07-05 09:20:00',
        TRUE,
        7
    ),
    (
        4,
        'acal-uuid-0004',
        8,
        'MODULE',
        'Security & Access Control',
        'security.module.access',
        'SECURITY_OFFICER',
        'ALLOWED',
        NULL,
        '192.168.1.110',
        'sess-sec-008',
        '2026-07-06 07:05:00',
        TRUE,
        8
    ),
    (
        5,
        'acal-uuid-0005',
        1,
        'CONFIGURATION',
        'system.maintenance_mode',
        'admin.config.edit',
        'SUPER_ADMIN',
        'ALLOWED',
        NULL,
        '192.168.1.100',
        'sess-admin-001',
        '2026-07-06 08:15:00',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 15: SEED ADMIN ACTION LOGS
-- =====================================================================================
INSERT INTO
    admin_action_logs (
        id,
        action_uid,
        admin_id,
        admin_role,
        action_type,
        target_module,
        target_entity,
        target_entity_id,
        target_user_id,
        description,
        justification,
        ip_address,
        session_id,
        risk_level,
        action_time,
        is_active,
        created_by
    )
VALUES (
        1,
        'aal-uuid-0001',
        1,
        'SUPER_ADMIN',
        'CONFIG_UPDATE',
        'AUTHENTICATION',
        'system_configurations',
        2,
        NULL,
        'Updated session idle timeout from 30 minutes to 15 minutes',
        'Security policy review - reduce session timeout per Q3 compliance audit recommendation',
        '192.168.1.100',
        'sess-admin-001',
        'MEDIUM',
        '2026-07-06 08:15:00',
        TRUE,
        1
    ),
    (
        2,
        'aal-uuid-0002',
        1,
        'SUPER_ADMIN',
        'FEATURE_TOGGLE',
        'SECURITY',
        'system_configurations',
        10,
        NULL,
        'Disabled AI surveillance feature flag',
        'Feature not production-ready - disabling until Q4 release',
        '192.168.1.100',
        'sess-admin-001',
        'LOW',
        '2026-07-06 08:20:00',
        TRUE,
        1
    ),
    (
        3,
        'aal-uuid-0003',
        1,
        'SUPER_ADMIN',
        'USER_LOCK',
        'USER_MANAGEMENT',
        'users',
        5,
        5,
        'Locked user account after 5 failed login attempts',
        'Automated lockout triggered by brute force detection',
        '192.168.1.100',
        'sess-admin-001',
        'HIGH',
        '2026-07-04 03:25:00',
        TRUE,
        1
    ),
    (
        4,
        'aal-uuid-0004',
        1,
        'SUPER_ADMIN',
        'IP_BAN',
        'SECURITY',
        'ip_blocklist',
        NULL,
        NULL,
        'Banned IP 103.42.55.12 after brute force attack detection',
        'Automated ban: 15 failed login attempts in 2 minutes from external IP',
        '192.168.1.100',
        'sess-admin-001',
        'HIGH',
        '2026-07-04 03:25:00',
        TRUE,
        1
    ),
    (
        5,
        'aal-uuid-0005',
        1,
        'SUPER_ADMIN',
        'NOTIFICATION_BROADCAST',
        'NOTIFICATION',
        'notification_campaigns',
        3,
        NULL,
        'Initiated emergency drill notification broadcast to all users',
        'Scheduled Q3 emergency evacuation drill',
        '192.168.1.100',
        'sess-admin-001',
        'MEDIUM',
        '2026-07-05 09:55:00',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 15: SEED SYSTEM ALERTS
-- =====================================================================================
INSERT INTO
    system_alerts (
        id,
        alert_uid,
        alert_code,
        alert_type,
        severity,
        title,
        message,
        source_module,
        source_component,
        metric_name,
        metric_value,
        threshold_value,
        notification_sent,
        escalation_level,
        triggered_at,
        resolved_at,
        resolved_by,
        resolution_notes,
        occurrence_count,
        alert_status,
        is_active,
        created_by
    )
VALUES (
        1,
        'sa-uuid-0001',
        'ALT-CPU-HIGH',
        'PERFORMANCE',
        'WARNING',
        'High CPU Usage Detected',
        'CPU usage reached 82.30% on vms-prod-01. Threshold: 80%. Peak traffic period detected.',
        'INFRASTRUCTURE',
        'api-gateway',
        'cpu_usage_percent',
        82.3000,
        80.0000,
        TRUE,
        0,
        '2026-07-06 14:00:00',
        '2026-07-06 14:15:00',
        1,
        'Traffic normalized after peak lunch hour rush. No action required.',
        3,
        'AUTO_RESOLVED',
        TRUE,
        1
    ),
    (
        2,
        'sa-uuid-0002',
        'ALT-SEC-BRUTE',
        'SECURITY',
        'CRITICAL',
        'Brute Force Attack Detected',
        '15 failed login attempts in 2 minutes from IP 103.42.55.12 (Lagos, Nigeria). IP has been automatically banned.',
        'AUTHENTICATION',
        'auth-service',
        'failed_login_attempts',
        15.0000,
        10.0000,
        TRUE,
        1,
        '2026-07-04 03:22:00',
        '2026-07-04 03:30:00',
        1,
        'IP banned automatically. User account locked. No breach detected.',
        1,
        'RESOLVED',
        TRUE,
        1
    ),
    (
        3,
        'sa-uuid-0003',
        'ALT-MEM-HIGH',
        'CAPACITY',
        'ERROR',
        'Memory Usage Critical',
        'Memory usage reached 88.50% on vms-prod-01. Available memory: 368 MB. Risk of OOM.',
        'INFRASTRUCTURE',
        'api-gateway',
        'memory_usage_percent',
        88.5000,
        85.0000,
        TRUE,
        0,
        '2026-07-06 14:00:00',
        '2026-07-06 14:20:00',
        1,
        'Memory freed after report generation completed and cache cleared.',
        1,
        'RESOLVED',
        TRUE,
        1
    ),
    (
        4,
        'sa-uuid-0004',
        'ALT-NOTIF-FAIL',
        'INTEGRATION_FAILURE',
        'ERROR',
        'SendGrid API Timeout',
        'SendGrid email delivery API timed out 3 times in 15 minutes. Notification queue backlog growing.',
        'NOTIFICATION',
        'notification-worker',
        'sendgrid_timeout_count',
        3.0000,
        2.0000,
        TRUE,
        1,
        '2026-07-05 14:20:00',
        '2026-07-05 14:40:00',
        1,
        'SendGrid service recovered. Queue drained successfully. 3 notifications delayed by ~20 minutes.',
        1,
        'RESOLVED',
        TRUE,
        1
    ),
    (
        5,
        'sa-uuid-0005',
        'ALT-DB-SLOW',
        'PERFORMANCE',
        'WARNING',
        'Slow Database Queries Detected',
        '5 slow queries (>1 second) detected in 5-minute window. Average query time: 35ms (normal: 12ms).',
        'INFRASTRUCTURE',
        'mysql-primary',
        'db_slow_queries',
        5.0000,
        3.0000,
        FALSE,
        0,
        '2026-07-06 14:00:00',
        NULL,
        NULL,
        NULL,
        2,
        'OPEN',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 16: SEED DASHBOARDS
-- =====================================================================================
INSERT INTO
    dashboards (
        id,
        dashboard_uid,
        dashboard_code,
        dashboard_name,
        dashboard_description,
        dashboard_type,
        dashboard_category,
        role_id,
        user_id,
        layout_config,
        theme,
        default_time_range,
        auto_refresh_seconds,
        min_role_level,
        is_default,
        is_public,
        display_order,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'dsh-uuid-0001',
        'DSH-ADMIN-OVERVIEW',
        'System Administrator Dashboard',
        'Complete system overview with health monitoring, security events, user activity, and performance metrics.',
        'SYSTEM',
        'IT_ADMIN',
        NULL,
        NULL,
        '{"columns":12,"rows":"auto","gap":"16px","breakpoints":{"lg":12,"md":8,"sm":4}}',
        'DARK',
        'TODAY',
        60,
        4,
        TRUE,
        FALSE,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'dsh-uuid-0002',
        'DSH-SEC-OVERVIEW',
        'Security Operations Dashboard',
        'Real-time security monitoring with incident tracking, access logs, and threat detection.',
        'ROLE_BASED',
        'SECURITY',
        3,
        NULL,
        '{"columns":12,"rows":"auto","gap":"16px"}',
        'DARK',
        'TODAY',
        30,
        3,
        TRUE,
        FALSE,
        2,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'dsh-uuid-0003',
        'DSH-RECEPTION',
        'Reception Dashboard',
        'Visitor management view with check-in queue, expected visitors, and pass status.',
        'ROLE_BASED',
        'RECEPTION',
        4,
        NULL,
        '{"columns":8,"rows":"auto","gap":"12px"}',
        'LIGHT',
        'TODAY',
        120,
        1,
        TRUE,
        FALSE,
        3,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'dsh-uuid-0004',
        'DSH-EXEC-SUMMARY',
        'Executive Summary Dashboard',
        'High-level KPI overview for C-suite with visitor trends, security posture, and compliance metrics.',
        'ROLE_BASED',
        'EXECUTIVE',
        5,
        NULL,
        '{"columns":12,"rows":"auto","gap":"20px"}',
        'LIGHT',
        'THIS_MONTH',
        300,
        4,
        TRUE,
        FALSE,
        0,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'dsh-uuid-0005',
        'DSH-CUSTOM-001',
        'My Custom Dashboard',
        'Personal dashboard with custom widget selection and layout.',
        'CUSTOM',
        'CUSTOM',
        NULL,
        1,
        '{"columns":10,"rows":"auto","gap":"14px"}',
        'SYSTEM',
        'LAST_7_DAYS',
        300,
        1,
        FALSE,
        FALSE,
        10,
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 16: SEED DM WIDGET INSTANCES
-- =====================================================================================
INSERT INTO
    dm_widget_instances (
        id,
        instance_uid,
        dashboard_id,
        widget_definition_id,
        instance_name,
        widget_type,
        data_source_module,
        data_query_reference,
        position_row,
        position_col,
        width,
        height,
        display_order,
        refresh_interval_seconds,
        is_visible,
        drill_down_report_id,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'dwi-uuid-0001',
        1,
        4,
        'System KPI Overview',
        'KPI',
        'MULTI_MODULE',
        'api/dashboard/kpi/overview',
        0,
        0,
        12,
        2,
        1,
        60,
        TRUE,
        NULL,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'dwi-uuid-0002',
        1,
        1,
        'Visitor Trend (7 Days)',
        'CHART_LINE',
        'VISITOR',
        'api/analytics/visitor/trend',
        2,
        0,
        6,
        4,
        2,
        300,
        TRUE,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'dwi-uuid-0003',
        1,
        3,
        'Security Risk Score',
        'GAUGE',
        'SECURITY',
        'api/analytics/security/risk',
        2,
        6,
        3,
        4,
        3,
        60,
        TRUE,
        2,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'dwi-uuid-0004',
        1,
        5,
        'System Health',
        'GAUGE',
        'REPORTING',
        'api/system/health/current',
        2,
        9,
        3,
        4,
        4,
        30,
        TRUE,
        NULL,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'dwi-uuid-0005',
        2,
        3,
        'Live Security Incidents',
        'LIVE_STATUS',
        'SECURITY',
        'api/security/incidents/active',
        0,
        0,
        12,
        3,
        1,
        15,
        TRUE,
        2,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        6,
        'dwi-uuid-0006',
        3,
        2,
        'Check-In Methods Today',
        'CHART_PIE',
        'CHECKIN',
        'api/analytics/checkin/methods',
        0,
        0,
        4,
        4,
        1,
        120,
        TRUE,
        3,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        7,
        'dwi-uuid-0007',
        3,
        4,
        'Visitors On Premises',
        'COUNTER',
        'VISITOR',
        'api/visitors/onpremises/count',
        0,
        4,
        4,
        2,
        2,
        30,
        TRUE,
        NULL,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        8,
        'dwi-uuid-0008',
        4,
        1,
        'Monthly Visitor Trend',
        'CHART_LINE',
        'VISITOR',
        'api/analytics/visitor/monthly',
        0,
        0,
        8,
        4,
        1,
        600,
        TRUE,
        1,
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 16: SEED DASHBOARD METRICS
-- =====================================================================================
INSERT INTO
    dashboard_metrics (
        id,
        metric_uid,
        dashboard_id,
        widget_instance_id,
        kpi_metric_id,
        metric_code,
        metric_name,
        metric_value,
        metric_unit,
        metric_type,
        calculation_method,
        previous_value,
        trend_direction,
        trend_percentage,
        threshold_status,
        display_format,
        display_color,
        display_icon,
        calculated_at,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'dmt-uuid-0001',
        1,
        1,
        1,
        'MTR-CHECKIN-AVG',
        'Avg Check-In Time',
        35.0000,
        'seconds',
        'AVERAGE',
        'REAL_TIME',
        42.0000,
        'DOWN',
        -16.67,
        'NORMAL',
        '{value}s',
        '#4CAF50',
        'timer',
        '2026-07-06 12:00:00',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'dmt-uuid-0002',
        1,
        1,
        2,
        'MTR-SATISFACTION',
        'Visitor Satisfaction',
        4.5000,
        'score',
        'AVERAGE',
        'AGGREGATED',
        4.3000,
        'UP',
        4.65,
        'NORMAL',
        '{value}/5.0',
        '#2196F3',
        'star',
        '2026-07-06 12:00:00',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'dmt-uuid-0003',
        1,
        3,
        3,
        'MTR-RISK-SCORE',
        'Security Risk',
        12.5000,
        'score',
        'SCORE',
        'REAL_TIME',
        18.7500,
        'DOWN',
        -33.33,
        'NORMAL',
        '{value}',
        '#FF9800',
        'shield',
        '2026-07-06 12:00:00',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'dmt-uuid-0004',
        1,
        1,
        NULL,
        'MTR-VISITORS-TODAY',
        'Visitors Today',
        45.0000,
        'count',
        'COUNT',
        'REAL_TIME',
        38.0000,
        'UP',
        18.42,
        'NORMAL',
        '#{value}',
        '#9C27B0',
        'people',
        '2026-07-06 12:00:00',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'dmt-uuid-0005',
        4,
        8,
        NULL,
        'MTR-VISITORS-MONTH',
        'Visitors This Month',
        890.0000,
        'count',
        'COUNT',
        'CUMULATIVE',
        780.0000,
        'UP',
        14.10,
        'NORMAL',
        '#{value}',
        '#673AB7',
        'trending_up',
        '2026-07-06 12:00:00',
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 16: SEED USER DASHBOARD PREFERENCES
-- =====================================================================================
INSERT INTO
    user_dashboard_preferences (
        id,
        preference_uid,
        user_id,
        dashboard_id,
        theme,
        default_time_range,
        auto_refresh_enabled,
        notification_overlay_enabled,
        compact_mode,
        is_favorite,
        last_viewed_at,
        view_count,
        is_active,
        created_by
    )
VALUES (
        1,
        'udp-uuid-0001',
        1,
        1,
        'DARK',
        'TODAY',
        TRUE,
        TRUE,
        FALSE,
        TRUE,
        '2026-07-06 12:30:00',
        142,
        TRUE,
        1
    ),
    (
        2,
        'udp-uuid-0002',
        1,
        4,
        'LIGHT',
        'THIS_MONTH',
        TRUE,
        FALSE,
        FALSE,
        TRUE,
        '2026-07-06 08:35:00',
        28,
        TRUE,
        1
    ),
    (
        3,
        'udp-uuid-0003',
        8,
        2,
        'DARK',
        'TODAY',
        TRUE,
        TRUE,
        FALSE,
        TRUE,
        '2026-07-06 13:00:00',
        310,
        TRUE,
        8
    ),
    (
        4,
        'udp-uuid-0004',
        3,
        3,
        'LIGHT',
        'TODAY',
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        '2026-07-06 11:45:00',
        95,
        TRUE,
        3
    ),
    (
        5,
        'udp-uuid-0005',
        7,
        3,
        'SYSTEM',
        'TODAY',
        TRUE,
        TRUE,
        FALSE,
        FALSE,
        '2026-07-05 09:30:00',
        45,
        TRUE,
        7
    );

-- =====================================================================================
-- MODULE 16: SEED DASHBOARD EVENTS
-- =====================================================================================
INSERT INTO
    dashboard_events (
        id,
        event_uid,
        event_type,
        user_id,
        dashboard_id,
        widget_instance_id,
        event_metadata,
        ip_address,
        device_type,
        page_load_time_ms,
        response_time_ms,
        event_time,
        is_active,
        created_by
    )
VALUES (
        1,
        'de-uuid-0001',
        'VIEW',
        1,
        1,
        NULL,
        '{"source":"navigation","time_range":"TODAY"}',
        '192.168.1.100',
        'desktop',
        1200,
        180,
        '2026-07-06 08:00:30',
        TRUE,
        1
    ),
    (
        2,
        'de-uuid-0002',
        'DRILL_DOWN',
        1,
        1,
        2,
        '{"report_id":1,"date":"2026-07-05","filter":"visitor_trend"}',
        '192.168.1.100',
        'desktop',
        NULL,
        350,
        '2026-07-06 08:05:00',
        TRUE,
        1
    ),
    (
        3,
        'de-uuid-0003',
        'FILTER',
        8,
        2,
        5,
        '{"filter_type":"severity","value":"CRITICAL","previous":"ALL"}',
        '192.168.1.110',
        'desktop',
        NULL,
        120,
        '2026-07-06 07:15:00',
        TRUE,
        8
    ),
    (
        4,
        'de-uuid-0004',
        'EXPORT',
        1,
        4,
        8,
        '{"format":"PDF","date_range":"LAST_30_DAYS"}',
        '192.168.1.100',
        'desktop',
        NULL,
        2800,
        '2026-07-06 08:40:00',
        TRUE,
        1
    ),
    (
        5,
        'de-uuid-0005',
        'REFRESH',
        3,
        3,
        7,
        '{"trigger":"auto","interval":30}',
        '192.168.1.105',
        'desktop',
        NULL,
        85,
        '2026-07-06 10:10:30',
        TRUE,
        3
    );

-- =====================================================================================
-- MODULE 16: SEED DASHBOARD ALERTS
-- =====================================================================================
INSERT INTO
    dashboard_alerts (
        id,
        alert_uid,
        dashboard_id,
        system_alert_id,
        alert_type,
        severity,
        title,
        message,
        source_module,
        action_url,
        action_label,
        is_read,
        is_dismissed,
        is_pinned,
        triggered_at,
        alert_status,
        is_active,
        created_by
    )
VALUES (
        1,
        'da-uuid-0001',
        1,
        1,
        'PERFORMANCE',
        'MEDIUM',
        'High CPU Usage',
        'CPU usage reached 82.30% on vms-prod-01 during peak traffic.',
        'INFRASTRUCTURE',
        '/admin/system-health',
        'View System Health',
        TRUE,
        FALSE,
        FALSE,
        '2026-07-06 14:00:00',
        'READ',
        TRUE,
        1
    ),
    (
        2,
        'da-uuid-0002',
        2,
        2,
        'SECURITY',
        'CRITICAL',
        'Brute Force Attack Blocked',
        '15 failed login attempts from IP 103.42.55.12. IP banned automatically.',
        'AUTHENTICATION',
        '/security/incidents/2',
        'View Incident',
        TRUE,
        FALSE,
        TRUE,
        '2026-07-04 03:22:00',
        'READ',
        TRUE,
        1
    ),
    (
        3,
        'da-uuid-0003',
        1,
        5,
        'PERFORMANCE',
        'LOW',
        'Slow DB Queries',
        '5 slow queries detected in 5-minute window. Investigating.',
        'INFRASTRUCTURE',
        '/admin/db-performance',
        'View Details',
        FALSE,
        FALSE,
        FALSE,
        '2026-07-06 14:00:00',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'da-uuid-0004',
        3,
        NULL,
        'VISITOR',
        'HIGH',
        'VIP Visitor Arriving',
        'VIP visitor Dr. Sarah Chen arriving at 2:00 PM. Conference Room A reserved.',
        'VISITOR',
        '/visitors/1',
        'View Visitor',
        FALSE,
        FALSE,
        TRUE,
        '2026-07-06 13:45:00',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'da-uuid-0005',
        NULL,
        4,
        'SYSTEM',
        'MEDIUM',
        'Email Service Recovered',
        'SendGrid API recovered after 20-minute outage. All queued notifications delivered.',
        'NOTIFICATION',
        '/admin/notification-queue',
        'View Queue',
        TRUE,
        TRUE,
        FALSE,
        '2026-07-05 14:40:00',
        'DISMISSED',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 16: SEED REAL TIME DASHBOARD CACHE
-- =====================================================================================
INSERT INTO
    real_time_dashboard_cache (
        id,
        cache_uid,
        cache_key,
        cache_scope,
        dashboard_id,
        widget_instance_id,
        user_id,
        cache_data,
        data_hash,
        data_row_count,
        generated_at,
        expiry_time,
        ttl_seconds,
        is_stale,
        hit_count,
        generation_time_ms,
        is_active,
        created_by
    )
VALUES (
        1,
        'rtdc-uuid-0001',
        'dsh:1:widget:1:kpi:overview:today',
        'WIDGET',
        1,
        1,
        NULL,
        '{"metrics":[{"name":"Visitors Today","value":45},{"name":"Avg Check-In","value":"35s"},{"name":"Satisfaction","value":"4.5/5"},{"name":"Risk Score","value":12.5}]}',
        'a1b2c3d4e5f6',
        4,
        '2026-07-06 12:00:00',
        '2026-07-06 12:01:00',
        60,
        FALSE,
        42,
        120,
        TRUE,
        1
    ),
    (
        2,
        'rtdc-uuid-0002',
        'dsh:1:widget:2:visitor:trend:7d',
        'WIDGET',
        1,
        2,
        NULL,
        '{"labels":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"datasets":[{"label":"Visitors","data":[32,28,45,38,42,18,12]}]}',
        'b2c3d4e5f6a1',
        7,
        '2026-07-06 11:55:00',
        '2026-07-06 12:00:00',
        300,
        TRUE,
        85,
        450,
        TRUE,
        1
    ),
    (
        3,
        'rtdc-uuid-0003',
        'dsh:2:widget:5:security:incidents:active',
        'WIDGET',
        2,
        5,
        NULL,
        '{"active_incidents":1,"critical":0,"high":0,"medium":1,"low":0,"last_updated":"2026-07-06T12:00:00Z"}',
        'c3d4e5f6a1b2',
        1,
        '2026-07-06 12:00:00',
        '2026-07-06 12:00:15',
        15,
        FALSE,
        120,
        35,
        TRUE,
        1
    ),
    (
        4,
        'rtdc-uuid-0004',
        'dsh:3:widget:7:visitors:onpremises',
        'WIDGET',
        3,
        7,
        NULL,
        '{"on_premises":15,"checked_in_today":45,"expected_remaining":8}',
        'd4e5f6a1b2c3',
        3,
        '2026-07-06 12:00:00',
        '2026-07-06 12:00:30',
        30,
        FALSE,
        200,
        25,
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 16: SEED DASHBOARD ACTIVITY LOGS
-- =====================================================================================
INSERT INTO
    dashboard_activity_logs (
        id,
        activity_uid,
        user_id,
        dashboard_id,
        widget_instance_id,
        action_type,
        action_detail,
        ip_address,
        device_type,
        duration_on_dashboard_ms,
        widgets_loaded_count,
        widgets_error_count,
        page_load_time_ms,
        action_time,
        is_active,
        created_by
    )
VALUES (
        1,
        'dal-uuid-0001',
        1,
        1,
        NULL,
        'VIEW',
        'Admin viewed System Administrator Dashboard',
        '192.168.1.100',
        'desktop',
        270000,
        4,
        0,
        1200,
        '2026-07-06 08:00:00',
        TRUE,
        1
    ),
    (
        2,
        'dal-uuid-0002',
        1,
        1,
        2,
        'DRILL_DOWN',
        'Admin drilled down from Visitor Trend widget to Daily Visitor Summary Report',
        '192.168.1.100',
        'desktop',
        NULL,
        NULL,
        NULL,
        NULL,
        '2026-07-06 08:05:00',
        TRUE,
        1
    ),
    (
        3,
        'dal-uuid-0003',
        8,
        2,
        NULL,
        'VIEW',
        'Security officer viewed Security Operations Dashboard',
        '192.168.1.110',
        'desktop',
        21600000,
        1,
        0,
        800,
        '2026-07-06 07:00:00',
        TRUE,
        8
    ),
    (
        4,
        'dal-uuid-0004',
        3,
        3,
        NULL,
        'VIEW',
        'Receptionist viewed Reception Dashboard',
        '192.168.1.105',
        'desktop',
        11700000,
        2,
        0,
        650,
        '2026-07-06 08:30:00',
        TRUE,
        3
    ),
    (
        5,
        'dal-uuid-0005',
        1,
        5,
        NULL,
        'CUSTOMIZE',
        'Admin customized personal dashboard layout and added new widget',
        '192.168.1.100',
        'desktop',
        180000,
        3,
        0,
        950,
        '2026-07-06 09:00:00',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 17: SEED ALM AUDIT LOGS (Master Immutable Audit Trail)
-- =====================================================================================
INSERT INTO
    alm_audit_logs (
        id,
        audit_uid,
        user_id,
        module_name,
        action_type,
        entity_name,
        entity_id,
        old_values,
        new_values,
        change_summary,
        ip_address,
        http_method,
        endpoint,
        session_id,
        outcome,
        severity,
        risk_score,
        execution_time_ms,
        data_classification,
        created_at,
        created_by
    )
VALUES (
        1,
        'alm-al-0001',
        1,
        'AUTHENTICATION',
        'LOGIN',
        'users',
        1,
        NULL,
        '{"login_method":"password","mfa_verified":true}',
        'Super Admin login with MFA verification',
        '192.168.1.100',
        'POST',
        '/api/auth/login',
        'sess-admin-001',
        'SUCCESS',
        'INFO',
        0,
        250,
        'INTERNAL',
        '2026-07-06 08:00:00',
        1
    ),
    (
        2,
        'alm-al-0002',
        3,
        'VISITOR',
        'CREATE',
        'visitors',
        6,
        NULL,
        '{"name":"Emily Watson","company":"TechVentures","purpose":"BUSINESS"}',
        'New visitor pre-registered for business meeting',
        '192.168.1.105',
        'POST',
        '/api/visitors',
        'sess-host-003',
        'SUCCESS',
        'INFO',
        0,
        180,
        'CONFIDENTIAL',
        '2026-07-06 09:15:00',
        3
    ),
    (
        3,
        'alm-al-0003',
        NULL,
        'SECURITY',
        'DENY',
        'access_points',
        1,
        NULL,
        '{"visitor_id":3,"gate":"Main Entrance","reason":"expired_pass"}',
        'Visitor access denied — expired visitor pass',
        '10.0.1.50',
        'POST',
        '/api/security/access-check',
        NULL,
        'DENIED',
        'HIGH',
        60,
        45,
        'RESTRICTED',
        '2026-07-06 10:30:00',
        NULL
    ),
    (
        4,
        'alm-al-0004',
        1,
        'SYSTEM_ADMIN',
        'CONFIGURE',
        'system_configurations',
        5,
        '{"config_value":"false"}',
        '{"config_value":"true"}',
        'Enabled MFA system-wide for all user roles',
        '192.168.1.100',
        'PUT',
        '/api/admin/config/auth.mfa.enabled',
        'sess-admin-001',
        'SUCCESS',
        'MEDIUM',
        25,
        85,
        'RESTRICTED',
        '2026-07-06 08:20:00',
        1
    ),
    (
        5,
        'alm-al-0005',
        1,
        'USER_MANAGEMENT',
        'REVOKE',
        'role_assignments',
        12,
        '{"role":"SECURITY_ADMIN","user_id":9}',
        NULL,
        'Revoked SECURITY_ADMIN role from user ID 9 after policy violation',
        '192.168.1.100',
        'DELETE',
        '/api/admin/users/9/roles/SECURITY_ADMIN',
        'sess-admin-001',
        'SUCCESS',
        'HIGH',
        70,
        120,
        'RESTRICTED',
        '2026-07-06 08:30:00',
        1
    );

-- =====================================================================================
-- MODULE 17: SEED ALM USER ACTIVITY LOGS
-- =====================================================================================
INSERT INTO
    alm_user_activity_logs (
        id,
        activity_uid,
        user_id,
        activity_type,
        module_name,
        resource_path,
        resource_name,
        ip_address,
        device_type,
        device_os,
        device_browser,
        geo_country,
        geo_city,
        session_id,
        response_time_ms,
        activity_time,
        is_active,
        created_by
    )
VALUES (
        1,
        'alm-ual-0001',
        1,
        'LOGIN',
        'AUTHENTICATION',
        '/api/auth/login',
        'User Login',
        '192.168.1.100',
        'desktop',
        'Windows 11',
        'Chrome 120',
        'United States',
        'San Francisco',
        'sess-admin-001',
        250,
        '2026-07-06 08:00:00',
        TRUE,
        1
    ),
    (
        2,
        'alm-ual-0002',
        1,
        'DASHBOARD_VIEW',
        'DASHBOARD',
        '/dashboard/admin',
        'Admin Dashboard',
        '192.168.1.100',
        'desktop',
        'Windows 11',
        'Chrome 120',
        'United States',
        'San Francisco',
        'sess-admin-001',
        1200,
        '2026-07-06 08:01:00',
        TRUE,
        1
    ),
    (
        3,
        'alm-ual-0003',
        3,
        'DATA_CREATE',
        'VISITOR',
        '/api/visitors',
        'Visitor Registration',
        '192.168.1.105',
        'desktop',
        'macOS 14',
        'Firefox 125',
        'United States',
        'San Francisco',
        'sess-host-003',
        180,
        '2026-07-06 09:15:00',
        TRUE,
        3
    ),
    (
        4,
        'alm-ual-0004',
        1,
        'REPORT_EXPORT',
        'REPORTING',
        '/api/reports/1/export',
        'Daily Visitor Summary PDF Export',
        '192.168.1.100',
        'desktop',
        'Windows 11',
        'Chrome 120',
        'United States',
        'San Francisco',
        'sess-admin-001',
        3400,
        '2026-07-06 08:35:00',
        TRUE,
        1
    ),
    (
        5,
        'alm-ual-0005',
        8,
        'SECURITY_ACTION',
        'SECURITY',
        '/api/security/incidents/3/resolve',
        'Security Incident Resolution',
        '192.168.1.110',
        'desktop',
        'Windows 11',
        'Chrome 120',
        'United States',
        'San Francisco',
        'sess-sec-008',
        220,
        '2026-07-06 13:10:00',
        TRUE,
        8
    );

-- =====================================================================================
-- MODULE 17: SEED ALM SECURITY AUDIT LOGS
-- =====================================================================================
INSERT INTO
    alm_security_audit_logs (
        id,
        event_uid,
        event_type,
        severity,
        user_id,
        target_user_id,
        ip_address,
        geo_country,
        geo_city,
        device_type,
        device_os,
        device_browser,
        threat_indicator,
        threat_category,
        risk_score,
        action_taken,
        notification_sent,
        is_resolved,
        event_time,
        is_active,
        created_by
    )
VALUES (
        1,
        'alm-sal-0001',
        'FAILED_LOGIN',
        'LOW',
        5,
        NULL,
        '192.168.1.200',
        'United States',
        'San Francisco',
        'desktop',
        'Windows 11',
        'Chrome 120',
        'Wrong password attempt 1/5',
        'AUTHENTICATION',
        10,
        'LOGGED',
        FALSE,
        TRUE,
        '2026-07-05 08:45:00',
        TRUE,
        NULL
    ),
    (
        2,
        'alm-sal-0002',
        'BRUTE_FORCE',
        'CRITICAL',
        NULL,
        5,
        '103.42.55.12',
        'Nigeria',
        'Lagos',
        'desktop',
        'Linux',
        'curl/7.88',
        '15 failed logins in 2 min from external IP',
        'AUTHENTICATION',
        95,
        'IP_BANNED',
        TRUE,
        TRUE,
        '2026-07-04 03:22:00',
        TRUE,
        NULL
    ),
    (
        3,
        'alm-sal-0003',
        'PRIVILEGE_ESCALATION',
        'HIGH',
        9,
        NULL,
        '192.168.1.115',
        'United States',
        'San Francisco',
        'desktop',
        'Windows 11',
        'Chrome 120',
        'User attempted to access SUPER_ADMIN API endpoints',
        'AUTHORIZATION',
        80,
        'BLOCKED',
        TRUE,
        TRUE,
        '2026-07-05 16:30:00',
        TRUE,
        NULL
    ),
    (
        4,
        'alm-sal-0004',
        'INJECTION_ATTEMPT',
        'HIGH',
        NULL,
        NULL,
        '45.33.32.156',
        'Russia',
        'Moscow',
        'unknown',
        NULL,
        NULL,
        'SQL injection pattern detected in visitor search endpoint',
        'INPUT_VALIDATION',
        85,
        'BLOCKED',
        TRUE,
        TRUE,
        '2026-07-06 02:10:00',
        TRUE,
        NULL
    ),
    (
        5,
        'alm-sal-0005',
        'SESSION_HIJACK',
        'CRITICAL',
        7,
        7,
        '212.58.244.70',
        'United Kingdom',
        'London',
        'mobile',
        'Android 14',
        'Chrome Mobile',
        'Session token reused from different GeoIP region',
        'SESSION',
        90,
        'SESSION_TERMINATED',
        TRUE,
        FALSE,
        '2026-07-06 04:30:00',
        TRUE,
        NULL
    );

-- =====================================================================================
-- MODULE 17: SEED ALM SYSTEM EVENT LOGS
-- =====================================================================================
INSERT INTO
    alm_system_event_logs (
        id,
        event_uid,
        event_source,
        event_type,
        event_name,
        endpoint,
        http_method,
        status_code,
        response_time_ms,
        correlation_id,
        user_id,
        ip_address,
        server_node,
        severity,
        event_time,
        is_active,
        created_by
    )
VALUES (
        1,
        'alm-sel-0001',
        'API_GATEWAY',
        'REQUEST',
        'Visitor Check-In API Call',
        '/api/checkin',
        'POST',
        200,
        320,
        'corr-checkin-001',
        8,
        '10.0.1.50',
        'vms-prod-01',
        'INFO',
        '2026-07-06 10:05:00',
        TRUE,
        NULL
    ),
    (
        2,
        'alm-sel-0002',
        'NOTIFICATION_SERVICE',
        'QUEUE_PROCESS',
        'Email Notification Queue Processing',
        NULL,
        NULL,
        NULL,
        1200,
        'corr-notif-batch-001',
        NULL,
        NULL,
        'vms-prod-01',
        'INFO',
        '2026-07-06 10:10:00',
        TRUE,
        NULL
    ),
    (
        3,
        'alm-sel-0003',
        'AUTH_SERVICE',
        'ERROR',
        'Database Connection Pool Exhausted',
        '/api/auth/login',
        'POST',
        503,
        NULL,
        'corr-db-pool-001',
        NULL,
        '192.168.1.200',
        'vms-prod-01',
        'CRITICAL',
        '2026-07-06 14:05:00',
        TRUE,
        NULL
    ),
    (
        4,
        'alm-sel-0004',
        'SCHEDULER',
        'SCHEDULED_JOB',
        'Daily Visitor Summary Report Generation',
        NULL,
        NULL,
        NULL,
        8200,
        'corr-job-daily-001',
        NULL,
        NULL,
        'vms-prod-01',
        'INFO',
        '2026-07-05 23:55:00',
        TRUE,
        1
    ),
    (
        5,
        'alm-sel-0005',
        'SYSTEM_MONITOR',
        'HEALTH_CHECK',
        'System Health Check - All Services',
        NULL,
        NULL,
        200,
        45,
        'corr-health-001',
        NULL,
        NULL,
        'vms-prod-01',
        'INFO',
        '2026-07-06 12:00:00',
        TRUE,
        NULL
    );

-- =====================================================================================
-- MODULE 17: SEED ALM ADMIN ACTION LOGS
-- =====================================================================================
INSERT INTO
    alm_admin_action_logs (
        id,
        action_uid,
        admin_id,
        admin_role,
        action_type,
        target_module,
        target_entity,
        target_entity_id,
        target_user_id,
        description,
        justification,
        ip_address,
        session_id,
        risk_level,
        is_reversible,
        action_time,
        is_active,
        created_by
    )
VALUES (
        1,
        'alm-aal-0001',
        1,
        'SUPER_ADMIN',
        'CONFIG_UPDATE',
        'AUTHENTICATION',
        'system_configurations',
        5,
        NULL,
        'Enabled MFA system-wide',
        'Security policy review — Q3 compliance requirement',
        '192.168.1.100',
        'sess-admin-001',
        'MEDIUM',
        TRUE,
        '2026-07-06 08:20:00',
        TRUE,
        1
    ),
    (
        2,
        'alm-aal-0002',
        1,
        'SUPER_ADMIN',
        'ROLE_REVOKE',
        'USER_MANAGEMENT',
        'role_assignments',
        12,
        9,
        'Revoked SECURITY_ADMIN role from user ID 9',
        'Policy violation: unauthorized access to restricted configurations',
        '192.168.1.100',
        'sess-admin-001',
        'HIGH',
        FALSE,
        '2026-07-06 08:30:00',
        TRUE,
        1
    ),
    (
        3,
        'alm-aal-0003',
        1,
        'SUPER_ADMIN',
        'IP_BAN',
        'SECURITY',
        'ip_blocklist',
        NULL,
        NULL,
        'Banned IP 103.42.55.12 after brute force detection',
        'Automated ban: 15 failed attempts in 2 minutes',
        '192.168.1.100',
        'sess-admin-001',
        'HIGH',
        TRUE,
        '2026-07-04 03:25:00',
        TRUE,
        1
    ),
    (
        4,
        'alm-aal-0004',
        1,
        'SUPER_ADMIN',
        'DATA_EXPORT',
        'REPORTING',
        'report_executions',
        1,
        NULL,
        'Exported monthly compliance report',
        'Quarterly audit submission to compliance office',
        '192.168.1.100',
        'sess-admin-001',
        'MEDIUM',
        FALSE,
        '2026-07-06 08:40:00',
        TRUE,
        1
    ),
    (
        5,
        'alm-aal-0005',
        1,
        'SUPER_ADMIN',
        'FEATURE_TOGGLE',
        'SECURITY',
        'system_configurations',
        10,
        NULL,
        'Disabled AI surveillance feature flag',
        'Feature not production-ready — defer to Q4',
        '192.168.1.100',
        'sess-admin-001',
        'LOW',
        TRUE,
        '2026-07-06 08:25:00',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 17: SEED ALM ACCESS LOGS
-- =====================================================================================
INSERT INTO
    alm_access_logs (
        id,
        access_uid,
        user_id,
        resource_type,
        resource_name,
        access_status,
        denial_reason,
        required_permission,
        user_role,
        ip_address,
        session_id,
        access_time,
        is_active,
        created_by
    )
VALUES (
        1,
        'alm-acl-0001',
        1,
        'PAGE',
        '/admin/system-config',
        'ALLOWED',
        NULL,
        'admin.config.view',
        'SUPER_ADMIN',
        '192.168.1.100',
        'sess-admin-001',
        '2026-07-06 08:10:00',
        TRUE,
        1
    ),
    (
        2,
        'alm-acl-0002',
        3,
        'REPORT',
        'Weekly Security Incident Report',
        'DENIED',
        'Insufficient role level: required 3, user level 1',
        'reports.security.view',
        'HOST',
        '192.168.1.105',
        'sess-host-003',
        '2026-07-06 09:30:00',
        TRUE,
        3
    ),
    (
        3,
        'alm-acl-0003',
        7,
        'API_ENDPOINT',
        '/api/admin/users/5/deactivate',
        'DENIED',
        'Permission admin.users.deactivate not granted',
        'admin.users.deactivate',
        'RECEPTIONIST',
        '192.168.1.108',
        'sess-mobile-007',
        '2026-07-05 09:20:00',
        TRUE,
        7
    ),
    (
        4,
        'alm-acl-0004',
        9,
        'ADMIN_FUNCTION',
        '/api/admin/global-settings',
        'DENIED',
        'Privilege escalation attempt — role does not permit global admin access',
        'admin.global.manage',
        'SECURITY_OFFICER',
        '192.168.1.115',
        'sess-sec-009',
        '2026-07-05 16:30:00',
        TRUE,
        9
    ),
    (
        5,
        'alm-acl-0005',
        8,
        'MODULE',
        'Security & Access Control',
        'ALLOWED',
        NULL,
        'security.module.access',
        'SECURITY_OFFICER',
        '192.168.1.110',
        'sess-sec-008',
        '2026-07-06 07:05:00',
        TRUE,
        8
    );

-- =====================================================================================
-- MODULE 17: SEED ALM SESSION LOGS
-- =====================================================================================
INSERT INTO
    alm_session_logs (
        id,
        session_uid,
        user_id,
        session_type,
        start_time,
        last_activity_time,
        end_time,
        session_duration_seconds,
        ip_address,
        final_ip_address,
        device_type,
        device_os,
        device_browser,
        geo_country,
        geo_city,
        total_requests,
        total_page_views,
        total_actions,
        ip_changed,
        termination_reason,
        session_status,
        is_active,
        created_by
    )
VALUES (
        1,
        'alm-sess-admin-001',
        1,
        'WEB',
        '2026-07-06 08:00:00',
        '2026-07-06 13:00:00',
        NULL,
        NULL,
        '192.168.1.100',
        '192.168.1.100',
        'desktop',
        'Windows 11',
        'Chrome 120',
        'United States',
        'San Francisco',
        380,
        52,
        95,
        FALSE,
        NULL,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'alm-sess-host-003',
        3,
        'WEB',
        '2026-07-06 08:30:00',
        '2026-07-06 11:45:00',
        '2026-07-06 12:00:00',
        12600,
        '192.168.1.105',
        '192.168.1.105',
        'desktop',
        'macOS 14',
        'Firefox 125',
        'United States',
        'San Francisco',
        185,
        28,
        42,
        FALSE,
        'IDLE_TIMEOUT',
        'EXPIRED',
        TRUE,
        3
    ),
    (
        3,
        'alm-sess-sec-008',
        8,
        'WEB',
        '2026-07-06 07:00:00',
        '2026-07-06 13:15:00',
        NULL,
        NULL,
        '192.168.1.110',
        '192.168.1.110',
        'desktop',
        'Windows 11',
        'Chrome 120',
        'United States',
        'San Francisco',
        580,
        68,
        120,
        FALSE,
        NULL,
        'ACTIVE',
        TRUE,
        8
    ),
    (
        4,
        'alm-sess-hijack-007',
        7,
        'MOBILE',
        '2026-07-06 04:00:00',
        '2026-07-06 04:30:00',
        '2026-07-06 04:30:00',
        1800,
        '192.168.1.108',
        '212.58.244.70',
        'mobile',
        'iOS 17',
        'Safari 17',
        'United States',
        'San Francisco',
        12,
        3,
        2,
        TRUE,
        'SECURITY_VIOLATION',
        'HIJACK_SUSPECTED',
        TRUE,
        7
    ),
    (
        5,
        'alm-sess-kiosk-001',
        NULL,
        'KIOSK',
        '2026-07-06 06:00:00',
        '2026-07-06 13:00:00',
        NULL,
        NULL,
        '10.0.1.50',
        '10.0.1.50',
        'kiosk',
        'Linux',
        'Chromium Kiosk',
        'United States',
        'San Francisco',
        1450,
        0,
        380,
        FALSE,
        NULL,
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 17: SEED ALM ERROR LOGS
-- =====================================================================================
INSERT INTO
    alm_error_logs (
        id,
        error_uid,
        module_name,
        service_name,
        error_code,
        error_type,
        error_message,
        stack_trace,
        severity,
        user_id,
        ip_address,
        request_url,
        request_method,
        response_status_code,
        correlation_id,
        occurrence_count,
        first_occurred_at,
        last_occurred_at,
        is_resolved,
        environment,
        error_time,
        is_active,
        created_by
    )
VALUES (
        1,
        'alm-el-0001',
        'NOTIFICATION',
        'notification-worker',
        'ERR-NOTIF-SEND-001',
        'INTEGRATION',
        'SendGrid API timeout: connection reset after 30000ms',
        'at NotificationService.send() line 245\n  at QueueWorker.process() line 180',
        'ERROR',
        NULL,
        NULL,
        '/internal/notification/send',
        'POST',
        504,
        'corr-notif-timeout-001',
        3,
        '2026-07-05 14:20:00',
        '2026-07-05 14:35:00',
        TRUE,
        'PRODUCTION',
        '2026-07-05 14:20:00',
        TRUE,
        NULL
    ),
    (
        2,
        'alm-el-0002',
        'AUTHENTICATION',
        'auth-service',
        'ERR-AUTH-POOL-001',
        'DATABASE',
        'Database connection pool exhausted: max 50 connections reached',
        'at ConnectionPool.acquire() line 88\n  at AuthDAO.findByEmail() line 45',
        'CRITICAL',
        NULL,
        '192.168.1.200',
        '/api/auth/login',
        'POST',
        503,
        'corr-db-pool-001',
        1,
        '2026-07-06 14:05:00',
        '2026-07-06 14:05:00',
        FALSE,
        'PRODUCTION',
        '2026-07-06 14:05:00',
        TRUE,
        NULL
    ),
    (
        3,
        'alm-el-0003',
        'CHECKIN',
        'visitor-service',
        'ERR-CHECKIN-QR-002',
        'VALIDATION',
        'QR code validation failed: expired token (exp: 2026-07-04T18:00:00Z)',
        NULL,
        'WARNING',
        8,
        '10.0.1.50',
        '/api/checkin/qr-validate',
        'POST',
        400,
        'corr-qr-expired-001',
        1,
        '2026-07-05 09:15:00',
        '2026-07-05 09:15:00',
        TRUE,
        'PRODUCTION',
        '2026-07-05 09:15:00',
        TRUE,
        NULL
    ),
    (
        4,
        'alm-el-0004',
        'REPORTING',
        'report-engine',
        'ERR-RPT-MEM-003',
        'MEMORY',
        'Report generation OOM: heap exceeded 512MB during large dataset aggregation',
        'at ReportEngine.aggregate() line 380\n  at HeapAllocator.alloc() line 22',
        'CRITICAL',
        NULL,
        NULL,
        '/internal/reports/generate',
        'POST',
        500,
        'corr-rpt-oom-001',
        1,
        '2026-07-04 23:58:00',
        '2026-07-04 23:58:00',
        TRUE,
        'PRODUCTION',
        '2026-07-04 23:58:00',
        TRUE,
        NULL
    );

-- =====================================================================================
-- MODULE 17: SEED ALM API REQUEST LOGS
-- =====================================================================================
INSERT INTO
    alm_api_request_logs (
        id,
        request_uid,
        endpoint,
        http_method,
        api_version,
        status_code,
        response_time_ms,
        request_size_bytes,
        response_size_bytes,
        user_id,
        ip_address,
        correlation_id,
        server_node,
        is_authenticated,
        is_rate_limited,
        is_cached_response,
        request_time,
        is_active,
        created_by
    )
VALUES (
        1,
        'alm-arl-0001',
        '/api/auth/login',
        'POST',
        'v1',
        200,
        250,
        128,
        512,
        1,
        '192.168.1.100',
        'corr-login-001',
        'vms-prod-01',
        TRUE,
        FALSE,
        FALSE,
        '2026-07-06 08:00:00',
        TRUE,
        NULL
    ),
    (
        2,
        'alm-arl-0002',
        '/api/visitors',
        'POST',
        'v1',
        201,
        180,
        1024,
        2048,
        3,
        '192.168.1.105',
        'corr-visitor-create-001',
        'vms-prod-01',
        TRUE,
        FALSE,
        FALSE,
        '2026-07-06 09:15:00',
        TRUE,
        NULL
    ),
    (
        3,
        'alm-arl-0003',
        '/api/checkin',
        'POST',
        'v1',
        200,
        320,
        256,
        1024,
        8,
        '10.0.1.50',
        'corr-checkin-001',
        'vms-prod-01',
        TRUE,
        FALSE,
        FALSE,
        '2026-07-06 10:05:00',
        TRUE,
        NULL
    ),
    (
        4,
        'alm-arl-0004',
        '/api/dashboard/kpi/overview',
        'GET',
        'v1',
        200,
        85,
        0,
        4096,
        1,
        '192.168.1.100',
        'corr-dash-kpi-001',
        'vms-prod-01',
        TRUE,
        FALSE,
        TRUE,
        '2026-07-06 08:01:30',
        TRUE,
        NULL
    ),
    (
        5,
        'alm-arl-0005',
        '/api/admin/users/5/deactivate',
        'DELETE',
        'v1',
        403,
        35,
        64,
        256,
        7,
        '192.168.1.108',
        'corr-unauth-001',
        'vms-prod-01',
        TRUE,
        FALSE,
        FALSE,
        '2026-07-05 09:20:00',
        TRUE,
        NULL
    );

-- =====================================================================================
-- MODULE 17: SEED ALM AUDIT ALERTS
-- =====================================================================================
INSERT INTO
    alm_audit_alerts (
        id,
        alert_uid,
        alert_code,
        alert_type,
        severity,
        title,
        message,
        source_module,
        source_audit_log_id,
        source_security_log_id,
        affected_user_id,
        risk_score,
        notification_sent,
        escalation_level,
        triggered_at,
        resolved_at,
        resolved_by,
        resolution_notes,
        alert_status,
        is_active,
        created_by
    )
VALUES (
        1,
        'alm-aa-0001',
        'ALM-BRUTE-001',
        'SECURITY_THREAT',
        'CRITICAL',
        'Brute Force Attack Detected',
        '15 failed login attempts in 2 minutes from IP 103.42.55.12 (Lagos, Nigeria). IP banned automatically.',
        'AUTHENTICATION',
        NULL,
        2,
        5,
        95,
        TRUE,
        1,
        '2026-07-04 03:22:00',
        '2026-07-04 03:30:00',
        1,
        'IP banned. User account locked. No data breach confirmed.',
        'RESOLVED',
        TRUE,
        1
    ),
    (
        2,
        'alm-aa-0002',
        'ALM-PRIV-001',
        'PRIVILEGE_ABUSE',
        'ERROR',
        'Privilege Escalation Attempt',
        'User ID 9 attempted to access SUPER_ADMIN API endpoints without proper role assignment.',
        'SECURITY',
        5,
        3,
        9,
        80,
        TRUE,
        1,
        '2026-07-05 16:30:00',
        '2026-07-06 08:30:00',
        1,
        'User role revoked. Security audit completed. No data compromise.',
        'RESOLVED',
        TRUE,
        1
    ),
    (
        3,
        'alm-aa-0003',
        'ALM-HIJACK-001',
        'SECURITY_THREAT',
        'CRITICAL',
        'Session Hijack Suspected',
        'Session token for user ID 7 reused from UK IP while user is normally in San Francisco.',
        'AUTHENTICATION',
        NULL,
        5,
        7,
        90,
        TRUE,
        2,
        '2026-07-06 04:30:00',
        NULL,
        NULL,
        NULL,
        'ESCALATED',
        TRUE,
        NULL
    ),
    (
        4,
        'alm-aa-0004',
        'ALM-INJECT-001',
        'SECURITY_THREAT',
        'ERROR',
        'SQL Injection Attempt Blocked',
        'SQL injection pattern detected in visitor search endpoint from Russian IP.',
        'SECURITY',
        NULL,
        4,
        NULL,
        85,
        TRUE,
        0,
        '2026-07-06 02:10:00',
        '2026-07-06 02:15:00',
        NULL,
        'Automated block. WAF rules updated. No data exposure.',
        'AUTO_RESOLVED',
        TRUE,
        NULL
    ),
    (
        5,
        'alm-aa-0005',
        'ALM-DBPOOL-001',
        'PERFORMANCE_ANOMALY',
        'CRITICAL',
        'Database Connection Pool Exhausted',
        'Production database connection pool reached maximum 50 connections during peak traffic.',
        'INFRASTRUCTURE',
        NULL,
        NULL,
        NULL,
        75,
        TRUE,
        0,
        '2026-07-06 14:05:00',
        NULL,
        NULL,
        NULL,
        'OPEN',
        TRUE,
        NULL
    );

-- =====================================================================================
-- MODULE 18: SEED SCC SYSTEM CONFIGURATIONS
-- =====================================================================================
INSERT INTO
    scc_system_configurations (
        id,
        config_uid,
        config_key,
        config_value,
        config_type,
        config_category,
        environment,
        module_scope,
        description,
        default_value,
        is_editable,
        is_sensitive,
        is_encrypted,
        requires_restart,
        min_role_level,
        version,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'scc-sc-0001',
        'auth.session.timeout_minutes',
        '30',
        'INTEGER',
        'AUTHENTICATION',
        'ALL',
        'AUTHENTICATION',
        'Session idle timeout in minutes before automatic logout',
        '30',
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        4,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'scc-sc-0002',
        'auth.mfa.enabled',
        'true',
        'BOOLEAN',
        'AUTHENTICATION',
        'PRODUCTION',
        'AUTHENTICATION',
        'Master switch for multi-factor authentication enforcement',
        'false',
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        4,
        2,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'scc-sc-0003',
        'auth.password.min_length',
        '12',
        'INTEGER',
        'SECURITY',
        'ALL',
        'AUTHENTICATION',
        'Minimum password length for all user accounts',
        '8',
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        4,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'scc-sc-0004',
        'notification.sendgrid.api_key',
        'SG.xxxx-encrypted-xxxx',
        'ENCRYPTED',
        'INTEGRATION',
        'PRODUCTION',
        'NOTIFICATION',
        'SendGrid API key for email delivery',
        NULL,
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        4,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'scc-sc-0005',
        'visitor.checkin.allowed_methods',
        '["QR_CODE","FACIAL_RECOGNITION","MANUAL","KIOSK"]',
        'JSON',
        'VISITOR',
        'ALL',
        'CHECKIN',
        'Allowed check-in methods across all locations',
        '["QR_CODE","MANUAL"]',
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        3,
        1,
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 18: SEED SCC MODULE REGISTRY
-- =====================================================================================
INSERT INTO
    scc_module_registry (
        id,
        module_uid,
        module_code,
        module_name,
        module_version,
        module_category,
        priority_level,
        load_order,
        health_check_url,
        health_status,
        module_status,
        is_core,
        is_active,
        created_by
    )
VALUES (
        1,
        'scc-mr-0001',
        'MOD-AUTH-001',
        'Authentication & Authorization',
        '1.0.0',
        'CORE',
        10,
        1,
        '/api/health/auth',
        'HEALTHY',
        'ACTIVE',
        TRUE,
        TRUE,
        1
    ),
    (
        2,
        'scc-mr-0002',
        'MOD-USER-002',
        'User & Role Management',
        '1.0.0',
        'CORE',
        20,
        2,
        '/api/health/users',
        'HEALTHY',
        'ACTIVE',
        TRUE,
        TRUE,
        1
    ),
    (
        3,
        'scc-mr-0003',
        'MOD-ORG-003',
        'Organization Management',
        '1.0.0',
        'CORE',
        30,
        3,
        '/api/health/org',
        'HEALTHY',
        'ACTIVE',
        TRUE,
        TRUE,
        1
    ),
    (
        4,
        'scc-mr-0004',
        'MOD-VIS-004',
        'Visitor Management',
        '1.0.0',
        'VISITOR',
        40,
        4,
        '/api/health/visitors',
        'HEALTHY',
        'ACTIVE',
        TRUE,
        TRUE,
        1
    ),
    (
        5,
        'scc-mr-0005',
        'MOD-SEC-012',
        'Security & Access Control',
        '1.0.0',
        'SECURITY',
        15,
        2,
        '/api/health/security',
        'HEALTHY',
        'ACTIVE',
        TRUE,
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 18: SEED SCC FEATURE FLAGS
-- =====================================================================================
INSERT INTO
    scc_feature_flags (
        id,
        flag_uid,
        feature_key,
        feature_name,
        feature_description,
        module_id,
        module_name,
        enabled,
        rollout_percentage,
        rollout_strategy,
        environment,
        kill_switch,
        version,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'scc-ff-0001',
        'visitor.ai_screening',
        'AI Visitor Screening',
        'Enables AI-based visitor risk screening during pre-registration',
        4,
        'MOD-VIS-004',
        FALSE,
        100.00,
        'ALL_USERS',
        'ALL',
        FALSE,
        1,
        'DISABLED',
        TRUE,
        1
    ),
    (
        2,
        'scc-ff-0002',
        'auth.biometric_login',
        'Biometric Login',
        'Enables fingerprint and face recognition login methods',
        1,
        'MOD-AUTH-001',
        TRUE,
        50.00,
        'PERCENTAGE',
        'PRODUCTION',
        FALSE,
        2,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'scc-ff-0003',
        'checkin.contactless_mode',
        'Contactless Check-In',
        'Full contactless visitor check-in via QR and NFC only',
        4,
        'MOD-VIS-004',
        TRUE,
        100.00,
        'ALL_USERS',
        'ALL',
        FALSE,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'scc-ff-0004',
        'dashboard.realtime_websocket',
        'Real-Time WebSocket Dashboards',
        'Enables WebSocket push for dashboard live updates instead of polling',
        NULL,
        NULL,
        TRUE,
        25.00,
        'CANARY',
        'STAGING',
        FALSE,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'scc-ff-0005',
        'notification.whatsapp_channel',
        'WhatsApp Notification Channel',
        'Enables WhatsApp as a notification delivery channel',
        NULL,
        NULL,
        FALSE,
        0.00,
        'ALL_USERS',
        'ALL',
        FALSE,
        1,
        'SCHEDULED',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 18: SEED SCC ENVIRONMENT SETTINGS
-- =====================================================================================
INSERT INTO
    scc_environment_settings (
        id,
        env_uid,
        environment_name,
        environment_label,
        database_host,
        database_port,
        database_name,
        database_pool_size,
        api_base_url,
        api_version,
        security_level,
        ssl_enabled,
        rate_limit_per_minute,
        max_upload_size_mb,
        log_level,
        maintenance_mode,
        is_primary,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'scc-es-0001',
        'DEVELOPMENT',
        'Development - Local',
        'localhost',
        3306,
        'vms_dev',
        10,
        'http://localhost:3000/api',
        'v1',
        'MINIMAL',
        FALSE,
        1000,
        50,
        'DEBUG',
        FALSE,
        FALSE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'scc-es-0002',
        'TESTING',
        'Testing - CI/CD',
        'test-db.internal',
        3306,
        'vms_test',
        20,
        'https://test.vms.internal/api',
        'v1',
        'STANDARD',
        TRUE,
        500,
        20,
        'INFO',
        FALSE,
        FALSE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'scc-es-0003',
        'STAGING',
        'Staging - Pre-Production',
        'staging-db.internal',
        3306,
        'vms_staging',
        30,
        'https://staging.vms.example.com/api',
        'v1',
        'HIGH',
        TRUE,
        200,
        10,
        'WARNING',
        FALSE,
        FALSE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'scc-es-0004',
        'PRODUCTION',
        'Production - US East',
        'prod-db-primary.internal',
        3306,
        'vms_production',
        50,
        'https://api.vms.example.com',
        'v1',
        'MAXIMUM',
        TRUE,
        100,
        10,
        'ERROR',
        FALSE,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'scc-es-0005',
        'DR_RECOVERY',
        'Disaster Recovery - US West',
        'dr-db.internal',
        3306,
        'vms_dr',
        50,
        'https://dr-api.vms.example.com',
        'v1',
        'MAXIMUM',
        TRUE,
        100,
        10,
        'WARNING',
        FALSE,
        FALSE,
        'OFFLINE',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 18: SEED SCC SECURITY POLICIES
-- =====================================================================================
INSERT INTO
    scc_security_policies (
        id,
        policy_uid,
        policy_code,
        policy_name,
        policy_type,
        policy_category,
        policy_value,
        enforcement_level,
        module_scope,
        compliance_framework,
        version,
        priority,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'scc-sp-0001',
        'POL-PASSWORD-001',
        'Password Complexity Policy',
        'PASSWORD',
        'AUTHENTICATION',
        'min_length=12;require_uppercase=true;require_lowercase=true;require_digits=true;require_special=true;max_age_days=90',
        'MANDATORY',
        'AUTHENTICATION',
        'SOC2, ISO27001',
        1,
        10,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'scc-sp-0002',
        'POL-SESSION-001',
        'Session Management Policy',
        'SESSION',
        'AUTHENTICATION',
        'idle_timeout=30m;max_session=8h;max_concurrent=3;force_reauth_sensitive=true',
        'ENFORCED',
        'AUTHENTICATION',
        'SOC2',
        1,
        20,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'scc-sp-0003',
        'POL-MFA-001',
        'Multi-Factor Authentication Policy',
        'MFA',
        'AUTHENTICATION',
        'required_roles=SUPER_ADMIN,ADMIN,SECURITY_OFFICER;methods=TOTP,SMS,EMAIL;grace_period=0',
        'MANDATORY',
        'AUTHENTICATION',
        'SOC2, HIPAA',
        1,
        5,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'scc-sp-0004',
        'POL-RETENTION-001',
        'Data Retention Policy',
        'DATA_RETENTION',
        'DATA_SECURITY',
        'audit_logs=365d;visitor_data=730d;session_logs=90d;api_logs=30d;error_logs=180d',
        'ENFORCED',
        'GLOBAL',
        'GDPR, HIPAA',
        1,
        30,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'scc-sp-0005',
        'POL-RATE-001',
        'API Rate Limiting Policy',
        'RATE_LIMIT',
        'NETWORK',
        'anonymous=20/min;authenticated=100/min;admin=500/min;burst_factor=2;lockout_duration=15m',
        'ENFORCED',
        'GLOBAL',
        'SOC2',
        1,
        40,
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 18: SEED SCC ADMIN CONTROLS
-- =====================================================================================
INSERT INTO
    scc_admin_controls (
        id,
        control_uid,
        admin_id,
        admin_role,
        action_type,
        target_module,
        target_entity,
        action_description,
        justification,
        ip_address,
        session_id,
        risk_level,
        notification_sent,
        action_time,
        is_active,
        created_by
    )
VALUES (
        1,
        'scc-ac-0001',
        1,
        'SUPER_ADMIN',
        'CONFIG_UPDATE',
        'AUTHENTICATION',
        'scc_system_configurations',
        'Enabled MFA system-wide for production environment',
        'Q3 compliance requirement — SOC2 audit finding',
        '192.168.1.100',
        'sess-admin-001',
        'MEDIUM',
        TRUE,
        '2026-07-06 08:20:00',
        TRUE,
        1
    ),
    (
        2,
        'scc-ac-0002',
        1,
        'SUPER_ADMIN',
        'FEATURE_TOGGLE',
        'VISITOR',
        'scc_feature_flags',
        'Enabled contactless check-in feature for all users',
        'Post-pandemic visitor experience improvement',
        '192.168.1.100',
        'sess-admin-001',
        'LOW',
        FALSE,
        '2026-07-06 08:22:00',
        TRUE,
        1
    ),
    (
        3,
        'scc-ac-0003',
        1,
        'SUPER_ADMIN',
        'MODULE_RESTART',
        'NOTIFICATION',
        'scc_module_registry',
        'Restarted Notification Service after SendGrid timeout recovery',
        'SendGrid API recovered — clear backlogged queue',
        '192.168.1.100',
        'sess-admin-001',
        'MEDIUM',
        TRUE,
        '2026-07-05 14:45:00',
        TRUE,
        1
    ),
    (
        4,
        'scc-ac-0004',
        1,
        'SUPER_ADMIN',
        'POLICY_UPDATE',
        'AUTHENTICATION',
        'scc_security_policies',
        'Updated password complexity policy — min length from 8 to 12',
        'Security hardening per ISO 27001 recommendation',
        '192.168.1.100',
        'sess-admin-001',
        'HIGH',
        TRUE,
        '2026-07-06 08:15:00',
        TRUE,
        1
    ),
    (
        5,
        'scc-ac-0005',
        1,
        'SUPER_ADMIN',
        'CACHE_FLUSH',
        'GLOBAL',
        NULL,
        'Flushed all system caches after configuration updates',
        'Ensure updated config values propagate immediately',
        '192.168.1.100',
        'sess-admin-001',
        'LOW',
        FALSE,
        '2026-07-06 08:45:00',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 18: SEED SCC SYSTEM OVERRIDES
-- =====================================================================================
INSERT INTO
    scc_system_overrides (
        id,
        override_uid,
        override_code,
        override_type,
        override_name,
        reason,
        applied_by,
        affected_module,
        severity,
        max_duration_minutes,
        auto_revert,
        activated_at,
        expires_at,
        deactivated_at,
        deactivated_by,
        override_status,
        is_active,
        created_by
    )
VALUES (
        1,
        'scc-so-0001',
        'OVR-MAINT-20260704',
        'MAINTENANCE_MODE',
        'Scheduled Maintenance Window',
        'Database migration and schema upgrade for Module 17 deployment',
        1,
        'ALL',
        'MEDIUM',
        120,
        TRUE,
        '2026-07-04 02:00:00',
        '2026-07-04 04:00:00',
        '2026-07-04 03:45:00',
        1,
        'DEACTIVATED',
        TRUE,
        1
    ),
    (
        2,
        'scc-so-0002',
        'OVR-LOCKDOWN-BRUTE',
        'EMERGENCY_LOCKDOWN',
        'Brute Force Emergency Lockdown',
        'Emergency lockdown triggered after brute force attack from IP 103.42.55.12',
        1,
        'AUTHENTICATION',
        'EMERGENCY',
        60,
        TRUE,
        '2026-07-04 03:22:00',
        '2026-07-04 04:22:00',
        '2026-07-04 03:45:00',
        1,
        'DEACTIVATED',
        TRUE,
        1
    ),
    (
        3,
        'scc-so-0003',
        'OVR-RATELIMIT-PEAK',
        'RATE_LIMIT_BYPASS',
        'Peak Traffic Rate Limit Override',
        'Bypass rate limiting for corporate event with 500+ visitors expected',
        1,
        'VISITOR',
        'MEDIUM',
        480,
        TRUE,
        '2026-07-06 08:00:00',
        '2026-07-06 16:00:00',
        NULL,
        NULL,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'scc-so-0004',
        'OVR-NOTIF-SUPPRESS',
        'NOTIFICATION_SUPPRESS',
        'Suppress Notifications During Migration',
        'Suppress all non-critical notifications during database migration window',
        1,
        'NOTIFICATION',
        'LOW',
        120,
        TRUE,
        '2026-07-04 02:00:00',
        '2026-07-04 04:00:00',
        '2026-07-04 03:50:00',
        1,
        'DEACTIVATED',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 18: SEED SCC CONFIGURATION HISTORY
-- =====================================================================================
INSERT INTO
    scc_configuration_history (
        id,
        history_uid,
        config_id,
        config_key,
        environment,
        old_value,
        new_value,
        old_version,
        new_version,
        change_type,
        changed_by,
        change_reason,
        change_source,
        ip_address,
        session_id,
        rollback_available,
        rolled_back,
        change_time,
        is_active,
        created_by
    )
VALUES (
        1,
        'scc-ch-0001',
        2,
        'auth.mfa.enabled',
        'PRODUCTION',
        'false',
        'true',
        1,
        2,
        'UPDATE',
        1,
        'Q3 compliance requirement — SOC2 audit finding',
        'MANUAL',
        '192.168.1.100',
        'sess-admin-001',
        TRUE,
        FALSE,
        '2026-07-06 08:20:00',
        TRUE,
        1
    ),
    (
        2,
        'scc-ch-0002',
        3,
        'auth.password.min_length',
        'ALL',
        '8',
        '12',
        0,
        1,
        'UPDATE',
        1,
        'Security hardening per ISO 27001',
        'MANUAL',
        '192.168.1.100',
        'sess-admin-001',
        TRUE,
        FALSE,
        '2026-07-06 08:15:00',
        TRUE,
        1
    ),
    (
        3,
        'scc-ch-0003',
        1,
        'auth.session.timeout_minutes',
        'ALL',
        NULL,
        '30',
        NULL,
        1,
        'CREATE',
        1,
        'Initial system configuration',
        'MIGRATION',
        '192.168.1.100',
        'sess-admin-001',
        FALSE,
        FALSE,
        '2026-07-01 00:00:00',
        TRUE,
        1
    ),
    (
        4,
        'scc-ch-0004',
        5,
        'visitor.checkin.allowed_methods',
        'ALL',
        '["QR_CODE","MANUAL"]',
        '["QR_CODE","FACIAL_RECOGNITION","MANUAL","KIOSK"]',
        0,
        1,
        'UPDATE',
        1,
        'Added kiosk and facial recognition check-in methods',
        'MANUAL',
        '192.168.1.100',
        'sess-admin-001',
        TRUE,
        FALSE,
        '2026-07-05 10:00:00',
        TRUE,
        1
    ),
    (
        5,
        'scc-ch-0005',
        4,
        'notification.sendgrid.api_key',
        'PRODUCTION',
        NULL,
        'SG.xxxx-encrypted-xxxx',
        NULL,
        1,
        'CREATE',
        1,
        'Initial SendGrid integration setup',
        'MANUAL',
        '192.168.1.100',
        'sess-admin-001',
        FALSE,
        FALSE,
        '2026-07-01 00:00:00',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 18: SEED SCC MODULE DEPENDENCIES
-- =====================================================================================
INSERT INTO
    scc_module_dependencies (
        id,
        dependency_uid,
        module_id,
        module_code,
        depends_on_id,
        depends_on_code,
        dependency_type,
        version_constraint,
        min_version,
        is_runtime,
        failure_action,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'scc-md-0001',
        2,
        'MOD-USER-002',
        1,
        'MOD-AUTH-001',
        'REQUIRED',
        '>=1.0.0',
        '1.0.0',
        TRUE,
        'BLOCK',
        'SATISFIED',
        TRUE,
        1
    ),
    (
        2,
        'scc-md-0002',
        3,
        'MOD-ORG-003',
        2,
        'MOD-USER-002',
        'REQUIRED',
        '>=1.0.0',
        '1.0.0',
        TRUE,
        'BLOCK',
        'SATISFIED',
        TRUE,
        1
    ),
    (
        3,
        'scc-md-0003',
        4,
        'MOD-VIS-004',
        3,
        'MOD-ORG-003',
        'REQUIRED',
        '>=1.0.0',
        '1.0.0',
        TRUE,
        'BLOCK',
        'SATISFIED',
        TRUE,
        1
    ),
    (
        4,
        'scc-md-0004',
        4,
        'MOD-VIS-004',
        5,
        'MOD-SEC-012',
        'OPTIONAL',
        '>=1.0.0',
        '1.0.0',
        TRUE,
        'DEGRADE',
        'SATISFIED',
        TRUE,
        1
    ),
    (
        5,
        'scc-md-0005',
        5,
        'MOD-SEC-012',
        1,
        'MOD-AUTH-001',
        'REQUIRED',
        '>=1.0.0',
        '1.0.0',
        TRUE,
        'BLOCK',
        'SATISFIED',
        TRUE,
        1
    );

-- =====================================================================================
-- MODULE 18: SEED SCC SYSTEM HEALTH RULES
-- =====================================================================================
INSERT INTO
    scc_system_health_rules (
        id,
        rule_uid,
        rule_code,
        rule_name,
        metric_name,
        metric_source,
        threshold_value,
        comparison_operator,
        evaluation_window_seconds,
        consecutive_breaches,
        action_on_breach,
        severity_level,
        affected_module,
        auto_resolve,
        breach_count,
        rule_status,
        is_active,
        created_by
    )
VALUES (
        1,
        'scc-shr-0001',
        'HLT-CPU-HIGH',
        'High CPU Usage Alert',
        'cpu_usage_percent',
        'INFRASTRUCTURE',
        80.0000,
        'GREATER_THAN',
        300,
        3,
        'NOTIFY',
        'WARNING',
        NULL,
        TRUE,
        2,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'scc-shr-0002',
        'HLT-MEM-CRIT',
        'Critical Memory Usage',
        'memory_usage_percent',
        'INFRASTRUCTURE',
        90.0000,
        'GREATER_THAN',
        120,
        1,
        'ALERT',
        'CRITICAL',
        NULL,
        TRUE,
        1,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'scc-shr-0003',
        'HLT-DB-SLOW',
        'Slow Database Queries',
        'db_slow_queries_count',
        'DATABASE',
        5.0000,
        'GREATER_THAN',
        300,
        2,
        'NOTIFY',
        'WARNING',
        NULL,
        FALSE,
        3,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'scc-shr-0004',
        'HLT-API-RESP',
        'API Response Time Threshold',
        'api_avg_response_ms',
        'API',
        1000.0000,
        'GREATER_THAN',
        60,
        5,
        'ALERT',
        'ERROR',
        NULL,
        TRUE,
        0,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        5,
        'scc-shr-0005',
        'HLT-FAIL-LOGIN',
        'Failed Login Spike',
        'failed_login_count',
        'SECURITY',
        10.0000,
        'GREATER_THAN',
        120,
        1,
        'LOCKDOWN',
        'CRITICAL',
        'MOD-AUTH-001',
        FALSE,
        1,
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- PHASE 1 CRITICAL FIX: SEED PASS TYPES
-- =====================================================================================
INSERT INTO
    pass_types (
        id,
        pass_type_uid,
        type_code,
        type_name,
        type_description,
        validity_duration_hours,
        max_extensions,
        requires_escort,
        access_level,
        badge_color,
        badge_template,
        is_active,
        created_by
    )
VALUES (
        1,
        'pt-0001',
        'DAY_PASS',
        'Day Pass',
        'Standard single-day visitor pass valid for business hours',
        8,
        1,
        FALSE,
        'GENERAL',
        '#4CAF50',
        'badge_standard_green',
        TRUE,
        1
    ),
    (
        2,
        'pt-0002',
        'MULTI_DAY_PASS',
        'Multi-Day Pass',
        'Extended pass for multi-day visits (conferences, audits)',
        72,
        3,
        FALSE,
        'GENERAL',
        '#2196F3',
        'badge_standard_blue',
        TRUE,
        1
    ),
    (
        3,
        'pt-0003',
        'VIP_PASS',
        'VIP Executive Pass',
        'Premium pass for executive visitors with full access',
        12,
        2,
        FALSE,
        'VIP',
        '#FFD700',
        'badge_vip_gold',
        TRUE,
        1
    ),
    (
        4,
        'pt-0004',
        'CONTRACTOR_PASS',
        'Contractor Pass',
        'Long-term pass for on-site contractors and vendors',
        720,
        5,
        TRUE,
        'CONTRACTOR',
        '#FF9800',
        'badge_contractor_orange',
        TRUE,
        1
    ),
    (
        5,
        'pt-0005',
        'TEMP_PASS',
        'Temporary Emergency Pass',
        'Short-duration pass for emergency or walk-in visitors',
        2,
        0,
        TRUE,
        'TEMPORARY',
        '#F44336',
        'badge_temp_red',
        TRUE,
        1
    );

-- =====================================================================================
-- PHASE 1 CRITICAL FIX: SEED VISITOR CONSENT RECORDS
-- =====================================================================================
INSERT INTO
    visitor_consent_records (
        id,
        consent_uid,
        visitor_id,
        organization_id,
        consent_type,
        consent_version,
        consent_text,
        consent_given,
        consent_method,
        ip_address,
        device_type,
        consented_at,
        compliance_framework,
        is_active,
        created_by
    )
VALUES (
        1,
        'vcr-0001',
        1,
        1,
        'DATA_PROCESSING',
        '1.0',
        'I consent to the processing of my personal data for the purpose of visitor management, including name, email, phone number, and identification documents. This data will be retained for 24 months per our data retention policy.',
        TRUE,
        'KIOSK',
        '10.0.1.50',
        'kiosk',
        '2026-07-06 09:00:00',
        'GDPR',
        TRUE,
        1
    ),
    (
        2,
        'vcr-0002',
        1,
        1,
        'PHOTO_CAPTURE',
        '1.0',
        'I consent to having my photograph captured for visitor identification and security badge printing during my visit.',
        TRUE,
        'KIOSK',
        '10.0.1.50',
        'kiosk',
        '2026-07-06 09:00:30',
        'GDPR',
        TRUE,
        1
    ),
    (
        3,
        'vcr-0003',
        2,
        1,
        'NDA_AGREEMENT',
        '2.1',
        'I agree to the Non-Disclosure Agreement (NDA) terms. I will not disclose any confidential information observed during my visit.',
        TRUE,
        'DIGITAL_SIGNATURE',
        '192.168.1.200',
        'desktop',
        '2026-07-06 09:30:00',
        'GENERAL',
        TRUE,
        1
    ),
    (
        4,
        'vcr-0004',
        3,
        1,
        'BIOMETRIC_COLLECTION',
        '1.0',
        'I consent to the collection and processing of biometric data (facial recognition) for security verification during check-in and check-out.',
        FALSE,
        'CHECKBOX',
        '10.0.1.50',
        'kiosk',
        '2026-07-06 10:00:00',
        'GDPR',
        TRUE,
        NULL
    ),
    (
        5,
        'vcr-0005',
        4,
        1,
        'PRIVACY_POLICY',
        '3.0',
        'I acknowledge that I have read and agree to the Privacy Policy governing the collection and use of my personal data during my visit.',
        TRUE,
        'MOBILE_APP',
        '192.168.1.220',
        'mobile',
        '2026-07-06 08:45:00',
        'GDPR',
        TRUE,
        NULL
    );

-- =====================================================================================
-- PHASE 2: SEED WEBHOOK ENDPOINTS
-- =====================================================================================
INSERT INTO
    webhook_endpoints (
        id,
        webhook_uid,
        organization_id,
        endpoint_name,
        endpoint_url,
        http_method,
        secret_key,
        content_type,
        event_types,
        retry_count,
        retry_delay_seconds,
        timeout_seconds,
        is_enabled,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'wh-0001',
        1,
        'Slack Visitor Notifications',
        'https://hooks.slack.com/services/T00/B00/xxxx',
        'POST',
        'whsec_slack_prod_abc123',
        'APPLICATION_JSON',
        '["VISITOR_CHECKED_IN","VISITOR_CHECKED_OUT","SECURITY_INCIDENT"]',
        3,
        60,
        10,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'wh-0002',
        1,
        'HR System Visitor Sync',
        'https://hr.internal.example.com/api/v1/visitors/webhook',
        'POST',
        'whsec_hr_sync_def456',
        'APPLICATION_JSON',
        '["VISITOR_REGISTERED","APPOINTMENT_APPROVED","VISITOR_BLACKLISTED"]',
        5,
        120,
        30,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'wh-0003',
        NULL,
        'Security SIEM Integration',
        'https://siem.security.example.com/api/events',
        'POST',
        'whsec_siem_ghi789',
        'APPLICATION_JSON',
        '["SECURITY_INCIDENT","EMERGENCY_LOCKDOWN","ACCESS_DENIED","LOGIN_ANOMALY"]',
        5,
        30,
        15,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- PHASE 2: SEED WEBHOOK DELIVERY LOGS
-- =====================================================================================
INSERT INTO
    webhook_delivery_logs (
        id,
        delivery_uid,
        webhook_id,
        event_type,
        event_payload,
        request_url,
        response_status_code,
        response_time_ms,
        attempt_number,
        delivery_status,
        delivered_at,
        is_active,
        created_by
    )
VALUES (
        1,
        'wdl-0001',
        1,
        'VISITOR_CHECKED_IN',
        '{"visitor_id":1,"visitor_name":"John Doe","checked_in_at":"2026-07-06T09:05:00Z","gate":"Gate A"}',
        'https://hooks.slack.com/services/T00/B00/xxxx',
        200,
        145,
        1,
        'SUCCESS',
        '2026-07-06 09:05:02',
        TRUE,
        NULL
    ),
    (
        2,
        'wdl-0002',
        2,
        'VISITOR_REGISTERED',
        '{"visitor_id":5,"email":"new@company.com","registered_at":"2026-07-06T08:30:00Z"}',
        'https://hr.internal.example.com/api/v1/visitors/webhook',
        200,
        320,
        1,
        'SUCCESS',
        '2026-07-06 08:30:05',
        TRUE,
        NULL
    ),
    (
        3,
        'wdl-0003',
        3,
        'SECURITY_INCIDENT',
        '{"incident_id":1,"type":"UNAUTHORIZED_ACCESS","severity":"HIGH"}',
        'https://siem.security.example.com/api/events',
        500,
        5010,
        1,
        'FAILED',
        '2026-07-06 14:10:00',
        TRUE,
        NULL
    ),
    (
        4,
        'wdl-0004',
        3,
        'SECURITY_INCIDENT',
        '{"incident_id":1,"type":"UNAUTHORIZED_ACCESS","severity":"HIGH"}',
        'https://siem.security.example.com/api/events',
        200,
        250,
        2,
        'SUCCESS',
        '2026-07-06 14:12:00',
        TRUE,
        NULL
    );

-- =====================================================================================
-- PHASE 2: SEED USER GROUPS
-- =====================================================================================
INSERT INTO
    user_groups (
        id,
        group_uid,
        group_code,
        group_name,
        group_description,
        organization_id,
        group_type,
        membership_rule,
        member_count,
        is_system,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'ug-0001',
        'GRP_ALL_ADMINS',
        'All Administrators',
        'System-wide group of all administrator users across organizations',
        NULL,
        'ROLE_BASED',
        '{"role_codes":["SUPER_ADMIN","ADMIN","ORG_ADMIN"]}',
        5,
        TRUE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'ug-0002',
        'GRP_SECURITY_TEAM',
        'Security Team',
        'All security officers and patrol personnel',
        1,
        'ROLE_BASED',
        '{"role_codes":["SECURITY_OFFICER","SECURITY_MANAGER"]}',
        12,
        FALSE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'ug-0003',
        'GRP_RECEPTIONISTS',
        'Reception Staff',
        'All receptionist and front desk personnel',
        1,
        'DEPARTMENT_BASED',
        '{"department_ids":[4]}',
        8,
        FALSE,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        4,
        'ug-0004',
        'GRP_BETA_TESTERS',
        'Beta Feature Testers',
        'Staff members testing new platform features before general release',
        NULL,
        'STATIC',
        NULL,
        15,
        FALSE,
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- PHASE 2: SEED API KEYS
-- =====================================================================================
INSERT INTO
    api_keys (
        id,
        key_uid,
        key_name,
        key_prefix,
        key_hash,
        organization_id,
        user_id,
        key_type,
        scopes,
        rate_limit_per_minute,
        expires_at,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'ak-0001',
        'Production Kiosk API Key',
        'vms_live',
        '$2b$12$KioskProdKeyHashedValue123456789012345678901234567890ab',
        1,
        1,
        'LIVE',
        '["checkin:create","visitor:read","pass:validate","consent:create"]',
        120,
        '2027-07-06 00:00:00',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'ak-0002',
        'Mobile App Integration Key',
        'vms_live',
        '$2b$12$MobileAppKeyHashedValue123456789012345678901234567890cd',
        1,
        1,
        'LIVE',
        '["visitor:read","appointment:read","notification:read","checkin:read"]',
        100,
        '2027-01-01 00:00:00',
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'ak-0003',
        'Staging Test Key',
        'vms_test',
        '$2b$12$StagingTestKeyHashedValue123456789012345678901234567890ef',
        NULL,
        1,
        'TEST',
        '["*"]',
        1000,
        NULL,
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- PHASE 2: SEED REPORT SUBSCRIPTIONS
-- =====================================================================================
INSERT INTO
    report_subscriptions (
        id,
        subscription_uid,
        report_id,
        user_id,
        organization_id,
        delivery_channel,
        delivery_config,
        export_format,
        schedule_cron,
        timezone,
        last_delivered_at,
        next_delivery_at,
        delivery_count,
        status,
        is_active,
        created_by
    )
VALUES (
        1,
        'rs-0001',
        1,
        1,
        1,
        'EMAIL',
        '{"email":"admin@example.com","subject_prefix":"[VMS Daily]"}',
        'PDF',
        '0 8 * * 1-5',
        'America/New_York',
        '2026-07-05 08:00:00',
        '2026-07-07 08:00:00',
        30,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        2,
        'rs-0002',
        2,
        1,
        1,
        'EMAIL',
        '{"email":"security@example.com","subject_prefix":"[VMS Security]"}',
        'EXCEL',
        '0 6 * * *',
        'America/New_York',
        '2026-07-06 06:00:00',
        '2026-07-07 06:00:00',
        60,
        'ACTIVE',
        TRUE,
        1
    ),
    (
        3,
        'rs-0003',
        1,
        1,
        1,
        'SLACK',
        '{"webhook_url":"https://hooks.slack.com/services/T00/B01/report","channel":"#vms-reports"}',
        'CSV',
        '0 9 * * 1',
        'UTC',
        '2026-06-30 09:00:00',
        '2026-07-07 09:00:00',
        4,
        'ACTIVE',
        TRUE,
        1
    );

-- =====================================================================================
-- PHASE 2: SEED DATA EXPORT JOBS
-- =====================================================================================
INSERT INTO
    data_export_jobs (
        id,
        job_uid,
        user_id,
        organization_id,
        export_type,
        export_format,
        export_filters,
        total_records,
        exported_records,
        file_path,
        file_size_bytes,
        started_at,
        completed_at,
        job_status,
        is_active,
        created_by
    )
VALUES (
        1,
        'dej-0001',
        1,
        1,
        'VISITORS',
        'CSV',
        '{"date_range":{"from":"2026-01-01","to":"2026-06-30"},"status":"ACTIVE"}',
        15420,
        15420,
        '/exports/visitors_2026H1_20260706.csv',
        2458300,
        '2026-07-06 10:00:00',
        '2026-07-06 10:02:15',
        'COMPLETED',
        TRUE,
        1
    ),
    (
        2,
        'dej-0002',
        1,
        1,
        'AUDIT_LOGS',
        'EXCEL',
        '{"date_range":{"from":"2026-07-01","to":"2026-07-06"},"severity":["HIGH","CRITICAL"]}',
        342,
        342,
        '/exports/audit_high_critical_20260706.xlsx',
        89200,
        '2026-07-06 11:30:00',
        '2026-07-06 11:30:45',
        'COMPLETED',
        TRUE,
        1
    ),
    (
        3,
        'dej-0003',
        1,
        1,
        'APPOINTMENTS',
        'PDF',
        '{"date_range":{"from":"2026-07-01","to":"2026-07-31"},"status":"APPROVED"}',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'QUEUED',
        TRUE,
        1
    );

-- =====================================================================================
-- PHASE 3: SEED DATA PURGE LOGS
-- =====================================================================================
INSERT INTO
    data_purge_logs (
        id,
        purge_uid,
        purge_policy_id,
        target_table,
        target_module,
        purge_type,
        purge_criteria,
        records_affected,
        records_archived,
        retention_days,
        compliance_framework,
        execution_time_ms,
        executed_by,
        execution_method,
        started_at,
        completed_at,
        purge_status,
        is_active,
        created_by
    )
VALUES (
        1,
        'dpl-0001',
        4,
        'alm_api_request_logs',
        'AUDIT',
        'HARD_DELETE',
        '{"where":"created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)","environment":"PRODUCTION"}',
        245000,
        0,
        30,
        'SOC2',
        18500,
        1,
        'SCHEDULED',
        '2026-07-01 02:00:00',
        '2026-07-01 02:00:19',
        'COMPLETED',
        TRUE,
        1
    ),
    (
        2,
        'dpl-0002',
        4,
        'alm_session_logs',
        'AUDIT',
        'ARCHIVE',
        '{"where":"created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)","environment":"PRODUCTION"}',
        82000,
        82000,
        90,
        'GDPR',
        35200,
        1,
        'SCHEDULED',
        '2026-07-01 03:00:00',
        '2026-07-01 03:00:35',
        'COMPLETED',
        TRUE,
        1
    ),
    (
        3,
        'dpl-0003',
        4,
        'notification_delivery_logs',
        'NOTIFICATION',
        'ANONYMIZE',
        '{"where":"created_at < DATE_SUB(NOW(), INTERVAL 180 DAY)","fields":["recipient_email","recipient_phone"]}',
        156000,
        0,
        180,
        'GDPR',
        42100,
        1,
        'MANUAL',
        '2026-07-05 14:30:00',
        '2026-07-05 14:30:42',
        'COMPLETED',
        TRUE,
        1
    );

-- =====================================================================================
-- PHASE 3: SEED TRANSLATIONS
-- =====================================================================================
INSERT INTO
    translations (
        id,
        translation_uid,
        locale,
        translation_key,
        translation_value,
        module_scope,
        context,
        is_verified,
        version,
        is_active,
        created_by
    )
VALUES (
        1,
        'tr-0001',
        'en-US',
        'visitor.status.active',
        'Active',
        'VISITOR',
        'status_label',
        TRUE,
        1,
        TRUE,
        1
    ),
    (
        2,
        'tr-0002',
        'en-US',
        'visitor.status.inactive',
        'Inactive',
        'VISITOR',
        'status_label',
        TRUE,
        1,
        TRUE,
        1
    ),
    (
        3,
        'tr-0003',
        'en-US',
        'visitor.status.blocked',
        'Blocked',
        'VISITOR',
        'status_label',
        TRUE,
        1,
        TRUE,
        1
    ),
    (
        4,
        'tr-0004',
        'en-US',
        'checkin.button.submit',
        'Check In Now',
        'CHECKIN',
        'button_label',
        TRUE,
        1,
        TRUE,
        1
    ),
    (
        5,
        'tr-0005',
        'pt-BR',
        'visitor.status.active',
        'Ativo',
        'VISITOR',
        'status_label',
        TRUE,
        1,
        TRUE,
        1
    ),
    (
        6,
        'tr-0006',
        'pt-BR',
        'visitor.status.inactive',
        'Inativo',
        'VISITOR',
        'status_label',
        TRUE,
        1,
        TRUE,
        1
    ),
    (
        7,
        'tr-0007',
        'pt-BR',
        'visitor.status.blocked',
        'Bloqueado',
        'VISITOR',
        'status_label',
        TRUE,
        1,
        TRUE,
        1
    ),
    (
        8,
        'tr-0008',
        'pt-BR',
        'checkin.button.submit',
        'Fazer Check-In',
        'CHECKIN',
        'button_label',
        TRUE,
        1,
        TRUE,
        1
    );

-- =====================================================================================
-- PHASE 3: SEED ORGANIZATION BRANDING
-- =====================================================================================
INSERT INTO
    organization_branding (
        id,
        branding_uid,
        organization_id,
        primary_color,
        secondary_color,
        accent_color,
        background_color,
        text_color,
        font_family,
        kiosk_welcome_message,
        default_locale,
        default_timezone,
        is_active,
        created_by
    )
VALUES (
        1,
        'ob-0001',
        1,
        '#1565C0',
        '#37474F',
        '#FF6F00',
        '#FAFAFA',
        '#212121',
        'Inter, system-ui, sans-serif',
        'Welcome to our headquarters. Please check in at the kiosk or speak with our receptionist.',
        'en-US',
        'America/New_York',
        TRUE,
        1
    );

-- =====================================================================================
-- 25. SEED CALENDARS & SETTINGS DATA
-- =====================================================================================
INSERT INTO
    timezone_settings (
        id,
        organization_id,
        branch_id,
        timezone,
        utc_offset,
        dst
    )
VALUES (
        1,
        1,
        NULL,
        'Africa/Addis_Ababa',
        '+03:00',
        FALSE
    ),
    (
        2,
        1,
        1,
        'Africa/Addis_Ababa',
        '+03:00',
        FALSE
    );

INSERT INTO
    business_schedules (
        id,
        organization_id,
        branch_id,
        timezone,
        start_date,
        end_date,
        weekly_schedule,
        status
    )
VALUES (
        1,
        1,
        NULL,
        'Africa/Addis_Ababa',
        '2026-01-01',
        NULL,
        '{"mon":{"start":"08:30","end":"17:30","active":true},"tue":{"start":"08:30","end":"17:30","active":true},"wed":{"start":"08:30","end":"17:30","active":true},"thu":{"start":"08:30","end":"17:30","active":true},"fri":{"start":"08:30","end":"17:30","active":true},"sat":{"start":"09:00","end":"13:00","active":false},"sun":{"start":"09:00","end":"13:00","active":false}}',
        'ACTIVE'
    );

INSERT INTO
    holidays (
        id,
        name,
        type,
        date,
        applies_to,
        organization_id,
        branch_id,
        status
    )
VALUES (
        1,
        'New Year Day',
        'PUBLIC',
        '2026-01-01',
        'ALL',
        1,
        NULL,
        'ACTIVE'
    ),
    (
        2,
        'Adwa Victory Day',
        'PUBLIC',
        '2026-03-02',
        'ALL',
        1,
        NULL,
        'ACTIVE'
    ),
    (
        3,
        'Good Friday',
        'PUBLIC',
        '2026-04-17',
        'ALL',
        1,
        NULL,
        'ACTIVE'
    ),
    (
        4,
        'Easter Monday',
        'PUBLIC',
        '2026-04-20',
        'ALL',
        1,
        NULL,
        'ACTIVE'
    ),
    (
        5,
        'Patriots Victory Day',
        'PUBLIC',
        '2026-05-05',
        'ALL',
        1,
        NULL,
        'ACTIVE'
    );

INSERT INTO
    organization_settings (
        id,
        organization_id,
        setting_key,
        setting_value
    )
VALUES (
        10,
        1,
        'general',
        '{"orgCode":"VMS","defaultLanguage":"en","defaultCountry":"Ethiopia","defaultCurrency":"ETB","dateFormat":"YYYY-MM-DD","timeFormat":"24h","timeZone":"Africa/Addis_Ababa","businessWeekStart":"Monday","fiscalYearStart":"July"}'
    ),
    (
        11,
        1,
        'localization',
        '{"language":"en","country":"Ethiopia","currency":"ETB","numberFormat":"1,234,567.89","dateFormat":"YYYY-MM-DD","timeFormat":"24h","firstDayOfWeek":"Monday","timeZone":"Africa/Addis_Ababa"}'
    ),
    (
        12,
        1,
        'visitor',
        '{"allowWalkIn":true,"requireAppointment":false,"photoRequired":true,"govIdRequired":true,"selfRegEnabled":true,"qrEnabled":true,"defaultPassDuration":8,"maxVisitorsPerDay":500}'
    ),
    (
        13,
        1,
        'security',
        '{"sessionTimeout":30,"autoLogoutTime":15,"passwordExpiration":90,"maxLoginAttempts":5,"deviceRestrictions":false,"ipRestrictions":"","securityAlerts":true,"twoFactorAuth":false}'
    ),
    (
        14,
        1,
        'notifications',
        '{"email":{"visitorRegistration":true,"appointmentApproval":true,"checkIn":true,"checkOut":true,"passExpiration":true,"emergencyAlerts":true},"sms":{"visitorRegistration":false,"appointmentApproval":true,"checkIn":true,"checkOut":false,"passExpiration":false,"emergencyAlerts":true},"push":{"visitorRegistration":true,"appointmentApproval":true,"checkIn":true,"checkOut":true,"passExpiration":true,"emergencyAlerts":true},"inApp":{"visitorRegistration":true,"appointmentApproval":true,"checkIn":true,"checkOut":true,"passExpiration":true,"emergencyAlerts":true}}'
    ),
    (
        15,
        1,
        'numbering',
        '{"visitorIdPrefix":"VIS","employeeIdPrefix":"EMP","appointmentPrefix":"APP","visitorPassPrefix":"PASS","referenceNumberPrefix":"REF","organizationPrefix":"ORG"}'
    ),
    (
        16,
        1,
        'integrations',
        '{"emailProvider":"smtp.gmail.com","smsProvider":"Twilio Gateway","qrCodeService":"Internal Generator","restApiEndpoint":"https://api.visitor.com/v1","webhookUrl":"https://hooks.visitor.com/events","ldapActiveDirectory":""}'
    ),
    (
        17,
        1,
        'retention',
        '{"visitorRecordRetention":365,"auditLogRetention":180,"documentRetention":365,"automaticArchive":true,"automaticDeletion":false,"privacyNoticeVersion":"v2.1"}'
    ),
    (
        18,
        1,
        'features',
        '{"selfRegistration":true,"qrPass":true,"multiBranch":true,"vehicleManagement":false,"emergencyMode":false,"analyticsDashboard":true,"facialRecognition":false}'
    );

INSERT INTO
    settings_change_history (
        id,
        setting,
        prev_value,
        new_value,
        changed_by,
        reason
    )
VALUES (
        1,
        'General: defaultCurrency',
        'USD',
        'ETB',
        'System Administrator',
        'Aligning localization rules with Headquarters'
    ),
    (
        2,
        'Features: facialRecognition',
        'true',
        'false',
        'System Administrator',
        'Deactivating facial recognition module for privacy standard compliance'
    );

INSERT INTO
    settings_backups (
        id,
        date,
        size,
        created_by,
        status,
        snapshot
    )
VALUES (
        1,
        '2026-07-15 09:00:00',
        '4.2 KB',
        'System Administrator',
        'COMPLETED',
        '{}'
    ),
    (
        2,
        '2026-07-20 17:30:00',
        '4.5 KB',
        'System Administrator',
        'COMPLETED',
        '{}'
    );

SET FOREIGN_KEY_CHECKS = 1;