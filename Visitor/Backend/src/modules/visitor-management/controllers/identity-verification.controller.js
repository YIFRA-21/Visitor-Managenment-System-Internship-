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

  // POST /api/identity-verification/:id/upload-front
  async uploadFront(req, res, next) {
    try {
      const { imagePayload } = req.body;
      const result = await identityVerificationService.uploadFrontDocument(
        req.params.id,
        imagePayload,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ message: 'Front document uploaded and analyzed.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/:id/upload-back
  async uploadBack(req, res, next) {
    try {
      const { imagePayload } = req.body;
      const result = await identityVerificationService.uploadBackDocument(
        req.params.id,
        imagePayload,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ message: 'Back document uploaded and analyzed.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/:id/analyze-document
  async analyzeDocument(req, res, next) {
    try {
      const result = await identityVerificationService.analyzeDocument(
        req.params.id,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ message: 'Document analysis and OCR completed.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/:id/upload-selfie
  async uploadSelfie(req, res, next) {
    try {
      const { imagePayload } = req.body;
      const result = await identityVerificationService.uploadSelfie(
        req.params.id,
        imagePayload,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ message: 'Live selfie captured.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/:id/run-liveness
  async runLiveness(req, res, next) {
    try {
      const { completedChallenges } = req.body;
      const result = await identityVerificationService.runVisualLiveness(
        req.params.id,
        completedChallenges || [],
        req.user?.id || req.user?.userId || 1
      );
      res.json({ message: 'Visual liveness verification complete.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/:id/run-facematch
  async runFaceMatch(req, res, next) {
    try {
      const result = await identityVerificationService.runFaceMatch(
        req.params.id,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ message: 'Face matching complete.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/:id/validate-security
  async validateSecurity(req, res, next) {
    try {
      const result = await identityVerificationService.runSecurityValidation(
        req.params.id,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ message: 'Security validation complete.', data: result });
    } catch (err) { next(err); }
  }

  // POST /api/identity-verification/:id/complete
  async complete(req, res, next) {
    try {
      const result = await identityVerificationService.completeVerification(
        req.params.id,
        req.user?.id || req.user?.userId || 1
      );
      res.json({ message: 'Identity verification finished.', data: result });
    } catch (err) { next(err); }
  }

  // GET /api/identity-verification/:id/report
  async getReport(req, res, next) {
    try {
      const report = await identityVerificationService.generateVerificationReport(req.params.id);
      res.json(report);
    } catch (err) { next(err); }
  }

  // GET /api/identity-verification/:visitorId/history
  async getHistory(req, res, next) {
    try {
      const history = await identityVerificationService.getVisitorVerificationHistory(req.params.visitorId);
      res.json(history);
    } catch (err) { next(err); }
  }

  // GET /api/identity-verification/:id
  async getSession(req, res, next) {
    try {
      const session = await identityVerificationService.getSession(req.params.id);
      res.json(session);
    } catch (err) { next(err); }
  }
}

module.exports = new IdentityVerificationController();
