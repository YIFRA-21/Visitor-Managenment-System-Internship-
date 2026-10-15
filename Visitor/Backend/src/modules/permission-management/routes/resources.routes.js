const { Router } = require('express');
const authController = require('../../authentication/controllers/auth.controller');
const { authenticate } = require('../../../middleware/auth');

const router = Router();

router.use(authenticate);

// GET /api/resources/my-resources
router.get('/my-resources', authController.getMyResources);

module.exports = router;
