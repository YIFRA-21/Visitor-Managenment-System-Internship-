class AuditEngine {
  logEvent(req, action, details = {}) {
    const auditRecord = {
      auditId: `AUD-${Date.now()}`,
      userId: req?.user?.id || req?.user?.userId || 'SYSTEM',
      role: req?.user?.role || 'SYSTEM',
      action,
      details,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1',
      userAgent: req?.headers?.['user-agent'] || 'VMS-Engine',
      timestamp: new Date().toISOString()
    };
    return auditRecord;
  }
}

module.exports = new AuditEngine();
