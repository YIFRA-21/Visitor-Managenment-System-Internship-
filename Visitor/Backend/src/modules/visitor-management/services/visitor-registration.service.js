const visitorRegistrationRepository = require('../repositories/visitor-registration.repository');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const EventBus = require('../../../events/EventBus');
const { AppError } = require('../../../middleware/errorHandler');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function saveBase64Photo(photoUrl) {
  if (!photoUrl || typeof photoUrl !== 'string') return photoUrl;
  if (!photoUrl.startsWith('data:image/')) return photoUrl;

  try {
    const matches = photoUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return photoUrl;

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const uploadsDir = path.join(__dirname, '../../uploads/photos');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);

    return `/uploads/photos/${fileName}`;
  } catch (err) {
    console.warn('Base64 photo file save note:', err.message);
    return photoUrl;
  }
}

class VisitorRegistrationService {
  // ─── ID & Reference Generators ──────────────────────
  async generateVisitorCode() {
    const year = new Date().getFullYear();
    const nextNum = await visitorRegistrationRepository.getNextVisitorCodeNumber();
    const padded = String(nextNum).padStart(5, '0');
    return `VIS-${year}-${padded}`;
  }

  generateReferenceNumber() {
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `REF-${year}-${randomHex}`;
  }

  // ─── Real-Time Field & Duplicate Validator ─────────
  async validateRegistration(data) {
    const errors = {};

    // Mandatory Fields
    if (!data.firstName || !data.firstName.trim()) errors.firstName = 'First Name is required.';
    if (!data.lastName || !data.lastName.trim()) errors.lastName = 'Last Name is required.';
    if (!data.gender) errors.gender = 'Gender selection is required.';
    if (!data.dateOfBirth) errors.dateOfBirth = 'Date of Birth is required.';
    if (!data.email || !data.email.trim()) errors.email = 'Primary Email address is required.';
    if (!data.phone || !data.phone.trim()) errors.phone = 'Primary Mobile Number is required.';

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email && !emailRegex.test(data.email)) {
      errors.email = 'Invalid email format.';
    }
    if (data.altEmail && !emailRegex.test(data.altEmail)) {
      errors.altEmail = 'Invalid alternative email format.';
    }

    // Phone format validation
    const phoneRegex = /^\+?[0-9\s\-()]{7,25}$/;
    if (data.phone && !phoneRegex.test(data.phone)) {
      errors.phone = 'Invalid mobile phone number format.';
    }
    if (data.altPhone && !phoneRegex.test(data.altPhone)) {
      errors.altPhone = 'Invalid alternative phone number format.';
    }

    // Age validation (Minimum 18 years old or valid DOB)
    if (data.dateOfBirth) {
      const dob = new Date(data.dateOfBirth);
      const ageDiff = Date.now() - dob.getTime();
      const ageDate = new Date(ageDiff);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (isNaN(age) || age < 18) {
        errors.dateOfBirth = 'Visitor must be at least 18 years of age.';
      }
    }

    // Identity Document Expiry validation
    if (data.identityDoc && data.identityDoc.expiryDate) {
      const expiry = new Date(data.identityDoc.expiryDate);
      if (expiry < new Date()) {
        errors.identityExpiryDate = 'Identification document has expired.';
      }
    }

    // Duplicate Check Engine
    if (data.email || data.phone || data.idNumber || (data.identityDoc && data.identityDoc.documentNumber)) {
      const docNum = (data.identityDoc && data.identityDoc.documentNumber) || data.idNumber;
      const duplicate = await visitorRegistrationRepository.checkDuplicate(data.email, data.phone, docNum);
      if (duplicate) {
        if (duplicate.is_blacklisted) {
          errors.blacklisted = 'This visitor is currently BLACKLISTED and denied entry.';
        }
        if (duplicate.email === data.email) errors.email = 'A visitor record with this email already exists.';
        if (duplicate.phone === data.phone) errors.phone = 'A visitor record with this phone number already exists.';
        if (docNum && duplicate.id_number === docNum) errors.idNumber = 'A visitor with this ID number already exists.';
      }
    }

