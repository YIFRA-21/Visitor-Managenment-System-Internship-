// src/repositories/SecurityNotificationRepository.js
// Repository for Security Notifications bounded by building/zone scope

const mockSecurityNotifications = [
  {
    id: 'secnotif_3001',
    category: 'Watchlist Match',
    eventType: 'Blacklist Alert',
    title: 'Critical Alert: Blacklist Match at Turnstile #3',
    message: 'Visitor Arthur Pendelton (ID-99021-X) matched Restricted Watchlist #WL-804 at Main Lobby Turnstile.',
    severity: 'critical',
    status: 'unacknowledged',
    isPinned: true,
    isArchived: false,
    buildingId: 'bldg_hq',
    zoneId: 'zone_perimeter_alpha',
    visitorId: 9901,
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    actionsAvailable: ['dispatch_patrol', 'lock_turnstile', 'open_investigation']
  },
  {
    id: 'secnotif_3002',
    category: 'Restricted Area',
    eventType: 'Door Forced Open',
    title: 'Access Control Violation: Door Forced Open',
    message: 'Door Sensor #D-402 (Server Room Annex B) triggered forced open alarm.',
    severity: 'high',
    status: 'unacknowledged',
    isPinned: true,
    isArchived: false,
    buildingId: 'bldg_hq',
    zoneId: 'zone_server_annex',
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    actionsAvailable: ['cctv_playback', 'dispatch_guard']
  },
  {
    id: 'secnotif_3003',
    category: 'Visitor Event',
    eventType: 'Visitor Overstayed',
    title: 'Visitor Stay Overdue Warning',
    message: 'Contractor Michael Brown (Badge V-908) exceeded approved duration by 45 minutes in Executive Wing.',
    severity: 'medium',
    status: 'acknowledged',
    isPinned: false,
    isArchived: false,
    buildingId: 'bldg_hq',
    zoneId: 'zone_exec_suite',
    visitorId: 9908,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    actionsAvailable: ['contact_host', 'locate_visitor']
  },
  {
    id: 'secnotif_3004',
    category: 'Equipment & Device',
    eventType: 'CCTV Offline',
    title: 'Hardware Alert: Camera CCTV-Lobby-04 Offline',
    message: 'IP Camera CCTV-Lobby-04 failed heartbeat ping for >5 minutes.',
    severity: 'medium',
    status: 'acknowledged',
    isPinned: false,
    isArchived: false,
    buildingId: 'bldg_hq',
    zoneId: 'zone_perimeter_alpha',
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    actionsAvailable: ['reboot_camera', 'notify_facilities']
  }
];

class SecurityNotificationRepository {
  async getNotifications(scope, options = {}) {
    const { category, severity, status, search, limit = 50, offset = 0 } = options;

    let filtered = mockSecurityNotifications.filter(n =>
      n.buildingId === scope.buildingId || n.zoneId === scope.zoneId
    );

    if (category && category !== 'All') {
      filtered = filtered.filter(n => n.category.toLowerCase() === category.toLowerCase());
    }

    if (severity && severity !== 'All') {
      filtered = filtered.filter(n => n.severity.toLowerCase() === severity.toLowerCase());
    }

    if (status && status !== 'All') {
      filtered = filtered.filter(n => n.status.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(n => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q));
    }

    return {
      total: filtered.length,
      unacknowledgedCount: filtered.filter(n => n.status === 'unacknowledged').length,
      data: filtered.slice(offset, offset + limit)
    };
  }

  async acknowledgeNotification(id, scope) {
    const notif = mockSecurityNotifications.find(n => n.id === id);
    if (notif) {
      notif.status = 'acknowledged';
      notif.acknowledgedBy = scope.securityUserId;
      notif.acknowledgedAt = new Date().toISOString();
    }
    return notif;
  }

  async escalateNotification(id, scope, reason) {
    const notif = mockSecurityNotifications.find(n => n.id === id);
    if (notif) {
      notif.severity = 'critical';
      notif.status = 'escalated';
      notif.escalationReason = reason;
      notif.escalatedAt = new Date().toISOString();
    }
    return notif;
  }
}

module.exports = new SecurityNotificationRepository();
