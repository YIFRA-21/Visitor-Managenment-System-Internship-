# Visitor Management System — Complete API Endpoints Directory

Total Modules: 40 | Total API Endpoints: 641

## Authentication (26 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| POST | /api/auth/check-email |
| GET | /api/auth/admin/duplicate-emails |
| POST | /api/auth/register |
| GET | /api/auth/login |
| POST | /api/auth/login |
| POST | /api/auth/logout |
| POST | /api/auth/refresh-token |
| POST | /api/auth/refresh |
| POST | /api/auth/forgot-password |
| POST | /api/auth/reset-password |
| POST | /api/auth/verify-email |
| POST | /api/auth/resend-verification |
| POST | /api/auth/change-password |
| PUT | /api/auth/change-password |
| GET | /api/auth/me |
| GET | /api/auth/me/permissions |
| GET | /api/auth/me/resources |
| GET | /api/auth/profile |
| PUT | /api/auth/profile |
| DELETE | /api/auth/profile |
| GET | /api/auth/sessions |
| DELETE | /api/auth/sessions/:id |
| DELETE | /api/auth/sessions |
| GET | /api/auth/users |
| PATCH | /api/auth/users/:id |
| POST | /api/auth/avatar |

## Departments (12 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/departments/public |
| GET | /api/departments/search |
| GET | /api/departments/check-code |
| GET | /api/departments/statistics/overview |
| GET | /api/departments |
| POST | /api/departments |
| GET | /api/departments/:id/employees |
| GET | /api/departments/:id |
| PUT | /api/departments/:id |
| DELETE | /api/departments/:id |
| PATCH | /api/departments/:id/status |
| GET | /api/departments/:id/status/history |

## Employees (21 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/employees/public |
| GET | /api/employees/dashboard-stats |
| GET | /api/employees/stats |
| GET | /api/employees/audit-logs |
| POST | /api/employees/import |
| GET | /api/employees/me |
| GET | /api/employees/export |
| GET | /api/employees |
| POST | /api/employees |
| GET | /api/employees/:id |
| PUT | /api/employees/:id |
| PATCH | /api/employees/:id/availability |
| PATCH | /api/employees/:id/host-settings |
| PATCH | /api/employees/:id/status |
| PATCH | /api/employees/:id/archive |
| PATCH | /api/employees/:id/restore |
| DELETE | /api/employees/:id |
| POST | /api/employees/:id/resend-registration-email |
| GET | /api/employees/:id/appointments |
| GET | /api/employees/:id/audit-logs |
| GET | /api/employees/:id/availability |

## Employee Portal (13 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/employee-portal/dashboard |
| GET | /api/employee-portal/requests |
| POST | /api/employee-portal/requests/:id/action |
| GET | /api/employee-portal/requests/:id/documents |
| GET | /api/employee-portal/my-appointments |
| GET | /api/employee-portal/my-visitors |
| GET | /api/employee-portal/my-visitors/:id |
| GET | /api/employee-portal/my-visitors/:id/documents |
| GET | /api/employee-portal/visitors/:id/documents |
| GET | /api/employee-portal/rooms |
| POST | /api/employee-portal/rooms/reserve |
| GET | /api/employee-portal/support/tickets |
| POST | /api/employee-portal/support/tickets |

## Appointments (23 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| POST | /api/appointments/upload |
| POST | /api/appointments/upload/front |
| POST | /api/appointments/upload/back |
| POST | /api/appointments/upload/selfie |
| POST | /api/appointments/upload/selfie-base64 |
| POST | /api/appointments |
| GET | /api/appointments/track |
| GET | /api/appointments/dashboard-stats |
| GET | /api/appointments/calendar |
| POST | /api/appointments/check-eligibility |
| GET | /api/appointments/approvals/pending |
| POST | /api/appointments/approvals/:id/decision |
| GET | /api/appointments |
| GET | /api/appointments/:id |
| PUT | /api/appointments/:id/cancel |
| PATCH | /api/appointments/:id/approve |
| PATCH | /api/appointments/:id/reject |
| PATCH | /api/appointments/:id/reschedule |
| GET | /api/appointments/:id/qr |
| POST | /api/appointments/forgot-reference |
| POST | /api/appointments/verify-identity |
| DELETE | /api/appointments/:id |
| PATCH | /api/appointments/:id/restore |

