// Mock Settings Repository and Datastore

let mockSettings = {
  general: {
    orgCode: 'VMS',
    defaultLanguage: 'en',
    defaultCountry: 'Ethiopia',
    defaultCurrency: 'ETB',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    timeZone: 'Africa/Addis_Ababa',
    businessWeekStart: 'Monday',
    fiscalYearStart: 'July'
  },
  localization: {
    language: 'en',
    country: 'Ethiopia',
    currency: 'ETB',
    numberFormat: '1,234,567.89',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    firstDayOfWeek: 'Monday',
    timeZone: 'Africa/Addis_Ababa'
  },
  visitor: {
    allowWalkIn: true,
    requireAppointment: false,
    photoRequired: true,
    govIdRequired: true,
    selfRegEnabled: true,
    qrEnabled: true,
    defaultPassDuration: 8, // hours
    maxVisitorsPerDay: 500
  },
  security: {
    sessionTimeout: 30, // minutes
    autoLogoutTime: 15, // minutes
    passwordExpiration: 90, // days
    maxLoginAttempts: 5,
    deviceRestrictions: false,
    ipRestrictions: '',
    securityAlerts: true,
    twoFactorAuth: false
  },
  notifications: {
    email: {
      visitorRegistration: true,
      appointmentApproval: true,
      checkIn: true,
      checkOut: true,
      passExpiration: true,
      emergencyAlerts: true
    },
    sms: {
      visitorRegistration: false,
      appointmentApproval: true,
      checkIn: true,
      checkOut: false,
      passExpiration: false,
      emergencyAlerts: true
    },
    push: {
      visitorRegistration: true,
      appointmentApproval: true,
      checkIn: true,
      checkOut: true,
      passExpiration: true,
      emergencyAlerts: true
    },
    inApp: {
      visitorRegistration: true,
      appointmentApproval: true,
      checkIn: true,
      checkOut: true,
      passExpiration: true,
      emergencyAlerts: true
    }
  },
  numbering: {
    visitorIdPrefix: 'VIS',
    employeeIdPrefix: 'EMP',
    appointmentPrefix: 'APP',
    visitorPassPrefix: 'PASS',
    referenceNumberPrefix: 'REF',
    organizationPrefix: 'ORG'
  },
  integrations: {
    emailProvider: 'smtp.gmail.com',
    smsProvider: 'Twilio Gateway',
    qrCodeService: 'Internal Generator',
    restApiEndpoint: 'https://api.visitor.com/v1',
    webhookUrl: 'https://hooks.visitor.com/events',
    ldapActiveDirectory: ''
  },
  retention: {
    visitorRecordRetention: 365, // days
    auditLogRetention: 180, // days
    documentRetention: 365, // days
    automaticArchive: true,
    automaticDeletion: false,
    privacyNoticeVersion: 'v2.1'
  },
  features: {
    selfRegistration: true,
    qrPass: true,
    multiBranch: true,
    vehicleManagement: false,
    emergencyMode: false,
    analyticsDashboard: true,
    facialRecognition: false
  }
};

let mockHistory = [
  { id: 1, setting: 'General: defaultCurrency', prevValue: 'USD', newValue: 'ETB', changedBy: 'System Administrator', date: '2026-07-20T10:00:00Z', reason: 'Aligning localization rules with Headquarters' },
  { id: 2, setting: 'Features: facialRecognition', prevValue: 'true', newValue: 'false', changedBy: 'System Administrator', date: '2026-07-21T08:30:00Z', reason: 'Deactivating facial recognition module for privacy standard compliance' }
];

let mockBackups = [
  { id: 1, date: '2026-07-15T09:00:00Z', size: '4.2 KB', createdBy: 'System Administrator', status: 'COMPLETED' },
  { id: 2, date: '2026-07-20T17:30:00Z', size: '4.5 KB', createdBy: 'System Administrator', status: 'COMPLETED' }
];

class MockSettingsRepository {
  async getSettings() {
    return mockSettings;
  }

  async getCategorySettings(category) {
    return mockSettings[category] || null;
  }

  async updateCategorySettings(category, data, username) {
    if (!mockSettings[category]) {
      mockSettings[category] = {};
    }
    const prev = { ...mockSettings[category] };
    mockSettings[category] = { ...mockSettings[category], ...data };

    // Generate history rows
    for (const key of Object.keys(data)) {
      if (prev[key] !== data[key]) {
        mockHistory.push({
          id: mockHistory.length + 1,
          setting: `${category}:${key}`,
          prevValue: String(prev[key] !== undefined ? prev[key] : 'N/A'),
          newValue: String(data[key]),
          changedBy: username || 'System Administrator',
          date: new Date().toISOString(),
          reason: 'Configuration Profile Update'
        });
      }
    }
    return mockSettings[category];
  }

  async getHistory() {
    return mockHistory;
  }

  async getBackups() {
    return mockBackups;
  }

  async createBackup(username) {
    const newB = {
      id: mockBackups.length + 1,
      date: new Date().toISOString(),
      size: `${(Math.random() * 2 + 3).toFixed(1)} KB`,
      createdBy: username || 'System Administrator',
      status: 'COMPLETED',
      snapshot: JSON.parse(JSON.stringify(mockSettings)) // deep copy
    };
    mockBackups.push(newB);
    return newB;
  }

  async restoreBackup(id, username) {
    const backup = mockBackups.find(b => b.id === Number(id));
    if (!backup) return false;
    if (backup.snapshot) {
      mockSettings = JSON.parse(JSON.stringify(backup.snapshot));
    }
    mockHistory.push({
      id: mockHistory.length + 1,
      setting: 'System: Backup Restore',
      prevValue: 'Active Profile',
      newValue: `Backup snapshot ID ${id}`,
      changedBy: username || 'System Administrator',
      date: new Date().toISOString(),
      reason: `System state restored to backup dated ${backup.date}`
    });
    return true;
  }

  async deleteBackup(id) {
    mockBackups = mockBackups.filter(b => b.id !== Number(id));
    return true;
  }
}

module.exports = new MockSettingsRepository();
