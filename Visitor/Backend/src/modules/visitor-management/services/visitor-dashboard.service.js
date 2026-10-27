const visitorDashboardRepository = require('../repositories/visitor-dashboard.repository');

class VisitorDashboardService {
  /**
   * Main aggregate endpoint response for Module 4.1 Visitor Dashboard
   */
  async getDashboardOverview(user, queryFilters = {}) {
    const filters = this._buildFilters(user, queryFilters);

    const [kpiCards, alerts, timeline, charts, recentVisitors, pendingTasks] = await Promise.all([
      visitorDashboardRepository.getKpiCards(filters),
      visitorDashboardRepository.getAlerts(filters),
      visitorDashboardRepository.getActivityTimeline(filters, 10),
      visitorDashboardRepository.getChartsData(filters),
      visitorDashboardRepository.getRecentVisitors({ ...filters, limit: 10, offset: 0 }),
      visitorDashboardRepository.getPendingTasks(filters)
    ]);

    return {
      module: 'Module 4.1 – Visitor Dashboard',
      organizationId: filters.organizationId || null,
      user: {
        id: user.id,
        username: user.username || user.full_name || 'Administrator',
        role: user.role || 'admin',
      },
      serverTime: new Date().toISOString(),
      kpiCards,
      alerts,
      timeline,
      charts,
      recentVisitors,
      pendingTasks
    };
  }

  async getCards(user, queryFilters = {}) {
    const filters = this._buildFilters(user, queryFilters);
    return visitorDashboardRepository.getKpiCards(filters);
  }

  async getCharts(user, queryFilters = {}) {
    const filters = this._buildFilters(user, queryFilters);
    return visitorDashboardRepository.getChartsData(filters);
  }

  async getRecent(user, queryFilters = {}) {
    const filters = this._buildFilters(user, queryFilters);
    return visitorDashboardRepository.getRecentVisitors(filters);
  }

  async getAlerts(user, queryFilters = {}) {
    const filters = this._buildFilters(user, queryFilters);
    return visitorDashboardRepository.getAlerts(filters);
  }

  async getTasks(user, queryFilters = {}) {
    const filters = this._buildFilters(user, queryFilters);
    return visitorDashboardRepository.getPendingTasks(filters);
  }

  async search(user, queryStr, queryFilters = {}) {
    const filters = this._buildFilters(user, queryFilters);
    return visitorDashboardRepository.quickSearch(queryStr, filters);
  }

  async getStatistics(user, queryFilters = {}) {
    const filters = this._buildFilters(user, queryFilters);
    return visitorDashboardRepository.getDetailedStatistics(filters);
  }

  /**
   * Builds context filters derived from authenticated user scope & URL params
   */
  _buildFilters(user, queryFilters = {}) {
    const userRole = (user?.role || '').toLowerCase();
    const isAdmin = ['admin', 'super_admin', 'system_admin'].includes(userRole);
    const userOrgId = user?.organizationId || user?.organization_id || null;
    const organizationId = isAdmin
      ? (queryFilters.organizationId || queryFilters.organization_id || userOrgId || null)
      : (userOrgId || null);
    const branchId = queryFilters.branchId || null;
    const departmentId = queryFilters.departmentId || null;
    const dateFrom = queryFilters.dateFrom || null;
    const dateTo = queryFilters.dateTo || null;
    const category = queryFilters.category || null;
    const status = queryFilters.status || null;
    const search = queryFilters.search || null;
    const limit = queryFilters.limit ? parseInt(queryFilters.limit) : 10;
    const offset = queryFilters.offset ? parseInt(queryFilters.offset) : 0;

    return {
      organizationId,
      branchId,
      departmentId,
      dateFrom,
      dateTo,
      category,
      status,
      search,
      limit,
      offset
    };
  }
}

module.exports = new VisitorDashboardService();
