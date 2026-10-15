const calendarRepository = require('../../calendar-scheduling/repositories/calendar.repository');

class TimeZoneService {
  async getTimeZones(orgId, branchId = null) {
    return await calendarRepository.findTimeZones(orgId, branchId);
  }

  async saveTimeZone(payload, userRole) {
    if (userRole !== 'admin' && userRole !== 'system_administrator') {
      const err = new Error('Access Denied: Only Admins can modify organizational timezone settings.');
      err.status = 403;
      throw err;
    }

    const { organizationId, branchId, timeZone, utcOffset, dst } = payload;
    if (!organizationId || !timeZone) {
      const err = new Error('Organization ID and TimeZone are required.');
      err.status = 400;
      throw err;
    }

    return await calendarRepository.saveTimeZone({
      organizationId: Number(organizationId),
      branchId: branchId ? Number(branchId) : null,
      timeZone,
      utcOffset: utcOffset || '+03:00',
      dst: dst || false
    });
  }
}

module.exports = new TimeZoneService();
