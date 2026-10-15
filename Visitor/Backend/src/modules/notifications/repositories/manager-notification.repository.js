// src/repositories/ManagerNotificationRepository.js
// Repository for Manager Notification queries bounded strictly by manager department/branch scope

const mockNotifications = [
  {
    id: 'mnotif_1001',
    category: 'Visitor',
    eventType: 'Visitor Registered',
    title: 'New VIP Visitor Registered',
    message: 'VIP Visitor Sarah Jenkins (IT Park) registered for host David Miller.',
    priority: 'high',
    status: 'unread',
    isPinned: true,
    isArchived: false,
    departmentId: 12,
    departmentName: 'Operations & Security',
    branchId: 101,
    organizationId: 1,
    visitorId: 8841,
    appointmentId: 44102,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    actionsAvailable: ['view_visitor', 'view_appointment']
  },
  {
    id: 'mnotif_1002',
    category: 'Approval Workflow',
    eventType: 'Approval Required',
    title: 'After-Hours Access Request Pending Approval',
    message: 'Contractor Team (5 members) requested after-hours facility access for Server Room maintenance.',
    priority: 'critical',
    status: 'unread',
    isPinned: true,
    isArchived: false,
    departmentId: 12,
    departmentName: 'Operations & Security',
    branchId: 101,
    organizationId: 1,
    approvalId: 'appr_9021',
    visitorId: 8842,
    appointmentId: 44105,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    actionsAvailable: ['approve', 'reject', 'return_revision']
  },
  {
    id: 'mnotif_1003',
    category: 'Visitor',
    eventType: 'Visitor Pass Expiring',
    title: 'Temporary Badge V-908 Expiring Soon',
    message: 'Visitor Michael Brown has exceeded expected stay by 30 minutes in Operations Zone B.',
    priority: 'high',
    status: 'unread',
    isPinned: false,
    isArchived: false,
    departmentId: 12,
    departmentName: 'Operations & Security',
    branchId: 101,
    organizationId: 1,
    visitorId: 8830,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    actionsAvailable: ['extend_pass', 'alert_security']
  },
  {
    id: 'mnotif_1004',
    category: 'Employee',
    eventType: 'Host Unavailable',
    title: 'Host Out of Office Notice',
    message: 'Employee Robert Chen is marked on sick leave. 2 upcoming visitor appointments need reassignment.',
    priority: 'medium',
    status: 'read',
    isPinned: false,
    isArchived: false,
    departmentId: 12,
    departmentName: 'Operations & Security',
    branchId: 101,
    organizationId: 1,
    employeeId: 402,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    actionsAvailable: ['reassign_host']
  },
  {
    id: 'mnotif_1005',
    category: 'Emergency',
    eventType: 'Security Incident',
    title: 'Zone C Badge Scanner Tamper Alert',
    message: 'Physical security sensor triggered at East Gate Badge Scanner #4.',
    priority: 'critical',
    status: 'unread',
    isPinned: true,
    isArchived: false,
    departmentId: 12,
    departmentName: 'Operations & Security',
    branchId: 101,
    organizationId: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    actionsAvailable: ['acknowledge_emergency', 'broadcast_alert']
  },
  {
    id: 'mnotif_1006',
    category: 'Department',
    eventType: 'Policy Update',
    title: 'Updated Visitor NDA & Safety Protocol v4.2',
    message: 'All department managers are required to review the updated physical security policy.',
    priority: 'normal',
    status: 'read',
    isPinned: false,
    isArchived: false,
    departmentId: 12,
    departmentName: 'Operations & Security',
    branchId: 101,
    organizationId: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    actionsAvailable: ['view_document']
  }
];

class ManagerNotificationRepository {
  async getNotifications(scope, options = {}) {
    const { category, priority, status, search, limit = 50, offset = 0 } = options;
    
    let filtered = mockNotifications.filter(n => 
      n.departmentId === scope.departmentId || n.organizationId === scope.organizationId
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
    const notif = mockNotifications.find(n => n.id === id && n.departmentId === scope.departmentId);
    if (notif) notif.status = 'read';
    return notif;
  }

  async markAllAsRead(scope) {
    mockNotifications.forEach(n => {
      if (n.departmentId === scope.departmentId) n.status = 'read';
    });
    return true;
  }

  async togglePin(id, scope) {
    const notif = mockNotifications.find(n => n.id === id && n.departmentId === scope.departmentId);
    if (notif) notif.isPinned = !notif.isPinned;
    return notif;
  }

  async archiveNotification(id, scope) {
    const notif = mockNotifications.find(n => n.id === id && n.departmentId === scope.departmentId);
    if (notif) notif.isArchived = true;
    return notif;
  }
}

module.exports = new ManagerNotificationRepository();
