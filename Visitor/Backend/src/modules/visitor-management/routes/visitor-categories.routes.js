const express = require('express');
const router = express.Router();
const controller = require('../controllers/visitor-category.controller');
const { authenticate } = require('../../../middleware/auth');

// ─── Module 4.4 Visitor Category Management Routes ───

// Get Category Stats/Metrics
router.get('/stats', authenticate, controller.getCategoryStats.bind(controller));

// Public / Integration helper to get category rules by code
router.get('/by-code/:code', controller.getCategoryByCode.bind(controller));

// Get All Visitor Categories (with pagination, filters, search)
router.get('/', authenticate, controller.getAllCategories.bind(controller));

// Get Visitor Category Details by ID
router.get('/:id', authenticate, controller.getCategoryById.bind(controller));

// Create New Visitor Category
router.post('/', authenticate, controller.createCategory.bind(controller));

// Update Visitor Category Details & Rules
router.put('/:id', authenticate, controller.updateCategory.bind(controller));

// Archive Visitor Category
router.patch('/:id/archive', authenticate, controller.archiveCategory.bind(controller));

// Restore Visitor Category
router.patch('/:id/restore', authenticate, controller.restoreCategory.bind(controller));

// Soft Delete Visitor Category
router.delete('/:id', authenticate, controller.deleteCategory.bind(controller));

module.exports = router;
