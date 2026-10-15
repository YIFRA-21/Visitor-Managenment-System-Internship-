const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('notification_events', [
      { id: uuidv4(), event_code: 'VISITOR_REGISTERED', module_name: 'VISITOR', description: 'New visitor registered', created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), event_code: 'CHECKIN_COMPLETED', module_name: 'CHECKIN', description: 'Visitor check-in completed', created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), event_code: 'APPT_REQUESTED', module_name: 'APPOINTMENT', description: 'Appointment requested', created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), event_code: 'EMERGENCY_DECLARED', module_name: 'SECURITY', description: 'Emergency declared', created_at: new Date(), updated_at: new Date() }
    ], {});

    await queryInterface.bulkInsert('notification_settings', [
      { id: uuidv4(), setting_key: 'DEFAULT_SENDER_EMAIL', setting_value: 'noreply@vms.local', created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), setting_key: 'SMS_GATEWAY_ENABLED', setting_value: 'true', created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), setting_key: 'MAX_RETRY_ATTEMPTS', setting_value: '3', created_at: new Date(), updated_at: new Date() }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('notification_settings', null, {});
    await queryInterface.bulkDelete('notification_events', null, {});
  }
};
