// src/repositories/SecurityAccessLogRepository.js
// Repository for Turnstile & Door Access Control Logs

const mockAccessLogs = [
  {
    logId: 'ac_9001',
    badgeId: 'V-1044',
    holderName: 'John Vance',
    accessPoint: 'Turnstile #1 (Main Lobby)',
    event: 'Access Granted',
    status: 'Success',
    buildingId: 'bldg_hq',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  },
  {
    logId: 'ac_9002',
    badgeId: 'V-802',
    holderName: 'Expired Badge V-802',
    accessPoint: 'Turnstile #2 (Main Lobby)',
    event: 'Access Denied',
    status: 'Expired Pass',
    buildingId: 'bldg_hq',
    timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString()
  }
];

class SecurityAccessLogRepository {
  async getAccessLogs(scope) {
    return mockAccessLogs.filter(log => log.buildingId === scope.buildingId);
  }
}

module.exports = new SecurityAccessLogRepository();
