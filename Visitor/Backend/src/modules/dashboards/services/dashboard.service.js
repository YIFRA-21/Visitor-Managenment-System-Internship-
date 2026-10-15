const dashboardRepository = require('../repositories/dashboard.repository');

class DashboardService {
  async getDashboardStats(user) {
    const role = (user?.role || 'staff').toLowerCase();
    const userId = user?.id;
    const deptId = user?.departmentId || user?.department_id;
    return dashboardRepository.getStatsForRole(userId, role, deptId);
  }

  async getStatsForRole(userId, role, departmentId) {
    return dashboardRepository.getStatsForRole(userId, role, departmentId);
  }

  async getActivities() {
    return dashboardRepository.getRecentActivities(15);
  }

  async getLayout(userId) {
    return dashboardRepository.getUserLayout(userId);
  }

  async saveLayout(userId, layoutConfig) {
    return dashboardRepository.saveUserLayout(userId, layoutConfig);
  }

  async globalSearch(query) {
    return dashboardRepository.globalSearch(query);
  }
}

module.exports = new DashboardService();
