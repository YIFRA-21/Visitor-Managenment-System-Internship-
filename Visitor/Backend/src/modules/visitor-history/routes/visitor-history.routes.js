const express = require('express');
const router = express.Router();
const visitorHistoryController = require('../controllers/visitor-history.controller');

// All history routes
router.get('/stats', (req, res, next) => visitorHistoryController.getHistoryStats(req, res, next));
router.get('/', (req, res, next) => visitorHistoryController.getHistoryList(req, res, next));
router.get('/:id', (req, res, next) => visitorHistoryController.getHistoryDetails(req, res, next));
router.put('/:id', (req, res, next) => visitorHistoryController.updateHistoryMetadata(req, res, next));
router.delete('/:id', (req, res, next) => visitorHistoryController.deleteHistory(req, res, next));

module.exports = router;
