const db = require('../config/db');

const permissions = [
  // VISITORS (10)
  { code: 'VISITOR:READ', name: 'View Visitors List & Details', module: 'VISITORS', resource: 'VISITOR_RECORD', action: 'VIEW', risk: 'LOW', desc: 'Allows viewing visitor profiles and logs' },
  { code: 'VISITOR:CREATE', name: 'Register New Visitor', module: 'VISITORS', resource: 'VISITOR_RECORD', action: 'CREATE', risk: 'LOW', desc: 'Allows registering new visitor entries' },
  { code: 'VISITOR:UPDATE', name: 'Edit Visitor Information', module: 'VISITORS', resource: 'VISITOR_RECORD', action: 'UPDATE', risk: 'LOW', desc: 'Allows updating visitor profile details' },
  { code: 'VISITOR:DELETE', name: 'Delete Visitor Record', module: 'VISITORS', resource: 'VISITOR_RECORD', action: 'DELETE', risk: 'HIGH', desc: 'Allows purging visitor entries' },
  { code: 'VISITOR:CHECKIN', name: 'Check-in Visitor', module: 'VISITORS', resource: 'CHECKIN', action: 'CHECK_IN', risk: 'LOW', desc: 'Allows processing visitor entry check-ins' },
  { code: 'VISITOR:CHECKOUT', name: 'Check-out Visitor', module: 'VISITORS', resource: 'CHECKOUT', action: 'CHECK_OUT', risk: 'LOW', desc: 'Allows processing visitor exit check-outs' },
  { code: 'VISITOR:BADGE_PRINT', name: 'Print Visitor Badge', module: 'VISITORS', resource: 'BADGE', action: 'GENERATE', risk: 'LOW', desc: 'Allows printing physical access badges' },
  { code: 'VISITOR:ID_VERIFY', name: 'Verify National ID / Passport', module: 'VISITORS', resource: 'IDENTITY_DOC', action: 'APPROVE', risk: 'MEDIUM', desc: 'Allows scanning and verifying visitor ID documents' },
  { code: 'VISITOR:VIP_FLAG', name: 'Flag VIP Visitor', module: 'VISITORS', resource: 'VIP_STATUS', action: 'UPDATE', risk: 'MEDIUM', desc: 'Allows flagging high-priority VIP visitors' },
  { code: 'VISITOR:EXPORT', name: 'Export Visitor Records', module: 'VISITORS', resource: 'VISITOR_DATA', action: 'EXPORT', risk: 'MEDIUM', desc: 'Allows exporting CSV/PDF visitor logs' },

  // SECURITY (10)
  { code: 'SECURITY:BLACKLIST', name: 'Manage Blacklist Entries', module: 'SECURITY', resource: 'BLACKLIST', action: 'UPDATE', risk: 'HIGH', desc: 'Allows banning or unbanning individuals' },
  { code: 'SECURITY:WATCHLIST', name: 'View Watchlist Alerts', module: 'SECURITY', resource: 'WATCHLIST', action: 'VIEW', risk: 'HIGH', desc: 'Allows viewing security watchlist notifications' },
  { code: 'SECURITY:ALERT_DISPATCH', name: 'Dispatch Security Alert', module: 'SECURITY', resource: 'ALERT', action: 'CREATE', risk: 'HIGH', desc: 'Allows broadcasting facility security alerts' },
  { code: 'SECURITY:ACCESS_PASS', name: 'Issue Temporary Access Pass', module: 'SECURITY', resource: 'ACCESS_CARD', action: 'CREATE', risk: 'MEDIUM', desc: 'Allows issuing RFID turnstile passes' },
  { code: 'SECURITY:GATE_OVERRIDE', name: 'Manual Barrier / Gate Override', module: 'SECURITY', resource: 'TURNSTILE_GATE', action: 'UPDATE', risk: 'CRITICAL', desc: 'Allows manual physical gate overrides' },
  { code: 'SECURITY:INCIDENT_LOG', name: 'Log Incident Report', module: 'SECURITY', resource: 'INCIDENT_REPORT', action: 'CREATE', risk: 'MEDIUM', desc: 'Allows documenting security violations' },
  { code: 'SECURITY:EVACUATION', name: 'Initiate Emergency Evacuation Mode', module: 'SECURITY', resource: 'EVACUATION', action: 'UPDATE', risk: 'CRITICAL', desc: 'Allows triggering building emergency muster' },
  { code: 'SECURITY:LOCKDOWN', name: 'Execute Facility Lockdown', module: 'SECURITY', resource: 'LOCKDOWN', action: 'UPDATE', risk: 'CRITICAL', desc: 'Allows triggering security perimeter lockdown' },
  { code: 'SECURITY:CAMERA_VIEW', name: 'Access CCTV Feed Streams', module: 'SECURITY', resource: 'CCTV_FEED', action: 'VIEW', risk: 'HIGH', desc: 'Allows viewing live surveillance cameras' },
  { code: 'SECURITY:AUDIT_TRACE', name: 'Inspect Gate Access Logs', module: 'SECURITY', resource: 'GATE_LOG', action: 'VIEW', risk: 'MEDIUM', desc: 'Allows searching physical access turnstile logs' },

  // APPOINTMENTS & APPROVALS (8)
  { code: 'APPOINTMENT:READ', name: 'View Appointments', module: 'APPOINTMENTS', resource: 'APPOINTMENT', action: 'VIEW', risk: 'LOW', desc: 'Allows viewing pre-scheduled appointments' },
  { code: 'APPOINTMENT:CREATE', name: 'Pre-register Appointment', module: 'APPOINTMENTS', resource: 'APPOINTMENT', action: 'CREATE', risk: 'LOW', desc: 'Allows scheduling pre-registered visitors' },
  { code: 'APPOINTMENT:UPDATE', name: 'Reschedule Appointment', module: 'APPOINTMENTS', resource: 'APPOINTMENT', action: 'UPDATE', risk: 'LOW', desc: 'Allows updating appointment dates & hosts' },
  { code: 'APPOINTMENT:CANCEL', name: 'Cancel Appointment', module: 'APPOINTMENTS', resource: 'APPOINTMENT', action: 'DELETE', risk: 'LOW', desc: 'Allows cancelling upcoming appointments' },
  { code: 'APPROVAL:APPROVE', name: 'Approve Visit Request', module: 'APPROVALS', resource: 'VISIT_REQUEST', action: 'APPROVE', risk: 'MEDIUM', desc: 'Allows approving incoming visitor invitations' },
  { code: 'APPROVAL:REJECT', name: 'Reject Visit Request', module: 'APPROVALS', resource: 'VISIT_REQUEST', action: 'REJECT', risk: 'MEDIUM', desc: 'Allows rejecting unauthorized visit requests' },
  { code: 'APPROVAL:DELEGATE', name: 'Delegate Approval Authority', module: 'APPROVALS', resource: 'DELEGATION', action: 'UPDATE', risk: 'MEDIUM', desc: 'Allows delegating approval rights to colleague' },
  { code: 'APPOINTMENT:QR_GENERATE', name: 'Generate Visitor QR Pass', module: 'APPOINTMENTS', resource: 'QR_PASS', action: 'GENERATE', risk: 'LOW', desc: 'Allows emailing QR access passes to guests' },

  // EMPLOYEES & HOSTS (6)
  { code: 'EMPLOYEE:READ', name: 'View Employee Directory', module: 'EMPLOYEES', resource: 'EMPLOYEE_DIRECTORY', action: 'VIEW', risk: 'LOW', desc: 'Allows searching host employees' },
  { code: 'EMPLOYEE:ROSTER_MANAGE', name: 'Manage Shift Rosters', module: 'EMPLOYEES', resource: 'SHIFT_ROSTER', action: 'UPDATE', risk: 'MEDIUM', desc: 'Allows editing employee work shifts' },
  { code: 'EMPLOYEE:HOST_ASSIGN', name: 'Reassign Host Employee', module: 'EMPLOYEES', resource: 'HOST_ASSIGNMENT', action: 'UPDATE', risk: 'LOW', desc: 'Allows changing assigned host for visitor' },
  { code: 'EMPLOYEE:INVITE_SEND', name: 'Send Mass Invitation', module: 'EMPLOYEES', resource: 'MASS_INVITE', action: 'CREATE', risk: 'MEDIUM', desc: 'Allows sending bulk event invitations' },
  { code: 'EMPLOYEE:DEPARTMENT_MANAGE', name: 'Manage Departments', module: 'EMPLOYEES', resource: 'DEPARTMENT', action: 'UPDATE', risk: 'HIGH', desc: 'Allows editing department structures' },
  { code: 'EMPLOYEE:SCHEDULE_VIEW', name: 'View Host Availability', module: 'EMPLOYEES', resource: 'HOST_CALENDAR', action: 'VIEW', risk: 'LOW', desc: 'Allows checking host meeting schedules' },

  // AUDIT & COMPLIANCE (6)
  { code: 'AUDIT:READ', name: 'View Audit Logs', module: 'AUDIT', resource: 'AUDIT_LOG', action: 'VIEW', risk: 'MEDIUM', desc: 'Allows inspecting system action history' },
  { code: 'AUDIT:EXPORT', name: 'Export Audit Log Reports', module: 'AUDIT', resource: 'AUDIT_DATA', action: 'EXPORT', risk: 'HIGH', desc: 'Allows exporting compliance audit files' },
  { code: 'COMPLIANCE:GDPR_PURGE', name: 'Execute GDPR Data Purge', module: 'COMPLIANCE', resource: 'PERSONAL_DATA', action: 'DELETE', risk: 'CRITICAL', desc: 'Allows anonymizing expired visitor data' },
  { code: 'COMPLIANCE:REPORT_GENERATE', name: 'Generate Compliance Audit Report', module: 'COMPLIANCE', resource: 'COMPLIANCE_REPORT', action: 'GENERATE', risk: 'HIGH', desc: 'Allows generating regulatory reports' },
  { code: 'AUDIT:SECURITY_TRACE', name: 'Trace System Privileges', module: 'AUDIT', resource: 'PRIVILEGE_TRACE', action: 'VIEW', risk: 'HIGH', desc: 'Allows auditing privilege escalation events' },
  { code: 'COMPLIANCE:RETENTION_POLICY', name: 'Manage Data Retention Policy', module: 'COMPLIANCE', resource: 'RETENTION_RULE', action: 'UPDATE', risk: 'CRITICAL', desc: 'Allows defining data retention periods' },

  // SYSTEM & ADMINISTRATION (6)
  { code: 'SYSTEM:SETTINGS_MANAGE', name: 'Configure System Settings', module: 'SYSTEM', resource: 'SYSTEM_CONFIG', action: 'UPDATE', risk: 'CRITICAL', desc: 'Allows modifying system global parameters' },
  { code: 'SYSTEM:ROLES_MANAGE', name: 'Manage Roles & Permissions', module: 'SYSTEM', resource: 'ROLE_POLICY', action: 'UPDATE', risk: 'CRITICAL', desc: 'Allows creating and editing system roles' },
  { code: 'SYSTEM:INTEGRATION_CONFIG', name: 'Configure Webhooks & APIs', module: 'SYSTEM', resource: 'API_INTEGRATION', action: 'UPDATE', risk: 'CRITICAL', desc: 'Allows managing API keys and integrations' },
  { code: 'SYSTEM:BACKUP_RUN', name: 'Trigger System Backup', module: 'SYSTEM', resource: 'DATABASE_BACKUP', action: 'CREATE', risk: 'HIGH', desc: 'Allows running manual database backups' },
  { code: 'SYSTEM:LICENSING_VIEW', name: 'View System License', module: 'SYSTEM', resource: 'LICENSE', action: 'VIEW', risk: 'LOW', desc: 'Allows viewing active enterprise license' },
  { code: 'SYSTEM:HEALTH_MONITOR', name: 'View System Health & Metrics', module: 'SYSTEM', resource: 'SYSTEM_HEALTH', action: 'VIEW', risk: 'LOW', desc: 'Allows viewing CPU/DB telemetry' }
];

