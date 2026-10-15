const workflowService = require('../services/workflow.service');

class WorkflowController {
  async getAllWorkflows(req, res, next) {
    try {
      const result = await workflowService.getAllWorkflows(req.query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getDashboardStats(req, res, next) {
    try {
      const stats = await workflowService.getDashboardStats();
      res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
  }

  async getWorkflowById(req, res, next) {
    try {
      const workflow = await workflowService.getWorkflowById(req.params.id);
      res.status(200).json({ success: true, data: workflow });
    } catch (err) {
      next(err);
    }
  }

  async createWorkflow(req, res, next) {
    try {
      const workflow = await workflowService.createWorkflow(req.body);
      res.status(201).json({ success: true, message: 'Workflow created successfully.', data: workflow });
    } catch (err) {
      next(err);
    }
  }

  async updateWorkflow(req, res, next) {
    try {
      const workflow = await workflowService.updateWorkflow(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Workflow updated successfully.', data: workflow });
    } catch (err) {
      next(err);
    }
  }

  async cloneWorkflow(req, res, next) {
    try {
      const workflow = await workflowService.cloneWorkflow(req.params.id, req.body.new_name);
      res.status(201).json({ success: true, message: 'Workflow cloned successfully.', data: workflow });
    } catch (err) {
      next(err);
    }
  }

  async setStatus(req, res, next) {
    try {
      const result = await workflowService.setStatus(req.params.id, req.body.status);
      res.status(200).json({ success: true, message: `Workflow status updated to ${req.body.status}.`, data: result });
    } catch (err) {
      next(err);
    }
  }

  async deleteWorkflow(req, res, next) {
    try {
      await workflowService.deleteWorkflow(req.params.id);
      res.status(200).json({ success: true, message: 'Workflow deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async determineWorkflow(req, res, next) {
    try {
      const result = await workflowService.determineWorkflowForAppointment(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async simulateWorkflow(req, res, next) {
    try {
      const result = await workflowService.simulateWorkflow(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getDelegations(req, res, next) {
    try {
      const result = await workflowService.getDelegations();
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async createDelegation(req, res, next) {
    try {
      const result = await workflowService.createDelegation(req.body);
      res.status(201).json({ success: true, message: 'Delegation created successfully.', data: result });
    } catch (err) {
      next(err);
    }
  }

  async getVersions(req, res, next) {
    try {
      const versions = await workflowService.getVersions(req.params.id);
      res.status(200).json({ success: true, data: versions });
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const logs = await workflowService.getAuditLogs(req.params.id);
      res.status(200).json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new WorkflowController();
