class EventEngine {
  constructor() {
    this.registeredEvents = new Map();
  }

  registerEvent(eventName, moduleName, description) {
    this.registeredEvents.set(eventName, { eventName, moduleName, description, registeredAt: new Date() });
  }

  publishEvent(eventName, payload) {
    const eventMetaData = this.registeredEvents.get(eventName) || { eventName, moduleName: 'GENERAL' };
    return {
      eventId: `EVT-${Date.now()}`,
      eventName,
      moduleName: eventMetaData.moduleName,
      payload,
      timestamp: new Date().toISOString()
    };
  }

  getRegisteredEvents() {
    return Array.from(this.registeredEvents.values());
  }
}

module.exports = new EventEngine();
