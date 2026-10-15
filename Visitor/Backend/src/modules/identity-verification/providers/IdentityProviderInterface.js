/**
 * IdentityProviderInterface
 * Standard contract for trusted external identity verification adapters.
 */
class IdentityProviderInterface {
  /**
   * Initializes a new identity verification session with the external provider.
   * @param {Object} params - { caseNumber, visitorId, docType, country, redirectUrl, webhookUrl }
   * @returns {Promise<{ sessionId: string, sessionUrl: string, rawProviderData: Object }>}
   */
  async createSession(params) {
    throw new Error('createSession() must be implemented by adapter.');
  }

  /**
   * Retrieves the current result of a verification session from the provider.
   * @param {string} sessionId
   * @returns {Promise<Object>} Normalized result object
   */
  async getResult(sessionId) {
    throw new Error('getResult() must be implemented by adapter.');
  }

  /**
   * Validates the cryptographic signature of incoming provider webhook notifications.
   * @param {string} signature - Provided signature from header
   * @param {string|Buffer} rawPayload - Raw incoming request body
   * @param {Object} [headers] - Additional headers
   * @returns {boolean} True if signature is valid and authentic
   */
  verifyWebhook(signature, rawPayload, headers = {}) {
    throw new Error('verifyWebhook() must be implemented by adapter.');
  }

  /**
   * Normalizes raw provider payload into VMS standardized check results.
   * @param {Object} rawPayload
   * @returns {{ status: string, livenessScore: number, faceMatchScore: number, documentValid: boolean, ocrData: Object, failureReasons: string[] }}
   */
  normalizeResult(rawPayload) {
    throw new Error('normalizeResult() must be implemented by adapter.');
  }
}

module.exports = IdentityProviderInterface;