## Check-In (14 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/checkin/live-board |
| POST | /api/checkin/scan |
| GET | /api/checkin/active/:code |
| POST | /api/checkin/:appointmentId/checkout |
| GET | /api/checkin/dashboard |
| GET | /api/checkin/pending |
| GET | /api/checkin/history |
| GET | /api/checkin/analytics |
| POST | /api/checkin/walkin |
| POST | /api/checkin/validate |
| GET | /api/checkin/search |
| POST | /api/checkin/override |
| GET | /api/checkin/queue/status |
| POST | /api/checkin/group |

## Check-Out (8 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/checkout/dashboard |
| GET | /api/checkout/pending |
| GET | /api/checkout/overstay |
| GET | /api/checkout/evacuation |
| GET | /api/checkout/history |
| GET | /api/checkout/analytics |
| POST | /api/checkout/process |
| POST | /api/checkout/group |

## Reports & Analytics (14 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/reports/dashboard |
| GET | /api/reports/visitors |
| GET | /api/reports/audit-logs |
| GET | /api/reports/daily |
| GET | /api/reports/monthly |
| GET | /api/reports/employee-stats |
| GET | /api/reports/security |
| GET | /api/reports/peak-hours |
| GET | /api/reports/history |
| GET | /api/reports/kpis |
| GET | /api/reports/departments |
| GET | /api/reports/occupancy |
| GET | /api/reports/saved |
| POST | /api/reports/custom |

## Building & Rooms (3 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/rooms |
| GET | /api/rooms/:id/availability |
| POST | /api/rooms |

## Notifications (31 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/notifications/health |
| GET | /api/notifications |
| GET | /api/notifications/unread-count |
| GET | /api/notifications/preferences |
| PUT | /api/notifications/preferences |
| GET | /api/notifications/announcements |
| GET | /api/notifications/deliveries |
| GET | /api/notifications/audit-logs |
| PATCH | /api/notifications/read-all |
| PUT | /api/notifications/read-all |
| POST | /api/notifications/read-all |
| PUT | /api/notifications/mark-all-read |
| POST | /api/notifications/mark-all-read |
| PATCH | /api/notifications/mark-all-read |
| POST | /api/notifications/bulk-delete |
| DELETE | /api/notifications/bulk |
| PATCH | /api/notifications/:id/read |
| PUT | /api/notifications/:id/read |
| POST | /api/notifications/:id/read |
| PATCH | /api/notifications/:id/unread |
| PUT | /api/notifications/:id/unread |
| POST | /api/notifications/:id/unread |
| DELETE | /api/notifications/:id |
| POST | /api/notifications/:id/delete |
| DELETE | /api/notifications/:id/delete |
| POST | /api/notifications/:id/forward |
| GET | /api/notifications/:id |
| POST | /api/notifications/send |
| POST | /api/notifications/:id/retry |
| POST | /api/notifications/trigger-test |
| POST | /api/notifications/test-trigger |

## Communications (22 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/communication/contacts |
| POST | /api/communication/contacts/manual |
| GET | /api/communication/unread-counts |
| GET | /api/communication/chat/conversations |
| PUT | /api/communication/chat/conversations/:convId |
| DELETE | /api/communication/chat/conversations/:convId |
| POST | /api/communication/chat/conversations/:convId/participants |
| DELETE | /api/communication/chat/conversations/:convId/participants/:userId |
| POST | /api/communication/chat/direct |
| POST | /api/communication/chat/group |
| GET | /api/communication/chat/messages/:convId |
| POST | /api/communication/chat/messages/:convId |
| PUT | /api/communication/chat/messages/:convId/:messageId |
| DELETE | /api/communication/chat/messages/:convId/:messageId |
| POST | /api/communication/upload |
| POST | /api/communication/email/send |
| GET | /api/communication/announcements |
| POST | /api/communication/announcements |
| PUT | /api/communication/announcements/:id/read |
| PUT | /api/communication/announcements/:id |
| DELETE | /api/communication/announcements/:id |
| POST | /api/communication/announcements/:id/delete |

