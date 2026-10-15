const EventBus = require('../EventBus');
const AutomaticNotificationEngine = require('../../modules/notifications/services/automatic-notification-engine');

class NotificationEventListener {
  constructor() {
    this.initialized = false;
  }

  /**
   * Subscribe listener callbacks to all enterprise domain events
   */
  init() {
    if (this.initialized) return;

    const eventKeys = [
      // 1. Auth
      'AUTH_LOGIN_SUCCESS', 'AUTH_NEW_DEVICE_LOGIN', 'AUTH_PASSWORD_CHANGED', 'AUTH_OTP_GENERATED', 'AUTH_ACCOUNT_LOCKED',
      // 2. Users & Roles
      'USER_CREATED', 'USER_ROLE_ASSIGNED', 'USER_PERMISSION_CHANGED',
      // 3. Organization
      'ORG_BRANCH_CREATED', 'ORG_DEPARTMENT_CREATED', 'ORG_DISABLED',
      // 4. Employee
      'EMPLOYEE_CREATED', 'EMPLOYEE_ACTIVATED', 'EMPLOYEE_DISABLED',
      // 5. Visitor
      'VISITOR_REGISTERED', 'VISITOR_BLACKLISTED', 'VISITOR_WATCHLISTED',
      // 6. Appointment
      'APPT_REQUESTED', 'APPT_APPROVED', 'APPT_REJECTED', 'APPT_RESCHEDULED', 'APPT_CANCELLED',
      // 7. Approval Workflow
      'APPROVAL_REQUIRED', 'APPROVAL_REMINDER', 'APPROVAL_ESCALATED', 'APPROVAL_COMPLETED',
      // 8. Reception
      'RECEPTION_VISITOR_ARRIVED', 'RECEPTION_VISITOR_WAITING', 'RECEPTION_CONFIRMED',
      // 9. Security
      'ACCESS_GRANTED', 'ACCESS_DENIED', 'SECURITY_BLACKLIST_MATCH', 'SECURITY_INCIDENT', 'EMERGENCY_ALERT',
      // 10. Pass
      'PASS_GENERATED', 'PASS_ACTIVATED', 'PASS_EXPIRED', 'PASS_REVOKED',
      // 11. Check-In / Check-Out
      'CHECKIN_STARTED', 'CHECKIN_COMPLETED', 'CHECKOUT_COMPLETED', 'VISITOR_OVERSTAY',
      // 12. Identity Verification
      'IDENTITY_FACE_MATCH_PASSED', 'IDENTITY_FACE_MATCH_FAILED', 'IDENTITY_APPROVED', 'IDENTITY_REJECTED',
      // 13. Documents
      'DOCUMENT_UPLOADED', 'DOCUMENT_APPROVED', 'DOCUMENT_EXPIRED',
      // 14. Calendar
      'MEETING_SCHEDULED', 'MEETING_UPDATED', 'MEETING_CANCELLED', 'MEETING_REMINDER',
      // 15. Reports & System
      'REPORT_EXPORT_COMPLETED', 'SYSTEM_BACKUP_COMPLETED', 'SYSTEM_SERVER_OFFLINE', 'HIGH_CPU_USAGE'
    ];

    eventKeys.forEach(eventKey => {
      EventBus.on(eventKey, (envelope) => {
        const payload = envelope?.payload || envelope || {};
        AutomaticNotificationEngine.dispatchDomainEvent(eventKey, payload).catch(err => {
          console.error(`[NotificationEventListener] Error processing event ${eventKey}:`, err);
        });
      });
    });

    this.initialized = true;
    console.log(`NotificationEventListener subscribed to ${eventKeys.length} domain events.`);
  }
}

module.exports = new NotificationEventListener();
