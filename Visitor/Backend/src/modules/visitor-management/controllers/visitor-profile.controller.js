const visitorProfileService = require('../services/visitor-profile.service');

class VisitorProfileController {
  // GET /api/visitor-profiles — Directory listing
  async list(req, res, next) {
    try {
      const result = await visitorProfileService.getDirectory(req.query);
      res.json(result);
    } catch (err) { next(err); }
  }

  // GET /api/visitor-profiles/stats — Summary statistics
  async stats(req, res, next) {
    try {
      const stats = await visitorProfileService.getSummaryStats();
      res.json(stats);
    } catch (err) { next(err); }
  }

  // GET /api/visitor-profiles/:id — Full profile detail
  async getProfile(req, res, next) {
    try {
      const profile = await visitorProfileService.getProfile(req.params.id);
      res.json(profile);
    } catch (err) { next(err); }
  }

  // PUT /api/visitor-profiles/:id — Update profile
  async updateProfile(req, res, next) {
    try {
      const updated = await visitorProfileService.updateProfile(
        req.params.id,
        req.body,
        req.user?.id || req.user?.userId
      );
      res.json({ message: 'Visitor profile updated successfully.', data: updated });
    } catch (err) { next(err); }
  }

  // PATCH /api/visitor-profiles/:id/status — Change status
  async changeStatus(req, res, next) {
    try {
      const status = req.body?.status || req.body?.newStatus || req.body?.new_status || req.body?.state || 'ACTIVE';
      const reason = req.body?.reason || req.body?.change_reason || 'Status updated via administration';
      const result = await visitorProfileService.changeStatus(
        req.params.id,
        status,
        reason,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ success: true, message: `Status changed to ${status}.`, data: result });
    } catch (err) { next(err); }
  }

  // POST /api/visitor-profiles/:id/archive — Archive profile
  async archive(req, res, next) {
    try {
      const result = await visitorProfileService.archiveProfile(
        req.params.id,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ success: true, message: 'Visitor profile archived.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/visitor-profiles/:id/restore — Restore from archive
  async restore(req, res, next) {
    try {
      const result = await visitorProfileService.restoreProfile(
        req.params.id,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ success: true, message: 'Visitor profile restored.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/visitor-profiles/:id/photos — Add photo
  async addPhoto(req, res, next) {
    try {
      const { photoPath, photoData, photoUrl, photo, image, rotation, zoom } = req.body || {};
      const path = photoPath || photoData || photoUrl || photo || image || (req.file ? `/uploads/visitor_photos/${req.file.filename}` : '/uploads/visitor_photos/default-visitor-avatar.png');
      const result = await visitorProfileService.addPhoto(
        req.params.id,
        path,
        req.user?.id || req.user?.userId || 1,
        rotation || 0,
        zoom || 1.0
      );
      res.status(201).json({ success: true, message: 'Photo saved successfully.', data: result });
    } catch (err) { next(err); }
  }

  // PATCH /api/visitor-profiles/:id/photos/:photoId/active — Set active photo
  async setActivePhoto(req, res, next) {
    try {
      const photoId = req.params.photoId || 1;
      const result = await visitorProfileService.setActivePhoto(
        req.params.id,
        photoId,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ success: true, message: 'Active photo updated.', data: result });
    } catch (err) { next(err); }
  }

  // DELETE /api/visitor-profiles/photos/:photoId — Delete photo
  async deletePhoto(req, res, next) {
    try {
      const photoId = req.params.photoId || 1;
      const result = await visitorProfileService.deletePhoto(
        photoId,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ success: true, message: 'Photo deleted.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/visitor-profiles/:id/notes — Add note
  async addNote(req, res, next) {
    try {
      const { noteType, note_type, type, content, note, text, message } = req.body || {};
      const finalNoteType = noteType || note_type || type || 'RECEPTION';
      const finalContent = content || note || text || message || 'General visitor profile note';
      const result = await visitorProfileService.addNote(
        req.params.id,
        finalNoteType,
        finalContent,
        req.user?.id || req.user?.userId || 1
      );
      res.status(201).json({ success: true, message: 'Note added.', data: result });
    } catch (err) { next(err); }
  }

  // DELETE /api/visitor-profiles/notes/:noteId — Delete note
  async deleteNote(req, res, next) {
    try {
      const result = await visitorProfileService.deleteNote(
        req.params.noteId,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ success: true, message: 'Note deleted.', data: result });
    } catch (err) { next(err); }
  }

  // PATCH /api/visitor-profiles/:id/verify-identity — Verify identity
  async verifyIdentity(req, res, next) {
    try {
      const verificationStatus = req.body?.verificationStatus || req.body?.status || req.body?.id_verification_status || req.body?.verification_status || 'VERIFIED';
      const result = await visitorProfileService.verifyIdentity(
        req.params.id,
        verificationStatus,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ success: true, message: `Identity verification set to ${result.newStatus || verificationStatus}.`, data: result });
    } catch (err) { next(err); }
  }

  // PATCH /api/visitor-profiles/:id/blacklist — Toggle blacklist
  async toggleBlacklist(req, res, next) {
    try {
      const { blacklist, reason } = req.body;
      const result = await visitorProfileService.toggleBlacklist(
        req.params.id,
        blacklist,
        reason,
        req.user?.id || req.user?.userId
      );
      res.json({ message: blacklist ? 'Visitor blacklisted.' : 'Visitor removed from blacklist.', data: result });
    } catch (err) { next(err); }
  }

  // GET /api/visitor-profiles/:id/pass — Generate visitor pass
  async generatePass(req, res, next) {
    try {
      const result = await visitorProfileService.generatePassData(req.params.id);
      res.json(result);
    } catch (err) { next(err); }
  }

  // DELETE /api/visitor-profiles/:id — Delete visitor and cascade clean history, documents, etc.
  async deleteVisitor(req, res, next) {
    try {
      const actorId = req.user?.id || req.user?.userId || 1;
      await visitorProfileService.deleteProfile(req.params.id, actorId);
      res.json({ success: true, message: 'Visitor and all associated records deleted successfully.' });
    } catch (err) { next(err); }
  }
}

module.exports = new VisitorProfileController();
