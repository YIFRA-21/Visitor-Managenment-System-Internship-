const calendarRepository = require('../../calendar-scheduling/repositories/calendar.repository');
const holidayRepository = require('../../calendar-scheduling/repositories/holiday.repository');

class ValidationService {
  async runAudit(orgId, branchId = null) {
    const orgSchedule = await calendarRepository.getOrgSchedule(orgId);
    const branchSchedule = branchId ? await calendarRepository.getBranchSchedule(orgId, branchId) : null;
    const holidays = await holidayRepository.findAll({ organizationId: orgId, branchId });
    const specialDays = await calendarRepository.getSpecialWorkingDays(orgId);

    const issues = [];
    let passedCount = 0;
    let warningCount = 0;
    let failedCount = 0;

    // Check 1: Working Hours Validity (Org level)
    if (orgSchedule) {
      let openDaysCount = 0;
      for (const [day, config] of Object.entries(orgSchedule.weeklySchedule)) {
        if (config.open) {
          openDaysCount++;
          if (config.closingTime <= config.openingTime) {
            failedCount++;
            issues.push({
              code: 'INVALID_WORKING_HOURS',
              severity: 'FAILED',
              target: `Org Schedule - ${day}`,
              message: `Closing time (${config.closingTime}) is equal to or before opening time (${config.openingTime}).`,
              suggestion: `Modify ${day} operating hours to set closing time after opening time.`
            });
          }
          if (config.breakStart && config.breakEnd) {
            if (config.breakStart < config.openingTime || config.breakEnd > config.closingTime) {
              failedCount++;
              issues.push({
                code: 'INVALID_BREAK_HOURS',
                severity: 'FAILED',
                target: `Org Schedule - ${day}`,
                message: `Break period (${config.breakStart} - ${config.breakEnd}) is outside standard shift hours.`,
                suggestion: `Adjust lunch break to fall entirely inside opening/closing range.`
              });
            }
          }
        }
      }
      if (openDaysCount === 0) {
        warningCount++;
        issues.push({
          code: 'MISSING_WORKING_DAYS',
          severity: 'WARNING',
          target: 'Org Schedule',
          message: 'The organization has zero active working days configured. All days are set to Closed.',
          suggestion: 'Mark at least one weekday as Open to receive visitors.'
        });
      } else {
        passedCount++;
      }
    } else {
      warningCount++;
      issues.push({
        code: 'MISSING_ORG_SCHEDULE',
        severity: 'WARNING',
        target: 'Org Schedule',
        message: 'No official organization working schedule was found in database. Using defaults.',
        suggestion: 'Create an official schedule in the Working Schedule tab.'
      });
    }

    // Check 2: Branch Overrides Check
    if (branchId && branchSchedule) {
      let openDaysCount = 0;
      for (const [day, config] of Object.entries(branchSchedule.weeklySchedule)) {
        if (config.open) {
          openDaysCount++;
          if (config.closingTime <= config.openingTime) {
            failedCount++;
            issues.push({
              code: 'INVALID_BRANCH_WORKING_HOURS',
              severity: 'FAILED',
              target: `Branch Schedule - ${day}`,
              message: `Branch override closing time (${config.closingTime}) is before opening time (${config.openingTime}).`,
              suggestion: `Edit the branch schedule override and correct hours for ${day}.`
            });
          }
        }
      }
      if (openDaysCount === 0) {
        failedCount++;
        issues.push({
          code: 'INVALID_BRANCH_SCHEDULE',
          severity: 'FAILED',
          target: 'Branch Override',
          message: 'Branch override marks all 7 calendar days as closed.',
          suggestion: 'Reset schedule to default or toggle at least one operating day.'
        });
      } else {
        passedCount++;
      }
    }

    // Check 3: Overlapping/Duplicate Holidays
    const holidayDates = new Set();
    const duplicateDates = new Set();
    holidays.forEach(h => {
      if (holidayDates.has(h.date)) {
        duplicateDates.add(h.date);
      }
      holidayDates.add(h.date);
    });

    if (duplicateDates.size > 0) {
      duplicateDates.forEach(date => {
        failedCount++;
        const conflicting = holidays.filter(h => h.date === date);
        issues.push({
          code: 'DUPLICATE_HOLIDAYS',
          severity: 'FAILED',
          target: `Date: ${date}`,
          message: `Multiple conflicting holidays/closures mapped to the same date: ${conflicting.map(h => `'${h.name}'`).join(' & ')}.`,
          suggestion: `Delete or consolidate duplicate holiday entries for ${date}.`
        });
      });
    } else {
      passedCount++;
    }

    // Check 4: Check if any special working days override a holiday
    const confSpecs = specialDays.filter(sd => holidayDates.has(sd.date));
    if (confSpecs.length > 0) {
      confSpecs.forEach(sd => {
        warningCount++;
        const mappedHol = holidays.find(h => h.date === sd.date);
        issues.push({
          code: 'SPECIAL_DAY_HOLIDAY_OVERLAP',
          severity: 'WARNING',
          target: `Date: ${sd.date}`,
          message: `Special working day '${sd.reason}' is scheduled on top of holiday '${mappedHol ? mappedHol.name : 'Closure'}'.`,
          suggestion: `Double check if operational hours on ${sd.date} are intended. Holiday closures take precedence.`
        });
      });
    }

    return {
      organizationId: Number(orgId),
      branchId: branchId ? Number(branchId) : null,
      auditTimestamp: new Date().toISOString(),
      summary: {
        totalChecks: 5,
        passed: passedCount,
        warnings: warningCount,
        failed: failedCount,
        status: failedCount > 0 ? 'FAILED' : (warningCount > 0 ? 'WARNING' : 'PASSED')
      },
      issues
    };
  }
}

module.exports = new ValidationService();
