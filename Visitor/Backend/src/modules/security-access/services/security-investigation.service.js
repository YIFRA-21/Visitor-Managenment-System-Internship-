// src/services/security/SecurityInvestigationService.js
// Investigation Center Case Management Service

const SecurityInvestigationRepository = require('../repositories/security-investigation.repository');
const { auditLog } = require('../../../utils/audit');

class SecurityInvestigationService {
  async getCases(scope) {
    return await SecurityInvestigationRepository.getCases(scope);
  }

  async createCase(caseData, scope) {
    const caseObj = await SecurityInvestigationRepository.createCase(caseData, scope);
    await auditLog({
      userId: scope.securityUserId,
      entity: 'security_investigation',
      action: 'create_investigation_case',
      details: { caseId: caseObj.caseId, title: caseObj.title }
    });
    return caseObj;
  }
}

module.exports = new SecurityInvestigationService();
