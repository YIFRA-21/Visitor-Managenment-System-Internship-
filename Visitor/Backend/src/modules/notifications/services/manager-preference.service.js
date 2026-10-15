// src/services/manager/ManagerPreferenceService.js
// Manager Preferences Service with quiet-hours and emergency bypass rules

const { auditLog } = require('../../../utils/audit');

let preferencesMap = new Map();

class ManagerPreferenceService {
  async getPreferences(scope) {
    if (!preferencesMap.has(scope.managerId)) {
      preferencesMap.set(scope.managerId, {
        emailEnabled: true,
        browserEnabled: true,
        desktopEnabled: true,
        soundEnabled: true,
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '07:00'
        },
        emergencyBypassQuietHours: true,
        language: 'en',
        timeZone: 'UTC+03:00',
        reminderFrequency: 'every_30_mins',
        digestFrequency: 'daily'
      });
    }
    return preferencesMap.get(scope.managerId);
  }

  async updatePreferences(updatedData, scope) {
    const current = await this.getPreferences(scope);
    const merged = { ...current, ...updatedData };
    preferencesMap.set(scope.managerId, merged);

    await auditLog({
      userId: scope.managerId,
      entity: 'manager_preferences',
      action: 'update_preferences',
      details: { quietHoursEnabled: merged.quietHours.enabled }
    });

    return merged;
  }
}

module.exports = new ManagerPreferenceService();
