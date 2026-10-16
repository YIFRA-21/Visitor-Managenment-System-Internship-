const appointmentRepository = require('../repositories/appointment.repository');
const visitorRepository = require('../../visitor-management/repositories/visitor.repository');
const userRepository = require('../../user-management/repositories/user.repository');
const approvalService = require('../../approval-workflow/services/approval.service');
const notificationService = require('../../notifications/services/notification.service');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const db = require('../../../config/db');
const { AppError } = require('../../../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

class AppointmentService {
  constructor() {
    this.appointmentRepository = appointmentRepository;
  }
  async createAppointment(appointmentData, operatorUserId, tx = null) {
    const queryExec = (sql, params) => (tx ? tx.query(sql, params) : db.query(sql, params));

    let {
      visitorId: providedVisitorId,
      visitorName, visitorEmail, visitorPhone, company,
      idType, idNumber,
      hostId, departmentId, roomId,
      purpose, visitType,
      scheduledStart: rawStart, scheduledEnd: rawEnd,
      verificationStatus, similarityScore,
      organizationId = 1,
      branchId = 1,
    } = appointmentData;

    const scheduledStart = rawStart || appointmentData.scheduled_start || new Date().toISOString().slice(0, 19).replace('T', ' ');
    const scheduledEnd = rawEnd || appointmentData.scheduled_end || new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');

    // Resolve host by name if no numeric hostId
    if (!hostId && appointmentData.host_name) {
      const hostName = appointmentData.host_name.replace(/\s*\([^)]*\)\s*$/, '').trim();
      const empRows = await queryExec(
        'SELECT id, user_id, department_id FROM employees WHERE full_name = ? LIMIT 1', [hostName]
      ).catch(() => []);
      if (empRows[0]) {
        hostId = empRows[0].id;
        if (!departmentId) departmentId = empRows[0].department_id;
      } else {
        const uRows = await queryExec(
          'SELECT id FROM users WHERE full_name = ? AND role != "visitor" LIMIT 1', [hostName]
        ).catch(() => []);
        if (uRows[0]) hostId = uRows[0].id;
      }
    }

    // Resolve organization by name
    if ((!organizationId || organizationId === 1) && appointmentData.organization_name) {
      const orgRows = await queryExec(
        'SELECT id FROM organizations WHERE name = ? LIMIT 1', [appointmentData.organization_name]
      ).catch(() => []);
      if (orgRows[0]) organizationId = orgRows[0].id;
    }

    // Resolve branch by name
    if ((!branchId || branchId === 1) && appointmentData.branch_name) {
      const brRows = await queryExec(
        'SELECT id FROM branches WHERE branch_name = ? OR name = ? LIMIT 1',
        [appointmentData.branch_name, appointmentData.branch_name]
      ).catch(() => []);
      if (brRows[0]) branchId = brRows[0].id;
    }

    // Resolve department by name
    if (!departmentId && appointmentData.department_name) {
      const dRows = await queryExec(
        'SELECT id FROM departments WHERE name = ? LIMIT 1', [appointmentData.department_name]
      ).catch(() => []);
      if (dRows[0]) departmentId = dRows[0].id;
    }

    // Resolve room by name
    if (!roomId && appointmentData.room_name) {
      const rRows = await queryExec(
        'SELECT id FROM meeting_rooms WHERE room_name = ? LIMIT 1', [appointmentData.room_name]
      ).catch(() => []);
      if (rRows[0]) roomId = rRows[0].id;
    }

    // 1. Resolve visitor: find existing by email or create new one
    let visitorId = providedVisitorId;
    let visitor = null;

    if (visitorId) {
      const vRows = await queryExec('SELECT * FROM visitors WHERE id = ? OR user_id = ? OR email = ?', [visitorId, visitorId, visitorEmail || '']);
      visitor = vRows[0] || null;
      if (visitor) visitorId = visitor.id;
    }

    if (!visitor && visitorEmail) {
      const vRows = await queryExec('SELECT * FROM visitors WHERE email = ?', [visitorEmail]);
      if (vRows[0]) {
        visitor = vRows[0];
        visitorId = visitor.id;
      }
    }

    if (!visitor && visitorName && visitorEmail) {
      visitorId = await visitorRepository.create({
        fullName: visitorName,
        email: visitorEmail,
        phone: visitorPhone || null,
        company: company || null,
        idType: idType || null,
        idNumber: idNumber || null,
        registrationStatus: 'APPROVED',
      }, tx);
      visitor = { id: visitorId, is_blacklisted: false };
    }

    if (!visitor) {
      throw new AppError('Visitor information is required (name and email).', 400);
    }

    if (visitor.is_blacklisted) {
      throw new AppError('Cannot schedule appointment: Visitor is blacklisted.', 403);
    }

    // 2. Verify Host Exists
    if (!hostId) {
      throw new AppError('Host representative is required.', 400);
    }

    let hostUserId = null;
    let hostEmployeeId = null;
    let hostUser = null;

    const empRows = await queryExec('SELECT id, user_id, full_name, department_id FROM employees WHERE id = ? OR user_id = ?', [hostId, hostId]).catch(() => []);
    if (empRows[0]) {
      hostEmployeeId = empRows[0].id;
      hostUserId = empRows[0].user_id || empRows[0].id;
      hostUser = (await userRepository.findById(hostUserId)) || { id: hostUserId, full_name: empRows[0].full_name, department_id: empRows[0].department_id };
    } else {
      const userRows = await queryExec('SELECT id, full_name, department_id, role FROM users WHERE id = ? AND role != "visitor"', [hostId]).catch(() => []);
      if (userRows[0]) {
        hostUserId = userRows[0].id;
        hostUser = userRows[0];
        const eRows = await queryExec('SELECT id FROM employees WHERE user_id = ?', [hostUserId]).catch(() => []);
        hostEmployeeId = eRows[0]?.id || hostUserId;
      }
    }

    if (!hostUserId && !hostEmployeeId) {
      throw new AppError('Host employee not found', 404);
    }

    // 3. Generate reference code and QR token
    const referenceCode = 'VMS-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const qrToken = uuidv4();

    // 4. Create appointment record
    const deptId = departmentId || hostUser?.departmentId || hostUser?.department_id || 1;
    const visitorUserId = visitor.user_id || operatorUserId || null;

    const appointmentId = await appointmentRepository.create({
      organizationId,
      branchId,
      facilityId: branchId,
      visitorId,
      visitorUserId,
      hostId: hostUserId,
      hostUserId,
      hostEmployeeId,
      departmentId: deptId,
      roomId: roomId || null,
      purpose: purpose || '',
      visitType: visitType || 'business',
      scheduledStart,
      scheduledEnd,
      referenceCode,
      qrToken,
      verificationStatus: verificationStatus || 'unverified',
      similarityScore: similarityScore || null,
    }, tx);

    // 5. Initialize approval workflow
    await approvalService.initializeWorkflow(appointmentId, deptId, hostUserId, tx);

    // 6. Log audit event
    await auditRepository.log({
      userId: operatorUserId || null,
      action: 'APPOINTMENT_CREATED',
      module: 'APPOINTMENTS',
      entity: 'appointments',
      recordId: appointmentId,
      newValues: { referenceCode, scheduledStart, visitorEmail },
    });

    // 7. Generate QR code data URL
    let qrDataUrl = null;
    try {
      const QRCode = require('qrcode');
      qrDataUrl = await QRCode.toDataURL(referenceCode);
    } catch (e) {
      console.warn('[APPOINTMENT] QR generation skipped:', e.message);
    }

    // 8. Emit Automatic Domain Event
    try {
      const EventBus = require('../../../events/EventBus');
      EventBus.emitDomainEvent('APPT_REQUESTED', {
        appointmentId,
        visitorId,
        host_employee_id: hostId,
        reference_code: referenceCode,
        visitor_name: visitorName,
        visitor_email: visitorEmail,
        scheduledStart,
        purpose
      });
    } catch (e) {}

    // 9. Notify Host via Bell + Email
    try {
      await notificationService.notifyHostNewAppointment(
        appointmentId,
        hostUserId,
        visitorName,
        visitorEmail,
        referenceCode,
        purpose
      );
    } catch (e) {
      console.warn('[APPOINTMENT] Host notification failed (non-blocking):', e.message);
    }

    // 10. Update or create visitor history
    try {
      const durMinutes = (scheduledStart && scheduledEnd)
        ? Math.max(15, Math.round((new Date(scheduledEnd) - new Date(scheduledStart)) / 60000))
        : 60;

      let deptName = 'Executive Office';
      try {
        const deptRows = await queryExec('SELECT name FROM departments WHERE id = ?', [deptId]);
        if (deptRows && deptRows[0]?.name) deptName = deptRows[0].name;
      } catch (e) {}

      const hostName = hostUser?.full_name || 'Host Representative';
      const nowFormatted = new Date().toISOString().slice(0, 19).replace('T', ' ');

      const existingHist = await queryExec(
        'SELECT id FROM visitor_histories WHERE visitor_id = ? AND is_deleted = FALSE ORDER BY id DESC LIMIT 1',
        [visitorId]
      );

      if (existingHist && existingHist.length > 0) {
        await queryExec(`
          UPDATE visitor_histories SET
            reference_number = ?,
            appointment_number = ?,
            host_employee_name = ?,
            department_name = ?,
            visit_purpose = ?,
            visit_duration_minutes = ?,
            visit_status = 'Pending',
            completed_date = ?,
            updated_at = ?
          WHERE id = ?
        `, [
          referenceCode,
          referenceCode,
          hostName,
          deptName,
          purpose || 'Business Appointment',
          durMinutes,
          scheduledStart,
          nowFormatted,
          existingHist[0].id
        ]);
      } else {
        const histCode = `HIS-2026-${String(visitorId).padStart(6, '0')}`;
        await queryExec(`
          INSERT INTO visitor_histories (
            history_code, organization_id, visitor_id, reference_number,
            visitor_name, visitor_email, visitor_phone, visitor_company, visitor_category,
            host_employee_name, department_name, appointment_number, visit_purpose,
            meeting_location, checkin_time, checkout_time, visit_duration_minutes,
            pass_number, visit_status, identity_type, identity_number, verification_status, completed_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          histCode,
          organizationId || 1,
          visitorId,
          referenceCode,
          visitor.full_name || visitorName || 'Visitor',
          visitor.email || visitorEmail || '',
          visitor.phone || '',
          visitor.company || company || 'Enterprise Visitor',
          'General Visitor',
          hostName,
          deptName,
          referenceCode,
          purpose || 'Business Appointment',
          'Main HQ',
          null,
          null,
          durMinutes,
          `VP-2026-${String(visitorId).padStart(4, '0')}`,
          'Pending',
          visitor.id_type || idType || 'Government ID',
          visitor.id_number || idNumber || 'VERIFIED',
          'Verified',
          scheduledStart
        ]);
      }
    } catch (histErr) {
      console.warn('Failed to update visitor_histories on createAppointment:', histErr.message);
    }

    const createdAppointment = await appointmentRepository.findById(appointmentId);
    return {
      ...createdAppointment,
      referenceCode,
      qrDataUrl,
      appointmentId,
    };
  }

  async getAppointment(id) {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }
    return appointment;
  }

  async findByReferenceCode(referenceCode) {
    const appointment = await appointmentRepository.findByReferenceCode(referenceCode);
    if (!appointment) {
      throw new AppError('Appointment not found with the specified reference code', 404);
    }
    return appointment;
  }

  async listAppointments(filters) {
    return appointmentRepository.findAll(filters);
  }

  async cancelAppointment(id, reason, operatorUserId) {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (appointment.appointment_status === 'CHECKED_IN' || appointment.appointment_status === 'COMPLETED') {
      throw new AppError('Cannot cancel a visit that is already checked in or completed.', 400);
    }

    await appointmentRepository.update(id, {
      appointmentStatus: 'CANCELLED',
      status: 'cancelled',
      isCancelled: true,
      cancellationReason: reason,
    });

    await auditRepository.log({
      userId: operatorUserId,
      action: 'APPOINTMENT_CANCELLED',
      module: 'APPOINTMENTS',
      entity: 'appointments',
      recordId: id,
      newValues: { reason },
    });

    try {
      const isVisitorActor = Number(operatorUserId) === Number(appointment.visitor_user_id);
      if (isVisitorActor) {
        await notificationService.notifyHostStatus(id, 'CANCELLED', { reason });
      } else {
        await notificationService.notifyVisitorStatus(id, 'CANCELLED', { comment: reason });
      }
    } catch (notifErr) {
      console.warn('[APPOINTMENT] Cancel notification failed (non-blocking):', notifErr.message);
    }
  }

  async getDashboardStats() {
    return appointmentRepository.getDashboardStats();
  }

  async getCalendarEvents(start, end, filters) {
    return appointmentRepository.findForCalendar(start, end, filters);
  }

  async validateCheckInEligibility(appointmentId) {
    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) {
      return { eligible: false, reason: 'Appointment record not found.' };
    }

    if (appointment.deleted_at) {
      return { eligible: false, reason: 'Appointment has been archived or deleted.' };
    }

    if (appointment.appointment_status === 'CANCELLED' || appointment.is_cancelled) {
      return { eligible: false, reason: 'Appointment was cancelled.' };
    }

    if (appointment.appointment_status === 'REJECTED') {
      return { eligible: false, reason: 'Appointment was rejected during approval.' };
    }

    if (appointment.appointment_status === 'COMPLETED') {
      return { eligible: false, reason: 'Appointment is already completed.' };
    }

    const apptStatus = (appointment.appointment_status || '').toUpperCase();
    const apprStatus = (appointment.approval_status || '').toUpperCase();

    if (apprStatus !== 'APPROVED' && apptStatus !== 'APPROVED' && apptStatus !== 'CONFIRMED' && apptStatus !== 'ARRIVED') {
      return { eligible: false, reason: 'Appointment is pending approval.' };
    }

    const visitor = await visitorRepository.findById(appointment.visitor_id);
    if (visitor && visitor.is_blacklisted) {
      return { eligible: false, reason: 'SECURITY ALERT: Visitor is listed on the Blacklist/Watchlist.' };
    }

    return {
      eligible: true,
      appointment,
      message: 'Visitor is eligible for check-in.'
    };
  }

  async softDelete(id, operatorUserId) {
    const ok = await appointmentRepository.softDelete(id, operatorUserId);
    if (ok) {
      await auditRepository.log({
        userId: operatorUserId,
        action: 'APPOINTMENT_DELETED',
        module: 'APPOINTMENTS',
        entity: 'appointments',
        recordId: id
      });
    }
    return ok;
  }

  async restore(id, operatorUserId) {
    const ok = await appointmentRepository.restore(id, operatorUserId);
    if (ok) {
      await auditRepository.log({
        userId: operatorUserId,
        action: 'APPOINTMENT_RESTORED',
        module: 'APPOINTMENTS',
        entity: 'appointments',
        recordId: id
      });
    }
    return ok;
  }
}

module.exports = new AppointmentService();
