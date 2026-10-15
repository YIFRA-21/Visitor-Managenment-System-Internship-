const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const identityService = require('../services/identity-verification.service');

// Ensure private storage directory exists
const PRIVATE_IDENTITY_DIR = path.join(__dirname, '../../../../uploads/identity_private');
if (!fs.existsSync(PRIVATE_IDENTITY_DIR)) {
  fs.mkdirSync(PRIVATE_IDENTITY_DIR, { recursive: true });
}

class IdentityVerificationController {
  // GET /api/v1/identity-verification/status
  async getStatus(req, res, next) {
    try {
      const data = await identityService.getMyVerificationStatus(req.user.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/identity-verification/cases
  async createCase(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const result = await identityService.createVerificationCase(req.user.id, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/identity-verification/cases/:caseId/evidence
  async submitEvidence(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const caseId = parseInt(req.params.caseId, 10);
      const payload = {
        ...req.body,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      // Map uploaded files if present
      if (req.files) {
        if (req.files.front) payload.frontFilePath = req.files.front[0].path;
        if (req.files.back) payload.backFilePath = req.files.back[0].path;
        if (req.files.selfie) payload.selfieFilePath = req.files.selfie[0].path;
      }

      const result = await identityService.submitEvidenceAndVerify(caseId, req.user.id, payload);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/identity-verification/webhooks/:provider
  async handleWebhook(req, res, next) {
    try {
      const provider = req.params.provider;
      const signature = req.headers['x-hmac-signature'] || req.headers['x-signature'] || req.headers['authorization'];
      const rawPayload = req.body;

      const result = await identityService.handleProviderWebhook(provider, signature, rawPayload);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error('[IDENTITY WEBHOOK ERROR]:', err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // GET /api/v1/identity-verification/reviewer/queue
  async getReviewerQueue(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        search: req.query.search,
      };
      const queue = await identityService.getReviewerQueue(filters);
      res.status(200).json({ success: true, data: queue });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/identity-verification/reviewer/cases/:caseId
  async getCaseDetail(req, res, next) {
    try {
      const caseId = parseInt(req.params.caseId, 10);
      const detail = await identityService.getCaseDetailForReview(caseId);
      res.status(200).json({ success: true, data: detail });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/identity-verification/reviewer/cases/:caseId/decision
  async recordDecision(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const caseId = parseInt(req.params.caseId, 10);
      const result = await identityService.recordReviewDecision(caseId, req.user.id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/identity-verification/policies
  async getPolicy(req, res, next) {
    try {
      const orgId = req.query.organizationId ? parseInt(req.query.organizationId, 10) : (req.user.organization_id || 1);
      const policy = await identityService.getPolicy(orgId);
      res.status(200).json({ success: true, data: policy });
    } catch (err) {
      next(err);
    }
  }

  // PUT /api/v1/identity-verification/policies
  async updatePolicy(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const orgId = req.body.organizationId || req.user.organization_id || 1;
      const updated = await identityService.updatePolicy(orgId, req.body, req.user.id);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new IdentityVerificationController();
