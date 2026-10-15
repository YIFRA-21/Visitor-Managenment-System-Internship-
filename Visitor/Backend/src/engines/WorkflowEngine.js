const EventEngine = require('./EventEngine');
const RuleEvaluationEngine = require('./RuleEvaluationEngine');
const RecipientEngine = require('./RecipientEngine');
const ChannelEngine = require('./ChannelEngine');
const SchedulingEngine = require('./SchedulingEngine');
const ApprovalEngine = require('./ApprovalEngine');
const QueueEngine = require('./QueueEngine');
const AuditEngine = require('./AuditEngine');

class WorkflowEngine {
  async processEvent(eventName, payload, activeRules = []) {
    const startTime = Date.now();

    // 1. Ingest Event
    const event = EventEngine.publishEvent(eventName, payload);

    // 2. Evaluate Rules & Conditions
    const matchedRules = RuleEvaluationEngine.evaluateRules(activeRules, payload);

    // 3. Resolve Recipients
    const targetScopes = matchedRules.flatMap(r => r.recipients || ['Host Employee']);
    const resolvedRecipients = RecipientEngine.resolveRecipients(targetScopes, payload);

    // 4. Resolve Channels & Priority
    const priority = matchedRules[0]?.priority || 'medium';
    const channels = ChannelEngine.resolveChannels(matchedRules[0]?.channels || ['in_app', 'email'], priority);

    // 5. Approval Gate Check
    const requiresApproval = matchedRules.some(r => r.category === 'Approval Workflow' || priority === 'critical');
    const approvalWorkflow = requiresApproval ? ApprovalEngine.createApprovalWorkflow('single') : null;

    // 6. Calculate Schedule
    const schedule = SchedulingEngine.calculateSchedule(matchedRules[0]?.trigger_type || 'immediate');

    // 7. Enqueue Job
    const job = QueueEngine.enqueue({
      event,
      matchedRules,
      recipients: resolvedRecipients,
      channels,
      schedule,
      requiresApproval
    });

    const executionTimeMs = Date.now() - startTime;

    return {
      workflowId: `WF-${Date.now()}`,
      eventName,
      event,
      matchedRulesCount: matchedRules.length,
      matchedRules,
      recipients: resolvedRecipients,
      channels,
      requiresApproval,
      approvalWorkflow,
      schedule,
      jobId: job.jobId,
      executionTimeMs: `${executionTimeMs} ms`,
      status: requiresApproval ? 'AWAITING_APPROVAL' : 'QUEUED'
    };
  }
}

module.exports = new WorkflowEngine();
