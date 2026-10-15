// src/services/manager/ManagerBroadcastService.js
// Manager Department Broadcast Service bounded strictly by manager department/groups scope

const { auditLog } = require('../../../utils/audit');

let broadcasts = [
  {
    id: 'mbc_501',
    title: 'Department All-Hands Meeting & Fire Drill Notice',
    message: 'Mandatory fire evacuation drill scheduled for tomorrow at 11:00 AM.',
    targetAudience: 'Department Employees',
    channels: ['in_app', 'email'],
    status: 'sent',
    recipientCount: 42,
    departmentId: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 1440).toISOString()
  }
];

class ManagerBroadcastService {
  async getBroadcasts(scope) {
    return broadcasts.filter(b => b.departmentId === scope.departmentId);
  }

  async sendBroadcast(payload, scope) {
    const newBroadcast = {
      id: `mbc_${Date.now()}`,
      title: payload.title,
      message: payload.message,
      targetAudience: payload.targetAudience || 'Department Employees',
      channels: payload.channels || ['in_app', 'email'],
      status: payload.scheduledAt ? 'scheduled' : 'sent',
      scheduledAt: payload.scheduledAt || null,
      recipientCount: 45,
      departmentId: scope.departmentId,
      createdBy: scope.managerId,
      createdAt: new Date().toISOString()
    };

    broadcasts.unshift(newBroadcast);

    await auditLog({
      userId: scope.managerId,
      entity: 'manager_broadcast',
      action: payload.scheduledAt ? 'schedule_broadcast' : 'send_broadcast',
      details: { id: newBroadcast.id, title: newBroadcast.title, recipientCount: 45 }
    });

    return newBroadcast;
  }
}

module.exports = new ManagerBroadcastService();
