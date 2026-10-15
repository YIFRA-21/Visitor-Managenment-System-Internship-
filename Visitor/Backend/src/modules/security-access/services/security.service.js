const securityRepository = require('../repositories/security.repository');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const notificationService = require('../../notifications/services/notification.service');
const { AppError } = require('../../../middleware/errorHandler');

class SecurityService {
  async getDashboard(orgId) {
    return securityRepository.getDashboardStats(orgId);
  }

  async getWatchlist() {
    return securityRepository.getWatchlist();
  }

  async addToWatchlist(data, officerId) {
    if (!data.reason) {
      throw new AppError('Reason is required for adding to watchlist', 400);
    }
    const result = await securityRepository.addToWatchlist({ ...data, addedBy: officerId });

    await auditRepository.log({
      userId: officerId,
      action: 'WATCHLIST_ADD',
      module: 'SECURITY',
      entity: 'visitor_watchlist',
      recordId: data.visitorId || 0,
      newValues: { reason: data.reason, riskLevel: data.riskLevel || 'MEDIUM' },
    });

    return result;
  }

  async removeFromWatchlist(id, officerId) {
    await securityRepository.removeFromWatchlist(id);
    await auditRepository.log({
      userId: officerId,
      action: 'WATCHLIST_REMOVE',
      module: 'SECURITY',
      entity: 'visitor_watchlist',
      recordId: id,
    });
  }

  async getIncidents(status) {
    return securityRepository.getIncidents(status);
  }

  async reportIncident(data, officerId) {
    if (!data.title) {
      throw new AppError('Incident title is required', 400);
    }
    const incidentId = await securityRepository.createIncident({ ...data, reportedBy: officerId });

    // Broadcast event if EventBus present
    try {
      const EventBus = require('../../../events/EventBus');
      EventBus.emitDomainEvent('SECURITY_INCIDENT_CREATED', {
        incidentId,
        title: data.title,
        severity: data.severity || 'MEDIUM',
      });
    } catch (e) {}

    await auditRepository.log({
      userId: officerId,
      action: 'INCIDENT_REPORT',
      module: 'SECURITY',
      entity: 'security_incidents',
      recordId: incidentId,
      newValues: { title: data.title, severity: data.severity },
    });

    return { incidentId, ...data };
  }

  async updateIncident(id, status, notes, officerId) {
    await securityRepository.updateIncident(id, status, notes);
    await auditRepository.log({
      userId: officerId,
      action: 'INCIDENT_UPDATE',
      module: 'SECURITY',
      entity: 'security_incidents',
      recordId: id,
      newValues: { status, notes },
    });
  }

  async getAccessRules() {
    return securityRepository.getAccessRules();
  }

  async getEscorts() {
    return securityRepository.getEscorts();
  }

  async assignEscort(data, officerId) {
    if (!data.visitorId || !data.escortUserId) {
      throw new AppError('visitorId and escortUserId are required', 400);
    }
    await securityRepository.assignEscort({ ...data, assignedBy: officerId });
    await auditRepository.log({
      userId: officerId,
      action: 'ESCORT_ASSIGN',
      module: 'SECURITY',
      entity: 'visitor_escorts',
      recordId: data.visitorId,
    });
  }

  async getAnalytics(dateFrom, dateTo) {
    return securityRepository.getAnalytics(dateFrom, dateTo);
  }
}

module.exports = new SecurityService();
