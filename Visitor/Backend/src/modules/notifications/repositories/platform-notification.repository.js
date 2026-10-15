// src/repositories/PlatformNotificationRepository.js
// Repository for Enterprise Platform Notifications, Rules, Templates, Queues, and Audit Logs

const mockPlatformNotifications = [
  {
    id: 'platnotif_1001',
    eventName: 'blacklist.detected',
    category: 'Security',
    severity: 'critical',
    title: 'Critical Security: Blacklist Match Detected',
    message: 'Arthur Pendelton (ID-99021-X) matched Restricted Watchlist #WL-804 at Main Lobby Turnstile #3.',
    status: 'unread',
    isPinned: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    id: 'platnotif_1002',
    eventName: 'visitor.arrived',
    category: 'Reception',
    severity: 'high',
    title: 'Visitor Arrival Alert',
    message: 'Visitor Elena Rostova has arrived at Front Desk #1 to see host David Miller.',
    status: 'unread',
    isPinned: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    id: 'platnotif_1003',
    eventName: 'backup.completed',
    category: 'Administration',
    severity: 'info',
    title: 'System Maintenance Notice',
    message: 'Automated nightly database backup completed cleanly (2.4 GB).',
    status: 'read',
    isPinned: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  }
];

class PlatformNotificationRepository {
  async getNotifications(scope, options = {}) {
    const { category, severity, status, search, limit = 50, offset = 0 } = options;

    let filtered = [...mockPlatformNotifications];

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
      unreadCount: filtered.filter(n => n.status === 'unread').length,
      data: filtered.slice(offset, offset + limit)
    };
  }

  async markAsRead(id) {
    const notif = mockPlatformNotifications.find(n => n.id === id);
    if (notif) {
      notif.status = 'read';
    }
    return notif;
  }
}

module.exports = new PlatformNotificationRepository();
