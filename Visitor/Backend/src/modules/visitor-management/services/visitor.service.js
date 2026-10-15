const visitorRepository = require('../repositories/visitor.repository');
const appointmentRepository = require('../../appointment-management/repositories/appointment.repository');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const { AppError } = require('../../../middleware/errorHandler');

class VisitorService {
  // ─── Registration ───────────────────────────────
  async registerVisitor(visitorData, operatorUserId = null) {
    const { email, phone, idNumber, fullName } = visitorData;

    if (!email || !phone || !fullName) {
      throw new AppError('Full name, email, and phone number are required', 400);
    }

    const duplicate = await visitorRepository.checkDuplicate(email, phone, idNumber);
    if (duplicate) {
      if (duplicate.isBlacklisted) {
        throw new AppError('This visitor is currently blacklisted and cannot be registered.', 403);
      }
      throw new AppError('A visitor with the same email, phone number, or ID number already exists.', 400);
    }

    const visitorId = await visitorRepository.create({
      ...visitorData,
      registrationStatus: 'PENDING',
    });

    await auditRepository.log({
      userId: operatorUserId,
      action: 'VISITOR_REGISTERED',
      module: 'VISITORS',
      entity: 'visitors',
      recordId: visitorId,
      newValues: { email, phone, fullName },
    });

    return { id: visitorId, ...visitorData, registrationStatus: 'PENDING' };
  }

  // ─── Profile ────────────────────────────────────
  async getVisitorProfile(id) {
    const visitor = await visitorRepository.findById(id);
    if (!visitor) {
      throw new AppError('Visitor profile not found', 404);
    }
    return visitor;
  }

  async getVisitorProfileByUserId(userId) {
    // Step 1: Look up visitor profile by user_id FK
    let visitor = await visitorRepository.findByUserId(userId);

    // Step 2: If not found by user_id, try by email from users table
    if (!visitor) {
      const db = require('../../../config/db');
      const users = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
      const user = users[0];
      if (user && user.email) {
        visitor = await visitorRepository.findByEmail(user.email);
        if (visitor && !visitor.user_id) {
          // Link orphaned visitor record to this user account
          await db.query('UPDATE visitors SET user_id = ? WHERE id = ?', [userId, visitor.id]);
        }
      }

      // Step 3: Auto-create a visitor profile if truly not found
      if (!visitor && user) {
        const db2 = require('../../../config/db');
        const visitorId = await visitorRepository.create({
          userId: user.id,
          fullName: user.full_name || user.username || 'Visitor',
          email: user.email,
          phone: user.phone || '',
          registrationStatus: 'APPROVED',
        });
        // Generate formatted visitor code
        const formattedCode = `VISIT${String(visitorId).padStart(6, '0')}`;
        await db2.query('UPDATE visitors SET visitor_id = ?, visitor_code = ?, user_id = ? WHERE id = ?', [formattedCode, formattedCode, userId, visitorId]);
        visitor = await visitorRepository.findById(visitorId);
      }

      if (!visitor) {
        throw new AppError('Visitor profile not found. Please contact support.', 404);
      }
    }

    // Also fetch emergency contacts
    let emergencyContacts = [];
    try {
      emergencyContacts = await visitorRepository.getEmergencyContacts(visitor.id);
    } catch (e) {
      // Emergency contacts table may not exist yet
    }
    return { ...visitor, emergencyContacts };
  }


  async updateProfile(visitorId, data, operatorUserId) {
    const visitor = await visitorRepository.findById(visitorId);
    if (!visitor) {
      throw new AppError('Visitor profile not found', 404);
    }

    await visitorRepository.updateProfile(visitorId, data);

    // Update emergency contact if provided
    if (data.emergencyContactName || data.emergencyContactPhone) {
      await visitorRepository.upsertEmergencyContact(visitorId, {
        name: data.emergencyContactName,
        phone: data.emergencyContactPhone,
        relationship: data.emergencyContactRelationship,
        email: data.emergencyContactEmail,
      });
    }

    await auditRepository.log({
      userId: operatorUserId,
      action: 'VISITOR_PROFILE_UPDATED',
      module: 'VISITORS',
      entity: 'visitors',
      recordId: visitorId,
      oldValues: { fullName: visitor.full_name, phone: visitor.phone },
      newValues: data,
    });

    return this.getVisitorProfile(visitorId);
  }

