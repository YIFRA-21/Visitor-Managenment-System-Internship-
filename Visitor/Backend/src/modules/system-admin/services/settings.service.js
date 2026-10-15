const mockRepo = require('../repositories/settings.repository');

class SettingsService {
  async getFullSettings() {
    return await mockRepo.getSettings();
  }

  async getCategory(category) {
    return await mockRepo.getCategorySettings(category);
  }

  async updateCategory(category, data, username, userRole) {
    if (userRole !== 'admin' && userRole !== 'system_administrator') {
      const err = new Error('Access Denied: Only Admins can modify settings.');
      err.status = 403;
      throw err;
    }
    // Validation rules checks before saving
    this.validateCategory(category, data);

    return await mockRepo.updateCategorySettings(category, data, username);
  }

  async runValidationAudit() {
    const s = await mockRepo.getSettings();
    const issues = [];
    let passedCount = 0;
    let failedCount = 0;

    // Check 1: Duplicate Prefix checks
    const prefixes = [
      s.numbering.visitorIdPrefix,
      s.numbering.employeeIdPrefix,
      s.numbering.appointmentPrefix,
      s.numbering.visitorPassPrefix,
      s.numbering.referenceNumberPrefix
    ];
    const duplicates = prefixes.filter((item, index) => prefixes.indexOf(item) !== index);
    if (duplicates.length > 0) {
      failedCount++;
      issues.push({
        code: 'DUPLICATE_PREFIXES',
        severity: 'FAILED',
        target: 'Numbering Configurations',
        message: `Duplicate ID prefix codes found: ${duplicates.join(', ')}.`,
        suggestion: 'Modify numbering prefix values to ensure distinct, unique ID templates.'
      });
    } else {
      passedCount++;
    }

    // Check 2: Valid TimeZone check
    const validTzs = ['Africa/Addis_Ababa', 'UTC', 'Europe/London', 'America/New_York', 'Asia/Dubai'];
    if (!validTzs.includes(s.general.timeZone) || !validTzs.includes(s.localization.timeZone)) {
      failedCount++;
      issues.push({
        code: 'INVALID_TIME_ZONE',
        severity: 'FAILED',
        target: 'TimeZone Mappings',
        message: 'A non-standard Time Zone identifier is configured in General/Localization.',
        suggestion: 'Set Time Zone to a valid standard offset (e.g. Africa/Addis_Ababa).'
      });
    } else {
      passedCount++;
    }

    // Check 3: Retention bounds check
    if (s.retention.visitorRecordRetention < 90) {
      failedCount++;
      issues.push({
        code: 'INVALID_RETENTION_PERIOD',
        severity: 'FAILED',
        target: 'Data Retention Settings',
        message: `Visitor Record Retention (${s.retention.visitorRecordRetention} days) is less than the minimum security policy limit of 90 days.`,
        suggestion: 'Update Visitor retention time frame to be at least 90 days.'
      });
    } else {
      passedCount++;
    }

    // Check 4: Check if Integrations lack configurations
    if (!s.integrations.emailProvider || !s.integrations.smsProvider) {
      failedCount++;
      issues.push({
        code: 'INTEGRATION_ERRORS',
        severity: 'FAILED',
        target: 'Gateway Providers',
        message: 'Communication SMTP Server or SMS Gateway host names are blank.',
        suggestion: 'Specify valid server names in SMTP/SMS configuration parameters.'
      });
    } else {
      passedCount++;
    }

    return {
      auditTimestamp: new Date().toISOString(),
      summary: {
        totalChecks: 4,
        passed: passedCount,
        failed: failedCount,
        status: failedCount > 0 ? 'FAILED' : 'PASSED'
      },
      issues
    };
  }

  async getHistoryLog() {
    return await mockRepo.getHistory();
  }

  async listBackups() {
    return await mockRepo.getBackups();
  }

  async createBackup(username) {
    return await mockRepo.createBackup(username);
  }

  async restoreBackup(id, username) {
    const success = await mockRepo.restoreBackup(id, username);
    if (!success) {
      const err = new Error(`Backup snapshot ID ${id} was not found.`);
      err.status = 404;
      throw err;
    }
    return { success: true, message: 'Settings profile restored successfully.' };
  }

  async deleteBackup(id) {
    return await mockRepo.deleteBackup(id);
  }

