const auditRepository = require('./repositories/audit.repository');
const authAuditService = require('./services/auth-audit.service');
const manualAuditService = require('./services/manual-audit.service');

module.exports = {
  auditRepository,
  authAuditService,
  manualAuditService,
};
