// src/services/security/SecurityIncidentNotificationService.js
// Incident Alert & Emergency Lockdown Handler

const SecurityIncidentRepository = require('../repositories/security-incident.repository');
const { auditLog } = require('../../../utils/audit');

class SecurityIncidentNotificationService {
  async getIncidents(scope) {
    return await SecurityIncidentRepository.getIncidents(scope);
  }

  async triggerEmergencyIncident(incidentData, scope) {
    const incident = await SecurityIncidentRepository.createIncident({
      ...incidentData,
      quietHoursBypassed: true,
      audioChimeTriggered: true
    }, scope);

    await auditLog({
      userId: scope.securityUserId,
      entity: 'security_incident',
      action: 'trigger_emergency_incident',
      details: { incidentId: incident.id, type: incident.incidentType }
    });

    return incident;
  }
}

module.exports = new SecurityIncidentNotificationService();
