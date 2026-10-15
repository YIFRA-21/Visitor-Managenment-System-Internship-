// Backend/src/scripts/setup-department-manager.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function setupDepartmentManager() {
  console.log('[SETUP] Initializing Department Manager Role & Data...');

  // 1. Define Department Manager Permissions
  const permissions = [
    { code: 'department.view', alias: 'DEPARTMENT:VIEW', name: 'View Department Overview & Details', module: 'DEPARTMENT' },
    { code: 'department.employee.view', alias: 'DEPARTMENT:EMPLOYEE_VIEW', name: 'View Department Employees', module: 'DEPARTMENT' },
    { code: 'department.employee.assign', alias: 'DEPARTMENT:EMPLOYEE_ASSIGN', name: 'Assign Department Employees', module: 'DEPARTMENT' },
    { code: 'department.host.view', alias: 'DEPARTMENT:HOST_VIEW', name: 'View Department Hosts', module: 'DEPARTMENT' },
    { code: 'department.host.assign', alias: 'DEPARTMENT:HOST_ASSIGN', name: 'Assign/Unassign Department Hosts', module: 'DEPARTMENT' },
    { code: 'department.host.availability', alias: 'DEPARTMENT:HOST_AVAILABILITY', name: 'Manage Host Availability', module: 'DEPARTMENT' },
    { code: 'department.visitor_request.view', alias: 'DEPARTMENT:VISITOR_REQUEST_VIEW', name: 'View Department Visitor Requests', module: 'DEPARTMENT' },
    { code: 'department.visitor_request.approve', alias: 'DEPARTMENT:VISITOR_REQUEST_APPROVE', name: 'Approve Department Visitor Requests', module: 'DEPARTMENT' },
    { code: 'department.visitor_request.reject', alias: 'DEPARTMENT:VISITOR_REQUEST_REJECT', name: 'Reject Department Visitor Requests', module: 'DEPARTMENT' },
    { code: 'department.visitor_request.reassign', alias: 'DEPARTMENT:VISITOR_REQUEST_REASSIGN', name: 'Reassign Visitor Request Host', module: 'DEPARTMENT' },
    { code: 'department.appointment.view', alias: 'DEPARTMENT:APPOINTMENT_VIEW', name: 'View Department Appointments', module: 'DEPARTMENT' },
    { code: 'department.appointment.manage', alias: 'DEPARTMENT:APPOINTMENT_MANAGE', name: 'Manage Department Appointments', module: 'DEPARTMENT' },
    { code: 'department.visitor.view', alias: 'DEPARTMENT:VISITOR_VIEW', name: 'View Department Visitors', module: 'DEPARTMENT' },
    { code: 'department.report.view', alias: 'DEPARTMENT:REPORT_VIEW', name: 'View Department Reports', module: 'DEPARTMENT' },
    { code: 'department.report.export', alias: 'DEPARTMENT:REPORT_EXPORT', name: 'Export Department Reports', module: 'DEPARTMENT' },
    { code: 'department.audit.view', alias: 'DEPARTMENT:AUDIT_VIEW', name: 'View Department Audit Logs', module: 'DEPARTMENT' },
    { code: 'department.notification.view', alias: 'DEPARTMENT:NOTIFICATION_VIEW', name: 'View Department Notifications', module: 'DEPARTMENT' },
  ];

  // Insert permissions
  for (const p of permissions) {
    try {
      await db.query(
        `INSERT INTO permissions (permission_code, permission_name, module) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE permission_name = VALUES(permission_name), module = VALUES(module)`,
        [p.code, p.name, p.module]
      );
    } catch (e) {
      console.warn(`Permission insert note (${p.code}):`, e.message);
    }
  }

  // 2. Link permissions to Role ID 6 (Department Manager) in role_permissions
  const mgrRole = await db.query(`SELECT id FROM roles WHERE id = 6 OR role_code = 'MANAGER' LIMIT 1`);
  const mgrRoleId = mgrRole[0]?.id || 6;

  for (const p of permissions) {
    const permRow = await db.query(`SELECT id FROM permissions WHERE permission_code = ?`, [p.code]);
    if (permRow[0]) {
      try {
        await db.query(
          `INSERT INTO role_permissions (role_id, permission_id) 
           VALUES (?, ?) 
           ON DUPLICATE KEY UPDATE role_id = role_id`,
          [mgrRoleId, permRow[0].id]
        );
      } catch (e) {}
    }
  }

  // 3. Ensure Department 5 (Human Resources) is active and linked to Org 2 (IT park), Branch 3 (Tulu Dimtu)
  await db.query(`
    UPDATE departments 
    SET organization_id = 2, branch_id = 3, manager_user_id = 4, manager_id = 4, status = 'ACTIVE' 
    WHERE id = 5
  `);

  // 4. Update manager1 user record
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Manager@123', salt);

  await db.query(`
    UPDATE users 
    SET role = 'manager', 
        first_name = 'Manager', 
        last_name = 'Admin', 
        full_name = 'Manager Admin', 
        organization_id = 2, 
        branch_id = 3, 
        department_id = 5, 
        account_status = 'ACTIVE', 
        status = 'active', 
        is_active = 1,
        password_hash = ?
    WHERE id = 4
  `, [passwordHash]);

  // Ensure manager_profiles has entry
  await db.query(`
    INSERT INTO manager_profiles (
      user_id, manager_number, department_id, position, office, phone, email, approval_authority_level
    ) VALUES (
      4, 'MGR-000004', 5, 'HR Department Manager', 'Building B, Floor 2, Suite 204', '+251-911-000444', 'manager1@visitor.com', 2
    ) ON DUPLICATE KEY UPDATE 
      department_id = 5, 
      position = 'HR Department Manager',
      office = 'Building B, Floor 2, Suite 204'
  `);

  // Ensure user_roles has assignment
  await db.query(`
    INSERT INTO user_roles (user_id, role_id, is_active)
    VALUES (4, ?, TRUE)
    ON DUPLICATE KEY UPDATE is_active = TRUE
  `, [mgrRoleId]);

  // 5. Create / Seed 3 Department Employees in Dept 5 (Human Resources)
  // Employee 1: John Doe (Host)
  // Employee 2: Sarah Connor (Alternative Host)
  // Employee 3: Michael Scott (Employee)
  const deptEmployees = [
    {
      userCode: 'EMP-HR001',
      username: 'john.doe',
      email: 'john.doe@itpark.et',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+251-911-100101',
      position: 'Senior HR Specialist',
      isHostEnabled: 1,
      availabilityStatus: 'AVAILABLE',
      maxVisitorsPerDay: 5,
    },
    {
      userCode: 'EMP-HR002',
      username: 'sarah.connor',
      email: 'sarah.connor@itpark.et',
      firstName: 'Sarah',
      lastName: 'Connor',
      phone: '+251-911-100102',
      position: 'Talent Acquisition Officer',
      isHostEnabled: 1,
      availabilityStatus: 'AVAILABLE',
      maxVisitorsPerDay: 4,
    },
    {
      userCode: 'EMP-HR003',
      username: 'michael.scott',
      email: 'michael.scott@itpark.et',
      firstName: 'Michael',
      lastName: 'Scott',
      phone: '+251-911-100103',
      position: 'HR Coordinator',
      isHostEnabled: 1,
      availabilityStatus: 'UNAVAILABLE', // Initially unavailable for testing reassignment
      maxVisitorsPerDay: 3,
    },
  ];

  for (const emp of deptEmployees) {
    // 5a. Upsert user
    let userRow = await db.query(`SELECT id FROM users WHERE email = ?`, [emp.email]);
    let empUserId;
    if (!userRow[0]) {
      const uRes = await db.query(`
        INSERT INTO users (
          username, email, password_hash, first_name, last_name, full_name, phone, phone_number,
          role, department_id, organization_id, branch_id, account_status, status, is_active, user_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'staff', 5, 2, 3, 'ACTIVE', 'active', 1, ?)
      `, [
        emp.username, emp.email, passwordHash, emp.firstName, emp.lastName, `${emp.firstName} ${emp.lastName}`,
        emp.phone, emp.phone, emp.userCode
      ]);
      empUserId = uRes.insertId;
    } else {
      empUserId = userRow[0].id;
      await db.query(`
        UPDATE users 
        SET department_id = 5, organization_id = 2, branch_id = 3, is_active = 1, role = 'staff'
        WHERE id = ?
      `, [empUserId]);
    }

    // 5b. Upsert employee
    await db.query(`
      INSERT INTO employees (
        user_id, employee_number, department_id, organization_id, branch_id,
        first_name, last_name, full_name, email, mobile_number, position,
        is_host_enabled, availability_status, max_visitors_per_day
      ) VALUES (?, ?, 5, 2, 3, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        department_id = 5,
        organization_id = 2,
        branch_id = 3,
        position = VALUES(position),
        is_host_enabled = VALUES(is_host_enabled),
        availability_status = VALUES(availability_status)
    `, [
      empUserId, emp.userCode, emp.firstName, emp.lastName, `${emp.firstName} ${emp.lastName}`,
      emp.email, emp.phone, emp.position, emp.isHostEnabled, emp.availabilityStatus, emp.maxVisitorsPerDay
    ]);
  }

  // 6. Ensure Abebe visitor exists and has appointments in Department 5
  let visitorRow = await db.query(`SELECT id FROM visitors WHERE email = 'abebe.visitor@gmail.com'`);
  let visitorId;
  if (!visitorRow[0]) {
    const vRes = await db.query(`
      INSERT INTO visitors (
        visitor_code, full_name, email, phone, company, registration_status, status, organization_id, branch_id, department_id
      ) VALUES ('VISIT-000501', 'Abebe Bikila', 'abebe.visitor@gmail.com', '+251-922-334455', 'Addis Tech Solutions', 'APPROVED', 'ACTIVE', 2, 3, 5)
    `);
    visitorId = vRes.insertId;
  } else {
    visitorId = visitorRow[0].id;
    await db.query(`UPDATE visitors SET organization_id = 2, branch_id = 3, department_id = 5, status = 'ACTIVE' WHERE id = ?`, [visitorId]);
  }

  // Get John Doe's employee record
  const johnEmp = await db.query(`SELECT id, user_id FROM employees WHERE email = 'john.doe@itpark.et' LIMIT 1`);
  const johnHostId = johnEmp[0]?.id || 1;
  const johnUserId = johnEmp[0]?.user_id || 1;

  // Insert 2 test appointments in Department 5
  const sampleAppts = [
    {
      num: 'VMS-HR-2026-001',
      purpose: 'Technical Interview & Onboarding Discussion',
      status: 'pending_approval',
      apptStatus: 'REQUESTED',
      approvalStatus: 'PENDING',
      start: new Date(Date.now() + 3600 * 1000 * 2).toISOString().slice(0, 19).replace('T', ' '),
      end: new Date(Date.now() + 3600 * 1000 * 3).toISOString().slice(0, 19).replace('T', ' '),
      refCode: 'HR-REQ-001'
    },
    {
      num: 'VMS-HR-2026-002',
      purpose: 'Annual Benefits Consultation Meeting',
      status: 'approved',
      apptStatus: 'APPROVED',
      approvalStatus: 'APPROVED',
      start: new Date(Date.now() - 3600 * 1000 * 2).toISOString().slice(0, 19).replace('T', ' '),
      end: new Date(Date.now() + 3600 * 1000 * 1).toISOString().slice(0, 19).replace('T', ' '),
      refCode: 'HR-APP-002'
    }
  ];

  for (const a of sampleAppts) {
    try {
      const apptRes = await db.query(`
        INSERT INTO appointments (
          appointment_number, organization_id, branch_id, department_id,
          visitor_id, host_id, host_employee_id, scheduled_start, scheduled_end,
          expected_duration_minutes, priority, approval_status, appointment_status,
          status, purpose, reference_code
        ) VALUES (?, 2, 3, 5, ?, ?, ?, ?, ?, 60, 'MEDIUM', ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          department_id = 5,
          organization_id = 2,
          branch_id = 3
      `, [
        a.num, visitorId, johnUserId, johnHostId, a.start, a.end,
        a.approvalStatus, a.apptStatus, a.status, a.purpose, a.refCode
      ]);

      const insertedApptId = apptRes.insertId;
      if (insertedApptId) {
        // Create initial approval record
        await db.query(`
          INSERT INTO appointment_approvals (
            appointment_id, approver_id, approval_level, decision, comments
          ) VALUES (?, ?, 1, ?, 'Initial request submitted')
          ON DUPLICATE KEY UPDATE decision = VALUES(decision)
        `, [insertedApptId, johnUserId, a.approvalStatus]);
      }
    } catch (e) {
      console.warn(`Appointment seed note (${a.num}):`, e.message);
    }
  }

  console.log('[SETUP] Department Manager data initialization complete successfully!');
  console.log('Login credentials for Department Manager:');
  console.log('  Username: manager1');
  console.log('  Email: manager1@visitor.com');
  console.log('  Password: Manager@123');
  console.log('  Department: Human Resources (ID 5)');
  console.log('  Organization: IT park (ID 2)');
  console.log('  Branch: Tulu Dimtu (ID 3)');
}

setupDepartmentManager().then(() => process.exit(0)).catch(err => {
  console.error('[SETUP ERROR]', err);
  process.exit(1);
});
