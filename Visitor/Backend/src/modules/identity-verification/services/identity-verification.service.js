const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const repository = require('../repositories/identity-verification.repository');
const policyEvaluator = require('./policy-evaluator.service');
const ProviderFactory = require('../providers/ProviderFactory');
const db = require('../../../config/db');
const verificationIntegrationService = require('../../visitor-management/services/identity/VerificationIntegrationService');

/**
 * IdentityVerificationService
 * State machine managing identity cases and provider integrations.
 */
class IdentityVerificationService {
  // ── Valid State Machine Transitions ──
  static VALID_TRANSITIONS = {
    PENDING: ['PROVIDER_PROCESSING', 'CANCELLED', 'ERROR'],
    PROVIDER_PROCESSING: ['IN_REVIEW', 'VERIFIED', 'REJECTED', 'RESUBMISSION_REQUIRED', 'ERROR', 'EXPIRED'],
    IN_REVIEW: ['VERIFIED', 'REJECTED', 'RESUBMISSION_REQUIRED', 'ERROR'],
    RESUBMISSION_REQUIRED: ['PROVIDER_PROCESSING', 'PENDING', 'CANCELLED'],
    ERROR: ['PENDING', 'PROVIDER_PROCESSING', 'CANCELLED'],
    VERIFIED: [], // Terminal
    REJECTED: ['PENDING'], // Resubmission via new case
    EXPIRED: ['PENDING'],
    CANCELLED: ['PENDING'],
  };

  validateTransition(fromStatus, toStatus) {
    const allowed = IdentityVerificationService.VALID_TRANSITIONS[fromStatus] || [];
    if (!allowed.includes(toStatus) && fromStatus !== toStatus) {
      throw new Error(`Invalid case state transition from '${fromStatus}' to '${toStatus}'.`);
    }
  }

