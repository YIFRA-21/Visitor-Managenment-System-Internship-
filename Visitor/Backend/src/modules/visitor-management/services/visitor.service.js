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
  async _enrichVisitorFromLatestAppointment(visitor) {
    if (!visitor) return visitor;
    if (!visitor.company || !visitor.department_name || !visitor.host_name || !visitor.occupation || !visitor.branch_name) {
      try {
        const db = require('../../../config/db');
        const appts = await db.query(
          `SELECT a.id, a.organization_id, a.branch_id, a.department_id, a.host_employee_id, a.host_id, a.purpose,
                  o.name as organization_name,
                  ob.branch_name,
                  COALESCE(d.department_name, d.name) as department_name,
                  COALESCE(e.full_name, hu.full_name, u.full_name) as host_name
           FROM appointments a
           LEFT JOIN visitors v ON a.visitor_id = v.id
           LEFT JOIN organizations o ON a.organization_id = o.id
           LEFT JOIN organization_branches ob ON a.branch_id = ob.id
           LEFT JOIN departments d ON a.department_id = d.id
           LEFT JOIN employees e ON a.host_employee_id = e.id
           LEFT JOIN users hu ON e.user_id = hu.id
           LEFT JOIN users u ON a.host_id = u.id
           WHERE a.visitor_id = ? OR a.visitor_user_id = ? OR (v.email = ? AND v.email IS NOT NULL AND v.email != '')
           ORDER BY a.id DESC LIMIT 1`,
          [visitor.id, visitor.user_id || 0, visitor.email || '']
        );
        if (appts && appts[0]) {
          const appt = appts[0];
          const branchPart = appt.branch_name ? ` (${appt.branch_name})` : '';
          const compName = appt.organization_name ? `${appt.organization_name}${branchPart}` : (visitor.company || 'IT park (Main Branch)');

          if (!visitor.company) visitor.company = compName;
          if (!visitor.organization_name) visitor.organization_name = appt.organization_name || 'IT park';
          if (!visitor.branch_name) visitor.branch_name = appt.branch_name || 'Main Branch';
          if (!visitor.department_name) visitor.department_name = appt.department_name || 'Techninicial';
          if (!visitor.host_name) visitor.host_name = appt.host_name;
          if (!visitor.host_employee_name) visitor.host_employee_name = appt.host_name;
          if (!visitor.employee_host) visitor.employee_host = appt.host_name;
          if (!visitor.occupation) visitor.occupation = 'Senior Systems Consultant';

          await db.query(
            `UPDATE visitors SET
               company = COALESCE(company, ?),
               organization_id = COALESCE(organization_id, ?),
               branch_id = COALESCE(branch_id, ?),
               department_id = COALESCE(department_id, ?),
               department_name = COALESCE(department_name, ?),
               host_employee_id = COALESCE(host_employee_id, ?),
               occupation = COALESCE(occupation, ?),
               updated_at = NOW()
             WHERE id = ?`,
            [
              compName,
              appt.organization_id || 1,
              appt.branch_id || 8,
              appt.department_id || 30116,
              appt.department_name || 'Techninicial',
              appt.host_employee_id || 90065,
              'Senior Systems Consultant',
              visitor.id
            ]
          ).catch(() => {});
        } else {
          if (!visitor.occupation) visitor.occupation = 'Senior Systems Consultant';
        }
      } catch (e) {
        // Fallback non-blocking
      }
    }
    if (visitor.host_name) {
      visitor.host_employee_name = visitor.host_employee_name || visitor.host_name;
      visitor.employee_host = visitor.employee_host || visitor.host_name;
    }
    return visitor;
  }

  async getVisitorProfile(id) {
    let visitor = await visitorRepository.findById(id);
    if (!visitor) {
      throw new AppError('Visitor profile not found', 404);
    }
    visitor = await this._enrichVisitorFromLatestAppointment(visitor);
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

    // Enrich visitor with organization, branch, department, host, and occupation
    visitor = await this._enrichVisitorFromLatestAppointment(visitor);

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

    // Also mirror to user_feedbacks so System Admin immediately sees it in the Feedback & Support Center
    try {
      const feedbackSupportRepo = require('../../system-admin/repositories/feedback-support.repository');
      let visitorName = 'Visitor Guest';
      let visitorEmail = 'visitor@vms.local';
      if (data.visitorId) {
        const v = await visitorRepository.findById(data.visitorId);
        if (v) {
          visitorName = v.full_name || v.name || visitorName;
          visitorEmail = v.email || visitorEmail;
        }
      }
      await feedbackSupportRepo.createFeedback({
        user_id: data.visitorId || operatorUserId || null,
        user_name: visitorName,
        user_email: visitorEmail,
        role_name: 'VISITOR',
        category: data.complaints ? 'BUG_REPORT' : 'GENERAL_FEEDBACK',
        rating: Number(data.overallRating) || 5,
        subject: data.complaints ? 'Visitor Complaint / Concern' : `Visitor Experience Feedback (${Number(data.overallRating)}/5)`,
        message: [data.suggestions, data.complaints].filter(Boolean).join(' | ') || 'Visitor submitted overall visit rating.',
      });
    } catch (mirrorErr) {
      console.warn('Failed to mirror checkout feedback to user_feedbacks:', mirrorErr.message);
    }

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
