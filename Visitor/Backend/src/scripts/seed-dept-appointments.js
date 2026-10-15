// Backend/src/scripts/seed-dept-appointments.js
const db = require('../config/db');

async function seed() {
  const visitor = await db.query("SELECT id FROM visitors WHERE email = 'abebe.visitor@gmail.com'");
  const john = await db.query("SELECT id, user_id FROM employees WHERE email = 'john.doe@itpark.et'");
  const michael = await db.query("SELECT id, user_id FROM employees WHERE email = 'michael.scott@itpark.et'");
  
  if (!visitor[0] || !john[0]) {
    console.error('Visitor or employee not found');
    return;
  }

  const vId = visitor[0].id;
  const jHostId = john[0].id;
  const jUserId = john[0].user_id;
  const mHostId = michael[0]?.id || jHostId;
  const mUserId = michael[0]?.user_id || jUserId;

  const appts = [
    {
      num: 'VMS-HR-2026-001',
      hostId: jUserId,
      hostEmpId: jHostId,
      purpose: 'Technical Interview & Onboarding Discussion',
      status: 'pending_approval',
      apptStatus: 'REQUESTED',
      approvalStatus: 'PENDING',
      startOffset: 2,
      endOffset: 3,
      ref: 'HR-REQ-001'
    },
    {
      num: 'VMS-HR-2026-002',
      hostId: jUserId,
      hostEmpId: jHostId,
      purpose: 'Annual Benefits Consultation Meeting',
      status: 'approved',
      apptStatus: 'APPROVED',
      approvalStatus: 'APPROVED',
      startOffset: -1,
      endOffset: 1,
      ref: 'HR-APP-002'
    },
    {
      num: 'VMS-HR-2026-003',
      hostId: mUserId, // Michael Scott is UNAVAILABLE -> triggers reassignment required!
      hostEmpId: mHostId,
      purpose: 'Payroll and Compensation Review',
      status: 'pending_approval',
      apptStatus: 'REQUESTED',
      approvalStatus: 'PENDING',
      startOffset: 4,
      endOffset: 5,
      ref: 'HR-REQ-003'
    }
  ];

  for (const a of appts) {
    try {
      const existing = await db.query("SELECT id FROM appointments WHERE appointment_number = ?", [a.num]);
      let apptId;
      if (!existing[0]) {
        const res = await db.query(`
          INSERT INTO appointments (
            appointment_number, organization_id, branch_id, department_id,
            visitor_id, host_id, host_employee_id, scheduled_start, scheduled_end,
            expected_duration_minutes, priority, approval_status, appointment_status,
            status, purpose, reference_code, appointment_type_id, visit_purpose_id
          ) VALUES (
            ?, 2, 3, 5, ?, ?, ?,
            DATE_ADD(NOW(), INTERVAL ? HOUR), DATE_ADD(NOW(), INTERVAL ? HOUR),
            60, 'MEDIUM', ?, ?, ?, ?, ?, 1, 1
          )
        `, [
          a.num, vId, a.hostId, a.hostEmpId,
          a.startOffset, a.endOffset,
          a.approvalStatus, a.apptStatus, a.status, a.purpose, a.ref
        ]);
        apptId = res.insertId;
        console.log(`Successfully inserted appointment ${a.num}, ID = ${apptId}`);
      } else {
        apptId = existing[0].id;
        await db.query(`
          UPDATE appointments 
          SET organization_id = 2, branch_id = 3, department_id = 5,
              host_id = ?, host_employee_id = ?, status = ?, appointment_status = ?, approval_status = ?,
              appointment_type_id = 1, visit_purpose_id = 1
          WHERE id = ?
        `, [a.hostId, a.hostEmpId, a.status, a.apptStatus, a.approvalStatus, apptId]);
        console.log(`Updated appointment ${a.num}, ID = ${apptId}`);
      }

      if (apptId) {
        await db.query(`
          INSERT INTO appointment_approvals (appointment_id, approver_id, approval_level, decision, comments)
          VALUES (?, ?, 1, ?, 'Initial request submitted')
          ON DUPLICATE KEY UPDATE decision = VALUES(decision), approver_id = VALUES(approver_id)
        `, [apptId, a.hostId, a.approvalStatus === 'APPROVED' ? 'APPROVED' : 'PENDING']);
        console.log(`Approval record linked for appointment ${apptId}`);
      }
    } catch (e) {
      console.error(`Error on ${a.num}:`, e.message);
    }
  }
}

seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
