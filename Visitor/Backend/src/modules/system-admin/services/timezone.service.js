const calendarRepository = require('../../calendar-scheduling/repositories/calendar.repository');

class TimeZoneService {
  async getTimeZones(orgId = 1, branchId = null) {
    const list = await calendarRepository.findTimeZones(orgId || 1, branchId);
    if (!list || list.length === 0) {
      return [{
        id: 1,
        organizationId: Number(orgId || 1),
        branchId: branchId ? Number(branchId) : null,
        timeZone: 'Africa/Addis_Ababa',
        utcOffset: '+03:00',
        dst: false
      }];
    }
    return list;
  }

  async saveTimeZone(payload = {}, userRole) {
    if (userRole !== 'admin' && userRole !== 'system_administrator') {
      const err = new Error('Access Denied: Only Admins can modify organizational timezone settings.');
      err.status = 403;
      throw err;
    }

    const organizationId = payload.organizationId || payload.org_id || 1;
    const timeZone = payload.timeZone || 'Africa/Addis_Ababa';
    const branchId = payload.branchId || null;
    const utcOffset = payload.utcOffset || '+03:00';
    const dst = payload.dst || false;

    return await calendarRepository.saveTimeZone({
      organizationId: Number(organizationId),
      branchId: branchId ? Number(branchId) : null,
      timeZone,
      utcOffset,
      dst: Boolean(dst)
    });
  }
}

module.exports = new TimeZoneService();
