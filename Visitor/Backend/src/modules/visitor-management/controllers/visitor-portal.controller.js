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
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const photoUrl = `/uploads/visitors/${req.file.filename}`;
      await visitorService.updateProfile(profile.id, { photoUrl }, req.user.id);
      res.json({ status: 'success', photoUrl });
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
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const fileUrl = `/uploads/documents/${req.file.filename}`;
      const docId = await visitorService.uploadDocument(
        profile.id,
        {
          documentType: req.body.documentType || 'OTHER',
          documentNumber: req.body.documentNumber || null,
          fileUrl,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          expiryDate: req.body.expiryDate || null,
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
      const appointment = await appointmentService.getAppointment(req.params.id);
      // Security: verify this appointment belongs to the visitor
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      if (appointment.visitor_id !== profile.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      res.json(appointment);
    } catch (err) {
      next(err);
    }
  }

  async createAppointment(req, res, next) {
    try {
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const appointmentData = {
        ...req.body,
        visitorId: profile.id,
        visitorName: profile.full_name,
        visitorEmail: profile.email,
        visitorPhone: profile.phone,
      };
      const result = await appointmentService.createAppointment(appointmentData, req.user.id);
      res.status(201).json({ status: 'success', message: 'Appointment requested', data: result });
    } catch (err) {
      next(err);
    }
  }

  async cancelAppointment(req, res, next) {
    try {
      const appointment = await appointmentService.getAppointment(req.params.id);
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      if (appointment.visitor_id !== profile.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      await appointmentService.cancelAppointment(req.params.id, req.body.reason || 'Cancelled by visitor', req.user.id);
      res.json({ status: 'success', message: 'Appointment cancelled' });
    } catch (err) {
      next(err);
    }
  }

  async deleteAppointment(req, res, next) {
    try {
      const appointment = await appointmentService.getAppointment(req.params.id);
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      if (appointment && appointment.visitor_id !== profile.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
      await appointmentService.softDelete(req.params.id, req.user.id);
      res.json({ status: 'success', message: 'Appointment deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async rescheduleAppointment(req, res, next) {
    try {
      const appointment = await appointmentService.getAppointment(req.params.id);
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      if (appointment.visitor_id !== profile.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { scheduledStart, scheduledEnd, reason } = req.body;
      if (!scheduledStart || !scheduledEnd) {
        return res.status(400).json({ error: 'New start and end times are required' });
      }

      // Cancel old and create new
      await appointmentService.cancelAppointment(req.params.id, reason || 'Rescheduled by visitor', req.user.id);
      const result = await appointmentService.createAppointment({
        visitorId: profile.id,
        visitorName: profile.full_name,
        visitorEmail: profile.email,
        hostId: appointment.host_id,
        departmentId: appointment.department_id,
        roomId: appointment.room_id,
        purpose: appointment.purpose,
        visitType: appointment.visit_type,
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
      const profile = await visitorService.getVisitorProfileByUserId(req.user.id);
      const pass = await visitorService.getVisitorPass(req.params.id, profile.id);
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
      const feedbackId = await visitorService.submitFeedback(
        { ...req.body, visitorId: profile.id },
        req.user.id
      );
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
      const { subject, category, description } = req.body;

      if (!subject || !description) {
        return res.status(400).json({ error: 'Subject and description are required' });
      }

      const ticketNumber = 'TKT-' + Date.now().toString(36).toUpperCase();
      const result = await db.query(
        `INSERT INTO visitor_notes (visitor_id, note_type, subject, note_text, created_by)
         VALUES (?, ?, ?, ?, ?)`,
        [profile.id, category || 'SUPPORT', subject, description, req.user.id]
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
