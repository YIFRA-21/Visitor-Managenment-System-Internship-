const crypto = require('crypto');
const IdentityProviderInterface = require('./IdentityProviderInterface');

/**
 * VeriffProviderAdapter
 * Production integration adapter for Veriff Identity Verification API.
 * Uses native fetch (Node.js 18+) without requiring external axios dependency.
 */
class VeriffProviderAdapter extends IdentityProviderInterface {
  constructor() {
    super();
    this.name = 'VERIFF';
    this.apiKey = process.env.VERIFF_API_KEY || '';
    this.apiSecret = process.env.VERIFF_API_SECRET || '';
    this.baseUrl = process.env.VERIFF_BASE_URL || 'https://stationapi.veriff.com/v1';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiSecret);
  }

  async createSession(params) {
    if (!this.isConfigured()) {
      throw new Error('Veriff API credentials (VERIFF_API_KEY, VERIFF_API_SECRET) are not configured.');
    }

    const payload = {
      verification: {
        callback: params.webhookUrl || process.env.IDENTITY_WEBHOOK_URL,
        person: {
          firstName: params.firstName || 'Visitor',
          lastName: params.lastName || 'Guest',
        },
        document: {
          type: this.mapDocumentType(params.docType),
          country: params.countryCode || 'ET',
        },
        vendorData: params.caseNumber,
      },
    };

    const response = await fetch(`${this.baseUrl}/sessions`, {
      method: 'POST',
      headers: {
        'X-AUTH-CLIENT': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Veriff session creation failed with HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (!data?.verification?.id) {
      throw new Error('Invalid response structure from Veriff API.');
    }

    return {
      sessionId: data.verification.id,
      sessionUrl: data.verification.url,
      rawProviderData: data.verification,
    };
  }

  async getResult(sessionId) {
    if (!this.isConfigured()) {
      throw new Error('Veriff API credentials are not configured.');
    }

    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/decision`, {
      method: 'GET',
      headers: {
        'X-AUTH-CLIENT': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Veriff decision for session ${sessionId}`);
    }

    const data = await response.json();
    return this.normalizeResult(data);
  }

  verifyWebhook(signature, rawPayload) {
    if (!this.apiSecret || !signature) return false;

    const payloadString = typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload);
    const computedHmac = crypto
      .createHmac('sha256', this.apiSecret)
      .update(payloadString)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(signature.toLowerCase()), Buffer.from(computedHmac.toLowerCase()));
    } catch {
      return false;
    }
  }

  normalizeResult(rawPayload) {
    const verif = rawPayload?.verification || rawPayload;
    const status = (verif?.status || '').toLowerCase();
    const code = verif?.code;

    let normalizedStatus = 'PENDING';
    const failureReasons = [];

    if (status === 'approved') {
      normalizedStatus = 'VERIFIED';
    } else if (status === 'declined') {
      normalizedStatus = 'REJECTED';
      if (verif.reason) failureReasons.push(verif.reason);
    } else if (status === 'resubmission_requested') {
      normalizedStatus = 'RESUBMISSION_REQUIRED';
      if (verif.reason) failureReasons.push(verif.reason);
    } else if (status === 'review' || code === 9001) {
      normalizedStatus = 'IN_REVIEW';
    }

    return {
      status: normalizedStatus,
      livenessScore: verif?.technicalData?.livenessScore ? parseFloat(verif.technicalData.livenessScore) : (normalizedStatus === 'VERIFIED' ? 95.0 : 50.0),
      faceMatchScore: verif?.technicalData?.faceMatchScore ? parseFloat(verif.technicalData.faceMatchScore) : (normalizedStatus === 'VERIFIED' ? 92.0 : 45.0),
      documentValid: normalizedStatus === 'VERIFIED',
      ocrData: verif?.person || {},
      failureReasons,
    };
  }

  mapDocumentType(type) {
    const map = {
      PASSPORT: 'PASSPORT',
      NATIONAL_ID: 'ID_CARD',
      DRIVERS_LICENSE: 'DRIVERS_LICENSE',
      RESIDENCE_PERMIT: 'RESIDENCE_PERMIT',
    };
    return map[type] || 'ID_CARD';
  }
}

module.exports = VeriffProviderAdapter;
