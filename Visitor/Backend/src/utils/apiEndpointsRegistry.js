/**
 * Complete Enterprise API Endpoints Registry & Postman Collection Generator
 * Dynamically scans all mounted routers to produce the full canonical catalog of all 614 endpoints
 * across 18 Business Modules / Collections.
 */

const fs = require('fs');
const path = require('path');

let cachedCatalog = null;
let cachedAll = null;

// Helper to classify an endpoint path into its business module
function getModuleInfo(endpointPath) {
  if (endpointPath.startsWith('/api/auth') || endpointPath.startsWith('/api/identity/first') || endpointPath.startsWith('/api/identity/unlock')) {
    return { id: 'auth', name: 'Authentication & Session', desc: 'User login, registration, JWT tokens, session lifecycle, password policies' };
  }
  if (endpointPath.startsWith('/api/users')) {
    return { id: 'users', name: 'User Management', desc: 'User accounts, invitations, bulk operations, user status, user search' };
  }
  if (endpointPath.startsWith('/api/roles')) {
    return { id: 'rbac', name: 'Roles & Access Control (RBAC)', desc: 'RBAC role definitions, permission bindings, conflict checks, SoD rules' };
  }
  if (endpointPath.startsWith('/api/permissions') || endpointPath.startsWith('/api/hierarchy')) {
    return { id: 'permissions', name: 'Fine-Grained Permissions & Hierarchy', desc: 'Atomic permissions, permission matrix, authorization test, node assignment' };
  }
  if (endpointPath.startsWith('/api/organizations') || endpointPath.startsWith('/api/organization/home') || endpointPath.startsWith('/api/branches') || endpointPath.startsWith('/api/departments') || endpointPath.startsWith('/api/rooms')) {
    return { id: 'organizations', name: 'Organizations, Branches & Facilities', desc: 'Tenants, campuses, physical buildings, departments, conference rooms' };
  }
  if (endpointPath.startsWith('/api/employees') || endpointPath.startsWith('/api/employee-portal') || endpointPath.startsWith('/api/manager')) {
    return { id: 'employees', name: 'Employees & Host Portal', desc: 'Host employee directory, visitor quotas, manager oversight dashboard' };
  }
  if (endpointPath.startsWith('/api/visitor-profiles')) {
    return { id: 'visitor-profiles', name: 'Visitor Profiles & Master Registry', desc: 'Visitor master records, badge photos, receptionist notes, status toggling' };
  }
  if (endpointPath.startsWith('/api/visitors/registration') || endpointPath.startsWith('/api/visitor-categories') || endpointPath.startsWith('/api/visitor-history') || endpointPath.startsWith('/api/visitor')) {
    return { id: 'visitor-registration', name: 'Visitor Registration & History', desc: 'Public pre-registration, drafts, categories, visit audit timeline' };
  }
  if (endpointPath.startsWith('/api/appointments')) {
    return { id: 'appointments', name: 'Appointments & Visitor Visits', desc: 'Visit bookings, reschedule, host approval, appointment QR codes' };
  }
  if (endpointPath.startsWith('/api/reception') || endpointPath.startsWith('/api/checkin') || endpointPath.startsWith('/api/checkout')) {
    return { id: 'reception', name: 'Front Desk & Reception Operations', desc: 'Front-desk verification, walk-in registration, badge printing, check-in/out' };
  }
  if (endpointPath.startsWith('/api/identity-verification') || endpointPath.startsWith('/api/v1/identity-verification') || endpointPath.startsWith('/api/identity')) {
    return { id: 'identity-verification', name: 'Identity Verification & Biometrics', desc: 'Government ID document OCR, live selfie liveness detection, face matching' };
  }
  if (endpointPath.startsWith('/api/security')) {
    return { id: 'security', name: 'Security & Watchlist / Blacklist', desc: 'Real-time blacklist screening, watchlist alerts, security restrictions' };
  }
  if (endpointPath.startsWith('/api/documents')) {
    return { id: 'documents', name: 'Document Management (EDMS)', desc: 'Document upload, OCR, versioning, replace, preview, download, audit history' };
  }
  if (endpointPath.startsWith('/api/calendar')) {
    return { id: 'calendar', name: 'Calendar & Working Schedules', desc: 'Weekly operating hours, shifts, public holidays, special working days, timezones' };
  }
  if (endpointPath.startsWith('/api/workflows') || endpointPath.startsWith('/api/rules') || endpointPath.startsWith('/api/business-events')) {
    return { id: 'workflows', name: 'Approval Workflows & Multi-Level Rules', desc: 'Multi-stage approval workflows, delegation policies, step escalation, rule engine' };
  }
  if (endpointPath.includes('notification') || endpointPath.startsWith('/api/communication')) {
    return { id: 'notifications', name: 'Enterprise Notifications & Dispatch', desc: 'In-app, Email, SMS, notification rules, automatic delivery engine' };
  }
  if (endpointPath.startsWith('/api/settings') || endpointPath.startsWith('/api/feedback-support') || endpointPath.startsWith('/api/support') || endpointPath.startsWith('/api/system') || endpointPath.startsWith('/api/audit-logs') || endpointPath.startsWith('/api/admin/system')) {
    return { id: 'system-settings', name: 'System Settings & Administration', desc: 'Global configurations, branding, backups, restore, system audit logs, helpdesk' };
  }
  if (endpointPath.startsWith('/api/reports') || endpointPath.startsWith('/api/dashboard') || endpointPath.startsWith('/api/exports') || endpointPath.startsWith('/api/resources') || endpointPath.startsWith('/api/health') || endpointPath.startsWith('/api/endpoints') || endpointPath.startsWith('/api/docs')) {
    return { id: 'reports', name: 'Reporting, Analytics & System Health', desc: 'Executive dashboard, peak hours, visitor log export, API documentation, health' };
  }
  return { id: 'system-settings', name: 'System Settings & Administration', desc: 'System management and utilities' };
}