  // ─── Documents ──────────────────────────────────
  async getDocuments(visitorId) {
    return visitorRepository.getDocuments(visitorId);
  }

  async uploadDocument(visitorId, docData, operatorUserId) {
    const visitor = await visitorRepository.findById(visitorId);
    if (!visitor) {
      throw new AppError('Visitor profile not found', 404);
    }

    // Validate file type
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (docData.mimeType && !allowedMimes.includes(docData.mimeType.toLowerCase())) {
      throw new AppError('Invalid file type. Allowed: PDF, JPG, JPEG, PNG', 400);
    }

    // Max file size: 5MB
    if (docData.fileSize && docData.fileSize > 5 * 1024 * 1024) {
      throw new AppError('File size exceeds 5MB limit', 400);
    }

    const docId = await visitorRepository.createDocument(visitorId, docData);

    await auditRepository.log({
      userId: operatorUserId,
      action: 'VISITOR_DOCUMENT_UPLOADED',
      module: 'VISITORS',
      entity: 'visitor_documents',
      recordId: docId,
      newValues: { documentType: docData.documentType, fileName: docData.fileName },
    });

    return docId;
  }

  async deleteDocument(docId, visitorId, operatorUserId, isStaffOrAdmin = false) {
    const deleted = await visitorRepository.deleteDocument(docId, visitorId, isStaffOrAdmin);
    if (!deleted) {
      throw new AppError('Document not found', 404);
    }

    await auditRepository.log({
      userId: operatorUserId,
      action: 'VISITOR_DOCUMENT_DELETED',
      module: 'VISITORS',
      entity: 'visitor_documents',
      recordId: docId,
    });
  }

  async submitDocumentsToHost(visitorId, appointmentId, operatorUserId) {
    const result = await visitorRepository.submitDocumentsToHost(visitorId, appointmentId);

    // Notify host employee if appointment is linked
    try {
      const appt = result.appointment;
      if (appt) {
        const db = require('../../../config/db');
        let hostUserId = appt.host_user_id;
        if (!hostUserId && appt.host_employee_id) {
          const empRows = await db.query('SELECT user_id FROM employees WHERE id = ?', [appt.host_employee_id]).catch(() => []);
          if (empRows && empRows[0]?.user_id) hostUserId = empRows[0].user_id;
        }
        if (!hostUserId && appt.host_id) {
          hostUserId = appt.host_id;
        }

        if (hostUserId) {
          const vis = await visitorRepository.findById(visitorId);
          const visitorName = vis?.full_name || 'Visitor';
          const ref = appt.appointment_number || appt.reference_code || `APT-${appt.id}`;
          await db.query(
            `INSERT INTO notifications (user_id, title, message, type, priority, category, channel, status, reference_number, module_name, record_id, action_url)
             VALUES (?, ?, ?, 'DOCUMENT_SUBMITTED', 'high', 'APPOINTMENTS', 'in_app', 'sent', ?, 'APPOINTMENTS', ?, '/employee/appointments')`,
            [
              hostUserId,
              'New Documents Submitted by Visitor',
              `${visitorName} has submitted ${result.affectedDocuments || 'all'} documents for appointment #${ref} for your review and approval.`,
              ref,
              appt.id
            ]
          ).catch(() => {});
        }
      }
    } catch (_) {}

    await auditRepository.log({
      userId: operatorUserId,
      action: 'VISITOR_DOCUMENTS_SUBMITTED_TO_HOST',
      module: 'VISITORS',
      entity: 'visitor_documents',
      recordId: visitorId,
      newValues: { affectedDocuments: result.affectedDocuments, appointmentId: result.appointment?.id },
    });

    return result;
  }

  async updateDocument(docId, visitorId, updateData, operatorUserId) {
    const updated = await visitorRepository.updateDocument(docId, visitorId, updateData);
    if (!updated) {
      throw new AppError('Document not found or update failed', 404);
    }

    await auditRepository.log({
      userId: operatorUserId,
      action: 'VISITOR_DOCUMENT_UPDATED',
      module: 'VISITORS',
      entity: 'visitor_documents',
      recordId: docId,
      newValues: updateData,
    });
  }


