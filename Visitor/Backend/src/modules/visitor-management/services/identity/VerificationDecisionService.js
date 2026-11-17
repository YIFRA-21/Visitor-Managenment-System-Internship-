/**
 * VerificationDecisionService
 * Enterprise Decision Engine:
 * Separates Image Quality, OCR extraction, Facial Similarity, Liveness, and Security checks
 * into distinct independent validations.
 * Returns honest VERIFIED, MANUAL_REVIEW_REQUIRED, or REJECTED verdict.
 */

class VerificationDecisionService {
  /**
   * Evaluate session metrics to render final decision
   * @param {Object} sessionData - Verification session outcomes
   * @returns {Object} Comprehensive verdict and component validations
   */
  evaluateFinalDecision(sessionData) {
    const {
      qualityAnalysis,
      ocrData,
      livenessResult,
      faceMatchResult,
      duplicateCheck,
      blacklistCheck,
      watchlistCheck,
      expiryCheck
    } = sessionData;

    let finalStatus = 'VERIFIED';
    const issues = [];
    const reviewReasons = [];

    // 1. Blacklist Check (Fatal)
    const isBlacklisted = Boolean(blacklistCheck && blacklistCheck.isBlacklisted);
    if (isBlacklisted) {
      finalStatus = 'REJECTED';
      issues.push('Visitor is flagged on Enterprise Security Blacklist.');
    }

    // 2. Watchlist Check (Requires Review)
    const isWatchlisted = Boolean(watchlistCheck && watchlistCheck.isWatchlisted);
    if (isWatchlisted) {
      if (finalStatus !== 'REJECTED') finalStatus = 'MANUAL_REVIEW_REQUIRED';
      reviewReasons.push('Visitor identity matches entry on Enterprise Security Watchlist.');
    }

    // 3. Document Expiration Check (Fatal)
    const isExpired = Boolean(expiryCheck && expiryCheck.isExpired);
    if (isExpired) {
      finalStatus = 'REJECTED';
      issues.push('Identity document has expired and cannot be accepted.');
    }

    // 4. Duplicate ID Check (Requires Review)
    const hasDuplicate = Boolean(duplicateCheck && duplicateCheck.hasDuplicate);
    if (hasDuplicate) {
      if (finalStatus !== 'REJECTED') finalStatus = 'MANUAL_REVIEW_REQUIRED';
      reviewReasons.push('Duplicate ID number or biometric identity registered under another visitor record.');
    }

    // 5. Active & Passive Liveness Check (Fatal)
    const livenessPassed = Boolean(livenessResult && livenessResult.livenessPassed);
    const spoofDetected = Boolean(livenessResult && livenessResult.replayAttackDetected);
    if (!livenessPassed || spoofDetected) {
      finalStatus = 'REJECTED';
      issues.push('Facial liveness verification failed or presentation attack detected.');
    }

    // 6. Face Match Score Check
    const matchScore = faceMatchResult ? (parseFloat(faceMatchResult.similarityScore || faceMatchResult.matchScore) || 0) : 0;
    const faceStatus = faceMatchResult?.status || 'REJECTED';

    if (matchScore < 68.0 || faceStatus === 'REJECTED') {
      finalStatus = 'REJECTED';
      issues.push(`Biometric facial similarity (${matchScore}%) is below the minimum threshold (68%).`);
    } else if (matchScore < 80.0 || faceStatus === 'MANUAL_REVIEW_REQUIRED') {
      if (finalStatus !== 'REJECTED') finalStatus = 'MANUAL_REVIEW_REQUIRED';
      reviewReasons.push(`Biometric similarity (${matchScore}%) requires manual security review.`);
    }

    // 7. OCR Extraction Check
    const ocrSuccess = Boolean(ocrData && (ocrData.ocrStatus === 'SUCCESS' || ocrData.ocrStatus === 'PARTIAL'));
    if (!ocrSuccess) {
      if (finalStatus !== 'REJECTED') finalStatus = 'MANUAL_REVIEW_REQUIRED';
      reviewReasons.push('Document OCR extraction confidence was inconclusive. Security review required.');
    }

    // 8. Image Quality Check
    const qualityScore = qualityAnalysis ? (qualityAnalysis.overallScore || 0) : 0;
    if (qualityAnalysis && qualityScore < 50.0) {
      if (finalStatus !== 'REJECTED') finalStatus = 'MANUAL_REVIEW_REQUIRED';
      reviewReasons.push('Document image quality score is below standard resolution/clarity requirements.');
    }

    const rejectionReason = issues.length > 0
      ? issues.join(' ')
      : (reviewReasons.length > 0 ? reviewReasons.join(' ') : null);

    return {
      finalStatus,
      summary: {
        documentValid: !isExpired,
        ocrSuccessful: ocrSuccess,
        ocrConfidence: ocrData?.confidenceScore || 0,
        faceMatchScore: matchScore,
        faceMatchConfidence: faceMatchResult?.confidenceLevel || 'N/A',
        faceMatchStatus: faceStatus,
        visualLivenessPassed: livenessPassed,
        imageQualityScore: qualityScore,
        blacklistPassed: !isBlacklisted,
        watchlistPassed: !isWatchlisted,
        duplicateCheckPassed: !hasDuplicate
      },
      rejectionReason,
      requiresManualReview: finalStatus === 'MANUAL_REVIEW_REQUIRED',
      evaluatedAt: new Date().toISOString()
    };
  }
}

module.exports = new VerificationDecisionService();
