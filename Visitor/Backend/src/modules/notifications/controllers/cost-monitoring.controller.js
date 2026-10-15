// src/controllers/admin/CostMonitoringController.js
async function getCostMetrics(req, res) {
  try {
    res.json({
      success: true,
      data: {
        currentMonthCostUsd: 142.50,
        emailCostUsd: 25.10,
        smsCostUsd: 117.40,
        emailCount: 25000,
        smsCount: 1560,
        monthlyQuotaUsd: 500.00,
        departmentBreakdown: [
          { department: 'Security', costUsd: 65.20 },
          { department: 'Reception', costUsd: 42.10 },
          { department: 'Executive', costUsd: 35.20 }
        ]
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}
module.exports = { getCostMetrics };
