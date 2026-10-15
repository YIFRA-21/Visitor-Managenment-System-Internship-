// src/repositories/ManagerAnalyticsRepository.js
// Analytics Repository for Manager Dashboard & Department Performance Metrics

class ManagerAnalyticsRepository {
  async getDashboardAnalytics(scope) {
    return {
      departmentId: scope.departmentId,
      departmentName: scope.departmentName,
      kpis: {
        unreadNotifications: 4,
        pendingApprovals: 2,
        todaysVisitors: 18,
        todaysAppointments: 14,
        emergencyAlerts: 1,
        escalatedItems: 1,
        upcomingMeetings: 5,
        expiringPasses: 3,
        overdueApprovals: 1,
        departmentActivityScore: 94
      },
      readRatePct: 92.5,
      avgApprovalTimeMinutes: 18.4,
      responseRatePct: 98.1,
      notificationsByPriority: {
        critical: 2,
        high: 3,
        medium: 5,
        normal: 10
      },
      visitorStatusBreakdown: {
        checkedIn: 12,
        checkedOut: 4,
        pendingArrival: 2,
        blacklistedAlerts: 0
      },
      approvalTimeTrend: [
        { day: 'Mon', avgMinutes: 24 },
        { day: 'Tue', avgMinutes: 19 },
        { day: 'Wed', avgMinutes: 15 },
        { day: 'Thu', avgMinutes: 18 },
        { day: 'Fri', avgMinutes: 12 }
      ],
      recentActivityTimeline: [
        { time: '10 mins ago', title: 'Security Incident Alert', description: 'Badge Scanner Tamper Alert acknowledged by Manager.' },
        { time: '15 mins ago', title: 'New VIP Visitor Registered', description: 'Sarah Jenkins registered for David Miller.' },
        { time: '45 mins ago', title: 'Approval Request Received', description: 'After-Hours Access Request #appr_9021 submitted.' },
        { time: '2 hours ago', title: 'Visitor Checked Out', description: 'Contractor John Vance checked out at Main Gate.' }
      ]
    };
  }
}

module.exports = new ManagerAnalyticsRepository();
