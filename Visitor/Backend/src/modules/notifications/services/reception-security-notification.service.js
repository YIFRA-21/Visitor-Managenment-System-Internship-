// src/services/reception/ReceptionSecurityNotificationService.js
// Reception Security & Emergency Alert Service

const ReceptionSecurityRepository = require('../../reception/repositories/reception-security.repository');
const { auditLog } = require('../../../utils/audit');

class ReceptionSecurityNotificationService {
  async getSecurityAlerts(scope) {
    return await ReceptionSecurityRepository.getSecurityAlerts(scope);
  }

  async triggerEmergencyAlert(alertType, scope) {
    const emergencyEvent = {
      id: `em_rcp_${Date.now()}`,
      alertType,
      message: `Emergency Alert triggered by Reception Desk ${scope.deskId}: ${alertType}`,
      quietHoursBypassed: true,
      audioChimeTriggered: true,
      timestamp: new Date().toISOString()
    };

    await auditLog({
      userId: scope.receptionUserId,
      entity: 'reception_emergency',
      action: 'trigger_emergency_alert',
      details: { alertType, deskId: scope.deskId }
    });

    return emergencyEvent;
  }
}

module.exports = new ReceptionSecurityNotificationService();
