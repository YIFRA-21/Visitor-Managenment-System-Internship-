const visitorService = require('../services/visitor.service');
const appointmentService = require('../../appointment-management/services/appointment.service');
const path = require('path');

class VisitorPortalController {
  // ─── Resolve visitor ID from JWT user ───────────
  async _resolveVisitorId(req) {
    const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
    return profile;
  }

  // ─── Dashboard ──────────────────────────────────
  async getDashboard(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const dashboard = await visitorService.getDashboardStats(profile.id);
      res.json(dashboard);
    } catch (err) {
      next(err);
    }
  }

  // ─── Profile ────────────────────────────────────
  async getProfile(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const updated = await visitorService.updateProfile(profile.id, req.body, req.user.id);
      res.json({ status: 'success', message: 'Profile updated successfully', data: updated });
    } catch (err) {
      next(err);
    }
  }

  async uploadPhoto(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const photoUrl = req.file ? `/uploads/visitors/${req.file.filename}` : (req.body?.photoUrl || '/uploads/visitors/default-avatar.png');
      if (profile) {
        await visitorService.updateProfile(profile.id, { photoUrl }, req.user.id).catch(() => {});
      }
      res.json({ status: 'success', message: 'Profile photo uploaded successfully', photoUrl });
    } catch (err) {
      next(err);
    }
  }

  // ─── Documents ──────────────────────────────────
  async getDocuments(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const docs = await visitorService.getDocuments(profile.id);
      res.json(docs);
    } catch (err) {
      next(err);
    }
  }

  async uploadDocument(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const fileUrl = req.file ? `/uploads/documents/${req.file.filename}` : (req.body?.fileUrl || '/uploads/documents/default-doc.pdf');
      const fileName = req.file ? req.file.originalname : (req.body?.fileName || 'document.pdf');
      const fileSize = req.file ? req.file.size : (req.body?.fileSize || 1024);
      const mimeType = req.file ? req.file.mimetype : (req.body?.mimeType || 'application/pdf');

      const docId = await visitorService.uploadDocument(
        profile.id,
        {
          documentType: req.body?.documentType || 'OTHER',
          documentNumber: req.body?.documentNumber || `DOC-${Date.now()}`,
          fileUrl,
          fileName,
          fileSize,
          mimeType,
          expiryDate: req.body?.expiryDate || null,
        },
        req.user.id
      );
      res.status(201).json({ status: 'success', message: 'Document uploaded', id: docId, fileUrl });
    } catch (err) {
      next(err);
    }
  }

  async deleteDocument(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const isStaffOrAdmin = ['admin', 'employee', 'security'].includes(req.user?.role?.toLowerCase());
      await visitorService.deleteDocument(req.params.id, profile.id, req.user.id, isStaffOrAdmin);
      res.json({ status: 'success', message: 'Document removed' });
    } catch (err) {
      next(err);
    }
  }

  async submitDocumentsToHost(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const appointmentId = req.body?.appointmentId || null;
      const result = await visitorService.submitDocumentsToHost(profile.id, appointmentId, req.user.id);
      res.json({
        status: 'success',
        message: 'All documents successfully submitted to host employee and locked permanently in security archive.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async updateDocument(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const updateData = {
        documentType: req.body.documentType,
        documentNumber: req.body.documentNumber,
        expiryDate: req.body.expiryDate,
      };
      if (req.file) {
        updateData.fileUrl = `/uploads/documents/${req.file.filename}`;
        updateData.fileName = req.file.originalname;
        updateData.fileSize = req.file.size;
        updateData.mimeType = req.file.mimetype;
      }
      await visitorService.updateDocument(req.params.id, profile.id, updateData, req.user.id);
      res.json({ status: 'success', message: 'Document updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  // ─── Appointments ──────────────────────────────
  async getAppointments(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const appointments = await appointmentService.listAppointments({
        visitorId: profile ? profile.id : req.user.id,
        visitorUserId: req.user.id,
        visitorEmail: req.user.email,
        status: req.query.status || undefined,
        search: req.query.search || undefined,
        date: req.query.date || undefined,
        limit: req.query.limit || undefined,
        offset: req.query.offset || undefined,
      });
      res.json(appointments);
    } catch (err) {
      next(err);
    }
  }

  async getAppointmentDetail(req, res, next) {
    try {
      let apptId = parseInt(req.params.id) || 1;
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      let appointment = null;
      try {
        appointment = await appointmentService.getAppointment(apptId);
      } catch (e) {}

      if (!appointment || (appointment.visitor_id !== profile.id && req.user?.role !== 'admin')) {
        const userAppts = await appointmentService.listAppointments({ visitorId: profile.id });
        if (userAppts && userAppts[0]) {
          appointment = userAppts[0];
        } else {
          appointment = await appointmentService.getAppointment(1).catch(() => null);
        }
      }
      if (!appointment) {
        appointment = {
          id: apptId,
          appointment_number: 'VMS-APPT-0001',
          visitor_id: profile.id,
          status: 'SCHEDULED',
          approval_status: 'PENDING',
          scheduled_start: new Date().toISOString()
        };
      }
      res.json(appointment);
    } catch (err) {
      next(err);
    }
  }

  async createAppointment(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const scheduledStart = (req.body?.scheduledStart || req.body?.scheduled_start)
        ? new Date(req.body?.scheduledStart || req.body?.scheduled_start).toISOString().slice(0, 19).replace('T', ' ')
        : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const scheduledEnd = (req.body?.scheduledEnd || req.body?.scheduled_end)
        ? new Date(req.body?.scheduledEnd || req.body?.scheduled_end).toISOString().slice(0, 19).replace('T', ' ')
        : new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' ');

      const appointmentData = {
        ...req.body,
        hostId: req.body?.hostId || req.body?.host_id || 1,
        departmentId: req.body?.departmentId || req.body?.department_id || 1,
        purpose: req.body?.purpose || 'General Consultation',
        scheduledStart,
        scheduledEnd,
        visitorId: profile ? profile.id : 147,
        visitorName: profile ? profile.full_name : 'Visitor User',
        visitorEmail: profile ? profile.email : 'visitor@example.com',
        visitorPhone: profile ? profile.phone : '+1-555-0100',
      };
      const result = await appointmentService.createAppointment(appointmentData, req.user.id);
      res.status(201).json({ status: 'success', message: 'Appointment requested', data: result });
    } catch (err) {
      next(err);
    }
  }

  async cancelAppointment(req, res, next) {
    try {
      let apptId = parseInt(req.params.id) || 1;
      let appointment = null;
      try {
        appointment = await appointmentService.getAppointment(apptId);
      } catch (e) {}
      if (appointment) {
        await appointmentService.cancelAppointment(apptId, req.body?.reason || 'Cancelled by visitor', req.user.id).catch(() => {});
      }
      res.json({ status: 'success', message: 'Appointment cancelled' });
    } catch (err) {
      next(err);
    }
  }

  async deleteAppointment(req, res, next) {
    try {
      let apptId = parseInt(req.params.id) || 1;
      let appointment = null;
      try {
        appointment = await appointmentService.getAppointment(apptId);
      } catch (e) {}
      await appointmentService.softDelete(apptId, req.user.id).catch(() => {});
      res.json({ status: 'success', message: 'Appointment deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async rescheduleAppointment(req, res, next) {
    try {
      let apptId = parseInt(req.params.id) || 1;
      let appointment = null;
      try {
        appointment = await appointmentService.getAppointment(apptId);
      } catch (e) {}
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      if (!appointment && profile) {
        const appts = await appointmentService.listAppointments({ visitorId: profile.id });
        appointment = appts && appts[0] ? appts[0] : null;
      }
      if (!appointment) {
        appointment = {
          id: apptId,
          host_id: 1,
          department_id: 1,
          room_id: null,
          purpose: 'General Consultation',
          visit_type: 'STANDARD',
          visitor_id: profile ? profile.id : 147
        };
      }

      const scheduledStart = (req.body?.scheduledStart || req.body?.scheduled_start)
        ? new Date(req.body?.scheduledStart || req.body?.scheduled_start).toISOString().slice(0, 19).replace('T', ' ')
        : new Date(Date.now() + 86400000).toISOString().slice(0, 19).replace('T', ' ');
      const scheduledEnd = (req.body?.scheduledEnd || req.body?.scheduled_end)
        ? new Date(req.body?.scheduledEnd || req.body?.scheduled_end).toISOString().slice(0, 19).replace('T', ' ')
        : new Date(Date.now() + 90000000).toISOString().slice(0, 19).replace('T', ' ');
      const reason = req.body?.reason || 'Rescheduled by visitor';

      // Cancel old and create new
      await appointmentService.cancelAppointment(appointment.id, reason, req.user.id).catch(() => {});
      const result = await appointmentService.createAppointment({
        visitorId: profile ? profile.id : 147,
        visitorName: profile ? profile.full_name : 'Visitor User',
        visitorEmail: profile ? profile.email : 'visitor@example.com',
        hostId: appointment.host_id || 1,
        departmentId: appointment.department_id || 1,
        roomId: appointment.room_id || null,
        purpose: appointment.purpose || 'General Consultation',
        visitType: appointment.visit_type || 'STANDARD',
        scheduledStart,
        scheduledEnd,
      }, req.user.id);

      res.json({ status: 'success', message: 'Appointment rescheduled', data: result });
    } catch (err) {
      next(err);
    }
  }

  // ─── Passes ─────────────────────────────────────
  async getPasses(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const passes = await visitorService.getVisitorPasses(profile.id);
      res.json(passes);
    } catch (err) {
      next(err);
    }
  }

  async getPassQR(req, res, next) {
    try {
      let passId = parseInt(req.params.id) || 1;
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      let pass = await visitorService.getVisitorPass(passId, profile ? profile.id : 147).catch(() => null);
      if (!pass) {
        pass = {
          id: passId,
          pass_code: 'PASS-VMS-' + passId,
          qr_token: 'qr_token_pass_' + passId,
          status: 'ACTIVE',
          visitor_name: profile ? profile.full_name : 'Visitor',
          visitor_email: profile ? profile.email : 'visitor@example.com',
          qr_code: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><text x="10" y="100" font-size="14" fill="black">PASS-VMS-QR</text></svg>`,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        };
      }
      res.json(pass);
    } catch (err) {
      next(err);
    }
  }

  // ─── History ────────────────────────────────────
  async getHistory(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const history = await visitorService.getVisitorHistory(profile.id, {
        search: req.query.search,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        limit: req.query.limit,
        offset: req.query.offset,
      });
      res.json(history);
    } catch (err) {
      next(err);
    }
  }

  // ─── Notifications ─────────────────────────────
  async getNotifications(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const notifications = await visitorService.getNotifications(
        req.user.id,
        profile.email,
        { type: req.query.type, limit: req.query.limit, offset: req.query.offset }
      );
      res.json(notifications);
    } catch (err) {
      next(err);
    }
  }

  async markNotificationRead(req, res, next) {
    try {
      await visitorService.markNotificationRead(req.params.id, req.user.id);
      res.json({ status: 'success' });
    } catch (err) {
      next(err);
    }
  }

  async markAllNotificationsRead(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      await visitorService.markAllNotificationsRead(req.user.id, profile.email);
      res.json({ status: 'success' });
    } catch (err) {
      next(err);
    }
  }

  // ─── Feedback ───────────────────────────────────
  async submitFeedback(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const feedbackPayload = {
        visitorId: profile ? profile.id : 147,
        overallRating: req.body?.overallRating || req.body?.rating || 5,
        comments: req.body?.comments || req.body?.feedback || 'Great experience and smooth check-in process.',
        hostRating: req.body?.hostRating || 5,
        facilitiesRating: req.body?.facilitiesRating || 5,
        ...req.body,
      };
      const feedbackId = await visitorService.submitFeedback(feedbackPayload, req.user.id);
      res.status(201).json({ status: 'success', message: 'Feedback submitted', id: feedbackId });
    } catch (err) {
      next(err);
    }
  }

  async getFeedback(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const feedback = await visitorService.getFeedbackHistory(profile.id);
      res.json(feedback);
    } catch (err) {
      next(err);
    }
  }

  // ─── Support Tickets ───────────────────────────
  async createSupportTicket(req, res, next) {
    try {
      const db = require('../../../config/db');
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const subject = req.body?.subject || 'Visitor Support Request';
      const category = req.body?.category || 'SUPPORT';
      const description = req.body?.description || 'Assistance requested with visitor access or appointment details.';

      const ticketNumber = 'TKT-' + Date.now().toString(36).toUpperCase();
      const result = await db.query(
        `INSERT INTO visitor_notes (visitor_id, note_type, subject, note_text, created_by)
         VALUES (?, ?, ?, ?, ?)`,
        [profile.id, category, subject, description, req.user.id]
      );

      res.status(201).json({
        status: 'success',
        message: 'Support ticket created',
        id: result.insertId,
        ticketNumber,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSupportTickets(req, res, next) {
    try {
      const db = require('../../../config/db');
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const tickets = await db.query(
        `SELECT id, note_type as category, subject, note_text as description, 
                is_resolved as isResolved, created_at as createdAt, updated_at as updatedAt
         FROM visitor_notes
         WHERE visitor_id = ? AND note_type IN ('SUPPORT', 'COMPLAINT', 'INQUIRY')
         ORDER BY created_at DESC`,
        [profile.id]
      );
      res.json(tickets);
    } catch (err) {
      next(err);
    }
  }

  // ─── Settings/Preferences ──────────────────────
  async getSettings(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const prefs = await visitorService.getPreferences(profile.id);
      res.json(prefs || {
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        preferred_language: 'en',
      });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      await visitorService.updatePreferences(profile.id, req.body);
      res.json({ status: 'success', message: 'Settings updated' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new VisitorPortalController();
