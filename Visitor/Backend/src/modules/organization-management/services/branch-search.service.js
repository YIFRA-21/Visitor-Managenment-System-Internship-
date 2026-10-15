const branchRepository = require('../repositories/branch.repository');

class BranchSearchService {
  async searchBranches({ name, code, organizationId, city, country, status, type }, page = 1, limit = 10, sortBy = 'branchName', sortOrder = 'ASC') {
    let all = await branchRepository.findAll();

    // In-memory filtration
    if (name && name.trim()) {
      all = all.filter(b => b.branchName.toLowerCase().includes(name.trim().toLowerCase()));
    }
    if (code && code.trim()) {
      all = all.filter(b => b.branchCode.toLowerCase().includes(code.trim().toLowerCase()));
    }
    if (organizationId) {
      all = all.filter(b => b.organizationId === Number(organizationId));
    }
    if (city && city.trim()) {
      all = all.filter(b => b.city.toLowerCase().includes(city.trim().toLowerCase()));
    }
    if (country && country.trim()) {
      all = all.filter(b => b.country.toLowerCase().includes(country.trim().toLowerCase()));
    }
    if (status && status.trim() && status.toUpperCase() !== 'ALL') {
      all = all.filter(b => b.status.toUpperCase() === status.trim().toUpperCase());
    }
    if (type && type.trim() && type.toUpperCase() !== 'ALL') {
      all = all.filter(b => b.branchType.toUpperCase() === type.trim().toUpperCase());
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
        totalPages: Math.ceil(totalCount / l)
      }
    };
  }

  async isCodeTaken(code, excludeId = null) {
    const existing = await branchRepository.findByCode(code);
    if (!existing) return false;
    if (excludeId && existing.id === Number(excludeId)) return false;
    return true;
  }
}

module.exports = new BranchSearchService();
