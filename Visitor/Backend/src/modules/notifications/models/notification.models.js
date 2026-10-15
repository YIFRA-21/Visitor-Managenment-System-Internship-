const { DataTypes } = require('sequelize');
const db = require('../../../config/db');

const sequelize = db.sequelize || {
  define: (name, attrs, opts) => ({ name, attrs, opts })
};

// Helper for standard entity attributes
const standardAttributes = {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  status: { type: DataTypes.STRING(32), defaultValue: 'active' },
  created_by: { type: DataTypes.STRING(128), allowNullable: true },
  updated_by: { type: DataTypes.STRING(128), allowNullable: true },
  remarks: { type: DataTypes.TEXT, allowNullable: true }
};

const standardOptions = {
  timestamps: true,
  paranoid: true, // Soft delete support
  underscored: true
};

// 1. NotificationRule
const NotificationRule = sequelize.define('NotificationRule', {
  ...standardAttributes,
  name: { type: DataTypes.STRING(255), allowNull: false },
  category: { type: DataTypes.STRING(64), defaultValue: 'System' },
  module_name: { type: DataTypes.STRING(64), allowNull: false },
  business_event: { type: DataTypes.STRING(128), allowNull: false },
  trigger_type: { type: DataTypes.STRING(32), defaultValue: 'immediate' },
  priority: { type: DataTypes.STRING(32), defaultValue: 'medium' },
  description: { type: DataTypes.TEXT }
}, standardOptions);

// 2. NotificationEvent
const NotificationEvent = sequelize.define('NotificationEvent', {
  ...standardAttributes,
  event_code: { type: DataTypes.STRING(128), allowNull: false, unique: true },
  module_name: { type: DataTypes.STRING(64), allowNull: false },
  description: { type: DataTypes.TEXT }
}, standardOptions);

// 3. NotificationCondition
const NotificationCondition = sequelize.define('NotificationCondition', {
  ...standardAttributes,
  rule_id: { type: DataTypes.UUID, allowNull: false },
  field: { type: DataTypes.STRING(128), allowNull: false },
  operator: { type: DataTypes.STRING(32), allowNull: false },
  value: { type: DataTypes.STRING(255), allowNull: false },
  logic: { type: DataTypes.STRING(10), defaultValue: 'AND' }
}, standardOptions);

// 4. NotificationAction
const NotificationAction = sequelize.define('NotificationAction', {
  ...standardAttributes,
  rule_id: { type: DataTypes.UUID, allowNull: false },
  action_type: { type: DataTypes.STRING(64), allowNull: false },
  config: { type: DataTypes.JSON }
}, standardOptions);

// 5. NotificationWorkflow
const NotificationWorkflow = sequelize.define('NotificationWorkflow', {
  ...standardAttributes,
  name: { type: DataTypes.STRING(255), allowNull: false },
  nodes: { type: DataTypes.JSON },
  edges: { type: DataTypes.JSON }
}, standardOptions);

// 6. NotificationRecipient
const NotificationRecipient = sequelize.define('NotificationRecipient', {
  ...standardAttributes,
  rule_id: { type: DataTypes.UUID },
  scope_type: { type: DataTypes.STRING(64), allowNull: false },
  target_id: { type: DataTypes.STRING(128) }
}, standardOptions);

// 7. NotificationChannel
const NotificationChannel = sequelize.define('NotificationChannel', {
  ...standardAttributes,
  channel_code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(128), allowNull: false },
  is_enabled: { type: DataTypes.BOOLEAN, defaultValue: true }
}, standardOptions);

// 8. NotificationPriority
const NotificationPriority = sequelize.define('NotificationPriority', {
  ...standardAttributes,
  level_name: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  delivery_speed: { type: DataTypes.STRING(64) },
  queue_position: { type: DataTypes.INTEGER, defaultValue: 3 }
}, standardOptions);

// 9. NotificationSchedule
const NotificationSchedule = sequelize.define('NotificationSchedule', {
  ...standardAttributes,
  rule_id: { type: DataTypes.UUID },
  schedule_type: { type: DataTypes.STRING(32), defaultValue: 'immediate' },
  cron_expression: { type: DataTypes.STRING(64) },
  execute_at: { type: DataTypes.DATE }
}, standardOptions);

// 10. NotificationReminder
const NotificationReminder = sequelize.define('NotificationReminder', {
  ...standardAttributes,
  event_code: { type: DataTypes.STRING(128), allowNull: false },
  time_offset_hours: { type: DataTypes.INTEGER, defaultValue: 24 }
}, standardOptions);

// 11. NotificationRetry
const NotificationRetry = sequelize.define('NotificationRetry', {
  ...standardAttributes,
  max_retries: { type: DataTypes.INTEGER, defaultValue: 3 },
  backoff_policy: { type: DataTypes.STRING(32), defaultValue: 'exponential' }
}, standardOptions);

// 12. NotificationEscalation
const NotificationEscalation = sequelize.define('NotificationEscalation', {
  ...standardAttributes,
  rule_id: { type: DataTypes.UUID },
  level: { type: DataTypes.INTEGER, allowNull: false },
  target_role: { type: DataTypes.STRING(64), allowNull: false },
  timeout_mins: { type: DataTypes.INTEGER, defaultValue: 30 }
}, standardOptions);

// 13. NotificationApproval
const NotificationApproval = sequelize.define('NotificationApproval', {
  ...standardAttributes,
  rule_id: { type: DataTypes.UUID },
  approval_type: { type: DataTypes.STRING(32), defaultValue: 'single' },
  approver_role: { type: DataTypes.STRING(64), allowNull: false }
}, standardOptions);