## Security & Access (15 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/security/blacklist |
| POST | /api/security/blacklist |
| DELETE | /api/security/blacklist/:id |
| GET | /api/security/verify/:referenceCode |
| GET | /api/security/dashboard |
| GET | /api/security/watchlist |
| POST | /api/security/watchlist |
| DELETE | /api/security/watchlist/:id |
| GET | /api/security/incidents |
| POST | /api/security/incidents |
| PUT | /api/security/incidents/:id |
| GET | /api/security/access-rules |
| GET | /api/security/escorts |
| POST | /api/security/escorts |
| GET | /api/security/analytics |

## Organizations (26 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/organizations/search |
| GET | /api/organizations/check-code |
| GET | /api/organizations/public |
| GET | /api/organizations/public-branding |
| GET | /api/organizations |
| POST | /api/organizations |
| GET | /api/organizations/:id |
| PUT | /api/organizations/:id |
| DELETE | /api/organizations/:id |
| PATCH | /api/organizations/:id/restore |
| PATCH | /api/organizations/:id/activate |
| PATCH | /api/organizations/:id/deactivate |
| GET | /api/organizations/:id/status |
| PATCH | /api/organizations/:id/status |
| GET | /api/organizations/:id/status/history |
| GET | /api/organizations/:id/settings |
| PUT | /api/organizations/:id/settings |
| PUT | /api/organizations/:id/branding |
| GET | /api/organizations/:id/statistics |
| GET | /api/organizations/:orgId/branches/public |
| GET | /api/organizations/:orgId/branches |
| POST | /api/organizations/branches |
| PUT | /api/organizations/branches/:id |
| DELETE | /api/organizations/branches/:id |
| GET | /api/organizations/branches/:branchId/buildings |
| POST | /api/organizations/buildings |

## Organization Home (7 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/organization/home |
| GET | /api/organization/home/cards |
| GET | /api/organization/home/charts |
| GET | /api/organization/home/statistics |
| GET | /api/organization/home/activities |
| GET | /api/organization/home/quick-actions |
| GET | /api/organization/home/search |

## Branches (10 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/branches/statistics |
| GET | /api/branches/search |
| GET | /api/branches/check-code |
| GET | /api/branches |
| POST | /api/branches |
| GET | /api/branches/:id |
| PUT | /api/branches/:id |
| DELETE | /api/branches/:id |
| PATCH | /api/branches/:id/status |
| GET | /api/branches/:id/status/history |

## Users (35 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/users/statistics |
| GET | /api/users/stats |
| POST | /api/users/invitations |
| GET | /api/users/invitations |
| POST | /api/users/invitations/:id/resend |
| DELETE | /api/users/invitations/:id |
| GET | /api/users/saved-searches |
| POST | /api/users/saved-searches |
| DELETE | /api/users/saved-searches/:id |
| POST | /api/users/bulk-status |
| POST | /api/users/bulk-notify |
| POST | /api/users/import |
| GET | /api/users/export |
| GET | /api/users |
| GET | /api/users/:id |
| POST | /api/users |
| PUT | /api/users/:id |
| PATCH | /api/users/:id/status |
| PATCH | /api/users/:id/lock |
| PATCH | /api/users/:id/unlock |
| PATCH | /api/users/:id/block |
| PATCH | /api/users/:id/unblock |
| DELETE | /api/users/:id |
| POST | /api/users/:id/archive |
| POST | /api/users/:id/restore |
| POST | /api/users/:id/resend-email-verification |
| POST | /api/users/:id/resend-phone-verification |
| PATCH | /api/users/:id/reset-password |
| POST | /api/users/:id/send-credentials |
| POST | /api/users/:id/resend-registration-email |
| GET | /api/users/:id/sessions |
| DELETE | /api/users/:id/sessions/all |
| DELETE | /api/users/:id/sessions/:sessionId |
| GET | /api/users/:id/login-history |
| GET | /api/users/:id/activity |

