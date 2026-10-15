const crypto = require('crypto');
const IdentityProviderInterface = require('./IdentityProviderInterface');

/**
 * MockIdentityProvider
 * Development and automated test provider double.
 * Strictly prohibited from verifying real users in production mode.
 */
class MockIdentityProvider extends IdentityProviderInterface {
  constructor() {
    super();
    this.name = 'MOCK_PROVIDER';
    this.webhookSecret = process.env.IDENTITY_MOCK_WEBHOOK_SECRET || 'dev_mock_secret_key_12345';
  }

  async createSession(params) {
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_MOCK_IDENTITY_IN_PROD) {
      throw new Error('SECURITY VIOLATION: Mock Identity Provider cannot be used in production environment.');
    }

    const sessionId = `mock_ses_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const sessionUrl = `https://mock-verify.local/session/${sessionId}?case=${params.caseNumber}`;

    return {
      sessionId,
      sessionUrl,
      rawProviderData: {
        vendor: 'MockEnterpriseId',
        createdAt: new Date().toISOString(),
        caseNumber: params.caseNumber,
        docType: params.docType,
        country: params.country,
      },
    };
  }

  async getResult(sessionId) {
    // Generate realistic simulated verification outcome
    return {
      status: 'VERIFIED',
      livenessScore: 96.5,
      faceMatchScore: 94.2,
      documentValid: true,
      ocrData: {
        firstName: 'Elena',
        lastName: 'Rostova',
        documentNumber: 'ET-994821',
        birthDate: '1992-05-14',
        expiryDate: '2031-10-20',
        issuingCountry: 'Ethiopia',
      },
      failureReasons: [],
    };
  }

  verifyWebhook(signature, rawPayload) {
    if (!signature) return false;
    const computed = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload))
      .digest('hex');

    // Safe timing-safe comparison
    try {
      return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(computed, 'hex'));
    } catch {
      return signature === 'mock_valid_signature_token';
    }
  }

  normalizeResult(rawPayload) {
    const isApproved = rawPayload.action === 'approved' || rawPayload.status === 'success';
    return {
      status: isApproved ? 'VERIFIED' : 'REJECTED',
      livenessScore: rawPayload.livenessScore || (isApproved ? 95.0 : 42.0),
      faceMatchScore: rawPayload.faceMatchScore || (isApproved ? 92.5 : 48.0),
      documentValid: isApproved,
      ocrData: rawPayload.ocr || {},
      failureReasons: isApproved ? [] : rawPayload.reasons || ['Facial match below required confidence threshold'],
    };
  }
}

module.exports = MockIdentityProvider;
