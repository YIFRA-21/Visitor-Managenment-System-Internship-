const calendarRepository = require('../../calendar-scheduling/repositories/calendar.repository');
const holidayRepository = require('../../calendar-scheduling/repositories/holiday.repository');

class StatisticsService {
  async getStatistics(orgId, branchId = null) {
    const holidays = await holidayRepository.findAll({ organizationId: orgId, branchId });
    const specialDays = await calendarRepository.getSpecialWorkingDays(orgId);

    // Assume standard 261 working days, 104 weekend days, etc.
    const totalHolidays = holidays.length;
    const totalSpecial = specialDays.length;

    // Monthly working days distribution mock
    const monthlyWorkingDays = [
      { month: 'Jan', days: 22 },
      { month: 'Feb', days: 20 },
      { month: 'Mar', days: 22 },
      { month: 'Apr', days: 21 },
      { month: 'May', days: 22 },
      { month: 'Jun', days: 20 },
      { month: 'Jul', days: 21 }, // current
      { month: 'Aug', days: 21 },
      { month: 'Sep', days: 19 }, // 2 holidays
      { month: 'Oct', days: 22 },
      { month: 'Nov', days: 21 }, // 1 holiday
      { month: 'Dec', days: 21 }  // 1 holiday
    ];

    // Holiday distributions count by category
    const holidayDistribution = [
      { name: 'Public Holiday', count: holidays.filter(h => h.type === 'PUBLIC').length },
      { name: 'Organization Holiday', count: holidays.filter(h => h.type === 'ORGANIZATION').length },
      { name: 'Branch Override Closure', count: holidays.filter(h => h.type === 'BRANCH').length },
      { name: 'Emergency Closure', count: holidays.filter(h => h.type === 'EMERGENCY').length }
    ];

    // Branch schedule usage breakdown (mock values since branches are static)
    const branchesUsingDefault = 4;
    const branchesUsingCustom = 1;

    return {
      organizationId: Number(orgId),
      branchId: branchId ? Number(branchId) : null,
      kpis: {
        totalWorkingDaysYear: 247,
        totalHolidaysCount: totalHolidays,
        upcomingHolidaysCount: holidays.filter(h => new Date(h.date) >= new Date()).length,
        branchesDefaultCount: branchesUsingDefault,
        branchesCustomCount: branchesUsingCustom,
        specialWorkingDaysCount: totalSpecial,
        standardWeekendDaysCount: 104
      },
      charts: {
        monthlyWorkingDays,
        holidayDistribution,
        scheduleUtilization: [
          { name: 'Operational Hours', value: 72 },
          { name: 'Lunch Break & Off-Shift', value: 12 },
          { name: 'Weekend Closures', value: 14 },
          { name: 'Holiday Exclusions', value: 2 }
        ]
      }
    };
  }
}

module.exports = new StatisticsService();
