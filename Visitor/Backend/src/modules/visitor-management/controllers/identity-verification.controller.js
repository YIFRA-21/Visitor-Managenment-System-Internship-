const identityVerificationService = require('../services/identity-verification.service');

class IdentityVerificationController {
  // POST /api/identity-verification/start
  async start(req, res, next) {
    try {
      const { visitorId, docType, country } = req.body;
      const result = await identityVerificationService.startSession(
        visitorId,
        docType || 'National ID',
        country || 'Ethiopia',
        req.user?.id || req.user?.userId || 1
      );
      res.status(201).json({ message: 'Verification session started.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/:id/mobile-session
  async createMobileSession(req, res, next) {
    try {
      const result = await identityVerificationService.createMobileSession(
        req.params.id,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ message: 'Mobile verification session generated.', data: result });
    } catch (err) { next(err); }
  }

  // GET /api/identity-verification/mobile-status/:token
  async getMobileStatus(req, res, next) {
    try {
      const status = await identityVerificationService.getMobileSessionStatus(req.params.token);
      res.json(status);
    } catch (err) { next(err); }
  }

  // GET /api/identity-verification/mobile/:token/session
  async getMobileSession(req, res, next) {
    try {
      const status = await identityVerificationService.getMobileSessionStatus(req.params.token);
      res.json(status);
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/mobile/:token/upload-front
  async uploadMobileFront(req, res, next) {
    try {
      const status = await identityVerificationService.getMobileSessionStatus(req.params.token);
      if (!status || !status.sessionId) {
        return res.status(404).json({ error: 'Mobile verification session not found or expired.' });
      }
      const { imagePayload, image, photo, file } = req.body || {};
      const payload = imagePayload || image || photo || file;
      const result = await identityVerificationService.uploadFrontDocument(status.sessionId, payload, 1);
      await identityVerificationService.updateMobileStatus(req.params.token, 'UPLOADING');
      res.json({ success: true, message: 'Front document captured successfully.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/mobile/:token/upload-back
  async uploadMobileBack(req, res, next) {
    try {
      const status = await identityVerificationService.getMobileSessionStatus(req.params.token);
      if (!status || !status.sessionId) {
        return res.status(404).json({ error: 'Mobile verification session not found or expired.' });
      }
      const { imagePayload, image, photo, file } = req.body || {};
      const payload = imagePayload || image || photo || file;
      const result = await identityVerificationService.uploadBackDocument(status.sessionId, payload, 1);
      res.json({ success: true, message: 'Back document captured successfully.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/mobile/:token/upload-selfie
  async uploadMobileSelfie(req, res, next) {
    try {
      const status = await identityVerificationService.getMobileSessionStatus(req.params.token);
      if (!status || !status.sessionId) {
        return res.status(404).json({ error: 'Mobile verification session not found or expired.' });
      }
      const { imagePayload, image, photo, file } = req.body || {};
      const payload = imagePayload || image || photo || file;
      const result = await identityVerificationService.uploadSelfieImage(status.sessionId, payload, 1);
      res.json({ success: true, message: 'Selfie portrait captured successfully.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/mobile/:token/complete
  async completeMobile(req, res, next) {
    try {
      const status = await identityVerificationService.getMobileSessionStatus(req.params.token);
      if (!status || !status.sessionId) {
        return res.status(404).json({ error: 'Mobile verification session not found or expired.' });
      }
      const result = await identityVerificationService.completeVerification(status.sessionId, 1);
      await identityVerificationService.updateMobileStatus(req.params.token, 'COMPLETED');
      res.json({ success: true, message: 'Mobile verification finished successfully.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/:id/upload-front
  async uploadFront(req, res, next) {
    try {
      const { imagePayload, image, document, file, photo } = req.body || {};
      const payload = imagePayload || image || document || file || photo || (req.file ? req.file.path : 'data:image/jpeg;base64,front_id_mock');
      const result = await identityVerificationService.uploadFrontDocument(
        req.params.id,
        payload,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ success: true, message: 'Front document uploaded and analyzed.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/:id/upload-back
  async uploadBack(req, res, next) {
    try {
      const { imagePayload, image, document, file, photo } = req.body || {};
      const payload = imagePayload || image || document || file || photo || (req.file ? req.file.path : 'data:image/jpeg;base64,back_id_mock');
      const result = await identityVerificationService.uploadBackDocument(
        req.params.id,
        payload,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ success: true, message: 'Back document uploaded and analyzed.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/:id/analyze-document
  async analyzeDocument(req, res, next) {
    try {
      const result = await identityVerificationService.analyzeDocument(
        req.params.id,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ success: true, message: 'Document analysis and OCR completed.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/:id/run-ocr
  async runOCR(req, res, next) {
    try {
      const result = await identityVerificationService.runOCR(
        req.params.id,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ success: true, message: 'Document OCR processing completed.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/:id/upload-selfie
  async uploadSelfie(req, res, next) {
    try {
      const { imagePayload, image, selfie, file, photo } = req.body || {};
      const payload = imagePayload || image || selfie || file || photo || (req.file ? req.file.path : 'data:image/jpeg;base64,selfie_mock');
      const result = await identityVerificationService.uploadSelfie(
        req.params.id,
        payload,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ success: true, message: 'Live selfie captured.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/:id/run-liveness
  async runLiveness(req, res, next) {
    try {
      const { completedChallenges } = req.body || {};
      const result = await identityVerificationService.runVisualLiveness(
        req.params.id,
        completedChallenges || [],
        req.user?.id || req.user?.userId || 1
      );
      res.json({ success: true, message: 'Visual liveness verification complete.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/:id/run-facematch
  async runFaceMatch(req, res, next) {
    try {
      const result = await identityVerificationService.runFaceMatch(
        req.params.id,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ success: true, message: 'Face matching complete.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/:id/validate-security
  async validateSecurity(req, res, next) {
    try {
      const result = await identityVerificationService.runSecurityValidation(
        req.params.id,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ success: true, message: 'Security validation complete.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/:id/complete
  async complete(req, res, next) {
    try {
      const result = await identityVerificationService.completeVerification(
        req.params.id,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ success: true, message: 'Identity verification finished.', data: result });
    } catch (err) { next(err); }
  }

  // GET /api/identity-verification/:id/report
  async getReport(req, res, next) {
    try {
      const report = await identityVerificationService.generateVerificationReport(req.params.id);
      res.json({ success: true, message: 'Verification report retrieved.', data: report });
    } catch (err) { next(err); }
  }

  // GET /api/identity-verification/:visitorId/history
  async getHistory(req, res, next) {
    try {
      const history = await identityVerificationService.getVisitorVerificationHistory(req.params.visitorId);
      res.json({ success: true, data: history });
    } catch (err) { next(err); }
  }

  // GET /api/identity-verification/:id
  async getSession(req, res, next) {
    try {
      const session = await identityVerificationService.getSession(req.params.id);
      res.json({ success: true, data: session });
    } catch (err) { next(err); }
  }
}

module.exports = new IdentityVerificationController();
