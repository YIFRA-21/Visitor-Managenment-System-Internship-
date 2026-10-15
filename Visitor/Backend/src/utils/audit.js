// src/utils/audit.js
// Enterprise Audit Logger for Administrator & System events

const logger = require('./logger');

async function auditLog({ userId, entity, action, details = {}, ip = '127.0.0.1' }) {
  const auditEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    userId: userId || 'system',
    entity,
    action,
    details,
    ip
  };

  if (logger && typeof logger.info === 'function') {
    logger.info(`[AUDIT] ${entity}:${action} by ${userId}`, auditEntry);
  } else {
    console.log(`[AUDIT LOG] ${entity}:${action} by ${userId}`, JSON.stringify(auditEntry));
  }

  return auditEntry;
}

module.exports = {
  auditLog
};
