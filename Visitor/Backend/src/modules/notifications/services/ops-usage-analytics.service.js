// src/services/admin/ops/UsageAnalyticsService.js
// Notification Usage Dashboard & Comprehensive Operations Analytics

async function getUsageMetrics() {
  return {
    todayCount: 3450,
    thisWeekCount: 24500,
    thisMonthCount: 104200,
    totalNotifications: 128450,
    deliverySuccessRatePct: 98.4,
    deliveryFailureRatePct: 1.6,
    avgDeliveryTimeMs: 420,
    avgReadTimeMs: 14500,
    queueThroughputPerSec: 42,
    costByChannelUsd: {
      email: 25.10,
      sms: 117.40,
      in_app: 0,
      browser: 0,
      desktop: 0
    },
    channelUsagePct: {
      in_app: 45,
      email: 35,
      sms: 15,
      browser: 3,
      desktop: 2
    },
    topTemplates: [
      { name: 'Standard Visitor Arrival Notice', usageCount: 45200 },
      { name: 'Host Check-in Confirmation', usageCount: 38100 },
      { name: 'VIP Escort Security Alert', usageCount: 14200 },
      { name: 'Appointment Reminder SMS', usageCount: 9800 }
    ],
    departmentUsage: [
      { name: 'Security & Operations', count: 52400 },
      { name: 'Reception & Visitors', count: 48200 },
      { name: 'Human Resources', count: 15400 },
      { name: 'Executive Suite', count: 12450 }
    ]
  };
}

module.exports = {
  getUsageMetrics
};
