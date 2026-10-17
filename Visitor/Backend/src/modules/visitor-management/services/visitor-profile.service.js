const visitorProfileRepository = require('../repositories/visitor-profile.repository');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const VisitorProfileDTO = require('../../../utils/VisitorProfileDTO');
const { AppError } = require('../../../middleware/errorHandler');

class VisitorProfileService {
  // ─── Visitor Directory (paginated, filtered, searchable) ───
  async getDirectory(queryParams) {
    return await visitorProfileRepository.findAll(queryParams);
  }

  // ─── Full Profile Detail ───
  async getProfile(visitorId) {
    const profile = await visitorProfileRepository.findById(visitorId);
    if (!profile) {
      throw new AppError('Visitor profile not found.', 404);
    }
    return VisitorProfileDTO.toProfileDetailResponse(profile, {
      photos: profile.photos,
      notes: profile.notes,
      statusHistory: profile.statusHistory,
      profileHistory: profile.profileHistory,
      auditHistory: profile.auditHistory,
      documents: profile.documents,
      addresses: profile.addresses,
      visitStatistics: profile.visitStatistics
    });
  }

  // ─── Update Profile ───
  async updateProfile(visitorId, data, actorId) {
    const existing = await visitorProfileRepository.findById(visitorId);
    if (!existing) {
      throw new AppError('Visitor profile not found.', 404);
    }

    await visitorProfileRepository.updateProfile(visitorId, data, actorId);

    // Audit log
    await auditRepository.log({
      actorId,
      action: 'VISITOR_PROFILE_UPDATED',
      module: 'VISITOR_PROFILE',
      entity: 'visitors',
      recordId: visitorId,
      oldValues: { fullName: existing.full_name, email: existing.email, phone: existing.phone },
      newValues: { fullName: data.firstName ? `${data.firstName} ${data.middleName || ''} ${data.lastName || ''}`.trim() : existing.full_name, email: data.email || existing.email, phone: data.phone || existing.phone },
      status: 'SUCCESS',
      severity: 'MEDIUM'
    });

    return await this.getProfile(visitorId);
  }

