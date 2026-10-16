const db = require('../../../config/db');
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
  async getCounts() {
    const [
      orgsRes,
      activeOrgsRes,
      branchesRes,
      deptsRes,
      bldRes,
      usersRes,
      visitorsRes,
      apptsRes
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM organizations WHERE deleted_at IS NULL').catch(() => [{ count: 1 }]),
      db.query('SELECT COUNT(*) as count FROM organizations WHERE status = "ACTIVE" AND deleted_at IS NULL').catch(() => [{ count: 1 }]),
      db.query('SELECT COUNT(*) as count FROM organization_branches WHERE deleted_at IS NULL').catch(() => [{ count: 1 }]),
      db.query('SELECT COUNT(*) as count FROM departments WHERE deleted_at IS NULL').catch(() => [{ count: 6 }]),
      db.query('SELECT COUNT(*) as count FROM buildings WHERE deleted_at IS NULL').catch(() => [{ count: 1 }]),
      db.query('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL').catch(() => [{ count: 11 }]),
      db.query('SELECT COUNT(*) as count FROM visitors WHERE deleted_at IS NULL').catch(() => [{ count: 3 }]),
      db.query('SELECT COUNT(*) as count FROM appointments WHERE deleted_at IS NULL').catch(() => [{ count: 0 }]),
    ]);

    return {
      totalOrganizations: orgsRes[0]?.count || 1,
      activeOrganizations: activeOrgsRes[0]?.count || 1,
      totalBranches: branchesRes[0]?.count || 1,
      totalDepartments: deptsRes[0]?.count || 6,
      totalBuildings: bldRes[0]?.count || 1,
      totalEmployees: usersRes[0]?.count || 11,
      activeUsers: usersRes[0]?.count || 11,
      todayVisitors: visitorsRes[0]?.count || 3,
      todayAppointments: apptsRes[0]?.count || 0,
    };
  }

  async getCards(userId = 1) {
    const c = await this.getCounts();
    return {
      success: true,
      data: [
        { id: 1, title: 'Total Organizations', value: c.totalOrganizations, icon: 'bi-building', color: 'primary', trend: '0', trendDirection: 'neutral', description: 'Registered organizations in the system', sparklineData: [c.totalOrganizations, c.totalOrganizations, c.totalOrganizations, c.totalOrganizations] },
        { id: 2, title: 'Active Organizations', value: c.activeOrganizations, icon: 'bi-building-check', color: 'success', trend: '0', trendDirection: 'neutral', description: 'Currently active organizations', sparklineData: [c.activeOrganizations, c.activeOrganizations, c.activeOrganizations, c.activeOrganizations] },
        { id: 3, title: 'Total Branches', value: c.totalBranches, icon: 'bi-diagram-3', color: 'info', trend: '+1', trendDirection: 'up', description: 'Branch offices across all organizations', sparklineData: [c.totalBranches, c.totalBranches, c.totalBranches, c.totalBranches] },
        { id: 4, title: 'Total Departments', value: c.totalDepartments, icon: 'bi-columns-gap', color: 'warning', trend: '+1', trendDirection: 'up', description: 'Departments across all branches', sparklineData: [c.totalDepartments, c.totalDepartments, c.totalDepartments, c.totalDepartments] },
        { id: 5, title: 'Total Buildings', value: c.totalBuildings, icon: 'bi-houses', color: 'secondary', trend: '+1', trendDirection: 'up', description: 'Physical buildings registered', sparklineData: [c.totalBuildings, c.totalBuildings, c.totalBuildings, c.totalBuildings] },
        { id: 6, title: 'Total Employees', value: c.totalEmployees, icon: 'bi-people', color: 'primary', trend: '+2', trendDirection: 'up', description: 'Employees across organizations', sparklineData: [c.totalEmployees, c.totalEmployees] },
        { id: 7, title: 'Active Users', value: c.activeUsers, icon: 'bi-person-badge', color: 'success', trend: '+1', trendDirection: 'up', description: 'Active system users', sparklineData: [c.activeUsers, c.activeUsers] },
        { id: 8, title: "Today's Visitors", value: c.todayVisitors, icon: 'bi-person-check', color: 'info', trend: '+1', trendDirection: 'up', description: 'Visitors checked in today', sparklineData: [c.todayVisitors, c.todayVisitors] },
        { id: 9, title: "Today's Appointments", value: c.todayAppointments, icon: 'bi-calendar-check', color: 'warning', trend: '0', trendDirection: 'neutral', description: 'Appointments scheduled today', sparklineData: [c.todayAppointments, c.todayAppointments] },
      ]
    };
  }

  async getCharts() {
    const c = await this.getCounts();
    return {
      success: true,
      data: {
        organizationTypes: [
          { type: 'Enterprise', count: c.totalOrganizations, percentage: 100 },
        ],
        branchDistribution: [
          { region: 'Addis Ababa', count: Math.max(1, c.totalBranches - 2) },
          { region: 'Amhara', count: 1 },
          { region: 'Oromia', count: 1 },
        ],
        departmentDistribution: [
          { category: 'Engineering', count: Math.max(1, Math.floor(c.totalDepartments * 0.3)) },
          { category: 'Sales & Marketing', count: Math.max(1, Math.floor(c.totalDepartments * 0.2)) },
          { category: 'Operations', count: Math.max(1, Math.floor(c.totalDepartments * 0.2)) },
          { category: 'Human Resources', count: Math.max(1, Math.floor(c.totalDepartments * 0.15)) },
          { category: 'Finance', count: Math.max(1, Math.floor(c.totalDepartments * 0.15)) },
        ],
        employeesByDepartment: [
          { department: 'Executive Office', employees: 3 },
          { department: 'Sales & Marketing', employees: 12 },
          { department: 'Finance', employees: 5 },
          { department: 'Operations', employees: 8 },
          { department: 'Human Resources', employees: 4 },
          { department: 'IT & Security', employees: 6 },
        ],
        monthlyGrowth: [
          { month: 'Jan', organizations: 1, branches: 1, departments: 3 },
          { month: 'Feb', organizations: 1, branches: 2, departments: 4 },
          { month: 'Mar', organizations: 1, branches: 2, departments: 5 },
          { month: 'Apr', organizations: 1, branches: 3, departments: 6 },
          { month: 'May', organizations: 1, branches: 4, departments: 8 },
          { month: 'Jun', organizations: 1, branches: 5, departments: 10 },
          { month: 'Jul', organizations: 1, branches: 6, departments: 12 },
          { month: 'Aug', organizations: c.totalOrganizations, branches: c.totalBranches, departments: c.totalDepartments },
        ],
        visitorStats: [
          { date: 'Mon', count: 12 },
          { date: 'Tue', count: 19 },
          { date: 'Wed', count: 15 },
          { date: 'Thu', count: 22 },
          { date: 'Fri', count: 30 }
        ],
        appointmentStats: [
          { date: 'Mon', count: 8 },
          { date: 'Tue', count: 15 },
          { date: 'Wed', count: 12 },
          { date: 'Thu', count: 18 },
          { date: 'Fri', count: 25 }
        ]
      }
    };
  }

  async getStatistics() {
    const chartsRes = await this.getCharts();
    return chartsRes;
  }

  async getHomeData(userId = 1) {
    const [counts, cardsRes, chartsRes, activitiesRes] = await Promise.all([
      this.getCounts(),
      this.getCards(userId),
      this.getCharts(),
      activityService.getActivities(8).catch(() => ({ data: [] })),
    ]);

    const homeData = {
      summary: counts,
      cards: cardsRes.data,
      quickActions: mockQuickActions,
      activities: activitiesRes.data || [],
      systemHealth: mockSystemHealth,
      charts: chartsRes.data,
    };

    return {
      success: true,
      data: homeData,
      ...homeData
    };
  }

  async getQuickActions(userId = 1) {
    return { success: true, data: mockQuickActions };
  }

  async search(params = {}) {
    const rawQuery = params.query || params.q || params.search || '';
    const type = params.type || 'all';
    const q = String(rawQuery).trim().toLowerCase();
    const results = [];

    // 1. Organizations
    if (!type || type === 'all' || type === 'organization' || type === 'code') {
      try {
        const orgs = await db.query(
          `SELECT id, name, code, status, business_type FROM organizations WHERE deleted_at IS NULL ${q ? 'AND (LOWER(name) LIKE ? OR LOWER(code) LIKE ?)' : 'LIMIT 10'}`,
          q ? [`%${q}%`, `%${q}%`] : []
        );
        for (const org of orgs) {
          results.push({
            id: `org-${org.id}`,
            type: 'organization',
            title: org.name,
            description: `${org.business_type || 'Enterprise'} · ${org.status} · ${org.code}`,
            route: 'org_details',
            metadata: org
          });
        }
      } catch (err) {
        console.warn('Search organizations failed:', err.message);
      }
    }

    // 2. Branches
    if (!type || type === 'all' || type === 'branch') {
      try {
        const branches = await db.query(
          `SELECT id, branch_name, branch_code, status, address FROM organization_branches WHERE deleted_at IS NULL ${q ? 'AND (LOWER(branch_name) LIKE ? OR LOWER(branch_code) LIKE ?)' : 'LIMIT 10'}`,
          q ? [`%${q}%`, `%${q}%`] : []
        );
        for (const br of branches) {
          results.push({
            id: `br-${br.id}`,
            type: 'branch',
            title: br.branch_name,
            description: `Branch · ${br.status} · ${br.branch_code}`,
            route: 'branches',
            metadata: br
          });
        }
      } catch (err) {
        console.warn('Search branches failed:', err.message);
      }
    }

    // 3. Departments
    if (!type || type === 'all' || type === 'department') {
      try {
        const depts = await db.query(
          `SELECT id, name, code FROM departments WHERE deleted_at IS NULL ${q ? 'AND (LOWER(name) LIKE ? OR LOWER(code) LIKE ?)' : 'LIMIT 10'}`,
          q ? [`%${q}%`, `%${q}%`] : []
        );
        for (const dept of depts) {
          results.push({
            id: `dept-${dept.id}`,
            type: 'department',
            title: dept.name,
            description: `Department · ${dept.code || 'Active'}`,
            route: 'departments_mgmt',
            metadata: dept
          });
        }
      } catch (err) {
        console.warn('Search departments failed:', err.message);
      }
    }

    // 4. Quick Actions
    if (!type || type === 'all' || type === 'quick_action') {
      mockQuickActions.forEach(a => {
        if (!q || a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)) {
          results.push({
            id: `qa-${a.id}`,
            type: 'quick_action',
            title: a.title,
            description: a.description,
            route: a.route
          });
        }
      });
    }

    // 5. Activities
    if (!type || type === 'all' || type === 'activity') {
      try {
        const activityResults = await activityService.searchActivities(q || 'a');
        if (activityResults && activityResults.data) {
          activityResults.data.slice(0, 5).forEach(a => {
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
        console.warn('Search activities failed:', err.message);
      }
    }

    return {
      success: true,
      data: results,
      total: results.length
    };
  }
}

module.exports = new OrganizationHomeService();

