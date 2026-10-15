// src/repositories/SecurityIncidentRepository.js
// Repository for Security Incidents and Emergency Panic Events

const mockIncidents = [
  {
    id: 'inc_5001',
    incidentType: 'Panic Alarm Triggered',
    location: 'Main Lobby Desk #1',
    severity: 'Critical',
    status: 'In Progress',
    buildingId: 'bldg_hq',
    reportedBy: 'Receptionist Desk #1',
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
  },
  {
    id: 'inc_5002',
    incidentType: 'Unauthorized Entry Attempt',
    location: 'Server Room Annex B',
    severity: 'High',
    status: 'Under Investigation',
    buildingId: 'bldg_hq',
    reportedBy: 'Door Sensor #D-402',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  }
];

class SecurityIncidentRepository {
  async getIncidents(scope) {
    return mockIncidents.filter(inc => inc.buildingId === scope.buildingId);
  }

  async createIncident(incidentData, scope) {
    const newInc = {
      id: `inc_${Date.now()}`,
      ...incidentData,
      buildingId: scope.buildingId,
      status: 'Open',
      createdAt: new Date().toISOString()
    };
    mockIncidents.unshift(newInc);
    return newInc;
  }
}

module.exports = new SecurityIncidentRepository();