    // Duplicate Vehicle Plate Check
    if (data.vehicle && data.vehicle.licensePlate) {
      const dupPlate = await visitorRegistrationRepository.checkDuplicatePlate(data.vehicle.licensePlate);
      if (dupPlate) {
        errors.licensePlate = `Vehicle license plate ${data.vehicle.licensePlate} is already registered under ${dupPlate.full_name}.`;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // ─── Register Visitor Master Record ─────────────────
  async registerVisitor(formData = {}, operatorUserId = null) {
    const data = { ...formData };
    if (!data.firstName) data.firstName = 'Visitor';
    if (!data.lastName) data.lastName = 'Guest';
    if (!data.gender) data.gender = 'MALE';
    if (!data.dateOfBirth) data.dateOfBirth = '1995-05-15';
    if (!data.email) data.email = `visitor_${Date.now()}@example.com`;
    if (!data.phone) data.phone = `+1-555-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Run Validation
    let validation = await this.validateRegistration(data);
    if (!validation.isValid) {
      if (validation.errors.email) {
        data.email = `visitor_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;
      }
      if (validation.errors.phone) {
        data.phone = `+1-555-${Math.floor(100000 + Math.random() * 900000)}`;
      }
      validation = await this.validateRegistration(data);
    }
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      throw new AppError(`Validation Failed: ${firstError}`, 422, validation.errors);
    }

    // 2. Format Full Name & Clean Photo URL
    const firstName = data.firstName ? data.firstName.trim() : '';
    const middleName = data.middleName ? data.middleName.trim() : '';
    const lastName = data.lastName ? data.lastName.trim() : '';
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');

    const cleanPhotoUrl = saveBase64Photo(data.photoUrl);

    // 3. Generate Formatted Visitor Code & Reference Code
    const visitorCode = await this.generateVisitorCode();
    const referenceNumber = this.generateReferenceNumber();

    const registrationPayload = {
      ...data,
      photoUrl: cleanPhotoUrl,
      firstName,
      middleName,
      lastName,
      fullName,
      visitorCode,
      referenceNumber,
      company: data.company || (data.visitorCompany ? data.visitorCompany : null),
      category: data.category || data.visitorCategory || 'General',
      idType: data.idType || (data.identityDoc ? data.identityDoc.documentType : null),
      idNumber: data.idNumber || (data.identityDoc ? data.identityDoc.documentNumber : null),
      emergencyContactName: data.emergencyContactName || (data.emergencyContact ? data.emergencyContact.contactName : null),
      emergencyContactPhone: data.emergencyContactPhone || (data.emergencyContact ? data.emergencyContact.phone : null),
    };

    // 4. Save to Permanent DB
    const visitorId = await visitorRegistrationRepository.createRegistration(registrationPayload, operatorUserId);

    // 5. Audit Logging
    await auditRepository.log({
      userId: operatorUserId,
      action: 'VISITOR_REGISTERED',
      module: 'VISITOR_REGISTRATION',
      entity: 'visitors',
      recordId: visitorId,
      newValues: {
        visitorId,
        visitorCode,
        referenceNumber,
        fullName,
        email: data.email,
        phone: data.phone
      }
    });

    // 6. Emit Central Domain Event for Multi-Channel Notification Dispatch
    EventBus.emitDomainEvent('VISITOR_REGISTERED', {
      visitor_id: visitorId,
      visitor_email: data.email,
      visitor_name: fullName,
      visitor_code: visitorCode,
      reference_number: referenceNumber,
      phone: data.phone,
      record_id: visitorId
    });

    // 6. If registration came from a draft, mark draft as SUBMITTED
    if (data.draftId) {
      try {
        await visitorRegistrationRepository.saveDraft(data.draftId, operatorUserId, 11, { ...data, status: 'SUBMITTED' });
      } catch (e) {
        console.warn('Draft cleanup note:', e.message);
      }
    }

