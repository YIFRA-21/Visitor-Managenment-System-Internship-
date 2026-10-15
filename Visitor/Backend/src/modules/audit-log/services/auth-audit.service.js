const auditRepository = require('../repositories/audit.repository');

class AuthAuditService {
  async log(action, { userId = null, recordId = null, ipAddress = null, userAgent = null, status = 'SUCCESS', severity = 'LOW', metadata = {} } = {}) {
    try {
      await auditRepository.log({
        userId,
        actorId: userId,
        action,
        module: 'AUTH',
        entity: 'users',
        recordId: recordId || userId,
        ipAddress,
        userAgent,
        status,
        severity,
        newValues: metadata,
      });
    } catch (err) {
      console.error(`AuthAuditService log error for action ${action}:`, err.message);
    }
  }

  async logLoginSuccess(userId, clientInfo = {}) {
    return this.log('LOGIN_SUCCESS', {
      userId,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      severity: 'LOW',
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  async logLoginFailure(identifier, reason, clientInfo = {}) {
    return this.log('LOGIN_FAILED', {
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      status: 'FAILED',
      severity: 'MEDIUM',
      metadata: { identifier, reason, timestamp: new Date().toISOString() },
    });
  }

  async logLogout(userId, clientInfo = {}) {
    return this.log('LOGOUT', {
      userId,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      severity: 'LOW',
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  async logSessionTerminated(userId, sessionId, clientInfo = {}) {
    return this.log('SESSION_TERMINATED', {
      userId,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      severity: 'LOW',
      metadata: { sessionId, timestamp: new Date().toISOString() },
    });
  }

  async logAllSessionsTerminated(userId, clientInfo = {}) {
    return this.log('SESSION_ALL_TERMINATED', {
      userId,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      severity: 'MEDIUM',
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  async logPasswordChanged(userId, clientInfo = {}) {
    return this.log('PASSWORD_CHANGED', {
      userId,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      severity: 'MEDIUM',
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  async logPasswordResetRequested(email, clientInfo = {}) {
    return this.log('PASSWORD_RESET_REQUESTED', {
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      severity: 'LOW',
      metadata: { email, timestamp: new Date().toISOString() },
    });
  }

  async logPasswordResetCompleted(userId, clientInfo = {}) {
    return this.log('PASSWORD_RESET_COMPLETED', {
      userId,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      severity: 'MEDIUM',
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  async logAccountLocked(userId, reason, clientInfo = {}) {
    return this.log('ACCOUNT_LOCKED', {
      userId,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      status: 'FAILED',
      severity: 'HIGH',
      metadata: { reason, timestamp: new Date().toISOString() },
    });
  }

  async logAccountUnlocked(userId, clientInfo = {}) {
    return this.log('ACCOUNT_UNLOCKED', {
      userId,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      severity: 'MEDIUM',
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  async logRoleAssigned(targetUserId, roleCode, actorId, clientInfo = {}) {
    return this.log('ROLE_ASSIGNED', {
      userId: actorId,
      recordId: targetUserId,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      severity: 'MEDIUM',
      metadata: { targetUserId, roleCode, timestamp: new Date().toISOString() },
    });
  }

  async logRoleRevoked(targetUserId, roleCode, actorId, clientInfo = {}) {
    return this.log('ROLE_REVOKED', {
      userId: actorId,
      recordId: targetUserId,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      severity: 'MEDIUM',
      metadata: { targetUserId, roleCode, timestamp: new Date().toISOString() },
    });
  }

  async logPermissionChanged(targetUserId, permissions, actorId, clientInfo = {}) {
    return this.log('PERMISSION_CHANGED', {
      userId: actorId,
      recordId: targetUserId,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      severity: 'HIGH',
      metadata: { targetUserId, permissions, timestamp: new Date().toISOString() },
    });
  }
}

module.exports = new AuthAuditService();