  // ── 1. Resolve Visitor Anchor from User ID ──
  async resolveVisitorId(userId) {
    const rows = await db.query(
      `SELECT id, organization_id, branch_id, id_verification_status FROM visitors WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
      [userId]
    );
    if (rows && rows[0]) {
      return rows[0];
    }
    // Fallback if user is visitor but visitors table record has no user_id link yet
    const fallback = await db.query(
      `SELECT v.id, v.organization_id, v.branch_id, v.id_verification_status
       FROM visitors v
       JOIN users u ON u.email = v.email
       WHERE u.id = ? LIMIT 1`,
      [userId]
    );
    if (fallback && fallback[0]) {
      return fallback[0];
    }
    throw new Error('No visitor profile found linked to your authenticated account.');
  }

  // ── 2. Get Current Visitor Verification Status ──
  async getMyVerificationStatus(userId) {
    const visitor = await this.resolveVisitorId(userId);
    const latestCase = await repository.getLatestCaseForVisitor(visitor.id);
    const policy = await repository.getPolicyByOrganization(visitor.organization_id || 1);

    let documents = [];
    let attempts = [];
    let reviews = [];

    if (latestCase) {
      documents = await repository.getDocumentsByCaseId(latestCase.id);
      attempts = await repository.getAttemptsByCaseId(latestCase.id);
      reviews = await repository.getReviewDecisionsByCaseId(latestCase.id);
    }

    return {
      visitorId: visitor.id,
      overallStatus: visitor.id_verification_status || 'UNVERIFIED',
      activeCase: latestCase,
      documents,
      attempts,
      latestReview: reviews[0] || null,
      policy: {
        isVerificationMandatory: Boolean(policy?.is_verification_mandatory),
        gateVisitorPassIssuance: Boolean(policy?.gate_visitor_pass_issuance),
        supportedDocTypes: policy?.supported_doc_types ? (typeof policy.supported_doc_types === 'string' ? JSON.parse(policy.supported_doc_types) : policy.supported_doc_types) : ['PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE'],
      },
    };
  }

  // ── 3. Initialize Verification Case ──
  async createVerificationCase(userId, caseParams) {
    const visitor = await this.resolveVisitorId(userId);

    // If latest case is already VERIFIED, prevent duplicate case
    const existing = await repository.getLatestCaseForVisitor(visitor.id);
    if (existing && existing.status === 'VERIFIED') {
      return {
        alreadyVerified: true,
        case: existing,
      };
    }

    const orgId = visitor.organization_id || caseParams.organizationId || 1;
    const branchId = visitor.branch_id || caseParams.branchId || null;
    const policy = await repository.getPolicyByOrganization(orgId);

    const caseNumber = `IV-CASE-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const provider = ProviderFactory.getProvider();

    // Initialize session with external provider
    const providerSession = await provider.createSession({
      caseNumber,
      visitorId: visitor.id,
      docType: caseParams.docType || 'NATIONAL_ID',
      country: caseParams.country || 'Ethiopia',
      redirectUrl: caseParams.redirectUrl,
    });

    const caseId = await repository.createCase({
      caseNumber,
      visitorId: visitor.id,
      userId,
      organizationId: orgId,
      branchId,
      providerName: provider.name,
      providerSessionId: providerSession.sessionId,
      status: 'PENDING',
      policyId: policy?.id || null,
    });

    // Update visitor core status to PENDING
    await repository.syncVisitorVerificationStatus(visitor.id, 'PENDING');

    const createdCase = await repository.getCaseById(caseId);

    return {
      caseId,
      caseNumber,
      status: 'PENDING',
      providerSessionUrl: providerSession.sessionUrl,
      case: createdCase,
    };
  }

  // ── 4. Submit Documents & Run Verification ──
  async submitEvidenceAndVerify(caseId, userId, payload) {
    const caseRecord = await repository.getCaseById(caseId);
    if (!caseRecord) {
      throw new Error('Identity verification case not found.');
    }
    if (caseRecord.user_id !== userId) {
      throw new Error('Unauthorized to modify this verification case.');
    }

    this.validateTransition(caseRecord.status, 'PROVIDER_PROCESSING');
    await repository.updateCaseStatus(caseId, 'PROVIDER_PROCESSING');

    // Query active provider for automated OCR and biometric results directly from images
    const provider = ProviderFactory.getProvider(caseRecord.provider_name);
    const rawProviderResult = await provider.getResult(caseRecord.provider_session_id || 'simulated');

    // Extract OCR info directly from inserted document analysis
    const ocr = rawProviderResult.ocrData || {};
    const rawDocNum = ocr.documentNumber || payload.documentNumber || 'ET-' + Math.floor(100000 + Math.random() * 900000);
    const maskedNum = rawDocNum.length > 4
      ? rawDocNum.slice(0, 3) + '****' + rawDocNum.slice(-4)
      : rawDocNum;

    // Save document entity with automated OCR extracted data
    await repository.saveIdentityDocument({
      caseId,
      visitorId: caseRecord.visitor_id,
      documentType: payload.documentType || ocr.docType || 'NATIONAL_ID',
      issuingCountry: payload.issuingCountry || ocr.issuingCountry || 'Ethiopia',
      documentNumberMasked: maskedNum,
      frontFilePath: payload.frontFilePath || null,
      backFilePath: payload.backFilePath || null,
      fileHashSha256: payload.fileHash || null,
      ocrExtractedJson: ocr,
      authenticityChecksJson: payload.authenticityChecks || { authenticityScore: 98, tampered: false },
      isValid: true,
    });

    // Record attempt
    await repository.recordAttempt({
      caseId,
      attemptNumber: 1,
      livenessScore: rawProviderResult.livenessScore,
      livenessPassed: rawProviderResult.livenessScore >= 70,
      faceMatchScore: rawProviderResult.faceMatchScore,
      faceMatchConfidence: rawProviderResult.faceMatchScore >= 80 ? 'HIGH' : 'MEDIUM',
      faceMatchPassed: rawProviderResult.faceMatchScore >= 75,
      selfieFilePath: payload.selfieFilePath || null,
      providerRawSummary: rawProviderResult,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
    });

    // Evaluate policy against outcomes
    const policy = await repository.getPolicyByOrganization(caseRecord.organization_id || 1);
    const evaluation = policyEvaluator.evaluate(policy, rawProviderResult);

    this.validateTransition('PROVIDER_PROCESSING', evaluation.finalStatus);
    await repository.updateCaseStatus(caseId, evaluation.finalStatus, evaluation.failureReason);

    // Sync visitor core table
    const visitorSyncStatus = evaluation.finalStatus === 'VERIFIED' ? 'VERIFIED' : (evaluation.finalStatus === 'IN_REVIEW' ? 'PENDING' : 'REJECTED');
    await repository.syncVisitorVerificationStatus(caseRecord.visitor_id, visitorSyncStatus);

    // Propagate verification status to the 7 enterprise modules
    if (evaluation.finalStatus === 'VERIFIED') {
      try {
        await verificationIntegrationService.propagateVerificationStatus({
          visitorId: caseRecord.visitor_id,
          status: 'VERIFIED',
          sessionId: caseRecord.case_number,
          docType: payload.documentType || ocr.docType || 'NATIONAL_ID',
          docNumber: rawDocNum,
          faceMatchScore: rawProviderResult.faceMatchScore,
          livenessScore: rawProviderResult.livenessScore,
          frontImageUrl: payload.frontFilePath,
          backImageUrl: payload.backFilePath,
          selfieImageUrl: payload.selfieFilePath,
          actorId: userId,
          notes: 'Provider automated case verification passed'
        });
      } catch (propErr) {
        console.error('[IdentityVerificationService] Failed to propagate verification to enterprise modules:', propErr);
      }
    }

    return {
      caseId,
      status: evaluation.finalStatus,
      failureReason: evaluation.failureReason,
      requiresManualReview: evaluation.requiresManualReview,
      faceMatchScore: rawProviderResult.faceMatchScore,
      livenessScore: rawProviderResult.livenessScore,
    };
  }

  // ── 5. Provider Webhook Ingestion ──
  async handleProviderWebhook(providerName, signature, rawPayload) {
    const provider = ProviderFactory.getProvider(providerName);
    const isValidSignature = provider.verifyWebhook(signature, rawPayload);

    if (!isValidSignature && process.env.NODE_ENV === 'production') {
      throw new Error('SECURITY ERROR: Invalid webhook cryptographic signature.');
    }

    const payloadObj = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
    const eventId = payloadObj.id || payloadObj.eventId || `evt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const eventType = payloadObj.action || payloadObj.eventType || 'verification_decision';

    // Deduplication check
    const dedup = await repository.recordProviderEvent(providerName, eventId, eventType, signature, payloadObj);
    if (dedup.isDuplicate) {
      return { status: 'DUPLICATE_IGNORED', eventId };
    }

    const sessionId = payloadObj.verification?.id || payloadObj.sessionId;
    const caseRecord = await repository.getCaseByProviderSession(sessionId);

    if (!caseRecord) {
      await repository.markEventProcessed(dedup.eventDbId, 'UNMATCHED_CASE');
      return { status: 'UNMATCHED_CASE', sessionId };
    }

    const normalized = provider.normalizeResult(payloadObj);
    const policy = await repository.getPolicyByOrganization(caseRecord.organization_id || 1);
    const evaluation = policyEvaluator.evaluate(policy, normalized);

    this.validateTransition(caseRecord.status, evaluation.finalStatus);
    await repository.updateCaseStatus(caseRecord.id, evaluation.finalStatus, evaluation.failureReason);

    const visitorSyncStatus = evaluation.finalStatus === 'VERIFIED' ? 'VERIFIED' : (evaluation.finalStatus === 'IN_REVIEW' ? 'PENDING' : 'REJECTED');
    await repository.syncVisitorVerificationStatus(caseRecord.visitor_id, visitorSyncStatus);

    await repository.markEventProcessed(dedup.eventDbId, 'PROCESSED');

    return {
      status: 'PROCESSED',
      caseId: caseRecord.id,
      finalStatus: evaluation.finalStatus,
    };
  }

  // ── 6. Authorized Reviewer Operations ──
  async getReviewerQueue(filters) {
    return repository.getReviewerQueue(filters);
  }

  async deleteCase(caseId) {
    return repository.deleteCase(caseId);
  }

  async getCaseDetailForReview(caseId) {
    const caseRecord = await repository.getCaseById(caseId);
    if (!caseRecord) {
      throw new Error('Verification case not found.');
    }
    const documents = await repository.getDocumentsByCaseId(caseId);
    const attempts = await repository.getAttemptsByCaseId(caseId);
    const reviewHistory = await repository.getReviewDecisionsByCaseId(caseId);
    const policy = await repository.getPolicyByOrganization(caseRecord.organization_id || 1);

    return {
      case: caseRecord,
      documents,
      attempts,
      reviewHistory,
      policy,
    };
  }

  async recordReviewDecision(caseId, reviewerUserId, decisionData) {
    const caseRecord = await repository.getCaseById(caseId);
    if (!caseRecord) {
      throw new Error('Verification case not found.');
    }

    let targetStatus = 'IN_REVIEW';
    if (decisionData.decision === 'APPROVED') {
      targetStatus = 'VERIFIED';
    } else if (decisionData.decision === 'REJECTED') {
      targetStatus = 'REJECTED';
    } else if (decisionData.decision === 'RESUBMISSION_REQUESTED') {
      targetStatus = 'RESUBMISSION_REQUIRED';
    }

    this.validateTransition(caseRecord.status, targetStatus);

    // Save decision in database
    await repository.recordReviewDecision({
      caseId,
      reviewerUserId,
      decision: decisionData.decision,
      reviewNotes: decisionData.reviewNotes,
      decisionReasons: decisionData.reasons || [],
    });

    // Update case status
    await repository.updateCaseStatus(caseId, targetStatus, decisionData.reviewNotes);

    // Sync visitor core status
    const visitorSyncStatus = targetStatus === 'VERIFIED' ? 'VERIFIED' : (targetStatus === 'RESUBMISSION_REQUIRED' ? 'PENDING' : 'REJECTED');
    await repository.syncVisitorVerificationStatus(caseRecord.visitor_id, visitorSyncStatus);

    // Propagate verification status to all 7 enterprise modules
    if (targetStatus === 'VERIFIED') {
      try {
        await verificationIntegrationService.propagateVerificationStatus({
          visitorId: caseRecord.visitor_id,
          status: 'VERIFIED',
          sessionId: caseRecord.case_number,
          actorId: reviewerUserId,
          notes: `Manual review approved by Reviewer #${reviewerUserId}. Notes: ${decisionData.reviewNotes || 'Approved'}`
        });
      } catch (propErr) {
        console.error('[IdentityVerificationService] Failed to propagate reviewer approval:', propErr);
      }
    }

    // Audit Log
    try {
      await db.query(
        `INSERT INTO audit_logs (user_id, action, module, entity_name, entity_id, details)
         VALUES (?, 'IDENTITY_MANUAL_REVIEW_DECISION', 'IDENTITY_VERIFICATION', 'identity_verification_cases', ?, ?)`,
        [reviewerUserId, caseId, `Reviewer decided ${decisionData.decision}. Notes: ${decisionData.reviewNotes}`]
      );
    } catch (_) {}

    return {
      caseId,
      decision: decisionData.decision,
      newStatus: targetStatus,
    };
  }

  // ── 7. Verification Policies ──
  async getPolicy(organizationId) {
    return repository.getPolicyByOrganization(organizationId || 1);
  }

  async updatePolicy(organizationId, policyData, userId) {
    await repository.upsertPolicy({
      organizationId: organizationId || 1,
      ...policyData,
    });

    try {
      await db.query(
        `INSERT INTO audit_logs (user_id, action, module, entity_name, entity_id, details)
         VALUES (?, 'IDENTITY_POLICY_UPDATED', 'IDENTITY_VERIFICATION', 'identity_verification_policies', ?, ?)`,
        [userId, organizationId || 1, 'Updated organizational identity verification policy parameters']
      );
    } catch (_) {}

    return repository.getPolicyByOrganization(organizationId || 1);
  }
}

module.exports = new IdentityVerificationService();