## Roles (33 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/roles/statistics |
| GET | /api/roles |
| GET | /api/roles/matrix |
| GET | /api/roles/compare |
| GET | /api/roles/export |
| GET | /api/roles/hierarchy |
| POST | /api/roles/hierarchy |
| DELETE | /api/roles/hierarchy/:id |
| GET | /api/roles/conflicts |
| POST | /api/roles/conflicts |
| DELETE | /api/roles/conflicts/:id |
| GET | /api/roles/sod-rules |
| POST | /api/roles/sod-rules |
| DELETE | /api/roles/sod-rules/:id |
| GET | /api/roles/templates |
| POST | /api/roles/templates/instantiate |
| POST | /api/roles/bulk-operations |
| GET | /api/roles/permissions/all |
| GET | /api/roles/permissions/modules |
| GET | /api/roles/:id |
| POST | /api/roles |
| PUT | /api/roles/:id |
| POST | /api/roles/:id/activate |
| POST | /api/roles/:id/deactivate |
| POST | /api/roles/:id/archive |
| DELETE | /api/roles/:id |
| POST | /api/roles/:id/restore |
| POST | /api/roles/:id/clone |
| GET | /api/roles/:id/permissions |
| PUT | /api/roles/:id/permissions |
| GET | /api/roles/:id/users |
| POST | /api/roles/:id/users |
| DELETE | /api/roles/:id/users/:userId |

## System Admin (18 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/system/dashboard |
| GET | /api/system/health |
| GET | /api/system/settings |
| GET | /api/system/settings/categories |
| GET | /api/system/settings/:key |
| PUT | /api/system/settings |
| DELETE | /api/system/settings/:key |
| GET | /api/system/feature-flags |
| PATCH | /api/system/feature-flags/:id |
| GET | /api/system/modules |
| PATCH | /api/system/modules/:id |
| GET | /api/system/configurations |
| PATCH | /api/system/configurations/:id |
| GET | /api/system/audit-logs/stats |
| GET | /api/system/audit-logs/processes |
| GET | /api/system/audit-logs/export |
| GET | /api/system/audit-logs/:id |
| GET | /api/system/audit-logs |

## Audit Logs (18 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/audit-logs/dashboard |
| GET | /api/audit-logs/health |
| GET | /api/audit-logs/settings |
| GET | /api/audit-logs/settings/categories |
| GET | /api/audit-logs/settings/:key |
| PUT | /api/audit-logs/settings |
| DELETE | /api/audit-logs/settings/:key |
| GET | /api/audit-logs/feature-flags |
| PATCH | /api/audit-logs/feature-flags/:id |
| GET | /api/audit-logs/modules |
| PATCH | /api/audit-logs/modules/:id |
| GET | /api/audit-logs/configurations |
| PATCH | /api/audit-logs/configurations/:id |
| GET | /api/audit-logs/audit-logs/stats |
| GET | /api/audit-logs/audit-logs/processes |
| GET | /api/audit-logs/audit-logs/export |
| GET | /api/audit-logs/audit-logs/:id |
| GET | /api/audit-logs/audit-logs |

## Manager (26 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/manager/ping |
| GET | /api/manager/overview |
| GET | /api/manager/employees |
| PATCH | /api/manager/employees/:employeeId/host-status |
| GET | /api/manager/host-availability |
| GET | /api/manager/visitor-requests |
| GET | /api/manager/visitor-requests/:id |
| GET | /api/manager/alternative-hosts |
| POST | /api/manager/visitor-requests/:id/reassign |
| POST | /api/manager/visitor-requests/:id/assign-host |
| POST | /api/manager/visitor-requests/:id/approve |
| POST | /api/manager/visitor-requests/:id/reject |
| GET | /api/manager/appointments |
| GET | /api/manager/appointments/:id |
| GET | /api/manager/visitors |
| GET | /api/manager/reports |
| GET | /api/manager/export |
| GET | /api/manager/audit-logs |
| GET | /api/manager/profile |
| PUT | /api/manager/profile |
| GET | /api/manager/rooms |
| POST | /api/manager/rooms/book |
| GET | /api/manager/policies |
| PUT | /api/manager/policies |
| GET | /api/manager/evacuation |
| GET | /api/manager/security-zones |

