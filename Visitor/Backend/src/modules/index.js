const authentication = require('./authentication');
const userManagement = require('./user-management');
const roleManagement = require('./role-management');
const permissionManagement = require('./permission-management');
const organizationManagement = require('./organization-management');
const visitorManagement = require('./visitor-management');
const appointmentManagement = require('./appointment-management');
const approvalWorkflow = require('./approval-workflow');
const calendarScheduling = require('./calendar-scheduling');
const checkInOut = require('./check-in-out');
const reception = require('./reception');
const securityAccess = require('./security-access');
const blacklistWatchlist = require('./blacklist-watchlist');
const notifications = require('./notifications');
const reportingAnalytics = require('./reporting-analytics');
const dashboards = require('./dashboards');
const auditLog = require('./audit-log');
const employeeManagement = require('./employee-management');
const departmentManagement = require('./department-management');
const buildingRoom = require('./building-room');
const documentManagement = require('./document-management');
const visitorHistory = require('./visitor-history');
const systemAdmin = require('./system-admin');

module.exports = {
  authentication,
  userManagement,
  roleManagement,
  permissionManagement,
  organizationManagement,
  visitorManagement,
  appointmentManagement,
  approvalWorkflow,
  calendarScheduling,
  checkInOut,
  reception,
  securityAccess,
  blacklistWatchlist,
  notifications,
  reportingAnalytics,
  dashboards,
  auditLog,
  employeeManagement,
  departmentManagement,
  buildingRoom,
  documentManagement,
  visitorHistory,
  systemAdmin,
};
