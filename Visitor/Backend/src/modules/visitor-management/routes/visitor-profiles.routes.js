const { Router } = require('express');
const { authenticate } = require('../../../middleware/auth');
const validator = require('../../../middleware/VisitorProfileValidator');
const controller = require('../controllers/visitor-profile.controller');

const router = Router();

// Module 4.3 REST APIs: Protected via JWT Auth
router.use(authenticate);

// Summary statistics (KPI cards)
router.get('/stats', (req, res, next) => controller.stats(req, res, next));

// Directory listing (search, filter, sort, paginate)
router.get('/', (req, res, next) => controller.list(req, res, next));

// Full profile detail
router.get('/:id', (req, res, next) => controller.getProfile(req, res, next));

// Generate visitor pass data
router.get('/:id/pass', (req, res, next) => controller.generatePass(req, res, next));

// Update profile fields
router.put('/:id', validator.validateUpdateProfile, (req, res, next) => controller.updateProfile(req, res, next));

// Change status
router.patch('/:id/status', validator.validateStatusChange, (req, res, next) => controller.changeStatus(req, res, next));

// Archive & Restore
router.post('/:id/archive', (req, res, next) => controller.archive(req, res, next));
router.post('/:id/restore', (req, res, next) => controller.restore(req, res, next));

// Photo management
router.post('/:id/photos', validator.validatePhotoUpload, (req, res, next) => controller.addPhoto(req, res, next));
router.patch('/:id/photos/:photoId/active', (req, res, next) => controller.setActivePhoto(req, res, next));
router.patch('/photos/:photoId/active', (req, res, next) => controller.setActivePhoto(req, res, next));
router.delete('/photos/:photoId', (req, res, next) => controller.deletePhoto(req, res, next));
router.delete('/:id/photos/:photoId', (req, res, next) => controller.deletePhoto(req, res, next));

// Notes
router.post('/:id/notes', validator.validateNote, (req, res, next) => controller.addNote(req, res, next));
router.delete('/notes/:noteId', (req, res, next) => controller.deleteNote(req, res, next));

// Identity verification
router.patch('/:id/verify-identity', (req, res, next) => controller.verifyIdentity(req, res, next));

// Blacklist toggle
router.patch('/:id/blacklist', (req, res, next) => controller.toggleBlacklist(req, res, next));

// Delete visitor profile and cascade clean all linked data (history, documents, photos, appointments, etc.)
router.delete('/:id', (req, res, next) => controller.deleteVisitor(req, res, next));

module.exports = router;