// Generate descriptive human-readable summary from path and method
function generateDescription(method, endpointPath) {
  const parts = endpointPath.split('/').filter(p => p && p !== 'api');
  let cleanAction = parts.slice(-2).join(' ').replace(/-/g, ' ').replace(/:([a-zA-Z0-9_]+)/g, 'by $1');
  if (method === 'GET') {
    if (endpointPath.endsWith('/:id') || endpointPath.includes('/:')) return `Retrieve specific details for ${cleanAction}`;
    return `List and search records for ${cleanAction}`;
  }
  if (method === 'POST') return `Create, register, or execute ${cleanAction}`;
  if (method === 'PUT') return `Update complete record for ${cleanAction}`;
  if (method === 'PATCH') return `Partially update status or properties of ${cleanAction}`;
  if (method === 'DELETE') return `Remove or purge record for ${cleanAction}`;
  return `${method} operation on ${endpointPath}`;
}

// Scan index.js mounts to build canonical 614 endpoints
function buildCatalog() {
  if (cachedCatalog && cachedAll) {
    return { catalog: cachedCatalog, allEndpoints: cachedAll };
  }

  const backendDir = path.resolve(__dirname, '..');
  const indexPath = path.join(backendDir, 'index.js');
  let indexContent = '';
  try {
    indexContent = fs.readFileSync(indexPath, 'utf8');
  } catch {
    indexContent = '';
  }

  const requireMap = {};
  const reqMatches = [...indexContent.matchAll(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*require\(['"]([^'"]+)['"]\)/g)];
  reqMatches.forEach(m => {
    requireMap[m[1]] = m[2];
  });

  const mounts = [];
  const appUseMatches = [...indexContent.matchAll(/app\.use\(\s*['"]([^'"]+)['"]\s*,\s*([^)]+)\)/g)];
  appUseMatches.forEach(m => {
    const mountPath = m[1];
    const target = m[2].trim();
    let reqPath = null;
    const inlineReq = target.match(/require\(['"]([^'"]+)['"]\)/);
    if (inlineReq) reqPath = inlineReq[1];
    else if (requireMap[target]) reqPath = requireMap[target];
    if (reqPath) mounts.push({ mountPath, reqPath });
  });

  const aliasMounts = new Set(['/api/admin/roles', '/api/admin/permissions']);
  const canonicalMounts = mounts.filter(m => !aliasMounts.has(m.mountPath));

  const allEndpoints = [];
  const seen = new Set();

  canonicalMounts.forEach(({ mountPath, reqPath }) => {
    let resolved = path.resolve(backendDir, reqPath);
    if (!resolved.endsWith('.js')) {
      if (fs.existsSync(resolved + '.js')) resolved += '.js';
      else if (fs.existsSync(path.join(resolved, 'index.js'))) resolved = path.join(resolved, 'index.js');
    }
    if (!fs.existsSync(resolved)) return;

    let content = '';
    try {
      content = fs.readFileSync(resolved, 'utf8');
    } catch {
      return;
    }

    const routeMatches = [...content.matchAll(/router\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/gi)];
    routeMatches.forEach(rm => {
      const method = rm[1].toUpperCase();
      let sub = rm[2];
      if (!sub.startsWith('/')) sub = '/' + sub;
      const full = (mountPath + sub).replace(/\/+/g, '/').replace(/\/$/, '') || '/';
      const key = `${method} ${full}`;
      if (!seen.has(key)) {
        seen.add(key);
        const mod = getModuleInfo(full);
        const isPublic = full.includes('/login') || full.includes('/register') || full.includes('/health') || full.includes('/endpoints') || full.includes('pre-register') || full.includes('refresh-token') || full.includes('/postman-collection');
        allEndpoints.push({
          method,
          path: full,
          module: mod.name,
          moduleId: mod.id,
          auth: isPublic ? 'Public' : 'Bearer Token',
          description: generateDescription(method, full)
        });
      }
    });
  });

  // Ensure core system endpoints are included
  if (!seen.has('GET /api/health')) {
    allEndpoints.push({
      method: 'GET',
      path: '/api/health',
      module: 'Reporting, Analytics & System Health',
      moduleId: 'reports',
      auth: 'Public',
      description: 'System health check status endpoint'
    });
  }
  if (!seen.has('GET /api/endpoints')) {
    allEndpoints.push({
      method: 'GET',
      path: '/api/endpoints',
      module: 'Reporting, Analytics & System Health',
      moduleId: 'reports',
      auth: 'Public',
      description: 'Interactive API catalog of all system endpoints'
    });
  }

  // Group into modules
  const moduleMap = {};
  allEndpoints.forEach(ep => {
    if (!moduleMap[ep.moduleId]) {
      const mod = getModuleInfo(ep.path);
      moduleMap[ep.moduleId] = {
        id: ep.moduleId,
        name: ep.module,
        description: mod.desc,
        endpoints: []
      };
    }
    moduleMap[ep.moduleId].endpoints.push(ep);
  });

  const catalog = Object.values(moduleMap);
  cachedCatalog = catalog;
  cachedAll = allEndpoints;

  return { catalog, allEndpoints };
}

