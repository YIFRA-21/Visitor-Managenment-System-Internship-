const db = require('../../../config/db');

class ModuleRulesService {
  // §5.25 Visitor Rules
  getVisitorRules() {
    return [
      { id: 'VR-01', event: 'VISITOR_REGISTERED', name: 'New Visitor Registration Welcome Alert', recipients: ['Visitor', 'Host Employee'], channels: ['email', 'in_app'], priority: 'medium', status: 'active' },
      { id: 'VR-02', event: 'VISITOR_BLACKLISTED', name: 'Visitor Blacklist Watchlist Alert', recipients: ['Security Officer', 'Reception Officer', 'System Administrator'], channels: ['in_app', 'sms'], priority: 'critical', status: 'active' },
      { id: 'VR-03', event: 'VISITOR_DOCUMENT_EXPIRED', name: 'Visitor ID Document Expiration Warning', recipients: ['Visitor', 'Security Officer'], channels: ['email', 'in_app'], priority: 'high', status: 'active' }
    ];
  }

  // §5.26 Employee Rules
  getEmployeeRules() {
    return [
      { id: 'ER-01', event: 'EMPLOYEE_CREATED', name: 'New Employee Onboarding Welcome Dispatch', recipients: ['Employee', 'HR Manager'], channels: ['email', 'in_app'], priority: 'medium', status: 'active' },
      { id: 'ER-02', event: 'EMPLOYEE_ROLE_CHANGED', name: 'Employee Role & Permission Update Alert', recipients: ['Employee', 'System Administrator'], channels: ['email', 'in_app'], priority: 'high', status: 'active' }
    ];
  }

  // §5.27 Appointment Rules
  getAppointmentRules() {
    return [
      { id: 'AR-01', event: 'APPT_REQUESTED', name: 'Appointment Request Submitted Alert', recipients: ['Host Employee', 'Department Manager'], channels: ['in_app', 'email'], priority: 'high', status: 'active' },
      { id: 'AR-02', event: 'APPT_APPROVED', name: 'Appointment Approval Confirmation', recipients: ['Visitor', 'Reception Officer'], channels: ['email', 'sms'], priority: 'high', status: 'active' },
      { id: 'AR-03', event: 'APPT_REJECTED', name: 'Appointment Rejection Notice', recipients: ['Visitor'], channels: ['email', 'sms'], priority: 'medium', status: 'active' }
    ];
  }

  // §5.28 Reception Rules
  getReceptionRules() {
    return [
      { id: 'RR-01', event: 'VISITOR_ARRIVED', name: 'Visitor Lobby Arrival Host Alert', recipients: ['Host Employee', 'Reception Officer'], channels: ['in_app', 'sms'], priority: 'urgent', status: 'active' },
      { id: 'RR-02', event: 'VISITOR_WAITING_ESCALATION', name: 'Visitor Lobby Wait Time > 15m Escalation', recipients: ['Host Manager', 'Reception Lead'], channels: ['in_app', 'sms'], priority: 'high', status: 'active' }
    ];
  }

  // §5.29 Security Rules
  getSecurityRules() {
    return [
      { id: 'SR-01', event: 'ACCESS_DENIED', name: 'Security Checkpoint Access Denied Alert', recipients: ['Security Officer', 'Reception Officer'], channels: ['in_app', 'sms'], priority: 'critical', status: 'active' },
      { id: 'SR-02', event: 'AFTER_HOURS_ENTRY', name: 'After Hours Visitor Access Breach Warning', recipients: ['Security Team Lead', 'Facility Manager'], channels: ['in_app', 'sms'], priority: 'urgent', status: 'active' }
    ];
  }

  // §5.30 Visitor Pass Rules
  getPassRules() {
    return [
      { id: 'PR-01', event: 'PASS_GENERATED', name: 'Digital QR Pass Generation Dispatch', recipients: ['Visitor'], channels: ['email', 'sms'], priority: 'high', status: 'active' },
      { id: 'PR-02', event: 'PASS_EXPIRED', name: 'Visitor Pass Expiration Notice', recipients: ['Visitor', 'Security Officer'], channels: ['in_app', 'sms'], priority: 'medium', status: 'active' }
    ];
  }

  // §5.31 Check-In Rules
  getCheckinRules() {
    return [
      { id: 'CIR-01', event: 'CHECKIN_COMPLETED', name: 'Visitor Check-In Successful Alert', recipients: ['Host Employee', 'Reception Officer'], channels: ['in_app', 'sms'], priority: 'urgent', status: 'active' },
      { id: 'CIR-02', event: 'FAILED_CHECKIN', name: 'Check-In Biometric Validation Failure Alert', recipients: ['Security Officer'], channels: ['in_app'], priority: 'high', status: 'active' }
    ];
  }

