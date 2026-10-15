/**
 * PolicyEvaluatorService
 * Evaluates organization identity policies against raw provider outcomes.
 */
class PolicyEvaluatorService {
  /**
   * Evaluates check results against organizational policy.
   * @param {Object} policy - Org policy record from DB
   * @param {Object} normalizedResult - { status, livenessScore, faceMatchScore, documentValid, failureReasons }
   * @returns {{ finalStatus: string, failureReason: string|null, requiresManualReview: boolean }}
   */
  evaluate(policy, normalizedResult) {
    if (!policy) {
      // Default safe policy
      return {
        finalStatus: normalizedResult.status,
        failureReason: normalizedResult.failureReasons?.join(', ') || null,
        requiresManualReview: normalizedResult.status === 'IN_REVIEW',
      };
    }

    const failureReasons = [...(normalizedResult.failureReasons || [])];
    let requiresReview = false;

    // 1. Check Document Validity
    if (!normalizedResult.documentValid) {
      failureReasons.push('Identity document verification failed authenticity checks.');
    }

    // 2. Check Liveness requirement
    if (policy.require_liveness_check) {
      if (!normalizedResult.livenessScore || normalizedResult.livenessScore < 70) {
        failureReasons.push('Biometric liveness verification failed.');
        if (policy.allow_manual_review_fallback) {
          requiresReview = true;
        }
      }
    }

    // 3. Check Face Match Confidence
    if (policy.require_face_match) {
      const minConfidence = parseFloat(policy.min_face_match_confidence || 75.0);
      if (!normalizedResult.faceMatchScore || normalizedResult.faceMatchScore < minConfidence) {
        failureReasons.push(`Facial match confidence (${normalizedResult.faceMatchScore || 0}%) was below policy threshold (${minConfidence}%).`);
        if (policy.allow_manual_review_fallback) {
          requiresReview = true;
        }
      }
    }

    // Determine Final Status
    if (failureReasons.length === 0 && normalizedResult.status === 'VERIFIED') {
      return {
        finalStatus: 'VERIFIED',
        failureReason: null,
        requiresManualReview: false,
      };
    }

    if (requiresReview && policy.allow_manual_review_fallback) {
      return {
        finalStatus: 'IN_REVIEW',
        failureReason: failureReasons.join('; '),
        requiresManualReview: true,
      };
    }

    return {
      finalStatus: 'REJECTED',
      failureReason: failureReasons.join('; '),
      requiresManualReview: false,
    };
  }
}

module.exports = new PolicyEvaluatorService();
