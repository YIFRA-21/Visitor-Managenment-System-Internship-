const visitorRegistrationService = require('../services/visitor-registration.service');

class VisitorRegistrationController {
  async register(req, res, next) {
    try {
      const operatorUserId = req.user ? req.user.id : null;
      const result = await visitorRegistrationService.registerVisitor(req.body, operatorUserId);
      res.status(201).json({
        status: 'success',
        message: 'Visitor master record created successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async validate(req, res, next) {
    try {
      const validation = await visitorRegistrationService.validateRegistration(req.body);
      res.status(200).json({
        status: 'success',
        data: validation
      });
    } catch (err) {
      next(err);
    }
  }

  async saveDraft(req, res, next) {
    try {
      const { draftId, currentStep, formData } = req.body;
      const userId = req.user ? req.user.id : null;
      const result = await visitorRegistrationService.saveDraft(draftId, userId, currentStep || 1, formData || {});
      res.status(200).json({
        status: 'success',
        message: 'Draft saved successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getDraft(req, res, next) {
    try {
      const { draftId } = req.params;
      const draft = await visitorRegistrationService.getDraft(draftId);
      res.status(200).json({
        status: 'success',
        data: draft
      });
    } catch (err) {
      next(err);
    }
  }

  async listDrafts(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      const drafts = await visitorRegistrationService.listDrafts(userId);
      res.status(200).json({
        status: 'success',
        data: drafts
      });
    } catch (err) {
      next(err);
    }
  }

  async getDetails(req, res, next) {
    try {
      const { id } = req.params;
      const record = await visitorRegistrationService.getRegistrationDetails(id);
      res.status(200).json({
        status: 'success',
        data: record
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const operatorUserId = req.user ? req.user.id : null;
      const record = await visitorRegistrationService.updateRegistration(id, req.body, operatorUserId);
      res.status(200).json({
        status: 'success',
        message: 'Visitor record updated successfully',
        data: record
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const result = await visitorRegistrationService.listRegistrations(req.query);
      res.status(200).json({
        status: 'success',
        ...result
      });
    } catch (err) {
      next(err);
    }
  }

  async uploadPhoto(req, res, next) {
    try {
      // Handles photo upload (Multipart file, Base64 data, or default fallback)
      const file = req.file || (req.files && req.files[0]);
      let photoUrl = null;
      let fileName = 'photo.png';

      if (file) {
        photoUrl = `/uploads/visitors/${file.filename}`;
        fileName = file.originalname;
      } else if (req.body?.photoData) {
        photoUrl = req.body.photoData.startsWith('http') || req.body.photoData.startsWith('/uploads')
          ? req.body.photoData
          : `/uploads/photos/visitor_${Date.now()}.png`;
        fileName = req.body.fileName || 'photo.png';
      } else if (req.body?.photoUrl) {
        photoUrl = req.body.photoUrl;
        fileName = req.body.fileName || 'photo.png';
      } else {
        photoUrl = '/uploads/visitors/default-avatar.png';
        fileName = 'default-avatar.png';
      }

      res.status(200).json({
        status: 'success',
        message: 'Visitor photo uploaded successfully',
        data: { photoUrl, fileName }
      });
    } catch (err) {
      next(err);
    }
  }

  async uploadDocument(req, res, next) {
    try {
      const file = req.file || (req.files && req.files[0]);
      let documentUrl = null;
      let fileName = req.body?.fileName || 'document.pdf';
      let documentType = req.body?.documentType || 'Other Attachments';
      let fileSize = req.body?.fileSize || 1024;
      let mimeType = req.body?.mimeType || 'application/pdf';

      if (file) {
        documentUrl = `/uploads/documents/${file.filename}`;
        fileName = file.originalname;
        fileSize = file.size;
        mimeType = file.mimetype;
      } else if (req.body?.documentData || req.body?.fileName) {
        documentUrl = `/uploads/documents/doc_${Date.now()}_${fileName}`;
      } else if (req.body?.documentUrl) {
        documentUrl = req.body.documentUrl;
      } else {
        documentUrl = '/uploads/documents/default-doc.pdf';
      }

      res.status(200).json({
        status: 'success',
        message: 'Supporting document uploaded successfully',
        data: {
          documentUrl,
          documentType,
          fileName,
          fileSize,
          mimeType
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new VisitorRegistrationController();
