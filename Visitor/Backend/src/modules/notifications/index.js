const notificationController = require('./controllers/notification.controller');
const manualNotificationController = require('./controllers/manual-notification.controller');
const notificationComposerController = require('./controllers/notification-composer.controller');
const notificationEngineController = require('./controllers/notification-engine.controller');
const notificationPersistenceController = require('./controllers/notification-persistence.controller');
const notificationService = require('./services/notification.service');
const manualNotificationService = require('./services/manual-notification.service');
const automaticNotificationEngine = require('./services/automatic-notification-engine');
const emailService = require('./services/email.service');
const smsService = require('./services/sms.service');
const notificationRoutes = require('./routes/notification.routes');
const visitorNotificationsRoutes = require('./routes/visitor-notifications.routes');

module.exports = {
  notificationController,
  manualNotificationController,
  notificationComposerController,
  notificationEngineController,
  notificationPersistenceController,
  notificationService,
  manualNotificationService,
  automaticNotificationEngine,
  emailService,
  smsService,
  notificationRoutes,
  visitorNotificationsRoutes,
};
