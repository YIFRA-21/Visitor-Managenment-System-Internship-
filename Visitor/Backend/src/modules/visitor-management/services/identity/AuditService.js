/**
 * AuditService
 * Wraps Module 16 audit logger for identity verification operations.
 */

const auditRepository = require('../../../audit-log/repositories/audit.repository');

class AuditService {
  async logVerificationStep(actorId, visitorId, action, details) {
    try {
      await auditRepository.log({
        actorId: actorId || 1,
        action,
        module: 'IDENTITY_VERIFICATION',
        entity: 'visitor_identity_verifications',
        recordId: visitorId,
        newValues: details,
        status: 'SUCCESS',
        severity: action.includes('REJECTED') || action.includes('FAILED') ? 'HIGH' : 'MEDIUM'
      });
    } catch (err) {
      console.warn('Audit log warning:', err.message);
    }
  }
}

module.exports = new AuditService();