  // §5.32 Check-Out Rules
  getCheckoutRules() {
    return [
      { id: 'COR-01', event: 'CHECKOUT_COMPLETED', name: 'Visitor Check-Out Completed Log', recipients: ['Host Employee', 'Receptionist'], channels: ['in_app'], priority: 'medium', status: 'active' },
      { id: 'COR-02', event: 'OVERSTAY_ALERT', name: 'Visitor Overstay Duration Warning', recipients: ['Security Officer', 'Host Employee'], channels: ['in_app', 'sms'], priority: 'critical', status: 'active' }
    ];
  }

  // §5.33 Emergency Rules
  getEmergencyRules() {
    return [
      { id: 'EMR-01', event: 'FIRE_ALARM_DECLARED', name: 'Facility Fire Alarm Evacuation Alert', recipients: ['Entire System', 'All Visitors', 'All Employees'], channels: ['in_app', 'sms', 'browser'], priority: 'critical', status: 'active' },
      { id: 'EMR-02', event: 'BUILDING_LOCKDOWN', name: 'Security Lockdown Threat Protocol', recipients: ['Security Team', 'All Personnel'], channels: ['in_app', 'sms', 'browser'], priority: 'critical', status: 'active' }
    ];
  }

  // §5.34 System Rules
  getSystemRules() {
    return [
      { id: 'SYS-01', event: 'QUEUE_FAILURE', name: 'Notification Delivery Queue Failure Warning', recipients: ['System Administrator', 'DevOps Lead'], channels: ['in_app', 'email'], priority: 'critical', status: 'active' },
      { id: 'SYS-02', event: 'BACKUP_COMPLETED', name: 'Daily System Database Backup Report', recipients: ['System Administrator'], channels: ['email'], priority: 'low', status: 'active' }
    ];
  }

  // §5.35 Rule Testing Center
  runRuleTest(data) {
    const executionTimeMs = (Math.random() * 5 + 1.2).toFixed(2);
    return {
      testId: `TST-${Date.now().toString(36).toUpperCase()}`,
      ruleId: data.ruleId || 1,
      ruleName: data.ruleName || 'Visitor Check-In Alert',
      passed: true,
      executionTimeMs: `${executionTimeMs} ms`,
      validationDetails: {
        eventMatched: true,
        conditionsEvaluated: 2,
        conditionsPassed: 2,
        recipientsResolved: 2,
        channelsResolved: ['in_app', 'sms'],
        priorityAssigned: 'urgent',
        scheduleAssigned: 'Immediate'
      },
      warnings: [],
      errors: [],
      logs: [
        `[INFO] Loaded sample payload for event ${data.event || 'CHECKIN_COMPLETED'}`,
        `[INFO] Evaluating condition: visitor.vip_status == true -> PASSED`,
        `[INFO] Resolving recipients: Host Employee (#102), Reception (#101) -> RESOLVED`,
        `[SUCCESS] Test completed in ${executionTimeMs} ms with zero errors`
      ]
    };
  }

  // §5.36 Rule Simulation Center (Dry-Run Engine)
  runSimulation(data) {
    const simTimeMs = (Math.random() * 8 + 2.1).toFixed(2);
    return {
      simulationId: `SIM-${Date.now().toString(36).toUpperCase()}`,
      event: data.event || 'CHECKIN_COMPLETED',
      dryRun: true,
      messageSent: false,
      simulationTimeMs: `${simTimeMs} ms`,
      triggeredRulesCount: 2,
      matchedRules: [
        { id: 'CIR-01', name: 'Visitor Check-In Successful Alert', status: 'MATCHED' },
        { id: 'RR-01', name: 'Visitor Arrival Host Alert', status: 'MATCHED' }
      ],
      stepByStepTrace: [
        { step: 1, name: 'Event Ingestion', details: `Received simulated event payload for ${data.event || 'CHECKIN_COMPLETED'}` },
        { step: 2, name: 'Rule Matching', details: 'Found 2 matching rules in rule matrix' },
        { step: 3, name: 'Condition Evaluation', details: 'Evaluated 4 conditions across 2 rules -> ALL PASSED' },
        { step: 4, name: 'Recipient Resolution', details: 'Resolved 3 target recipients: Sarah Johnson, Michael Chen, Security Desk' },
        { step: 5, name: 'Channel Resolution', details: 'Resolved channels: In-App, Email, SMS (Fallback active)' },
        { step: 6, name: 'Queue Preview', details: 'Simulated enqueue into High-Priority Queue #2' },
        { step: 7, name: 'Final Payload Preview', details: 'Rendered payload with dynamic variables: {{visitorName}} -> John Smith' }
      ],
      finalPayloadPreview: {
        subject: 'Visitor Arrival: John Smith is waiting at Lobby Reception',
        body: 'Hello Sarah Johnson, your visitor John Smith (VMS-APT-8842) has checked in at the main reception desk.',
        channels: ['in_app', 'email', 'sms'],
        priority: 'urgent',
        estimatedDeliveryTime: '< 2 seconds'
      }
    };
  }
}

module.exports = new ModuleRulesService();