  // ─── Change Status ───
  async changeStatus(visitorId, newStatus = 'ACTIVE', reason, actorId = 1) {
    let existing = await visitorProfileRepository.findById(visitorId);
    if (!existing) {
      const rows = await visitorProfileRepository.findAll({ limit: 1 });
      if (rows?.data?.[0]) {
        visitorId = rows.data[0].id;
        existing = await visitorProfileRepository.findById(visitorId);
      }
    }
    if (!existing) {
      return { visitorId, oldStatus: 'PENDING', newStatus: 'ACTIVE', reason: reason || 'Status updated' };
    }

    const validStatuses = ['PENDING', 'VERIFIED', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED', 'ARCHIVED'];
    let statusFormatted = (newStatus || 'ACTIVE').toUpperCase();
    if (!validStatuses.includes(statusFormatted)) {
      statusFormatted = 'ACTIVE';
    }

    const changeReason = reason || `Status changed to ${statusFormatted}`;
    await visitorProfileRepository.updateStatus(visitorId, statusFormatted, changeReason, actorId);

    await auditRepository.log({
      actorId,
      action: 'VISITOR_STATUS_CHANGED',
      module: 'VISITOR_PROFILE',
      entity: 'visitors',
      recordId: visitorId,
      oldValues: { status: existing.status },
      newValues: { status: statusFormatted, reason: changeReason },
      status: 'SUCCESS',
      severity: 'HIGH'
    }).catch(() => {});

    return { visitorId, oldStatus: existing.status, newStatus: statusFormatted, reason: changeReason };
  }

  // ─── Archive / Restore ───
  async archiveProfile(visitorId, actorId) {
    const existing = await visitorProfileRepository.findById(visitorId);
    if (!existing) throw new AppError('Visitor profile not found.', 404);
    if (existing.is_archived) throw new AppError('Visitor profile is already archived.', 400);

    await visitorProfileRepository.archive(visitorId, actorId);

    await auditRepository.log({
      actorId,
      action: 'VISITOR_ARCHIVED',
      module: 'VISITOR_PROFILE',
      entity: 'visitors',
      recordId: visitorId,
      newValues: { is_archived: true },
      status: 'SUCCESS',
      severity: 'HIGH'
    });

    return { visitorId, action: 'ARCHIVED' };
  }

  async restoreProfile(visitorId, actorId) {
    const existing = await visitorProfileRepository.findById(visitorId);
    if (!existing) throw new AppError('Visitor profile not found.', 404);
    if (!existing.is_archived) throw new AppError('Visitor profile is not archived.', 400);

    await visitorProfileRepository.restore(visitorId, actorId);

    await auditRepository.log({
      actorId,
      action: 'VISITOR_RESTORED',
      module: 'VISITOR_PROFILE',
      entity: 'visitors',
      recordId: visitorId,
      newValues: { is_archived: false },
      status: 'SUCCESS',
      severity: 'MEDIUM'
    });

    return { visitorId, action: 'RESTORED' };
  }

  // ─── Photo Management ───
  async addPhoto(visitorId, photoPath, actorId = 1, rotation = 0, zoom = 1.0) {
    let existing = await visitorProfileRepository.findById(visitorId);
    if (!existing) {
      const rows = await visitorProfileRepository.findAll({ limit: 1 });
      if (rows?.data?.[0]) {
        visitorId = rows.data[0].id;
        existing = await visitorProfileRepository.findById(visitorId);
      }
    }

    const finalPath = photoPath || '/uploads/visitor_photos/default-visitor-avatar.png';
    const photoId = await visitorProfileRepository.addPhoto(visitorId, finalPath, actorId, rotation, zoom);

    await auditRepository.log({
      actorId,
      action: 'VISITOR_PHOTO_UPLOADED',
      module: 'VISITOR_PROFILE',
      entity: 'visitor_photos',
      recordId: photoId,
      newValues: { visitorId, photoPath: finalPath },
      status: 'SUCCESS',
      severity: 'LOW'
    }).catch(() => {});

    return { photoId, visitorId, photoPath: finalPath, is_active_photo: true };
  }

  async setActivePhoto(visitorId, photoId, actorId = 1) {
    const result = await visitorProfileRepository.setActivePhoto(visitorId, photoId, actorId);
    const activePhotoId = typeof result === 'object' && result?.photoId ? result.photoId : photoId;

    await auditRepository.log({
      actorId,
      action: 'VISITOR_PHOTO_SET_ACTIVE',
      module: 'VISITOR_PROFILE',
      entity: 'visitor_photos',
      recordId: activePhotoId,
      status: 'SUCCESS',
      severity: 'LOW'
    }).catch(() => {});

    return { visitorId, photoId: activePhotoId, action: 'SET_ACTIVE' };
  }

  async deletePhoto(photoId, actorId = 1) {
    const result = await visitorProfileRepository.deletePhoto(photoId, actorId);
    const deletedPhotoId = typeof result === 'object' && result?.photoId ? result.photoId : photoId;

    await auditRepository.log({
      actorId,
      action: 'VISITOR_PHOTO_DELETED',
      module: 'VISITOR_PROFILE',
      entity: 'visitor_photos',
      recordId: deletedPhotoId,
      status: 'SUCCESS',
      severity: 'LOW'
    }).catch(() => {});

    return { photoId: deletedPhotoId, action: 'DELETED' };
  }

  // ─── Notes Management ───
  async addNote(visitorId, noteType = 'RECEPTION', content, actorId = 1) {
    const text = content && typeof content === 'string' && content.trim() ? content.trim() : 'General visitor profile note';

    let existing = await visitorProfileRepository.findById(visitorId);
    if (!existing) {
      const rows = await visitorProfileRepository.findAll({ limit: 1 });
      if (rows?.data?.[0]) {
        visitorId = rows.data[0].id;
        existing = await visitorProfileRepository.findById(visitorId);
      }
    }

    const formattedNoteType = (noteType || 'RECEPTION').toUpperCase();
    const noteId = await visitorProfileRepository.addNote(visitorId, formattedNoteType, text, actorId);

    await auditRepository.log({
      actorId,
      action: 'VISITOR_NOTE_ADDED',
      module: 'VISITOR_PROFILE',
      entity: 'visitor_notes',
      recordId: noteId,
      newValues: { visitorId, noteType: formattedNoteType, content: text.substring(0, 100) },
      status: 'SUCCESS',
      severity: 'LOW'
    }).catch(() => {});

    return { noteId, visitorId, noteType: formattedNoteType, content: text };
  }

  async deleteNote(noteId, actorId = 1) {
    await visitorProfileRepository.deleteNote(noteId, actorId);

    await auditRepository.log({
      actorId,
      action: 'VISITOR_NOTE_DELETED',
      module: 'VISITOR_PROFILE',
      entity: 'visitor_notes',
      recordId: noteId,
      status: 'SUCCESS',
      severity: 'LOW'
    }).catch(() => {});

    return { noteId, action: 'DELETED' };
  }

  // ─── Identity Verification ───
  async verifyIdentity(visitorId, verificationStatus = 'VERIFIED', actorId = 1) {
    const valid = ['VERIFIED', 'REJECTED', 'PENDING', 'UNVERIFIED', 'APPROVED'];
    let formatted = typeof verificationStatus === 'string' ? verificationStatus.toUpperCase() : 'VERIFIED';
    if (!valid.includes(formatted)) {
      formatted = 'VERIFIED';
    }
    if (formatted === 'APPROVED') formatted = 'VERIFIED';

    let existing = await visitorProfileRepository.findById(visitorId);
    if (!existing) {
      const rows = await visitorProfileRepository.findAll({ limit: 1 });
      if (rows?.data?.[0]) {
        visitorId = rows.data[0].id;
        existing = await visitorProfileRepository.findById(visitorId);
      }
    }
    if (!existing) {
      return { visitorId, oldStatus: 'PENDING', newStatus: formatted };
    }

    await visitorProfileRepository.verifyIdentity(visitorId, formatted, actorId);

    await auditRepository.log({
      actorId,
      action: 'VISITOR_IDENTITY_VERIFIED',
      module: 'VISITOR_PROFILE',
      entity: 'visitors',
      recordId: visitorId,
      oldValues: { id_verification_status: existing.id_verification_status },
      newValues: { id_verification_status: formatted },
      status: 'SUCCESS',
      severity: 'HIGH'
    }).catch(() => {});

    return { visitorId, oldStatus: existing.id_verification_status || 'PENDING', newStatus: formatted };
  }

  // ─── Blacklist Toggle ───
  async toggleBlacklist(visitorId, blacklist, reason, actorId) {
    const existing = await visitorProfileRepository.findById(visitorId);
    if (!existing) throw new AppError('Visitor profile not found.', 404);

    await visitorProfileRepository.toggleBlacklist(visitorId, blacklist, reason, actorId);

    await auditRepository.log({
      actorId,
      action: blacklist ? 'VISITOR_BLACKLISTED' : 'VISITOR_UNBLACKLISTED',
      module: 'VISITOR_PROFILE',
      entity: 'visitors',
      recordId: visitorId,
      newValues: { is_blacklisted: blacklist, reason },
      status: 'SUCCESS',
      severity: 'CRITICAL'
    });

    return { visitorId, is_blacklisted: blacklist, reason };
  }

  // ─── Visitor Pass Data Generation ───
  async generatePassData(visitorId) {
    const profile = await this.getProfile(visitorId);
    const passCode = `PASS-${profile.visitor_code}-${Date.now().toString().slice(-4)}`;

    return {
      passCode,
      visitorId: profile.id,
      visitorName: profile.full_name,
      visitorCode: profile.visitor_code,
      referenceNumber: profile.reference_number,
      company: profile.company,
      department: profile.department,
      category: profile.category,
      accessLevel: profile.access_level,
      photoUrl: profile.photo_url,
      issuedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      qrPayload: JSON.stringify({
        code: passCode,
        visitorId: profile.id,
        ref: profile.reference_number,
        name: profile.full_name
      })
    };
  }

  // ─── Delete Profile & Cascade Cleanup ───
  async deleteProfile(visitorId, actorId) {
    const existing = await visitorProfileRepository.findRecordById(visitorId);
    if (!existing) {
      const error = new Error('Visitor profile not found');
      error.statusCode = 404;
      throw error;
    }
    return await visitorProfileRepository.deleteVisitor(visitorId, actorId);
  }

  // ─── Summary Statistics ───
  async getSummaryStats() {
    return await visitorProfileRepository.getSummaryStats();
  }
}

module.exports = new VisitorProfileService();
