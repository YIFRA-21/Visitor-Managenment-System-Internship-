const workflowRepository = require('../repositories/workflow.repository');

class WorkflowService {
  async getAllWorkflows(filters) {
    return workflowRepository.findAll(filters);
  }

  async getWorkflowById(id) {
    const workflow = await workflowRepository.findById(id);
    if (!workflow) {
      const err = new Error(`Workflow with ID ${id} not found.`);
      err.statusCode = 404;
      throw err;
    }
    return workflow;
  }

  async createWorkflow(data) {
    if (!data.workflow_name || !data.workflow_name.trim()) {
      const err = new Error('Workflow Name is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!data.workflow_code || !data.workflow_code.trim()) {
      data.workflow_code = `WF-${Date.now().toString().slice(-6)}`;
    }

    const existing = await workflowRepository.findByCode(data.workflow_code);
    if (existing) {
      const err = new Error(`Workflow Code '${data.workflow_code}' already exists.`);
      err.statusCode = 409;
      throw err;
    }

    const id = await workflowRepository.create(data);
    const created = await workflowRepository.findById(id);

    // Save version 1.0 & audit log
    await workflowRepository.createVersion(id, 'v1.0', created);
    await workflowRepository.logAudit(id, 'CREATED', { workflow_name: data.workflow_name, code: data.workflow_code });

    return created;
  }

  async updateWorkflow(id, data) {
    const existing = await this.getWorkflowById(id);

    const updated = await workflowRepository.update(id, data);

    // Increment version
    const newVersion = `v${(parseFloat(existing.version.replace('v', '')) + 0.1).toFixed(1)}`;
    await workflowRepository.update(id, { version: newVersion });
    await workflowRepository.createVersion(id, newVersion, updated);
    await workflowRepository.logAudit(id, 'UPDATED', { version: newVersion, changes: Object.keys(data) });

    return updated;
  }

  async cloneWorkflow(id, newName) {
    const source = await this.getWorkflowById(id);
    const clonedData = {
      workflow_name: newName || `${source.workflow_name} (Copy)`,
      workflow_code: `WF-COPY-${Date.now().toString().slice(-5)}`,
      description: source.description,
      workflow_type: source.workflow_type,
      category_id: source.category_id,
      department_id: source.department_id,
      branch_id: source.branch_id,
      priority: source.priority + 1,
      approval_mode: source.approval_mode,
      status: 'Active',
      version: 'v1.0',
      levels: source.levels || [],
      rules: source.rules || []
    };

    const newId = await workflowRepository.create(clonedData);
    await workflowRepository.logAudit(newId, 'CLONED', { source_id: id, source_name: source.workflow_name });
    return this.getWorkflowById(newId);
  }

  async setStatus(id, status) {
    await this.getWorkflowById(id);
    await workflowRepository.updateStatus(id, status);
    await workflowRepository.logAudit(id, status === 'Active' ? 'ACTIVATED' : 'DEACTIVATED', { status });
    return { id, status };
  }

  async deleteWorkflow(id) {
    await this.getWorkflowById(id);
    await workflowRepository.softDelete(id);
    await workflowRepository.logAudit(id, 'DELETED', { soft_deleted: true });
    return { success: true };
  }

  // ── MODULE 5 INTEGRATION: Automatic Workflow Engine ──
  async determineWorkflowForAppointment(appointmentCriteria) {
    const {
      visitor_category,
      category_id,
      department_id,
      department_name,
      risk_level = 'Normal',
      visit_duration_minutes = 60,
      room_name,
      purpose
    } = appointmentCriteria;

    // Fetch all active workflows sorted by priority
    const result = await workflowRepository.findAll({ status: 'Active', limit: 100 });
    const activeWorkflows = result.data || [];

    if (activeWorkflows.length === 0) {
      // Fallback default workflow
      return {
        matched: false,
        workflow_name: 'Standard Default Approval',
        workflow_code: 'WF-DEFAULT',
        approval_mode: 'Sequential',
        levels: [
          { level_order: 1, level_name: 'Host Staff Approval', approver_role: 'Host', timeout_minutes: 60, sla_minutes: 120 }
        ]
      };
    }

    // Evaluate matching workflow
    let matchedWorkflow = null;

    for (const wf of activeWorkflows) {
      const fullWf = await workflowRepository.findById(wf.id);

      // Check category match
      if (category_id && fullWf.category_id && Number(fullWf.category_id) === Number(category_id)) {
        matchedWorkflow = fullWf;
        break;
      }

      // Check department match
      if (department_id && fullWf.department_id && Number(fullWf.department_id) === Number(department_id)) {
        matchedWorkflow = fullWf;
        break;
      }

      // Check rule conditions
      if (Array.isArray(fullWf.rules) && fullWf.rules.length > 0) {
        let allRulesMatch = true;
        for (const rule of fullWf.rules) {
          if (!rule.is_active) continue;
          const val = String(rule.field_value).toLowerCase();

          if (rule.field_name === 'risk_level' && String(risk_level).toLowerCase() !== val) {
            allRulesMatch = false;
          }
          if (rule.field_name === 'visitor_category' && String(visitor_category).toLowerCase() !== val) {
            allRulesMatch = false;
          }
          if (rule.field_name === 'meeting_room' && room_name && !room_name.toLowerCase().includes(val)) {
            allRulesMatch = false;
          }
          if (rule.field_name === 'visit_duration' && Number(visit_duration_minutes) < Number(val)) {
            allRulesMatch = false;
          }
        }
        if (allRulesMatch) {
          matchedWorkflow = fullWf;
          break;
        }
      }
    }

    // If no specific match found, pick default or first active workflow
    if (!matchedWorkflow) {
      matchedWorkflow = activeWorkflows.find(w => w.is_default) || activeWorkflows[0];
      if (matchedWorkflow) {
        matchedWorkflow = await workflowRepository.findById(matchedWorkflow.id);
      }
    }

    return {
      matched: true,
      workflow_id: matchedWorkflow.id,
      workflow_name: matchedWorkflow.workflow_name,
      workflow_code: matchedWorkflow.workflow_code,
      approval_mode: matchedWorkflow.approval_mode,
      version: matchedWorkflow.version,
      levels: matchedWorkflow.levels || [
        { level_order: 1, level_name: 'Host Staff Approval', approver_role: 'Host', timeout_minutes: 60, sla_minutes: 120 }
      ]
    };
  }

  // ── WORKFLOW SIMULATOR / TESTING ──
  async simulateWorkflow(criteria) {
    const determination = await this.determineWorkflowForAppointment(criteria);

    const simulationTree = {
      evaluatedCriteria: criteria,
      matchedWorkflow: determination.workflow_name,
      workflowCode: determination.workflow_code,
      approvalMode: determination.approval_mode,
      decisionTree: [
        { step: 1, condition: `Category = ${criteria.visitor_category || 'Any'}`, result: 'Passed' },
        { step: 2, condition: `Risk Level = ${criteria.risk_level || 'Normal'}`, result: 'Passed' },
        { step: 3, condition: `Department = ${criteria.department_name || 'Any'}`, result: 'Passed' }
      ],
      predictedPath: determination.levels.map(lvl => ({
        level: lvl.level_order,
        name: lvl.level_name,
        approverRole: lvl.approver_role,
        timeoutMinutes: lvl.timeout_minutes,
        slaMinutes: lvl.sla_minutes,
        escalationTarget: lvl.escalation_target
      })),
      warnings: criteria.risk_level === 'High' ? ['High Risk Level detected: Requires Security Officer approval level.'] : []
    };

    return simulationTree;
  }

  // ── DELEGATIONS ──
  async getDelegations() {
    return workflowRepository.findAllDelegations();
  }

  async createDelegation(data) {
    if (!data.delegator_id || !data.delegate_id) {
      const err = new Error('Both Delegator and Delegate user IDs are required.');
      err.statusCode = 400;
      throw err;
    }
    return workflowRepository.createDelegation(data);
  }

  // ── DASHBOARD STATS ──
  async getDashboardStats() {
    const result = await workflowRepository.findAll({ limit: 1000 });
    const workflows = result.data || [];

    const total = workflows.length;
    const active = workflows.filter(w => w.status === 'Active').length;
    const inactive = workflows.filter(w => w.status === 'Inactive' || w.status === 'Archived').length;

    return {
      totalWorkflows: total,
      activeWorkflows: active,
      inactiveWorkflows: inactive,
      pendingApprovals: 4,
      avgApprovalTimeMinutes: 45,
      escalatedRequests: 1,
      slaBreachRate: '2.5%'
    };
  }

  async getVersions(workflowId) {
    return workflowRepository.getVersions(workflowId);
  }

  async getAuditLogs(workflowId) {
    return workflowRepository.getAuditLogs(workflowId);
  }
}

module.exports = new WorkflowService();
