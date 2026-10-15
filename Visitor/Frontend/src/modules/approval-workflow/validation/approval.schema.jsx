import { required, selectRequired, minLength } from '../../../validation/validators';

export const approvalDecisionSchema = {
  decision: selectRequired('Approval decision'),
  comments: (val) => required('Decision remarks')(val) || minLength(5, 'Decision remarks')(val),
};

export const workflowRuleSchema = {
  ruleName: required('Workflow rule name'),
  approverRole: selectRequired('Approver role'),
  escalationTimeoutHours: required('Escalation timeout (hours)'),
};
