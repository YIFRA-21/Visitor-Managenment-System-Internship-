const branchRepository = require('../repositories/branch.repository');

class BranchStatisticsService {
  async getBranchStatistics() {
    const branches = await branchRepository.findAll();

    const total = branches.length;
    const active = branches.filter(b => b.status === 'ACTIVE').length;
    const inactive = branches.filter(b => b.status === 'INACTIVE').length;

    // Organization distribution
    const distributionMap = {};
    for (const b of branches) {
      const orgName = b.organizationName || 'Other';
      distributionMap[orgName] = (distributionMap[orgName] || 0) + 1;
    }
    const distribution = Object.entries(distributionMap).map(([name, value]) => ({
      name,
      value
    }));

    // Monthly Growth (Mock dataset)
    const growth = [
      { month: 'Jan', branches: 1 },
      { month: 'Feb', branches: 1 },
      { month: 'Mar', branches: 2 },
      { month: 'Apr', branches: 2 },
      { month: 'May', branches: 3 },
      { month: 'Jun', branches: 3 },
      { month: 'Jul', branches: total }
    ];

    return {
      summary: {
        totalBranches: total,
        activeBranches: active,
        inactiveBranches: inactive,
        departmentsCount: 18, // placeholder
        employeesCount: 154,  // placeholder
        todayVisitors: 28,     // placeholder
      },
      distribution,
      growth,
    };
  }
}

module.exports = new BranchStatisticsService();
