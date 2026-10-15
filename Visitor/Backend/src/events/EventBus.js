const EventEmitter = require('events');

class EnterpriseEventBus extends EventEmitter {
  constructor() {
    super();
    // Max listeners set to 100 to support high concurrency event handling
    this.setMaxListeners(100);
    console.log('Enterprise EventBus initialized.');
  }

  /**
   * Emit domain event with standardized payload structure
   */
  emitDomainEvent(eventKey, payload = {}) {
    const envelope = {
      eventKey,
      timestamp: new Date().toISOString(),
      eventId: `EVT-${Date.now().toString(36).toUpperCase()}`,
      payload
    };

    console.log(`[EventBus] Emitting Domain Event: ${eventKey} (ID: ${envelope.eventId})`);
    return this.emit(eventKey, envelope);
  }
}

module.exports = new EnterpriseEventBus();
