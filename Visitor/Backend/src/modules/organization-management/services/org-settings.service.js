const orgRepository = require('../repositories/org.repository');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const { AppError } = require('../../../middleware/errorHandler');

class OrgSettingsService {
  async getSettings(id) {
    const org = await orgRepository.findOrgById(id);
    if (!org) {
      throw new AppError('Organization not found', 404);
    }
    
    // Package localized settings keys with safe defaults
    return {
      workingDays: org.working_days ? JSON.parse(org.working_days) : ['mon', 'tue', 'wed', 'thu', 'fri'],
      workingHours: {
        start: org.working_hours_start || '09:00',
        end: org.working_hours_end || '17:00'
      },
      timezone: org.timezone || 'Africa/Addis_Ababa',
      language: org.language || 'en',
      currency: org.currency || 'ETB',
      fiscalYear: org.fiscal_year || 'July - June',
      holidayCalendar: org.holiday_calendar ? JSON.parse(org.holiday_calendar) : []
    };
  }

  async updateSettings(id, settingsData, operatorUserId) {
    const org = await orgRepository.findOrgById(id);
    if (!org) {
      throw new AppError('Organization not found', 404);
    }

    const payload = {};
    if (settingsData.workingDays) {
      payload.working_days = JSON.stringify(settingsData.workingDays);
    }
    if (settingsData.workingHours) {
      payload.working_hours_start = settingsData.workingHours.start;
      payload.working_hours_end = settingsData.workingHours.end;
    }
    if (settingsData.timezone) payload.timezone = settingsData.timezone;
    if (settingsData.language) payload.language = settingsData.language;
    if (settingsData.currency) payload.currency = settingsData.currency;
    if (settingsData.fiscalYear) payload.fiscal_year = settingsData.fiscalYear;
    if (settingsData.holidayCalendar) {
      payload.holiday_calendar = JSON.stringify(settingsData.holidayCalendar);
    }

    await orgRepository.updateOrg(id, {
      ...payload,
      updatedBy: operatorUserId
    });

    await auditRepository.log({
      userId: operatorUserId,
      action: 'ORGANIZATION_SETTINGS_UPDATED',
      module: 'ORGANIZATIONS',
      entity: 'organizations',
      recordId: id,
      newValues: settingsData
    });

    return this.getSettings(id);
  }

  async updateBranding(id, brandingData, operatorUserId) {
    const org = await orgRepository.findOrgById(id);
    if (!org) {
      throw new AppError('Organization not found', 404);
    }

    const payload = {};
    if (brandingData.logoUrl || brandingData.logo_url) payload.logo_url = brandingData.logoUrl || brandingData.logo_url;
    if (brandingData.faviconUrl || brandingData.favicon_url) payload.favicon_url = brandingData.faviconUrl || brandingData.favicon_url;
    if (brandingData.primaryColor || brandingData.primary_color) payload.primary_color = brandingData.primaryColor || brandingData.primary_color;
    if (brandingData.secondaryColor || brandingData.secondary_color) payload.secondary_color = brandingData.secondaryColor || brandingData.secondary_color;

    await orgRepository.updateOrg(id, {
      ...payload,
      updatedBy: operatorUserId
    });

    await auditRepository.log({
      userId: operatorUserId,
      action: 'ORGANIZATION_BRANDING_UPDATED',
      module: 'ORGANIZATIONS',
      entity: 'organizations',
      recordId: id,
      newValues: brandingData
    });

    return orgRepository.findOrgById(id);
  }
}

module.exports = new OrgSettingsService();
