/**
 * FaceMatchingService
 * Compares ONLY Live Selfie against Portrait Photo extracted from the FRONT of the Identity Document.
 * Uses OpenCV computer vision: Haar cascade face detection & isolation, multi-scale feature matching,
 * template correlation, and anatomical region alignment.
 */

const visionBridge = require('./VisionServiceBridge');

class FaceMatchingService {
  /**
   * Compare Live Selfie with FRONT Document Portrait
   * @param {string} selfieImage - Base64 selfie image
   * @param {string} frontDocImage - Base64 front document image
   * @param {Object} options - Thresholds and context
   * @returns {Promise<Object>} Comprehensive face match metrics
   */
  async compareSelfieWithFrontDoc(selfieImage, frontDocImage, options = {}) {
    if (!selfieImage || !frontDocImage) {
      throw new Error('Both Live Selfie and FRONT Document image are required for face matching.');
    }

    const thresholdVerified = options.thresholdVerified || 80.0;
    const thresholdReview = options.thresholdReview || 68.0;

    try {
      const cvResult = await visionBridge.runVisionTask('match_faces', {
        selfieImage,
        frontDocImage
      });

      if (cvResult && cvResult.success) {
        const similarityScore = cvResult.similarityScore || 0;
        const confidenceScore = cvResult.confidenceScore || 0;
        const imageQualityScore = options.imageQualityScore || 88.0;
        const livenessScore = options.livenessScore || 90.0;

        const overallVerificationScore = parseFloat(
          (similarityScore * 0.5 + confidenceScore * 0.2 + imageQualityScore * 0.15 + livenessScore * 0.15).toFixed(2)
        );

        let status = 'REJECTED';
        let confidenceLevel = 'Verification Failed';

        if (similarityScore >= thresholdVerified) {
          status = 'VERIFIED';
          confidenceLevel = 'Verified (High Biometric Confidence)';
        } else if (similarityScore >= thresholdReview) {
          status = 'MANUAL_REVIEW_REQUIRED';
          confidenceLevel = 'Manual Review Required (Borderline Similarity)';
        } else {
          status = 'REJECTED';
          confidenceLevel = cvResult.confidenceLevel || 'Biometric Match Failed';
        }

        return {
          similarityScore,
          confidenceScore,
          imageQualityScore,
          livenessScore,
          overallVerificationScore,
          confidenceLevel,
          status,
          thresholds: {
            verifiedThreshold: thresholdVerified,
            manualReviewThreshold: thresholdReview
          },
          extractedPortrait: cvResult.extractedPortrait || {
            documentPortraitUrl: frontDocImage,
            extractedFrom: 'FRONT_DOCUMENT_SIDE'
          },
          comparedSources: {
            sourceA: 'Live Selfie',
            sourceB: 'Front Document Portrait Photo'
          },
          partMatches: cvResult.partMatches || [],
          timestamp: new Date().toISOString()
        };
      }
    } catch (err) {
      console.warn('[FaceMatchingService] Vision bridge error:', err.message);
    }

    // Honest fallback if processing fails
    return {
      similarityScore: 0,
      confidenceScore: 0,
      imageQualityScore: options.imageQualityScore || 70.0,
      livenessScore: options.livenessScore || 70.0,
      overallVerificationScore: 0,
      confidenceLevel: 'Biometric Analysis Inconclusive',
      status: 'MANUAL_REVIEW_REQUIRED',
      thresholds: {
        verifiedThreshold: thresholdVerified,
        manualReviewThreshold: thresholdReview
      },
      extractedPortrait: {
        documentPortraitUrl: frontDocImage,
        extractedFrom: 'FRONT_DOCUMENT_SIDE'
      },
      comparedSources: {
        sourceA: 'Live Selfie',
        sourceB: 'Front Document Portrait Photo'
      },
      partMatches: [],
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new FaceMatchingService();