  validateCategory(category, data) {
    if (category === 'general') {
      if (!data.orgCode || !data.defaultLanguage || !data.timeZone) {
        const err = new Error('Validation Error: orgCode, defaultLanguage, and timeZone are required.');
        err.status = 400;
        throw err;
      }
    }
    if (category === 'numbering') {
      if (!data.visitorIdPrefix || !data.employeeIdPrefix || !data.appointmentPrefix) {
        const err = new Error('Validation Error: visitor, employee, and appointment prefix codes are required.');
        err.status = 400;
        throw err;
      }
    }
    if (category === 'retention') {
      if (data.visitorRecordRetention < 30 || data.auditLogRetention < 30) {
        const err = new Error('Validation Error: Minimum data retention period is 30 days.');
        err.status = 400;
        throw err;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // REUSABLE SERVICE INTERFACES FOR FUTURE MODULE INTEGRATIONS
  // ─────────────────────────────────────────────────────────────

  /**
   * Module 4 – Visitor Management (retrieves default photo & walk-in rules)
   */
  async getVisitorManagementDefaults() {
    const s = await mockRepo.getSettings();
    return {
      allowWalkIn: s.visitor.allowWalkIn,
      requireAppointment: s.visitor.requireAppointment,
      photoRequired: s.visitor.photoRequired
    };
  }

  /**
   * Module 5 – Appointment Management (gets booking & checkin thresholds)
   */
  async getAppointmentBookingThresholds() {
    const s = await mockRepo.getSettings();
    return {
      maxVisitorsLimit: s.visitor.maxVisitorsPerDay,
      defaultPassExpiryHours: s.visitor.defaultPassDuration
    };
  }

  /**
   * Module 6 – Approval Workflow (fetches notification rules for triggers)
   */
  async getApprovalRoutingPreferences() {
    const s = await mockRepo.getSettings();
    return {
      notifyOnApproval: s.notifications.email.appointmentApproval,
      smsOnApproval: s.notifications.sms.appointmentApproval
    };
  }

  /**
   * Module 7 – Calendar & Scheduling (checks timezone and first day of week)
   */
  async getRegionalCalendarDefaults() {
    const s = await mockRepo.getSettings();
    return {
      timezone: s.localization.timeZone,
      startOfWeek: s.localization.firstDayOfWeek,
      dateFormat: s.localization.dateFormat
    };
  }

  /**
   * Module 8 – Reception Management (checks self registration active state)
   */
  async getReceptionDeskPreferences() {
    const s = await mockRepo.getSettings();
    return {
      selfRegistrationActive: s.features.selfRegistration,
      qrPassActive: s.features.qrPass
    };
  }

  /**
   * Module 9 – Visitor Pass Management (formats serial number using prefix templates)
   */
  async formatPassSerialNumber(type, index) {
    const s = await mockRepo.getSettings();
    const prefix = type === 'visitor' ? s.numbering.visitorIdPrefix : s.numbering.visitorPassPrefix;
    const year = new Date().getFullYear();
    const formattedIdx = String(index).padStart(6, '0');
    return `${prefix}-${year}-${formattedIdx}`;
  }

  /**
   * Module 10 – Check-In Management (checks photo, badge, & gate parameters)
   */
  async checkinRequirements() {
    const s = await mockRepo.getSettings();
    return {
      badgePhotoRequired: s.visitor.photoRequired,
      badgeGovIdRequired: s.visitor.govIdRequired
    };
  }

  /**
   * Module 11 – Check-Out Management (auto-logs out terminal sessions)
   */
  async getSessionTimeouts() {
    const s = await mockRepo.getSettings();
    return {
      autoLogoutSec: s.security.autoLogoutTime * 60,
      sessionIdleSec: s.security.sessionTimeout * 60
    };
  }

  /**
   * Module 12 – Security & Access Control (checks IP whitelist restrictions)
   */
  async getIpFilterConfig() {
    const s = await mockRepo.getSettings();
    return {
      ipRestrictions: s.security.ipRestrictions || null,
      maxAttempts: s.security.maxLoginAttempts
    };
  }

  /**
   * Module 13 – Notification Management (delivers active channel status)
   */
  async getNotificationDeliveryMapping() {
    const s = await mockRepo.getSettings();
    return s.notifications;
  }

  /**
   * Module 14 – Reporting & Analytics (returns localization settings for layout outputs)
   */
  async getLocalizationFormattingRule() {
    const s = await mockRepo.getSettings();
    return {
      language: s.localization.language,
      currency: s.localization.currency,
      numberFormat: s.localization.numberFormat
    };
  }

  /**
   * Module 15 – Dashboard Management (delivers feature flag list to dashboard panels)
   */
  async getActiveFeatureFlags() {
    const s = await mockRepo.getSettings();
    return s.features;
  }

  /**
   * Module 17 – System Administration (returns backup retention limits)
   */
  async getLogRetentionPeriod() {
    const s = await mockRepo.getSettings();
    return s.retention.auditLogRetention;
  }

  /**
   * Module 18 – Employee Management (formats employee payroll ID using prefix templates)
   */
  async formatEmployeeId(index) {
    const s = await mockRepo.getSettings();
    const prefix = s.numbering.employeeIdPrefix;
    const year = new Date().getFullYear();
    const formattedIdx = String(index).padStart(6, '0');
    return `${prefix}-${year}-${formattedIdx}`;
  }
}

module.exports = new SettingsService();