## Calendar (21 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/calendar/dashboard |
| GET | /api/calendar/statistics |
| GET | /api/calendar/validation |
| GET | /api/calendar/preview |
| GET | /api/calendar/schedules/org |
| POST | /api/calendar/schedules/org |
| GET | /api/calendar/schedules/branch |
| POST | /api/calendar/schedules/branch |
| POST | /api/calendar/schedules/branch/reset |
| GET | /api/calendar/schedules |
| POST | /api/calendar/schedules |
| GET | /api/calendar/holidays |
| POST | /api/calendar/holidays |
| GET | /api/calendar/holidays/:id |
| PUT | /api/calendar/holidays/:id |
| DELETE | /api/calendar/holidays/:id |
| GET | /api/calendar/special-days |
| POST | /api/calendar/special-days |
| DELETE | /api/calendar/special-days/:id |
| GET | /api/calendar/timezones |
| PUT | /api/calendar/timezones |

## Visitor Portal (27 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/visitor/dashboard |
| GET | /api/visitor/profile |
| PUT | /api/visitor/profile |
| POST | /api/visitor/profile/photo |
| GET | /api/visitor/documents |
| POST | /api/visitor/documents |
| POST | /api/visitor/documents/submit-to-host |
| PUT | /api/visitor/documents/:id |
| DELETE | /api/visitor/documents/:id |
| GET | /api/visitor/appointments |
| GET | /api/visitor/appointments/:id |
| POST | /api/visitor/appointments |
| PATCH | /api/visitor/appointments/:id/cancel |
| DELETE | /api/visitor/appointments/:id |
| PATCH | /api/visitor/appointments/:id/reschedule |
| GET | /api/visitor/passes |
| GET | /api/visitor/passes/:id/qr |
| GET | /api/visitor/history |
| GET | /api/visitor/notifications |
| PATCH | /api/visitor/notifications/:id/read |
| PATCH | /api/visitor/notifications/read-all |
| POST | /api/visitor/feedback |
| GET | /api/visitor/feedback |
| POST | /api/visitor/support |
| GET | /api/visitor/support |
| GET | /api/visitor/settings |
| PUT | /api/visitor/settings |

## Visitor Registration (11 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| POST | /api/visitors/registration/register |
| POST | /api/visitors/registration/validate |
| POST | /api/visitors/registration/save-draft |
| GET | /api/visitors/registration/drafts |
| GET | /api/visitors/registration/draft/:draftId |
| POST | /api/visitors/registration/upload-photo |
| POST | /api/visitors/registration/upload-document |
| GET | /api/visitors/registration/history |
| GET | /api/visitors/registration |
| GET | /api/visitors/registration/:id |
| PUT | /api/visitors/registration/:id |

## Reception (17 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/reception/dashboard |
| GET | /api/reception/arrivals |
| POST | /api/reception/arrivals/:id/confirm |
| POST | /api/reception/arrivals/:id/cancel |
| POST | /api/reception/verify-appointment |
| POST | /api/reception/face-match |
| POST | /api/reception/walk-ins |
| GET | /api/reception/queue |
| PUT | /api/reception/queue/:id |
| POST | /api/reception/passes/generate |
| POST | /api/reception/notifications/send |
| GET | /api/reception/waiting-area |
| GET | /api/reception/search |
| GET | /api/reception/reports |
| GET | /api/reception/activity-logs |
| GET | /api/reception/profile |
| PUT | /api/reception/profile |

## Reporting Exports (1 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/exports/ping |

## Identity (6 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| POST | /api/identity/forgot-password |
| POST | /api/identity/reset-password |
| GET | /api/identity/resources |
| GET | /api/identity/profile |
| POST | /api/identity/first-login-change |
| POST | /api/identity/unlock-account |

## Dashboard (6 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/dashboard |
| GET | /api/dashboard/stats |
| GET | /api/dashboard/activities |
| GET | /api/dashboard/layout |
| POST | /api/dashboard/layout |
| GET | /api/dashboard/search |

