const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { authenticateToken } = require('../../../middleware/auth');
const { getSuggestedSlots } = require('../../../utils/helpers');
const db = require('../../../config/db');

// ── Pre-ID endpoints (must come before /:id) ─────────────────────────────────

// Public Endpoint for Visitor Signup host selection
// STRICT: Only return users with role 'employee' or 'staff' — excludes admin, manager, receptionist, security, visitor
router.get('/public', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT e.*, u.full_name as fullName, u.email as userEmail, u.phone as userPhone,
              u.role as user_role,
              d.name as department_name, b.branch_name, r.name as default_room_name,
              m.full_name as manager_name,
              org.name as organization_name
       FROM employees e
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN organization_branches b ON e.branch_id = b.id
       LEFT JOIN rooms r ON e.default_room_id = r.id
       LEFT JOIN users m ON e.manager_id = m.id
       LEFT JOIN organizations org ON e.organization_id = org.id
       WHERE e.deleted_at IS NULL
         AND e.archived_at IS NULL
         AND e.employment_status = 'Active'
         AND (LOWER(u.role) IN ('employee', 'staff') OR u.role IS NULL)
       ORDER BY e.full_name ASC
       LIMIT 500`
    );
    const employees = Array.isArray(result) ? result : [];
    res.json({ data: employees });
  } catch (err) {
    next(err);
  }
});

// Module 18.1 – Dashboard Stats with chart data
router.get('/dashboard-stats', authenticateToken, (req, res, next) =>
  employeeController.getDashboardStats(req, res, next)
);

// Module 18.12 – Stats alias
router.get('/stats', authenticateToken, (req, res, next) =>
  employeeController.getDashboardStats(req, res, next)
);

// Module 18.13 – Audit Logs
router.get('/audit-logs', authenticateToken, (req, res, next) =>
  employeeController.getAuditLogs(req, res, next)
);

// Module 18.3 – Bulk Import
router.post('/import', authenticateToken, (req, res, next) =>
  employeeController.bulkImport(req, res, next)
);

// My Profile (linked to JWT user)
router.get('/me', authenticateToken, (req, res, next) =>
  employeeController.getMyProfile(req, res, next)
);

// Module 18.11 – Export CSV
router.get('/export', authenticateToken, async (req, res, next) => {
  try {
    const result = await require('../services/employee.service').listEmployees({ limit: 10000, page: 1 });
    const employees = result.data || [];

    const headers = [
      'Employee ID', 'Employee Number', 'Full Name', 'First Name', 'Last Name',
      'Gender', 'DOB', 'Nationality', 'Marital Status',
      'Email', 'Mobile', 'Office Phone', 'Extension',
      'Job Title', 'Position', 'Employment Type', 'Employment Status',
      'Department', 'Branch', 'Floor', 'Office',
      'Manager', 'Hire Date', 'Host Enabled', 'Max Visitors/Day',
      'Max Concurrent', 'Availability', 'Created Date'
    ];

    const rows = employees.map(e => [
      e.id, e.employee_number,
      `"${e.full_name || ''}"`, `"${e.first_name || ''}"`, `"${e.last_name || ''}"`,
      e.gender || '', e.dob || '', e.nationality || '', e.marital_status || '',
      e.email || '', e.mobile_number || '', e.office_phone || '', e.extension || '',
      `"${e.job_title || ''}"`, `"${e.position || ''}"`, e.employment_type || '', e.employment_status || '',
      `"${e.department_name || ''}"`, `"${e.branch_name || ''}"`, e.floor_number || '', e.office_number || '',
      `"${e.manager_name || ''}"`, e.hire_date || '',
      e.is_host_enabled ? 'Yes' : 'No', e.max_visitors_per_day || 10,
      e.max_concurrent_visitors || 3, e.availability_status || '',
      e.created_at || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const filename = `Employee_Directory_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// ── CRUD Endpoints ─────────────────────────────────────────────────────────
router.get('/', authenticateToken, (req, res, next) => employeeController.list(req, res, next));
router.post('/', authenticateToken, (req, res, next) => employeeController.onboard(req, res, next));

// ── Per-employee endpoints ────────────────────────────────────────────────
router.get('/:id', authenticateToken, (req, res, next) => employeeController.get(req, res, next));
router.put('/:id', authenticateToken, (req, res, next) => employeeController.update(req, res, next));
router.patch('/:id/availability', authenticateToken, (req, res, next) =>
  employeeController.updateAvailability(req, res, next)
);
router.patch('/:id/host-settings', authenticateToken, (req, res, next) =>
  employeeController.updateHostSettings(req, res, next)
);
router.patch('/:id/status', authenticateToken, (req, res, next) => employeeController.setStatus(req, res, next));
router.patch('/:id/archive', authenticateToken, (req, res, next) => employeeController.archive(req, res, next));
router.patch('/:id/restore', authenticateToken, (req, res, next) => employeeController.restore(req, res, next));
router.delete('/:id', authenticateToken, (req, res, next) => employeeController.delete(req, res, next));

// Resend registration credentials (new temporary password + email) for an employee
router.post('/:id/resend-registration-email', authenticateToken, (req, res, next) =>
  employeeController.resendRegistrationEmail(req, res, next)
);

// Module 5 Integration – Appointment history for this employee as host
router.get('/:id/appointments', authenticateToken, (req, res, next) =>
  employeeController.getAppointmentHistory(req, res, next)
);

// Employee Performed & Lifecycle Audit Logs
router.get('/:id/audit-logs', authenticateToken, (req, res, next) =>
  employeeController.getAuditLogs(req, res, next)
);

// Module 7 Integration – Calendar Availability Slot Search
router.get('/:id/availability', async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const hostId = parseInt(req.params.id);
    const appointments = await db.query(
      `SELECT scheduled_start, scheduled_end FROM appointments
       WHERE host_id = ? AND DATE(scheduled_start) = DATE(?)
       AND appointment_status NOT IN ('REJECTED', 'CANCELLED')`,
      [hostId, date]
    );

    const suggested = await getSuggestedSlots(hostId, date);
    res.json({ bookedSlots: appointments, suggestedSlots: suggested });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
