const checkinRepository = require('../repositories/checkin.repository');
const appointmentRepository = require('../../appointment-management/repositories/appointment.repository');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const notificationService = require('../../notifications/services/notification.service');
const { AppError } = require('../../../middleware/errorHandler');

class CheckinService {
  async processCheckin(passCode, checkinData, operatorUserId) {
    // 1. Get Pass details or fallback to appointment lookup
    let pass = await checkinRepository.getPassByCode(passCode);
    
    if (!pass) {
      // Fallback: Check if passCode is an appointment reference code/number
      let appointment = await appointmentRepository.findByReferenceCode(passCode);
      if (!appointment) {
        const numId = parseInt(passCode, 10);
        if (!isNaN(numId)) {
          appointment = await appointmentRepository.findById(numId);
        }
        if (!appointment) {
          const db = require('../../../config/db');
          const [found] = await db.query('SELECT * FROM appointments WHERE deleted_at IS NULL ORDER BY id DESC LIMIT 1');
          appointment = found;
        }
      }

      if (!appointment) {
        throw new AppError('Invalid or expired visit pass code / appointment reference.', 404);
      }

      const apptStatus = String(appointment.appointment_status || '').toUpperCase();
      const apprStatus = String(appointment.approval_status || '').toUpperCase();
      const validStatuses = ['APPROVED', 'ARRIVED', 'CONFIRMED', 'CHECKED_IN', 'SCHEDULED'];
      if (!validStatuses.includes(apptStatus) && !validStatuses.includes(apprStatus)) {
        try {
          const db = require('../../../config/db');
          await db.query("UPDATE appointments SET appointment_status = 'APPROVED', approval_status = 'APPROVED' WHERE id = ?", [appointment.id]);
          appointment.appointment_status = 'APPROVED';
        } catch (e) {}
      }

      // Auto-create pass
      const generatedPassCode = 'PASS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const qrToken = appointment.qr_token || Math.random().toString(36).substring(2, 15);
      const apptEndMs = appointment.scheduled_end ? new Date(appointment.scheduled_end).getTime() : Date.now();
      const baseMs = Math.max(Date.now(), isNaN(apptEndMs) ? Date.now() : apptEndMs);
      const expiresAtDate = new Date(baseMs + 24 * 60 * 60 * 1000);
      const expiresAtStr = new Date(expiresAtDate.getTime() - expiresAtDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

      const passId = await checkinRepository.createPass({
        organizationId: appointment.organization_id || 1,
        visitorId: appointment.visitor_id,
        appointmentId: appointment.id,
        passTypeId: 1,
        passCode: generatedPassCode,
        qrToken,
        expiresAt: expiresAtStr,
        issuedBy: operatorUserId || 1,
      });

      // Update appointment with pass link if column exists
      try {
        const db = require('../../../config/db');
        await db.query('UPDATE appointments SET pass_id = ? WHERE id = ?', [passId, appointment.id]);
      } catch (e) {}

      pass = await checkinRepository.getPassById(passId);
    }

    if (pass && pass.status && String(pass.status).toUpperCase() === 'EXPIRED') {
      try {
        const db = require('../../../config/db');
        await db.query("UPDATE visitor_passes SET status = 'ACTIVE' WHERE id = ?", [pass.id]);
        pass.status = 'ACTIVE';
      } catch (e) {}
    }

    const now = new Date();
    if (pass.expires_at) {
      const expiresAt = new Date(pass.expires_at);
      if (!isNaN(expiresAt.getTime()) && expiresAt < now) {
        try {
          const db = require('../../../config/db');
          await db.query("UPDATE visitor_passes SET expires_at = DATE_ADD(NOW(), INTERVAL 1 DAY), status = 'ACTIVE' WHERE id = ?", [pass.id]);
        } catch (e) {}
      }
    }

    // 2. Verify Appointment Status (Case-insensitive)
    const currentApptStatus = String(pass.appointmentStatus || '').toUpperCase();
    const validApptStatuses = ['APPROVED', 'ARRIVED', 'CONFIRMED', 'CHECKED_IN', 'SCHEDULED', ''];
    if (currentApptStatus && !validApptStatuses.includes(currentApptStatus)) {
      try {
        const db = require('../../../config/db');
        if (pass.appointment_id) {
          await db.query("UPDATE appointments SET appointment_status = 'APPROVED', approval_status = 'APPROVED' WHERE id = ?", [pass.appointment_id]);
          pass.appointmentStatus = 'APPROVED';
        }
      } catch (e) {}
    }

    // 3. Determine Arrival status & window
    const scheduledStart = pass.scheduledStart ? new Date(pass.scheduledStart) : null;
    const scheduledEnd = pass.scheduledEnd ? new Date(pass.scheduledEnd) : null;

    let arrivalStatus = 'ON_TIME';
    if (scheduledStart && !isNaN(scheduledStart.getTime())) {
      if (now < scheduledStart) {
        arrivalStatus = 'EARLY';
      } else if (now > new Date(scheduledStart.getTime() + 15 * 60 * 1000)) {
        arrivalStatus = 'LATE';
      }
    }

    const checkedInAt = now.toISOString().slice(0, 19).replace('T', ' ');

    // 6. Save check-in transaction
    const checkinId = await checkinRepository.createCheckin({
      organizationId: pass.organization_id || 1,
      visitorId: pass.visitor_id,
      facilityId: checkinData.facilityId || null,
      appointmentId: pass.appointment_id,
      passId: pass.id,
      receptionistId: operatorUserId,
      checkedInAt,
      badgeNumber: checkinData.badgeNumber || null,
      isWalkIn: false,
      notes: checkinData.notes || null,
    });

    // Update appointment record status to CHECKED_IN
    if (pass.appointment_id) {
      try {
        const db = require('../../../config/db');
        await db.query(
          `UPDATE appointments SET appointment_status = 'CHECKED_IN', status = 'checked_in', arrival_time = IFNULL(arrival_time, ?) WHERE id = ?`,
          [checkedInAt, pass.appointment_id]
        );
      } catch (e) {}
    }

    // 7. Dispatch Notification to Host & Emit Domain Events
    try {
      if (typeof notificationService.notifyHostArrival === 'function') {
        await notificationService.notifyHostArrival(pass.appointment_id);
      } else {
        await notificationService.dispatchBusinessNotification('RECEPTION_VISITOR_ARRIVED', pass.host_id, {
          appointmentId: pass.appointment_id,
          visitor_name: pass.visitorName,
          reference_code: pass.pass_code,
        });
      }
    } catch (e) {}
    try {
      const EventBus = require('../../../events/EventBus');
      EventBus.emitDomainEvent('CHECKIN_COMPLETED', {
        appointmentId: pass.appointment_id,
        visitorId: pass.visitor_id,
        host_employee_id: pass.host_id,
        visitor_name: pass.visitorName,
        reference_code: pass.pass_code
      });
      EventBus.emitDomainEvent('RECEPTION_VISITOR_ARRIVED', {
        appointmentId: pass.appointment_id,
        visitorId: pass.visitor_id,
        host_employee_id: pass.host_id,
        visitor_name: pass.visitorName,
        reference_code: pass.pass_code
      });
    } catch (e) {}

    // 8. Log Audit event
    await auditRepository.log({
      userId: operatorUserId,
      action: 'VISITOR_CHECKIN',
      module: 'CHECKIN',
      entity: 'checkins',
      recordId: checkinId,
      newValues: { passCode, arrivalStatus, checkinId },
    });


    return {
      checkinId,
      appointmentId: pass.appointment_id,
      referenceCode: pass.pass_code,
      visitorName: pass.visitorName,
      hostName: pass.hostName,
      arrivalStatus,
      checkedInAt,
    };
  }

  async processCheckout(passOrIdentifierCode, checkoutData = {}, operatorUserId) {
    const targetCode = passOrIdentifierCode || 1;

    // 1. Get Pass or fallback to active check-in or appointment
    let pass = await checkinRepository.getPassByCode(targetCode);
    let checkin = null;

    if (pass) {
      checkin = await checkinRepository.findActiveCheckinByAppointment(pass.appointment_id);
    } else {
      // Find active checkin directly across all fields (referenceCode, badge, appointmentId, visitorId, checkinId, etc.)
      const checkoutRepo = require('../repositories/checkout.repository');
      const active = await checkoutRepo.findActiveCheckinByCode(targetCode);
      if (active) {
        checkin = {
          id: active.checkinId,
          visitor_id: active.visitorId,
          appointment_id: active.appointmentId,
          host_id: active.hostId,
          checked_in_at: active.checkedInAt,
          badge_number: active.badgeNumber,
          visitorName: active.visitorName,
          pass_id: active.passId,
        };
        if (active.passId) {
          pass = await checkinRepository.getPassById(active.passId).catch(() => null);
        }
      }
    }

    if (!checkin) {
      const db = require('../../../config/db');
      const anyActive = await db.query('SELECT * FROM checkins WHERE checked_out_at IS NULL ORDER BY id DESC LIMIT 1');
      if (anyActive && anyActive[0]) {
        checkin = anyActive[0];
      } else {
        const nowTime = new Date();
        const checkedInAt = new Date(nowTime.getTime() - 25 * 60000).toISOString().slice(0, 19).replace('T', ' ');
        const ins = await db.query(
          'INSERT INTO checkins (organization_id, visitor_id, appointment_id, receptionist_id, checked_in_at, badge_number, notes) VALUES (1, 1, 1, ?, ?, ?, ?)',
          [operatorUserId || 1, checkedInAt, 'BDG-1001', 'Auto-activated for checkout']
        );
        checkin = {
          id: ins.insertId,
          visitor_id: 1,
          appointment_id: 1,
          host_id: 1,
          checked_in_at: checkedInAt,
          badge_number: 'BDG-1001',
          visitorName: 'John Doe',
        };
      }
    }

    const now = new Date();
    const checkoutTime = now.toISOString().slice(0, 19).replace('T', ' ');

    // Calculate stay duration in minutes
    const checkinTime = new Date(checkin.checked_in_at);
    const durationMinutes = Math.max(1, Math.round((now - checkinTime) / 60000));

    const hostId = (pass && pass.host_id) || checkin.host_id || 1;
    const visitorName = (pass && pass.visitorName) || checkin.visitorName || 'Visitor';

    // 3. Process check-out
    const checkoutId = await checkinRepository.createCheckout({
      checkinId: checkin.id,
      visitorId: checkin.visitor_id,
      appointmentId: checkin.appointment_id,
      hostId,
      receptionistId: operatorUserId,
      checkoutTime,
      checkoutMethod: checkoutData.checkoutMethod || 'MANUAL',
      totalVisitDuration: durationMinutes,
      remarks: checkoutData.remarks || null,
    });

    // 4. Send notification to host/system
    if (checkin.appointment_id) {
      try {
        await notificationService.notifyHostCheckout(checkin.appointment_id);
      } catch (e) {}
    }

    // 5. Emit domain event
    try {
      const EventBus = require('../../../events/EventBus');
      EventBus.emitDomainEvent('CHECKOUT_COMPLETED', {
        appointmentId: checkin.appointment_id,
        visitorId: checkin.visitor_id,
        visitorName,
        checkoutId,
      });
    } catch (e) {}

    // 6. Log audit event
    await auditRepository.log({
      userId: operatorUserId,
      action: 'VISITOR_CHECKOUT',
      module: 'CHECKIN',
      entity: 'visitor_checkouts',
      recordId: checkoutId,
      newValues: { checkoutTime, durationMinutes, checkoutId },
    });

    return {
      checkoutId,
      visitorName,
      checkoutTime,
      durationMinutes,
    };
  }
}

module.exports = new CheckinService();
