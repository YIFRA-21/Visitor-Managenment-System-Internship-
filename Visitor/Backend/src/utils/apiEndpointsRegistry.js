/**
 * Complete Enterprise API Endpoints Registry & Postman Collection Generator
 * Organizes all Visitor Management System (VMS) endpoints into collections/modules
 */

const modulesCatalog = [
  {
    id: 'auth',
    name: 'Authentication & Session',
    description: 'User registration, login, JWT token lifecycle, profile management, and password recovery',
    endpoints: [
      { method: 'POST', path: '/api/auth/login', auth: 'Public', description: 'Authenticate user credentials and receive JWT access token' },
      { method: 'GET', path: '/api/auth/login', auth: 'Public', description: 'Login instruction & credential formats' },
      { method: 'POST', path: '/api/auth/register', auth: 'Public', description: 'Register a new employee or receptionist user' },
      { method: 'POST', path: '/api/auth/logout', auth: 'Bearer Token', description: 'Revoke active session and invalidate JWT token' },
      { method: 'POST', path: '/api/auth/refresh-token', auth: 'Public', description: 'Refresh expired JWT session with refresh token' },
      { method: 'GET', path: '/api/auth/me', auth: 'Bearer Token', description: 'Fetch currently authenticated user details & permissions' },
      { method: 'GET', path: '/api/auth/profile', auth: 'Bearer Token', description: 'Get profile information of logged-in user' },
      { method: 'PUT', path: '/api/auth/profile', auth: 'Bearer Token', description: 'Update current user personal details' },
      { method: 'PUT', path: '/api/auth/change-password', auth: 'Bearer Token', description: 'Change password for active user' },
      { method: 'POST', path: '/api/identity/first-login-change', auth: 'Bearer Token', description: 'Force password change on initial sign-in' },
      { method: 'POST', path: '/api/identity/unlock-account', auth: 'Admin Only', description: 'Unlock a locked account after multiple failed attempts' }
    ]
  },
  {
    id: 'users',
    name: 'User Management',
    description: 'Administrative user CRUD, invitations, search filtering, and bulk user operations',
    endpoints: [
      { method: 'GET', path: '/api/users', auth: 'Bearer Token', description: 'List all users with pagination and role filters' },
      { method: 'POST', path: '/api/users', auth: 'Admin Only', description: 'Create a new administrative user' },
      { method: 'GET', path: '/api/users/:id', auth: 'Bearer Token', description: 'Retrieve user details by ID' },
      { method: 'PUT', path: '/api/users/:id', auth: 'Admin Only', description: 'Update user account information' },
      { method: 'DELETE', path: '/api/users/:id', auth: 'Admin Only', description: 'Soft-delete or remove a user' },
      { method: 'PATCH', path: '/api/users/:id/status', auth: 'Admin Only', description: 'Toggle user active/inactive/suspended status' },
      { method: 'POST', path: '/api/users/:id/archive', auth: 'Admin Only', description: 'Archive a user account' },
      { method: 'POST', path: '/api/users/invitations', auth: 'Admin Only', description: 'Send registration invitation link to new users' },
      { method: 'POST', path: '/api/users/saved-searches', auth: 'Bearer Token', description: 'Save user search query configuration' },
      { method: 'POST', path: '/api/users/bulk-status', auth: 'Admin Only', description: 'Batch update status for multiple users' },
      { method: 'POST', path: '/api/users/bulk-notify', auth: 'Admin Only', description: 'Broadcast notification message to users' },
      { method: 'POST', path: '/api/users/import', auth: 'Admin Only', description: 'Bulk import user records from CSV or JSON' }
    ]
  },
  {
    id: 'rbac',
    name: 'Roles & Access Control (RBAC)',
    description: 'Role definitions, permission binding, SoD rules, conflict detection, and role hierarchies',
    endpoints: [
      { method: 'GET', path: '/api/roles', auth: 'Bearer Token', description: 'List all system and custom RBAC roles' },
      { method: 'POST', path: '/api/roles', auth: 'Admin Only', description: 'Define and register a new security role' },
      { method: 'GET', path: '/api/roles/:id', auth: 'Bearer Token', description: 'Get role definition and assigned permissions' },
      { method: 'PUT', path: '/api/roles/:id', auth: 'Admin Only', description: 'Update role details and permissions' },
      { method: 'DELETE', path: '/api/roles/:id', auth: 'Admin Only', description: 'Delete custom role' },
      { method: 'POST', path: '/api/roles/:id/archive', auth: 'Admin Only', description: 'Archive an inactive role' },
      { method: 'POST', path: '/api/roles/:id/users', auth: 'Admin Only', description: 'Assign users to a role' },
      { method: 'DELETE', path: '/api/roles/:id/users/:userId', auth: 'Admin Only', description: 'Remove user assignment from a role' },
      { method: 'GET', path: '/api/roles/compare', auth: 'Bearer Token', description: 'Side-by-side comparison of role permissions' },
      { method: 'GET', path: '/api/roles/permissions/all', auth: 'Bearer Token', description: 'List full catalog of assignable permissions' },
      { method: 'GET', path: '/api/roles/permissions/modules', auth: 'Bearer Token', description: 'List permissions grouped by business module' },
      { method: 'POST', path: '/api/roles/hierarchy', auth: 'Admin Only', description: 'Set role inheritance hierarchy' },
      { method: 'POST', path: '/api/roles/conflicts', auth: 'Admin Only', description: 'Detect toxic permission combinations' },
      { method: 'POST', path: '/api/roles/sod-rules', auth: 'Admin Only', description: 'Enforce Segregation of Duties (SoD) policies' },
      { method: 'POST', path: '/api/roles/bulk-operations', auth: 'Admin Only', description: 'Batch update or assign roles' },
      { method: 'POST', path: '/api/roles/templates/instantiate', auth: 'Admin Only', description: 'Create role from pre-built security template' }
    ]
  },
  {
    id: 'permissions',
    name: 'Fine-Grained Permissions & Hierarchy',
    description: 'Permission matrices, authorization testing, permission cloning, and structural assignment',
    endpoints: [
      { method: 'GET', path: '/api/permissions', auth: 'Bearer Token', description: 'List all fine-grained permissions' },
      { method: 'POST', path: '/api/permissions', auth: 'Admin Only', description: 'Register a custom atomic permission' },
      { method: 'GET', path: '/api/permissions/:permissionId', auth: 'Bearer Token', description: 'Get specific permission metadata' },
      { method: 'PATCH', path: '/api/permissions/:permissionId', auth: 'Admin Only', description: 'Update permission configuration' },
      { method: 'POST', path: '/api/permissions/:permissionId/clone', auth: 'Admin Only', description: 'Clone permission with new scope' },
      { method: 'POST', path: '/api/permissions/:permissionId/activate', auth: 'Admin Only', description: 'Activate a permission' },
      { method: 'POST', path: '/api/permissions/:permissionId/deactivate', auth: 'Admin Only', description: 'Deactivate a permission' },
      { method: 'POST', path: '/api/permissions/:permissionId/archive', auth: 'Admin Only', description: 'Archive obsolete permission' },
      { method: 'POST', path: '/api/permissions/:permissionId/restore', auth: 'Admin Only', description: 'Restore archived permission' },
      { method: 'POST', path: '/api/permissions/matrix', auth: 'Admin Only', description: 'Fetch or update comprehensive permission matrix' },
      { method: 'POST', path: '/api/permissions/authorize-test', auth: 'Bearer Token', description: 'Simulate and verify user access policy' },
      { method: 'POST', path: '/api/permissions/import', auth: 'Admin Only', description: 'Import permissions definition dataset' },
      { method: 'POST', path: '/api/hierarchy/assign', auth: 'Admin Only', description: 'Assign organizational hierarchy nodes' },
      { method: 'PUT', path: '/api/hierarchy/assign/1', auth: 'Admin Only', description: 'Update hierarchy assignment' }
    ]
  },
  {
    id: 'organizations',
    name: 'Organizations, Branches & Facilities',
    description: 'Multi-tenant organization branding, campuses, physical buildings, and meeting rooms',
    endpoints: [
      { method: 'GET', path: '/api/organizations', auth: 'Bearer Token', description: 'List tenant organizations' },
      { method: 'POST', path: '/api/organizations', auth: 'Admin Only', description: 'Create tenant organization' },
      { method: 'GET', path: '/api/organizations/:id', auth: 'Bearer Token', description: 'Get organization profile & branding' },
      { method: 'PUT', path: '/api/organizations/:id', auth: 'Admin Only', description: 'Update organization settings & colors' },
      { method: 'GET', path: '/api/branches', auth: 'Bearer Token', description: 'List campus branches' },
      { method: 'POST', path: '/api/branches', auth: 'Admin Only', description: 'Add new branch campus' },
      { method: 'GET', path: '/api/branches/:id', auth: 'Bearer Token', description: 'Get branch details and operating hours' },
      { method: 'PUT', path: '/api/branches/:id', auth: 'Admin Only', description: 'Update branch configuration' },
      { method: 'DELETE', path: '/api/branches/:id', auth: 'Admin Only', description: 'Decommission branch location' },
      { method: 'GET', path: '/api/departments', auth: 'Bearer Token', description: 'List organizational departments' },
      { method: 'POST', path: '/api/departments', auth: 'Admin Only', description: 'Register a new department' },
      { method: 'GET', path: '/api/departments/:id', auth: 'Bearer Token', description: 'Get department details' },
      { method: 'PUT', path: '/api/departments/:id', auth: 'Admin Only', description: 'Update department' },
      { method: 'DELETE', path: '/api/departments/:id', auth: 'Admin Only', description: 'Delete department' },
      { method: 'GET', path: '/api/rooms', auth: 'Bearer Token', description: 'List conference rooms and visitor booths' },
      { method: 'POST', path: '/api/rooms', auth: 'Admin Only', description: 'Register room with capacity and facilities' },
      { method: 'GET', path: '/api/rooms/:id', auth: 'Bearer Token', description: 'Get room details and current availability' }
    ]
  },
  {
    id: 'employees',
    name: 'Employees & Host Portal',
    description: 'Host employee directory, contact information, maximum visitor limits, and employee dashboard',
    endpoints: [
      { method: 'GET', path: '/api/employees', auth: 'Bearer Token', description: 'Search and list all host employees' },
      { method: 'POST', path: '/api/employees', auth: 'Admin Only', description: 'Onboard a new employee' },
      { method: 'GET', path: '/api/employees/:id', auth: 'Bearer Token', description: 'Get employee profile and host settings' },
      { method: 'PUT', path: '/api/employees/:id', auth: 'Admin Only', description: 'Update employee job title or limits' },
      { method: 'DELETE', path: '/api/employees/:id', auth: 'Admin Only', description: 'Archive or offboard employee' },
      { method: 'GET', path: '/api/employee-portal/dashboard', auth: 'Bearer Token', description: 'Host employee visitor dashboard' },
      { method: 'GET', path: '/api/employee-portal/visitors', auth: 'Bearer Token', description: 'List visitors scheduled for this host' }
    ]
  },
  {
    id: 'visitor-profiles',
    name: 'Visitor Profiles & Master Registry',
    description: 'Comprehensive visitor profiles, identity verification status, photos, notes, and blacklisting',
    endpoints: [
      { method: 'GET', path: '/api/visitor-profiles', auth: 'Bearer Token', description: 'Search visitor profiles directory' },
      { method: 'GET', path: '/api/visitor-profiles/stats', auth: 'Bearer Token', description: 'Visitor demographic & check-in statistics' },
      { method: 'GET', path: '/api/visitor-profiles/:id', auth: 'Bearer Token', description: 'Get detailed visitor profile' },
      { method: 'PUT', path: '/api/visitor-profiles/:id', auth: 'Bearer Token', description: 'Update visitor contact and vehicle details' },
      { method: 'PATCH', path: '/api/visitor-profiles/:id/status', auth: 'Bearer Token', description: 'Update visitor status (ACTIVE/SUSPENDED)' },
      { method: 'PATCH', path: '/api/visitor-profiles/:id/verify-identity', auth: 'Bearer Token', description: 'Record manual identity verification' },
      { method: 'POST', path: '/api/visitor-profiles/:id/photos', auth: 'Bearer Token', description: 'Upload visitor badge/face photograph' },
      { method: 'PATCH', path: '/api/visitor-profiles/:id/photos/:photoId/active', auth: 'Bearer Token', description: 'Set default primary visitor photo' },
      { method: 'DELETE', path: '/api/visitor-profiles/photos/:photoId', auth: 'Bearer Token', description: 'Delete visitor photo record' },
      { method: 'POST', path: '/api/visitor-profiles/:id/notes', auth: 'Bearer Token', description: 'Add security or receptionist note to profile' },
      { method: 'DELETE', path: '/api/visitor-profiles/notes/:noteId', auth: 'Bearer Token', description: 'Delete receptionist note' },
      { method: 'GET', path: '/api/visitor-profiles/:id/pass', auth: 'Bearer Token', description: 'Generate visitor security pass payload' },
      { method: 'POST', path: '/api/visitor-profiles/:id/archive', auth: 'Bearer Token', description: 'Archive visitor profile' },
      { method: 'POST', path: '/api/visitor-profiles/:id/restore', auth: 'Bearer Token', description: 'Restore archived profile' },
      { method: 'DELETE', path: '/api/visitor-profiles/:id', auth: 'Bearer Token', description: 'Permanently remove visitor profile' }
    ]
  },
  {
    id: 'visitor-registration',
    name: 'Visitor Registration & History',
    description: 'Pre-registration portal, walk-in registration, visitor categories, and visit audit history',
    endpoints: [
      { method: 'POST', path: '/api/visitors/registration/pre-register', auth: 'Public', description: 'Public visitor self-registration' },
      { method: 'POST', path: '/api/visitors/registration/register', auth: 'Bearer Token', description: 'Complete on-site visitor registration' },
      { method: 'POST', path: '/api/visitors/registration/save-draft', auth: 'Bearer Token', description: 'Save partial registration draft' },
      { method: 'GET', path: '/api/visitors/registration/drafts', auth: 'Bearer Token', description: 'List pending registration drafts' },
      { method: 'GET', path: '/api/visitor-categories', auth: 'Bearer Token', description: 'List visitor classification categories' },
      { method: 'POST', path: '/api/visitor-categories', auth: 'Admin Only', description: 'Define visitor category (e.g. VIP, Contractor)' },
      { method: 'GET', path: '/api/visitor-categories/by-code/:code', auth: 'Bearer Token', description: 'Find category details by unique code' },
      { method: 'GET', path: '/api/visitor-history', auth: 'Bearer Token', description: 'Full visit log history across facilities' },
      { method: 'GET', path: '/api/visitor-history/:id', auth: 'Bearer Token', description: 'Specific visit entry timeline and logs' },
      { method: 'PUT', path: '/api/visitor-history/:id', auth: 'Bearer Token', description: 'Update visit log entry notes' },
      { method: 'DELETE', path: '/api/visitor-history/:id', auth: 'Admin Only', description: 'Purge visit log entry' }
    ]
  },
  {
    id: 'appointments',
    name: 'Appointments & Visitor Visits',
    description: 'Schedule, reschedule, approve, and cancel visitor appointments and check-in bookings',
    endpoints: [
      { method: 'GET', path: '/api/appointments', auth: 'Bearer Token', description: 'List upcoming and historical appointments' },
      { method: 'POST', path: '/api/appointments', auth: 'Bearer Token', description: 'Book a new visitor appointment' },
      { method: 'GET', path: '/api/appointments/:id', auth: 'Bearer Token', description: 'Get appointment details, host, and QR code' },
      { method: 'PUT', path: '/api/appointments/:id', auth: 'Bearer Token', description: 'Update appointment schedule or details' },
      { method: 'PATCH', path: '/api/appointments/:id/status', auth: 'Bearer Token', description: 'Update status (CONFIRMED/CANCELLED)' },
      { method: 'PATCH', path: '/api/appointments/:id/reschedule', auth: 'Bearer Token', description: 'Reschedule appointment time' },
      { method: 'DELETE', path: '/api/appointments/:id', auth: 'Bearer Token', description: 'Delete or cancel appointment' }
    ]
  },
  {
    id: 'reception',
    name: 'Front Desk & Reception Operations',
    description: 'Appointment verification, instant walk-in registration, visitor badge generation, and check-in/out',
    endpoints: [
      { method: 'POST', path: '/api/reception/verify-appointment', auth: 'Bearer Token', description: 'Lookup appointment via code or QR code' },
      { method: 'POST', path: '/api/reception/walk-ins', auth: 'Bearer Token', description: 'Process unplanned walk-in visitor arrival' },
      { method: 'POST', path: '/api/reception/passes/generate', auth: 'Bearer Token', description: 'Generate and print visitor access badge' },
      { method: 'POST', path: '/api/reception/notifications/send', auth: 'Bearer Token', description: 'Notify host employee of visitor lobby arrival' },
      { method: 'POST', path: '/api/checkin', auth: 'Bearer Token', description: 'Check in visitor and log entry timestamp' },
      { method: 'POST', path: '/api/checkout', auth: 'Bearer Token', description: 'Check out visitor and deactivate badge' },
      { method: 'GET', path: '/api/checkin/active', auth: 'Bearer Token', description: 'List all visitors currently on premises' }
    ]
  },
  {
    id: 'identity-verification',
    name: 'Identity Verification & Biometrics',
    description: 'Automated government ID document OCR, selfie liveness detection, and face matching',
    endpoints: [
      { method: 'GET', path: '/api/identity-verification/:id', auth: 'Bearer Token', description: 'Get identity verification workflow status' },
      { method: 'POST', path: '/api/identity-verification/:id/mobile-session', auth: 'Bearer Token', description: 'Initialize mobile web capture session' },
      { method: 'POST', path: '/api/identity-verification/:id/upload-front', auth: 'Bearer Token', description: 'Upload front scan of National ID or Passport' },
      { method: 'POST', path: '/api/identity-verification/:id/upload-back', auth: 'Bearer Token', description: 'Upload back scan of National ID' },
      { method: 'POST', path: '/api/identity-verification/:id/upload-selfie', auth: 'Bearer Token', description: 'Upload live portrait selfie for verification' },
      { method: 'POST', path: '/api/identity-verification/:id/run-ocr', auth: 'Bearer Token', description: 'Execute OCR text extraction engine' },
      { method: 'POST', path: '/api/identity-verification/:id/analyze-document', auth: 'Bearer Token', description: 'Run document authenticity & anti-spoof checks' },
      { method: 'POST', path: '/api/identity-verification/:id/run-liveness', auth: 'Bearer Token', description: 'Perform 3D passive/active liveness test' },
      { method: 'POST', path: '/api/identity-verification/:id/run-facematch', auth: 'Bearer Token', description: 'Compare document photo against live selfie' },
      { method: 'POST', path: '/api/identity-verification/:id/validate-security', auth: 'Bearer Token', description: 'Run security checks against security databases' },
      { method: 'POST', path: '/api/identity-verification/:id/complete', auth: 'Bearer Token', description: 'Finalize and approve verification profile' },
      { method: 'GET', path: '/api/identity-verification/:id/report', auth: 'Bearer Token', description: 'Download identity verification audit report PDF' }
    ]
  },
  {
    id: 'security',
    name: 'Security & Watchlist / Blacklist',
    description: 'Blacklist screening, watchlist alerts, security flags, and perimeter access restrictions',
    endpoints: [
      { method: 'GET', path: '/api/security/blacklist-watchlist', auth: 'Bearer Token', description: 'List all blacklisted/flagged individuals' },
      { method: 'POST', path: '/api/security/blacklist-watchlist', auth: 'Admin Only', description: 'Add visitor to security blacklist or watchlist' },
      { method: 'GET', path: '/api/security/blacklist-watchlist/:id', auth: 'Bearer Token', description: 'Get detailed security watchlist file' },
      { method: 'PUT', path: '/api/security/blacklist-watchlist/:id', auth: 'Admin Only', description: 'Update watchlist risk level or reason' },
      { method: 'DELETE', path: '/api/security/blacklist-watchlist/:id', auth: 'Admin Only', description: 'Remove or clear individual from watchlist' },
      { method: 'POST', path: '/api/security/screen', auth: 'Bearer Token', description: 'Real-time pre-screening against watchlist database' }
    ]
  },
  {
    id: 'documents',
    name: 'Document Management (EDMS)',
    description: 'Upload, OCR, versioning, replacement, download, inline viewing, and archival of visitor documents',
    endpoints: [
      { method: 'GET', path: '/api/documents', auth: 'Bearer Token', description: 'List visitor documents with category and date filters' },
      { method: 'POST', path: '/api/documents', auth: 'Bearer Token', description: 'Upload visitor identity document or signed NDA' },
      { method: 'POST', path: '/api/documents/bulk-upload', auth: 'Bearer Token', description: 'Upload multiple visitor documents in batch' },
      { method: 'GET', path: '/api/documents/dashboard', auth: 'Bearer Token', description: 'EDMS metrics: uploaded, verified, pending' },
      { method: 'GET', path: '/api/documents/categories', auth: 'Bearer Token', description: 'List document categories (Passport, NDA, ID)' },
      { method: 'POST', path: '/api/documents/categories', auth: 'Admin Only', description: 'Define new document category' },
      { method: 'GET', path: '/api/documents/statuses', auth: 'Bearer Token', description: 'List document lifecycle statuses' },
      { method: 'GET', path: '/api/documents/:id', auth: 'Bearer Token', description: 'Get document metadata and audit logs' },
      { method: 'PUT', path: '/api/documents/:id', auth: 'Bearer Token', description: 'Update document metadata tags' },
      { method: 'POST', path: '/api/documents/:id/replace', auth: 'Bearer Token', description: 'Replace file with new version revision' },
      { method: 'GET', path: '/api/documents/:id/download', auth: 'Bearer Token', description: 'Download physical document file stream' },
      { method: 'GET', path: '/api/documents/:id/view', auth: 'Bearer Token', description: 'Stream document inline for browser preview' },
      { method: 'GET', path: '/api/documents/:id/preview', auth: 'Bearer Token', description: 'Stream document inline thumbnail or preview' },
      { method: 'POST', path: '/api/documents/:id/verify', auth: 'Bearer Token', description: 'Mark document as verified' },
      { method: 'POST', path: '/api/documents/:id/approve', auth: 'Bearer Token', description: 'Approve visitor document compliance' },
      { method: 'POST', path: '/api/documents/:id/restore-version/:versionNumber', auth: 'Bearer Token', description: 'Rollback document to previous historical version' },
      { method: 'PATCH', path: '/api/documents/:id/status', auth: 'Bearer Token', description: 'Update document compliance status' },
      { method: 'PATCH', path: '/api/documents/:id/archive', auth: 'Bearer Token', description: 'Archive document' },
      { method: 'PATCH', path: '/api/documents/:id/restore', auth: 'Bearer Token', description: 'Restore archived document' },
      { method: 'DELETE', path: '/api/documents/:id', auth: 'Admin Only', description: 'Delete document' }
    ]
  },
  {
    id: 'calendar',
    name: 'Calendar & Working Schedules',
    description: 'Working schedules, shift hours, holidays, special operating days, and timezone configurations',
    endpoints: [
      { method: 'GET', path: '/api/calendar/dashboard', auth: 'Bearer Token', description: 'Calendar dashboard KPIs and upcoming holidays' },
      { method: 'GET', path: '/api/calendar/statistics', auth: 'Bearer Token', description: 'Facility operating hours statistics' },
      { method: 'GET', path: '/api/calendar/validation', auth: 'Bearer Token', description: 'Audit working hours compliance' },
      { method: 'GET', path: '/api/calendar/preview', auth: 'Bearer Token', description: 'Monthly calendar grid with holidays & schedules' },
      { method: 'GET', path: '/api/calendar/schedules/org', auth: 'Bearer Token', description: 'Get organization standard working schedule' },
      { method: 'POST', path: '/api/calendar/schedules/org', auth: 'Admin Only', description: 'Save organization weekly operating hours' },
      { method: 'GET', path: '/api/calendar/schedules/branch', auth: 'Bearer Token', description: 'Get branch specific schedule override' },
      { method: 'POST', path: '/api/calendar/schedules/branch', auth: 'Admin Only', description: 'Set branch schedule override' },
      { method: 'POST', path: '/api/calendar/schedules/branch/reset', auth: 'Admin Only', description: 'Reset branch schedule to organization default' },
      { method: 'GET', path: '/api/calendar/schedules', auth: 'Bearer Token', description: 'Search working schedules' },
      { method: 'POST', path: '/api/calendar/schedules', auth: 'Admin Only', description: 'Save schedule configuration' },
      { method: 'GET', path: '/api/calendar/holidays', auth: 'Bearer Token', description: 'List registered public and company holidays' },
      { method: 'POST', path: '/api/calendar/holidays', auth: 'Admin Only', description: 'Register a new holiday' },
      { method: 'GET', path: '/api/calendar/holidays/:id', auth: 'Bearer Token', description: 'Get holiday details' },
      { method: 'PUT', path: '/api/calendar/holidays/:id', auth: 'Admin Only', description: 'Update holiday date or name' },
      { method: 'DELETE', path: '/api/calendar/holidays/:id', auth: 'Admin Only', description: 'Delete holiday entry' },
      { method: 'GET', path: '/api/calendar/special-days', auth: 'Bearer Token', description: 'List special weekend operations / override days' },
      { method: 'POST', path: '/api/calendar/special-days', auth: 'Admin Only', description: 'Register special operating day' },
      { method: 'DELETE', path: '/api/calendar/special-days/:id', auth: 'Admin Only', description: 'Remove special working day' },
      { method: 'GET', path: '/api/calendar/timezones', auth: 'Bearer Token', description: 'List configured campus timezones' },
      { method: 'PUT', path: '/api/calendar/timezones', auth: 'Admin Only', description: 'Update campus timezone and DST rules' }
    ]
  },
  {
    id: 'workflows',
    name: 'Approval Workflows & Multi-Level Rules',
    description: 'Multi-stage visitor approvals, delegation policies, step escalation, rule engines, and audit logs',
    endpoints: [
      { method: 'GET', path: '/api/workflows', auth: 'Bearer Token', description: 'List all multi-stage approval workflows' },
      { method: 'POST', path: '/api/workflows', auth: 'Admin Only', description: 'Create a new approval workflow' },
      { method: 'GET', path: '/api/workflows/:id', auth: 'Bearer Token', description: 'Get workflow details with approval levels & rules' },
      { method: 'PUT', path: '/api/workflows/:id', auth: 'Admin Only', description: 'Update approval workflow steps and triggers' },
      { method: 'POST', path: '/api/workflows/:id/clone', auth: 'Admin Only', description: 'Clone workflow definition' },
      { method: 'PATCH', path: '/api/workflows/:id/status', auth: 'Admin Only', description: 'Toggle workflow status (Active/Inactive)' },
      { method: 'DELETE', path: '/api/workflows/:id', auth: 'Admin Only', description: 'Soft-delete workflow' },
      { method: 'POST', path: '/api/workflows/delegations', auth: 'Bearer Token', description: 'Delegate host approval authority to another staff member' },
      { method: 'GET', path: '/api/rules', auth: 'Bearer Token', description: 'List dynamic approval routing rules' },
      { method: 'POST', path: '/api/rules', auth: 'Admin Only', description: 'Create dynamic rule trigger' }
    ]
  },
  {
    id: 'notifications',
    name: 'Enterprise Notifications & Dispatch',
    description: 'In-app, Email, SMS, and Push notification channels, templates, rules, and delivery logs',
    endpoints: [
      { method: 'GET', path: '/api/notifications', auth: 'Bearer Token', description: 'List notifications for current user' },
      { method: 'PATCH', path: '/api/notifications/:id/read', auth: 'Bearer Token', description: 'Mark notification as read' },
      { method: 'PATCH', path: '/api/notifications/read-all', auth: 'Bearer Token', description: 'Mark all notifications as read' },
      { method: 'POST', path: '/api/automatic-notifications', auth: 'Admin Only', description: 'Configure automated event triggers' },
      { method: 'POST', path: '/api/manual-notifications', auth: 'Bearer Token', description: 'Send broadcast or targeted ad-hoc notification' },
      { method: 'POST', path: '/api/manual-composer', auth: 'Bearer Token', description: 'Compose customized multi-channel announcement' },
      { method: 'GET', path: '/api/notification-rules', auth: 'Admin Only', description: 'List notification dispatch rules' },
      { method: 'GET', path: '/api/notification-engine', auth: 'Admin Only', description: 'Check notification broker delivery engine status' }
    ]
  },
  {
    id: 'system-settings',
    name: 'System Settings & Configuration',
    description: 'Global system parameters, branding, localization, backups, restore, import/export, and feedback',
    endpoints: [
      { method: 'GET', path: '/api/settings', auth: 'Bearer Token', description: 'Get all system configuration categories' },
      { method: 'GET', path: '/api/settings/:category', auth: 'Bearer Token', description: 'Get category settings (general, numbering, etc.)' },
      { method: 'PUT', path: '/api/settings/:category', auth: 'Admin Only', description: 'Update category configuration' },
      { method: 'GET', path: '/api/settings/export', auth: 'Admin Only', description: 'Export full organization configuration JSON' },
      { method: 'POST', path: '/api/settings/import', auth: 'Admin Only', description: 'Import full organization configuration' },
      { method: 'GET', path: '/api/settings/backups', auth: 'Admin Only', description: 'List system settings snapshot backups' },
      { method: 'POST', path: '/api/settings/backups', auth: 'Admin Only', description: 'Create snapshot backup of settings' },
      { method: 'POST', path: '/api/settings/restore', auth: 'Admin Only', description: 'Restore settings from snapshot' },
      { method: 'GET', path: '/api/settings/history', auth: 'Admin Only', description: 'View audit trail of settings modifications' },
      { method: 'GET', path: '/api/settings/validation', auth: 'Admin Only', description: 'Run settings validation audit report' },
      { method: 'POST', path: '/api/feedback-support/feedback', auth: 'Bearer Token', description: 'Submit user satisfaction feedback' },
      { method: 'PATCH', path: '/api/feedback-support/feedback/:id/status', auth: 'Admin Only', description: 'Update feedback resolution status' },
      { method: 'POST', path: '/api/feedback-support/tickets', auth: 'Bearer Token', description: 'Create IT support helpdesk ticket' },
      { method: 'POST', path: '/api/feedback-support/tickets/:id/messages', auth: 'Bearer Token', description: 'Reply to support ticket' },
      { method: 'PATCH', path: '/api/feedback-support/tickets/:id/status', auth: 'Admin Only', description: 'Update ticket status (Resolved/Closed)' }
    ]
  },
  {
    id: 'reports',
    name: 'Reporting, Analytics & System Health',
    description: 'Executive dashboards, visitor traffic trends, peak hours, security logs, and health status',
    endpoints: [
      { method: 'GET', path: '/api/health', auth: 'Public', description: 'Service health check endpoint' },
      { method: 'GET', path: '/api/endpoints', auth: 'Public', description: 'Catalog of all backend API endpoints & collections' },
      { method: 'GET', path: '/api/postman-collection', auth: 'Public', description: 'Download Postman v2.1 collection JSON' },
      { method: 'GET', path: '/api/reports/dashboard', auth: 'Bearer Token', description: 'Executive visitor analytics summary' },
      { method: 'GET', path: '/api/dashboard/stats', auth: 'Bearer Token', description: 'Live operational check-in statistics' },
      { method: 'GET', path: '/api/exports/visitors', auth: 'Admin Only', description: 'Export visitor log history to Excel/CSV' }
    ]
  }
];

