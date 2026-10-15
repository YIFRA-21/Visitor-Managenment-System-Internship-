const departmentRepository = require('../repositories/department.repository');

class DepartmentSearchService {
  async searchDepartments({ name, code, organizationId, branchId, type, status }, page = 1, limit = 10, sortBy = 'departmentName', sortOrder = 'ASC') {
    let all = await departmentRepository.findAll();

    // In-memory filtration
    if (name && name.trim()) {
      const q = name.trim().toLowerCase();
      all = all.filter(d => d.departmentName.toLowerCase().includes(q) || d.departmentCode.toLowerCase().includes(q));
    }
    if (code && code.trim()) {
      all = all.filter(d => d.departmentCode.toLowerCase().includes(code.trim().toLowerCase()));
    }
    if (organizationId) {
      all = all.filter(d => d.organizationId === Number(organizationId));
    }
    if (branchId) {
      all = all.filter(d => d.branchId === Number(branchId));
    }
    if (type && type.trim() && type.toUpperCase() !== 'ALL') {
      all = all.filter(d => d.departmentType.toUpperCase() === type.trim().toUpperCase());
    }
    if (status && status.trim() && status.toUpperCase() !== 'ALL') {
      all = all.filter(d => d.status.toUpperCase() === status.trim().toUpperCase());
    }

    // Sort
    all.sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder.toUpperCase() === 'DESC' ? 1 : -1;
      if (valA > valB) return sortOrder.toUpperCase() === 'DESC' ? -1 : 1;
      return 0;
    });

    const totalCount = all.length;
    const p = Math.max(1, Number(page));
    const l = Math.max(1, Number(limit));
    const start = (p - 1) * l;
    const paginated = all.slice(start, start + l);

    return {
      data: paginated,
      pagination: {
        page: p,
        limit: l,
        totalCount,
        totalPages: Math.ceil(totalCount / l),
      },
    };
  }

  async isCodeTaken(code, excludeId = null) {
    const existing = await departmentRepository.findByCode(code);
    if (!existing) return false;
    if (excludeId && existing.id === Number(excludeId)) return false;
    return true;
  }
}

module.exports = new DepartmentSearchService();
