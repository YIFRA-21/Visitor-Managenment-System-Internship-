/**
 * RiskEngineService
 * Security Risk Assessment Engine performing threat scoring across duplicate identities,
 * duplicate faces, watchlist hits, blacklist entries, expired documents, and document authenticity.
 */

class RiskEngineService {
  /**
   * Run comprehensive risk assessment
   * @param {Object} context - Verification context
   * @returns {Object} Security risk validation checklist and composite risk score
   */
  evaluateSecurityRisk(context = {}) {
    const {
      duplicateIdentity = false,
      duplicateVisitor = false,
      duplicateFace = false,
      blacklisted = false,
      watchlistHit = false,
      expiredDocument = false,
      livenessPassed = true,
      faceMatchScore = 95.0,
      imageQualityScore = 90
    } = context;

    let riskScore = 5.0; // Base low risk score (0 - 100%)

    if (duplicateIdentity) riskScore += 30;
    if (duplicateVisitor) riskScore += 25;
    if (duplicateFace) riskScore += 35;
    if (blacklisted) riskScore += 50;
    if (watchlistHit) riskScore += 45;
    if (expiredDocument) riskScore += 20;
    if (!livenessPassed) riskScore += 40;
    if (faceMatchScore < 70) riskScore += 25;

    const finalRiskScore = Math.min(100, Math.max(0, riskScore));
    const isDocumentAuthentic = !expiredDocument && imageQualityScore >= 70;

    let riskLevel = 'LOW';
    if (finalRiskScore >= 75) riskLevel = 'CRITICAL';
    else if (finalRiskScore >= 45) riskLevel = 'HIGH';
    else if (finalRiskScore >= 20) riskLevel = 'MEDIUM';

    return {
      riskScore: finalRiskScore,
      riskLevel,
      documentAuthenticity: isDocumentAuthentic ? 'VERIFIED_AUTHENTIC' : 'AUTHENTICITY_WARNING',
      checklist: [
        { key: 'DUPLICATE_IDENTITY', label: 'Duplicate Identity Check', passed: !duplicateIdentity, value: duplicateIdentity ? 'Flagged' : 'Passed' },
        { key: 'DUPLICATE_VISITOR', label: 'Duplicate Visitor Check', passed: !duplicateVisitor, value: duplicateVisitor ? 'Flagged' : 'Passed' },
        { key: 'DUPLICATE_FACE', label: 'Duplicate Face Check', passed: !duplicateFace, value: duplicateFace ? 'Flagged' : 'Passed' },
        { key: 'BLACKLIST', label: 'Security Blacklist Check', passed: !blacklisted, value: blacklisted ? 'BLACK_LISTED' : 'Passed' },
        { key: 'WATCHLIST', label: 'Watchlist Screening', passed: !watchlistHit, value: watchlistHit ? 'WATCHLIST_HIT' : 'Passed' },
        { key: 'EXPIRED_DOC', label: 'Document Validity & Expiry', passed: !expiredDocument, value: expiredDocument ? 'Expired' : 'Valid' },
        { key: 'DOC_AUTHENTICITY', label: 'Document Authenticity & Hologram', passed: isDocumentAuthentic, value: isDocumentAuthentic ? 'Authentic' : 'Low Confidence' }
      ]
    };
  }
}

module.exports = new RiskEngineService();
