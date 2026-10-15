const auditLogs = [];

function auditLogger(action, module = 'OrganizationManagement') {
  return (req, res, next) => {
    const log = {
      id: auditLogs.length + 1,
      action,
      module,
      user: req.user ? req.user.username || req.user.id : 'anonymous',
      userId: req.user ? req.user.id : null,
      ip: req.ip,
      timestamp: new Date().toISOString(),
      metadata: {
        method: req.method,
        path: req.originalPath || req.originalUrl,
        query: req.query,
      },
    };
    auditLogs.push(log);
    req.auditLog = log;
    next();
  };
}

function getAuditLogs() {
  return auditLogs;
}

module.exports = { auditLogger, getAuditLogs };