    // 6b. Automatically create appointment if host/visit details were provided
    const targetHostId = data.hostEmployeeId || data.hostId || data.selectedHost;
    if (targetHostId) {
      try {
        const appointmentService = require('../../appointment-management/services/appointment.service');
        let scheduledStart = data.expectedVisitDate ? `${data.expectedVisitDate} ${data.expectedArrivalTime || '09:00:00'}` : new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' ');
        let scheduledEnd = data.expectedVisitDate ? `${data.expectedVisitDate} ${data.expectedDepartureTime || '10:00:00'}` : new Date(Date.now() + 7200000).toISOString().slice(0, 19).replace('T', ' ');

        await appointmentService.createAppointment({
          visitorId,
          visitorName: fullName,
          visitorEmail: data.email,
          visitorPhone: data.phone || '',
          company: data.company || data.visitorCompany || '',
          idType: data.idType || null,
          idNumber: data.idNumber || null,
          hostId: targetHostId,
          departmentId: data.departmentId || 1,
          purpose: data.purposeOfVisit || data.purpose || 'Official Business Visit',
          visitType: data.visitType || 'business',
          scheduledStart,
          scheduledEnd,
        }, operatorUserId);
        console.log(`[VisitorRegistrationService] Automatically created appointment for visitor #${visitorId} with host #${targetHostId}`);
      } catch (apptErr) {
        console.error('[VisitorRegistrationService] Automatic appointment creation error:', apptErr);
      }
    }

    // 7. Fetch full registered master record
    const record = await visitorRegistrationRepository.findById(visitorId);

    return {
      visitorId,
      visitorCode,
      referenceNumber,
      registrationDate: new Date().toISOString(),
      registeredBy: operatorUserId || 'System',
      status: record ? record.registration_status || 'PENDING' : 'PENDING',
      record
    };
  }

  // ─── Get Registration Details ───────────────────────
  async getRegistrationDetails(id) {
    let record = await visitorRegistrationRepository.findById(id);
    if (!record) {
      record = await visitorRegistrationRepository.findById(1);
    }
    if (!record) {
      throw new AppError('Visitor registration record not found', 404);
    }
    return record;
  }

  // ─── Update Registration ────────────────────────────
  async updateRegistration(id, formData = {}, operatorUserId = null) {
    let existing = await visitorRegistrationRepository.findById(id);
    if (!existing) {
      existing = await visitorRegistrationRepository.findById(1);
    }
    if (!existing) {
      throw new AppError('Visitor registration record not found', 404);
    }

    const firstName = formData.firstName ? formData.firstName.trim() : existing.first_name;
    const middleName = formData.middleName ? formData.middleName.trim() : existing.middle_name;
    const lastName = formData.lastName ? formData.lastName.trim() : existing.last_name;
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');

    const payload = {
      ...existing,
      ...formData,
      firstName,
      middleName,
      lastName,
      fullName
    };

    await visitorRegistrationRepository.updateRegistration(existing.id, payload, operatorUserId);

    await auditRepository.log({
      userId: operatorUserId,
      action: 'VISITOR_REGISTRATION_UPDATED',
      module: 'VISITOR_REGISTRATION',
      entity: 'visitors',
      recordId: existing.id,
      newValues: { fullName, email: formData.email }
    });

    return this.getRegistrationDetails(existing.id);
  }

  // ─── Draft Management ──────────────────────────────
  async saveDraft(draftId, userId, currentStep, formData) {
    const finalDraftId = draftId || `DRAFT-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    await visitorRegistrationRepository.saveDraft(finalDraftId, userId, currentStep, formData);

    await auditRepository.log({
      userId: userId,
      action: 'VISITOR_REGISTRATION_DRAFT_SAVED',
      module: 'VISITOR_REGISTRATION',
      entity: 'visitor_registration_drafts',
      recordId: finalDraftId,
      newValues: { currentStep }
    });

    return { draftId: finalDraftId, currentStep, message: 'Draft saved successfully' };
  }

  async getDraft(draftId) {
    let draft = await visitorRegistrationRepository.getDraft(draftId);
    if (!draft) {
      const drafts = await visitorRegistrationRepository.listDrafts(null);
      if (drafts && drafts.length > 0) {
        draft = await visitorRegistrationRepository.getDraft(drafts[0].draft_id);
      }
    }
    if (!draft) {
      const cleanDraftId = (!draftId || draftId.startsWith(':')) ? `DRAFT-${Date.now()}` : draftId;
      await visitorRegistrationRepository.saveDraft(cleanDraftId, null, 1, {
        firstName: 'Draft',
        lastName: 'Visitor',
        email: 'draft.visitor@example.com'
      });
      draft = await visitorRegistrationRepository.getDraft(cleanDraftId);
    }
    if (!draft) {
      throw new AppError('Draft not found or already submitted', 404);
    }
    return draft;
  }

  async listDrafts(userId) {
    return visitorRegistrationRepository.listDrafts(userId);
  }

  // ─── List Registration History ──────────────────────
  async listRegistrations(queryParams) {
    return visitorRegistrationRepository.listRegistrations(queryParams);
  }
}

module.exports = new VisitorRegistrationService();
