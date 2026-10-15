// src/engines/BusinessEventEngine.js
// Central Business Event Engine / Event Bus for the Enterprise VMS Platform

const EventEmitter = require('events');
const { auditLog } = require('../utils/audit');

class BusinessEventEngine extends EventEmitter {
  constructor() {
    super();
    this.eventCatalog = new Map([
      // Authentication & User Management
      ['user.registered', { category: 'Authentication', description: 'New user account registered' }],
      ['user.logged.in', { category: 'Authentication', description: 'User login event' }],
      ['user.password.changed', { category: 'Authentication', description: 'Password reset or changed' }],
      ['user.account.locked', { category: 'Authentication', description: 'Account locked due to failed attempts' }],

      // Visitor Management
      ['visitor.registered', { category: 'Visitor', description: 'Pre-registered visitor creation' }],
      ['visitor.approved', { category: 'Visitor', description: 'Visitor pre-approval granted' }],
      ['visitor.checked.in', { category: 'Visitor', description: 'Visitor check-in scan completed' }],
      ['visitor.checked.out', { category: 'Visitor', description: 'Visitor check-out scan completed' }],
      ['visitor.overstayed', { category: 'Visitor', description: 'Visitor exceeded approved visit duration' }],

      // Appointment Management
      ['appointment.created', { category: 'Appointment', description: 'New appointment requested' }],
      ['appointment.approved', { category: 'Appointment', description: 'Host approved appointment' }],
      ['appointment.cancelled', { category: 'Appointment', description: 'Appointment cancelled' }],

      // Reception Management
      ['visitor.arrived', { category: 'Reception', description: 'Visitor arrived at front desk' }],
      ['host.notified', { category: 'Reception', description: 'Host notified of visitor arrival' }],

      // Security & Access Control
      ['blacklist.detected', { category: 'Security', description: 'Blacklist/watchlist match detected' }],
      ['emergency.triggered', { category: 'Security', description: 'Panic alert or building lockdown triggered' }],
      ['access.denied', { category: 'Security', description: 'Turnstile access denied' }],

      // System & Administration
      ['backup.completed', { category: 'Administration', description: 'Automated database backup completed' }],
      ['maintenance.started', { category: 'Administration', description: 'System maintenance window initiated' }]
    ]);
  }

  async publishEvent(eventName, payload, context = {}) {
    const eventMetaData = this.eventCatalog.get(eventName) || { category: 'General', description: eventName };
    const eventInstance = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      eventName,
      category: eventMetaData.category,
      description: eventMetaData.description,
      payload,
      context,
      timestamp: new Date().toISOString()
    };

    console.log(`[BUSINESS EVENT PUBLISHED] ${eventName} (ID: ${eventInstance.eventId})`);
    
    // Audit log event publication
    await auditLog({
      userId: context.userId || 1,
      entity: 'business_event',
      action: 'publish_event',
      details: { eventId: eventInstance.eventId, eventName, category: eventInstance.category }
    });

    this.emit(eventName, eventInstance);
    this.emit('*', eventInstance);
    return eventInstance;
  }

  getEventCatalog() {
    return Array.from(this.eventCatalog.entries()).map(([eventName, meta]) => ({
      eventName,
      ...meta
    }));
  }
}

module.exports = new BusinessEventEngine();
