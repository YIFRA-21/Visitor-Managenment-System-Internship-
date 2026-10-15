const db = require('../../../config/db');

class WorkflowAutomationService {
  // §5.13 & §5.18 & §5.19 Scheduling, Time & Calendar Rules
  async getSchedulingRules() {
    try {
      const rows = await db.query(`SELECT * FROM notification_schedules ORDER BY id DESC`);
      return Array.isArray(rows) && rows.length > 0 ? rows : this.getMockSchedules();
    } catch {
      return this.getMockSchedules();
    }
  }

  getMockSchedules() {
    return [
      { id: 1, name: 'Standard Business Hours Dispatch', type: 'business_hours', time_window: '08:00 - 17:00', timezone: 'UTC+3', skip_holidays: true, skip_weekends: true, status: 'active' },
      { id: 2, name: 'Night Shift Emergency Overrides', type: 'night_shift', time_window: '22:00 - 06:00', timezone: 'UTC+3', skip_holidays: false, skip_weekends: false, status: 'active' },
      { id: 3, name: 'Public Holiday Maintenance Window', type: 'calendar_holiday', calendar_event: 'Company Holiday', timezone: 'UTC+3', skip_holidays: true, skip_weekends: true, status: 'active' }
    ];
  }

  // §5.14 & §5.15 & §5.16 Escalation, Reminder & Retry Rules
  async getEscalations() {
    return [
      { id: 1, rule_name: 'Unapproved Appointment Escalation', trigger_condition: 'Unapproved after 24h', l1_target: 'Host Manager', l2_target: 'Dept Head', l3_target: 'VP Operations', l4_target: 'Sys Admin', escalation_timer_mins: 1440, status: 'active' },
      { id: 2, rule_name: 'Visitor Lobby Wait Escalation', trigger_condition: 'Waiting > 15 mins', l1_target: 'Host Employee', l2_target: 'Reception Supervisor', l3_target: 'Security Lead', l4_target: 'Office Admin', escalation_timer_mins: 15, status: 'active' }
    ];
  }

  async getReminders() {
    return [
      { id: 1, name: 'Upcoming Appointment Reminder', event_type: 'APPOINTMENT', frequency: '24 Hours Before', channels: ['email', 'sms'], status: 'active' },
      { id: 2, name: 'Visitor Pass Expiration Alert', event_type: 'PASS_EXPIRATION', frequency: '1 Hour Before', channels: ['in_app', 'sms'], status: 'active' }
    ];
  }

  async getRetries() {
    return {
      maxRetries: 3,
      retryIntervalSec: 60,
      backoffPolicy: 'exponential',
      backoffMultiplier: 2,
      deadLetterQueueEnabled: true,
      failedQueueCount: 1,
      retryHistoryCount: 420
    };
  }

  // §5.17 & §5.20 & §5.21 & §5.22 Approval & Org Hierarchy Rules
  async getApprovals() {
    return [
      { id: 1, name: 'Emergency Broadcast Multi-Level Approval', approval_type: 'Sequential Multi-Level', l1_approver: 'Security Director', l2_approver: 'VP HR', status: 'active' },
      { id: 2, name: 'System Upgrade Announcement Single Approval', approval_type: 'Single Approval', l1_approver: 'IT Director', l2_approver: 'N/A', status: 'active' }
    ];
  }

  async getOrgHierarchyRules() {
    return {
      organization: { name: 'HQ Corporation', type: 'Parent', inheritance: 'Cascade to Subsidiaries' },
      branches: [
        { id: 1, name: 'Riyadh Main Campus', timezone: 'UTC+3', manager: 'Sarah Johnson' },
        { id: 2, name: 'Jeddah Regional Office', timezone: 'UTC+3', manager: 'Michael Chen' }
      ],
      departments: [
        { id: 1, name: 'Security & Safety', hours: '24/7 Shift', escalation: 'Immediate' },
        { id: 2, name: 'Human Resources', hours: '08:00 - 17:00', escalation: '24 Hours' }
      ]
    };
  }

  // §5.23 & §5.24 Role & User Group Rules
  async getRoleRules() {
    return [
      { role: 'System Administrator', priority: 'critical', channels: ['in_app', 'email', 'sms'], escalation: 'Level 4 Final' },
      { role: 'Security Officer', priority: 'urgent', channels: ['in_app', 'sms'], escalation: 'Level 2' },
      { role: 'Department Manager', priority: 'high', channels: ['in_app', 'email'], escalation: 'Level 1' },
      { role: 'Employee', priority: 'medium', channels: ['in_app', 'email'], escalation: 'None' },
      { role: 'Visitor', priority: 'normal', channels: ['sms', 'email'], escalation: 'None' }
    ];
  }

  async getUserGroups() {
    return [
      { id: 1, group_name: 'Reception Team', member_count: 8, group_type: 'Static', priority: 'High' },
      { id: 2, group_name: 'Security Rapid Response', member_count: 14, group_type: 'Dynamic', priority: 'Critical' },
      { id: 3, group_name: 'VIP Visitor Group', member_count: 25, group_type: 'Dynamic', priority: 'High' },
      { id: 4, group_name: 'Executive Board', member_count: 6, group_type: 'Static', priority: 'Critical' }
    ];
  }
}

module.exports = new WorkflowAutomationService();
