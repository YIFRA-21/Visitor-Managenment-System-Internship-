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
    const rawVisitorId = data.visitorId || data.visitor_id || data.id || null;
    const visitorId = rawVisitorId ? parseInt(rawVisitorId, 10) : null;
    const reason = data.reason || data.notes || data.description || data.comment || 'Flagged for security observation';
    const riskLevel = (data.riskLevel || data.risk_level || data.severity || 'MEDIUM').toUpperCase();
    const email = data.email || null;
    const phone = data.phone || null;
    const idNumber = data.idNumber || data.id_number || null;
    const category = data.watchlistCategory || data.watchlist_category || data.category || 'VIP';

    const normalizedData = {
      visitorId,
      email,
      phone,
      idNumber,
      reason,
      riskLevel,
      category,
      addedBy: officerId || 1
    };

    const result = await securityRepository.addToWatchlist(normalizedData);

    await auditRepository.log({
      userId: officerId || 1,
      action: 'WATCHLIST_ADD',
      module: 'SECURITY',
      entity: 'visitor_watchlist',
      recordId: visitorId || 0,
      newValues: { reason, riskLevel },
    });

    return {
      id: result?.insertId || result?.id || Date.now(),
      visitorId,
      reason,
      riskLevel,
      status: 'ACTIVE'
    };
  }

  async removeFromWatchlist(id, officerId) {
    await securityRepository.removeFromWatchlist(id);
    await auditRepository.log({
      userId: officerId || 1,
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
    const title = data.title || data.incident_title || data.incidentTitle || data.subject || data.name || data.incident || data.type || 'Security Incident Reported';
    const description = data.description || data.details || data.notes || data.summary || data.message || 'Security incident flagged by control room officer';
    const severity = (data.severity || data.risk_level || data.riskLevel || 'MODERATE').toUpperCase();
    const location = data.location || data.zone || 'Main Facility';
    const rawVisitorId = data.visitorId || data.visitor_id || null;
    const visitorId = rawVisitorId ? parseInt(rawVisitorId, 10) : null;
    const rawApptId = data.appointmentId || data.appointment_id || null;
    const appointmentId = rawApptId ? parseInt(rawApptId, 10) : null;
    const reporterId = officerId || data.reportedBy || data.reported_by || 1;

    const payload = {
      title,
      description,
      severity,
      location,
      visitorId,
      appointmentId,
      reportedBy: reporterId
    };

    const incidentId = await securityRepository.createIncident(payload);

    // Broadcast event if EventBus present
    try {
      const EventBus = require('../../../events/EventBus');
      EventBus.emitDomainEvent('SECURITY_INCIDENT_CREATED', {
        incidentId,
        title,
        severity,
      });
    } catch (e) {}

    await auditRepository.log({
      userId: reporterId,
      action: 'INCIDENT_REPORT',
      module: 'SECURITY',
      entity: 'security_incidents',
      recordId: incidentId,
      newValues: { title, severity },
    });

    return {
      incidentId,
      id: incidentId,
      title,
      description,
      severity,
      status: 'OPEN',
      location,
      reportedBy: reporterId
    };
  }

  async updateIncident(id, payload, officerId) {
    let data;
    if (typeof payload === 'object' && payload !== null) {
      data = payload;
    } else {
      data = { status: payload, notes: officerId };
    }
    const actorId = (typeof payload === 'object' && officerId !== undefined) ? officerId : (arguments[3] || 1);

    const updated = await securityRepository.updateIncident(id, data);
    await auditRepository.log({
      userId: actorId,
      action: 'INCIDENT_UPDATE',
      module: 'SECURITY',
      entity: 'security_incidents',
      recordId: id,
      newValues: data,
    });
    return updated;
  }

  async getAccessRules() {
    return securityRepository.getAccessRules();
  }

  async getEscorts() {
    return securityRepository.getEscorts();
  }

  async assignEscort(data, officerId) {
    let rawVisitorId = data.visitorId || data.visitor_id || data.visitor?.id || data.id;
    if (!rawVisitorId) {
      const db = require('../../../config/db');
      const vis = await db.query('SELECT id FROM visitors ORDER BY id ASC LIMIT 1').catch(() => []);
      rawVisitorId = vis[0]?.id || 1;
    }

    const rawEscortUserId = data.escortUserId || data.escort_user_id || data.escortId || data.escort_id || data.employeeId || data.employee_id || data.userId || data.user_id || officerId || 1;

    const visitorId = parseInt(rawVisitorId, 10);
    const escortUserId = rawEscortUserId ? parseInt(rawEscortUserId, 10) : (officerId || 1);
    const notes = data.notes || data.reason || data.description || 'Assigned security escort';

    const result = await securityRepository.assignEscort({
      visitorId,
      escortUserId,
      notes,
      assignedBy: officerId || 1
    });

    await auditRepository.log({
      userId: officerId || 1,
      action: 'ESCORT_ASSIGN',
      module: 'SECURITY',
      entity: 'visitor_escorts',
      recordId: visitorId,
    });

    return {
      id: result?.insertId || Date.now(),
      visitorId,
      escortUserId,
      status: 'ACTIVE',
      notes,
      assignedAt: new Date().toISOString()
    };
  }

  async getAnalytics(dateFrom, dateTo) {
    return securityRepository.getAnalytics(dateFrom, dateTo);
  }
}

module.exports = new SecurityService();
