// src/services/manager/ManagerEscalationService.js
// Manager Escalation Engine detecting SLA breaches

const { auditLog } = require('../../../utils/audit');

const mockEscalations = [
  {
    id: 'esc_701',
    title: 'After-Hours Access Request Approval SLA Breach',
    entityType: 'Approval',
    entityId: 'appr_9021',
    reason: 'Approval pending for over 120 minutes exceeding 60-min SLA threshold.',
    severity: 'High',
    status: 'open',
    departmentId: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 125).toISOString()
  },
  {
    id: 'esc_702',
    title: 'Visitor Waiting Time Threshold Exceeded (>30 mins)',
    entityType: 'Visitor',
    entityId: 'v_8841',
    reason: 'VIP Visitor Sarah Jenkins waiting at reception lobby for host David Miller.',
    severity: 'Critical',
    status: 'open',
    departmentId: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
  }
];

class ManagerEscalationService {
  async getEscalations(scope) {
    return mockEscalations.filter(e => e.departmentId === scope.departmentId);
  }

  async resolveEscalation(id, resolutionNotes, scope) {
    const esc = mockEscalations.find(e => e.id === id && e.departmentId === scope.departmentId);
    if (!esc) throw new Error('Escalation record not found');

    esc.status = 'resolved';
    esc.resolvedAt = new Date().toISOString();
    esc.resolutionNotes = resolutionNotes;

    await auditLog({
      userId: scope.managerId,
      entity: 'manager_escalation',
      action: 'resolve_escalation',
      details: { id, resolutionNotes }
    });

    return esc;
  }
}

module.exports = new ManagerEscalationService();