async function seedPermissions() {
  try {
    console.log('Inserting 42 Enterprise Permissions into MySQL database...');

    for (const p of permissions) {
      await db.query(
        `INSERT INTO permissions (permission_code, permission_name, module, resource, action, risk_level, description, status, is_system_permission)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1)
         ON DUPLICATE KEY UPDATE permission_name=?, description=?, risk_level=?, updated_at=NOW()`,
        [p.code, p.name, p.module, p.resource, p.action, p.risk, p.desc, p.name, p.desc, p.risk]
      );
    }

    const allPerms = await db.query('SELECT id, permission_code, module FROM permissions');
    console.log(`Total permissions in MySQL: ${allPerms.length}`);

    // Fetch Roles
    const roles = await db.query('SELECT id, role_code, role_name FROM roles');
    console.log('Assigning realistic permission sets to roles...');

    for (const r of roles) {
      let targetCodes = [];
      const codeUpper = (r.role_code || '').toUpperCase();
      const nameUpper = (r.role_name || '').toUpperCase();

      if (codeUpper === 'ADMIN' || nameUpper.includes('ADMIN') || nameUpper.includes('SYSTEM')) {
        // System Admin gets ALL 42 permissions!
        targetCodes = permissions.map(p => p.code);
      } else if (codeUpper === 'RECEPTIONIST' || nameUpper.includes('RECEPTION')) {
        targetCodes = [
          'VISITOR:READ', 'VISITOR:CREATE', 'VISITOR:UPDATE', 'VISITOR:CHECKIN', 'VISITOR:CHECKOUT',
          'VISITOR:BADGE_PRINT', 'VISITOR:ID_VERIFY', 'APPOINTMENT:READ', 'APPOINTMENT:CREATE',
          'APPOINTMENT:QR_GENERATE', 'EMPLOYEE:READ', 'EMPLOYEE:SCHEDULE_VIEW'
        ];
      } else if (codeUpper.includes('SECURITY') || nameUpper.includes('SECURITY')) {
        targetCodes = [
          'VISITOR:READ', 'VISITOR:CHECKIN', 'VISITOR:CHECKOUT', 'VISITOR:ID_VERIFY',
          'SECURITY:BLACKLIST', 'SECURITY:WATCHLIST', 'SECURITY:ALERT_DISPATCH', 'SECURITY:ACCESS_PASS',
          'SECURITY:GATE_OVERRIDE', 'SECURITY:INCIDENT_LOG', 'SECURITY:EVACUATION', 'SECURITY:LOCKDOWN',
          'SECURITY:CAMERA_VIEW', 'SECURITY:AUDIT_TRACE', 'AUDIT:READ'
        ];
      } else if (codeUpper === 'MANAGER' || nameUpper.includes('MANAGER')) {
        targetCodes = [
          'VISITOR:READ', 'APPOINTMENT:READ', 'APPOINTMENT:CREATE', 'APPOINTMENT:UPDATE', 'APPOINTMENT:CANCEL',
          'APPROVAL:APPROVE', 'APPROVAL:REJECT', 'APPROVAL:DELEGATE', 'EMPLOYEE:READ', 'EMPLOYEE:ROSTER_MANAGE',
          'EMPLOYEE:HOST_ASSIGN', 'AUDIT:READ'
        ];
      } else if (codeUpper === 'EMPLOYEE' || nameUpper.includes('HOST')) {
        targetCodes = [
          'VISITOR:READ', 'APPOINTMENT:READ', 'APPOINTMENT:CREATE', 'APPOINTMENT:UPDATE', 'APPOINTMENT:CANCEL',
          'EMPLOYEE:READ', 'EMPLOYEE:SCHEDULE_VIEW', 'APPOINTMENT:QR_GENERATE'
        ];
      } else if (codeUpper === 'VISITOR' || nameUpper.includes('GUEST')) {
        targetCodes = ['VISITOR:READ', 'APPOINTMENT:READ', 'APPOINTMENT:CREATE', 'APPOINTMENT:CANCEL'];
      } else {
        // Default role gets 15 permissions
        targetCodes = permissions.slice(0, 15).map(p => p.code);
      }

      const matchingIds = allPerms.filter(p => targetCodes.includes(p.permission_code)).map(p => p.id);
      if (matchingIds.length > 0) {
        await db.query('DELETE FROM role_permissions WHERE role_id = ?', [r.id]);
        const values = matchingIds.map(pid => `(${r.id}, ${pid})`).join(', ');
        await db.query(`INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES ${values}`);
        console.log(`✓ Assigned ${matchingIds.length} permissions to '${r.role_name}' (${r.role_code})`);
      }
    }

    console.log('✓ ENTERPRISE PERMISSIONS & ROLE ASSIGNMENTS SEEDED SUCCESSFULLY!');
  } catch (e) {
    console.error('Seeding error:', e);
  }
  process.exit(0);
}

seedPermissions();
