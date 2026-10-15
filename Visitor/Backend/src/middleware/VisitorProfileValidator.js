/**
 * VisitorProfileValidator
 * Input validation for Module 4.3 – Visitor Profile Management
 */

const { AppError } = require('./errorHandler');

class VisitorProfileValidator {
  static validateUpdateProfile(req, res, next) {
    const { email, phone, firstName, lastName, dateOfBirth } = req.body;

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return next(new AppError('Invalid email address format.', 400));
      }
    }

    if (phone) {
      const phoneRegex = /^\+?[0-9\s\-()]{7,25}$/;
      if (!phoneRegex.test(phone)) {
        return next(new AppError('Invalid phone number format. Must contain 7 to 25 digits.', 400));
      }
    }

    if (firstName !== undefined && (!firstName || !firstName.trim())) {
      return next(new AppError('First name cannot be empty.', 400));
    }

    if (lastName !== undefined && (!lastName || !lastName.trim())) {
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
    const { status, reason } = req.body;
    const validStatuses = ['PENDING', 'VERIFIED', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED', 'ARCHIVED'];

    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return next(new AppError(`Invalid status. Allowed values: ${validStatuses.join(', ')}`, 400));
    }

    if ((status.toUpperCase() === 'SUSPENDED' || status.toUpperCase() === 'BLACKLISTED') && (!reason || !reason.trim())) {
      return next(new AppError('A valid reason is required when suspending or blacklisting a visitor.', 400));
    }

    next();
  }

  static validateNote(req, res, next) {
    const { content, noteType } = req.body;

    if (!content || !content.trim()) {
      return next(new AppError('Note content cannot be empty.', 400));
    }

    const validNoteTypes = ['SECURITY', 'RECEPTION', 'COMPLIANCE', 'ADMINISTRATIVE', 'VIP', 'INTERNAL', 'CORRECTION', 'SYSTEM'];
    if (noteType && !validNoteTypes.includes(noteType.toUpperCase())) {
      return next(new AppError(`Invalid note type. Allowed values: ${validNoteTypes.join(', ')}`, 400));
    }

    next();
  }

  static validatePhotoUpload(req, res, next) {
    const { photoData, photoUrl } = req.body;

    if (!photoData && !photoUrl && (!req.file || !req.file.path)) {
      return next(new AppError('Photo payload or image file is required.', 400));
    }

    next();
  }
}

module.exports = VisitorProfileValidator;