// Flatten all endpoints
function getAllEndpoints() {
  const all = [];
  modulesCatalog.forEach(mod => {
    mod.endpoints.forEach(ep => {
      all.push({
        module: mod.name,
        moduleId: mod.id,
        ...ep
      });
    });
  });
  return all;
}

// Generate Postman Collection v2.1 JSON
function generatePostmanCollection(baseUrl = 'http://localhost:5000') {
  return {
    info: {
      name: 'Visitor Management System (VMS) - Complete API Collection',
      description: 'Production-ready Postman collection for all VMS modules: Authentication, RBAC, Visitors, Reception, Documents, Workflows, Calendar, and System Settings.',
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
    item: modulesCatalog.map(mod => ({
      name: mod.name,
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
  const total = getAllEndpoints().length;
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  const modulePills = modulesCatalog.map((m, idx) => `
    <button class="nav-pill ${idx === 0 ? 'active' : ''}" onclick="filterModule('${m.id}')">
      ${m.name} <span class="badge">${m.endpoints.length}</span>
    </button>
  `).join('');

  const moduleSections = modulesCatalog.map(m => `
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
  <title>VMS API Explorer — All Endpoints by Collection</title>
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
        <p>Enterprise REST API Catalog & Complete Collection Explorer</p>
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
      <div class="stat-val">${modulesCatalog.length}</div>
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
    <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search endpoint by method, path, or description (e.g. POST /api/workflows, documents, blacklist)..." oninput="searchEndpoints()">
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
  modulesCatalog,
  getAllEndpoints,
  generatePostmanCollection,
  renderHtmlCatalog
};
