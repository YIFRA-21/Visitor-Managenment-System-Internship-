const { Router } = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const workplaceController = require('../controllers/workplace.controller');

const router = Router();

// Employee workplace query
router.get('/:id', authenticate, workplaceController.getEmployeeWorkplace);
router.get('/:id/history', authenticate, workplaceController.getWorkplaceHistory);

// Workplace assignment: Admins or Department Managers (scoped within controller)
router.put('/:id', authenticate, authorize('admin', 'system_admin', 'manager', 'dept_manager'), workplaceController.assignWorkplace);

module.exports = router;
