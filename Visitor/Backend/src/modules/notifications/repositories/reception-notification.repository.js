// src/repositories/ReceptionNotificationRepository.js
// Repository for Reception Notifications bounded by desk/building scope

const mockReceptionNotifications = [
  {
    id: 'rnotif_2001',
    category: 'Visitor Event',
    eventType: 'Visitor Arrived',
    title: 'VIP Visitor Arrived at Lobby',
    message: 'Ambassador Elena Rostova (Diplomatic Mission) has arrived at Main Plaza Reception.',
    priority: 'high',
    status: 'unread',
    isPinned: true,
    isArchived: false,
    deskId: 'desk_main_lobby_01',
    buildingId: 'bldg_hq',
    visitorId: 9901,
    appointmentId: 5501,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    actionsAvailable: ['notify_host', 'print_badge', 'start_checkin']
  },
  {
    id: 'rnotif_2002',
    category: 'Check-In Event',
    eventType: 'Badge Printed',
    title: 'Temporary Badge V-1044 Ready for Collection',
    message: 'Badge printed automatically for contractor John Vance (HVAC Services).',
    priority: 'normal',
    status: 'unread',
    isPinned: false,
    isArchived: false,
    deskId: 'desk_main_lobby_01',
    buildingId: 'bldg_hq',
    visitorId: 9902,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    actionsAvailable: ['issue_badge']
  },
  {
    id: 'rnotif_2003',
    category: 'Waiting Queue Event',
    eventType: 'Long Waiting Time',
    title: 'Queue Threshold Exceeded (>15 mins)',
    message: '3 visitors waiting over 15 minutes at Main Lobby Desk #1.',
    priority: 'high',
    status: 'unread',
    isPinned: true,
    isArchived: false,
    deskId: 'desk_main_lobby_01',
    buildingId: 'bldg_hq',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    actionsAvailable: ['reassign_queue', 'call_supervisor']
  },
  {
    id: 'rnotif_2004',
    category: 'Host Employee Event',
    eventType: 'Host Accepted',
    title: 'Host David Miller Accepted Visitor',
    message: 'Host is coming down to reception lobby to escort Sarah Jenkins.',
    priority: 'normal',
    status: 'read',
    isPinned: false,
    isArchived: false,
    deskId: 'desk_main_lobby_01',
    buildingId: 'bldg_hq',
    employeeId: 401,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    actionsAvailable: ['mark_escorted']
  },
  {
    id: 'rnotif_2005',
    category: 'Security Event',
    eventType: 'Blacklisted Visitor Match',
    title: 'Security Alert: Watchlist Match Found',
    message: 'Walk-in visitor name matched watchlist entry #WL-804. Security Officer notified.',
    priority: 'critical',
    status: 'unread',
    isPinned: true,
    isArchived: false,
    deskId: 'desk_main_lobby_01',
    buildingId: 'bldg_hq',
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    actionsAvailable: ['alert_security', 'hold_checkin']
  }
];

class ReceptionNotificationRepository {
  async getNotifications(scope, options = {}) {
    const { category, priority, status, search, limit = 50, offset = 0 } = options;

    let filtered = mockReceptionNotifications.filter(n =>
      n.deskId === scope.deskId || n.buildingId === scope.buildingId
    );

    if (category && category !== 'All') {
      filtered = filtered.filter(n => n.category.toLowerCase() === category.toLowerCase());
    }

    if (priority && priority !== 'All') {
      filtered = filtered.filter(n => n.priority.toLowerCase() === priority.toLowerCase());
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

  async markAsRead(id, scope) {
    const notif = mockReceptionNotifications.find(n => n.id === id && n.deskId === scope.deskId);
    if (notif) notif.status = 'read';
    return notif;
  }

  async markAllAsRead(scope) {
    mockReceptionNotifications.forEach(n => {
      if (n.deskId === scope.deskId) n.status = 'read';
    });
    return true;
  }

  async togglePin(id, scope) {
    const notif = mockReceptionNotifications.find(n => n.id === id && n.deskId === scope.deskId);
    if (notif) notif.isPinned = !notif.isPinned;
    return notif;
  }
}

module.exports = new ReceptionNotificationRepository();
