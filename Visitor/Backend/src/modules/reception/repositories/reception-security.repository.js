// src/repositories/ReceptionSecurityRepository.js
// Repository for Reception Security Events & Emergency Alerts

const mockSecurityAlerts = [
  {
    id: 'sec_801',
    alertType: 'Blacklist Match',
    visitorName: 'Arthur Pendelton',
    idNumber: 'ID-99021-X',
    reason: 'Matched Restricted Access Watchlist Entry #WL-804.',
    severity: 'Critical',
    status: 'Security Notified',
    deskId: 'desk_main_lobby_01',
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString()
  },
  {
    id: 'sec_802',
    alertType: 'Unauthorized Entry Attempt',
    visitorName: 'Unknown Badge Scanned',
    idNumber: 'N/A',
    reason: 'Expired badge V-802 scanned at Turnstile #2.',
    severity: 'High',
    status: 'Turnstile Locked',
    deskId: 'desk_main_lobby_01',
    createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString()
  }
];

class ReceptionSecurityRepository {
  async getSecurityAlerts(scope) {
    return mockSecurityAlerts.filter(s => s.deskId === scope.deskId);
  }
}

module.exports = new ReceptionSecurityRepository();
