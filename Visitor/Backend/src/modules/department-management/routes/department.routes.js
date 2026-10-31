const { Router } = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const departmentController = require('../controllers/department.controller');
const departmentSearchController = require('../controllers/department-search.controller');
const departmentStatusController = require('../controllers/department-status.controller');
const departmentStatisticsController = require('../controllers/department-statistics.controller');

const router = Router();

// Public Endpoint for Visitor Signup department selection
router.get('/public', async (req, res, next) => {
  try {
    const departmentService = require('../services/department.service');
    const branchId = req.query.branchId || req.query.branch_id;
    const orgId = req.query.organizationId || req.query.organization_id;
    const status = req.query.status || 'ACTIVE';
    const filters = { limit: 100 };
    if (branchId) filters.branchId = Number(branchId);
    if (orgId) filters.organizationId = Number(orgId);
    if (status && status.toUpperCase() !== 'ALL') filters.status = status;
    const result = await departmentService.listDepartments(filters);
    const departments = Array.isArray(result) ? result : (result.data || []);
    res.json({ data: departments });
  } catch (err) {
    next(err);
  }
});

// ── Search & Utilities (must be before /:id) ────────────────────────────
router.get('/search', departmentSearchController.search);
router.get('/check-code', departmentSearchController.checkCode);
router.get('/statistics/overview', departmentStatisticsController.getOverview);

// ── CRUD ─────────────────────────────────────────────────────────────────
// GET /: retrieves all departments
router.get('/', departmentController.list);

// POST /: creates a department (Admin Only)
router.post('/', authenticate, authorize('admin'), departmentController.create);

// GET /:id/employees: gets employees for a specific department
// STRICT: Only return users with role 'employee' or 'staff' for host selection
router.get('/:id/employees', async (req, res, next) => {
  try {
    const employeeRepository = require('../../employee-management/repositories/employee.repository');
    const deptId = Number(req.params.id);
    const branchId = req.query.branchId || req.query.branch_id;
    const orgId = req.query.organizationId || req.query.organization_id;
    const filters = {
      department_id: deptId,
      employment_status: 'Active',
      is_host_enabled: true,
      limit: 100
    };
    if (branchId) filters.branch_id = Number(branchId);
    if (orgId) filters.organization_id = Number(orgId);
    const result = await employeeRepository.findAll(filters);
    let employees = Array.isArray(result) ? result : (result.data || []);
    // Filter to only include employee/staff roles (exclude admin, manager, receptionist, security, visitor)
    employees = employees.filter(e => {
      const role = (e.user_role || '').toLowerCase();
      return !role || role === 'employee' || role === 'staff';
    });
    res.json({ data: employees });
  } catch (err) {
    next(err);
  }
});

// GET /:id: gets department details
router.get('/:id', departmentController.get);

// PUT /:id: updates department configurations (Admin Only)
router.put('/:id', authenticate, authorize('admin'), departmentController.update);

// DELETE /:id: soft deletes department (Admin Only)
router.delete('/:id', authenticate, authorize('admin'), departmentController.delete);

// ── Status Management ────────────────────────────────────────────────────
router.patch('/:id/status', authenticate, authorize('admin'), departmentStatusController.changeStatus);
router.get('/:id/status/history', departmentStatusController.getHistory);

module.exports = router;
