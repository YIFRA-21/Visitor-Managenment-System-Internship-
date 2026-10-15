// src/services/security/SecurityPreferenceService.js
// Preferences Service for Security Staff

const { auditLog } = require('../../../utils/audit');

let secPreferencesMap = new Map();

class SecurityPreferenceService {
  async getPreferences(scope) {
    if (!secPreferencesMap.has(scope.securityUserId)) {
      secPreferencesMap.set(scope.securityUserId, {
        emailEnabled: true,
        browserEnabled: true,
        desktopEnabled: true,
        soundEnabled: true,
        soundVolume: 100,
        quietHours: {
          enabled: false,
          startTime: '00:00',
          endTime: '05:00'
        },
        emergencyBypassQuietHours: true,
        language: 'en',
        timeZone: 'UTC+03:00',
        toastPosition: 'top_right'
      });
    }
    return secPreferencesMap.get(scope.securityUserId);
  }

  async updatePreferences(updatedData, scope) {
    const current = await this.getPreferences(scope);
    const merged = { ...current, ...updatedData };
    secPreferencesMap.set(scope.securityUserId, merged);

    await auditLog({
      userId: scope.securityUserId,
      entity: 'security_preferences',
      action: 'update_preferences',
      details: { soundEnabled: merged.soundEnabled, volume: merged.soundVolume }
    });

    return merged;
  }
}

module.exports = new SecurityPreferenceService();