  // ─── Dashboard ──────────────────────────────────
  async getDashboardStats(visitorId) {
    const stats = await visitorRepository.getDashboardStats(visitorId);
    const recentActivity = await visitorRepository.getRecentActivity(visitorId, 8);
    const passes = await visitorRepository.getPasses(visitorId);

    // Find active pass (not expired)
    const activePass = passes.find(
      (p) => p.status === 'ACTIVE' && new Date(p.expires_at) > new Date()
    ) || null;

    return {
      stats: {
        total: stats.total || 0,
        pending: stats.pending || 0,
        approved: stats.approved || 0,
        rejected: stats.rejected || 0,
        cancelled: stats.cancelled || 0,
        completed: stats.completed || 0,
        checkedIn: stats.checkedIn || 0,
        upcoming: stats.upcoming || 0,
      },
      activePass,
      recentActivity,
    };
  }

  // ─── Visitor History ────────────────────────────
  async getVisitorHistory(id, filters = {}) {
    const visitor = await visitorRepository.findById(id);
    if (!visitor) {
      throw new AppError('Visitor profile not found', 404);
    }
    return visitorRepository.findHistory(id, filters);
  }

  // ─── Visitor Passes ─────────────────────────────
  async getVisitorPasses(visitorId) {
    return visitorRepository.getPasses(visitorId);
  }

  async getVisitorPass(passId, visitorId) {
    const pass = await visitorRepository.getPassById(passId, visitorId);
    if (!pass) {
      throw new AppError('Visitor pass not found', 404);
    }

    // Generate QR data URL
    let qrDataUrl = null;
    try {
      const QRCode = require('qrcode');
      const qrPayload = pass.qr_code || pass.pass_code || pass.reference_code || `PASS-${pass.id}`;
      qrDataUrl = await QRCode.toDataURL(qrPayload);
    } catch (e) {
      console.warn('[VISITOR-PASS] QR generation skipped:', e.message);
    }

    return { ...pass, qrDataUrl };
  }

  // ─── Feedback ───────────────────────────────────
  async submitFeedback(data, operatorUserId) {
    if (!data.overallRating || data.overallRating < 1 || data.overallRating > 5) {
      throw new AppError('Overall rating (1-5) is required', 400);
    }

    const feedbackId = await visitorRepository.submitFeedback(data);

    await auditRepository.log({
      userId: operatorUserId,
      action: 'VISITOR_FEEDBACK_SUBMITTED',
      module: 'VISITORS',
      entity: 'checkout_feedbacks',
      recordId: feedbackId,
      newValues: { overallRating: data.overallRating },
    });

    return feedbackId;
  }

  async getFeedbackHistory(visitorId) {
    return visitorRepository.getFeedbackHistory(visitorId);
  }

  // ─── Notifications ─────────────────────────────
  async getNotifications(userId, visitorEmail, filters = {}) {
    return visitorRepository.getNotifications(userId, visitorEmail, filters);
  }

  async markNotificationRead(notifId, userId) {
    return visitorRepository.markNotificationRead(notifId, userId);
  }

  async markAllNotificationsRead(userId, visitorEmail) {
    return visitorRepository.markAllNotificationsRead(userId, visitorEmail);
  }

  // ─── Preferences/Settings ──────────────────────
  async getPreferences(visitorId) {
    return visitorRepository.getPreferences(visitorId);
  }

  async updatePreferences(visitorId, data) {
    return visitorRepository.upsertPreferences(visitorId, data);
  }

  // ─── Blacklist ──────────────────────────────────
  async blacklistVisitor(visitorId, reason, blockedByUserId) {
    const visitor = await visitorRepository.findById(visitorId);
    if (!visitor) {
      throw new AppError('Visitor profile not found', 404);
    }

    await visitorRepository.addToBlacklist(visitorId, reason, blockedByUserId);

    await auditRepository.log({
      userId: blockedByUserId,
      action: 'VISITOR_BLACKLISTED',
      module: 'SECURITY',
      entity: 'visitors',
      recordId: visitorId,
      newValues: { reason },
    });
  }

  async listVisitors(filters) {
    return visitorRepository.findAll(filters);
  }
}

module.exports = new VisitorService();
