// src/services/reception/ReceptionPreferenceService.js
// Preferences Service for Reception Staff

const { auditLog } = require('../../../utils/audit');

let rcpPreferencesMap = new Map();

class ReceptionPreferenceService {
  async getPreferences(scope) {
    if (!rcpPreferencesMap.has(scope.receptionUserId)) {
      rcpPreferencesMap.set(scope.receptionUserId, {
        emailEnabled: true,
        browserEnabled: true,
        desktopEnabled: true,
        soundEnabled: true,
        soundVolume: 80,
        quietHours: {
          enabled: false,
          startTime: '20:00',
          endTime: '06:00'
        },
        emergencyBypassQuietHours: true,
        language: 'en',
        timeZone: 'UTC+03:00',
        toastPosition: 'top_right'
      });
    }
    return rcpPreferencesMap.get(scope.receptionUserId);
  }

  async updatePreferences(updatedData, scope) {
    const current = await this.getPreferences(scope);
    const merged = { ...current, ...updatedData };
    rcpPreferencesMap.set(scope.receptionUserId, merged);

    await auditLog({
      userId: scope.receptionUserId,
      entity: 'reception_preferences',
      action: 'update_preferences',
      details: { soundEnabled: merged.soundEnabled, quietHoursEnabled: merged.quietHours.enabled }
    });

    return merged;
  }
}

module.exports = new ReceptionPreferenceService();
