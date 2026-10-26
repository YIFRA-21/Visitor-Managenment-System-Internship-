/**
 * Enterprise Communication & Messaging Routes
 * ──────────────────────────────────────────────
 * REST API endpoints for Message Center, System Chat, Role Contacts,
 * Real SMTP Email Dispatch, Administrator Announcements, and Attachments.
 * Base path: /api/communication
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../../../middleware/auth');
const communicationController = require('../controllers/communication.controller');

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../../../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage for communication attachments
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const cleanExt = path.extname(file.originalname).toLowerCase();
    cb(null, 'chat-' + uniqueSuffix + cleanExt);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|webm|mov|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${ext} is not supported for attachments.`));
    }
  },
});

// Enforce authentication across all communication routes
router.use(authenticate);

// ── Contacts & Presence ───────────────────────────────────────────────────────
router.get('/contacts', (req, res, next) => communicationController.getContacts(req, res, next));
router.post('/contacts/manual', (req, res, next) => communicationController.addManualContact(req, res, next));
router.get('/unread-counts', (req, res, next) => communicationController.getUnreadCounts(req, res, next));

// ── Real Chat & Conversations ─────────────────────────────────────────────────
router.get('/chat/conversations', (req, res, next) => communicationController.getConversations(req, res, next));
router.put('/chat/conversations/:convId', (req, res, next) => communicationController.updateConversation(req, res, next));
router.delete('/chat/conversations/:convId', (req, res, next) => communicationController.deleteConversation(req, res, next));
router.post('/chat/conversations/:convId/participants', (req, res, next) => communicationController.addParticipant(req, res, next));
router.delete('/chat/conversations/:convId/participants/:userId', (req, res, next) => communicationController.removeParticipant(req, res, next));
router.post('/chat/direct', (req, res, next) => communicationController.createDirectConversation(req, res, next));
router.post('/chat/group', (req, res, next) => communicationController.createGroupConversation(req, res, next));
router.get('/chat/messages/:convId', (req, res, next) => communicationController.getChatMessages(req, res, next));
router.post('/chat/messages/:convId', (req, res, next) => communicationController.sendChatMessage(req, res, next));
router.put('/chat/messages/:convId/:messageId', (req, res, next) => communicationController.editChatMessage(req, res, next));
router.delete('/chat/messages/:convId/:messageId', (req, res, next) => communicationController.deleteChatMessage(req, res, next));
router.delete('/chat/messages/:convId/:messageId/attachment', (req, res, next) => communicationController.deleteChatMessageAttachment(req, res, next));
router.delete('/conversations/:convId/messages/:messageId', (req, res, next) => communicationController.deleteChatMessage(req, res, next));
router.delete('/conversations/:convId/messages/:messageId/attachment', (req, res, next) => communicationController.deleteChatMessageAttachment(req, res, next));
router.delete('/messages/:messageId', (req, res, next) => communicationController.deleteChatMessage(req, res, next));

// ── Media / File Uploads ──────────────────────────────────────────────────────
router.post('/upload', upload.single('file'), (req, res, next) => communicationController.uploadAttachment(req, res, next));

// ── Real Email Dispatch ───────────────────────────────────────────────────────
router.post('/email/send', (req, res, next) => communicationController.sendDirectEmail(req, res, next));

// ── Announcements (Admin-Only for creation & management) ──────────────────────────
router.get('/announcements', (req, res, next) => communicationController.getAnnouncements(req, res, next));
router.post('/announcements', (req, res, next) => communicationController.createAnnouncement(req, res, next));
router.put('/announcements/:id/read', (req, res, next) => communicationController.markAnnouncementRead(req, res, next));
router.put('/announcements/:id', (req, res, next) => communicationController.updateAnnouncement(req, res, next));
router.delete('/announcements/:id', (req, res, next) => communicationController.deleteAnnouncement(req, res, next));
router.post('/announcements/:id/delete', (req, res, next) => communicationController.deleteAnnouncement(req, res, next));

module.exports = router;
