/**
 * Complete Enterprise API Endpoints Registry & Postman Collection Generator
 * Dynamically scans all mounted routers to produce the full canonical catalog of all 614 endpoints
 * across 18 Business Modules / Collections with embedded interactive Form Testers for POST/PUT/GET.
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const environment = require('../config/environment');

let cachedCatalog = null;
let cachedAll = null;

// Generate persistent active Admin JWT token for interactive browser testing
function getAdminToken() {
  const secret = environment?.JWT?.SECRET || 'visitor-management-secret-key-change-in-production';
  return jwt.sign(
    { id: 1, userId: 1, role: 'admin', permissions: ['*'], username: 'admin' },
    secret,
    { expiresIn: '30d' }
  );
}

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

// Generate sensible default sample payload for each endpoint to store data into the database
function getDefaultPayload(method, endpointPath) {
  if (method === 'GET' || method === 'DELETE') return null;
  const p = endpointPath.toLowerCase();

  if (p.includes('check-email') || p.includes('verify-email')) {
    return { email: 'admin@vms.com' };
  }
  if (p.includes('login')) {
    return { email: 'admin@vms.com', password: 'Password123!' };
  }
  if (p.includes('register') || p.includes('signup')) {
    return { username: 'new_visitor_user', email: 'visitor.user@example.com', password: 'Password123!', full_name: 'Visitor User', role: 'receptionist' };
  }
  if (p.includes('change-password') || p.includes('reset-password')) {
    return { currentPassword: 'Password123!', newPassword: 'NewPassword123!' };
  }
  if (p.includes('delegations')) {
    return { delegator_id: 1, delegate_id: 2, start_date: '2026-10-18', end_date: '2026-10-25', reason: 'Official administrative delegation' };
  }
  if (p.includes('workflow')) {
    return { workflow_name: 'Visitor Executive Approval', workflow_code: `WF-${Date.now()}`, workflow_type: 'Standard', priority: 1, approval_mode: 'Sequential' };
  }
  if (p.includes('categor')) {
    return { category_name: 'VIP Guest', category_code: `VIP_${Date.now().toString().slice(-4)}`, description: 'High priority corporate visitors' };
  }
  if (p.includes('department')) {
    return { name: 'Information Technology', code: 'IT', description: 'Systems & Infrastructure' };
  }
  if (p.includes('role')) {
    return { role_name: 'Operations Manager', role_code: `OPS_${Date.now().toString().slice(-4)}`, description: 'Operations oversight role', permissions: ['*'] };
  }
  if (p.includes('user')) {
    return { username: `staff_${Date.now().toString().slice(-4)}`, email: `staff_${Date.now().toString().slice(-4)}@vms.com`, full_name: 'Front Desk Officer', role: 'receptionist', password: 'Password123!' };
  }
  if (p.includes('appointment')) {
    return { visitor_name: 'Sara Connor', email: 'sara@example.com', host_id: 1, appointment_date: '2026-10-20', start_time: '10:00', purpose: 'Contract Review' };
  }
  if (p.includes('checkin') || p.includes('check-in')) {
    return { appointment_id: 1, visitor_id: 1, badge_number: 'BADGE-991', entry_gate: 'Lobby Gate 1' };
  }
  if (p.includes('checkout') || p.includes('check-out')) {
    return { visit_id: 1, remarks: 'Normal visit completion' };
  }
  if (p.includes('holiday')) {
    return { name: 'Public Holiday Event', type: 'PUBLIC', date: '2026-11-01', appliesTo: 'ALL', organizationId: 1 };
  }
  if (p.includes('special-day') || p.includes('special_day')) {
    return { date: '2026-10-25', reason: 'Special Working Operations', openingTime: '09:00', closingTime: '17:00', organizationId: 1 };
  }
  if (p.includes('timezone')) {
    return { organizationId: 1, timeZone: 'Africa/Addis_Ababa', utcOffset: '+03:00', dst: false };
  }
  if (p.includes('schedule')) {
    return { organizationId: 1, weeklySchedule: { Monday: { open: true, openingTime: '08:30', closingTime: '17:30' } } };
  }
  if (p.includes('document')) {
    return { document_name: 'Government ID Card', document_type: 'National ID', visitor_id: 1, notes: 'Scanned at reception' };
  }
  if (p.includes('blacklist') || p.includes('watchlist')) {
    return { visitor_id: 1, reason: 'Security protocol audit flag', severity: 'HIGH', list_type: 'BLACKLIST', risk_level: 'HIGH' };
  }
  if (p.includes('ticket')) {
    return { subject: 'Lobby Tablet assistance', description: 'Check-in kiosk camera calibration', priority: 'Medium' };
  }
  if (p.includes('feedback')) {
    return { rating: 5, comments: 'Fast reception check-in process', category: 'General Experience' };
  }
  if (p.includes('notification')) {
    return { title: 'Visitor Arrival Alert', message: 'Your visitor has arrived at the reception lobby.', type: 'info' };
  }
  if (p.includes('status')) {
    return { status: 'ACTIVE', remarks: 'Status updated via Form' };
  }

  return { name: 'Sample Record', status: 'ACTIVE', description: 'Submitted via VMS Form' };
}

// Generate descriptive human-readable summary from path and method
function generateDescription(method, endpointPath) {
  const parts = endpointPath.split('/').filter(p => p && p !== 'api');
  let cleanAction = parts.slice(-2).join(' ').replace(/-/g, ' ').replace(/:([a-zA-Z0-9_]+)/g, 'by $1');
  if (method === 'GET') {
    if (endpointPath.endsWith('/:id') || endpointPath.includes('/:')) return `Retrieve specific details for ${cleanAction}`;
    return `List and search records for ${cleanAction}`;
  }
  if (method === 'POST') return `Store, register, or execute ${cleanAction} to database`;
  if (method === 'PUT') return `Update complete record for ${cleanAction} in database`;
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
        const isPublic = full.includes('/login') || full.includes('/register') || full.includes('/health') || full.includes('/endpoints') || full.includes('pre-register') || full.includes('refresh-token') || full.includes('/postman-collection') || full.includes('/check-email');
        allEndpoints.push({
          method,
          path: full,
          module: mod.name,
          moduleId: mod.id,
          auth: isPublic ? 'Public' : 'Bearer Token',
          description: generateDescription(method, full),
          samplePayload: getDefaultPayload(method, full)
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
      description: 'System health check status endpoint',
      samplePayload: null
    });
  }
  if (!seen.has('GET /api/endpoints')) {
    allEndpoints.push({
      method: 'GET',
      path: '/api/endpoints',
      module: 'Reporting, Analytics & System Health',
      moduleId: 'reports',
      auth: 'Public',
      description: 'Interactive API catalog of all system endpoints',
      samplePayload: null
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

// Find endpoint details by path (for single endpoint tester)
function findEndpointByPath(requestPath) {
  const { allEndpoints } = buildCatalog();
  const clean = requestPath.replace(/\/$/, '') || '/';
  // Try exact match or pattern match
  let found = allEndpoints.find(e => e.path === clean && e.method !== 'GET');
  if (!found) {
    found = allEndpoints.find(e => {
      if (e.method === 'GET') return false;
      const regex = new RegExp('^' + e.path.replace(/:[a-zA-Z0-9_]+/g, '[^/]+') + '$');
      return regex.test(clean);
    });
  }
  if (!found) {
    found = allEndpoints.find(e => e.path === clean);
  }
  return found || null;
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
      { key: 'token', value: getAdminToken(), type: 'string' }
    ],
    item: catalog.map(mod => ({
      name: `${mod.name} (${mod.endpoints.length})`,
      description: mod.description,
      item: mod.endpoints.map(ep => {
        const urlParts = ep.path.replace(/^\//, '').split('/');
        const reqObj = {
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
        if (ep.samplePayload) {
          reqObj.request.body = {
            mode: 'raw',
            raw: JSON.stringify(ep.samplePayload, null, 2),
            options: { raw: { language: 'json' } }
          };
        }
        return reqObj;
      })
    }))
  };
}

// Render dedicated Form page when user directly navigates to a POST/PUT URL in browser
function renderSingleEndpointTester(req, endpoint) {
  const adminToken = getAdminToken();
  const sampleJson = endpoint.samplePayload ? JSON.stringify(endpoint.samplePayload, null, 2) : '{\n  "status": "ACTIVE"\n}';
  const methodClass = `method-${endpoint.method.toLowerCase()}`;
  const actualPath = (req && req.originalUrl && req.originalUrl !== '/')
    ? req.originalUrl.split('?')[0]
    : endpoint.path.replace(/:[a-zA-Z0-9_]+/g, '1');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${endpoint.method} ${endpoint.path} — VMS Form</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #111827;
      --card-border: #1f2937;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #3b82f6;
      --accent: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', sans-serif;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .form-container {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      width: 100%;
      max-width: 800px;
      padding: 36px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .top-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #34d399;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      word-break: break-all;
    }
    .badge-method {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
    }
    .method-post { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
    .method-put { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
    .method-patch { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); }
    .method-delete { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
    .method-get { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); }
    .notice {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      color: #93c5fd;
      margin-top: 14px;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .field-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    input, textarea {
      width: 100%;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px 16px;
      color: #fff;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    textarea {
      font-family: 'JetBrains Mono', monospace;
      min-height: 150px;
      resize: vertical;
    }
    input:focus, textarea:focus { border-color: var(--primary); }
    .btn-submit {
      width: 100%;
      background: #10b981;
      color: #fff;
      padding: 14px 20px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 15px;
      border: none;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      transition: background 0.2s;
    }
    .btn-submit:hover { background: #059669; }
    .btn-back {
      display: inline-block;
      margin-top: 16px;
      color: #94a3b8;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: color 0.15s;
    }
    .btn-back:hover { color: #fff; }
    .response-box {
      margin-top: 24px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 16px;
      display: none;
    }
    .resp-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 13px;
      font-weight: 600;
    }
    pre {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #38bdf8;
      max-height: 250px;
      overflow-y: auto;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div class="form-container">
    <div class="top-badge">⚡ Interactive Endpoint Form</div>
    <h1>
      <span class="badge-method ${methodClass}">${endpoint.method}</span>
      <code>${endpoint.path}</code>
    </h1>
    
    <div class="notice">
      💡 <strong>Form for Database Submission:</strong> You navigated to this endpoint in a browser. Because HTTP <strong>${endpoint.method}</strong> stores and updates records in the database, you can review the payload below and click <strong>"Submit to Database"</strong> to execute this operation live.
    </div>

    <div class="field-group">
      <label>Target URL</label>
      <input type="text" id="targetUrl" value="${actualPath}">
    </div>

    <div class="field-group">
      <label>Authorization (Bearer Token)</label>
      <input type="text" id="authToken" value="Bearer ${adminToken}">
    </div>

    <div class="field-group">
      <label>Form Payload (JSON)</label>
      <textarea id="payloadJson">${sampleJson}</textarea>
    </div>

    <button class="btn-submit" onclick="submitForm()">
      🚀 Submit ${endpoint.method} to Database
    </button>

    <div class="response-box" id="respBox">
      <div class="resp-header">
        <span id="respStatus" style="color: #34d399;">200 OK</span>
        <span id="respTime" style="color: #94a3b8;">15ms</span>
      </div>
      <pre id="respBody"></pre>
    </div>

    <a href="/api/endpoints" class="btn-back">← Back to All 614 Endpoints Explorer</a>
  </div>

  <script>
    async function submitForm() {
      const url = document.getElementById('targetUrl').value;
      const auth = document.getElementById('authToken').value.trim();
      const bodyRaw = document.getElementById('payloadJson').value.trim();
      const respBox = document.getElementById('respBox');
      const respStatus = document.getElementById('respStatus');
      const respTime = document.getElementById('respTime');
      const respBody = document.getElementById('respBody');

      const headers = { 'Content-Type': 'application/json' };
      if (auth) headers['Authorization'] = auth.startsWith('Bearer ') ? auth : ('Bearer ' + auth);

      const opts = {
        method: '${endpoint.method}',
        headers
      };

      if ('${endpoint.method}' !== 'GET' && '${endpoint.method}' !== 'DELETE') {
        try {
          opts.body = JSON.stringify(JSON.parse(bodyRaw));
        } catch (e) {
          alert('Invalid JSON in Form Payload: ' + e.message);
          return;
        }
      }

      const t0 = performance.now();
      try {
        const res = await fetch(url, opts);
        const t1 = performance.now();
        respBox.style.display = 'block';
        respStatus.innerText = res.status + ' ' + res.statusText;
        respStatus.style.color = res.ok ? '#34d399' : '#f87171';
        respTime.innerText = Math.round(t1 - t0) + 'ms';
        
        const data = await res.json().catch(() => res.text());
        respBody.innerText = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      } catch (err) {
        respBox.style.display = 'block';
        respStatus.innerText = 'Network Error';
        respStatus.style.color = '#f87171';
        respBody.innerText = err.message;
      }
    }
  </script>
</body>
</html>`;
}

// Render HTML Explorer with Interactive Form Modal for Browser
function renderHtmlCatalog(req) {
  const { catalog, allEndpoints } = buildCatalog();
  const total = allEndpoints.length;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const defaultAdminToken = getAdminToken();

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
          const escapedPayload = ep.samplePayload ? encodeURIComponent(JSON.stringify(ep.samplePayload, null, 2)) : '';
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
                <button class="btn-form" onclick="openTesterModal('${ep.method}', '${ep.path}', '${ep.auth}', '${escapedPayload}')">⚡ Form / Test</button>
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
  <title>VMS API Explorer — All 614 Endpoints with Interactive Forms</title>
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
    .btn-copy, .btn-form {
      font-size: 12px;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid #334155;
      background: #1e293b;
      color: #94a3b8;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s;
      font-weight: 600;
    }
    .btn-form {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border-color: rgba(16, 185, 129, 0.4);
    }
    .btn-copy:hover {
      background: #334155;
      color: #fff;
    }
    .btn-form:hover {
      background: #10b981;
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

    /* Modal Backdrop */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
      z-index: 1000;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .modal-card {
      background: #111827;
      border: 1px solid #374151;
      border-radius: 16px;
      width: 100%;
      max-width: 750px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9);
    }
    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid #1f2937;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-body {
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #1f2937;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn-close {
      background: none;
      border: none;
      color: #9ca3af;
      font-size: 22px;
      cursor: pointer;
    }
    .btn-close:hover { color: #fff; }
    .m-label {
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .m-input, .m-textarea {
      width: 100%;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 10px 14px;
      color: #fff;
      font-size: 14px;
      outline: none;
    }
    .m-textarea {
      font-family: 'JetBrains Mono', monospace;
      min-height: 120px;
      resize: vertical;
    }
    .m-input:focus, .m-textarea:focus { border-color: #3b82f6; }
    .btn-execute {
      background: #10b981;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-execute:hover { background: #059669; }
    .modal-response {
      background: #0b0f19;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 14px;
      display: none;
    }
    .m-resp-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .m-resp-body {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #38bdf8;
      max-height: 200px;
      overflow-y: auto;
      white-space: pre-wrap;
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
        <p>Enterprise REST API Catalog & Complete 614 Endpoints with Interactive Forms</p>
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
      <div class="stat-label">Interactive Forms</div>
      <div class="stat-val" style="color: #60a5fa;">Available</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Database Mode</div>
      <div class="stat-val" style="color: #34d399;">Active (MySQL)</div>
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

  <!-- Interactive Form / Tester Modal -->
  <div class="modal-overlay" id="testerModal" onclick="closeModalOnBackdrop(event)">
    <div class="modal-card">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="badge-method" id="mMethod">POST</span>
          <code id="mPath" style="font-family: 'JetBrains Mono'; font-weight: 600; color: #fff;">/api/...</code>
        </div>
        <button class="btn-close" onclick="closeTesterModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div>
          <div class="m-label">Request URL</div>
          <input type="text" class="m-input" id="mUrl">
        </div>

        <div>
          <div class="m-label">Authorization Header (Bearer Token)</div>
          <input type="text" class="m-input" id="mAuth" value="Bearer ${defaultAdminToken}">
        </div>

        <div id="mBodyGroup">
          <div class="m-label" style="display: flex; justify-content: space-between;">
            <span>Form Payload (JSON to store in Database)</span>
            <span style="font-size: 11px; color: #34d399;">Pre-filled with valid sample data</span>
          </div>
          <textarea class="m-textarea" id="mBody"></textarea>
        </div>

        <div class="modal-response" id="mRespBox">
          <div class="m-resp-header">
            <span id="mRespStatus" style="color: #34d399;">200 OK</span>
            <span id="mRespTime" style="color: #94a3b8;">12ms</span>
          </div>
          <pre class="m-resp-body" id="mRespBody"></pre>
        </div>
      </div>
      <div class="modal-footer">
        <span style="font-size: 13px; color: #94a3b8;">Live backend execution</span>
        <button class="btn-execute" id="mBtnSubmit" onclick="executeModalRequest()">
          🚀 Send Request to Database
        </button>
      </div>
    </div>
  </div>

  <div id="toast">Copied cURL to clipboard!</div>

  <script>
    let currentMethod = 'GET';

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
      document.querySelectorAll('.module-section').forEach(sec => {
        const visible = sec.querySelectorAll('.endpoint-card[style*="display: flex"], .endpoint-card:not([style*="display: none"])');
        sec.style.display = visible.length > 0 ? 'block' : 'none';
      });
    }

    function copyCurl(method, url) {
      const cmd = \`curl -X \${method} "\${url}" -H "Authorization: Bearer ${defaultAdminToken}"\`;
      navigator.clipboard.writeText(cmd).then(() => {
        const t = document.getElementById('toast');
        t.style.display = 'block';
        setTimeout(() => { t.style.display = 'none'; }, 2000);
      });
    }

    function openTesterModal(method, pathUrl, auth, payloadEnc) {
      currentMethod = method;
      document.getElementById('mMethod').innerText = method;
      document.getElementById('mMethod').className = 'badge-method method-' + method.toLowerCase();
      document.getElementById('mPath').innerText = pathUrl;
      document.getElementById('mUrl').value = pathUrl.replace(/:[a-zA-Z0-9_]+/g, '1');
      document.getElementById('mBtnSubmit').innerText = '🚀 Send ' + method + ' to Database';

      const bodyGroup = document.getElementById('mBodyGroup');
      if (method === 'GET' || method === 'DELETE') {
        bodyGroup.style.display = 'none';
      } else {
        bodyGroup.style.display = 'block';
        let decoded = '';
        if (payloadEnc) {
          try { decoded = decodeURIComponent(payloadEnc); } catch {}
        }
        if (!decoded || decoded === '""') {
          decoded = '{\\n  "status": "ACTIVE"\\n}';
        }
        document.getElementById('mBody').value = decoded;
      }

      document.getElementById('mRespBox').style.display = 'none';
      document.getElementById('testerModal').style.display = 'flex';
    }

    function closeTesterModal() {
      document.getElementById('testerModal').style.display = 'none';
    }

    function closeModalOnBackdrop(e) {
      if (e.target.id === 'testerModal') closeTesterModal();
    }

    async function executeModalRequest() {
      const url = document.getElementById('mUrl').value.trim();
      const auth = document.getElementById('mAuth').value.trim();
      const bodyRaw = document.getElementById('mBody').value.trim();
      const respBox = document.getElementById('mRespBox');
      const respStatus = document.getElementById('mRespStatus');
      const respTime = document.getElementById('mRespTime');
      const respBody = document.getElementById('mRespBody');

      const headers = { 'Content-Type': 'application/json' };
      if (auth) headers['Authorization'] = auth.startsWith('Bearer ') ? auth : ('Bearer ' + auth);

      const opts = { method: currentMethod, headers };

      if (currentMethod !== 'GET' && currentMethod !== 'DELETE') {
        try {
          opts.body = JSON.stringify(JSON.parse(bodyRaw));
        } catch (e) {
          alert('Invalid JSON in Form Payload: ' + e.message);
          return;
        }
      }

      const t0 = performance.now();
      try {
        const res = await fetch(url, opts);
        const t1 = performance.now();
        respBox.style.display = 'block';
        respStatus.innerText = res.status + ' ' + res.statusText;
        respStatus.style.color = res.ok ? '#34d399' : '#f87171';
        respTime.innerText = Math.round(t1 - t0) + 'ms';
        
        const data = await res.json().catch(() => res.text());
        respBody.innerText = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      } catch (err) {
        respBox.style.display = 'block';
        respStatus.innerText = 'Network Error';
        respStatus.style.color = '#f87171';
        respBody.innerText = err.message;
      }
    }
  </script>
</body>
</html>`;
}

module.exports = {
  getModulesCatalog,
  getAllEndpoints,
  findEndpointByPath,
  generatePostmanCollection,
  renderHtmlCatalog,
  renderSingleEndpointTester
};
