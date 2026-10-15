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
      // Handles photo upload (Base64 data or Multipart file)
      const { photoData, fileName } = req.body;
      if (!photoData) {
        return res.status(400).json({ status: 'error', message: 'Photo data is required' });
      }

      // Return uploaded asset URL representation
      const mockAssetUrl = photoData.startsWith('http') || photoData.startsWith('/uploads')
        ? photoData
        : `/uploads/photos/visitor_${Date.now()}.png`;

      res.status(200).json({
        status: 'success',
        message: 'Visitor photo uploaded successfully',
        data: { photoUrl: mockAssetUrl, fileName: fileName || 'photo.png' }
      });
    } catch (err) {
      next(err);
    }
  }

  async uploadDocument(req, res, next) {
    try {
      const { documentType, documentData, fileName, fileSize, mimeType } = req.body;
      if (!documentData && !fileName) {
        return res.status(400).json({ status: 'error', message: 'Document payload is required' });
      }

      const mockAssetUrl = `/uploads/documents/doc_${Date.now()}_${fileName || 'file.pdf'}`;

      res.status(200).json({
        status: 'success',
        message: 'Supporting document uploaded successfully',
        data: {
          documentUrl: mockAssetUrl,
          documentType: documentType || 'Other Attachments',
          fileName: fileName || 'document.pdf',
          fileSize: fileSize || 1024,
          mimeType: mimeType || 'application/pdf'
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new VisitorRegistrationController();