## Resources (1 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/resources/my-resources |

## Permissions (18 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/permissions/statistics |
| GET | /api/permissions/matrix |
| POST | /api/permissions/matrix |
| GET | /api/permissions/groups |
| GET | /api/permissions/templates |
| POST | /api/permissions/authorize-test |
| POST | /api/permissions/import |
| GET | /api/permissions/export |
| GET | /api/permissions/my-permissions |
| GET | /api/permissions |
| POST | /api/permissions |
| GET | /api/permissions/:permissionId |
| PATCH | /api/permissions/:permissionId |
| POST | /api/permissions/:permissionId/activate |
| POST | /api/permissions/:permissionId/deactivate |
| POST | /api/permissions/:permissionId/archive |
| POST | /api/permissions/:permissionId/restore |
| POST | /api/permissions/:permissionId/clone |

## Hierarchy (8 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/hierarchy |
| GET | /api/hierarchy/tree |
| GET | /api/hierarchy/search |
| GET | /api/hierarchy/validate |
| GET | /api/hierarchy/statistics |
| GET | /api/hierarchy/:id |
| POST | /api/hierarchy/assign |
| PUT | /api/hierarchy/assign/:id |

## Settings (11 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/settings |
| GET | /api/settings/export |
| POST | /api/settings/import |
| GET | /api/settings/history |
| GET | /api/settings/validation |
| GET | /api/settings/backups |
| POST | /api/settings/backups |
| POST | /api/settings/restore |
| DELETE | /api/settings/backups/:id |
| GET | /api/settings/:category |
| PUT | /api/settings/:category |

## Visitor Profiles (16 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/visitor-profiles/stats |
| GET | /api/visitor-profiles |
| GET | /api/visitor-profiles/:id |
| GET | /api/visitor-profiles/:id/pass |
| PUT | /api/visitor-profiles/:id |
| PATCH | /api/visitor-profiles/:id/status |
| POST | /api/visitor-profiles/:id/archive |
| POST | /api/visitor-profiles/:id/restore |
| POST | /api/visitor-profiles/:id/photos |
| PATCH | /api/visitor-profiles/:id/photos/:photoId/active |
| DELETE | /api/visitor-profiles/photos/:photoId |
| POST | /api/visitor-profiles/:id/notes |
| DELETE | /api/visitor-profiles/notes/:noteId |
| PATCH | /api/visitor-profiles/:id/verify-identity |
| PATCH | /api/visitor-profiles/:id/blacklist |
| DELETE | /api/visitor-profiles/:id |

## Identity Verification (15 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/identity-verification/mobile-status/:token |
| POST | /api/identity-verification/start |
| POST | /api/identity-verification/:id/mobile-session |
| POST | /api/identity-verification/:id/upload-front |
| POST | /api/identity-verification/:id/upload-back |
| POST | /api/identity-verification/:id/upload-selfie |
| POST | /api/identity-verification/:id/analyze-document |
| POST | /api/identity-verification/:id/run-ocr |
| POST | /api/identity-verification/:id/run-liveness |
| POST | /api/identity-verification/:id/run-facematch |
| POST | /api/identity-verification/:id/validate-security |
| POST | /api/identity-verification/:id/complete |
| GET | /api/identity-verification/:id/report |
| GET | /api/identity-verification/history/:visitorId |
| GET | /api/identity-verification/:id |

## Documents (21 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/documents/dashboard |
| GET | /api/documents/categories |
| POST | /api/documents/categories |
| GET | /api/documents/statuses |
| POST | /api/documents/ocr-extract |
| POST | /api/documents/bulk-upload |
| GET | /api/documents |
| GET | /api/documents/:id |
| POST | /api/documents |
| PUT | /api/documents/:id |
| POST | /api/documents/:id/replace |
| GET | /api/documents/:id/download |
| GET | /api/documents/:id/view |
| GET | /api/documents/:id/preview |
| POST | /api/documents/:id/verify |
| POST | /api/documents/:id/approve |
| POST | /api/documents/:id/restore-version/:versionNumber |
| PATCH | /api/documents/:id/status |
| PATCH | /api/documents/:id/archive |
| PATCH | /api/documents/:id/restore |
| DELETE | /api/documents/:id |

