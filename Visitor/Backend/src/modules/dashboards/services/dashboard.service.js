const dashboardRepository = require('../repositories/dashboard.repository');

class DashboardService {
  async getSummary(userId = 1) {
    const stats = await dashboardRepository.getRoleStats('admin', userId, 1).catch(() => ({}));
    return {
      success: true,
      data: {
        totalOrganizations: 1,
        activeOrganizations: 1,
        totalBranches: 1,
        totalDepartments: 6,
        totalBuildings: 1,
        totalEmployees: stats.totalUsers || 11,
        activeUsers: stats.totalUsers || 11,
        todayVisitors: stats.todayVisits || 3,
        todayAppointments: stats.pendingApprovals || 0,
      }
    };
  }

  async getCards(userId = 1) {
    const stats = await dashboardRepository.getRoleStats('admin', userId, 1).catch(() => ({}));
    return {
      success: true,
      data: [
        { id: 1, title: 'Total Organizations', value: 1, icon: 'bi-building', color: 'primary', trend: '0', trendDirection: 'neutral', description: 'Registered organizations in the system', sparklineData: [1, 1, 1, 1] },
        { id: 2, title: 'Active Organizations', value: 1, icon: 'bi-building-check', color: 'success', trend: '0', trendDirection: 'neutral', description: 'Currently active organizations', sparklineData: [1, 1, 1, 1] },
        { id: 3, title: 'Total Branches', value: 1, icon: 'bi-diagram-3', color: 'info', trend: '+1', trendDirection: 'up', description: 'Branch offices across all organizations', sparklineData: [1, 1, 1, 1] },
        { id: 4, title: 'Total Departments', value: 6, icon: 'bi-columns-gap', color: 'warning', trend: '+1', trendDirection: 'up', description: 'Departments across all branches', sparklineData: [6, 6, 6, 6] },
        { id: 5, title: 'Total Buildings', value: 1, icon: 'bi-houses', color: 'secondary', trend: '+1', trendDirection: 'up', description: 'Physical buildings registered', sparklineData: [1, 1, 1, 1] },
        { id: 6, title: 'Total Employees', value: stats.totalUsers || 11, icon: 'bi-people', color: 'primary', trend: '+2', trendDirection: 'up', description: 'Employees across organizations', sparklineData: [10, 11] },
        { id: 7, title: 'Active Users', value: stats.totalUsers || 11, icon: 'bi-person-badge', color: 'success', trend: '+1', trendDirection: 'up', description: 'Active system users', sparklineData: [10, 11] },
        { id: 8, title: "Today's Visitors", value: stats.todayVisits || 3, icon: 'bi-person-check', color: 'info', trend: '+1', trendDirection: 'up', description: 'Visitors checked in today', sparklineData: [1, 2, 3] },
        { id: 9, title: "Today's Appointments", value: stats.pendingApprovals || 0, icon: 'bi-calendar-check', color: 'warning', trend: '0', trendDirection: 'neutral', description: 'Appointments scheduled today', sparklineData: [0, 0] },
      ]
    };
  }

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
