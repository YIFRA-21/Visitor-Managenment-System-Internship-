const checkoutRepository = require('../repositories/checkout.repository');
const checkinRepository = require('../repositories/checkin.repository');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const notificationService = require('../../notifications/services/notification.service');
const { AppError } = require('../../../middleware/errorHandler');
const db = require('../../../config/db');

class CheckoutService {
  async getDashboard(orgId, date) {
    return checkoutRepository.getDashboardStats(orgId, date);
  }

  async getPending(filters) {
    return checkoutRepository.getPendingCheckouts(filters);
  }

  async getOverstays() {
    return checkoutRepository.getOverstayRecords();
  }

  async getEvacuationRollCall() {
    const list = await checkoutRepository.getEvacuationRollCall();
    return {
      totalInside: list.length,
      rollCall: list,
      timestamp: new Date().toISOString(),
    };
  }

  async processExit(code, checkoutData = {}, operatorId) {
    if (!code) {
      throw new AppError('Visitor code, badge, or reference is required for check-out.', 400);
    }

    const checkin = await checkoutRepository.findActiveCheckinByCode(code);
    if (!checkin) {
      throw new AppError(`No active check-in session found for code: "${code}".`, 404);
    }

    // Get pass code if available
    let passCode = null;
    if (checkin.passId) {
      const passRows = await db.query('SELECT pass_code FROM visitor_passes WHERE id = ?', [checkin.passId]);
      passCode = passRows[0]?.pass_code;
    }
    if (!passCode) passCode = checkin.referenceCode || code;

    // Perform checkout via checkinRepository.createCheckout
    const result = await checkinRepository.createCheckout({
      checkinId: checkin.checkinId,
      visitorId: checkin.visitorId,
      appointmentId: checkin.appointmentId,
      hostId: checkin.hostId,
      receptionistId: operatorId,
      checkoutTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      checkoutMethod: checkoutData.checkoutMethod || 'MANUAL',
      totalVisitDuration: Math.max(1, Math.round((Date.now() - new Date(checkin.checkedInAt).getTime()) / 60000)),
      remarks: checkoutData.remarks || null,
    });

    const checkoutId = typeof result === 'object' && result !== null ? result.checkoutId : result;
    const totalVisitDuration = Math.max(1, Math.round((Date.now() - new Date(checkin.checkedInAt).getTime()) / 60000));

    // Notify host & event bus
    try {
      await notificationService.notifyHostCheckout(checkin.appointmentId);
    } catch (e) {}

    try {
      const EventBus = require('../../../events/EventBus');
      EventBus.emitDomainEvent('CHECKOUT_COMPLETED', {
        appointmentId: checkin.appointmentId,
        visitorId: checkin.visitorId,
        visitorName: checkin.visitorName,
        checkoutId,
      });
    } catch (e) {}

    // Audit log
    await auditRepository.log({
      userId: operatorId,
      action: 'VISITOR_CHECKOUT',
      module: 'CHECKOUT',
      entity: 'visitor_checkouts',
      recordId: checkoutId,
      newValues: { code, checkoutMethod: checkoutData.checkoutMethod || 'MANUAL' },
    });

    return {
      checkoutId,
      appointmentId: checkin.appointmentId,
      visitorId: checkin.visitorId,
      visitorName: checkin.visitorName,
      hostName: checkin.hostName,
      checkoutStatus: 'COMPLETED',
      totalVisitDuration,
    };
  }

  async processGroupExit(codes, checkoutData = {}, operatorId) {
    if (!Array.isArray(codes) || codes.length === 0) {
      throw new AppError('An array of codes is required for group check-out.', 400);
    }

    const results = [];
    for (const code of codes) {
      try {
        const res = await this.processExit(code.trim(), checkoutData, operatorId);
        results.push({ code, status: 'success', data: res });
      } catch (err) {
        results.push({ code, status: 'error', error: err.message });
      }
    }

    const succeeded = results.filter(r => r.status === 'success').length;
    return {
      message: `${succeeded}/${codes.length} visitors checked out successfully.`,
      succeededCount: succeeded,
      totalCount: codes.length,
      results,
    };
  }

  async getHistory(filters, pagination) {
    return checkoutRepository.getCheckoutHistory(filters, pagination);
  }

  async getAnalytics(dateFrom, dateTo) {
    return checkoutRepository.getAnalytics(dateFrom, dateTo);
  }
}

module.exports = new CheckoutService();
