// src/services/security/SecurityAccessControlNotificationService.js
// Access Control & Turnstile Violation Alerts

const SecurityAccessLogRepository = require('../repositories/security-access-log.repository');

class SecurityAccessControlNotificationService {
  async getAccessLogs(scope) {
    return await SecurityAccessLogRepository.getAccessLogs(scope);
  }
}

module.exports = new SecurityAccessControlNotificationService();
