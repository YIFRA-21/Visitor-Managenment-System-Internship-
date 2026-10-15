const RuleEngineRepository = require('../../system-admin/repositories/rule-engine.repository');
const TransactionManager = require('../../../utils/transactionManager');
const ApiResponse = require('../../../utils/apiResponse');

class NotificationPersistenceController {
  // GET /api/v1/notifications/rules (Paginated, Search, Filter)
  async getRules(req, res) {
    try {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 10);
      const search = req.query.search || '';
      const status = req.query.status || '';

      const allRules = await RuleEngineRepository.getAllRules();
      let filtered = allRules.filter(r => {
        const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.business_event.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !status || r.status === status;
        return matchesSearch && matchesStatus;
      });

      const total = filtered.length;
      const startIndex = (page - 1) * limit;
      const paginatedRules = filtered.slice(startIndex, startIndex + limit);

      return res.status(200).json({
        success: true,
        message: 'Notification rules fetched successfully',
        data: paginatedRules,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.requestId || 'REQ-PART7',
        pagination: {
          page,
          limit,
          totalRows: total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      return ApiResponse.error(res, 'Failed to fetch rules', err.message);
    }
  }

  // POST /api/v1/notifications/rules (Transactional Create)
  async createRule(req, res) {
    try {
      const result = await TransactionManager.executeTransaction(async (t) => {
        return await RuleEngineRepository.saveRule({
          ...req.body,
          created_by: req.user?.id || 'Admin'
        });
      });

      return ApiResponse.success(res, result, 'Rule created successfully with transaction', 201);
    } catch (err) {
      return ApiResponse.error(res, 'Transaction failed: Could not create rule', err.message);
    }
  }

  // DELETE /api/v1/notifications/rules/:id (Soft Delete / Paranoid)
  async softDeleteRule(req, res) {
    try {
      const { id } = req.params;
      await RuleEngineRepository.updateRuleStatus(id, 'archived');
      return ApiResponse.success(res, { id, archived: true }, 'Rule soft deleted (archived) successfully');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to soft delete rule', err.message);
    }
  }

  // POST /api/v1/notifications/rules/:id/restore
  async restoreRule(req, res) {
    try {
      const { id } = req.params;
      await RuleEngineRepository.updateRuleStatus(id, 'active');
      return ApiResponse.success(res, { id, status: 'active' }, 'Rule restored successfully');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to restore rule', err.message);
    }
  }
}

module.exports = new NotificationPersistenceController();
