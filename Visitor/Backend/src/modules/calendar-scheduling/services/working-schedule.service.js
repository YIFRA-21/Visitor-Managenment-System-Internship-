const calendarRepository = require('../repositories/calendar.repository');

class WorkingScheduleService {
  async getOrgSchedule(orgId) {
    const sched = await calendarRepository.getOrgSchedule(orgId);
    if (!sched) {
      // Return default template
      return {
        organizationId: Number(orgId),
        weeklySchedule: {
          Monday: { open: true, openingTime: '08:30', closingTime: '17:30', breakStart: '12:30', breakEnd: '13:30' },
          Tuesday: { open: true, openingTime: '08:30', closingTime: '17:30', breakStart: '12:30', breakEnd: '13:30' },
          Wednesday: { open: true, openingTime: '08:30', closingTime: '17:30', breakStart: '12:30', breakEnd: '13:30' },
          Thursday: { open: true, openingTime: '08:30', closingTime: '17:30', breakStart: '12:30', breakEnd: '13:30' },
          Friday: { open: true, openingTime: '08:30', closingTime: '17:30', breakStart: '12:30', breakEnd: '13:30' },
          Saturday: { open: false, openingTime: '09:00', closingTime: '13:00', breakStart: null, breakEnd: null },
          Sunday: { open: false, openingTime: null, closingTime: null, breakStart: null, breakEnd: null }
        },
        timeZone: 'Africa/Addis_Ababa',
        startDate: '2026-01-01',
        endDate: null,
        status: 'ACTIVE'
      };
    }
    return sched;
  }

  async saveOrgSchedule(payload, userRole) {
    if (userRole !== 'admin' && userRole !== 'system_administrator') {
      const err = new Error('Access Denied: Insufficient permissions to modify organization schedule.');
      err.status = 403;
      throw err;
    }

    const organizationId = payload?.organizationId || payload?.org_id || 1;
    let weeklySchedule = payload?.weeklySchedule;
    if (!weeklySchedule || typeof weeklySchedule !== 'object' || Object.keys(weeklySchedule).length === 0) {
      const defaultSched = await this.getOrgSchedule(organizationId);
      weeklySchedule = defaultSched.weeklySchedule;
    }

    // Validate times
    try {
      this.validateScheduleHours(weeklySchedule);
    } catch (_) {
      const defaultSched = await this.getOrgSchedule(organizationId);
      weeklySchedule = defaultSched.weeklySchedule;
    }

    return await calendarRepository.saveOrgSchedule({
      organizationId: Number(organizationId),
      weeklySchedule,
      timeZone: payload?.timeZone || 'Africa/Addis_Ababa',
      startDate: payload?.startDate || '2026-01-01',
      endDate: payload?.endDate || null,
      status: 'ACTIVE'
    });
  }

  async getBranchSchedule(orgId, branchId) {
    const override = await calendarRepository.getBranchSchedule(orgId, branchId);
    if (!override) {
      const orgSched = await this.getOrgSchedule(orgId);
      return {
        organizationId: Number(orgId),
        branchId: Number(branchId),
        weeklySchedule: orgSched.weeklySchedule,
        timeZone: orgSched.timeZone,
        status: 'INHERITED'
      };
    }
    return override;
  }

  async saveBranchSchedule(payload, userRole) {
    // Branch manager or admin
    if (userRole !== 'admin' && userRole !== 'system_administrator' && userRole !== 'manager') {
      const err = new Error('Access Denied: Only Branch Managers and Admins can override branch schedules.');
      err.status = 403;
      throw err;
    }

    const organizationId = payload?.organizationId || payload?.org_id || 1;
    const branchId = payload?.branchId || payload?.branch_id || 1;
    let weeklySchedule = payload?.weeklySchedule;
    if (!weeklySchedule || typeof weeklySchedule !== 'object' || Object.keys(weeklySchedule).length === 0) {
      const defaultSched = await this.getOrgSchedule(organizationId);
      weeklySchedule = defaultSched.weeklySchedule;
    }

    try {
      this.validateScheduleHours(weeklySchedule);
    } catch (_) {
      const defaultSched = await this.getOrgSchedule(organizationId);
      weeklySchedule = defaultSched.weeklySchedule;
    }

    return await calendarRepository.saveBranchSchedule({
      organizationId: Number(organizationId),
      branchId: Number(branchId),
      weeklySchedule,
      timeZone: payload?.timeZone || 'Africa/Addis_Ababa',
      status: 'OVERRIDDEN'
    });
  }

  async resetBranchSchedule(orgId, branchId, userRole) {
    if (userRole !== 'admin' && userRole !== 'system_administrator' && userRole !== 'manager') {
      const err = new Error('Access Denied: Insufficient permissions to reset branch schedules.');
      err.status = 403;
      throw err;
    }
    await calendarRepository.deleteBranchSchedule(orgId, branchId);
    return await this.getBranchSchedule(orgId, branchId);
  }

  validateScheduleHours(weeklySchedule) {
    for (const [day, config] of Object.entries(weeklySchedule)) {
      if (config.open) {
        if (!config.openingTime || !config.closingTime) {
          const err = new Error(`Validation Error: ${day} is marked Open but is missing operating hours.`);
          err.status = 400;
          throw err;
        }
        if (config.closingTime <= config.openingTime) {
          const err = new Error(`Validation Error: ${day} closing time (${config.closingTime}) must be after opening time (${config.openingTime}).`);
          err.status = 400;
          throw err;
        }
        if (config.breakStart && config.breakEnd) {
          if (config.breakStart < config.openingTime || config.breakEnd > config.closingTime) {
            const err = new Error(`Validation Error: ${day} lunch break must fall within shift hours (${config.openingTime} - ${config.closingTime}).`);
            err.status = 400;
            throw err;
          }
          if (config.breakEnd <= config.breakStart) {
            const err = new Error(`Validation Error: ${day} lunch break end must be after break start.`);
            err.status = 400;
            throw err;
          }
        }
      }
    }
  }
}

module.exports = new WorkingScheduleService();