function getModulesCatalog() {
  return buildCatalog().catalog;
}

function getAllEndpoints() {
  return buildCatalog().allEndpoints;
}

// Generate Postman Collection v2.1 JSON
function generatePostmanCollection(baseUrl = 'http://localhost:5000') {
  const { catalog } = buildCatalog();
  return {
    info: {
      name: 'Visitor Management System (VMS) - Complete 614 API Collection',
      description: 'Complete production Postman collection containing all 614 endpoints categorized into 18 business modules: Authentication, RBAC, Visitors, Reception, Documents, Workflows, Calendar, and System Settings.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    auth: {
      type: 'bearer',
      bearer: [
        { key: 'token', value: '{{token}}', type: 'string' }
      ]
    },
    variable: [
      { key: 'baseUrl', value: baseUrl, type: 'string' },
      { key: 'token', value: 'YOUR_JWT_TOKEN', type: 'string' }
    ],
    item: catalog.map(mod => ({
      name: `${mod.name} (${mod.endpoints.length})`,
      description: mod.description,
      item: mod.endpoints.map(ep => {
        const urlParts = ep.path.replace(/^\//, '').split('/');
        return {
          name: `${ep.method} ${ep.path}`,
          request: {
            method: ep.method,
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Accept', value: 'application/json' }
            ],
            url: {
              raw: `{{baseUrl}}${ep.path}`,
              host: ['{{baseUrl}}'],
              path: urlParts
            },
            description: ep.description
          }
        };
      })
    }))
  };
}

