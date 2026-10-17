const db = require('../../../config/db');

class CalendarRepository {
  async getOrgSchedule(orgId) {
    const rows = await db.query(
      `SELECT * FROM business_schedules WHERE organization_id = ? AND branch_id IS NULL LIMIT 1`,
      [orgId]
    );
    if (rows && rows.length > 0) {
      const row = rows[0];
      return {
        id: row.id,
        organizationId: row.organization_id,
        timeZone: row.timezone,
        startDate: row.start_date,
        endDate: row.end_date,
        weeklySchedule: typeof row.weekly_schedule === 'string' ? JSON.parse(row.weekly_schedule) : row.weekly_schedule,
        status: row.status,
        created_at: row.created_at
      };
    }
    return null;
  }

  async saveOrgSchedule(scheduleData) {
    const jsonSchedule = JSON.stringify(scheduleData.weeklySchedule || {});
    const existing = await this.getOrgSchedule(scheduleData.organizationId);

    if (existing) {
      await db.query(
        `UPDATE business_schedules SET timezone = ?, start_date = ?, weekly_schedule = ?, status = ? WHERE id = ?`,
        [scheduleData.timeZone || 'Africa/Addis_Ababa', scheduleData.startDate || '2026-01-01', jsonSchedule, scheduleData.status || 'ACTIVE', existing.id]
      );
      return { ...existing, ...scheduleData };
    } else {
      const res = await db.query(
        `INSERT INTO business_schedules (organization_id, branch_id, timezone, start_date, weekly_schedule, status) VALUES (?, NULL, ?, ?, ?, ?)`,
        [scheduleData.organizationId, scheduleData.timeZone || 'Africa/Addis_Ababa', scheduleData.startDate || '2026-01-01', jsonSchedule, scheduleData.status || 'ACTIVE']
      );
      return { id: res.insertId || 1, ...scheduleData };
    }
  }

  async getBranchSchedule(orgId, branchId) {
    const rows = await db.query(
      `SELECT * FROM business_schedules WHERE organization_id = ? AND branch_id = ? LIMIT 1`,
      [orgId, branchId]
    );
    if (rows && rows.length > 0) {
      const row = rows[0];
      return {
        id: row.id,
        organizationId: row.organization_id,
        branchId: row.branch_id,
        timeZone: row.timezone,
        weeklySchedule: typeof row.weekly_schedule === 'string' ? JSON.parse(row.weekly_schedule) : row.weekly_schedule,
        status: row.status,
        created_at: row.created_at
      };
    }
    return null;
  }

  async saveBranchSchedule(overrideData) {
    const jsonSchedule = JSON.stringify(overrideData.weeklySchedule || {});
    const existing = await this.getBranchSchedule(overrideData.organizationId, overrideData.branchId);

    if (existing) {
      await db.query(
        `UPDATE business_schedules SET timezone = ?, weekly_schedule = ?, status = ? WHERE id = ?`,
        [overrideData.timeZone || 'Africa/Addis_Ababa', jsonSchedule, overrideData.status || 'ACTIVE', existing.id]
      );
      return { ...existing, ...overrideData };
    } else {
      const res = await db.query(
        `INSERT INTO business_schedules (organization_id, branch_id, timezone, start_date, weekly_schedule, status) VALUES (?, ?, ?, '2026-01-01', ?, ?)`,
        [overrideData.organizationId, overrideData.branchId, overrideData.timeZone || 'Africa/Addis_Ababa', jsonSchedule, overrideData.status || 'ACTIVE']
      );
      return { id: res.insertId || 1, ...overrideData };
    }
  }

  async deleteBranchSchedule(orgId, branchId) {
    await db.query(`DELETE FROM business_schedules WHERE organization_id = ? AND branch_id = ?`, [orgId, branchId]);
    return true;
  }

  async findTimeZones(orgId, branchId = null) {
    let sql = `SELECT * FROM timezone_settings WHERE organization_id = ?`;
    const params = [orgId];

    if (branchId) {
      sql += ` AND branch_id = ?`;
      params.push(branchId);
    }

    const rows = await db.query(sql, params);
    return rows.map(r => ({
      id: r.id,
      organizationId: r.organization_id,
      branchId: r.branch_id,
      timeZone: r.timezone,
      utcOffset: r.utc_offset,
      dst: Boolean(r.dst)
    }));
  }

  async saveTimeZone(tzData = {}) {
    const orgId = tzData.organizationId || 1;
    const branchId = tzData.branchId || null;
    const timeZone = tzData.timeZone || 'Africa/Addis_Ababa';
    const utcOffset = tzData.utcOffset || '+03:00';
    const dst = tzData.dst ? 1 : 0;

    const res = await db.query(
      `INSERT INTO timezone_settings (organization_id, branch_id, timezone, utc_offset, dst) VALUES (?, ?, ?, ?, ?)`,
      [orgId, branchId, timeZone, utcOffset, dst]
    );
    return { id: res.insertId || 1, organizationId: orgId, branchId, timeZone, utcOffset, dst: Boolean(dst) };
  }

  async getSpecialWorkingDays(orgId) {
    const rows = await db.query(`SELECT * FROM special_working_days WHERE organization_id = ?`, [orgId || 1]);
    return rows.map(r => ({
      id: r.id,
      date: r.date,
      reason: r.reason,
      openingTime: r.opening_time,
      closingTime: r.closing_time,
      appliesTo: r.applies_to,
      organizationId: r.organization_id,
      branchId: r.branch_id
    }));
  }

  async saveSpecialWorkingDay(dayData = {}) {
    const today = new Date().toISOString().split('T')[0];
    const date = dayData.date || today;
    const reason = dayData.reason || 'Special Operations Day';
    const openingTime = dayData.openingTime || '09:00';
    const closingTime = dayData.closingTime || '17:00';
    const appliesTo = dayData.appliesTo || 'ALL';
    const organizationId = dayData.organizationId || 1;
    const branchId = dayData.branchId || null;

    if (dayData.id) {
      await db.query(
        `UPDATE special_working_days SET date = ?, reason = ?, opening_time = ?, closing_time = ?, applies_to = ? WHERE id = ?`,
        [date, reason, openingTime, closingTime, appliesTo, dayData.id]
      );
      return { id: dayData.id, date, reason, openingTime, closingTime, appliesTo, organizationId, branchId };
    }
    const res = await db.query(
      `INSERT INTO special_working_days (date, reason, opening_time, closing_time, applies_to, organization_id, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [date, reason, openingTime, closingTime, appliesTo, organizationId, branchId]
    );
    return {
      id: res.insertId || 1,
      date,
      reason,
      openingTime,
      closingTime,
      appliesTo,
      organizationId,
      branchId
    };
  }

  async deleteSpecialWorkingDay(id) {
    await db.query(`DELETE FROM special_working_days WHERE id = ?`, [id]);
    return true;
  }
}

module.exports = new CalendarRepository();
