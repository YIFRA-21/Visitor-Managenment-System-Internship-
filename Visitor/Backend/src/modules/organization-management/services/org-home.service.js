const dashboardService = require('../../dashboards/services/dashboard.service');
const statisticsService = require('../../reporting-analytics/services/statistics.service');
const activityService = require('../../visitor-history/services/activity.service');

const mockQuickActions = [
  { id: 1, title: 'Create Organization', icon: 'bi-building-add', description: 'Register a new organization', route: 'create_organization', color: 'primary', requiredPermission: 'organization:create' },
  { id: 2, title: 'View Organizations', icon: 'bi-building', description: 'Browse all organizations', route: 'organizations', color: 'info', requiredPermission: 'organization:read' },
  { id: 3, title: 'Create Branch', icon: 'bi-diagram-3', description: 'Add a new branch', route: 'branches', color: 'success', requiredPermission: 'branch:create' },
  { id: 4, title: 'View Branches', icon: 'bi-layers', description: 'Browse all branches', route: 'branches', color: 'info', requiredPermission: 'branch:read' },
  { id: 5, title: 'Create Department', icon: 'bi-columns-gap', description: 'Add a new department', route: 'departments_mgmt', color: 'warning', requiredPermission: 'department:create' },
  { id: 6, title: 'View Departments', icon: 'bi-collection', description: 'Browse all departments', route: 'departments_mgmt', color: 'info', requiredPermission: 'department:read' },
  { id: 7, title: 'Organization Tree', icon: 'bi-diagram-2', description: 'View hierarchy structure', route: 'org_tree', color: 'secondary', requiredPermission: 'organization:read' },
  { id: 10, title: 'Contact Information', icon: 'bi-telephone', description: 'Manage contact details', route: 'org_settings', color: 'info', requiredPermission: 'organization:update' },
  { id: 12, title: 'Audit Logs', icon: 'bi-journal-text', description: 'View security logs', route: 'audit_logs', color: 'secondary', requiredPermission: 'audit:read' },
];

const mockSystemHealth = {
  apiStatus: 'healthy',
  dbStatus: 'healthy',
  lastSync: new Date().toISOString(),
  uptime: '99.97%',
};

class OrganizationHomeService {
  async getHomeData(userId) {
    const [summary, cards, activities] = await Promise.all([
      dashboardService.getSummary(),
      dashboardService.getCards(userId),
      activityService.getActivities(8),
    ]);
    return {
      success: true,
      data: {
        summary: summary.data,
        cards: cards.data,
        quickActions: mockQuickActions,
        activities: activities.data,
        systemHealth: mockSystemHealth,
      }
    };
  }

  async getQuickActions(userId) {
    return { success: true, data: mockQuickActions };
  }

  async search(params) {
    const { query, type } = params;
    const results = [];
    if (!query || !query.trim()) {
      return { success: true, data: results, total: 0 };
    }
    const q = query.toLowerCase();

    // 1. Search quick actions
    mockQuickActions.forEach(a => {
      if (a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)) {
        if (!type || type === 'all' || type === 'quick_action') {
          results.push({
            id: `qa-${a.id}`,
            type: 'quick_action',
            title: a.title,
            description: a.description,
            route: a.route
          });
        }
      }
    });

    // 2. Search activities using activityService
    if (!type || type === 'all' || type === 'activity') {
      try {
        const activityResults = await activityService.searchActivities(query);
        if (activityResults.success && activityResults.data) {
          activityResults.data.forEach(a => {
            results.push({
              id: `act-${a.id}`,
              type: 'activity',
              title: a.action,
              description: `by ${a.user} in ${a.module}`,
              route: 'audit_logs'
            });
          });
        }
      } catch (err) {
        console.warn('Activity search failed:', err.message);
      }
    }

    return { success: true, data: results, total: results.length };
  }
}

module.exports = new OrganizationHomeService();