// Render HTML Explorer for Browser
function renderHtmlCatalog(req) {
  const { catalog, allEndpoints } = buildCatalog();
  const total = allEndpoints.length;
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  const modulePills = catalog.map((m, idx) => `
    <button class="nav-pill ${idx === 0 ? 'active' : ''}" onclick="filterModule('${m.id}')">
      ${m.name} <span class="badge">${m.endpoints.length}</span>
    </button>
  `).join('');

  const moduleSections = catalog.map(m => `
    <section class="module-section" id="mod-${m.id}" data-module="${m.id}">
      <div class="module-header">
        <div>
          <h2>${m.name}</h2>
          <p class="module-desc">${m.description}</p>
        </div>
        <span class="count-badge">${m.endpoints.length} Endpoints</span>
      </div>
      <div class="endpoint-grid">
        ${m.endpoints.map(ep => {
          const methodClass = `method-${ep.method.toLowerCase()}`;
          return `
            <div class="endpoint-card" data-search="${ep.method} ${ep.path} ${ep.description}">
              <div class="ep-top">
                <span class="badge-method ${methodClass}">${ep.method}</span>
                <code class="ep-path">${ep.path}</code>
                <span class="badge-auth ${ep.auth.includes('Public') ? 'auth-public' : 'auth-secure'}">${ep.auth}</span>
              </div>
              <p class="ep-desc">${ep.description}</p>
              <div class="ep-actions">
                <button class="btn-copy" onclick="copyCurl('${ep.method}', '${baseUrl}${ep.path}')">📋 Copy cURL</button>
                <a href="${ep.path}" target="_blank" class="btn-open">Open Link ↗</a>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VMS API Explorer — All 614 Endpoints by Collection</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #111827;
      --card-border: #1f2937;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #3b82f6;
      --primary-light: #60a5fa;
      --accent: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', sans-serif;
      line-height: 1.5;
      padding-bottom: 60px;
    }
    header {
      background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
      border-bottom: 1px solid #334155;
      padding: 30px 40px;
    }
    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }
    .title-group h1 {
      font-size: 26px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .status-tag {
      font-size: 13px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid rgba(16, 185, 129, 0.3);
      font-weight: 600;
    }
    .title-group p {
      color: var(--text-muted);
      margin-top: 6px;
      font-size: 14px;
    }
    .header-actions {
      display: flex;
      gap: 12px;
    }
    .btn {
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-primary {
      background: var(--primary);
      color: #fff;
    }
    .btn-primary:hover { background: #2563eb; }
    .btn-outline {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text);
      border: 1px solid #374151;
    }
    .btn-outline:hover { background: rgba(255, 255, 255, 0.1); border-color: #4b5563; }
    .stats-bar {
      max-width: 1400px;
      margin: 24px auto 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      padding: 0 40px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 18px 24px;
    }
    .stat-label { font-size: 13px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-val { font-size: 28px; font-weight: 700; color: #fff; margin-top: 4px; }
    .controls {
      max-width: 1400px;
      margin: 24px auto 0;
      padding: 0 40px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .search-input {
      width: 100%;
      padding: 14px 20px;
      border-radius: 10px;
      background: #1e293b;
      border: 1px solid #334155;
      color: #fff;
      font-size: 15px;
      outline: none;
      transition: border-color 0.2s;
    }
    .search-input:focus { border-color: var(--primary); }
    .nav-pills {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 6px;
    }
    .nav-pill {
      background: #1e293b;
      border: 1px solid #334155;
      color: var(--text-muted);
      padding: 8px 16px;
      border-radius: 999px;
      cursor: pointer;
      font-size: 13px;
      white-space: nowrap;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .nav-pill:hover, .nav-pill.active {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
    }
    .nav-pill .badge {
      background: rgba(0, 0, 0, 0.25);
      padding: 2px 7px;
      border-radius: 10px;
      font-size: 11px;
    }
    main {
      max-width: 1400px;
      margin: 30px auto 0;
      padding: 0 40px;
      display: flex;
      flex-direction: column;
      gap: 40px;
    }
    .module-section {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 24px;
    }
    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--card-border);
    }
    .module-header h2 { font-size: 20px; font-weight: 700; color: #fff; }
    .module-desc { color: var(--text-muted); font-size: 14px; margin-top: 4px; }
    .count-badge {
      background: rgba(59, 130, 246, 0.15);
      color: var(--primary-light);
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }
    .endpoint-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
      gap: 16px;
    }
    .endpoint-card {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.15s, border-color 0.15s;
    }
    .endpoint-card:hover {
      transform: translateY(-2px);
      border-color: #3b82f6;
    }
    .ep-top {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .badge-method {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .method-get { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); }
    .method-post { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
    .method-put { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
    .method-patch { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); }
    .method-delete { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
    .ep-path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #e2e8f0;
      word-break: break-all;
    }
    .badge-auth {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 600;
      margin-left: auto;
    }
    .auth-public { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .auth-secure { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; }
    .ep-desc {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 14px;
      line-height: 1.4;
    }
    .ep-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      border-top: 1px solid #1e293b;
      padding-top: 10px;
    }
    .btn-copy, .btn-open {
      font-size: 12px;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid #334155;
      background: #1e293b;
      color: #94a3b8;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s;
    }
    .btn-copy:hover, .btn-open:hover {
      background: #334155;
      color: #fff;
    }
    #toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #10b981;
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      display: none;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
      z-index: 999;
    }
  </style>
</head>
<body>
  <header>
    <div class="header-content">
      <div class="title-group">
        <h1>
          Visitor Management System
          <span class="status-tag">● API Online</span>
        </h1>
        <p>Enterprise REST API Catalog & Complete 614 Endpoints Explorer</p>
      </div>
      <div class="header-actions">
        <a href="/api/postman-collection" class="btn btn-primary">
          📦 Download Postman Collection
        </a>
        <a href="/api/endpoints?format=json" class="btn btn-outline">
          { } Raw JSON
        </a>
        <a href="/api/health" class="btn btn-outline" target="_blank">
          🩺 Health Check
        </a>
      </div>
    </div>
  </header>

  <div class="stats-bar">
    <div class="stat-card">
      <div class="stat-label">Total Endpoints</div>
      <div class="stat-val">${total}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Business Modules</div>
      <div class="stat-val">${catalog.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">API Version</div>
      <div class="stat-val">v1.0.0</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">System Status</div>
      <div class="stat-val" style="color: #34d399;">Active</div>
    </div>
  </div>

  <div class="controls">
    <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search among all 614 endpoints by method, path, or description (e.g. POST /api/workflows, documents, blacklist)..." oninput="searchEndpoints()">
    <div class="nav-pills">
      <button class="nav-pill active" onclick="filterModule('all')">All Collections <span class="badge">${total}</span></button>
      ${modulePills}
    </div>
  </div>

  <main id="mainContainer">
    ${moduleSections}
  </main>

  <div id="toast">Copied cURL to clipboard!</div>

  <script>
    function filterModule(moduleId) {
      document.querySelectorAll('.nav-pill').forEach(b => b.classList.remove('active'));
      event.currentTarget.classList.add('active');

      document.querySelectorAll('.module-section').forEach(sec => {
        if (moduleId === 'all' || sec.getAttribute('data-module') === moduleId) {
          sec.style.display = 'block';
        } else {
          sec.style.display = 'none';
        }
      });
    }

    function searchEndpoints() {
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      document.querySelectorAll('.endpoint-card').forEach(card => {
        const text = card.getAttribute('data-search').toLowerCase();
        if (!q || text.includes(q)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
      // Hide sections with no visible cards
      document.querySelectorAll('.module-section').forEach(sec => {
        const visible = sec.querySelectorAll('.endpoint-card[style*="display: flex"], .endpoint-card:not([style*="display: none"])');
        sec.style.display = visible.length > 0 ? 'block' : 'none';
      });
    }

    function copyCurl(method, url) {
      const cmd = \`curl -X \${method} "\${url}" -H "Authorization: Bearer YOUR_TOKEN"\`;
      navigator.clipboard.writeText(cmd).then(() => {
        const t = document.getElementById('toast');
        t.style.display = 'block';
        setTimeout(() => { t.style.display = 'none'; }, 2000);
      });
    }
  </script>
</body>
</html>`;
}

module.exports = {
  getModulesCatalog,
  getAllEndpoints,
  generatePostmanCollection,
  renderHtmlCatalog
};