// 14. NotificationTemplate
const NotificationTemplate = sequelize.define('NotificationTemplate', {
  ...standardAttributes,
  template_code: { type: DataTypes.STRING(128), allowNull: false, unique: true },
  subject: { type: DataTypes.STRING(255), allowNull: false },
  body_template: { type: DataTypes.TEXT, allowNull: false }
}, standardOptions);

// 15. NotificationVersion
const NotificationVersion = sequelize.define('NotificationVersion', {
  ...standardAttributes,
  version_number: { type: DataTypes.STRING(32), allowNull: false },
  changes_summary: { type: DataTypes.TEXT }
}, standardOptions);

// 16. NotificationExecution
const NotificationExecution = sequelize.define('NotificationExecution', {
  ...standardAttributes,
  rule_id: { type: DataTypes.UUID },
  event_code: { type: DataTypes.STRING(128) },
  execution_time_ms: { type: DataTypes.FLOAT },
  result_status: { type: DataTypes.STRING(32) }
}, standardOptions);

// 17. NotificationQueue
const NotificationQueue = sequelize.define('NotificationQueue', {
  ...standardAttributes,
  job_id: { type: DataTypes.STRING(128), allowNull: false, unique: true },
  payload: { type: DataTypes.JSON },
  queue_state: { type: DataTypes.STRING(32), defaultValue: 'pending' }
}, standardOptions);

// 18. NotificationLog
const NotificationLog = sequelize.define('NotificationLog', {
  ...standardAttributes,
  event_code: { type: DataTypes.STRING(128) },
  log_level: { type: DataTypes.STRING(16), defaultValue: 'INFO' },
  message: { type: DataTypes.TEXT }
}, standardOptions);

// 19. NotificationStatistic
const NotificationStatistic = sequelize.define('NotificationStatistic', {
  ...standardAttributes,
  metric_date: { type: DataTypes.DATEONLY, allowNull: false },
  total_sent: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_failed: { type: DataTypes.INTEGER, defaultValue: 0 }
}, standardOptions);

// 20. NotificationAuditLog
const NotificationAuditLog = sequelize.define('NotificationAuditLog', {
  ...standardAttributes,
  user_id: { type: DataTypes.STRING(128) },
  action: { type: DataTypes.STRING(128), allowNull: false },
  ip_address: { type: DataTypes.STRING(45) },
  user_agent: { type: DataTypes.STRING(255) }
}, standardOptions);

// 21. NotificationWebhook
const NotificationWebhook = sequelize.define('NotificationWebhook', {
  ...standardAttributes,
  target_url: { type: DataTypes.STRING(255), allowNull: false },
  secret_key: { type: DataTypes.STRING(255) }
}, standardOptions);

// 22. NotificationApiKey
const NotificationApiKey = sequelize.define('NotificationApiKey', {
  ...standardAttributes,
  key_name: { type: DataTypes.STRING(128), allowNull: false },
  api_key_hash: { type: DataTypes.STRING(255), allowNull: false }
}, standardOptions);

// 23. NotificationUserPreference
const NotificationUserPreference = sequelize.define('NotificationUserPreference', {
  ...standardAttributes,
  user_id: { type: DataTypes.STRING(128), allowNull: false },
  channel_preferences: { type: DataTypes.JSON }
}, standardOptions);

// 24. NotificationDeliveryHistory
const NotificationDeliveryHistory = sequelize.define('NotificationDeliveryHistory', {
  ...standardAttributes,
  channel: { type: DataTypes.STRING(32), allowNull: false },
  recipient: { type: DataTypes.STRING(255), allowNull: false },
  delivered_at: { type: DataTypes.DATE }
}, standardOptions);

// 25. NotificationFailure
const NotificationFailure = sequelize.define('NotificationFailure', {
  ...standardAttributes,
  error_code: { type: DataTypes.STRING(64) },
  error_message: { type: DataTypes.TEXT }
}, standardOptions);

// 26. NotificationSetting
const NotificationSetting = sequelize.define('NotificationSetting', {
  ...standardAttributes,
  setting_key: { type: DataTypes.STRING(128), allowNull: false, unique: true },
  setting_value: { type: DataTypes.TEXT }
}, standardOptions);

// Setup Associations
NotificationRule.hasMany(NotificationCondition, { foreignKey: 'rule_id' });
NotificationCondition.belongsTo(NotificationRule, { foreignKey: 'rule_id' });

NotificationRule.hasMany(NotificationAction, { foreignKey: 'rule_id' });
NotificationAction.belongsTo(NotificationRule, { foreignKey: 'rule_id' });

NotificationRule.hasMany(NotificationRecipient, { foreignKey: 'rule_id' });
NotificationRecipient.belongsTo(NotificationRule, { foreignKey: 'rule_id' });

module.exports = {
  NotificationRule,
  NotificationEvent,
  NotificationCondition,
  NotificationAction,
  NotificationWorkflow,
  NotificationRecipient,
  NotificationChannel,
  NotificationPriority,
  NotificationSchedule,
  NotificationReminder,
  NotificationRetry,
  NotificationEscalation,
  NotificationApproval,
  NotificationTemplate,
  NotificationVersion,
  NotificationExecution,
  NotificationQueue,
  NotificationLog,
  NotificationStatistic,
  NotificationAuditLog,
  NotificationWebhook,
  NotificationApiKey,
  NotificationUserPreference,
  NotificationDeliveryHistory,
  NotificationFailure,
  NotificationSetting
};
