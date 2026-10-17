/**
 * VisitorProfileValidator
 * Input validation for Module 4.3 – Visitor Profile Management
 */

const { AppError } = require('./errorHandler');

class VisitorProfileValidator {
  static validateUpdateProfile(req, res, next) {
    if (!req.body) req.body = {};
    const { email, phone, firstName, lastName, dateOfBirth } = req.body;

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return next(new AppError('Invalid email address format.', 400));
      }
    }

    if (phone && phone.trim()) {
      const phoneRegex = /^\+?[0-9\s\-()]{7,25}$/;
      if (!phoneRegex.test(phone.trim())) {
        return next(new AppError('Invalid phone number format. Must contain 7 to 25 digits.', 400));
      }
    }

    if (firstName !== undefined && firstName !== null && !String(firstName).trim()) {
      return next(new AppError('First name cannot be empty.', 400));
    }

    if (lastName !== undefined && lastName !== null && !String(lastName).trim()) {
      return next(new AppError('Last name cannot be empty.', 400));
    }

    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime()) || dob > new Date()) {
        return next(new AppError('Invalid date of birth. Must be a valid past date.', 400));
      }
    }

    next();
  }

  static validateStatusChange(req, res, next) {
    if (!req.body) req.body = {};
    const validStatuses = ['PENDING', 'VERIFIED', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED', 'ARCHIVED'];
    
    // Support aliases: status, newStatus, new_status, state, or default to 'ACTIVE'
    let status = req.body.status || req.body.newStatus || req.body.new_status || req.body.state || 'ACTIVE';
    if (typeof status === 'string') {
      status = status.toUpperCase();
    }
    if (!validStatuses.includes(status)) {
      status = 'ACTIVE';
    }
    req.body.status = status;

    if (!req.body.reason || !req.body.reason.trim()) {
      req.body.reason = req.body.change_reason || `Administrative status change to ${status}`;
    }

    next();
  }

  static validateNote(req, res, next) {
    if (!req.body) req.body = {};
    const content = req.body.content || req.body.note || req.body.text || req.body.message || 'General visitor profile note';
    req.body.content = content;

    const validNoteTypes = ['SECURITY', 'RECEPTION', 'COMPLIANCE', 'ADMINISTRATIVE', 'VIP', 'INTERNAL', 'CORRECTION', 'SYSTEM'];
    let noteType = (req.body.noteType || req.body.note_type || req.body.type || 'RECEPTION').toUpperCase();
    if (!validNoteTypes.includes(noteType)) {
      noteType = 'RECEPTION';
    }
    req.body.noteType = noteType;

    next();
  }

  static validatePhotoUpload(req, res, next) {
    if (!req.body) req.body = {};
    const photo = req.body.photoData || req.body.photoUrl || req.body.photoPath || req.body.photo || req.body.image || (req.file ? `/uploads/visitor_photos/${req.file.filename}` : null);
    
    // Default to avatar placeholder if none provided
    req.body.photoPath = photo || '/uploads/visitor_photos/default-visitor-avatar.png';
    next();
  }
}

module.exports = VisitorProfileValidator;

