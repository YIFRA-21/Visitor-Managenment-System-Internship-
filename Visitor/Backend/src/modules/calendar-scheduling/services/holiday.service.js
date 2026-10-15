const holidayRepository = require('../repositories/holiday.repository');

class HolidayService {
  async getHolidays(filters = {}) {
    return await holidayRepository.findAll(filters);
  }

  async getHolidayById(id) {
    const holiday = await holidayRepository.findById(id);
    if (!holiday) {
      const err = new Error(`Holiday record with ID ${id} was not found.`);
      err.status = 404;
      throw err;
    }
    return holiday;
  }

  async saveHoliday(payload, userRole) {
    if (userRole === 'visitor' || userRole === 'receptionist') {
      const err = new Error('Access Denied: Only Admins or Managers can manage calendars.');
      err.status = 403;
      throw err;
    }

    const { id, name, type, date, appliesTo, organizationId, branchId, status } = payload;
    if (!name || !type || !date || !organizationId) {
      const err = new Error('Name, type, date, and organizationId are required.');
      err.status = 400;
      throw err;
    }

    // Check for duplicate holidays on the same date (excluding the current holiday itself)
    const matches = await holidayRepository.findByDate(date, organizationId, branchId);
    const duplicates = matches.filter(m => Number(m.id) !== Number(id || 0));
    if (duplicates.length > 0) {
      const err = new Error(`A holiday conflict exists: Date ${date} already has holiday '${duplicates[0].name}' registered.`);
      err.status = 400;
      throw err;
    }

    return await holidayRepository.save({
      id: id ? Number(id) : undefined,
      name,
      type,
      date,
      appliesTo: appliesTo || 'ALL',
      organizationId: Number(organizationId),
      branchId: branchId ? Number(branchId) : null,
      status: status || 'ACTIVE'
    });
  }

  async deleteHoliday(id, userRole) {
    if (userRole === 'visitor' || userRole === 'receptionist') {
      const err = new Error('Access Denied: Only Admins or Managers can delete holidays.');
      err.status = 403;
      throw err;
    }
    await this.getHolidayById(id); // Throws if not found
    await holidayRepository.delete(id);
    return { success: true, message: 'Holiday deleted successfully.' };
  }
}

module.exports = new HolidayService();
