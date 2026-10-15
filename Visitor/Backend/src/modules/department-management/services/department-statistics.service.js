const departmentRepository = require('../repositories/department.repository');

class DepartmentStatisticsService {
  async getOverview() {
    const all = await departmentRepository.findAll();

    const totalDepartments = all.length;
    const activeDepartments = all.filter(d => d.status === 'ACTIVE').length;
    const inactiveDepartments = all.filter(d => d.status === 'INACTIVE').length;

    // Group by type
    const departmentsByType = {};
    all.forEach(d => {
      const t = d.departmentType || 'OTHER';
      departmentsByType[t] = (departmentsByType[t] || 0) + 1;
    });

    // Group by branch
    const departmentsByBranch = {};
    all.forEach(d => {
      const b = d.branchName || 'Unknown';
      departmentsByBranch[b] = (departmentsByBranch[b] || 0) + 1;
    });

    // Group by organization
    const departmentsByOrganization = {};
    all.forEach(d => {
      const o = d.organizationName || 'Unknown';
      departmentsByOrganization[o] = (departmentsByOrganization[o] || 0) + 1;
    });

    // Placeholder metrics for future modules
    const totalEmployees = 415;
    const visitorsToday = 47;
    const appointmentsToday = 23;

    return {
      totalDepartments,
      activeDepartments,
      inactiveDepartments,
      totalEmployees,
      visitorsToday,
      appointmentsToday,
      departmentsByType,
      departmentsByBranch,
      departmentsByOrganization,
      avgDepartmentsPerBranch: Object.keys(departmentsByBranch).length > 0
        ? (totalDepartments / Object.keys(departmentsByBranch).length).toFixed(1)
        : 0,
    };
  }
}

module.exports = new DepartmentStatisticsService();
