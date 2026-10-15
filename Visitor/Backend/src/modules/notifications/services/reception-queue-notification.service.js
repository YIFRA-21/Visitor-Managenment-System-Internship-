// src/services/reception/ReceptionQueueNotificationService.js
// Service for front-desk waiting queue notifications

const ReceptionQueueRepository = require('../../reception/repositories/reception-queue.repository');
const { auditLog } = require('../../../utils/audit');

class ReceptionQueueNotificationService {
  async getQueueStatus(scope) {
    return await ReceptionQueueRepository.getQueueStatus(scope);
  }

  async reassignQueue(ticketNo, targetDeskId, scope) {
    await auditLog({
      userId: scope.receptionUserId,
      entity: 'reception_queue',
      action: 'reassign_queue',
      details: { ticketNo, targetDeskId }
    });

    return {
      ticketNo,
      previousDeskId: scope.deskId,
      assignedDeskId: targetDeskId,
      status: 'reassigned',
      reassignedAt: new Date().toISOString()
    };
  }
}

module.exports = new ReceptionQueueNotificationService();
