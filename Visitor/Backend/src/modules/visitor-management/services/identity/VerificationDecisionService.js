/**
 * VerificationDecisionService
 * Combines Document Quality, OCR, Liveness, Face Matching, Duplicate Check,
 * Blacklist & Watchlist results to render the final verification decision verdict.
 */

class VerificationDecisionService {
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

    // Blacklist rule
    if (blacklistCheck && blacklistCheck.isBlacklisted) {
      finalStatus = 'REJECTED';
      issues.push('Visitor is flagged on System Blacklist.');
    }

    // Watchlist rule
    if (watchlistCheck && watchlistCheck.isWatchlisted) {
      finalStatus = 'MANUAL_REVIEW_REQUIRED';
      issues.push('Visitor matched an entry on Enterprise Watchlist.');
    }

    // Duplicate check
    if (duplicateCheck && duplicateCheck.hasDuplicate) {
      finalStatus = 'MANUAL_REVIEW_REQUIRED';
      issues.push('Duplicate ID number found on another visitor record.');
    }

    // Expiry check
    if (expiryCheck && expiryCheck.isExpired) {
      finalStatus = 'REJECTED';
      issues.push('Identity document is expired.');
    }

    // Face match score rule
    if (faceMatchResult) {
      if (faceMatchResult.matchScore < 80) {
        finalStatus = 'REJECTED';
        issues.push(`Face match score (${faceMatchResult.matchScore}%) below minimum required threshold (80%).`);
      } else if (faceMatchResult.matchScore < 90 && finalStatus !== 'REJECTED') {
        finalStatus = 'MANUAL_REVIEW_REQUIRED';
        issues.push(`Face match score (${faceMatchResult.matchScore}%) requires manual security review.`);
      }
    }

    // Visual liveness rule
    if (livenessResult && !livenessResult.livenessPassed) {
      finalStatus = 'REJECTED';
      issues.push('Visual liveness challenge was not completed successfully.');
    }

    return {
      finalStatus,
      summary: {
        documentValid: !expiryCheck?.isExpired,
        ocrSuccessful: Boolean(ocrData && ocrData.ocrStatus === 'SUCCESS'),
        faceMatchScore: faceMatchResult ? faceMatchResult.matchScore : 0,
        faceMatchConfidence: faceMatchResult ? faceMatchResult.confidenceLevel : 'N/A',
        visualLivenessPassed: Boolean(livenessResult && livenessResult.livenessPassed),
        blacklistPassed: !blacklistCheck?.isBlacklisted,
        watchlistPassed: !watchlistCheck?.isWatchlisted,
        duplicateCheckPassed: !duplicateCheck?.hasDuplicate
      },
      rejectionReason: issues.length > 0 ? issues.join(' ') : null,
      evaluatedAt: new Date().toISOString()
    };
  }
}

module.exports = new VerificationDecisionService();
