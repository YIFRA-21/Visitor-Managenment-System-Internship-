const fs = require('fs');
const path = require('path');

// Helper to extract routes from an Express router
function extractRoutesFromRouter(basePath, router) {
  const routes = [];
  if (!router || !router.stack) return routes;

  router.stack.forEach((layer) => {
    if (layer.route) {
      const routePath = layer.route.path;
      const fullPath = (basePath + (routePath === '/' ? '' : routePath)).replace(/\/+/g, '/');
      const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase());
      methods.forEach((method) => {
        routes.push({
          method,
          path: fullPath,
        });
      });
    } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
      routes.push(...extractRoutesFromRouter(basePath, layer.handle));
    }
  });

  return routes;
}

// Map each module prefix to its router file
const routerMappings = [
  { module: 'Authentication', prefix: '/api/auth', file: './src/modules/authentication/routes/auth.routes' },
  { module: 'Departments', prefix: '/api/departments', file: './src/modules/department-management/routes/department.routes' },
  { module: 'Employees', prefix: '/api/employees', file: './src/modules/employee-management/routes/employee.routes' },
  { module: 'Employee Portal', prefix: '/api/employee-portal', file: './src/modules/employee-management/routes/employee-portal.routes' },
  { module: 'Appointments', prefix: '/api/appointments', file: './src/modules/appointment-management/routes/appointment.routes' },
  { module: 'Check-In', prefix: '/api/checkin', file: './src/modules/check-in-out/routes/checkin.routes' },
  { module: 'Check-Out', prefix: '/api/checkout', file: './src/modules/check-in-out/routes/checkout.routes' },
  { module: 'Reports & Analytics', prefix: '/api/reports', file: './src/modules/reporting-analytics/routes/report.routes' },
  { module: 'Building & Rooms', prefix: '/api/rooms', file: './src/modules/building-room/routes/room.routes' },
  { module: 'Notifications', prefix: '/api/notifications', file: './src/modules/notifications/routes/notification.routes' },
  { module: 'Communications', prefix: '/api/communication', file: './src/modules/notifications/routes/communication.routes' },
  { module: 'Security & Access', prefix: '/api/security', file: './src/modules/security-access/routes/security.routes' },
  { module: 'Organizations', prefix: '/api/organizations', file: './src/modules/organization-management/routes/org.routes' },
  { module: 'Organization Home', prefix: '/api/organization/home', file: './src/modules/organization-management/routes/org-home.routes' },
  { module: 'Branches', prefix: '/api/branches', file: './src/modules/organization-management/routes/branches.routes' },
  { module: 'Users', prefix: '/api/users', file: './src/modules/user-management/routes/user.routes' },
  { module: 'Roles', prefix: '/api/roles', file: './src/modules/role-management/routes/role.routes' },
  { module: 'System Admin', prefix: '/api/system', file: './src/modules/system-admin/routes/system.routes' },
  { module: 'Audit Logs', prefix: '/api/audit-logs', file: './src/modules/system-admin/routes/system.routes' },
  { module: 'Manager', prefix: '/api/manager', file: './src/modules/employee-management/routes/manager.routes' },
  { module: 'Calendar', prefix: '/api/calendar', file: './src/modules/calendar-scheduling/routes/calendar.routes' },
  { module: 'Visitor Portal', prefix: '/api/visitor', file: './src/modules/visitor-management/routes/visitor-portal.routes' },
  { module: 'Visitor Registration', prefix: '/api/visitors/registration', file: './src/modules/visitor-management/routes/visitor-registration.routes' },
  { module: 'Reception', prefix: '/api/reception', file: './src/modules/reception/routes/reception.routes' },
  { module: 'Reporting Exports', prefix: '/api/exports', file: './src/modules/reporting-analytics/routes/exports.routes' },
  { module: 'Identity', prefix: '/api/identity', file: './src/modules/visitor-management/routes/identity.routes' },
  { module: 'Dashboard', prefix: '/api/dashboard', file: './src/modules/dashboards/routes/dashboard.routes' },
  { module: 'Resources', prefix: '/api/resources', file: './src/modules/permission-management/routes/resources.routes' },
  { module: 'Permissions', prefix: '/api/permissions', file: './src/modules/permission-management/routes/permission.routes' },
  { module: 'Hierarchy', prefix: '/api/hierarchy', file: './src/modules/organization-management/routes/hierarchy.routes' },
  { module: 'Settings', prefix: '/api/settings', file: './src/modules/system-admin/routes/settings.routes' },
  { module: 'Visitor Profiles', prefix: '/api/visitor-profiles', file: './src/modules/visitor-management/routes/visitor-profiles.routes' },
  { module: 'Identity Verification', prefix: '/api/identity-verification', file: './src/modules/visitor-management/routes/identity-verification.routes' },
  { module: 'Documents', prefix: '/api/documents', file: './src/modules/document-management/routes/document.routes' },
  { module: 'Visitor Categories', prefix: '/api/visitor-categories', file: './src/modules/visitor-management/routes/visitor-categories.routes' },
  { module: 'Visitor History', prefix: '/api/visitor-history', file: './src/modules/visitor-history/routes/visitor-history.routes' },
  { module: 'Workflows & Approvals', prefix: '/api/workflows', file: './src/modules/approval-workflow/routes/workflow.routes' },
  { module: 'Watchlist & Blacklist', prefix: '/api/security/blacklist-watchlist', file: './src/modules/blacklist-watchlist/routes/watchlist.routes' },
  { module: 'Feedback & Support', prefix: '/api/feedback-support', file: './src/modules/system-admin/routes/feedback-support.routes' },
  { module: 'Workflow Rules Engine', prefix: '/api/rules', file: './src/modules/approval-workflow/routes/workflow-rules.routes' }
];

const allCatalog = {};
let totalCount = 0;

for (const entry of routerMappings) {
  try {
    const resolvedPath = path.resolve(__dirname, '..', entry.file);
    const mod = require(resolvedPath);
    const router = mod.default || mod;
    const routes = extractRoutesFromRouter(entry.prefix, router);
    if (!allCatalog[entry.module]) {
      allCatalog[entry.module] = [];
    }
    routes.forEach((r) => {
      // Avoid duplicate listing
      const exists = allCatalog[entry.module].some((x) => x.method === r.method && x.path === r.path);
      if (!exists) {
        allCatalog[entry.module].push(r);
        totalCount++;
      }
    });
  } catch (err) {
    // console.warn('Could not load router:', entry.file, err.message);
  }
}

fs.writeFileSync(path.join(__dirname, '../ALL_API_ENDPOINTS.json'), JSON.stringify(allCatalog, null, 2), 'utf8');
console.log('TOTAL_ENDPOINTS:', totalCount);
