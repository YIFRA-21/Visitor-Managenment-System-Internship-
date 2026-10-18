const repository = require('../repositories/watchlist.repository');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const eventBus = require('../../../events/EventBus');

class BlacklistWatchlistService {
  async getDirectory(filters) {
    return repository.getDirectory(filters);
  }

  async getRecordDetails(id) {
    return repository.getRecordDetails(id);
  }

  async createRecord(data, userId) {
    if (!data.reason || !data.reason.trim()) {
      throw new Error('Reason is required for adding a record to Blacklist or Watchlist');
    }
    const result = await repository.createRecord(data, userId);

    // Audit log
    await auditRepository.log({
      userId,
      action: data.listType === 'BLACKLIST' ? 'SECURITY_BLACKLIST_ADD' : 'SECURITY_WATCHLIST_ADD',
      module: 'SECURITY',
      entity: 'visitor_watchlist',
      recordId: result.id,
      details: { reason: data.reason, riskLevel: data.riskLevel },
    }).catch(() => null);

    // Emit domain event
    eventBus.emit('security.watchlist_updated', {
      type: data.listType,
      recordId: result.id,
      visitorId: data.visitorId,
      addedBy: userId,
    });

    return result;
  }

  async updateRecord(id, data, userId) {
    const updated = await repository.updateRecord(id, data, userId);

    await auditRepository.log({
      userId,
      action: 'SECURITY_WATCHLIST_UPDATE',
      module: 'SECURITY',
      entity: 'visitor_watchlist',
      recordId: id,
      details: data,
    }).catch(() => null);

    return updated;
  }

  async verifyVisitor(queryData) {
    return repository.verifyVisitor(queryData);
  }

  async updateStatus(id, status, userId) {
    const res = await repository.updateStatus(id, status, userId);

    await auditRepository.log({
      userId,
      action: 'SECURITY_WATCHLIST_STATUS_UPDATE',
      module: 'SECURITY',
      entity: 'visitor_watchlist',
      recordId: id,
      details: { status },
    }).catch(() => null);

    return res;
  }

  async reviewClearance(id, decision, notes, userId) {
    const res = await repository.reviewClearance(id, decision, notes, userId);

    await auditRepository.log({
      userId,
      action: decision === 'APPROVE_CLEARANCE' ? 'SECURITY_CLEARANCE_APPROVE' : 'SECURITY_CLEARANCE_REJECT',
      module: 'SECURITY',
      entity: 'visitor_watchlist',
      recordId: id,
      details: { decision, notes },
    }).catch(() => null);

    return res;
  }

  async archiveRecord(id, userId) {
    const res = await repository.archiveRecord(id, userId);

    await auditRepository.log({
      userId,
      action: 'SECURITY_WATCHLIST_ARCHIVE',
      module: 'SECURITY',
      entity: 'visitor_watchlist',
      recordId: id,
    }).catch(() => null);

    return res;
  }

  async deleteRecord(id, userId) {
    const res = await repository.deleteRecord(id, userId);

    await auditRepository.log({
      userId,
      action: 'SECURITY_WATCHLIST_DELETE',
      module: 'SECURITY',
      entity: 'visitor_watchlist',
      recordId: id,
    }).catch(() => null);

    return res;
  }

  async restoreRecord(id, userId) {
    const res = await repository.restoreRecord(id, userId);

    await auditRepository.log({
      userId,
      action: 'SECURITY_WATCHLIST_RESTORE',
      module: 'SECURITY',
      entity: 'visitor_watchlist',
      recordId: id,
    }).catch(() => null);

    return res;
  }
}

module.exports = new BlacklistWatchlistService();