## Visitor Categories (9 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/visitor-categories/stats |
| GET | /api/visitor-categories/by-code/:code |
| GET | /api/visitor-categories |
| GET | /api/visitor-categories/:id |
| POST | /api/visitor-categories |
| PUT | /api/visitor-categories/:id |
| PATCH | /api/visitor-categories/:id/archive |
| PATCH | /api/visitor-categories/:id/restore |
| DELETE | /api/visitor-categories/:id |

## Visitor History (5 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/visitor-history/stats |
| GET | /api/visitor-history |
| GET | /api/visitor-history/:id |
| PUT | /api/visitor-history/:id |
| DELETE | /api/visitor-history/:id |

## Workflows & Approvals (14 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/workflows |
| GET | /api/workflows/dashboard-stats |
| GET | /api/workflows/delegations |
| POST | /api/workflows/delegations |
| POST | /api/workflows/determine |
| POST | /api/workflows/simulate |
| GET | /api/workflows/:id |
| POST | /api/workflows |
| PUT | /api/workflows/:id |
| POST | /api/workflows/:id/clone |
| PATCH | /api/workflows/:id/status |
| DELETE | /api/workflows/:id |
| GET | /api/workflows/:id/versions |
| GET | /api/workflows/:id/audit-logs |

## Watchlist & Blacklist (9 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/security/blacklist-watchlist |
| GET | /api/security/blacklist-watchlist/:id |
| POST | /api/security/blacklist-watchlist |
| PUT | /api/security/blacklist-watchlist/:id |
| POST | /api/security/blacklist-watchlist/verify |
| PATCH | /api/security/blacklist-watchlist/:id/status |
| POST | /api/security/blacklist-watchlist/:id/clearance |
| PATCH | /api/security/blacklist-watchlist/:id/archive |
| PATCH | /api/security/blacklist-watchlist/:id/restore |

## Feedback & Support (11 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| POST | /api/feedback-support/feedback |
| GET | /api/feedback-support/feedback |
| GET | /api/feedback-support/feedback/stats |
| POST | /api/feedback-support/feedback/:id/accept |
| PATCH | /api/feedback-support/feedback/:id/status |
| POST | /api/feedback-support/tickets |
| GET | /api/feedback-support/tickets |
| GET | /api/feedback-support/tickets/stats |
| GET | /api/feedback-support/tickets/:id |
| POST | /api/feedback-support/tickets/:id/messages |
| PATCH | /api/feedback-support/tickets/:id/status |

## Workflow Rules Engine (39 endpoints)

| Method | Endpoint Path |
| :--- | :--- |
| GET | /api/rules/schedules |
| GET | /api/rules/escalations |
| GET | /api/rules/reminders |
| GET | /api/rules/retries |
| GET | /api/rules/approvals |
| GET | /api/rules/organization |
| GET | /api/rules/roles |
| GET | /api/rules/user-groups |
| GET | /api/rules/visitor |
| GET | /api/rules/employee |
| GET | /api/rules/appointment |
| GET | /api/rules/reception |
| GET | /api/rules/security |
| GET | /api/rules/visitor-pass |
| GET | /api/rules/checkin |
| GET | /api/rules/checkout |
| GET | /api/rules/emergency |
| GET | /api/rules/system |
| POST | /api/rules/test |
| POST | /api/rules/simulate |
| GET | /api/rules/versions |
| POST | /api/rules/versions |
| POST | /api/rules/rollback |
| POST | /api/rules/import |
| GET | /api/rules/export |
| GET | /api/rules/audit |
| GET | /api/rules/analytics |
| GET | /api/rules/performance |
| GET | /api/rules/dependencies |
| GET | /api/rules/conflicts |
| GET | /api/rules/executions |
| GET | /api/rules/templates |
| POST | /api/rules/templates |
| POST | /api/rules/api-trigger |
| POST | /api/rules/webhook |
| GET | /api/rules/jobs |
| POST | /api/rules/publish |
| POST | /api/rules/archive |
| GET | /api/rules/production-status |

